import './style.css';
import { startBgm, stopBgm } from './audio/bgm.ts';
import { duckBgm, installUnlock, onUnlock, setBgmEnabled, setSfxEnabled } from './audio/engine.ts';
import { playSfx, type SfxName } from './audio/sfx.ts';
import { isCleared, parseGrid, step, type Board, type Direction } from './game/index.ts';
import { bindKeyboard } from './input/keyboard.ts';
import { bindSwipe } from './input/swipe.ts';
import { detectTiltSupport, isNaturalOrientation, TiltControl, tiltNeedsPermission } from './input/tilt.ts';
import { BoardView, reduceMotion } from './render/boardView.ts';
import { Celebrate } from './render/celebrate.ts';
import { Particles } from './render/particles.ts';
import { isStuck } from './solver/solver.ts';
import { STAGES } from './stages/index.ts';
import { loadMedals, medalFor, recordMedal, type Medal } from './storage/medals.ts';
import { loadSettings, saveSettings } from './storage/settings.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const MEDAL_LABEL: Record<Medal, string> = { gold: '金', silver: '銀', bronze: '銅' };
const FANFARE: Record<Medal, SfxName> = { gold: 'fanfareGold', silver: 'fanfareSilver', bronze: 'fanfareBronze' };
const FANFARE_SEC: Record<Medal, number> = { gold: 2.4, silver: 1.2, bronze: 0.8 };
// 消えるときの星の色（モチーフの色）
const BURST_COLOR: Record<string, string> = { R: '#ff4d5e', B: '#62b1ff', G: '#3fd473', Y: '#ffd23f', P: '#c25ef0' };

// ===== 状態 =====
let stageIdx = 0;
let board: Board;
let moves = 0;
let state: 'play' | 'stuck' | 'clear' = 'play';
let busy = false; // 演出中は入力を受け付けない
let medals = loadMedals();

const view = new BoardView($('board'), $('cells'), $('layer'));
const fx = new Particles($<HTMLCanvasElement>('fx'), !reduceMotion); // 動きを減らす設定ではパーティクルを出さない
const celebrate = new Celebrate($('clear'), fx);

// ===== 描画 =====
function renderStages() {
  const nav = $('stages');
  nav.innerHTML = '';
  STAGES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-current', i === stageIdx ? 'true' : 'false');
    const m = medals[s.id];
    b.innerHTML = `<span>${i + 1}</span><span class="m ${m || ''}">${m ? MEDAL_LABEL[m] : '－'}</span>`;
    b.addEventListener('click', () => { if (!busy) loadStage(i); });
    nav.appendChild(b);
  });
}

function updateStatus() {
  const s = STAGES[stageIdx];
  $('stageName').textContent = `${stageIdx + 1}. ${s.name}`;
  $('moves').textContent = String(moves);
  $('par').textContent = String(s.par);
  $('stuck').hidden = state !== 'stuck';
  $('clear').hidden = state !== 'clear';
}

function loadStage(i: number) {
  stageIdx = i;
  board = parseGrid(STAGES[i].grid);
  moves = 0;
  state = 'play';
  busy = false;
  fx.clear();
  view.build(board);
  renderStages();
  updateStatus();
}

// ===== 1手 =====
/** 1手を試みる。受け付けたら true を返し、演出は非同期で進める */
function tryMove(dir: Direction): boolean {
  if (state !== 'play' || busy) return false;
  busy = true;
  const r = step(board, dir);
  if (!r) {
    view.bump(dir).then(() => { busy = false; });
    return true;
  }
  moves++;
  updateStatus();
  view.play(r, dir).then(() => {
    board = r.next;
    busy = false;
    if (isCleared(board)) { state = 'clear'; finishClear(); }
    else if (isStuck(board)) { state = 'stuck'; playSfx('stuck'); }
    updateStatus();
  });
  return true;
}

function finishClear() {
  const s = STAGES[stageIdx];
  const medal = medalFor(moves, s.par, s.silverMargin);
  medals = recordMedal(s.id, medal);
  playSfx(FANFARE[medal]);
  duckBgm(FANFARE_SEC[medal]);
  celebrate.show({ medal, moves, par: s.par, hasNext: stageIdx < STAGES.length - 1 });
  renderStages();
}

// ===== 入力 =====
const resetIfIdle = () => { if (!busy) loadStage(stageIdx); };
document.querySelectorAll<HTMLButtonElement>('.controls button').forEach((b) =>
  b.addEventListener('click', () => tryMove(b.dataset.dir as Direction)));
$('resetBtn').addEventListener('click', resetIfIdle);
$('stuckReset').addEventListener('click', () => loadStage(stageIdx));
$('nextBtn').addEventListener('click', () => loadStage(Math.min(stageIdx + 1, STAGES.length - 1)));
$('retryBtn').addEventListener('click', () => loadStage(stageIdx));
bindKeyboard(tryMove, resetIfIdle);
bindSwipe(view.el, tryMove);

// ===== 端末の傾き操作 =====
const tiltBtn = $<HTMLButtonElement>('tiltBtn');
const levelBtn = $<HTMLButtonElement>('levelBtn');
const tiltNote = $('tiltNote');
let settings = loadSettings();

const tilt = new TiltControl({
  onMove: tryMove,
  onAngle: (a) => view.setLiveTilt(a),
  onOrientationChange: (natural) => showTiltNote(natural ? '' : '画面の向きを元に戻すと傾き操作が使えます（回転ロックがおすすめです）'),
});

function showTiltNote(text: string) {
  tiltNote.textContent = text;
  tiltNote.hidden = !text;
}

function renderTiltButtons(on: boolean) {
  tiltBtn.textContent = `傾き操作：${on ? 'オン' : 'オフ'}`;
  tiltBtn.setAttribute('aria-pressed', String(on));
  levelBtn.hidden = !on;
}

async function setTilt(on: boolean) {
  if (on && !(await tilt.enable())) {
    showTiltNote('傾きセンサーの使用が許可されませんでした');
    on = false;
  }
  if (!on) tilt.disable();
  settings = saveSettings({ tilt: on });
  renderTiltButtons(on);
  if (on) {
    showTiltNote(isNaturalOrientation() ? '' : '画面の向きを元に戻すと傾き操作が使えます（回転ロックがおすすめです）');
    if (!settings.tiltGuideSeen) $('tiltGuide').hidden = false; // 回転ロックの案内は最初に一度だけ
  }
}

tiltBtn.addEventListener('click', () => setTilt(tiltBtn.getAttribute('aria-pressed') !== 'true'));
levelBtn.addEventListener('click', () => tilt.level());
$('tiltGuideOk').addEventListener('click', () => {
  $('tiltGuide').hidden = true;
  settings = saveSettings({ tiltGuideSeen: true });
});

detectTiltSupport(() => {
  $('tiltRow').hidden = false;
  renderTiltButtons(false);
  if (!settings.tilt) return;
  if (!tiltNeedsPermission()) { setTilt(true); return; }
  // iOS は許可の確認にユーザー操作が要るので、最初のタップで再開する
  const resume = (e: PointerEvent) => {
    document.removeEventListener('pointerup', resume);
    if (e.target !== tiltBtn) setTilt(true);
  };
  document.addEventListener('pointerup', resume);
});

// ===== サウンド =====
view.hooks = {
  onBump: () => playSfx('bump'),
  onTilt: () => playSfx('tilt'),
  onLand: () => playSfx('land'),
  onPop: (groups) => {
    playSfx('pop', groups.length);
    // ふくらみきった頃（pop アニメーションの 40%）に星をはじけさせる
    const boxes = groups.flat().map((p) => view.boxInfo(p)).filter((b) => b !== null);
    setTimeout(() => { for (const b of boxes) fx.burst(b.x, b.y, BURST_COLOR[b.color] ?? '#ffd23f'); }, 130);
  },
};

function renderSoundButtons() {
  $('bgmBtn').setAttribute('aria-pressed', String(settings.bgm));
  $('sfxBtn').setAttribute('aria-pressed', String(settings.sfx));
}

function setBgm(on: boolean) {
  settings = saveSettings({ bgm: on });
  setBgmEnabled(on);
  if (on) startBgm(); else stopBgm(); // オフの間はシーケンサーも止める
  renderSoundButtons();
}

$('bgmBtn').addEventListener('click', () => setBgm(!settings.bgm));
$('sfxBtn').addEventListener('click', () => {
  settings = saveSettings({ sfx: !settings.sfx });
  setSfxEnabled(settings.sfx);
  renderSoundButtons();
});
setBgmEnabled(settings.bgm);
setSfxEnabled(settings.sfx);
renderSoundButtons();
installUnlock(); // 最初のタップ／キー操作で音を開始する
onUnlock(() => { if (settings.bgm) startBgm(); });

loadStage(0);

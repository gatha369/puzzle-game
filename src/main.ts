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
import { HintView } from './render/hint.ts';
import { motifSvg, honeySvg } from './render/motifs.ts';
import { CANDY_COLORS, Particles } from './render/particles.ts';
import { isStuck, nextHint } from './solver/solver.ts';
import { STAGES, type Intro } from './stages/index.ts';
import { loadMedals, medalFor, recordMedal, type Medal } from './storage/medals.ts';
import { loadSettings, saveSettings } from './storage/settings.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const MEDAL_LABEL: Record<Medal, string> = { gold: '金', silver: '銀', bronze: '銅' };
const FANFARE: Record<Medal, SfxName> = { gold: 'fanfareGold', silver: 'fanfareSilver', bronze: 'fanfareBronze' };
const FANFARE_SEC: Record<Medal, number> = { gold: 2.4, silver: 1.2, bronze: 0.8 };
// 消えるときの星の色（モチーフの色）
const BURST_COLOR: Record<string, string | readonly string[]> = {
  R: '#ff4d5e', B: '#62b1ff', G: '#3fd473', Y: '#ffd23f', P: '#c25ef0', '*': CANDY_COLORS,
};
// 新アイテムの初登場ステージで、最初の1手まで出す紹介
const INTROS: Record<Intro, { icons: string; title: string; text: string }> = {
  rainbow: {
    icons: motifSvg('*'),
    title: '新アイテム：レインボーキャンディ',
    text: '虹色のキャンディはどのお菓子とも揃います。隣り合うお菓子の仲間として数えられ、一緒に消えます。足りない1個を補う切り札です。',
  },
  honey: {
    icons: `<span class="honey-chip">${honeySvg()}</span>`,
    title: '新しい床：はちみつ床',
    text: 'はちみつ床に滑り込んだお菓子は、そこでぴたっと止まります。乗っているお菓子は次に傾けると離れられます。',
  },
  both: {
    icons: motifSvg('*') + `<span class="honey-chip">${honeySvg()}</span>`,
    title: 'ここからは両方',
    text: 'レインボーキャンディとはちみつ床がいっしょに出てきます。どこで止めて、どこで虹を使うかが勝負です。',
  },
};

// ===== 状態 =====
let stageIdx = 0;
let board: Board;
let moves = 0;
let state: 'play' | 'stuck' | 'clear' = 'play';
let busy = false; // 演出中は入力を受け付けない
let hintsUsed = 0;
let medals = loadMedals();

const view = new BoardView($('board'), $('cells'), $('layer'));
const fx = new Particles($<HTMLCanvasElement>('fx'), !reduceMotion); // 動きを減らす設定ではパーティクルを出さない
const celebrate = new Celebrate($('clear'), fx);
const hint = new HintView($('hintArrow'), document.querySelector<HTMLElement>('.controls')!);

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
  // 32面は1列に収まらないので横にスクロールし、今のステージを真ん中に寄せる
  const cur = nav.children[stageIdx] as HTMLElement;
  nav.scrollTo({ left: cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function updateStatus() {
  const s = STAGES[stageIdx];
  $('stageName').textContent = `${stageIdx + 1}. ${s.name}`;
  $('moves').textContent = String(moves);
  $('par').textContent = String(s.par);
  $('hintCount').textContent = String(hintsUsed);
  $('hintCountWrap').hidden = hintsUsed === 0;
  $<HTMLButtonElement>('hintBtn').disabled = state !== 'play';
  $('stuck').hidden = state !== 'stuck';
  $('clear').hidden = state !== 'clear';
  // 紹介のあるステージは場所を取ったままにし、1手目で消す（盤の大きさが途中で変わらないように）
  const intro = s.intro ? INTROS[s.intro] : null;
  document.querySelector('.wrap')!.classList.toggle('has-intro', !!intro);
  $('intro').hidden = !intro;
  $('intro').classList.toggle('done', state !== 'play' || moves > 0);
  if (intro) {
    $('introIcons').innerHTML = intro.icons;
    $('introTitle').textContent = intro.title;
    $('introText').textContent = intro.text;
  }
}

function loadStage(i: number) {
  stageIdx = i;
  board = parseGrid(STAGES[i].grid, STAGES[i].floor);
  moves = 0;
  state = 'play';
  busy = false;
  hintsUsed = 0;
  hint.clear();
  fx.clear();
  view.build(board);
  renderStages();
  updateStatus();
}

// ===== 1手 =====
/** 1手を試みる。受け付けたら true を返し、演出は非同期で進める */
function tryMove(dir: Direction): boolean {
  if (state !== 'play' || busy) return false;
  hint.clear(); // 次の手を指したらヒントは消す
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

/** ヒント：最短手順の次の1手を矢印で示す。詰んでいるとき（判定不能を含む）は出さない */
function showHint() {
  if (state !== 'play' || busy) return;
  const dir = nextHint(board);
  if (!dir) return;
  hintsUsed++;
  hint.show(dir);
  playSfx('hint');
  updateStatus();
}

function finishClear() {
  const s = STAGES[stageIdx];
  const medal = medalFor(moves, s.par, s.silverMargin, hintsUsed);
  medals = recordMedal(s.id, medal);
  const allClear = stageIdx === STAGES.length - 1 ? allClearInfo() : undefined;
  playSfx(allClear ? 'fanfareAll' : FANFARE[medal]);
  duckBgm(allClear ? 4.8 : FANFARE_SEC[medal]);
  celebrate.show({ medal, moves, par: s.par, hints: hintsUsed, hasNext: stageIdx < STAGES.length - 1, allClear });
  renderStages();
}

/** 最終ステージをクリアしたときの、全ステージのメダル集計 */
function allClearInfo() {
  const tally: Record<Medal, number> = { gold: 0, silver: 0, bronze: 0 };
  let cleared = 0;
  for (const s of STAGES) {
    const m = medals[s.id];
    if (m) { tally[m]++; cleared++; }
  }
  const total = STAGES.length;
  const title = tally.gold === total ? '全ステージ 金賞！ パーフェクト！' : '全ステージクリア！';
  const text = cleared === total
    ? `${total}ステージ制覇おめでとう。金${tally.gold}・銀${tally.silver}・銅${tally.bronze}。`
      + (tally.gold < total ? '金賞が取れていないステージに挑戦してみましょう。' : 'すべてお手本どおりです。')
    : `最終ステージをクリア！ まだクリアしていないステージが${total - cleared}面あります。`;
  return { title, text };
}

// ===== 入力 =====
const resetIfIdle = () => { if (!busy) loadStage(stageIdx); };
document.querySelectorAll<HTMLButtonElement>('.controls button').forEach((b) =>
  b.addEventListener('click', () => tryMove(b.dataset.dir as Direction)));
$('resetBtn').addEventListener('click', resetIfIdle);
$('hintBtn').addEventListener('click', showHint);
$('stuckReset').addEventListener('click', () => loadStage(stageIdx));
$('nextBtn').addEventListener('click', () => loadStage(Math.min(stageIdx + 1, STAGES.length - 1)));
$('retryBtn').addEventListener('click', () => loadStage(stageIdx));
bindKeyboard(tryMove, resetIfIdle, showHint);
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
  onStick: () => playSfx('stick'),
  onPop: (groups) => {
    playSfx('pop', groups.length);
    // ふくらみきった頃（pop アニメーションの 40%）に星をはじけさせる。レインボーは複数の塊に入ることがあるので重複を除く
    const boxes = [...new Set(groups.flat())].map((p) => view.boxInfo(p)).filter((b) => b !== null);
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

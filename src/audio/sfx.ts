// 効果音名 → 再生関数。音源ファイルに差し替えるときは、この表の関数だけを入れ替える
import { audio } from './engine.ts';
import { bell, brass, calliope, freq, noise, organ, tone } from './synth.ts';

type Out = { ctx: AudioContext; dest: AudioNode };
type Sfx = (out: Out, t: number, arg?: number) => void;

let lastLand = -1;
let lastStick = -1;

export const SFX = {
  /** 傾ける：軽い「シュッ」 */
  tilt: (o, t) => noise(o, t, 0.13, { vol: 0.6, from: 700, to: 3800, q: 1.2 }),

  /** ボックスが止まる：小さな「コトッ」。同時に複数止まっても1回だけ */
  land: (o, t) => {
    if (t - lastLand < 0.05) return;
    lastLand = t;
    tone(o, t, 210, 0.07, { type: 'triangle', vol: 0.32, slideTo: 120 });
    noise(o, t, 0.03, { vol: 0.12, type: 'highpass', from: 2500 });
  },

  /** はちみつ床で止まる：粘りのある「ぺたっ」。同時に複数止まっても1回だけ */
  stick: (o, t) => {
    if (t - lastStick < 0.05) return;
    lastStick = t;
    noise(o, t, 0.09, { vol: 0.35, type: 'lowpass', from: 1400, to: 220, q: 6 });
    tone(o, t, 150, 0.16, { type: 'sine', vol: 0.4, slideTo: 62 });
    tone(o, t + 0.07, 330, 0.09, { type: 'triangle', vol: 0.1, slideTo: 260 });
  },

  /** 消える：キラキラ上昇するグロッケン。arg は消えた塊の数（多いほど高く長く） */
  pop: (o, t, groups = 1) => {
    const notes = ['C6', 'E6', 'G6', 'C7', 'E7', 'G7'];
    const n = Math.min(notes.length, 3 + groups);
    notes.slice(0, n).forEach((nt, i) => bell(o, t + i * 0.05, freq(nt), { vol: 0.16, dur: 0.5 }));
  },

  /** 動けない方向：小さな「ぽよん」 */
  bump: (o, t) => {
    tone(o, t, 260, 0.09, { vol: 0.3, slideTo: 480 });
    tone(o, t + 0.09, 480, 0.2, { vol: 0.25, slideTo: 230 });
  },

  /** 詰み：残念な下降音（ワ・ワ・ワ・ワーン） */
  stuck: (o, t) => {
    ['G4', 'F#4', 'F4'].forEach((nt, i) => brass(o, t + i * 0.32, freq(nt), 0.26, 0.1));
    const last = t + 0.96;
    brass(o, last, freq('E4'), 0.9, 0.1);
    tone(o, last, freq('E4') / 2, 0.9, { type: 'triangle', vol: 0.15, slideTo: freq('D4') / 2 });
  },

  /** 金：豪華なファンファーレ */
  fanfareGold: (o, t) => {
    const b = 0.13; // 3連符ひとつ分
    ['G4', 'G4', 'G4'].forEach((nt, i) => brass(o, t + i * b, freq(nt), b * 0.8));
    brass(o, t + 3 * b, freq('C5'), b * 2.6);
    brass(o, t + 6 * b, freq('E5'), b * 0.9);
    brass(o, t + 7 * b, freq('G5'), b * 0.9);
    const s = t + 8 * b;
    for (const nt of ['C5', 'E5', 'G5', 'C6']) brass(o, s, freq(nt), 1.3, 0.09);
    organ(o, s, freq('C3'), 1.4, 0.2);
    ['C6', 'E6', 'G6', 'C7', 'E7', 'G7', 'C8'].forEach((nt, i) => bell(o, s + 0.1 + i * 0.07, freq(nt), { vol: 0.1, dur: 0.8 }));
  },

  /** 全ステージクリア：金のファンファーレに、駆け上がるカリオペとベルの雨を続ける */
  fanfareAll: (o, t) => {
    SFX.fanfareGold(o, t);
    const s = t + 2.3;
    ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((nt, i) => calliope(o, s + i * 0.09, freq(nt), 0.2));
    for (const nt of ['C5', 'E5', 'G5', 'C6']) brass(o, s + 0.65, freq(nt), 1.6, 0.09);
    organ(o, s + 0.65, freq('C3'), 1.7, 0.2);
    ['G7', 'E7', 'C7', 'G6', 'E7', 'C8'].forEach((nt, i) => bell(o, s + 0.75 + i * 0.12, freq(nt), { vol: 0.09, dur: 0.9 }));
  },

  /** 銀：明るいファンファーレ */
  fanfareSilver: (o, t) => {
    ['C5', 'E5', 'G5'].forEach((nt, i) => brass(o, t + i * 0.12, freq(nt), 0.11));
    for (const nt of ['C5', 'E5', 'G5', 'C6']) brass(o, t + 0.36, freq(nt), 0.8, 0.08);
    ['G6', 'C7', 'E7'].forEach((nt, i) => bell(o, t + 0.4 + i * 0.08, freq(nt), { vol: 0.1, dur: 0.6 }));
  },

  /** 銅：短いジングル */
  fanfareBronze: (o, t) => {
    ['E5', 'G5', 'C6'].forEach((nt, i) => bell(o, t + i * 0.1, freq(nt), { vol: 0.2, dur: i === 2 ? 0.7 : 0.3 }));
    organ(o, t + 0.2, freq('C4'), 0.5, 0.12);
  },
} satisfies Record<string, Sfx>;

export type SfxName = keyof typeof SFX;

/** 効果音を鳴らす（音がまだ開始していなければ何もしない） */
export function playSfx(name: SfxName, arg?: number) {
  const a = audio();
  if (!a) return;
  SFX[name]({ ctx: a.ctx, dest: a.sfx }, a.ctx.currentTime + 0.005, arg);
}

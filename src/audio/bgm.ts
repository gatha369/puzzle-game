// BGM のシーケンサー。少し先（LOOKAHEAD 秒）までの音符を定期的に予約していく
import { audio } from './engine.ts';
import { BEATS_PER_BAR, BELL_FROM_BAR, CHORDS, MELODY, TEMPO_BPM } from './song.ts';
import { bell, calliope, freq, organ } from './synth.ts';

const LOOKAHEAD = 0.25; // 秒
const TICK_MS = 60;

let timer: number | null = null;
let bar = 0;
let barTime = 0; // 次に予約する小節の開始時刻

export function scheduleBar(ctx: AudioContext, dest: AudioNode, i: number, t: number) {
  const beat = 60 / TEMPO_BPM;
  const out = { ctx, dest };
  const chord = CHORDS[i];
  organ(out, t, freq(chord.bass), beat * 0.9, 0.2);
  for (const k of [1, 2]) for (const n of chord.tones) organ(out, t + k * beat, freq(n), beat * 0.45, 0.06);
  let at = t;
  for (const [pitch, beats] of MELODY[i]) {
    if (pitch !== 'R') {
      calliope(out, at, freq(pitch), beat * beats * 0.92);
      if (i >= BELL_FROM_BAR) bell(out, at, freq(pitch) * 2, { vol: 0.05, dur: 0.5 });
    }
    at += beat * beats;
  }
}

function tick() {
  const a = audio();
  if (!a) return;
  const barLen = (60 / TEMPO_BPM) * BEATS_PER_BAR;
  if (barTime < a.ctx.currentTime) barTime = a.ctx.currentTime + 0.05; // 裏に回って止まっていた後など
  while (barTime < a.ctx.currentTime + LOOKAHEAD) {
    scheduleBar(a.ctx, a.bgm, bar, barTime);
    bar = (bar + 1) % MELODY.length;
    barTime += barLen;
  }
}

export function startBgm() {
  if (timer !== null || !audio()) return;
  bar = 0;
  barTime = 0;
  tick();
  timer = window.setInterval(tick, TICK_MS);
}

export function stopBgm() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

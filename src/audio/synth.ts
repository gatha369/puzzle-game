// 音色の部品。どれも「いつ・どの高さで・どこへ出すか」を受け取って1音を予約する

/** 音名（C4, F#5, Bb3 など）→ 周波数 */
export function freq(note: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`音名が読めません: ${note}`);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'];
  const semi = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semi - 69) / 12);
}

type Out = { ctx: AudioContext; dest: AudioNode };

/** 音量の形（立ち上がり → 減衰）を付けた GainNode */
function envelope({ ctx, dest }: Out, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest);
  return g;
}

/** 基本の1音 */
export function tone(
  out: Out, t: number, hz: number, dur: number,
  { type = 'sine' as OscillatorType, vol = 0.3, attack = 0.005, slideTo = 0, wave = null as PeriodicWave | null } = {},
) {
  const osc = out.ctx.createOscillator();
  if (wave) osc.setPeriodicWave(wave);
  else osc.type = type;
  osc.frequency.setValueAtTime(hz, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  osc.connect(envelope(out, t, vol, attack, dur));
  osc.start(t);
  osc.stop(t + attack + dur + 0.05);
  return osc;
}

/** グロッケン・ベル系：基音＋金属的な倍音（2.76倍）を短く減衰 */
export function bell(out: Out, t: number, hz: number, { vol = 0.25, dur = 0.6 } = {}) {
  tone(out, t, hz, dur, { vol, attack: 0.002 });
  tone(out, t, hz * 2.76, dur * 0.4, { vol: vol * 0.35, attack: 0.002 });
  tone(out, t, hz * 5.4, dur * 0.15, { vol: vol * 0.12, attack: 0.001 });
}

// 波形のキャッシュ（AudioContext ごとに作る）
const waves = new WeakMap<AudioContext, Record<string, PeriodicWave>>();
function getWave(ctx: AudioContext, name: 'organ' | 'calliope'): PeriodicWave {
  let w = waves.get(ctx);
  if (!w) {
    // 倍音の強さ（1倍音から）。organ はドローバー風、calliope は笛っぽく奇数倍音寄り
    const make = (amps: number[]) => ctx.createPeriodicWave(new Float32Array(amps.length + 1), new Float32Array([0, ...amps]));
    w = { organ: make([1, 0.6, 0.45, 0.3, 0, 0.15, 0, 0.1]), calliope: make([1, 0.12, 0.35, 0.05, 0.12]) };
    waves.set(ctx, w);
  }
  return w[name];
}

/** オルガン（伴奏・和音） */
export function organ(out: Out, t: number, hz: number, dur: number, vol = 0.12) {
  tone(out, t, hz, dur, { wave: getWave(out.ctx, 'organ'), vol, attack: 0.01 });
}

/** 蒸気オルガン（メリーゴーラウンドのメロディ）。少しビブラートを付ける */
export function calliope(out: Out, t: number, hz: number, dur: number, vol = 0.16) {
  const osc = tone(out, t, hz, dur, { wave: getWave(out.ctx, 'calliope'), vol, attack: 0.02 });
  const lfo = out.ctx.createOscillator();
  const depth = out.ctx.createGain();
  lfo.frequency.value = 5.5;
  depth.gain.value = hz * 0.006;
  lfo.connect(depth).connect(osc.frequency);
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
}

/** ラッパ風（ファンファーレ）：のこぎり波をローパスで丸める */
export function brass(out: Out, t: number, hz: number, dur: number, vol = 0.14) {
  const f = out.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(900, t);
  f.frequency.linearRampToValueAtTime(3200, t + 0.06);
  f.frequency.exponentialRampToValueAtTime(1400, t + dur);
  f.connect(out.dest);
  tone({ ctx: out.ctx, dest: f }, t, hz, dur, { type: 'sawtooth', vol, attack: 0.02 });
  tone({ ctx: out.ctx, dest: f }, t, hz * 1.003, dur, { type: 'sawtooth', vol: vol * 0.6, attack: 0.02 });
}

let noiseBuf: AudioBuffer | null = null;
/** ホワイトノイズをフィルタに通して鳴らす（シュッ、コトッの芯など） */
export function noise(
  out: Out, t: number, dur: number,
  { vol = 0.3, type = 'bandpass' as BiquadFilterType, from = 1000, to = 0, q = 1 } = {},
) {
  const { ctx } = out;
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  src.connect(f).connect(envelope(out, t, vol, 0.008, dur));
  src.start(t);
  src.stop(t + dur + 0.05);
}

// Web Audio の土台。BGM と効果音は別々の音量つまみ（GainNode）を通してまとめて出す
//   BGM ─→ bgmBus ─┐
//   効果音 → sfxBus ─┴→ compressor → スピーカー

let ctx: AudioContext | null = null;
let bgmBus: GainNode;
let sfxBus: GainNode;
let unlocked = false;
const onUnlockCallbacks: (() => void)[] = [];

export const BGM_VOLUME = 0.2;
export const SFX_VOLUME = 0.5;

const enabled = { bgm: true, sfx: true };

function create(): AudioContext {
  ctx = new AudioContext();
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  bgmBus = ctx.createGain();
  sfxBus = ctx.createGain();
  bgmBus.gain.value = enabled.bgm ? BGM_VOLUME : 0;
  sfxBus.gain.value = enabled.sfx ? SFX_VOLUME : 0;
  bgmBus.connect(comp);
  sfxBus.connect(comp);
  // タブが裏に回ったら止めて電池を節約する
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx?.suspend();
    else if (unlocked) ctx?.resume();
  });
  return ctx;
}

/** 音が鳴らせる状態なら AudioContext を返す（最初の操作の前は null） */
export function audio(): { ctx: AudioContext; bgm: GainNode; sfx: GainNode } | null {
  if (!ctx || !unlocked) return null;
  return { ctx, bgm: bgmBus, sfx: sfxBus };
}

export function onUnlock(cb: () => void) {
  if (unlocked) cb();
  else onUnlockCallbacks.push(cb);
}

/**
 * ブラウザの自動再生制限のため、最初のタップ／キー操作で音を開始する。
 * iOS はタッチなら pointerup、マウスなら pointerdown が「ユーザー操作」になるので両方で試す。
 */
export function installUnlock() {
  const events = ['pointerdown', 'pointerup', 'keydown'] as const;
  const tryUnlock = () => {
    const c = ctx ?? create();
    c.resume().then(() => {
      if (unlocked || c.state !== 'running') return;
      unlocked = true;
      for (const e of events) document.removeEventListener(e, tryUnlock, true);
      for (const cb of onUnlockCallbacks.splice(0)) cb();
    });
  };
  for (const e of events) document.addEventListener(e, tryUnlock, true);
}

function fade(bus: GainNode | undefined, to: number) {
  if (!ctx || !bus) return;
  bus.gain.cancelScheduledValues(ctx.currentTime);
  bus.gain.setTargetAtTime(to, ctx.currentTime, 0.05);
}

export function setBgmEnabled(on: boolean) {
  enabled.bgm = on;
  fade(bgmBus, on ? BGM_VOLUME : 0);
}

export function setSfxEnabled(on: boolean) {
  enabled.sfx = on;
  fade(sfxBus, on ? SFX_VOLUME : 0);
}

export function isBgmEnabled() {
  return enabled.bgm;
}

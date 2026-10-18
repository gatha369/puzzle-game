import { loadJson, saveJson } from './storage.ts';

export type Settings = {
  /** 端末の傾き操作 */
  tilt: boolean;
  /** 回転ロックの案内を表示済みか */
  tiltGuideSeen: boolean;
  bgm: boolean;
  sfx: boolean;
};

const KEY = 'yose-settings';
const DEFAULTS: Settings = { tilt: false, tiltGuideSeen: false, bgm: true, sfx: true };

export function loadSettings(): Settings {
  return { ...DEFAULTS, ...loadJson<Partial<Settings>>(KEY, {}) };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  saveJson(KEY, next);
  return next;
}

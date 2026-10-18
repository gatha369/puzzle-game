import { loadJson, saveJson } from './storage.ts';

// ヒントの通算回数。ステージをまたいでも、ページを開き直しても数え続ける（試作と同じキー）
const KEY = 'rym-hint-total';

export function loadHintTotal(): number {
  const n = loadJson<unknown>(KEY, 0);
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** 1回分数えて、数えた後の通算回数を返す */
export function countHint(): number {
  const n = loadHintTotal() + 1;
  saveJson(KEY, n);
  return n;
}

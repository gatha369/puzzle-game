import { beforeEach, describe, expect, it } from 'vitest';
import { countHint, loadHintTotal } from '../src/storage/hintTotal.ts';

// Node には localStorage がないので、テストの間だけ簡単なものを置く
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

describe('ヒントの通算回数', () => {
  beforeEach(() => store.clear());

  it('数えるたびに増え、保存される（試作と同じキー）', () => {
    expect(loadHintTotal()).toBe(0);
    expect(countHint()).toBe(1);
    expect(countHint()).toBe(2);
    expect(store.get('rym-hint-total')).toBe('2');
    expect(loadHintTotal()).toBe(2);
  });

  it('壊れた値は0から数え直す', () => {
    store.set('rym-hint-total', 'abc');
    expect(loadHintTotal()).toBe(0);
    store.set('rym-hint-total', '-5');
    expect(loadHintTotal()).toBe(0);
  });
});

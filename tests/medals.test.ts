import { describe, expect, it } from 'vitest';
import { medalFor } from '../src/storage/medals.ts';

describe('メダル', () => {
  it('お手本ちょうどで金、+2手まで銀、それ以上は銅', () => {
    expect(medalFor(4, 4, 2)).toBe('gold');
    expect(medalFor(5, 4, 2)).toBe('silver');
    expect(medalFor(6, 4, 2)).toBe('silver');
    expect(medalFor(7, 4, 2)).toBe('bronze');
  });
});

import { describe, expect, it } from 'vitest';
import { BEATS_PER_BAR, CHORDS, MELODY } from '../src/audio/song.ts';
import { freq } from '../src/audio/synth.ts';

describe('BGM の楽譜', () => {
  it('どの小節も3拍ちょうど', () => {
    MELODY.forEach((bar) => expect(bar.reduce((s, [, b]) => s + b, 0)).toBe(BEATS_PER_BAR));
  });

  it('メロディとコードの小節数が同じ', () => {
    expect(CHORDS).toHaveLength(MELODY.length);
  });

  it('すべての音名が読める', () => {
    for (const bar of MELODY) for (const [p] of bar) if (p !== 'R') expect(freq(p)).toBeGreaterThan(0);
    for (const c of CHORDS) for (const n of [c.bass, ...c.tones]) expect(freq(n)).toBeGreaterThan(0);
  });
});

describe('音名 → 周波数', () => {
  it('A4 = 440Hz、1オクターブで2倍', () => {
    expect(freq('A4')).toBeCloseTo(440);
    expect(freq('A5')).toBeCloseTo(880);
    expect(freq('C4')).toBeCloseTo(261.63, 1);
    expect(freq('F#4')).toBeCloseTo(freq('Gb4'));
  });
});

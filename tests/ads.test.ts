import { describe, expect, it } from 'vitest';
import { MESSAGES, pickAd, shouldShowPromo, type AdMessage } from '../src/ads/ads.ts';

describe('宣伝テキスト', () => {
  it('3事業×10文、すべて https のリンク', () => {
    expect(MESSAGES).toHaveLength(30);
    const byBiz: Record<string, number> = {};
    for (const m of MESSAGES) {
      byBiz[m.biz] = (byBiz[m.biz] ?? 0) + 1;
      expect(m.text.length).toBeGreaterThan(0);
      expect(new URL(m.url).protocol).toBe('https:');
    }
    expect(byBiz).toEqual({ manabi: 10, nenju: 10, rym: 10 });
  });

  it('直前と同じ文・同じ事業は続かない', () => {
    let last = -1;
    for (let n = 0; n < 500; n++) {
      const i = pickAd(MESSAGES, last);
      expect(i).not.toBe(last);
      if (last >= 0) expect(MESSAGES[i].biz).not.toBe(MESSAGES[last].biz);
      last = i;
    }
  });

  it('最初はどの文も選ばれうる', () => {
    expect(pickAd(MESSAGES, -1, () => 0)).toBe(0);
    expect(pickAd(MESSAGES, -1, () => 0.999)).toBe(29);
  });

  it('事業が1つしかなくても止まらない', () => {
    const one: AdMessage[] = [{ biz: 'a', text: 'x', url: 'https://a/' }, { biz: 'a', text: 'y', url: 'https://a/' }];
    expect(pickAd(one, 0)).toBe(1);
  });
});

describe('ヒント時のPRポップアップ', () => {
  it('通算3・6・9…回目だけ出す', () => {
    const shown = Array.from({ length: 10 }, (_, i) => i + 1).filter(shouldShowPromo);
    expect(shown).toEqual([3, 6, 9]);
    expect(shouldShowPromo(0)).toBe(false);
  });

  it('盤面の上の表示と別の事業から選ぶ', () => {
    for (let cur = 0; cur < MESSAGES.length; cur++) {
      for (let n = 0; n < 20; n++) expect(MESSAGES[pickAd(MESSAGES, cur)].biz).not.toBe(MESSAGES[cur].biz);
    }
  });
});

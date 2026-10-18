// 宣伝テキスト（PR表示）の文と選び方。文を変えたいときは messages.json だけ書き換える
import messagesJson from './messages.json' with { type: 'json' };

export type AdMessage = { biz: string; text: string; url: string };

export const MESSAGES: readonly AdMessage[] = messagesJson;

/**
 * ランダムに1文選ぶ。直前と同じ文・同じ事業は続けない（試作と同じ選び方）。
 * 前回の index を受け取り、選んだ index を返す。random はテスト用に差し替えられる
 */
export function pickAd(messages: readonly AdMessage[], last: number, random: () => number = Math.random): number {
  const lastBiz = messages[last]?.biz ?? '';
  const pool = messages.map((_, i) => i).filter((i) => i !== last && messages[i].biz !== lastBiz);
  if (!pool.length) return messages.length ? (last + 1) % messages.length : -1; // 事業が1つしかないとき
  return pool[Math.floor(random() * pool.length)];
}

/** ヒントの通算回数が3の倍数（3・6・9…回目）のときだけ、ヒントの前にPRのポップアップを出す */
export const PROMO_EVERY = 3;
export function shouldShowPromo(hintTotal: number): boolean {
  return hintTotal > 0 && hintTotal % PROMO_EVERY === 0;
}

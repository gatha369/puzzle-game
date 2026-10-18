import { loadJson, saveJson } from './storage.ts';

export type Medal = 'gold' | 'silver' | 'bronze';

const KEY = 'yose-medals';
const RANK: Record<Medal, number> = { bronze: 1, silver: 2, gold: 3 };

/** 金：お手本ちょうど、銀：+silverMargin 手以内、銅：それ以上 */
export function medalFor(moves: number, par: number, silverMargin: number): Medal {
  return moves <= par ? 'gold' : moves <= par + silverMargin ? 'silver' : 'bronze';
}

/** ステージ id → 最高メダル */
export function loadMedals(): Record<string, Medal> {
  return loadJson<Record<string, Medal>>(KEY, {});
}

/** これまでより良いメダルなら保存する。保存後の一覧を返す */
export function recordMedal(stageId: string, medal: Medal): Record<string, Medal> {
  const medals = loadMedals();
  const prev = medals[stageId];
  if (!prev || RANK[medal] > RANK[prev]) {
    medals[stageId] = medal;
    saveJson(KEY, medals);
  }
  return medals;
}

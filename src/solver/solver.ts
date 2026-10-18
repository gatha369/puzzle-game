import { boardKey } from '../game/board.ts';
import { colorCounts, isCleared, step } from '../game/move.ts';
import { DIRECTIONS, type Board, type Direction } from '../game/types.ts';

/** 探索する状態数の上限。超えたら「判定不能」 */
export const SOLVE_LIMIT = 120000;

/** 最短手順 / 解けない(null) / 上限超えで判定不能('limit') */
export type SolveResult = Direction[] | null | 'limit';

/** 簡易判定：いずれかの色の残数が 1 または 2 なら確実に詰み */
export function surelyStuck(board: Board): boolean {
  return Object.values(colorCounts(board)).some((n) => n < 3);
}

/** 幅優先探索で最短手順を求める */
export function solve(board: Board, limit = SOLVE_LIMIT): SolveResult {
  if (isCleared(board)) return [];
  if (surelyStuck(board)) return null;
  const prev = new Map<string, [string, Direction] | null>([[boardKey(board), null]]);
  let frontier: { board: Board; key: string }[] = [{ board, key: boardKey(board) }];
  while (frontier.length) {
    const next: typeof frontier = [];
    for (const cur of frontier) {
      for (const d of DIRECTIONS) {
        const r = step(cur.board, d);
        if (!r) continue;
        const nb = r.next;
        const key = boardKey(nb);
        if (prev.has(key)) continue;
        prev.set(key, [cur.key, d]);
        if (isCleared(nb)) {
          const path: Direction[] = [];
          let k = key;
          for (let link = prev.get(k); link; link = prev.get(k)) { path.unshift(link[1]); k = link[0]; }
          return path;
        }
        if (surelyStuck(nb)) continue;
        if (prev.size > limit) return 'limit';
        next.push({ board: nb, key });
      }
    }
    frontier = next;
  }
  return null;
}

/** 正確判定：現在の盤面からもう解けないなら true（判定不能のときは詰みにしない） */
export function isStuck(board: Board): boolean {
  return solve(board) === null;
}

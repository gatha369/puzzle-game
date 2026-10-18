import { boardKey } from '../game/board.ts';
import { colorCounts, isCleared, rainbowCount, step } from '../game/move.ts';
import { DIRECTIONS, type Board, type Direction } from '../game/types.ts';

/** 探索する状態数の上限。超えたら「判定不能」 */
export const SOLVE_LIMIT = 200000;

/** 最短手順 / 解けない(null) / 上限超えで判定不能('limit') */
export type SolveResult = Direction[] | null | 'limit';

/**
 * 簡易判定：確実に詰みなら true
 *   - ある色について「その色の数＋レインボーの数」が3未満
 *   - 色のボックスがなくなり、レインボーだけが1〜2個残った
 */
export function surelyStuck(board: Board): boolean {
  const counts = Object.values(colorCounts(board));
  const r = rainbowCount(board);
  if (counts.some((n) => n + r < 3)) return true;
  return counts.length === 0 && r > 0 && r < 3;
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

/** ヒント：今の盤面からの最短手順の次の1手。詰み・判定不能・クリア済みなら null */
export function nextHint(board: Board): Direction | null {
  const sol = solve(board);
  return Array.isArray(sol) && sol.length ? sol[0] : null;
}

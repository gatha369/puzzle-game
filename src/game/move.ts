import { EMPTY } from './board.ts';
import type { Board, Cell, Color, Direction } from './types.ts';

/** 各ボックスの移動元 index → 移動先 index と移動マス数（動かないボックスも dist 0 で入る） */
export type BoxMoves = ReadonlyMap<number, { to: number; dist: number }>;

export type SlideResult = { board: Board; moves: BoxMoves };

export type StepResult = {
  /** 滑り終えた直後（消える前）の盤面 */
  slid: Board;
  moves: BoxMoves;
  /** 消える塊（index の配列） */
  groups: number[][];
  /** 消えた後の盤面 */
  next: Board;
};

// 滑る方向の先頭から順に並べた、1列（または1行）分の index
function lineIndices(board: Board, dir: Direction, k: number): number[] {
  const { width: w, height: h } = board;
  const out: number[] = [];
  if (dir === 'left') for (let x = 0; x < w; x++) out.push(k * w + x);
  if (dir === 'right') for (let x = w - 1; x >= 0; x--) out.push(k * w + x);
  if (dir === 'up') for (let y = 0; y < h; y++) out.push(y * w + k);
  if (dir === 'down') for (let y = h - 1; y >= 0; y--) out.push(y * w + k);
  return out;
}

/** すべてのボックスを dir へ、壁・端・他のボックスに当たるまで滑らせる */
export function slide(board: Board, dir: Direction): SlideResult {
  const cells = board.cells.slice();
  const moves = new Map<number, { to: number; dist: number }>();
  const lines = dir === 'left' || dir === 'right' ? board.height : board.width;
  for (let k = 0; k < lines; k++) {
    const idx = lineIndices(board, dir, k);
    let target = 0;
    for (let i = 0; i < idx.length; i++) {
      const cell = cells[idx[i]];
      if (cell.type === 'wall') { target = i + 1; continue; }
      if (cell.type === 'empty') continue;
      moves.set(idx[i], { to: idx[target], dist: i - target });
      if (i !== target) { cells[idx[target]] = cell; cells[idx[i]] = EMPTY; }
      target++;
    }
  }
  return { board: { width: board.width, height: board.height, cells }, moves };
}

function boxColor(cell: Cell): Color | null {
  return cell.type === 'box' ? cell.color : null;
}

/**
 * 消える塊を探す：同じ色が上下左右で3個以上つながったもの（斜めは含まない）。
 * 消え方のルールはこの関数に閉じ込めておき、将来差し替えられるようにする。
 */
export function findGroups(board: Board): number[][] {
  const { width: w, height: h, cells } = board;
  const seen = new Uint8Array(cells.length);
  const groups: number[][] = [];
  for (let i = 0; i < cells.length; i++) {
    const color = boxColor(cells[i]);
    if (seen[i] || color === null) continue;
    const stack = [i];
    const group: number[] = [];
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      group.push(p);
      const x = p % w, y = (p / w) | 0;
      const nb: number[] = [];
      if (x > 0) nb.push(p - 1);
      if (x < w - 1) nb.push(p + 1);
      if (y > 0) nb.push(p - w);
      if (y < h - 1) nb.push(p + w);
      for (const q of nb) if (!seen[q] && boxColor(cells[q]) === color) { seen[q] = 1; stack.push(q); }
    }
    if (group.length >= 3) groups.push(group);
  }
  return groups;
}

export function clearGroups(board: Board, groups: readonly number[][]): Board {
  const cells = board.cells.slice();
  for (const g of groups) for (const p of g) cells[p] = EMPTY;
  return { width: board.width, height: board.height, cells };
}

function sameCells(a: Board, b: Board): boolean {
  for (let i = 0; i < a.cells.length; i++) if (a.cells[i] !== b.cells[i]) return false;
  return true;
}

/** 1手：滑らせて、揃った塊を消す。盤面が変化しなければ null（手数に数えない） */
export function step(board: Board, dir: Direction): StepResult | null {
  const s = slide(board, dir);
  if (sameCells(s.board, board)) return null;
  const groups = findGroups(s.board);
  return { slid: s.board, moves: s.moves, groups, next: clearGroups(s.board, groups) };
}

/** 盤面だけ欲しいとき用（新しい盤面を返す純粋関数） */
export function move(board: Board, dir: Direction): Board {
  return step(board, dir)?.next ?? board;
}

export function colorCounts(board: Board): Partial<Record<Color, number>> {
  const m: Partial<Record<Color, number>> = {};
  for (const cell of board.cells) if (cell.type === 'box') m[cell.color] = (m[cell.color] ?? 0) + 1;
  return m;
}

export function isCleared(board: Board): boolean {
  return board.cells.every((c) => c.type !== 'box');
}

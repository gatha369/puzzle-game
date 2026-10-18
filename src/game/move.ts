import { EMPTY, isBox } from './board.ts';
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

/**
 * すべてのボックスを dir へ、壁・端・他のボックスに当たるまで滑らせる。
 * はちみつ床に「入った」ボックスはそこで止まる（手の開始時に乗っていたボックスは離れられる）
 */
export function slide(board: Board, dir: Direction): SlideResult {
  const { floor } = board;
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
      // 進路（i-1 から target まで）で最初に出会うはちみつ床
      let stop = target;
      for (let j = i - 1; j >= target; j--) if (floor[idx[j]] === 'honey') { stop = j; break; }
      moves.set(idx[i], { to: idx[stop], dist: i - stop });
      if (i !== stop) { cells[idx[stop]] = cell; cells[idx[i]] = EMPTY; }
      target = stop + 1;
    }
  }
  return { board: { ...board, cells }, moves };
}

function neighbors(w: number, h: number, p: number): number[] {
  const x = p % w, y = (p / w) | 0;
  const nb: number[] = [];
  if (x > 0) nb.push(p - 1);
  if (x < w - 1) nb.push(p + 1);
  if (y > 0) nb.push(p - w);
  if (y < h - 1) nb.push(p + w);
  return nb;
}

/**
 * 消える塊を探す：上下左右で3個以上つながったもの（斜めは含まない）。
 *   - 色ごとに「その色＋レインボー」でつながった塊を探し、その色が1個以上入っていれば消える
 *   - レインボーは隣り合う複数の色の塊に同時に参加できる（同じ index が複数の塊に入る）
 *   - レインボーだけで3個以上つながった塊も消える
 * 消え方のルールはこの関数に閉じ込めておき、将来差し替えられるようにする。
 */
export function findGroups(board: Board): number[][] {
  const { width: w, height: h, cells } = board;
  const colors = new Set<Color>(); // 盤面に出てくる順（試作と同じ順に塊を返す）
  for (const cell of cells) if (cell.type === 'box') colors.add(cell.color);
  const groups: number[][] = [];
  const scan = (match: (c: Cell) => boolean, needColor: boolean) => {
    const seen = new Uint8Array(cells.length);
    for (let i = 0; i < cells.length; i++) {
      if (seen[i] || !match(cells[i])) continue;
      const stack = [i];
      const group: number[] = [];
      let hasColor = false;
      seen[i] = 1;
      while (stack.length) {
        const p = stack.pop()!;
        group.push(p);
        if (cells[p].type === 'box') hasColor = true;
        for (const q of neighbors(w, h, p)) if (!seen[q] && match(cells[q])) { seen[q] = 1; stack.push(q); }
      }
      if (group.length >= 3 && (!needColor || hasColor)) groups.push(group);
    }
  };
  for (const color of colors) scan((c) => c.type === 'rainbow' || (c.type === 'box' && c.color === color), true);
  scan((c) => c.type === 'rainbow', false);
  return groups;
}

export function clearGroups(board: Board, groups: readonly number[][]): Board {
  const cells = board.cells.slice();
  for (const g of groups) for (const p of g) cells[p] = EMPTY;
  return { ...board, cells };
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

/** 色ごとの残数（レインボーは含めない。rainbowCount で数える） */
export function colorCounts(board: Board): Partial<Record<Color, number>> {
  const m: Partial<Record<Color, number>> = {};
  for (const cell of board.cells) if (cell.type === 'box') m[cell.color] = (m[cell.color] ?? 0) + 1;
  return m;
}

export function rainbowCount(board: Board): number {
  let n = 0;
  for (const cell of board.cells) if (cell.type === 'rainbow') n++;
  return n;
}

/** レインボーも含めてボックスが全部消えたらクリア */
export function isCleared(board: Board): boolean {
  return !board.cells.some(isBox);
}

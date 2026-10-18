import type { Board, Cell, Color, Floor } from './types.ts';

// セルは不変なので共有する（ソルバーで大量の盤面を作ってもオブジェクトが増えない）
export const EMPTY: Cell = Object.freeze({ type: 'empty' });
export const WALL: Cell = Object.freeze({ type: 'wall' });
export const RAINBOW: Cell = Object.freeze({ type: 'rainbow' });
const BOXES = Object.fromEntries(
  (['R', 'G', 'B', 'Y', 'P'] as const).map((c) => [c, Object.freeze({ type: 'box', color: c })]),
) as Record<Color, Cell>;

export function boxCell(color: Color): Cell {
  return BOXES[color];
}

function charToCell(ch: string): Cell {
  if (ch === '.') return EMPTY;
  if (ch === '#') return WALL;
  if (ch === '*') return RAINBOW;
  if (ch in BOXES) return BOXES[ch as Color];
  throw new Error(`ステージに使えない文字です: "${ch}"`);
}

export function cellToChar(cell: Cell): string {
  if (cell.type === 'empty') return '.';
  if (cell.type === 'wall') return '#';
  if (cell.type === 'rainbow') return '*';
  return cell.color;
}

function charToFloor(ch: string): Floor {
  if (ch === '.') return 'plain';
  if (ch === 'h') return 'honey';
  throw new Error(`床に使えない文字です: "${ch}"`);
}

/** ボックスか（色のボックスとレインボー。壁と空きは含まない） */
export function isBox(cell: Cell): boolean {
  return cell.type === 'box' || cell.type === 'rainbow';
}

/**
 * ステージ文字列を Board に変換
 *   grid  … `.` 空き、`#` 壁、`R G B Y P` ボックス、`*` レインボー
 *   floor … `.` 普通、`h` はちみつ（省略時はすべて普通の床）
 */
export function parseGrid(rows: readonly string[], floorRows?: readonly string[]): Board {
  const width = rows[0]?.length ?? 0;
  if (width === 0) throw new Error('ステージが空です');
  for (const row of rows) {
    if (row.length !== width) throw new Error('ステージの行の長さが揃っていません');
  }
  if (floorRows && (floorRows.length !== rows.length || floorRows.some((r) => r.length !== width))) {
    throw new Error('床の大きさがステージと揃っていません');
  }
  const cells = rows.join('').split('').map(charToCell);
  const floor = floorRows ? floorRows.join('').split('').map(charToFloor) : cells.map((): Floor => 'plain');
  return { width, height: rows.length, cells, floor };
}

/** ボックス層を1本の文字列にする（ソルバーの重複排除キー。床は動かないので含めない） */
export function boardKey(board: Board): string {
  return board.cells.map(cellToChar).join('');
}

/** 盤面をステージ文字列の形に戻す（テスト・デバッグ用） */
export function toGrid(board: Board): string[] {
  const key = boardKey(board);
  const rows: string[] = [];
  for (let y = 0; y < board.height; y++) rows.push(key.slice(y * board.width, (y + 1) * board.width));
  return rows;
}

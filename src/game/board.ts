import type { Board, Cell, Color } from './types.ts';

// セルは不変なので共有する（ソルバーで大量の盤面を作ってもオブジェクトが増えない）
export const EMPTY: Cell = Object.freeze({ type: 'empty' });
export const WALL: Cell = Object.freeze({ type: 'wall' });
const BOXES = Object.fromEntries(
  (['R', 'G', 'B', 'Y', 'P'] as const).map((c) => [c, Object.freeze({ type: 'box', color: c })]),
) as Record<Color, Cell>;

export function boxCell(color: Color): Cell {
  return BOXES[color];
}

function charToCell(ch: string): Cell {
  if (ch === '.') return EMPTY;
  if (ch === '#') return WALL;
  if (ch in BOXES) return BOXES[ch as Color];
  throw new Error(`ステージに使えない文字です: "${ch}"`);
}

export function cellToChar(cell: Cell): string {
  if (cell.type === 'empty') return '.';
  if (cell.type === 'wall') return '#';
  return cell.color;
}

/** ステージ文字列（`.` 空き、`#` 壁、`R G B Y P` ボックス）を Board に変換 */
export function parseGrid(rows: readonly string[]): Board {
  const width = rows[0]?.length ?? 0;
  if (width === 0) throw new Error('ステージが空です');
  for (const row of rows) {
    if (row.length !== width) throw new Error('ステージの行の長さが揃っていません');
  }
  return { width, height: rows.length, cells: rows.join('').split('').map(charToCell) };
}

/** 盤面を1本の文字列にする（ソルバーの重複排除キー） */
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

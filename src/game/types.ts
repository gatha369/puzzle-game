export type Color = 'R' | 'G' | 'B' | 'Y' | 'P';

export type Cell =
  | { type: 'empty' }
  | { type: 'wall' }
  | { type: 'box'; color: Color };
// 将来のアイテム用に type を追加していく（例：{ type: 'item'; kind: 'bomb' }）

/** cells は行優先（index = y * width + x） */
export type Board = { readonly width: number; readonly height: number; readonly cells: readonly Cell[] };

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

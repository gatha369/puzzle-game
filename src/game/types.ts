export type Color = 'R' | 'G' | 'B' | 'Y' | 'P';

export type Cell =
  | { type: 'empty' }
  | { type: 'wall' }
  | { type: 'box'; color: Color }
  /** レインボーキャンディ：普通のボックスと同じく滑り、どの色とも揃う */
  | { type: 'rainbow' };
// 将来のアイテム用に type を追加していく（例：{ type: 'item'; kind: 'bomb' }）

/** 床。動かないのでソルバーの状態キーには含めない */
export type Floor = 'plain' | 'honey';

/** cells / floor は行優先（index = y * width + x） */
export type Board = {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly Cell[];
  /** 床層。盤面を作り直しても同じ配列を共有する */
  readonly floor: readonly Floor[];
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

import { describe, expect, it } from 'vitest';
import { boardKey, colorCounts, findGroups, isCleared, move, parseGrid, slide, step, toGrid } from '../src/game/index.ts';

const after = (grid: string[], ...dirs: Parameters<typeof move>[1][]) =>
  toGrid(dirs.reduce(move, parseGrid(grid)));

describe('parseGrid', () => {
  it('文字列を盤面に変換し、元に戻せる', () => {
    const grid = ['R.#', 'G.B'];
    const b = parseGrid(grid);
    expect(b.width).toBe(3);
    expect(b.height).toBe(2);
    expect(b.cells[0]).toEqual({ type: 'box', color: 'R' });
    expect(b.cells[2]).toEqual({ type: 'wall' });
    expect(b.cells[1]).toEqual({ type: 'empty' });
    expect(toGrid(b)).toEqual(grid);
  });

  it('不正な文字や行の長さの不一致はエラー', () => {
    expect(() => parseGrid(['RX'])).toThrow();
    expect(() => parseGrid(['R.', '.'])).toThrow();
  });
});

describe('移動', () => {
  it('すべてのボックスが端まで滑る', () => {
    expect(after(['.R.', '..G', 'B..'], 'left')).toEqual(['R..', 'G..', 'B..']);
    expect(after(['.R.', '..G', 'B..'], 'down')).toEqual(['...', '...', 'BRG']);
  });

  it('壁で止まり、壁は動かない', () => {
    expect(after(['..#.R'], 'left')).toEqual(['..#R.']);
    expect(after(['R.#..'], 'right')).toEqual(['.R#..']);
  });

  it('他のボックスに当たって止まる（詰めて並ぶ）', () => {
    expect(after(['R.G.B'], 'right')).toEqual(['..RGB']);
  });

  it('移動元→移動先と移動マス数を返す', () => {
    const { moves } = slide(parseGrid(['R..G.']), 'right');
    expect(moves.get(0)).toEqual({ to: 3, dist: 3 });
    expect(moves.get(3)).toEqual({ to: 4, dist: 1 });
  });

  it('盤面が変化しない操作は null（手数に数えない）', () => {
    expect(step(parseGrid(['R...', '#...']), 'left')).toBeNull();
    expect(step(parseGrid(['R...', '#...']), 'up')).toBeNull();
  });

  it('元の盤面は変更しない（不変データ）', () => {
    const b = parseGrid(['R...']);
    const key = boardKey(b);
    move(b, 'right');
    expect(boardKey(b)).toBe(key);
  });
});

describe('消去', () => {
  it('同じ色が3個つながると消える', () => {
    expect(after(['R.R.R'], 'left')).toEqual(['.....']);
  });

  it('2個では消えない・斜めはつながりに含まない', () => {
    expect(findGroups(parseGrid(['RR.', '..R']))).toEqual([]);
    expect(findGroups(parseGrid(['R..', '.R.', '..R']))).toEqual([]);
  });

  it('L字や4個以上の塊は丸ごと消える', () => {
    const g = findGroups(parseGrid(['RR..', '.RRR']));
    expect(g).toHaveLength(1);
    expect(g[0].sort((a, b) => a - b)).toEqual([0, 1, 5, 6, 7]);
  });

  it('複数の塊は同時に消え、消えた後に再スライドしない', () => {
    const r = step(parseGrid(['R.R.R', 'G.G.G', 'B....']), 'left')!;
    expect(r.groups).toHaveLength(2);
    expect(toGrid(r.next)).toEqual(['.....', '.....', 'B....']);
  });

  it('色が違えば隣り合っても消えない', () => {
    expect(after(['R.G.R'], 'left')).toEqual(['RGR..']);
  });
});

describe('クリア判定・色の残数', () => {
  it('ボックスがなくなればクリア（壁は残ってよい）', () => {
    expect(isCleared(parseGrid(['.#.', '...']))).toBe(true);
    expect(isCleared(parseGrid(['.#R']))).toBe(false);
  });

  it('色ごとの残数を数える', () => {
    expect(colorCounts(parseGrid(['RRG', '#.R']))).toEqual({ R: 3, G: 1 });
  });
});

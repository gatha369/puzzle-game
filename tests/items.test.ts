import { describe, expect, it } from 'vitest';
import { boardKey, findGroups, isCleared, move, parseGrid, slide, step, toGrid } from '../src/game/index.ts';
import { solve, surelyStuck } from '../src/solver/solver.ts';

const after = (grid: string[], floor: string[] | undefined, ...dirs: Parameters<typeof move>[1][]) =>
  toGrid(dirs.reduce(move, parseGrid(grid, floor)));
const sorted = (g: number[]) => [...g].sort((a, b) => a - b);

describe('レインボーキャンディ', () => {
  it('`*` で読み込み、元に戻せる', () => {
    const b = parseGrid(['R*.']);
    expect(b.cells[1]).toEqual({ type: 'rainbow' });
    expect(toGrid(b)).toEqual(['R*.']);
  });

  it('普通のボックスと同じく滑る', () => {
    expect(after(['..*.G'], undefined, 'left')).toEqual(['*G...']);
  });

  it('どの色の代わりにもなり、2個＋レインボーで消える', () => {
    expect(after(['R.*.R'], undefined, 'left')).toEqual(['.....']);
    expect(after(['G...', '*...', 'G...'], undefined, 'right')).toEqual(['....', '....', '....']);
  });

  it('隣り合う2色の塊に同時に参加し、両方の塊とレインボーが消える', () => {
    const b = parseGrid(['RR*GG']);
    const groups = findGroups(b);
    expect(groups.map(sorted)).toEqual([[0, 1, 2], [2, 3, 4]]);
    expect(toGrid(step(parseGrid(['RR.*.GG']), 'left')!.next)).toEqual(['.......']);
  });

  it('色が1個でも入っていれば消える（レインボー2個＋色1個）', () => {
    expect(after(['*.R.*'], undefined, 'left')).toEqual(['.....']);
  });

  it('レインボーだけでも3個つながれば消える', () => {
    expect(after(['*.*.*'], undefined, 'left')).toEqual(['.....']);
  });

  it('レインボー2個だけでは消えない', () => {
    expect(findGroups(parseGrid(['**...']))).toEqual([]);
  });

  it('別の色の塊にだけ参加し、関係ない色は残る', () => {
    // G*G が消え、隣の RR はレインボーとつながらないので残る
    expect(after(['RRG.*G'], undefined, 'left')).toEqual(['RR....']);
  });

  it('レインボーが残っていればクリアではない', () => {
    expect(isCleared(parseGrid(['.*.']))).toBe(false);
  });

  it('確実な詰み：色の数＋レインボーの数が3未満', () => {
    expect(surelyStuck(parseGrid(['RR*..']))).toBe(false);
    expect(surelyStuck(parseGrid(['RG*..']))).toBe(true);
    expect(surelyStuck(parseGrid(['RR...']))).toBe(true);
  });

  it('確実な詰み：色がなくなり、レインボーだけが1〜2個残った', () => {
    expect(surelyStuck(parseGrid(['*....']))).toBe(true);
    expect(surelyStuck(parseGrid(['**...']))).toBe(true);
    expect(surelyStuck(parseGrid(['***..']))).toBe(false);
  });

  it('ソルバーはレインボーを使った手順を見つける', () => {
    expect(solve(parseGrid(['R.*.R']))).toEqual(['left']);
    expect(solve(parseGrid(['R#*#R']))).toBeNull();
  });
});

describe('はちみつ床', () => {
  it('床層を読み込む（省略時はすべて普通の床）', () => {
    expect(parseGrid(['R..'], ['.h.']).floor).toEqual(['plain', 'honey', 'plain']);
    expect(parseGrid(['R..']).floor).toEqual(['plain', 'plain', 'plain']);
  });

  it('床の大きさの不一致や不正な文字はエラー', () => {
    expect(() => parseGrid(['R..'], ['.h'])).toThrow();
    expect(() => parseGrid(['R..'], ['...', '...'])).toThrow();
    expect(() => parseGrid(['R..'], ['.x.'])).toThrow();
  });

  it('滑ってきたボックスは、はちみつ床に入るとそこで止まる', () => {
    expect(after(['R....'], ['..h..'], 'right')).toEqual(['..R..']);
    expect(after(['R', '.', '.'], ['.', 'h', '.'], 'down')).toEqual(['.', 'R', '.']);
  });

  it('進路上で最初に出会ったはちみつ床で止まる', () => {
    expect(after(['....R'], ['.h.h.'], 'left')).toEqual(['...R.']);
  });

  it('手の開始時に乗っているボックスは離れられる', () => {
    expect(after(['..R..'], ['..h..'], 'right')).toEqual(['....R']);
    expect(after(['R....'], ['..h..'], 'right', 'right')).toEqual(['....R']);
  });

  it('後ろから来たボックスは、止まったボックスの後ろで止まる', () => {
    expect(after(['RG...'], ['...h.'], 'right')).toEqual(['..RG.']);
  });

  it('壁の向こうのはちみつ床は関係ない', () => {
    expect(after(['..#.R'], ['h....'], 'left')).toEqual(['..#R.']);
  });

  it('はちみつで止まった移動も移動元→移動先と移動マス数を返す', () => {
    const { moves } = slide(parseGrid(['R....'], ['..h..']), 'right');
    expect(moves.get(0)).toEqual({ to: 2, dist: 2 });
  });

  it('はちみつで止まると、届くはずの仲間に届かず消えない', () => {
    expect(after(['R..RR'], undefined, 'right')).toEqual(['.....']);
    expect(after(['R..RR'], ['.h...'], 'right')).toEqual(['.R.RR']);
  });

  it('床は動かず、ソルバーの状態キーにも含めない', () => {
    const a = parseGrid(['R....'], ['..h..']);
    const b = parseGrid(['R....']);
    expect(boardKey(a)).toBe(boardKey(b));
    expect(move(a, 'right').floor).toBe(a.floor);
  });

  it('ソルバーは床を考慮して最短手順を求める', () => {
    // はちみつがなければ左で揃う。はちみつがあると左では右端の赤が止まってしまい、右でしか揃わない
    expect(solve(parseGrid(['RR..R']))).toEqual(['left']);
    expect(after(['RR..R'], ['...h.'], 'left')).toEqual(['RR.R.']);
    expect(solve(parseGrid(['RR..R'], ['...h.']))).toEqual(['right']);
  });
});

describe('レインボー＋はちみつ', () => {
  it('はちみつで止まったレインボーは塊に届かない', () => {
    expect(after(['*...RR'], undefined, 'right')).toEqual(['......']);
    expect(after(['*...RR'], ['..h...'], 'right')).toEqual(['..*.RR']);
  });
});

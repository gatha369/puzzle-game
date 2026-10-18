import { describe, expect, it } from 'vitest';
import { move, parseGrid } from '../src/game/index.ts';
import { isStuck, solve, surelyStuck } from '../src/solver/solver.ts';
import { STAGES } from '../src/stages/index.ts';

describe('簡易判定', () => {
  it('いずれかの色の残数が1〜2なら詰み', () => {
    expect(surelyStuck(parseGrid(['RR...']))).toBe(true);
    expect(surelyStuck(parseGrid(['RRRG.']))).toBe(true);
    expect(surelyStuck(parseGrid(['RRR..']))).toBe(false);
    expect(surelyStuck(parseGrid(['.....']))).toBe(false);
  });
});

describe('ソルバー', () => {
  it('クリア済みなら0手', () => {
    expect(solve(parseGrid(['..#']))).toEqual([]);
  });

  it('最短手順を返す', () => {
    expect(solve(parseGrid(['R...R', '.....', '.....', '.....', 'R....']))).toEqual(['up', 'left']);
  });

  it('色が足りていても並べられなければ解けない', () => {
    // 3個あっても壁で分断されていて1か所に集まれない
    expect(solve(parseGrid(['R#R#R']))).toBeNull();
    expect(isStuck(parseGrid(['R#R#R']))).toBe(true);
  });

  it('消しすぎの罠：赤5個のうち4個がまとめて消えると残り1個で詰み', () => {
    const b = move(parseGrid(['RRR.R', '.....', '....R']), 'left');
    expect(b.cells.filter((c) => c.type === 'box')).toHaveLength(1);
    expect(isStuck(b)).toBe(true);
  });

  it('探索上限を超えたら判定不能（詰み扱いしない）', () => {
    const b = parseGrid(['..B...', '#..B..', '.....B', '.....B', 'BG#G..', '#GRRBR']);
    expect(solve(b, 10)).toBe('limit');
  });
});

describe('ステージ', () => {
  // 試作（docs/prototype.html）のソルバーが出す最短手順と一致すること
  const expected: Record<string, string[]> = {
    '1': ['up', 'left'],
    '2': ['left', 'down', 'up'],
    '3': ['down', 'right', 'up'],
    '4': ['down', 'left', 'left', 'up'],
    '5': ['right', 'up', 'right', 'left'],
    '6': ['left', 'left', 'up', 'right', 'up'],
    '7': ['up', 'right', 'left', 'right', 'left'],
    '8': ['left', 'right', 'up', 'up', 'right', 'down', 'up'],
    '9': ['up', 'left'],
    '10': ['down', 'right', 'left'],
    '11': ['left', 'down', 'left'],
    '12': ['right', 'down', 'up', 'left'],
    '13': ['up', 'left'],
    '14': ['right', 'left', 'down', 'left'],
    '15': ['up', 'right', 'up', 'left'],
    '16': ['right', 'up', 'down', 'down'],
    '17': ['left', 'left', 'right', 'up'],
    '18': ['down', 'left', 'down', 'right', 'up'],
    '19': ['right', 'up', 'left', 'up', 'right'],
    '20': ['up', 'left', 'up', 'right', 'up', 'right'],
    '21': ['right', 'right', 'left', 'down', 'left'],
    '22': ['left', 'up', 'right', 'up', 'left'],
    '23': ['left', 'up', 'up', 'left', 'up', 'left'],
    '24': ['up', 'right', 'left', 'down', 'left', 'down'],
    '25': ['left', 'down', 'down', 'down', 'left'],
    '26': ['up', 'down', 'right', 'up', 'up', 'right'],
    '27': ['down', 'right', 'up', 'left', 'up', 'up'],
    '28': ['down', 'right', 'left', 'down', 'left', 'left'],
    '29': ['right', 'up', 'right', 'down', 'left', 'up', 'left', 'up'],
    '30': ['right', 'down', 'left', 'right', 'up', 'up', 'right'],
    '31': ['left', 'up', 'right', 'down', 'right', 'up', 'right', 'up', 'right'],
    '32': ['up', 'up', 'right', 'down', 'left', 'up', 'right', 'down'],
  };

  it('全32面ある', () => {
    expect(STAGES).toHaveLength(32);
  });

  it.each(STAGES.map((s) => [s.id, s] as const))('ステージ %s が解け、par が最短手数と一致する', (id, stage) => {
    const result = solve(parseGrid(stage.grid, stage.floor));
    expect(result).toEqual(expected[id]);
    expect(stage.par).toBe(expected[id].length);
  });
});

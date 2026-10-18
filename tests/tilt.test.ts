import { describe, expect, it } from 'vitest';
import { TILT } from '../src/input/tiltConfig.ts';
import { judgeTilt, tiltDelta, visualTilt } from '../src/input/tiltLogic.ts';

const base = { beta: 30, gamma: 0 };

describe('傾き操作の判定', () => {
  it('しきい値以上傾けると、大きい方の軸の方向へ1手', () => {
    expect(judgeTilt(tiltDelta({ beta: 30, gamma: 25 }, base), true).dir).toBe('right');
    expect(judgeTilt(tiltDelta({ beta: 30, gamma: -25 }, base), true).dir).toBe('left');
    expect(judgeTilt(tiltDelta({ beta: 5, gamma: 3 }, base), true).dir).toBe('up');
    expect(judgeTilt(tiltDelta({ beta: 55, gamma: -10 }, base), true).dir).toBe('down');
  });

  it('しきい値未満では動かない', () => {
    expect(judgeTilt({ dx: TILT.TRIGGER_DEG - 1, dy: 0 }, true)).toEqual({ dir: null, armed: true });
  });

  it('1手のあとは水平近くに戻すまで受け付けない', () => {
    expect(judgeTilt({ dx: 30, dy: 0 }, false)).toEqual({ dir: null, armed: false });
    expect(judgeTilt({ dx: TILT.REARM_DEG + 1, dy: 0 }, false)).toEqual({ dir: null, armed: false });
    expect(judgeTilt({ dx: TILT.REARM_DEG, dy: 2 }, false)).toEqual({ dir: null, armed: true });
  });

  it('beta が ±180 をまたいでも差は小さいまま', () => {
    expect(tiltDelta({ beta: -175, gamma: 0 }, { beta: 175, gamma: 0 }).dy).toBeCloseTo(10);
  });

  it('3D表示の角度は上限で止まり、試作の tilt-* と同じ向き', () => {
    // 上へ傾ける＝rotateX が正、右へ＝rotateY が正（試作の .tilt-up / .tilt-right と同じ）
    expect(visualTilt({ dx: 0, dy: -30 })).toEqual({ rx: TILT.VISUAL_MAX_DEG, ry: 0 });
    expect(visualTilt({ dx: 3, dy: 0 })).toEqual({ rx: 0, ry: 3 });
  });
});

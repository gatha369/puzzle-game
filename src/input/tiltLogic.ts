// 傾き角 → 操作 の判定（DOM に依存しない純粋関数）
import type { Direction } from '../game/types.ts';
import { TILT } from './tiltConfig.ts';

export type Orientation = { beta: number; gamma: number };

/** 水平とみなす姿勢からの傾き。dx は右が下がると正、dy は奥（画面上端）が上がると正 */
export type TiltDelta = { dx: number; dy: number };

// -180〜180 に収める（beta が ±180 をまたいでも差が跳ねないように）
const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

export function tiltDelta(now: Orientation, base: Orientation): TiltDelta {
  return { dx: wrap(now.gamma - base.gamma), dy: wrap(now.beta - base.beta) };
}

/**
 * armed（次の手を受け付ける状態）なら、大きい方の軸が TRIGGER_DEG 以上で方向を返す。
 * armed でなければ、REARM_DEG 以内に戻ったときに armed に戻す。
 */
export function judgeTilt(d: TiltDelta, armed: boolean): { dir: Direction | null; armed: boolean } {
  const ax = Math.abs(d.dx), ay = Math.abs(d.dy);
  if (!armed) return { dir: null, armed: Math.max(ax, ay) <= TILT.REARM_DEG };
  if (Math.max(ax, ay) < TILT.TRIGGER_DEG) return { dir: null, armed: true };
  // 画面上端が上がる（dy 正）とボックスは手前＝下へ滑る
  const dir: Direction = ax > ay ? (d.dx > 0 ? 'right' : 'left') : (d.dy > 0 ? 'down' : 'up');
  return { dir, armed };
}

/** 盤の3D表示用の角度（CSS の rotateX / rotateY に渡す。試作の tilt-* と同じ向き） */
export function visualTilt(d: TiltDelta): { rx: number; ry: number } {
  return { rx: clamp(-d.dy, TILT.VISUAL_MAX_DEG) || 0, ry: clamp(d.dx, TILT.VISUAL_MAX_DEG) || 0 }; // -0 を 0 に
}

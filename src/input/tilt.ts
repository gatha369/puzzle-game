// 端末の傾き（DeviceOrientationEvent）で盤を傾ける。HTTPS（または localhost）でしか動かない
import type { Direction } from '../game/types.ts';
import { judgeTilt, tiltDelta, visualTilt, type Orientation } from './tiltLogic.ts';

type PermissionFn = () => Promise<'granted' | 'denied'>;
const requestPermission = (): PermissionFn | undefined =>
  typeof DeviceOrientationEvent === 'undefined'
    ? undefined
    : (DeviceOrientationEvent as unknown as { requestPermission?: PermissionFn }).requestPermission;

/** iOS：許可をボタンのタップ時にもらう必要がある */
export const tiltNeedsPermission = () => typeof requestPermission() === 'function';

/** 端末の本来の向き（スマホなら縦）のときだけ傾き操作を有効にする。画面が回るとセンサーの軸と画面の軸がずれるため */
export function isNaturalOrientation(): boolean {
  const angle = screen.orientation?.angle;
  return angle !== undefined ? angle === 0 : window.matchMedia('(orientation: portrait)').matches;
}

/**
 * 傾き操作に対応した端末なら onSupported を呼ぶ。
 * iOS は許可前にイベントが来ないので API の有無で、それ以外は実際に値が届いたかで判断する
 * （PC の Chrome などは API があっても値が来ない）。
 */
export function detectTiltSupport(onSupported: () => void) {
  if (typeof DeviceOrientationEvent === 'undefined') return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  if (tiltNeedsPermission()) { onSupported(); return; }
  const probe = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    window.removeEventListener('deviceorientation', probe);
    onSupported();
  };
  window.addEventListener('deviceorientation', probe);
}

export type TiltHandlers = {
  /** 1手を試みる。受け付けたら true（演出中などで受け付けなければ false） */
  onMove: (dir: Direction) => boolean;
  /** 盤の3D表示用の角度（null で水平に戻す） */
  onAngle: (angle: { rx: number; ry: number } | null) => void;
  /** 画面の向きが本来の向きになった／外れた */
  onOrientationChange: (natural: boolean) => void;
};

export class TiltControl {
  private base: Orientation | null = null; // null の間は次の値を水平とみなす
  private armed = true;
  private active = false;
  private natural = isNaturalOrientation();

  private h: TiltHandlers;

  constructor(handlers: TiltHandlers) {
    this.h = handlers;
    this.onOrientation = this.onOrientation.bind(this);
  }

  /** 許可をもらって開始。iOS ではタップ等の操作の中で呼ぶこと。開始できたら true */
  async enable(): Promise<boolean> {
    const ask = requestPermission();
    if (ask) {
      try {
        if ((await ask.call(DeviceOrientationEvent)) !== 'granted') return false;
      } catch {
        return false;
      }
    }
    if (!this.active) window.addEventListener('deviceorientation', this.onOrientation);
    this.active = true;
    this.level();
    return true;
  }

  disable() {
    window.removeEventListener('deviceorientation', this.onOrientation);
    this.active = false;
    this.h.onAngle(null);
  }

  /** 今の持ち方を水平とみなす */
  level() {
    this.base = null;
    this.armed = true;
  }

  private onOrientation(e: DeviceOrientationEvent) {
    if (e.beta === null || e.gamma === null) return;
    const natural = isNaturalOrientation();
    if (natural !== this.natural) {
      this.natural = natural;
      this.h.onOrientationChange(natural);
      if (natural) this.level(); else this.h.onAngle(null);
    }
    if (!natural) return;
    const now = { beta: e.beta, gamma: e.gamma };
    if (!this.base) this.base = now;
    const d = tiltDelta(now, this.base);
    this.h.onAngle(visualTilt(d));
    const j = judgeTilt(d, this.armed);
    this.armed = j.armed;
    // 演出中などで受け付けられなかったら armed のまま、次の値でもう一度試す
    if (j.dir && this.h.onMove(j.dir)) this.armed = false;
  }
}

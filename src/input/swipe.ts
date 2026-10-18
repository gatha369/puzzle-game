import type { Direction } from '../game/types.ts';

/** これより短い指の移動はスワイプとみなさない（px） */
const MIN_SWIPE_PX = 24;

export function bindSwipe(el: HTMLElement, onMove: (dir: Direction) => void) {
  let start: { x: number; y: number } | null = null;
  el.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_SWIPE_PX) return;
    onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
}

import type { Direction } from '../game/types.ts';

const KEYMAP: Record<string, Direction> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

/** 矢印キー・WASD で onMove、R で onReset */
export function bindKeyboard(onMove: (dir: Direction) => void, onReset: () => void) {
  document.addEventListener('keydown', (e) => {
    const d = KEYMAP[e.key] ?? KEYMAP[(e.key || '').toLowerCase()];
    if (d) { e.preventDefault(); onMove(d); }
    if (e.key === 'r' || e.key === 'R') onReset();
  });
}

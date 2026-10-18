// ヒントの表示：盤の上に大きな矢印を約1.6秒出し、対応する方向ボタンを光らせる（次の手を指すまで）
import type { Direction } from '../game/types.ts';
import { reduceMotion } from './boardView.ts';

/** 矢印を出しておく時間（動きを減らす設定では、動きがない分長めに見せる。試作と同じ値） */
const SHOW_MS = reduceMotion ? 2500 : 1600;

// 右向きのキャンディ縞の矢印。方向は外側の回転で変える
const ARROW_SVG = `<svg viewBox="0 0 140 120" aria-hidden="true">
  <defs>
    <linearGradient id="ha-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9fcb"/><stop offset="1" stop-color="#ff4f9a"/></linearGradient>
    <path id="ha-shape" d="M14 44H66V18L126 60L66 102V76H14Q6 76 6 68V52Q6 44 14 44Z"/>
    <clipPath id="ha-clip"><use href="#ha-shape"/></clipPath>
  </defs>
  <circle cx="66" cy="60" r="58" fill="#fff" opacity=".55"/>
  <use href="#ha-shape" fill="none" stroke="#d9478b" stroke-width="16" stroke-linejoin="round"/>
  <use href="#ha-shape" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>
  <use href="#ha-shape" fill="url(#ha-fill)"/>
  <g clip-path="url(#ha-clip)" stroke="#fff" stroke-width="7" opacity=".55">
    <path d="M0 40L30 100M22 40L52 100M44 10L84 100M66 10L106 100M88 10L128 100"/>
  </g>
  <path d="M18 50H62" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
  <path class="ha-spark" transform="translate(118 18) scale(1)" d="M0-10C1-2 2-1 10 0C2 1 1 2 0 10C-1 2-2 1-10 0C-2-1-1-2 0-10Z" fill="#ffd23f"/>
  <path class="ha-spark s2" transform="translate(22 104) scale(.7)" d="M0-10C1-2 2-1 10 0C2 1 1 2 0 10C-1 2-2 1-10 0C-2-1-1-2 0-10Z" fill="#4fd1b5"/>
</svg>`;

export class HintView {
  private timer = 0;
  private readonly arrow: HTMLElement;
  private readonly controls: HTMLElement;

  constructor(arrow: HTMLElement, controls: HTMLElement) {
    this.arrow = arrow;
    this.controls = controls;
    arrow.innerHTML = `<div class="ha-rot"><div class="ha-move">${ARROW_SVG}</div></div>`;
  }

  show(dir: Direction) {
    this.clear();
    const { arrow } = this;
    arrow.dataset.dir = dir;
    arrow.hidden = false;
    // 続けて押したときもアニメーションを最初からやり直す
    arrow.classList.remove('play');
    void arrow.offsetWidth;
    arrow.classList.add('play');
    this.controls.querySelector(`button[data-dir="${dir}"]`)?.classList.add('hinted');
    this.timer = window.setTimeout(() => { arrow.hidden = true; }, SHOW_MS);
  }

  /** 矢印もボタンの光も消す（次の手を指したとき・ステージを読み直したとき） */
  clear() {
    clearTimeout(this.timer);
    this.arrow.hidden = true;
    this.arrow.classList.remove('play');
    for (const b of this.controls.querySelectorAll('button.hinted')) b.classList.remove('hinted');
  }
}

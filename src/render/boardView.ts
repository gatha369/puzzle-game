// 盤面の DOM 描画と1手の演出（傾き→滑る→消える→戻る）。数値は docs/prototype.html のまま
import type { Board, Direction, StepResult } from '../game/index.ts';
import { injectMotifSprite, motifSvg } from './motifs.ts';

export const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, reduceMotion ? 0 : ms));

export class BoardView {
  private boxes = new Map<number, HTMLElement>(); // 盤面上の位置 → ボックス要素
  private width = 1;

  readonly el: HTMLElement;
  private cells: HTMLElement;
  private layer: HTMLElement;

  constructor(el: HTMLElement, cells: HTMLElement, layer: HTMLElement) {
    this.el = el;
    this.cells = cells;
    this.layer = layer;
    injectMotifSprite();
  }

  private placeBox(el: HTMLElement, pos: number) {
    el.style.setProperty('--x', String(pos % this.width));
    el.style.setProperty('--y', String(Math.floor(pos / this.width)));
  }

  build(board: Board) {
    const { el, cells, layer } = this;
    this.width = board.width;
    el.className = el.classList.contains('live') ? 'board live' : 'board'; // 傾き表示は引き継ぐ
    el.style.aspectRatio = `${board.width} / ${board.height}`;
    cells.style.gridTemplateColumns = `repeat(${board.width}, 1fr)`;
    cells.style.gridTemplateRows = `repeat(${board.height}, 1fr)`;
    layer.style.setProperty('--w', String(board.width));
    layer.style.setProperty('--h', String(board.height));
    cells.innerHTML = '';
    layer.innerHTML = '';
    this.boxes = new Map();
    board.cells.forEach((cell, i) => {
      const c = document.createElement('div');
      c.className = 'cell' + (cell.type === 'wall' ? ' wall' : '');
      cells.appendChild(c);
      if (cell.type === 'box') {
        const box = document.createElement('div');
        box.className = 'box ' + cell.color;
        box.innerHTML = `<i>${motifSvg(cell.color)}</i>`;
        box.style.transitionDuration = '0ms';
        this.placeBox(box, i);
        layer.appendChild(box);
        this.boxes.set(i, box);
      }
    });
  }

  /** 動かない方向でも少しだけ傾けて手応えを返す */
  async bump(dir: Direction) {
    this.el.classList.add('tilt-' + dir);
    await wait(160);
    this.el.classList.remove('tilt-' + dir);
    await wait(120);
  }

  /** 1手の演出。終わったら resolve する */
  async play(r: StepResult, dir: Direction) {
    const boardEl = this.el;

    // 1. 盤を傾ける
    boardEl.classList.add('tilt-' + dir);
    await wait(110);

    // 2. ボックスを滑らせる（距離が長いほど時間がかかる）
    let longest = 0;
    const moved = new Map<number, HTMLElement>();
    for (const [from, el] of this.boxes) {
      const m = r.moves.get(from)!;
      const dur = m.dist ? 90 + m.dist * 55 : 0;
      longest = Math.max(longest, dur);
      el.style.transitionDuration = dur + 'ms';
      this.placeBox(el, m.to);
      if (m.dist) {
        setTimeout(() => { el.classList.remove('land'); void el.offsetWidth; el.classList.add('land'); }, reduceMotion ? 0 : dur);
      }
      moved.set(m.to, el);
    }
    this.boxes = moved;
    await wait(longest + 60);

    // 3. 揃った塊を消す
    if (r.groups.length) {
      const pops = r.groups.flat();
      for (const p of pops) this.boxes.get(p)!.classList.add('pop');
      await wait(340);
      for (const p of pops) { this.boxes.get(p)!.remove(); this.boxes.delete(p); }
    }

    // 4. 盤を戻す
    boardEl.classList.remove('tilt-' + dir);
    await wait(120);
  }

  /** 端末の傾きに合わせた表示（null で解除）。角度は度、上限は呼び出し側で制限済み */
  setLiveTilt(angle: { rx: number; ry: number } | null) {
    if (reduceMotion || !angle) {
      this.el.classList.remove('live');
      return;
    }
    this.el.classList.add('live');
    this.el.style.setProperty('--live-rx', angle.rx.toFixed(2) + 'deg');
    this.el.style.setProperty('--live-ry', angle.ry.toFixed(2) + 'deg');
  }
}

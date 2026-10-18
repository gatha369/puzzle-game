// 星・紙吹雪・花火のパーティクル。画面全体を覆う canvas 1枚に描く
// スマホで 60fps を保つため、数に上限を設け、影ぼかし等の重い描画は使わない

/** 同時に存在できる粒の上限 */
export const MAX_PARTICLES = 450;
/** canvas の解像度倍率の上限（高解像度端末で描画が重くなりすぎないように） */
const MAX_DPR = 2;
const GRAVITY = 900; // px/s²

export const CANDY_COLORS = ['#ff6fae', '#ffd23f', '#4fd1b5', '#62b1ff', '#c25ef0', '#ff4d5e'];

type Kind = 'star' | 'confetti' | 'spark' | 'rocket';
type P = {
  kind: Kind;
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number;
  rot: number; vr: number; color: string;
  gravity: number; drag: number;
  burstColors?: string[];
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: readonly T[]) => arr[(Math.random() * arr.length) | 0];

// 半径1の5角星（毎回パスを作らないように使い回す）
const STAR = (() => {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    if (i) p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.closePath();
  return p;
})();

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private list: P[] = [];
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private timers: number[] = [];
  private readonly canvas: HTMLCanvasElement;
  private readonly enabled: boolean;

  constructor(canvas: HTMLCanvasElement, enabled: boolean) {
    this.canvas = canvas;
    this.enabled = enabled;
    this.ctx = canvas.getContext('2d')!;
    this.frame = this.frame.bind(this);
  }

  private add(p: P) {
    if (this.list.length >= MAX_PARTICLES) return;
    this.list.push(p);
    if (!this.raf) {
      this.resize();
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private resize() {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** ブロックが消えるとき：中心から星がはじけて飛び散る */
  burst(x: number, y: number, color: string, count = 7, speed = 260) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
      const v = rand(0.5, 1) * speed;
      this.add({
        kind: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.35,
        life: 0, max: rand(0.5, 0.8), size: rand(5, 9), rot: rand(0, 6), vr: rand(-8, 8),
        color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffe066' : color, gravity: GRAVITY * 0.7, drag: 2.2,
      });
    }
  }

  /** 紙吹雪：画面の上から降らせる */
  confetti(count: number, spreadMs = 900) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.later(rand(0, spreadMs), () => this.add({
        kind: 'confetti', x: rand(0, this.w || window.innerWidth), y: rand(-40, -10), vx: rand(-40, 40), vy: rand(60, 200),
        life: 0, max: rand(2.6, 3.6), size: rand(5, 8), rot: rand(0, 6), vr: rand(-10, 10),
        color: pick(CANDY_COLORS), gravity: 120, drag: 0.6,
      }));
    }
  }

  /** 花火：下から打ち上げて、上空で色とりどりに開く */
  fireworks(count: number, spreadMs = 1800) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.later((i / count) * spreadMs + rand(0, 150), () => {
        const w = this.w || window.innerWidth, h = this.h || window.innerHeight;
        const c = pick(CANDY_COLORS);
        this.add({
          kind: 'rocket', x: rand(w * 0.15, w * 0.85), y: h + 10, vx: rand(-40, 40), vy: -rand(h * 0.9, h * 1.15),
          life: 0, max: rand(0.65, 0.85), size: 3, rot: 0, vr: 0, color: '#fff8d6', gravity: GRAVITY * 0.6, drag: 0.4,
          burstColors: [c, c, '#ffffff', pick(CANDY_COLORS)],
        });
      });
    }
  }

  /** 小さなキラキラ：要素のまわりに星をふわっと出す */
  sparkles(rect: DOMRect, count: number) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.later(rand(0, 700), () => this.add({
        kind: 'star', x: rand(rect.left, rect.right), y: rand(rect.top, rect.bottom), vx: rand(-30, 30), vy: rand(-80, -20),
        life: 0, max: rand(0.6, 1), size: rand(4, 7), rot: rand(0, 6), vr: rand(-4, 4),
        color: pick(['#ffe066', '#ffffff', '#ffd23f']), gravity: 0, drag: 1,
      }));
    }
  }

  /** 予約中の演出も含めてすべて消す（ステージを読み直したときなど） */
  clear() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.list = [];
  }

  private later(ms: number, fn: () => void) {
    const t = window.setTimeout(() => { this.timers = this.timers.filter((x) => x !== t); fn(); }, ms);
    this.timers.push(t);
  }

  private explode(r: P) {
    const n = 34;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = rand(140, 260);
      this.add({
        kind: 'spark', x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0, max: rand(0.9, 1.3), size: rand(2, 3.2), rot: 0, vr: 0,
        color: pick(r.burstColors!), gravity: 160, drag: 1.4,
      });
    }
    for (let i = 0; i < 6; i++) this.burst(r.x, r.y, pick(r.burstColors!), 1, 200);
  }

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000); // タブ復帰時などに一気に進みすぎないように
    this.last = now;
    if (this.canvas.width !== Math.round(window.innerWidth * Math.min(MAX_DPR, window.devicePixelRatio || 1))) this.resize();
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);

    const alive: P[] = [];
    // for...of は途中で追加された粒（花火が開いた火花）も同じフレームで順に処理する
    for (const p of this.list) {
      p.life += dt;
      if (p.kind === 'rocket' && (p.life >= p.max || p.vy > -60)) { this.explode(p); continue; }
      if (p.life >= p.max) continue;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy = p.vy * k + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > this.h + 40) continue;
      alive.push(p);
    }
    this.list = alive;

    for (const p of alive) {
      const t = p.life / p.max;
      ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      ctx.fillStyle = p.color;
      if (p.kind === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.size, p.size);
        ctx.fill(STAR);
        ctx.restore();
      } else if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x + Math.sin(p.life * 6 + p.rot) * 8, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.life * 9 + p.rot)); // ひらひら裏返る
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.kind === 'rocket' ? p.size : p.size * (1 - t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (alive.length) this.raf = requestAnimationFrame(this.frame);
    else { this.raf = 0; ctx.clearRect(0, 0, this.w, this.h); }
  }
}

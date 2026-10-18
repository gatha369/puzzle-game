// クリア画面。メダルに応じて段階をつける
//   金：大きな王冠と PERFECT!、花火＋紙吹雪を画面全体に
//   銀：GREAT!、紙吹雪と星
//   銅：CLEAR!、小さめのキラキラ
import type { Medal } from '../storage/medals.ts';
import type { Particles } from './particles.ts';

const TITLE: Record<Medal, string> = { gold: 'PERFECT!', silver: 'GREAT!', bronze: 'CLEAR!' };
const LABEL: Record<Medal, string> = { gold: '金賞', silver: '銀賞', bronze: '銅賞' };
const MEDAL_COLORS: Record<Medal, [light: string, base: string, dark: string]> = {
  gold: ['#fff1a8', '#f7c51e', '#c48a00'],
  silver: ['#ffffff', '#c9d3de', '#8695a6'],
  bronze: ['#ffd2a8', '#d9894a', '#9c5524'],
};

function medalSvg(medal: Medal): string {
  const [l, b, d] = MEDAL_COLORS[medal];
  return `<svg viewBox="0 0 100 120" aria-hidden="true">
    <defs><radialGradient id="cm-${medal}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${l}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs>
    <path d="M30 0H48L56 40H38Z" fill="#ff6fae"/><path d="M70 0H52L44 40H62Z" fill="#62b1ff"/>
    <circle cx="50" cy="74" r="38" fill="url(#cm-${medal})" stroke="${d}" stroke-width="4"/>
    <circle cx="50" cy="74" r="28" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>
    <path transform="translate(50 74) scale(16)" d="M0-1L.29-.4L.95-.31L.48.15L.59.81L0 .5L-.59.81L-.48.15L-.95-.31L-.29-.4Z" fill="#fff" opacity=".9"/>
    <ellipse cx="36" cy="58" rx="9" ry="5" transform="rotate(-35 36 58)" fill="#fff" opacity=".6"/>
  </svg>`;
}

const CROWN = `<svg class="crown" viewBox="0 0 120 80" aria-hidden="true">
  <path d="M10 70L4 18L36 42L60 6L84 42L116 18L110 70Z" fill="#ffd23f" stroke="#c48a00" stroke-width="4" stroke-linejoin="round"/>
  <rect x="10" y="62" width="100" height="12" rx="4" fill="#f7b500" stroke="#c48a00" stroke-width="4"/>
  <circle cx="60" cy="44" r="7" fill="#ff4d5e"/><circle cx="34" cy="52" r="5" fill="#62b1ff"/><circle cx="86" cy="52" r="5" fill="#3fd473"/>
  <circle cx="4" cy="18" r="5" fill="#fff" stroke="#c48a00" stroke-width="3"/><circle cx="60" cy="6" r="5" fill="#fff" stroke="#c48a00" stroke-width="3"/><circle cx="116" cy="18" r="5" fill="#fff" stroke="#c48a00" stroke-width="3"/>
</svg>`;

export type ClearInfo = { medal: Medal; moves: number; par: number; hasNext: boolean };

export class Celebrate {
  private readonly root: HTMLElement;
  private readonly fx: Particles;

  constructor(root: HTMLElement, fx: Particles) {
    this.root = root;
    this.fx = fx;
  }

  show({ medal, moves, par, hasNext }: ClearInfo) {
    const q = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;
    this.root.dataset.medal = medal;
    q('.cel-crown').innerHTML = medal === 'gold' ? CROWN : '';
    q('.cel-title').textContent = TITLE[medal];
    q('.cel-medal').innerHTML = medalSvg(medal);
    q('.cel-label').textContent = LABEL[medal];
    q('.cel-moves').innerHTML = `<b>${moves}</b>手 ／ お手本 <b>${par}</b>手`;
    q('.cel-text').textContent = medal === 'gold'
      ? 'お手本どおりの最短手数です！'
      : `あと${moves - par}手 短くできます。`;
    q('#retryBtn').textContent = medal === 'gold' ? 'もう一度' : 'もう一度（金を狙う）';
    q('#nextBtn').hidden = !hasNext;
    this.root.hidden = false;
    (hasNext ? q<HTMLButtonElement>('#nextBtn') : q<HTMLButtonElement>('#retryBtn')).focus({ preventScroll: true });

    // カードが出てから粒を飛ばす
    const card = q('.cel-card').getBoundingClientRect();
    if (medal === 'gold') {
      this.fx.fireworks(7, 2200);
      this.fx.confetti(160, 1400);
      this.fx.burst(card.left + card.width / 2, card.top + card.height * 0.3, '#ffd23f', 24, 420);
    } else if (medal === 'silver') {
      this.fx.confetti(90, 1000);
      this.fx.burst(card.left + card.width / 2, card.top + card.height * 0.3, '#c9d3de', 18, 340);
    } else {
      this.fx.sparkles(card, 18);
    }
  }
}

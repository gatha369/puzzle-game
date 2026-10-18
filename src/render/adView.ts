// 宣伝テキストの表示。1行のテキストリンクで、収まらないときだけゆっくり横に流す（動きは docs/prototype.html のまま）
import { MESSAGES, pickAd, type AdMessage } from '../ads/ads.ts';
import { reduceMotion } from './boardView.ts';

export class AdView {
  private last = -1;
  private readonly link: HTMLAnchorElement;
  private readonly track: HTMLElement;
  private readonly text: HTMLElement;

  constructor(link: HTMLAnchorElement) {
    this.link = link;
    this.track = link.querySelector<HTMLElement>('.ad-track')!;
    this.text = link.querySelector<HTMLElement>('.ad-text')!;
    // 画面の向きが変わったときや、Webフォントが読み込まれて幅が変わったときに測り直す
    window.addEventListener('resize', () => this.fit());
    document.fonts?.ready.then(() => this.fit());
  }

  /** ランダムに1文選んで表示する（ステージを読み込むたびに呼ぶ） */
  next() {
    if (!MESSAGES.length) { this.link.hidden = true; return; }
    this.last = pickAd(MESSAGES, this.last);
    const ad = MESSAGES[this.last];
    this.link.href = ad.url;
    this.text.textContent = ad.text;
    this.text.classList.remove('fadein');
    void this.text.offsetWidth;
    this.text.classList.add('fadein');
    this.fit();
  }

  /**
   * ポップアップ用に1文選ぶ。盤面の上に出ている事業とは別の事業になる。
   * 試作と同じく「直前に出した文」として覚えるので、次のステージの1行もこの事業とは別になる
   */
  pickForPopup(): AdMessage | null {
    if (!MESSAGES.length) return null;
    this.last = pickAd(MESSAGES, this.last);
    return MESSAGES[this.last];
  }

  /** 1行に収まらないときだけ流す。動きを減らす設定では流さず、CSS で「…」にする */
  private fit() {
    const { track, text } = this;
    track.classList.remove('scroll');
    if (reduceMotion) return;
    requestAnimationFrame(() => {
      const shift = text.scrollWidth - track.clientWidth;
      if (shift > 4) {
        track.style.setProperty('--ad-shift', shift + 8 + 'px');
        track.style.setProperty('--ad-dur', Math.max(8, shift / 18 + 6) + 's');
        track.classList.add('scroll');
      }
    });
  }
}

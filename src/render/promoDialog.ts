// ヒント時のPRポップアップ。閉じ方（✕・「ヒントを見る」・外側・Esc・宣伝文のリンク）はどれでも onClose を呼ぶ
import type { AdMessage } from '../ads/ads.ts';

export class PromoDialog {
  private onClose: (() => void) | null = null;
  private lastFocus: HTMLElement | null = null;
  private readonly root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    const q = (sel: string) => root.querySelector<HTMLElement>(sel)!;
    q('.promo-close').addEventListener('click', () => this.close());
    q('.promo-go').addEventListener('click', () => this.close());
    root.addEventListener('click', (e) => { if (e.target === root) this.close(); }); // 外側をタップ
    // サイトを新しいタブで開いたら、こちらも閉じておく（戻ってきたときにはヒントが出ている）
    q('.promo-link').addEventListener('click', () => setTimeout(() => this.close(), 0));
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
  }

  get isOpen() {
    return this.onClose !== null;
  }

  open(ad: AdMessage, onClose: () => void) {
    const link = this.root.querySelector<HTMLAnchorElement>('.promo-link')!;
    link.href = ad.url;
    this.root.querySelector('.promo-text')!.textContent = ad.text;
    this.onClose = onClose;
    this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.root.hidden = false;
    this.root.querySelector<HTMLElement>('.promo-close')!.focus({ preventScroll: true });
  }

  close() {
    const cb = this.onClose;
    if (!cb) return;
    this.onClose = null;
    this.root.hidden = true;
    this.lastFocus?.focus({ preventScroll: true }); // 元のボタンに戻す
    cb();
  }
}

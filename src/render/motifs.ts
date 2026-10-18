// ブロックと特殊な床の SVG モチーフ。色だけでなく形でも区別できるようにする
// グラデーションとシンボルはページに1つだけ置き（スプライト）、各ブロックは <use> で参照する
import type { Color } from '../game/types.ts';

/** 色の代わりに '*' でレインボーキャンディ */
export type Motif = Color | '*';

export const MOTIF_NAMES: Record<Motif, string> = {
  R: 'ロリポップ',
  B: '宝石',
  G: '魔法のステッキ',
  Y: 'キャンディ',
  P: 'ハートのジュエリー',
  '*': 'レインボーキャンディ',
};

// 足元の影（全モチーフ共通）
const SHADOW = '<ellipse cx="50" cy="94" rx="24" ry="4" fill="rgba(60,20,50,.18)"/>';
// 4枚羽のキラキラ
const sparkle = (x: number, y: number, s: number) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0-10C1 -2 2-1 10 0 2 1 1 2 0 10-1 2-2 1-10 0-2-1-1-2 0-10Z" fill="#fff"/>`;

// レインボーキャンディの渦巻き：中心から縁へ曲がりながら広がる6枚の羽根
const RAINBOW = ['#ff4d5e', '#ff9f43', '#ffd23f', '#3fd473', '#62b1ff', '#c25ef0'];
const swirl = (cx: number, cy: number, r: number) => RAINBOW.map((color, i) => {
  const pt = (deg: number, rr: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  };
  const a0 = i * 60 - 90, a1 = a0 + 60;
  return `<path d="M${cx} ${cy}Q${pt(a0 - 40, r * 0.62)} ${pt(a0, r)}A${r} ${r} 0 0 1 ${pt(a1, r)}Q${pt(a1 - 40, r * 0.62)} ${cx} ${cy}Z" fill="${color}"/>`;
}).join('');

// 正六角形のハニカム（はちみつ床の下地）
const HEX = 'M10 0L20 5.77V17.32L10 23.09L0 17.32V5.77Z';

const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>
    <radialGradient id="mg-R" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffa3a3"/><stop offset=".55" stop-color="#ff4d5e"/><stop offset="1" stop-color="#d81e3c"/></radialGradient>
    <linearGradient id="mg-stick" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e9dbe3"/></linearGradient>
    <radialGradient id="mg-G" cx=".42" cy=".35" r=".7"><stop offset="0" stop-color="#b6ffc8"/><stop offset=".6" stop-color="#3fd473"/><stop offset="1" stop-color="#1c9e4e"/></radialGradient>
    <radialGradient id="mg-Y" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fff6b8"/><stop offset=".6" stop-color="#ffd23f"/><stop offset="1" stop-color="#f2a900"/></radialGradient>
    <linearGradient id="mg-Yw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a6"/><stop offset="1" stop-color="#ffcc33"/></linearGradient>
    <radialGradient id="mg-P" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f6c2ff"/><stop offset=".55" stop-color="#c25ef0"/><stop offset="1" stop-color="#8a26c4"/></radialGradient>
    <clipPath id="mc-Y"><ellipse cx="50" cy="50" rx="24" ry="21"/></clipPath>
    <radialGradient id="mg-rb" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a1f7a" stop-opacity=".25"/></radialGradient>
    <linearGradient id="mg-comb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c2"/><stop offset="1" stop-color="#ffd978"/></linearGradient>
    <radialGradient id="mg-honey" cx=".4" cy=".32" r=".8"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#ffb81f"/><stop offset="1" stop-color="#e08a00"/></radialGradient>
    <pattern id="mp-comb" width="20" height="34.64" patternUnits="userSpaceOnUse" patternTransform="translate(-4 -6)">
      <path d="${HEX}M10 23.09V34.64" fill="none" stroke="#efb23a" stroke-width="1.6" opacity=".55"/>
    </pattern>
  </defs>

  <symbol id="motif-R" viewBox="0 0 100 100">
    ${SHADOW}
    <rect x="45.5" y="60" width="9" height="34" rx="4.5" fill="url(#mg-stick)" stroke="#d9bfcd" stroke-width="1.5"/>
    <circle cx="50" cy="40" r="34" fill="url(#mg-R)" stroke="#b5122e" stroke-width="2.5"/>
    <path d="M50 40a3 3 0 0 1 6 0a6 6 0 0 1-12 0a9 9 0 0 1 18 0a12 12 0 0 1-24 0a15 15 0 0 1 30 0a18 18 0 0 1-36 0a21 21 0 0 1 42 0"
      fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" opacity=".92"/>
    <ellipse cx="33" cy="22" rx="9" ry="5" transform="rotate(-35 33 22)" fill="#fff" opacity=".75"/>
    <circle cx="24" cy="33" r="2.6" fill="#fff" opacity=".7"/>
  </symbol>

  <symbol id="motif-B" viewBox="0 0 100 100">
    ${SHADOW}
    <polygon points="10,38 30,38 50,88" fill="#3b8de8"/>
    <polygon points="30,38 70,38 50,88" fill="#62b1ff"/>
    <polygon points="70,38 90,38 50,88" fill="#1d63c9"/>
    <polygon points="10,38 30,16 38,38" fill="#8ccbff"/>
    <polygon points="30,16 70,16 62,38 38,38" fill="#c6e8ff"/>
    <polygon points="70,16 90,38 62,38" fill="#5aa6f4"/>
    <polygon points="30,16 70,16 90,38 50,88 10,38" fill="none" stroke="#174fa8" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 38H90" stroke="#174fa8" stroke-width="1.5" opacity=".5"/>
    ${sparkle(36, 26, 0.75)}
    ${sparkle(70, 62, 0.45)}
  </symbol>

  <symbol id="motif-G" viewBox="0 0 100 100">
    ${SHADOW}
    <path d="M16 88L50 54" stroke="#167a3c" stroke-width="12" stroke-linecap="round"/>
    <path d="M16 88L50 54" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <path d="M24 80l5-5M33 71l5-5M42 62l5-5" stroke="#3fd473" stroke-width="7"/>
    <polygon points="60,10 67.6,29.5 88.5,30.7 72.4,44 77.6,64.3 60,53 42.4,64.3 47.6,44 31.5,30.7 52.4,29.5"
      fill="url(#mg-G)" stroke="#147a3a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="54" cy="31" rx="6" ry="3.5" transform="rotate(-25 54 31)" fill="#fff" opacity=".8"/>
    ${sparkle(22, 22, 0.6)}
    ${sparkle(90, 76, 0.45)}
  </symbol>

  <symbol id="motif-Y" viewBox="0 0 100 100">
    ${SHADOW}
    <path d="M33 50L10 30Q15 36 6 40Q13 46 4 50Q13 54 6 60Q15 64 10 70Z" fill="url(#mg-Yw)" stroke="#c98a00" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M67 50L90 30Q85 36 94 40Q87 46 96 50Q87 54 94 60Q85 64 90 70Z" fill="url(#mg-Yw)" stroke="#c98a00" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="50" cy="50" rx="24" ry="21" fill="url(#mg-Y)"/>
    <g clip-path="url(#mc-Y)" stroke="#fff" stroke-width="5" opacity=".65">
      <path d="M20 24L40 78M34 24L54 78M48 24L68 78M62 24L82 78"/>
    </g>
    <ellipse cx="50" cy="50" rx="24" ry="21" fill="none" stroke="#c98a00" stroke-width="2.5"/>
    <ellipse cx="41" cy="39" rx="7" ry="4" transform="rotate(-20 41 39)" fill="#fff" opacity=".85"/>
  </symbol>

  <symbol id="motif-P" viewBox="0 0 100 100">
    ${SHADOW}
    <path d="M50 86C20 66 8 50 8 34C8 20 19 12 30 12C40 12 46 18 50 26C54 18 60 12 70 12C81 12 92 20 92 34C92 50 80 66 50 86Z"
      fill="url(#mg-P)" stroke="#6d1a99" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 26V86M8 34L50 46L92 34M30 12L50 46L70 12" fill="none" stroke="#fff" stroke-width="1.5" opacity=".45"/>
    <ellipse cx="27" cy="27" rx="9" ry="5" transform="rotate(-35 27 27)" fill="#fff" opacity=".75"/>
    ${sparkle(76, 26, 0.5)}
  </symbol>

  <symbol id="motif-rainbow" viewBox="0 0 100 100">
    ${SHADOW}
    <circle cx="50" cy="48" r="37" fill="#fff" stroke="#8a3fbf" stroke-width="2.5"/>
    ${swirl(50, 48, 33)}
    <circle cx="50" cy="48" r="33" fill="url(#mg-rb)"/>
    <circle cx="50" cy="48" r="35" fill="none" stroke="#fff" stroke-width="3"/>
    <circle cx="50" cy="48" r="37" fill="none" stroke="#8a3fbf" stroke-width="2.5"/>
    <path transform="translate(50 48) scale(13)" d="M0-1L.29-.4L.95-.31L.48.15L.59.81L0 .5L-.59.81L-.48.15L-.95-.31L-.29-.4Z"
      fill="#fff" stroke="#8a3fbf" stroke-width=".12" stroke-linejoin="round"/>
    <ellipse cx="33" cy="28" rx="10" ry="5.5" transform="rotate(-35 33 28)" fill="#fff" opacity=".8"/>
    ${sparkle(86, 14, 0.6)}
    ${sparkle(12, 80, 0.45)}
  </symbol>

  <symbol id="floor-honey" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="url(#mg-comb)"/>
    <rect width="100" height="100" fill="url(#mp-comb)"/>
    <!-- 下にたまったはちみつ -->
    <ellipse cx="54" cy="86" rx="40" ry="11" fill="url(#mg-honey)" stroke="#c97800" stroke-width="2"/>
    <ellipse cx="42" cy="83" rx="12" ry="3" fill="#fff" opacity=".5"/>
    <!-- 上の縁から垂れるはちみつ -->
    <path d="M0 0H100V30C96 30 93 34 93 42C93 50 85 50 85 42C85 34 81 29 74 31C66 33 66 50 63 60C60 69 51 68 51 59C51 48 47 37 39 37C31 37 31 47 27 47C22 47 22 35 15 33C8 31 6 40 0 40Z"
      fill="url(#mg-honey)" stroke="#c97800" stroke-width="2"/>
    <path d="M8 18C30 12 62 12 92 18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="57" cy="56" rx="2.2" ry="4" fill="#fff" opacity=".6"/>
    <!-- 落ちるしずく -->
    <path d="M27 58C27 58 22 65 22 68A5 5 0 0 0 32 68C32 65 27 58 27 58Z" fill="url(#mg-honey)" stroke="#c97800" stroke-width="1.5"/>
  </symbol>
</svg>`;

let injected = false;

/** モチーフのスプライトをページに1度だけ差し込む */
export function injectMotifSprite() {
  if (injected) return;
  injected = true;
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
}

/** ブロック1個分の SVG */
export function motifSvg(motif: Motif): string {
  const id = motif === '*' ? 'rainbow' : motif;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${MOTIF_NAMES[motif]}"><use href="#motif-${id}"/></svg>`;
}

/** はちみつ床1マス分の SVG（マス全体に広げる） */
export function honeySvg(): string {
  return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><use href="#floor-honey"/></svg>';
}

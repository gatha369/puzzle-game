# 色寄せパズル

盤を傾けてお菓子をいっせいに滑らせ、同じ色を上下左右に3個以上くっつけて消すパズル。全部消せばクリア。お手本（最短）手数ちょうどで金メダル。全32面で、9面からレインボーキャンディ、13面からはちみつ床が登場する。

- 仕様書：[docs/SPEC.md](docs/SPEC.md)
- ルールと1手の演出を確定させた試作：[docs/prototype.html](docs/prototype.html)（ブラウザで直接開ける）

## 動かし方

Node.js 22.12 以上（`verify-stages` は 23.6 以上）が必要です。

```sh
npm install          # 初回だけ。必要なパッケージを node_modules に入れる
npm run dev          # 開発サーバーを起動 → http://localhost:5173/ を開く（Ctrl+C で終了）
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー。保存すると画面が自動で更新される |
| `npm run dev -- --host` | 同じ Wi-Fi のスマホからも開けるようにする（表示される Network の URL を開く） |
| `npm test` | Vitest でテスト（移動・消去・レインボー・はちみつ・ソルバー・ヒント・メダル・傾き判定・BGM の楽譜） |
| `npm run verify-stages` | 全ステージを解き、最短手数を `src/stages/stages.json` の `par` に書き込む |
| `npm run build` | 型チェックして、公開用のファイルを `dist/` に作る |
| `npm run preview` | `dist/` を手元で確認する |

## ステージを追加・変更するとき

1. `src/stages/stages.json` に追加する。`par` は 0 のままでよい
   - `grid`（お菓子の層）：`.` 空き、`#` 壁、`R G B Y P` お菓子、`*` レインボーキャンディ
   - `floor`（床の層、省略可）：`.` 普通、`h` はちみつ床
   - `intro`（省略可）：`rainbow` / `honey` / `both` のとき、最初の1手まで新アイテムの紹介を出す
2. `npm run verify-stages` で解けることを確認し、`par` を自動で書き込む
3. `npm test` を通す（ステージの最短手順を固定したテストがあるので、変えたステージは `tests/solver.test.ts` も更新する）

## フォルダ構成

```
src/
  game/      盤面・移動・消去・クリア判定（DOM に依存しない純粋関数）
  solver/    BFS ソルバー、詰み判定
  stages/    ステージ JSON
  render/    DOM 描画・1手の演出・お菓子の SVG・パーティクル・クリア画面
  input/     スワイプ・キー入力・端末の傾き（しきい値は tiltConfig.ts）
  audio/     Web Audio で合成した BGM（song.ts が楽譜）と効果音（sfx.ts の表）
  storage/   メダルと設定の保存（localStorage）
scripts/verify-stages.ts
tests/
```

## 公開（Vercel）

`main` ブランチに push すると、Vercel が自動でテスト → ビルド → 公開する（設定は `vercel.json`）。

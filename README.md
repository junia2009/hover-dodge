# HOVER DODGE

> 壁と敵をよけ続けろ — ネオン・サイバーパンク調のフラッピーバード系回避ゲーム。

Three.js + WebGL で描画する一画面・タップで遊べるアーケードシューターです。ブラウザだけで動き、PWA としてホーム画面に追加すればオフラインでもプレイできます。

[![Play](https://img.shields.io/badge/play-online-00e8ff?style=flat-square)](#) ![Version](https://img.shields.io/badge/version-1.0.9-aa44ff?style=flat-square)

---

## 🎮 遊び方

- **タップ / SPACE** — 自機を上昇させる（重力で落ちる）
- **PULSE / `Z`** — 範囲攻撃。クールダウン中の敵を一掃
- **`M`** — 効果音 ON / OFF
- **`ESC`** — ゲームオーバー画面からタイトルへ
- スコア = 生存秒数 + 各種ボーナス（後述）

ゴールはひたすら長く生き残ること。死んだら即 `RETRY` ボタンでやり直し、自己ベストはローカルに保存されます。

## 📈 フェーズ進行

スコアに応じて4段階に難易度が変化します。

| Phase | スコア帯 | 内容 |
| :---: | :---: | --- |
| **1** | 0 – 20 sec | `WALLS` 壁のみ。練習フェーズ |
| **2** | 20 – 50 sec | `BULLETS` プラズマ弾型の敵が登場 |
| **3** | 50 – 100 sec | `SEEKERS` 追跡型シーカーが混入 |
| **4** | 100 sec +  | `CHAOS` 全敵 + 最高速度 |

フェーズ遷移時にはバナーと SE が再生されます。縦画面のタイトルでは自己ベストと**到達済みフェーズ**が可視化されます。

## 🎁 スコア・ボーナス

| アクション | ボーナス |
| --- | :---: |
| 壁スレスレ通過（隙間中央から外側 30 % 以内） | **+10** |
| 極スレスレ通過（隙間中央から外側 15 % 以内） | **+25 NEAR!** |
| PULSE で `BULLET` 撃破 | **+15** |
| PULSE で `SEEKER` 撃破 | **+20** |
| ノーパルス継続（5秒以上） | `PURIST` 表示 |

時間スコアと合算され、自己ベスト（秒）として記録されます。

## 🛠 技術スタック

- **Three.js** (r160) — シーン / ジオメトリ / ライティング / ポストプロセス（Bloom）
- **Vanilla JS (ES Modules)** — ゲームロジック、入力、状態管理
- **Canvas 2D** — HUD オーバーレイ
- **Web Audio API** — シンセ系SE（flap / pulse / hit / milestone / phase-up）の動的生成
- **CSS Animations** — タイトル・ロゴ・縦画面オーバーレイ全般
- **Service Worker** — オフライン / PWA 対応（`hoverdodge-vX.Y.Z` キャッシュキー）
- **localStorage** — `hd_hi`（自己ベスト）/ `hd_mute`（音設定）

シングルファイル構成（`index.html` に CSS / JS 全部入り）で、依存は CDN の Three.js のみ。

## ⚙️ 開発・実行

ローカルで動かす場合は静的サーバを立てるだけ：

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .
```

ブラウザで `http://localhost:8080` を開く。

> ⚠️ Service Worker は `file://` プロトコルでは動きません。動作確認は必ず HTTP 経由で。

### ファイル構成

```
hover-dodge/
├── index.html       ← ゲーム本体（HTML + CSS + JS）
├── sw.js            ← Service Worker（オフラインキャッシュ）
├── manifest.json    ← PWA マニフェスト
├── icon.svg         ← ベクターアイコン
├── icon-192.png     ← PWA アイコン (192x192)
├── icon-512.png     ← PWA アイコン (512x512)
├── make-icons.html  ← アイコン生成用補助ページ
└── README.md
```

### バージョン管理

リリースごとに以下を同時に更新します：

- `index.html` 内 `<p class="rot-version">SYS_REV  X.Y.Z</p>`
- `sw.js` 内 `const CACHE = 'hoverdodge-vX.Y.Z';`

SW キャッシュキーを上げることで、既存 PWA ユーザーに新版が確実に配信されます。

## 🎨 ビジュアル特徴

- **ネオン・グロー** — UnrealBloomPass による HDR 発光
- **シップ** — Bezier 曲線で構築された船体・翼・コクピット
- **壁** — マゼンタ系ネオン + パルスエッジ
- **敵 2 種** — `BULLET`（リング付きプラズマ球）/ `SEEKER`（追跡矢印型）
- **PULSE** — 二重拡張リング + バーストスパーク
- **背景** — スターフィールド + ニュアンスネビュラ + 動的グリッド + スピードライン
- **縦画面待機** — ブランドロゴ + タクティカルスコープ + フェーズ進行表示

## 📱 対応環境

- iOS Safari 15.4+ / Chrome / Edge / Firefox
- 横画面（landscape）専用 — 縦持ち時はオーバーレイで誘導
- Safe Area（ノッチ・ホームインジケーター）対応
- 60 / 120 / 144 Hz 端末で同一の難易度（dt ベースのタイムステップ）

## 📜 履歴（主なリリース）

| Version | 内容 |
| :---: | --- |
| **1.0.9** | iOS Safari dvh 揺れによる縦画面ジッタ修正 |
| **1.0.8** | PULSE ボタンを 60→78 px に拡大、タップ時 scale フィードバック |
| **1.0.7** | フェーズ 2 以降で敵が出ない不具合修正 |
| **1.0.6** | 縦画面を BEST 記録 / フェーズタイムライン中心の意味あるUIに |
| **1.0.5** | 縦画面に safe-area 対応 + タクティカルスコープ装飾 |
| **1.0.4** | 縦画面をサイバーパンク HUD 調にリデザイン |
| **1.0.3** | GAME OVER に明示的な RETRY ボタン |
| **1.0.2** | GAME OVER に TITLE ボタン（モバイル対応） |
| **1.0.1** | dt タイムステップ / 4フェーズ制 / SE / 即リトライ / スコアボーナス |
| **1.0.0** | 初回リリース |

## 📄 ライセンス

ご自由にお使いください。

---

*Made with ✨ Three.js + WebAudio + ❤️*

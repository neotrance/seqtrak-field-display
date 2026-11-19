# SEQTRAK Field Display

## English

A prototype for an external display UI designed to be used alongside the Yamaha SEQTRAK.

### Concept

This project explores a quick, at-a-glance view of information musicians need while creating or performing, while respecting the SEQTRAK's hands-on workflow. It is not intended to modify or replace the original instrument. As a companion display placed beside it, the concept aims to support quick decisions in music production and live sets, helping musicians stay focused on sound design and performance.

Instead of adding menu levels or interaction steps, the interface reveals relevant information in response to the selected track and actions on the instrument. Visuals and typography prioritize track, sound, effect, and performance state for quick glances. Information that has not been received is never guessed; unknown state is shown as unknown.

### Design principles

- Distinguish KICK, SNARE, HI-HAT, BASS, and SYNTH tracks with clear graphics
- Show the preset name prominently when a sound is selected
- Change the graphics to reflect effect types and parameters
- Keep the workflow direct without adding menu levels
- Use Space Grotesk and IBM Plex Mono
- Enlarge the target display in the Mac browser preview for inspection

### Pages

- [`index.html`](index.html) — Main page with the hardware schematic and external display preview
- [`display-preview.html`](display-preview.html) — Original preview, retained for reference
- [`hardware-preview.html`](hardware-preview.html) — Compatibility page that redirects to `index.html`

### Current prototype

The browser demo includes light and dark themes, track and sound previews, FX displays, MIDI event demos, BPM and note readouts, and a drum step view. In the hardware schematic, rotate the FX knob to choose from the eight documented categories and eight presets in each category, then switch the MASTER/SINGLE target. A separate simulator control switches FX pages. The touch strips follow the documented Page 1 and Page 2 assignments; HIGH PASS and REPEATER on Page 1 are active only while held. Pressing the 16 Drum Section pads toggles steps in the selected drum track's preview sequence.

These controls simulate interactions and displays. Drum steps are edited manually in this page and are not read from a pattern saved on a SEQTRAK. The simulator produces no sound.

The browser prototype does not communicate with the hardware. USB or BLE MIDI input, recording-state detection, reading patterns or sound data from the SEQTRAK, and firmware for the LILYGO T-Display-S3 are future development work. The page identifies the limits of the simulation so demo data is not mistaken for information received from the instrument.

### Future site direction

The site is intended to grow into an interactive concept page where visitors can try display changes by interacting with the instrument schematic. The main view will give the hardware and external display room to breathe, then introduce SOUND, SEQUENCE, FX, and PERFORMANCE interactions as the visitor scrolls. Sections should share the same simulator state, with motion used to explain each interaction.

### Preview and tests

No build step is required. Open `index.html` in a browser to view the main page. If Node.js is installed, run the automated tests from the project directory:

```sh
node --test tests/*.test.js
```

### Publishing with GitHub Pages

Place the project files and folders in the repository root. If GitHub Pages is configured to publish the branch root, it will open `index.html` as the home page. Keep the `data`, `js`, and `tests` folder structure intact.

### Trademark and affiliation

SEQTRAK is a product name of Yamaha Corporation. This is an independent, unofficial concept and is not presented as being made or endorsed by Yamaha Corporation.

---

## 日本語

Yamaha SEQTRAKと一緒に使うことを想定した、外付けディスプレイUIのプロトタイプです。

### 概要とコンセプト

SEQTRAK本体の操作感や音楽制作の流れを尊重しながら、演奏中に確認したい情報を小さな画面にすばやく表示することを目指しています。SEQTRAK本体を改造したり、置き換えたりするためのものではありません。本体のそばに置く補助ディスプレイとして、音楽制作やライブセットでの判断を助け、ミュージシャンが音づくりや演奏に集中できる体験を提案します。

画面の階層や操作を増やすのではなく、本体で選んだトラックや行った操作に応じて必要な情報が表れることを基本方針としています。短い視線移動でトラック、音色、エフェクト、演奏状態を把握できるよう、グラフィックと文字の優先順位を整理します。取得できていない情報は推測せず、分からないことが分かる表示にします。

### デザイン方針

- KICK、SNARE、HI-HAT、BASS、SYNTHをグラフィックで見分けやすくする
- 音色を選んだときは、プリセット名を読み取りやすく表示する
- エフェクトの種類とパラメーターに応じて表示を変える
- 画面遷移を増やさず、制作やライブの流れを止めない
- フォントはSpace GroteskとIBM Plex Monoを使用する
- Macブラウザ用プレビューは実機想定画面を拡大して確認できるようにする

### ページ

- [`index.html`](index.html) — トップページ。ハードウェアと外付けディスプレイを並べたプレビュー
- [`display-preview.html`](display-preview.html) — 旧プレビュー。引き続き残しています
- [`hardware-preview.html`](hardware-preview.html) — `index.html`へ移動する互換ページ

### 現在のプロトタイプ

ブラウザ上でライト／ダーク表示、トラックや音色のプレビュー、FX表示、MIDIイベントのデモ、BPMやノートの表示、ドラムのステップ表示を試せます。本体図ではFXノブを回してマニュアル記載の8カテゴリー×8プリセットを選択し、MASTER/SINGLEを切り替えられます。FX Pageは本体図の外にあるシミュレーター専用操作で切り替えます。タッチストリップはマニュアルにあるPage 1/2の割当に従い、Page 1のHIGH PASSとREPEATERは押している間だけ有効になる操作を再現します。Drum Sectionの16パッドを押すと、選択中のドラムトラックのプレビューシーケンスが切り替わります。

これらは操作感と表示を確認するためのシミュレーションです。ドラムのステップはこのページ内で手動編集するデモであり、SEQTRAK本体に保存されたパターンを読み取ったものではありません。シミュレーションは音を出しません。

現在のブラウザ版は実機と通信しません。USB／BLE MIDIの受信、録音状態の検出、SEQTRAK本体のパターンや音色情報の取得、LILYGO T-Display-S3向けファームウェアは今後の開発対象です。実際に取得できる情報とデモ表示を混同しないよう、ページ内にも制約を記載しています。

### 今後のサイト構成案

サイト全体は、製品説明を読むだけでなく、本体図に触れながら表示の変化を試せるコンセプトページへ発展させる構想です。トップでは本体と外付けディスプレイを大きく見せ、スクロールに合わせてSOUND、SEQUENCE、FX、PERFORMANCEの各操作を体験できる流れを想定しています。各セクションは同じシミュレーター状態を共有し、動きは操作の意味を伝える範囲に絞ります。

### プレビューとテスト

ビルド工程はありません。`index.html`をブラウザで開くとトップページを確認できます。Node.jsがある環境では、プロジェクトフォルダで次のコマンドを実行して自動テストを確認できます。

```sh
node --test tests/*.test.js
```

### GitHub Pagesで公開する場合

リポジトリのトップページとして使うときは、プロジェクト内のファイルとフォルダをリポジトリ直下に配置してください。GitHub Pagesが公開元としてそのブランチのルートを使う設定なら、`index.html`が最初に表示されます。`data`、`js`、`tests`などのフォルダ構成は保ってください。

### 表記

SEQTRAKはヤマハ株式会社の製品名です。このプロトタイプは独立した非公式のコンセプトであり、ヤマハ株式会社による提供・承認を示すものではありません。

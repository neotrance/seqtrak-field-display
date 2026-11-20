# SEQTRAK / FIELD

An experimental visual interface and interactive simulator for Yamaha SEQTRAK.

**[Open the live demo](https://neotrance.github.io/seqtrak-field-display/)**

SEQTRAK / FIELD explores how sound, sequence, effects, and performance state can be made easier to read without replacing the instrument’s hands-on workflow. It runs in the browser and can receive data from a connected SEQTRAK over USB-MIDI. No custom firmware is required.

> Independent, unofficial project. Not affiliated with or endorsed by Yamaha Corporation.

## Why this project exists

SEQTRAK is designed for direct, hands-on music making. That immediacy also means that some context—such as the selected sound, pattern, effect, parameter, or live track activity—is distributed across controls and LEDs.

This project investigates a companion display that makes that state visible at a glance, helping musicians stay focused on sound design, sequencing, and live performance.

The guiding principle is simple: **show received or explicitly selected information, and never invent unavailable state.**

## What is included

- Interactive SEQTRAK hardware schematic
- 320 × 170 external display concept, rendered at a 4× backing resolution
- Track, sound, sequence, parameter, and FX previews
- Interactive Drum steps, Synth keys, Sound Design controls, FX controls, and side buttons
- Light and dark display themes
- Receive-only USB-MIDI connection in supported Chromium browsers
- MIDI log with copy and clear controls
- Separate LIVE MONITOR view for track activity, transport, estimated tempo, and received FX values
- Original display preview retained for comparison

## USB-MIDI

The browser connection is **receive-only**. The project does not send parameter changes or other MIDI commands to SEQTRAK.

Incoming messages are classified as Note On/Off, Control Change, Program Change, System Realtime, or SysEx. Unknown information remains raw or is displayed as unavailable rather than being assigned a guessed meaning.

### Confirmed with hardware

- USB-MIDI reception from a physical SEQTRAK
- MIDI Clock reception
- Limited drum-step edit messages for KICK and SNARE
- Step ON/OFF changes reflected in the 16-step display after connection

### Not fully verified

- The same drum-step interpretation across every drum track and firmware version
- Complete SysEx decoding
- Reading the full pattern that existed before connection
- Exact sound names from Program Change values
- Every hardware control, FX state, or saved project state

The 16-step view reflects observed edits where supported; it is not presented as a complete dump of a saved SEQTRAK pattern.

## Browser requirements

For USB-MIDI, use Chrome or another compatible Chromium browser on an HTTPS page or localhost.

1. Connect SEQTRAK by USB.
2. Open the [live demo](https://neotrance.github.io/seqtrak-field-display/).
3. Select **CONNECT SEQTRAK** and grant MIDI permission.
4. Choose the SEQTRAK input if it is not selected automatically.

Without a connected device, the simulator continues to work as a standalone visual prototype.

## Project pages

- [`index.html`](index.html) — Main interactive concept and simulator
- [`live-monitor.html`](live-monitor.html) — Receive-only performance monitor
- [`display-preview.html`](display-preview.html) — Original display preview
- [`hardware-preview.html`](hardware-preview.html) — Compatibility entry point
- [`display-640-parameter-compare.html`](display-640-parameter-compare.html) — Standalone 640 × 172 parameter and sequence layout study
- [`reference/op1-design-kit`](reference/op1-design-kit/) — Static OP-1 Design Kit JSON/C reference tokens; no Skill installation

## Run locally

No build step is required. Serve the repository with a local static server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in Chrome.

Run the automated tests with Node.js:

```sh
node --test tests/*.test.js
```

The current suite contains 53 tests covering display state, MIDI parsing, FX mappings, hardware interactions, theme behavior, and page structure. Automated tests do not replace verification with a physical SEQTRAK.

## Design and implementation

The project uses plain HTML, CSS, Canvas, SVG, and JavaScript. It intentionally avoids a framework and build pipeline so the interaction model remains easy to inspect and deploy on GitHub Pages.

Typography uses Manrope, Space Grotesk, Barlow Condensed, and IBM Plex Mono across the site and display experiments. The standalone 640 × 172 comparison also uses the locally bundled Iosevka preview profiles from the OP-1 Design Kit.

## Credits

Selected interface symbols are based on [Pixelarticons](https://github.com/halfmage/pixelarticons/tree/c9ecc2d), created by Gerrit Halfmann and licensed under the MIT License. The KICK symbol uses the supplied T-Rex SVG path. Selected SVG path data is included directly without adding an icon package dependency.

The Alpha 2 FIELD DISPLAY uses selected regular icons from [Phosphor Icons Core 2.1.1](https://github.com/phosphor-icons/core) in its current-track header. Phosphor Icons is licensed under the MIT License. Only the required SVG paths are embedded; no runtime dependency or remote asset request is added.

MUTE uses the Pixelarticons `mic-off` symbol; VOL uses the `volume` symbol for +/− feedback.

The experimental 640 × 172 parameter comparison references the [OP-1 Design Kit v0.2.0 Draft](https://github.com/squarewave-studio/op1-design-kit) by SquareWave Studio. The kit guidance and metadata are MIT-licensed. Its bundled Iosevka preview fonts are distributed under the SIL Open Font License 1.1. Local notices are retained in [`assets/fonts/op1-design-kit`](assets/fonts/op1-design-kit/).

SEQTRAK is a product name of Yamaha Corporation. Product names are used only to identify compatibility and project context.

---

## 日本語

Yamaha SEQTRAKのための、実験的なビジュアルインターフェースと操作可能なシミュレーターです。

**[公開デモを開く](https://neotrance.github.io/seqtrak-field-display/)**

SEQTRAK / FIELDは、SEQTRAK本来の直接的な操作感を置き換えずに、音色、シーケンス、エフェクト、演奏状態を把握しやすくする方法を探るプロジェクトです。ブラウザで動作し、USB-MIDIで接続したSEQTRAKから情報を受信できます。カスタムファームウェアは必要ありません。

> 個人による独立した非公式プロジェクトです。ヤマハ株式会社による提供・承認を示すものではありません。

## 解決したい課題

SEQTRAKは、手を止めずに音楽を作れる直接的な操作性を備えています。一方で、選択中の音色、パターン、エフェクト、パラメーター、ライブ中のトラック状態などは、複数の操作子やLEDから読み取る必要があります。

このプロジェクトでは、そうした状態を短い視線移動で把握できる補助表示を検討しています。音づくり、シーケンス制作、ライブ演奏への集中を保つことが目的です。

基本方針は、**受信または明示的に選択された情報だけを表示し、取得できない状態を推測しないこと**です。

## 主な内容

- 操作可能なSEQTRAK本体図
- 320 × 170を想定し、4倍の内部解像度で描画する外部ディスプレイ案
- トラック、音色、シーケンス、パラメーター、FX表示
- Drumステップ、Synthキー、Sound Design、FX、サイドボタンの操作
- ライト／ダーク表示
- Chromium系ブラウザでの受信専用USB-MIDI接続
- コピー／クリア可能なMIDIログ
- トラック発音、トランスポート、推定BPM、受信FX値を表示するLIVE MONITOR
- 比較用に残した旧ディスプレイプレビュー

## USB-MIDI

ブラウザからの接続は**受信専用**です。SEQTRAKへパラメーター変更などのMIDIコマンドは送信しません。

受信メッセージをNote On/Off、Control Change、Program Change、System Realtime、SysExに分類します。意味を確認できない情報は推測せず、生データまたは未取得として扱います。

### 実機で確認済み

- SEQTRAK実機からのUSB-MIDI受信
- MIDI Clockの受信
- KICKとSNAREの限定的なドラムステップ編集メッセージ
- 接続後に観測したステップON/OFFの16ステップ表示への反映

### 未確認または限定的

- 全ドラムトラック／全ファームウェアで同じ解釈が成立すること
- SysEx全体の解釈
- 接続前から存在するパターン全体の読み出し
- Program Change値から正確な音色名を特定すること
- すべての物理操作、FX状態、保存済みプロジェクト状態

16ステップ表示は、対応する受信データから観測した編集を反映するもので、SEQTRAK内の保存パターン全体を読み出したものではありません。

## 対応ブラウザ

USB-MIDI接続には、HTTPSまたはlocalhost上でChromeなどの対応Chromium系ブラウザを使用してください。

1. SEQTRAKをUSB接続します。
2. [公開デモ](https://neotrance.github.io/seqtrak-field-display/)を開きます。
3. **CONNECT SEQTRAK**を押してMIDIアクセスを許可します。
4. 自動選択されない場合はSEQTRAKの入力ポートを選びます。

未接続でも、シミュレーターは単独のビジュアルプロトタイプとして動作します。

## ページ構成

- [`index.html`](index.html) — メインのコンセプトページとシミュレーター
- [`live-monitor.html`](live-monitor.html) — 受信専用の演奏モニター
- [`display-preview.html`](display-preview.html) — 旧ディスプレイプレビュー
- [`hardware-preview.html`](hardware-preview.html) — 互換用エントリーポイント
- [`display-640-parameter-compare.html`](display-640-parameter-compare.html) — 独立した640 × 172パラメーター／シーケンス比較案
- [`reference/op1-design-kit`](reference/op1-design-kit/) — Skillを導入せず保持するOP-1 Design KitのJSON／C参照トークン

## ローカル実行

ビルド工程はありません。リポジトリのルートで静的サーバーを起動します。

```sh
python3 -m http.server 8000
```

Chromeで`http://localhost:8000/`を開いてください。

Node.jsがある環境では、次のコマンドで自動テストを実行できます。

```sh
node --test tests/*.test.js
```

現在は、表示状態、MIDI解析、FXマッピング、本体操作、テーマ、ページ構造を対象とする52件のテストがあります。自動テストはSEQTRAK実機での確認を代替するものではありません。

## デザインと実装

HTML、CSS、Canvas、SVG、JavaScriptで実装しています。構造を確認しやすく、GitHub Pagesへそのまま配置できるよう、フレームワークやビルド工程を使用していません。

サイトと表示実験では、Manrope、Space Grotesk、Barlow Condensed、IBM Plex Monoを使用しています。独立した640 × 172比較では、OP-1 Design Kitからローカル収録したIosevkaプレビュープロファイルも使用しています。

## クレジット

一部のインターフェースアイコンに、Gerrit HalfmannによるMITライセンスの[Pixelarticons](https://github.com/halfmage/pixelarticons/tree/c9ecc2d)を使用しています。KICKには提供されたT-RexのSVGパスを使用しています。選択したSVGパスを直接収録しており、アイコン用の外部パッケージは追加していません。

Alpha 2 FIELD DISPLAYでは、現在のトラックを示すヘッダーに[Phosphor Icons Core 2.1.1](https://github.com/phosphor-icons/core)のregularアイコンを使用しています。Phosphor IconsはMITライセンスです。必要なSVGパスのみを収録し、ランタイム依存や外部アセット通信は追加していません。

MUTEのフィードバックにはPixelarticonsの`mic-off`、VOL＋／−には`volume`を使用しています。

640 × 172パラメーター比較の実験では、SquareWave Studioによる[OP-1 Design Kit v0.2.0 Draft](https://github.com/squarewave-studio/op1-design-kit)を参照しています。キットのガイダンスとメタデータはMITライセンス、同梱したIosevkaプレビューフォントはSIL Open Font License 1.1です。ライセンス文は[`assets/fonts/op1-design-kit`](assets/fonts/op1-design-kit/)に保持しています。

SEQTRAKはヤマハ株式会社の製品名です。製品名は互換性とプロジェクトの背景を示す目的でのみ使用しています。

---

<details>
<summary>Pixelarticons MIT License</summary>

Copyright (c) 2019 Gerrit Halfmann

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

</details>

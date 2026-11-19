# SEQTRAK Field Display

## English

A prototype for an external display UI designed to be used alongside the Yamaha SEQTRAK.

### Concept

This project explores a quick, at-a-glance view of information musicians need while creating or performing, while respecting the SEQTRAK's hands-on workflow. It is not intended to modify or replace the original instrument. As a companion display placed beside it, the concept aims to support quick decisions in music production and live sets, helping musicians stay focused on sound design and performance.

Instead of adding menu levels or interaction steps, the interface reveals relevant information in response to the selected track and actions on the instrument. Visuals and typography prioritize track, sound, effect, and performance state for quick glances. Information that has not been received is never guessed; unknown state is shown as unknown.

### Design principles

- Distinguish KICK, SNARE, CLAP, HI-HAT, PERC 1/2, BASS, SYNTH, and SAMPLER tracks with clear graphics
- Show the preset name prominently when a sound is selected
- Change the graphics to reflect effect types and parameters
- Keep the workflow direct without adding menu levels
- Use Space Grotesk and IBM Plex Mono
- Enlarge the target display in the Mac browser preview for inspection

### Icon credit

The track symbols on the left side of the display use the supplied T-Rex SVG path for KICK and selected Pixelarticons for SNARE (`drum`), HI-HAT (`bell-ring`), CLAP (`hand`), PERC 1 (`notes`), PERC 2 (`music`), BASS (`audio-waveform`), SYNTH (`keyboard-music`), and SAMPLER (`mic`). Side-button feedback uses `mic-off` for MUTE and `volume` for VOL +/−. Pixelarticons is created by Gerrit Halfmann and licensed under MIT. The selected Pixelarticons SVG path data is included directly, so the project does not add an icon package dependency. Source: [Pixelarticons at GitHub](https://github.com/halfmage/pixelarticons/tree/c9ecc2d).

### Pages

- [`index.html`](index.html) — Main page with the hardware schematic and external display preview
- [`display-preview.html`](display-preview.html) — Original preview, retained for reference
- [`live-monitor.html`](live-monitor.html) — Receive-only MIDI monitor with TRACKS and FX pages
- [`hardware-preview.html`](hardware-preview.html) — Compatibility page that redirects to `index.html`

### Current prototype

The browser demo includes light and dark themes, track and sound previews, FX displays, receive-only USB MIDI, MIDI event demos, BPM and note readouts, and a drum step view. The ALL knob changes patterns across all 11 tracks; hold it while pressing Drum keys 1–6 to queue a pattern, or double-tap a key while holding ALL to switch immediately. Pressing and turning ALL queues a pattern change. In the hardware schematic, rotate the FX knob to choose from the eight documented categories and eight presets in each category, then switch the MASTER/SINGLE target. A separate simulator control switches FX pages. The touch strips follow the documented Page 1 and Page 2 assignments; HIGH PASS and REPEATER on Page 1 are active only while held. Pressing the 16 Drum Section pads toggles steps in the selected drum track's preview sequence. The main page and the original display preview link to a separate LIVE MONITOR mode; the simulator controls and state remain intact.

The left- and right-side button areas are interactive and evenly spaced in the schematic. PLAY moves a visual playhead through the 16-step drum preview at an explicitly set preview BPM; it produces no audio. BPM +/− adjust the preview BPM. PAGE switches the FX parameter page. On touch screens, MUTE, SOLO, DELETE, PROJECT, and SWING can be tapped to latch the modifier before selecting a target; this adapts hardware hold gestures for the simulator. Project contents, volume, and swing values are not loaded, so those values are not invented.

These controls simulate interactions and displays. Drum steps are edited manually in this page and are not read from a pattern saved on a SEQTRAK. The simulator produces no sound.

### LIVE MONITOR mode

Open [`live-monitor.html`](live-monitor.html) from the LIVE MONITOR link on the main page or original display preview. This mode uses a separate MIDI receiver and requests `navigator.requestMIDIAccess({ sysex: false })` only after the user presses **Connect MIDI**. It receives Note On/Off, documented effect-parameter Control Changes, Timing Clock (`F8`), Start (`FA`), and Stop (`FC`); it does not transmit MIDI.

The input chooser automatically selects a uniquely named SEQTRAK port, a single Yamaha port, or the only available input. If the input disconnects while MIDI permission remains active, the page waits for that input to return and reselects it by ID or unique name; a uniquely named SEQTRAK port can also be matched if its ID changes. It does not switch to an unrelated port after a previous selection. If multiple ports are ambiguous, select the SEQTRAK input manually. The page shows permission denial, no input, device disconnect, and missing/lost MIDI Clock states.

The Yamaha guide lists MIDI channels 1–11 in the same order as the eleven displayed tracks. Whether a particular SEQTRAK setup transmits each event on those channels still needs an instrument check. TRACKS is the initial page; its eleven existing pixel icons respond to Note On velocity. Drum tracks decay briefly, while SYNTH, DX, and SAMPLER notes remain lit until Note Off and then fade. Start resets the clock counter. The monitor treats MIDI Clock as 24 PPQN and advances a provisional sixteenth-note position per six clock messages. If Clock arrives without Start, it shows `SYNC` and an estimated phase; only Start changes the transport label to confirmed `PLAY`. Tempo is estimated from incoming clock intervals and marked with `~`; the 16-position strip is a transport aid, not a readout of stored patterns. Clock is marked lost after one second without a clock message.

The FX page displays only values received for the guide's assigned effect-parameter CCs: MASTER EFFECT 1–3 (CC 102–106), SINGLE EFFECT parameters (CC 107–109), SEND REVERB (CC 110–112), and SEND DELAY (CC 113–115). The effect type and its enabled/bypassed state are not identified by these values, so those fields remain unavailable. MUTE and SOLO CCs are receive-only in the guide and are not interpreted as button-press notifications. The event log records local time, MIDI port, status byte, event type, channel, note/velocity or CC/value, and can be copied or cleared.

#### Chrome on macOS test procedure

1. In Terminal, start a local static server from the project folder with `python3 -m http.server 8000`, then open `http://localhost:8000/live-monitor.html` in Chrome.
2. Connect the SEQTRAK by USB, press **Connect MIDI**, and allow MIDI input. If Chrome lists multiple ports, select the SEQTRAK port. A single input or clearly named SEQTRAK/Yamaha input should be selected automatically.
3. Play notes or trigger tracks and confirm the log shows the port, status, channel, note, and velocity, and that the corresponding icon responds. Velocity-zero Note On should appear as Note Off.
4. Start the SEQTRAK transport and confirm the clock status changes, an estimated BPM appears after enough clock messages, and the position indicator advances once per six incoming `F8` messages. Stop should hold the position; Start should reset it.
5. Change an effect parameter that sends a documented CC and confirm the matching raw value appears on the FX page. The effect name and on/off state should remain unavailable.
6. Unplug and reconnect USB while the page remains connected. Confirm the same port is selected again; use **Disconnect** to stop automatic reconnection.

The automated tests cover message parsing, documented FX CC filtering, velocity response and note release, six-clock position and estimated tempo, permission options, input auto-selection and reconnection. They do not establish that a physical SEQTRAK is configured to transmit notes, FX CCs, or MIDI Clock. USB hardware behavior remains unverified until the procedure above is run with the instrument.

### USB MIDI input (receive-only)

Both `index.html` and `design-skeleton.html` can request Web MIDI input in a supported Chromium browser. Use Chrome on an HTTPS page (such as GitHub Pages) or a local development server. Press **Connect MIDI**, grant the browser permission, then select the input port that corresponds to the connected instrument. SysEx access is requested first; if it is denied, the page falls back to standard MIDI input. The connection is receive-only and never sends MIDI commands.

Incoming Note On/Off, Control Change, Program Change, and SysEx messages are classified and shown in the receive log. Documented CC mappings and note activity can update the main display. Program Change is logged without guessing a sound name. Unknown SysEx remains raw; only the drum-step edit format verified in the captures below is decoded. MIDI input can reveal the selected track channel, but it does not necessarily report physical button presses, recording state, saved patterns, or every parameter. In `design-skeleton.html`, received events are forwarded to its embedded simulator and the selected-track preview.

Hardware captures supplied on 2026-11-20 identify a narrow SysEx format for drum step edits. After command `70`, operation values `00`–`0A` report ON for tracks 1–11 and `20`–`2A` report OFF; the following bytes include a zero-based pattern slot and step index. KICK and SNARE captures verify this structure. The simulator applies observed edits for drum tracks 1–7 to its 16-step display. Untouched cells remain unknown because the messages do not provide the pattern state that existed before connection; this is an edit capture, not a full saved-pattern readout.

When a Program Change value is received on a mapped track, the display shows `<TRACK> / VALUE <n> · SOUND NAME UNKNOWN`. The raw value is retained as received; it is not converted to a guessed preset name. This indicator replaces the preview pattern label in the track heading while the sequence grid remains a separate preview.

USB MIDI reception and the narrow drum-step edit messages above have been observed with a physical SEQTRAK. Other controls still depend on firmware and MIDI configuration and remain unverified where noted. BLE MIDI, full SysEx decoding, saved-pattern reading, and firmware for the LILYGO T-Display-S3 remain future work. The page keeps unreceived or unverified information unknown.

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

- KICK、SNARE、CLAP、HI-HAT、PERC 1/2、BASS、SYNTH、SAMPLERをグラフィックで見分けやすくする
- 音色を選んだときは、プリセット名を読み取りやすく表示する
- エフェクトの種類とパラメーターに応じて表示を変える
- 画面遷移を増やさず、制作やライブの流れを止めない
- フォントはSpace GroteskとIBM Plex Monoを使用する
- Macブラウザ用プレビューは実機想定画面を拡大して確認できるようにする

### アイコンのクレジット

画面左側のトラックアイコンでは、KICKに共有いただいたT-RexのSVGパスを使い、ほかのトラックにはPixelarticonsの図柄を選んでいます。SNAREは`drum`、HI-HATは`bell-ring`、CLAPは`hand`、PERC 1は`notes`、PERC 2は`music`、BASSは`audio-waveform`、SYNTHは`keyboard-music`、SAMPLERは`mic`です。サイドボタンの操作表示には、MUTEで`mic-off`、VOL＋／−で`volume`を表示します。PixelarticonsはGerrit Halfmannによるアイコンセットで、MITライセンスです。選んだSVGパスを直接収録しているため、アイコン用の外部パッケージは追加していません。出典：[Pixelarticons GitHub](https://github.com/halfmage/pixelarticons/tree/c9ecc2d)。

### ページ

- [`index.html`](index.html) — トップページ。ハードウェアと外付けディスプレイを並べたプレビュー
- [`display-preview.html`](display-preview.html) — 旧プレビュー。引き続き残しています
- [`live-monitor.html`](live-monitor.html) — MIDI受信専用のTRACKS / FXモニター
- [`hardware-preview.html`](hardware-preview.html) — `index.html`へ移動する互換ページ

### 現在のプロトタイプ

ブラウザ上でライト／ダーク表示、トラックや音色のプレビュー、FX表示、受信専用USB MIDI、MIDIイベントのデモ、BPMやノートの表示、ドラムのステップ表示を試せます。ALLノブを回すと11トラックのパターンを一括変更できます。ALLノブを押しながらDrumキー1〜6を押すと全トラックの予約切り替え、押しながらダブルタップすると即時切り替え、押しながら回すと予約切り替えを再現します。本体図ではFXノブを回してマニュアル記載の8カテゴリー×8プリセットを選択し、MASTER/SINGLEを切り替えられます。FX Pageは本体図の外にあるシミュレーター専用操作で切り替えます。タッチストリップはマニュアルにあるPage 1/2の割当に従い、Page 1のHIGH PASSとREPEATERは押している間だけ有効になる操作を再現します。Drum Sectionの16パッドを押すと、選択中のドラムトラックのプレビューシーケンスが切り替わります。

左右側面のボタン領域を操作できます。図では各ボタンの間隔を揃えています。明示設定したプレビューBPMに合わせてPLAYで16ステップの再生ヘッドが動きますが、音は出ません。BPM＋／−は設定済みのプレビューBPMだけを調節し、PAGEはFXパラメーターページを切り替えます。タッチ画面ではMUTE、SOLO、DELETE、PROJECT、SWINGをタップしてから対象を選ぶ方式で、ハードウェアの押し続ける操作をシミュレーター向けに置き換えています。プロジェクト内容やボリューム／スイング値は読み込まず、推測もしません。

これらは操作感と表示を確認するためのシミュレーションです。ドラムのステップはこのページ内で手動編集するデモであり、SEQTRAK本体に保存されたパターンを読み取ったものではありません。シミュレーションは音を出しません。

### LIVE MONITORモード

トップページまたは旧プレビューの「LIVE MONITOR」リンクから[`live-monitor.html`](live-monitor.html)を開きます。既存のシミュレーターとは別のMIDI受信処理を使い、ユーザーが「CONNECT MIDI」を押した時に限り`navigator.requestMIDIAccess({ sysex: false })`を呼び出します。受信対象はNote On/Off、マニュアル記載のFXパラメーターControl Change、Timing Clock（`F8`）、Start（`FA`）、Stop（`FC`）です。SEQTRAKへMIDIを送信しません。

SEQTRAKと特定できるポート、Yamahaのポートが1つだけの場合、または入力ポートが1つだけの場合は自動選択します。接続中にポートが切断されてもMIDI許可が残っていれば、同じIDまたは一意な名前の入力が戻った時に自動で再選択します。IDが変わってもSEQTRAK名が一意なら再検出します。以前の選択と関係のないポートへは自動で切り替えません。複数ポートを判別できない場合は手動選択にします。権限拒否、入力待ち、デバイス切断、MIDI Clock未受信／途絶の状態を表示します。

ヤマハのユーザーガイドでは、MIDIチャンネル1〜11が11トラックと同じ順で記載されています。実機設定で各イベントがこのチャンネルから送られるかは、引き続き実機で確認が必要です。初期画面のTRACKSには既存の11アイコンを使い、Note Onのベロシティに応じて点灯させます。ドラムトラックは短く減衰し、SYNTH、DX、SAMPLERはNote Offまで点灯し、その後フェードします。Startでクロックカウンターを初期化します。MIDI Clockを24 PPQNとして扱い、6クロックごとに暫定的な16分音符位置を1つ進めます。Startを受信せずClockだけ届く場合は`SYNC`と位相推定を表示し、Startを受信したときだけトランスポートを`PLAY`と確定表示します。BPMは受信Clock間隔から推定し、`~`を付けます。16位置のバーは再生位置の目安であり、保存パターンの読み出しではありません。1秒間Clockを受信しないと途絶状態にします。

FX画面は、マニュアルの割当CCを受信した場合だけMASTER EFFECT 1〜3（CC 102〜106）、SINGLE EFFECTパラメーター（CC 107〜109）、SEND REVERB（CC 110〜112）、SEND DELAY（CC 113〜115）の値を表示します。CC値からエフェクトの種類や有効／バイパス状態は特定できないため、その情報は未取得として表示します。マニュアルではMUTE／SOLOのCCは受信専用とされています。ボタン押下通知としては解釈しません。受信ログには時刻、MIDIポート、ステータス、イベント種別、チャンネル、ノート／ベロシティまたはCC／値を記録し、コピーとクリアができます。

#### macOS / Chromeでの確認手順

1. Terminalでプロジェクトフォルダへ移動し、静的サーバーを`python3 -m http.server 8000`で起動してから、Chromeで`http://localhost:8000/live-monitor.html`を開きます。
2. SEQTRAKをUSB接続して「CONNECT MIDI」を押し、MIDI入力を許可します。複数のポートが表示された場合はSEQTRAKを選択します。単一入力または名前から識別できるSEQTRAK/Yamaha入力は自動選択されます。
3. ノートを演奏するかトラックを鳴らし、ログにポート、ステータス、チャンネル、ノート、ベロシティが出て、対応アイコンが反応することを確認します。Velocity 0のNote OnはNote Offとして扱います。
4. SEQTRAKの再生を開始し、Clock状態、推定BPM、再生位置を確認します。受信した`F8`が6回ごとに表示位置が1つ進みます。Stopでは位置が止まり、Startでリセットされます。
5. FXパラメーターを操作し、該当するCCを送る場合はFXページに生の値が表示されることを確認します。FXの種類とON/OFF状態は未取得のままです。
6. 接続したままUSBを抜き差しし、同じポートが再選択されることを確認します。「DISCONNECT」を押すと自動再接続を終了します。

自動テストではメッセージ解析、マニュアル記載FX CCの選別、ベロシティ反応とNote Off、6クロック単位の位置更新とBPM推定、権限オプション、ポート自動選択と再接続を確認します。実機がノート、FX CC、MIDI Clockを送信する設定になっていることまでは確認しません。SEQTRAK実機で上記手順を行うまでは、USB接続時の動作は未検証です。

### USB MIDI受信（受信専用）

`index.html`と`design-skeleton.html`の両方で、Web MIDIに対応するChromium系ブラウザからMIDI入力を要求できます。ChromeでHTTPSのページ（GitHub Pagesなど）またはローカル開発サーバーを開き、「Connect MIDI」を押してブラウザの許可を与え、接続した機器に対応する入力ポートを選んでください。最初にSysExの許可を要求し、許可されない場合は通常のMIDI受信へ切り替えます。受信専用で、SEQTRAKへMIDIコマンドを送信しません。

Note On/Off、Control Change、Program Change、SysExを分類して受信ログに記録します。ユーザーガイドに対応するCC値とノートの動きはメイン表示へ反映できます。Program Changeから音色名は推測しません。未確認のSysExは生データの記録にとどめ、下記の実機ログで確認したドラムステップ編集形式だけを解釈します。MIDIチャンネルから選択トラックを表示できる場合がありますが、物理ボタン操作、録音状態、保存済みパターン、すべてのパラメーターが必ず送信されるわけではありません。`design-skeleton.html`では受信イベントを埋め込みシミュレーターとトラック表示へ中継します。

2026年11月20日に共有された実機ログから、ドラムステップ編集の限定的なSysEx形式を確認しました。コマンド`70`に続く操作値`00`〜`0A`がトラック1〜11のON、`20`〜`2A`がOFFを表し、その後のバイトに0始まりのパターンスロットとステップ番号が含まれます。この構造はKICKとSNAREの実機ログで確認済みです。シミュレーターはドラムトラック1〜7で接続後に観測した編集を16ステップ表示へ反映します。接続前から存在するパターン全体は取得できないため、未操作セルは未確認として扱います。

対応トラックでProgram Changeを受信すると、表示は`<TRACK> / VALUE <n> · SOUND NAME UNKNOWN`となります。受信した値をそのまま表示し、プリセット名には変換しません。パターンのプレビューグリッドは別に維持します。

USB MIDI受信と上記の限定的なドラムステップ編集メッセージはSEQTRAK実機で観測済みです。その他の操作は本体のファームウェアやMIDI設定に依存し、記載のとおり未検証の項目があります。BLE MIDI、SysEx全体の解釈、保存済みパターンの取得、LILYGO T-Display-S3向けファームウェアは今後の開発対象です。取得できていない情報は不明のまま表示します。

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

### Pixelarticons MIT License

Copyright (c) 2019 Gerrit Halfmann

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

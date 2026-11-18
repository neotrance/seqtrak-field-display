(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakI18n = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const messages = {
    en: {
      subtitle: "A Mac browser prototype for automatically displaying sound names and parameters received from SEQTRAK. The display on the left is a preview only; it does not connect to BLE MIDI or hardware.",
      language: "Display language", themeLight: "Switch to light mode", themeDark: "Switch to dark mode",
      previewControls: "Preview size", actualSize: "Actual size · 320 px", zoomPreview: "Zoom preview", zoomed: "Zoomed preview",
      screenAria: "SEQTRAK external display, 320 by 170 pixels",
      detailNote: "The canvas is 1280 × 680 px and represents a 320 × 170 px display. Instrument shapes and lines illustrate categories and parameters; they are not audio waveforms. Actual size uses 320 × 170 CSS pixels.",
      panelAria: "Mac preview controls", familyDemo: "DISPLAY FAMILY / DEMO", soundPreset: "SOUND PRESET",
      soundPreviewHelp: "Family and preset selection are for preview only. MIDI CC does not identify preset names, so names are shown only when available.",
      cutoff: "FILTER CUTOFF", resonance: "FILTER RESONANCE", decayRelease: "DECAY / RELEASE",
      play: "▶ PLAY", stop: "■ STOP", nextSound: "NEXT SOUND →", effectDemo: "EFFECT DISPLAY / DEMO",
      effectSlot: "EFFECT SLOT", singleEffect: "SINGLE EFFECT", sendEffect: "SEND EFFECT", masterEffect1: "MASTER EFFECT 1",
      masterEffect2: "MASTER EFFECT 2", masterEffect3: "MASTER EFFECT 3", effectCategory: "EFFECT CATEGORY",
      effectType: "EFFECT TYPE", fxParameter: "FX PARAMETER", value: "VALUE", illustrativeIntensity: "ILLUSTRATIVE INTENSITY / DEMO ONLY",
      min: "MIN", mid: "MID", max: "MAX", midiTest: "DOCUMENTED MIDI CC / EVENT TEST",
      midiHelp: "This preview uses documented channels, CC numbers, and value ranges. It does not connect to or send data to MIDI hardware. MUTE/SOLO CCs are receive-only, so they do not report physical button presses. TRACK VOLUME CC 7 is separate from the VOL+ / VOL- master controls.",
      midiChannel: "MIDI CHANNEL", controlChange: "CONTROL CHANGE", applyCc: "Apply CC event to display",
      legacySummary: "v1.3.4 FX address input test",
      legacyHelp: "This address format and mapping are not confirmed in the supplied user guide and have not been tested on hardware. Retained as a legacy demo only; it is not a connection protocol.",
      parameterAddress: "PARAMETER ADDRESS (3 bytes)", effectTypeMsb: "EFFECT TYPE MSB / LSB",
      tryLegacy: "Try legacy event", legacyDemo: "Legacy demo", logReady: "Ready. No hardware connected.",
      presetNotReceived: "PRESET NOT RECEIVED", soundsCount: "{{n}} sounds", parameterDataUnavailable: "PARAMETER DATA UNAVAILABLE",
      rangeUnverified: "Value input is disabled because the documented range could not be determined unambiguously.",
      parameterDefinitionUnavailable: "No parameter definition is available for this effect.",
      specRange: "Documented range: {{display}} / Raw value: {{value}}", undocumented: "not specified",
      hintCcNoName: "A CC event does not include the FX type name. The type and parameter name remain unidentified until received.",
      hintNoEffect: "No effect type is selected.", hintTypeOnly: "The graphic shows the effect category only. Parameter data is unavailable.",
      hintNoRange: "{{name}} / The range is not documented, so the graphic is static.",
      hintIllustration: "{{name}} / The graphic is illustrative and is not an audio waveform.",
      actualNote: "320 × 170 CSS px", zoomNote: "Zoomed preview",
      newPreset: "NEW PRESET", soundName: "SOUND NAME", noPresetData: "No preset data", soundTag: "SOUND",
      currentSound: "CURRENT SOUND", event: "EVENT", fxTypeNotInCc: "FX TYPE NOT INCLUDED IN CC",
      assignedParameter: "ASSIGNED PARAMETER", fxTypeNotSelected: "FX TYPE NOT SELECTED",
      parameterRangeNotDefined: "PARAMETER RANGE NOT DEFINED", noParameterValue: "NO PARAMETER VALUE",
      bpm: "BPM", bpmUnknown: "BPM —", muted: "MUTED", unmuted: "UNMUTED", solo: "SOLO", soloOff: "SOLO OFF",
      soloTrack: "SOLO TRACK {{n}}", volumeValue: "TRACK VOL {{n}}", masterVolumeValue: "MASTER VOL {{value}}",
      noteActivity: "MIDI NOTES / {{note}}", performanceDemo: "PERFORMANCE INPUT / DEMO", bpmPreview: "BPM PREVIEW (5–300)",
      setBpmPreview: "SET PREVIEW BPM", bpmPreviewHelp: "Preview only. This does not read from or send tempo to SEQTRAK.",
      noteNumber: "MIDI NOTE NUMBER (0–127)", velocity: "VELOCITY (0–127)", noteOn: "NOTE ON", noteOff: "NOTE OFF",
      notePreviewHelp: "Plots received MIDI notes only; it does not read a saved pattern. MIDI thru may omit arpeggiator trigger notes and notes on muted tracks.", invalidBpm: "Enter a BPM value from 5 to 300.",
      invalidNote: "Enter a valid MIDI channel, note number, and velocity.", bpmDownDemo: "−1 BPM", bpmUpDemo: "+1 BPM"
    },
    ja: {
      subtitle: "SEQTRAKから取得できた音色名とパラメーターを自動表示するMacブラウザ用プロトタイプです。左側はプレビューで、BLE MIDIや実機とは接続しません。",
      language: "表示言語", themeLight: "ライトモードに切替", themeDark: "ダークモードに切替",
      previewControls: "プレビューサイズ", actualSize: "実寸 · 320 px", zoomPreview: "拡大プレビュー", zoomed: "拡大表示中",
      screenAria: "SEQTRAK外付け画面、320×170ピクセル",
      detailNote: "描画バッファは1280×680px、表示座標は320×170pxです。楽器の図形と線はカテゴリー・パラメーターの説明用で、実際の音声波形ではありません。実寸モードはCSS上の320×170pxです。",
      panelAria: "Macプレビュー操作", familyDemo: "トラック / デモ", soundPreset: "音色プリセット",
      soundPreviewHelp: "ファミリー選択とプリセット選択はプレビュー用です。MIDI CCだけではプリセット名を特定できないため、利用可能な名前だけを表示します。",
      cutoff: "フィルターカットオフ", resonance: "フィルターレゾナンス", decayRelease: "ディケイ / リリース",
      play: "▶ 再生", stop: "■ 停止", nextSound: "次の音色 →", effectDemo: "エフェクト表示 / デモ",
      effectSlot: "エフェクトスロット", singleEffect: "シングルエフェクト", sendEffect: "センドエフェクト", masterEffect1: "マスターエフェクト 1",
      masterEffect2: "マスターエフェクト 2", masterEffect3: "マスターエフェクト 3", effectCategory: "エフェクトカテゴリー",
      effectType: "エフェクトタイプ", fxParameter: "FXパラメーター", value: "値", illustrativeIntensity: "図の強さ / デモ専用",
      min: "最小", mid: "中間", max: "最大", midiTest: "MIDI CC / イベントテスト",
      midiHelp: "ユーザーガイド記載のチャンネル、CC番号、値の範囲を使った画面テストです。MIDI機器には接続せず、データも送信しません。MUTE/SOLOのCCは受信専用のため、本体ボタンの操作はこのCCでは送られません。TRACK VOLUMEのCC 7はVOL+／VOL-のマスターボリュームとは別です。",
      midiChannel: "MIDIチャンネル", controlChange: "コントロールチェンジ", applyCc: "CCイベントを画面に適用",
      legacySummary: "v1.3.4のFXアドレス入力テスト",
      legacyHelp: "このアドレス形式と割当は付属ユーザーガイドでは確認できず、実機未検証です。旧デモ機能の保持用で、接続プロトコルとして扱いません。",
      parameterAddress: "パラメーターアドレス（3バイト）", effectTypeMsb: "エフェクトタイプ MSB / LSB",
      tryLegacy: "旧形式イベントを試す", legacyDemo: "旧形式デモ", logReady: "準備完了。機器は未接続です。",
      presetNotReceived: "音色未受信", soundsCount: "音色 {{n}} 件", parameterDataUnavailable: "パラメーター情報なし",
      rangeUnverified: "資料から値の範囲を一意に確認できないため、値入力を無効にしています。",
      parameterDefinitionUnavailable: "このエフェクトのパラメーター定義は資料内にありません。",
      specRange: "仕様範囲: {{display}} / 生値: {{value}}", undocumented: "未記載",
      hintCcNoName: "CCイベントにはFXタイプ名が含まれません。タイプやパラメーター名は受信できるまで特定しません。",
      hintNoEffect: "エフェクトタイプが選択されていません。", hintTypeOnly: "図はタイプのカテゴリーだけを示します。パラメーター定義はありません。",
      hintNoRange: "{{name}} / 範囲の上下限を特定できないため、図は静止します。",
      hintIllustration: "{{name}} / 図は説明用で、実際の音声波形ではありません。",
      actualNote: "320×170 CSS px", zoomNote: "拡大表示中",
      newPreset: "音色変更", soundName: "音色名", noPresetData: "音色データなし", soundTag: "音色",
      currentSound: "現在の音色", event: "イベント", fxTypeNotInCc: "CCにFXタイプ名は含まれません",
      assignedParameter: "割当パラメーター", fxTypeNotSelected: "FXタイプ未選択",
      parameterRangeNotDefined: "パラメーター範囲未定義", noParameterValue: "パラメーター値なし",
      bpm: "BPM", bpmUnknown: "BPM —", muted: "ミュート", unmuted: "ミュート解除", solo: "ソロ", soloOff: "ソロ解除",
      soloTrack: "トラック {{n}} をソロ", volumeValue: "トラック音量 {{n}}", masterVolumeValue: "マスター音量 {{value}}",
      noteActivity: "MIDIノート / {{note}}", performanceDemo: "演奏情報の入力 / デモ", bpmPreview: "BPMプレビュー（5〜300）",
      setBpmPreview: "プレビューBPMを設定", bpmPreviewHelp: "プレビュー専用です。本体からの読取や本体への送信は行いません。",
      noteNumber: "MIDIノート番号（0〜127）", velocity: "ベロシティ（0〜127）", noteOn: "ノートオン", noteOff: "ノートオフ",
      notePreviewHelp: "受信したMIDIノートだけを表示し、保存済みパターンは読み出しません。MIDIスルーではアルペジエーターのトリガーノートやミュート中のトラックが出力されない場合があります。",
      invalidBpm: "BPMは5〜300の範囲で入力してください。", invalidNote: "MIDIチャンネル、ノート番号、ベロシティを確認してください。",
      bpmDownDemo: "−1 BPM", bpmUpDemo: "+1 BPM"
    }
  };

  function t(language, key, values) {
    const locale = messages[language] ? language : "en";
    let value = messages[locale][key];
    if (value === undefined) value = messages.en[key] === undefined ? key : messages.en[key];
    return String(value).replace(/\{\{(\w+)\}\}/g, function (match, name) {
      return values && values[name] !== undefined ? String(values[name]) : match;
    });
  }

  function apply(document, language) {
    if (!document || typeof document.querySelectorAll !== "function") return;
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      element.textContent = t(language, element.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (element) {
      const entries = element.getAttribute("data-i18n-attr").split(",");
      entries.forEach(function (entry) {
        const pair = entry.split(":");
        if (pair.length === 2) element.setAttribute(pair[0], t(language, pair[1]));
      });
    });
  }

  return { t: t, apply: apply, messages: messages };
});

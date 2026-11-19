"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const stateModel = require(path.join(root, "js/display-state.js"));
const fxModel = require(path.join(root, "js/fx-model.js"));
const fxUnit = require(path.join(root, "js/fx-unit.js"));
const i18n = require(path.join(root, "js/i18n.js"));
const pixelArtIcons = require(path.join(root, "js/pixelarticons.js"));
const renderer = require(path.join(root, "js/display-renderer.js"));
const midiConnection = require(path.join(root, "js/midi-connection.js"));

function loadBrowserData(relativePath, property) {
  const window = {};
  const context = { window: window };
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
  return window[property];
}

const catalog = loadBrowserData("data/catalog.js", "SEQTRAK_CATALOG");
const fxSpecs = loadBrowserData("data/fx-specs.js", "SEQTRAK_FX_SPECS");
const hardwareFxPresets = loadBrowserData("data/seqtrak-fx-presets.js", "SEQTRAK_HARDWARE_FX_PRESETS");

test("USB MIDI input classifies Note, CC, Program Change, and SysEx messages", function () {
  assert.deepEqual(midiConnection.classify([0x91, 60, 100]), { type: "NOTE ON", channel: 2, note: 60, velocity: 100, bytes: [0x91, 60, 100] });
  assert.deepEqual(midiConnection.classify([0x81, 60, 64]), { type: "NOTE OFF", channel: 2, note: 60, velocity: 64, bytes: [0x81, 60, 64] });
  assert.deepEqual(midiConnection.classify([0x90, 60, 0]), { type: "NOTE OFF", channel: 1, note: 60, velocity: 0, bytes: [0x90, 60, 0] });
  assert.deepEqual(midiConnection.classify([0xb0, 74, 64]), { type: "CONTROL CHANGE", channel: 1, controller: 74, value: 64, bytes: [0xb0, 74, 64] });
  assert.deepEqual(midiConnection.classify([0xc1, 7]), { type: "PROGRAM CHANGE", channel: 2, program: 7, bytes: [0xc1, 7] });
  assert.deepEqual(midiConnection.classify([0xf0, 0x43, 0x10, 0xf7]), { type: "SYSEX", bytes: [0xf0, 0x43, 0x10, 0xf7] });
  assert.deepEqual(midiConnection.classify([0xf8]), { type: "SYSTEM REALTIME", realtime: "CLOCK", bytes: [0xf8] });
  assert.deepEqual(midiConnection.classify([0xfe]), { type: "SYSTEM REALTIME", realtime: "ACTIVE SENSING", bytes: [0xfe] });
});

test("both interactive pages expose receive-only USB MIDI controls and the hardware page forwards received events", function () {
  const mainPage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const structurePage = fs.readFileSync(path.join(root, "design-skeleton.html"), "utf8");
  const receiverSource = fs.readFileSync(path.join(root, "js/midi-connection.js"), "utf8");

  [mainPage, structurePage].forEach(function (html) {
    assert.match(html, /id="midiConnect"/);
    assert.match(html, /id="midiInputSelect"/);
    assert.match(html, /id="midiReceiveLog"/);
    assert.match(html, /id="midiLogCopy"[^>]*data-copy-target="midiReceiveLog"/);
    assert.match(html, /id="midiLogClear"[^>]*data-clear-target="midiReceiveLog"/);
    assert.match(html, /js\/midi-connection\.js/);
  });
  assert.match(receiverSource, /function copyText\(/);
  assert.match(receiverSource, /navigator\.clipboard/);
  assert.match(receiverSource, /execCommand\("copy"\)/);
  assert.match(receiverSource, /function bindLogClearButtons\(/);
  assert.match(receiverSource, /requestMIDIAccess\(\{ sysex: true \}\)/);
  assert.match(receiverSource, /requestMIDIAccess\(\)/);
  assert.match(mainPage, /Model\.applyControlChange/);
  assert.match(mainPage, /seqtrak-midi-event/);
  assert.match(structurePage, /seqtrak-midi-event/);
  assert.match(mainPage, /never sends MIDI/);
});

test("structure page controller parses and keeps unknown live values explicit", function () {
  const html = fs.readFileSync(path.join(root, "design-skeleton.html"), "utf8");
  const inlineScripts = Array.from(html.matchAll(/<script>\s*([\s\S]*?)\s*<\/script>/g));
  const controller = inlineScripts[inlineScripts.length - 1][1];

  assert.doesNotThrow(function () { new Function(controller); });
  assert.match(html, /\+ " \/ VALUE " \+ message\.program \+ " · SOUND NAME UNKNOWN"/);
  assert.match(html, /SOUND NAME UNKNOWN/);
  assert.match(html, /SYSEX RECEIVED/);
  assert.match(html, /step pattern and waveform remain illustrative/);
});

function fakeCanvasContext() {
  const values = {};
  return new Proxy(values, {
    get: function (target, property) {
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) {
      target[property] = value;
      return true;
    }
  });
}

test("preset catalog matches the guide's 2,032 sounds and 392 sampler sounds", function () {
  const presets = catalog.presets;
  const samplerCount = presets.filter(function (preset) { return preset.engine === "SAMPLER"; }).length;
  const soundCount = presets.length - samplerCount;
  const ids = presets.map(function (preset) {
    return [preset.engine, preset.bank_msb, preset.bank_lsb, preset.program].join(":");
  });

  assert.equal(presets.length, 2424);
  assert.equal(soundCount, 2032);
  assert.equal(samplerCount, 392);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(presets.every(function (preset) { return Boolean(preset.name); }));
});

test("family filters only return matching preset records", function () {
  const byId = Object.fromEntries(catalog.tracks.map(function (track) { return [track.id, track]; }));
  const kick = stateModel.availablePresets(catalog.presets, byId.kick);
  const hat = stateModel.availablePresets(catalog.presets, byId.hat);
  const bass = stateModel.availablePresets(catalog.presets, byId.bass);
  const synth = stateModel.availablePresets(catalog.presets, byId.synth);
  const missing = stateModel.availablePresets(catalog.presets, { id: "other", category: "no-match" });

  assert.ok(kick.length > 0 && kick.every(function (preset) { return preset.engine === "Drum" && /kick/i.test(preset.category + " " + preset.name); }));
  assert.ok(hat.length > 0 && hat.every(function (preset) { return preset.engine === "Drum" && /hi.?hat/i.test(preset.category + " " + preset.name); }));
  assert.ok(bass.length > 0 && bass.every(function (preset) { return /bass/i.test(preset.category + " " + preset.name); }));
  assert.ok(synth.length > 0 && synth.every(function (preset) { return preset.engine === "Synth" || preset.engine === "DX"; }));
  assert.equal(missing.length, 0);
  assert.ok(catalog.tracks.every(function (track) { return track.num === ""; }));
});

test("MIDI Start, Clock, and Stop drive the playback overview state", function () {
  let state = stateModel.createInitialState();
  state.playing = false;
  state = stateModel.applyMidiRealtime(state, 0xfa, 100);
  assert.equal(state.playbackOverview, true);
  assert.equal(state.midiPlayback.mode, "started");
  for (let tick = 1; tick <= 6; tick++) {
    state = stateModel.applyMidiRealtime(state, 0xf8, 100 + tick * 21);
  }
  assert.equal(state.midiPlayback.currentStep, 1);
  state = stateModel.applyMidiRealtime(state, 0xfc, 240);
  assert.equal(state.playbackOverview, false);
  assert.equal(state.midiPlayback.active, false);
});

test("captured SEQTRAK SysEx decodes drum step ON and OFF without guessing other messages", function () {
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x00, 0x00, 0x04, 0x3c, 0x64, 0x00, 0x78, 0xf7]), {
    action: "on", channel: 1, step: 5, note: 60, velocity: 100, gate: 120
  });
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x20, 0x00, 0x00, 0xf7]), {
    action: "off", channel: 1, step: 1, note: null, velocity: null, gate: null
  });
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x01, 0x00, 0x08, 0x3c, 0x64, 0x00, 0x78, 0xf7]), {
    action: "on", channel: 2, step: 9, note: 60, velocity: 100, gate: 120
  });
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x01, 0x00, 0x00, 0x3c, 0x64, 0x00, 0x78, 0xf7]), {
    action: "on", channel: 2, step: 1, note: 60, velocity: 100, gate: 120
  });
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x01, 0x00, 0x04, 0x3c, 0x64, 0x00, 0x78, 0xf7]), {
    action: "on", channel: 2, step: 5, note: 60, velocity: 100, gate: 120
  });
  assert.deepEqual(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70, 0x21, 0x00, 0x08, 0xf7]), {
    action: "off", channel: 2, step: 9, note: null, velocity: null, gate: null
  });
  assert.equal(stateModel.decodeStepChange([0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x01, 0x10, 0x39, 0x01, 0x01, 0xf7]), null);
});

test("captured drum edits distinguish observed ON, observed OFF, and unknown steps", function () {
  const fills = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillRect") return function (x, y) { if (y === 65) fills.push(target.fillStyle); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const pattern = Array.from({ length: 16 }, function () { return false; });
  const known = Array.from({ length: 16 }, function () { return false; });
  pattern[4] = true;
  known[0] = true;
  known[4] = true;
  renderer.render(context, Object.assign({}, stateModel.createInitialState(), {
    source: "midi",
    track: catalog.tracks.find(function (track) { return track.id === "kick"; }),
    deviceTrack: { name: "KICK / DRUM", channel: 1, type: "Drum" },
    drumPattern: pattern,
    drumPatternKnown: known,
    drumPatternSource: "MIDI EDIT",
    drumPatternNumber: null
  }), 100, fxModel);
  assert.equal(fills[0], "#263238");
  assert.equal(fills[1], "#080A0D");
  assert.equal(fills[4], "#F6B04E");
});

test("track editing can keep its detail view focused while MIDI Clock continues", function () {
  let state = stateModel.createInitialState();
  state.playing = false;
  state = stateModel.applyMidiRealtime(state, 0xfa, 100);
  state = Object.assign({}, state, { playbackFocus: true, playbackOverview: false, view: "sound" });
  state = stateModel.applyMidiRealtime(state, 0xf8, 121);
  assert.equal(state.playbackOverview, false);
  assert.equal(state.playbackFocus, true);
  assert.equal(state.view, "sound");
});

test("unknown sound values are larger on FIELD DISPLAY and the left control label omits PREVIEW", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const context = fakeCanvasContext();
  const labels = [];
  context.fillText = function (value) { labels.push({ value: String(value), font: context.font }); };
  const state = Object.assign({}, stateModel.createInitialState(), {
    source: "midi",
    deviceTrack: { name: "KICK / DRUM", channel: 1, type: "Drum" },
    soundValue: 37,
    track: null,
    drumPattern: null
  });
  renderer.render(context, state, 100, fxModel);
  const soundLabel = labels.find(function (item) { return item.value === "KICK / VALUE 37 · SOUND NAME UNKNOWN"; });
  assert.ok(soundLabel);
  assert.match(soundLabel.font, /11px/);
  assert.match(html, /TRACK · 11 MIDI CHANNELS/);
  assert.doesNotMatch(html, /PREVIEW TRACK · 11 MIDI CHANNELS/);
  assert.match(html, /Model\.applyMidiRealtime\(state, status/);
  assert.match(html, /applyReceivedMidi\(received\);\s*if \(Number\(received\.data && received\.data\[0\]\) === 0xfe\) return;/);
  assert.match(html, /function focusPlaybackDetail\(view\)/);
});

test("playback overview shows all eleven tracks and the current preview step", function () {
  const context = fakeCanvasContext();
  const labels = [];
  context.fillText = function (value) { labels.push(String(value)); };
  const state = Object.assign({}, stateModel.createInitialState(), {
    playbackOverview: true,
    playing: true,
    previewPlayheadStep: 2
  });
  renderer.render(context, state, 100, fxModel);
  ["KICK", "SNARE", "CLAP", "HAT 1", "HAT 2", "PERC 1", "PERC 2", "SYN 1", "SYN 2", "DX", "SAMPLER"].forEach(function (track) {
    assert.ok(labels.includes(track), "missing " + track);
  });
  assert.ok(labels.includes("STEP 03 / 16"));
});

test("track glyphs map to known families and hardware labels and render their paths", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const expected = {
    kick: "trex",
    snare: "drum",
    hat: "bell-ring",
    bass: "audio-waveform",
    synth: "keyboard-music",
    clap: "hand",
    perc1: "notes",
    perc2: "music",
    sampler: "mic"
  };

  assert.deepEqual(renderer.trackIconNames, expected);
  assert.match(html, /js\/pixelarticons\.js[\s\S]*?js\/display-renderer\.js/);
  assert.match(readme, /Pixelarticons[\s\S]*?MIT License/);
  assert.match(readme, /Copyright \(c\) 2019 Gerrit Halfmann/);
  assert.match(readme, /supplied T-Rex SVG path/i);
  assert.equal(pixelArtIcons.trex, "M18 23H10V21H12V19H14V21H16V17H18V23ZM10 15H12V19H10V17H6V15H8V13H4V11H10V15ZM20 17H18V15H20V17ZM14 15H12V13H14V15ZM22 15H20V13H18V11H20V7H22V15ZM4 7H8V9H4V11H2V3H4V7ZM18 11H16V9H18V11ZM16 9H14V3H16V9ZM12 7H10V5H12V7ZM14 3H4V1H14V3Z");
  assert.equal(pixelArtIcons["mic-off"], "M10 2h4v2h-4zM8 8h2v6H8zm2 6h4v2h-4zm4-10h2v6h-2zM4 10h2v6H4zm2 6h2v2H6zm2 2h8v2H8zm8-2h2v2h-2zm-2-2h2v2h-2zm-2-2h2v2h-2zm-2-2h2v2h-2zM8 8h2v2H8zM6 6h2v2H6zM4 4h2v2H4zM2 2h2v2H2zm16 16h2v2h-2zm2 2h2v2h-2zm-2-10h2v4h-2zm-7 10h2v2h-2z");
  assert.equal(pixelArtIcons.volume, "M17 22h-2v-2h-2v-2h2V6h-2V4h2V2h2v20Zm-4-4h-2v-2h2v2ZM11 8v2H9v4h2v2H7V8h4Zm2 0h-2V6h2v2Z");
  assert.match(readme, /MUTE.{0,40}mic-off[\s\S]*?VOL.{0,20}volume/);
  Object.entries(expected).forEach(function ([trackId, iconName]) {
    assert.equal(renderer.trackIconName({ id: trackId }), iconName);
    assert.ok(pixelArtIcons[iconName].length > 0);
  });
  Object.entries({ "HAT 1": "hat", "HAT 2": "hat", CLAP: "clap", "PERC 1": "perc1", "PERC 2": "perc2", SAMPLER: "sampler" }).forEach(function ([label, trackId]) {
    const hardwareTrack = renderer.displayTrack({
      source: "midi",
      deviceTrack: { name: label, channel: 1 },
      track: null
    });
    assert.equal(renderer.trackIconName(hardwareTrack), expected[trackId]);
  });

  const hadPath2D = Object.prototype.hasOwnProperty.call(globalThis, "Path2D");
  const previousPath2D = globalThis.Path2D;
  const drawnPaths = [];
  globalThis.Path2D = class TestPath2D {
    constructor(pathData) { this.pathData = pathData; }
  };
  try {
    const context = new Proxy({}, {
      get: function (target, property) {
        if (property === "fill") return function (shape) { drawnPaths.push(shape.pathData); };
        if (property in target) return target[property];
        return function () {};
      },
      set: function (target, property, value) { target[property] = value; return true; }
    });
    Object.keys(expected).forEach(function (trackId) {
      assert.equal(renderer.drawPixelIcon(context, { id: trackId }), true);
    });
    assert.deepEqual(drawnPaths, Object.values(expected).map(function (iconName) { return pixelArtIcons[iconName]; }));
  } finally {
    if (hadPath2D) globalThis.Path2D = previousPath2D;
    else delete globalThis.Path2D;
  }
});

test("documented MIDI channel and CC mappings decode without inventing preset data", function () {
  const kickCutoff = stateModel.decodeControlChange(1, 74, 64);
  const masterFx = stateModel.decodeControlChange(1, 102, 90);
  const singleFx = stateModel.decodeControlChange(11, 109, 31);
  const sendDelay = stateModel.decodeControlChange(1, 115, 127);
  const masterFx2 = stateModel.decodeControlChange(1, 105, 31);
  const invalidTrackCc = stateModel.decodeControlChange(8, 25, 64);
  const invalidValue = stateModel.decodeControlChange(1, 25, 39);

  assert.equal(kickCutoff.ok, true);
  assert.equal(kickCutoff.track.name, "KICK");
  assert.equal(kickCutoff.name, "FILTER CUTOFF");
  assert.equal(masterFx.scope, "Master 1");
  assert.equal(masterFx.parameter, 1);
  assert.equal(singleFx.scope, "Single");
  assert.equal(singleFx.track.name, "SAMPLER");
  assert.equal(sendDelay.bank, "DELAY");
  assert.equal(sendDelay.parameter, 3);
  assert.equal(masterFx2.parameter, null);
  assert.equal(invalidTrackCc.ok, false);
  assert.equal(invalidValue.ok, false);
});

test("track volume, mute thresholds, and solo target are decoded as documented", function () {
  let state = stateModel.createInitialState();
  const volume = stateModel.decodeControlChange(1, 7, 96);
  const muteOff = stateModel.decodeControlChange(1, 23, 63);
  const muteOn = stateModel.decodeControlChange(1, 23, 64);
  const soloTrack3 = stateModel.decodeControlChange(1, 24, 3);
  const soloOff = stateModel.decodeControlChange(1, 24, 0);

  state = stateModel.applyControlChange(state, volume, catalog.tracks, 100);
  assert.equal(state.volumeByChannel[1], 96);
  state = stateModel.applyControlChange(state, muteOff, catalog.tracks, 200);
  assert.equal(state.muteByChannel[1], false);
  state = stateModel.applyControlChange(state, muteOn, catalog.tracks, 300);
  assert.equal(state.muteByChannel[1], true);
  state = stateModel.applyControlChange(state, soloTrack3, catalog.tracks, 400);
  assert.equal(state.soloTrack, 3);
  assert.equal(state.deviceTrack.channel, 3);
  state = stateModel.applyControlChange(state, soloOff, catalog.tracks, 500);
  assert.equal(state.soloTrack, null);
});

test("MIDI CC state clears a preset name that the message did not contain", function () {
  let state = stateModel.createInitialState();
  state = stateModel.selectFamily(state, "kick", catalog.presets, catalog.tracks, 100);
  assert.ok(state.preset);

  const event = stateModel.decodeControlChange(6, 74, 72);
  state = stateModel.applyControlChange(state, event, catalog.tracks, 200);

  assert.equal(state.source, "midi");
  assert.equal(state.deviceTrack.name, "PERC 1");
  assert.equal(state.deviceTrack.channel, 6);
  assert.equal(state.track, null);
  assert.equal(state.preset, null);
  assert.equal(state.currentParameter.value, 72);
  assert.equal(state.view, "parameter");
  assert.equal(stateModel.expireView(state, 3000).view, "overview");
});

test("FX parameter lookup respects effect blocks and refuses ambiguous ranges", function () {
  const spxHall = catalog.effects.find(function (effect) { return effect.name === "SPX HALL"; });
  const single = fxModel.getFxParameters(spxHall, "Single", fxSpecs.parameters);
  const send = fxModel.getFxParameters(spxHall, "Send", fxSpecs.parameters);
  const eqGain = fxModel.getFxParameters({ name: "2 BAND EQ" }, "Single", fxSpecs.parameters)
    .find(function (parameter) { return Number(parameter.number) === 3; });
  const unavailable = fxModel.getFxParameters({ name: "AUTO SYNTH" }, "Single", fxSpecs.parameters);

  assert.ok(single.length > 0);
  assert.ok(send.length > 0);
  assert.equal(single[0].block, "Single / Master Effect Block");
  assert.equal(send[0].block, "Send Effect Block");
  assert.equal(new Set(single.map(function (parameter) { return parameter.number; })).size, single.length);
  assert.equal(fxModel.rangeForParameter(single[0]).min, 0);
  assert.equal(fxModel.rangeForParameter(eqGain), null);
  assert.equal(unavailable.length, 0);
});

test("hardware FX dial follows the guide's eight categories and eight presets per category", function () {
  assert.deepEqual(Array.from(hardwareFxPresets.categories), ["FILTER", "REVERB", "DELAY", "COMPRESSOR", "DISTORTION", "MODULATION", "DUCKER", "OTHER"]);
  ["Single", "Master 1"].forEach(function (scope) {
    const presets = fxUnit.presetsFor(scope, hardwareFxPresets, catalog.effects);
    assert.equal(presets.length, 64);
    hardwareFxPresets.categories.forEach(function (category) {
      const categoryPresets = presets.filter(function (preset) { return preset.category === category; });
      assert.equal(categoryPresets.length, 8, scope + " " + category);
      assert.deepEqual(Array.from(categoryPresets, function (preset) { return preset.number; }), [1, 2, 3, 4, 5, 6, 7, 8]);
      assert.ok(categoryPresets.every(function (preset) { return Boolean(preset.effect); }), scope + " " + category + " effect types must exist in the catalog");
    });
  });

  const single = fxUnit.presetsFor("Single", hardwareFxPresets, catalog.effects);
  const master = fxUnit.presetsFor("Master 1", hardwareFxPresets, catalog.effects);
  assert.equal(single[0].name, "LPF - NO RESONANCE");
  assert.equal(single[7].name, "HPF - HIGH RESONANCE");
  assert.equal(fxUnit.nextIndex(0, -1, single.length), 63);
  assert.equal(fxUnit.nextIndex(63, 1, single.length), 0);
  assert.equal(fxUnit.findIndexForPreset(master, single.find(function (preset) { return preset.category === "DISTORTION" && preset.number === 2; })), 33);
});

test("FX display shows the selected SEQTRAK preset name, category, and preset number", function () {
  const texts = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { texts.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const effect = catalog.effects.find(function (item) { return item.name === "CONTROL FILTER"; });
  const parameter = fxModel.getFxParameters(effect, "Single", fxSpecs.parameters)[0];
  const state = Object.assign({}, stateModel.createInitialState(), {
    view: "effect",
    fx: {
      scope: "Single",
      effect: effect,
      parameter: parameter,
      parameterValue: 64,
      formattedValue: "64",
      presetName: "LPF - NO RESONANCE",
      presetCategory: "FILTER",
      presetNumber: 1,
      visualIntensity: 65
    }
  });

  renderer.render(context, state, 100, fxModel);
  assert.ok(texts.includes("LPF - NO RESONANCE"));
  assert.ok(texts.some(function (text) { return /FILTER 01\/08/.test(text); }));
});

test("drum sound selection keeps the sequence display and updates its preset and track context", function () {
  const texts = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { texts.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const hat = catalog.tracks.find(function (track) { return track.id === "hat"; });
  const state = Object.assign({}, stateModel.createInitialState(), {
    source: "midi",
    view: "sound",
    track: hat,
    deviceTrack: { name: "HAT 2 / DRUM", channel: 5, family: "hat", type: "Drum" },
    preset: { name: "Tight Closed Hat 1", category: "Hi-Hat", number: "1", engine: "Drum" },
    drumPattern: Array.from({ length: 16 }, function () { return false; }),
    drumPatternNumber: 1
  });

  renderer.render(context, state, 100, fxModel);
  assert.ok(texts.includes("Tight Closed Hat 1"));
  assert.ok(texts.includes("HAT2 / DRUM · PATTERN 1"));
  assert.ok(texts.includes("PATTERN 01 · 16 STEPS"));
  assert.equal(texts.includes("NEW PRESET"), false);
  assert.equal(texts.some(function (text) { return text.includes("/ VALUE"); }), false);
});

test("received Program Change shows the raw value and unknown sound name while keeping the sequence grid", function () {
  const texts = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { texts.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const kick = catalog.tracks.find(function (track) { return track.id === "kick"; });
  const hardwarePage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const state = Object.assign({}, stateModel.createInitialState(), {
    source: "midi",
    track: kick,
    deviceTrack: { name: "KICK / DRUM", channel: 1, family: "kick", type: "Drum" },
    soundValue: 37,
    preset: null,
    drumPattern: Array.from({ length: 16 }, function () { return false; }),
    drumPatternNumber: 1
  });

  renderer.render(context, state, 100, fxModel);
  assert.ok(texts.includes("KICK / VALUE 37 · SOUND NAME UNKNOWN"));
  assert.ok(texts.includes("PATTERN 01 · 16 STEPS"));
  assert.equal(texts.includes("KICK · PATTERN 1"), false);
  assert.match(hardwarePage, /state\.soundValue = message\.program;/);
  assert.match(hardwarePage, /trackName \+ " \/ VALUE " \+ soundValuesByChannel\[channel\] \+ " · SOUND NAME UNKNOWN"/);
});

test("FX page maps touch strips as documented and performance strips bypass on release", function () {
  assert.deepEqual(fxUnit.stripMapping(1, "fxLevel"), { kind: "effectParameter", number: 1 });
  assert.deepEqual(fxUnit.stripMapping(1, "highPass"), { kind: "performance", parameter: "HIGH PASS FILTER CUTOFF", effect: "highPass" });
  assert.deepEqual(fxUnit.stripMapping(1, "repeater"), { kind: "performance", parameter: "BEAT REPEAT LENGTH", effect: "repeater" });
  assert.deepEqual(fxUnit.stripMapping(2, "fxLevel"), { kind: "effectParameter", number: 1 });
  assert.deepEqual(fxUnit.stripMapping(2, "highPass"), { kind: "effectParameter", number: 2 });
  assert.deepEqual(fxUnit.stripMapping(2, "repeater"), { kind: "effectParameter", number: 3 });
  assert.deepEqual(fxUnit.stripMapping(1, "fxLevel", { category: "FILTER" }), { kind: "effectParameter", number: 2 });
  assert.deepEqual(fxUnit.stripMapping(2, "fxLevel", { category: "FILTER" }), { kind: "effectParameter", number: 2 });
  assert.deepEqual(fxUnit.stripMapping(2, "highPass", { category: "FILTER" }), { kind: "effectParameter", number: 3 });
  assert.deepEqual(fxUnit.stripMapping(2, "repeater", { category: "FILTER" }), { kind: "effectParameter", number: 4 });
  assert.equal(fxUnit.pointerValue(262, 262, 358, 0, 127), 127);
  assert.equal(fxUnit.pointerValue(358, 262, 358, 0, 127), 0);
  assert.equal(fxUnit.pointerValue(100, 262, 358, 0, 127), 127);
});

test("hardware side controls allow click activation and volume and playback update the preview", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sideHandlersStart = html.indexOf("hardwareSideControls.forEach(function (control)");
  const sideHandlersEnd = html.indexOf("function setAllTrackPattern", sideHandlersStart);
  const sideHandlers = html.slice(sideHandlersStart, sideHandlersEnd);
  const pointerDown = /control\.addEventListener\("pointerdown", function \(event\) \{([\s\S]*?)\}\);/.exec(sideHandlers);

  assert.ok(pointerDown);
  assert.doesNotMatch(pointerDown[1], /preventDefault/);
  assert.match(sideHandlers, /control\.addEventListener\("click", function \(\) \{ activateSideButton\(control\); \}\)/);
  assert.match(html, /function adjustPreviewMasterVolume\([\s\S]*?masterVolumeDisplay:[\s\S]*?PREVIEW ONLY/);
  assert.match(html, /state\.bpm = 120;\s*state\.bpmSource = "preview";/);
});

test("fixed fonts and the 4x canvas backing store remain in place", function () {
  const html = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");

  assert.match(html, /width="1280" height="680"/);
  assert.match(app, /setTransform\(4, 0, 0, 4, 0, 0\)/);
  assert.match(css, /--font-display:\s*"Space Grotesk"/);
  assert.match(css, /--font-data:\s*"IBM Plex Mono"/);
  assert.match(css, /font-family:\s*var\(--font-display\)/);
  assert.match(css, /body\s*\{[^}]*height:\s*100vh/s);
  assert.match(css, /\.controls-scroll\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.screen\s*\{[^}]*aspect-ratio:\s*320\s*\/\s*170/s);
  assert.match(css, /@media\s*\(min-width:\s*781px\)/);
  assert.match(css, /@media\s*\(max-width:\s*780px\)/);
  assert.match(css, /grid-template-rows:\s*minmax\(220px/);
  assert.match(html, /class="panel controls-scroll" tabindex="0"/);
});

test("English is the initial UI language and English/Japanese strings are available", function () {
  const html = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const state = stateModel.createInitialState();

  assert.equal(state.language, "en");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<option value="en">English<\/option>\s*<option value="ja">日本語<\/option>/);
  assert.match(html, /id="language"/);
  assert.equal(i18n.t("en", "familyDemo"), "DISPLAY FAMILY / DEMO");
  assert.equal(i18n.t("ja", "familyDemo"), "トラック / デモ");
  assert.equal(i18n.t("ja", "themeLight"), "ライトモードに切替");
  assert.equal(i18n.t("ja", "soundsCount", { n: 4 }), "音色 4 件");
});

test("all declared and rendered translation keys exist in both locales", function () {
  const html = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  const sources = ["js/app.js", "js/display-renderer.js"].map(function (file) {
    return fs.readFileSync(path.join(root, file), "utf8");
  }).join("\n");
  const keys = new Set();

  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(match[1]);
  for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    match[1].split(",").forEach(function (entry) {
      const pair = entry.split(":");
      if (pair.length === 2) keys.add(pair[1]);
    });
  }
  for (const match of sources.matchAll(/tr\((?:state,\s*)?"([A-Za-z]\w*)"/g)) keys.add(match[1]);

  assert.ok(keys.size > 0);
  assert.ok(Array.from(keys).every(function (key) {
    return Object.hasOwn(i18n.messages.en, key) && Object.hasOwn(i18n.messages.ja, key);
  }));
  assert.match(css, /:root\[data-theme="light"\]/);
});

test("preview exposes unknown BPM and recent note events, not a fabricated saved pattern", function () {
  const html = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const rendererSource = fs.readFileSync(path.join(root, "js/display-renderer.js"), "utf8");
  const initial = stateModel.createInitialState();

  assert.equal(initial.bpm, null);
  assert.equal(initial.masterVolumeDisplay, null);
  assert.match(html, /id="bpmPreview" type="number" min="5" max="300"/);
  assert.match(html, /id="noteOnPreview"/);
  assert.match(html, /id="noteOffPreview"/);
  assert.match(html, /does not read a saved pattern/);
  assert.doesNotMatch(rendererSource, /120 BPM/);
});

test("recording and held-note indicators require explicit state and show pitch class only", function () {
  const texts = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { texts.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const initial = stateModel.createInitialState();
  assert.equal(initial.recording, false);
  assert.equal(initial.activeNote, null);

  renderer.render(context, initial, 100, fxModel);
  assert.equal(texts.includes("REC"), false);
  assert.equal(texts.includes("C"), false);

  texts.length = 0;
  renderer.render(context, Object.assign({}, initial, { recording: true, activeNote: 61 }), 100, fxModel);
  assert.equal(texts.includes("REC"), true);
  assert.equal(texts.includes("C#"), true);
  assert.equal(texts.includes("C#4"), false);
  assert.equal(texts.includes("DEMO"), true);
});

test("filter parameters show received values without drawing an inferred response curve", function () {
  for (const key of ["cutoff", "resonance"]) {
    let lineSegments = 0;
    const context = new Proxy({}, {
      get: function (target, property) {
        if (property === "lineTo") return function () { lineSegments += 1; };
        if (property in target) return target[property];
        return function () {};
      },
      set: function (target, property, value) { target[property] = value; return true; }
    });
    const state = Object.assign({}, stateModel.createInitialState(), {
      view: "parameter",
      currentParameter: { key: key, name: key.toUpperCase(), value: 64, min: 0, max: 127 }
    });

    renderer.render(context, state, 100, fxModel);
    assert.ok(lineSegments < 40, key + " should use a value meter, not a synthesized response curve");
  }
});

test("hardware preview exposes recording and MIDI note demo controls", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(html, /id="recordToggle"/);
  assert.match(html, /id="noteKeys"/);
  assert.match(html, /When you connect a MIDI input, this page receives messages only/);
  assert.match(html, /MIDI NOTE/);
  assert.match(html, /MIDI NOTE INPUT · PREVIEW EVENT/);
  assert.match(html, /do not claim a physical-key mapping/);
  assert.match(html, /selectedSynthTrack/);
  assert.match(html, /Drum-section pads are sequence controls/);
});

test("hardware preview simulates FX controls and 16 physical drum sequence pads", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const rendererSource = fs.readFileSync(path.join(root, "js/display-renderer.js"), "utf8");
  const fxUnitSource = fs.readFileSync(path.join(root, "js/fx-unit.js"), "utf8");

  assert.match(html, /id="fxKnob"[^>]*role="button"/);
  assert.match(html, /hold a track knob while rotating to select that track's sound/i);
  assert.match(html, /selected sound name appears on the external display/);
  assert.match(html, /id="fxModeControl"[^>]*role="switch"/);
  assert.match(html, /id="fxPageControl"[^>]*type="button"/);
  assert.match(html, /SIM PAGE 1/);
  const hardwareSvg = html.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.doesNotMatch(hardwareSvg, /id="fxPageControl"/);
  assert.doesNotMatch(hardwareSvg, /<circle cx="854" cy="328"/);
  assert.doesNotMatch(hardwareSvg, /<circle cx="854" cy="344"/);
  assert.match(html, /id="fxStripLevel"[^>]*role="slider"/);
  assert.match(html, /id="fxStripHighPass"[^>]*role="slider"/);
  assert.match(html, /id="fxStripRepeater"[^>]*role="slider"/);
  assert.match(html, /fxUnitPage === 1/);
  assert.match(html, /Drag or scroll the FX knob/);
  assert.match(rendererSource, /HOLD TO APPLY · RELEASE TO BYPASS/);
  assert.match(html, /id="drumHardwareSteps"/);
  assert.match(html, /index < 16/);
  assert.match(html, /toggleDrumStep\(index\)/);
  assert.match(html, /id="micGrid"/);
  assert.match(html, /id="fxStripLabelLevel" x="1027"/);
  assert.match(html, /id="fxStripLabelHighPass" x="1127"/);
  assert.match(html, /id="fxStripLabelRepeater" x="1247"/);
  assert.match(html, /class="fx-mode-track" x="991" y="168" width="72"/);
  ["sideVolumeUp", "sideVolumeDown", "sideDelete", "sideMute", "sideSolo", "sidePage", "sidePlay", "sideBpmUp", "sideBpmDown", "sideSwing", "sideProject"].forEach(function (id) {
    assert.match(html, new RegExp("id=\\\"" + id + "\\\" class=\\\"hardware-side-control\\\""));
  });
  const leftButtonYs = ["sideVolumeUp", "sideVolumeDown", "sideDelete", "sideMute", "sideSolo", "sidePage", "sidePlay"].map(function (id) {
    const match = html.match(new RegExp("id=\\\"" + id + "\\\"[^>]* y=\\\"(\\d+)\\\""));
    return match && match[1];
  });
  const rightButtonYs = ["sideBpmUp", "sideBpmDown", "sideSwing", "sideProject"].map(function (id) {
    const match = html.match(new RegExp("id=\\\"" + id + "\\\"[^>]* y=\\\"(\\d+)\\\""));
    return match && match[1];
  });
  assert.deepEqual(leftButtonYs, ["38", "78", "118", "158", "198", "238", "278"]);
  assert.deepEqual(rightButtonYs, ["172", "212", "252", "292"]);
  assert.match(html, /BPM \+/);
  assert.match(html, /BPM −/);
  assert.match(html, /Hold ALL while pressing Drum keys 1–6/);
  assert.doesNotMatch(html, /drop-shadow\(/);
  assert.doesNotMatch(html, /<rect x="12" y="14" width="1376" height="382"/);
  assert.match(html, /<rect x="8" y="8" width="1376" height="382"[^>]*stroke="none"/);
  assert.doesNotMatch(html, /<g fill="#303436">/);
  assert.match(html, /<linearGradient id="body"[^>]*>[\s\S]*?stop-color="#ffffff"[\s\S]*?stop-color="#ffffff"/);
  assert.doesNotMatch(html, /FRONT VIEW · MONOCHROME/);
  assert.match(fxUnitSource, /HIGH PASS FILTER CUTOFF/);
  assert.match(fxUnitSource, /BEAT REPEAT LENGTH/);
  assert.match(rendererSource, /drawFxPerformance/);
});

test("GitHub Pages root opens hardware preview and keeps the original preview available", function () {
  const rootPage = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const oldPreview = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const previousHardwarePath = fs.readFileSync(path.join(root, "hardware-preview.html"), "utf8");

  assert.match(rootPage, /<html lang="en" data-theme="light">/);
  assert.match(rootPage, /id="drumSteps"/);
  assert.match(oldPreview, /id="language"/);
  assert.match(oldPreview, /id="themeToggle"/);
  assert.notEqual(rootPage, oldPreview);
  assert.match(previousHardwarePath, /url=\.\/index\.html/);
});

test("hardware preview is English-only and its light-mode control updates display theme", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(html, /<html lang="en" data-theme="light">/);
  assert.match(html, /id="themeToggle"[^>]*>Switch to dark mode<\/button>/);
  assert.match(html, /:root\[data-theme="light"\]/);
  assert.match(html, /theme = theme === "dark" \? "light" : "dark"/);
  assert.match(html, /theme: theme/);
  assert.doesNotMatch(html, /languageToggle|data-ja=/);
  assert.doesNotMatch(html, /[\u3040-\u30ff\u3400-\u9fff]/);
  const inlineScript = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(inlineScript, "hardware preview controller script should be present");
  assert.doesNotThrow(function () { new Function(inlineScript[1]); });
});

test("light theme renders a light display canvas", function () {
  const fills = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) {
      target[property] = value;
      if (property === "fillStyle") fills.push(value);
      return true;
    }
  });

  renderer.render(context, Object.assign({}, stateModel.createInitialState(), { theme: "light" }), 100, fxModel);
  assert.ok(fills.includes("#F5F7F5"));
});

test("drum overview and parameter view show only explicit 16-step data with decay", function () {
  const texts = [];
  const patternCells = [];
  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { texts.push(String(value)); };
      if (property === "fillRect") return function (x, y, width, height) {
        if (x >= 105 && x < 304 && y === 65 && height === 20) patternCells.push(target.fillStyle);
      };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });
  const family = catalog.tracks.find(function (track) { return track.id === "kick"; });
  const drum = Object.assign({}, stateModel.createInitialState(), {
    track: family,
    deviceTrack: { name: "KICK / DRUM", channel: 1, family: "kick" },
    drumPattern: [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
    drumPatternNumber: 2,
    drumPatternSource: "PREVIEW"
  });

  renderer.render(context, drum, 100, fxModel);
  assert.ok(texts.includes("PATTERN 02 · 16 STEPS"));
  assert.ok(texts.includes("DECAY"));
  assert.ok(texts.includes("55"));
  assert.equal(patternCells.length, 16);
  assert.equal(patternCells[0], "#F6B04E");
  assert.ok(patternCells.every(function (color, index) {
    return [0, 2].includes(index) ? color === "#F6B04E" : color === "#263238";
  }));

  texts.length = 0;
  const parameter = Object.assign({}, drum, {
    view: "parameter",
    currentParameter: { key: "decay", name: "DECAY / RELEASE TIME", value: 73, min: 0, max: 127 }
  });
  renderer.render(context, parameter, 100, fxModel);
  assert.ok(texts.includes("PATTERN 02 · 16 STEPS"));
  assert.ok(texts.includes("DECAY / RELEASE TIME"));
  assert.ok(texts.includes("73"));

  texts.length = 0;
  renderer.render(context, Object.assign({}, drum, { drumPattern: null }), 100, fxModel);
  assert.equal(texts.some(function (text) { return /16 STEPS/.test(text); }), false);
});

test("hardware preview boots its sound, FX, MIDI, BPM, and note controls", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const inlineScripts = Array.from(html.matchAll(/<script>\s*([\s\S]*?)\s*<\/script>/g));
  const inlineScript = inlineScripts[inlineScripts.length - 1][1];
  const elements = new Map();
  const textDrawn = [];
  const fills = [];
  let onReady = null;
  let nextFrame = null;
  let nowTime = 1000;

  function makeElement(id, tagName) {
    const classes = new Set();
    const element = {
      id: id,
      tagName: tagName || "DIV",
      children: [],
      handlers: {},
      attributes: {},
      dataset: {},
      value: "",
      textContent: "",
      disabled: false,
      classList: {
        add: function (name) { classes.add(name); },
        remove: function (name) { classes.delete(name); },
        contains: function (name) { return classes.has(name); },
        toggle: function (name, force) {
          const enable = force === undefined ? !classes.has(name) : force;
          if (enable) classes.add(name); else classes.delete(name);
          return enable;
        }
      },
      addEventListener: function (name, handler) {
        if (!this.handlers[name]) this.handlers[name] = [];
        this.handlers[name].push(handler);
      },
      dispatch: function (name, event) {
        const payload = Object.assign({ target: this, preventDefault: function () {} }, event || {});
        (this.handlers[name] || []).forEach(function (handler) { handler(payload); });
      },
      append: function (child) {
        this.children.push(child);
        if (this.tagName === "SELECT" && !this.value) this.value = child.value;
      },
      replaceChildren: function () { this.children = []; if (this.tagName === "SELECT") this.value = ""; },
      querySelectorAll: function (selector) { return selector === "button" ? this.children : []; },
      setAttribute: function (name, value) { this.attributes[name] = String(value); },
      getAttribute: function (name) { return this.attributes[name] || ""; },
      setPointerCapture: function () {},
      querySelector: function () { return this.indicator || null; },
      getContext: function () { return context; }
    };
    let markup = "";
    Object.defineProperty(element, "innerHTML", {
      get: function () { return markup; },
      set: function (value) {
        markup = String(value);
        this.textContent = markup.replace(/<[^>]*>/g, "");
      }
    });
    return element;
  }

  const context = new Proxy({}, {
    get: function (target, property) {
      if (property === "fillText") return function (value) { textDrawn.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) {
      target[property] = value;
      if (property === "fillStyle") fills.push(value);
      return true;
    }
  });
  const ids = [
    "display", "trackList", "trackType", "stateReadout", "themeToggle", "recordToggle", "noteKeys", "drumSequenceControl", "drumSteps", "drumHardwareSteps", "recordHardwareKey", "synthHardwareKeys", "tracks", "preset", "count",
    "cutoff", "cutoffVal", "resonance", "resonanceVal", "decay", "decayVal", "play", "next", "fxScope", "fxCategory", "fxType",
    "fxParameter", "fxParamValue", "fxParamValueLabel", "fxParamMeta", "fxVisualIntensity", "fxVisualIntensityVal", "fxVisualHint",
    "fxKnob", "fxKnobIndicator", "fxModeControl", "fxModeThumb", "fxPageControl", "fxUnitPresetReadout", "fxUnitPageReadout",
    "fxStripLevel", "fxStripHighPass", "fxStripRepeater",
    "midiChannel", "midiController", "midiValue", "midiValueLabel", "applyMidiEvent", "bpmPreview", "setBpmPreview", "bpmDownPreview",
    "bpmUpPreview", "noteNumber", "noteVelocity", "noteOnPreview", "noteOffPreview", "eventLog", "sysexAddress", "sysexValue",
    "applyFxEvent", "demoFxSequence", "midiConnect", "midiDisconnect", "midiInputSelect", "midiConnectionStatus", "midiReceiveLog"
  ];
  ids.forEach(function (id) {
    const tagName = ["preset", "trackType", "fxScope", "fxCategory", "fxType", "fxParameter", "midiChannel", "midiController", "midiInputSelect"].includes(id) ? "SELECT" : "DIV";
    elements.set(id, makeElement(id, tagName));
  });
  const fxStripControls = ["fxLevel", "highPass", "repeater"].map(function (stripName) {
    const strip = elements.get("fxStrip" + (stripName === "fxLevel" ? "Level" : stripName === "highPass" ? "HighPass" : "Repeater"));
    strip.dataset.strip = stripName;
    strip.indicator = makeElement("", "CIRCLE");
    return strip;
  });
  const drumHardwareSteps = elements.get("drumHardwareSteps");
  const svgNS = "http://www.w3.org/2000/svg";
  const values = { fxScope: "Single", fxVisualIntensity: "65", midiValue: "64", noteNumber: "60", noteVelocity: "96", bpmPreview: "" };
  Object.keys(values).forEach(function (id) { elements.get(id).value = values[id]; });
  const knobs = ["all", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (value) {
    const knob = makeElement("", "G"); knob.dataset.channel = String(value); return knob;
  });
  const soundKnob = makeElement("", "G");
  const hardwareSideControls = ["volume-up", "volume-down", "delete", "mute", "solo", "page", "play", "bpm-up", "bpm-down", "swing", "project"].map(function (action) {
    const control = makeElement("", "RECT");
    control.dataset.sideAction = action;
    return control;
  });
  const fxTests = ["0", "0.5", "1"].map(function (level) { const button = makeElement("", "BUTTON"); button.dataset.level = level; return button; });
  const document = {
    getElementById: function (id) { return elements.get(id); },
    createElement: function (tag) { return makeElement("", tag.toUpperCase()); },
    createElementNS: function (_ns, tag) { return makeElement("", tag.toUpperCase()); },
    querySelectorAll: function (selector) {
      if (selector === ".track-knob") return knobs;
      if (selector === ".sound-knob[data-sound-knob='1']") return [soundKnob];
      if (selector === ".hardware-side-control") return hardwareSideControls;
      if (selector === ".fx-test") return fxTests;
      if (selector === ".fx-touch-strip") return fxStripControls;
      return [];
    },
    querySelector: function (selector) { return selector === ".sound-knob[data-sound-knob='1']" ? soundKnob : null; },
    documentElement: { attributes: {}, dataset: {}, setAttribute: function (name, value) { this.attributes[name] = String(value); } }
  };
  const midiReceiverStub = { connect: async function () {}, selectInput: async function () {}, disconnect: async function () {} };
  const sandbox = {
    window: null,
    location: { search: "" },
    document: document,
    URLSearchParams: URLSearchParams,
    performance: { now: function () { return nowTime; } },
    requestAnimationFrame: function (callback) { nextFrame = callback; },
    addEventListener: function (name, callback) { if (name === "DOMContentLoaded") onReady = callback; },
    SEQTRAK_CATALOG: catalog,
    SEQTRAK_FX_SPECS: fxSpecs,
    SEQTRAK_HARDWARE_FX_PRESETS: hardwareFxPresets,
    SeqtrakPixelArtIcons: pixelArtIcons,
    SeqtrakDisplayState: stateModel,
    SeqtrakMidiConnection: { createReceiver: function () { return midiReceiverStub; }, classify: midiConnection.classify },
    SeqtrakFxModel: fxModel,
    SeqtrakFxUnit: fxUnit,
    SeqtrakDisplayRenderer: renderer
  };
  sandbox.window = sandbox;
  vm.runInNewContext(inlineScript, sandbox, { filename: "index.html inline script" });
  onReady();
  function renderAt(time) { nowTime = time; nextFrame(time); }

  assert.equal(elements.get("trackList").children.length, 11);
  assert.equal(elements.get("synthHardwareKeys").children.length, 7);
  assert.equal(elements.get("recordHardwareKey").children.length, 1);
  const recordFace = elements.get("recordHardwareKey").children[0].children[0];
  const recordMark = elements.get("recordHardwareKey").children[0].children[1];
  assert.equal(recordFace.tagName, "RECT");
  assert.equal(recordFace.attributes.rx, "2");
  assert.equal(recordMark.tagName, "CIRCLE");
  assert.equal(recordMark.attributes.r, "2.5");
  assert.equal(elements.get("synthHardwareKeys").children[0].children[1].tagName, "RECT");
  assert.equal(elements.get("tracks").children.length, catalog.tracks.length);
  assert.equal(elements.get("midiChannel").children.length, 11);
  assert.equal(elements.get("midiController").children.length, stateModel.CC_CHOICES.length);
  assert.ok(elements.get("fxType").children.length > 0);
  const kickFamily = elements.get("tracks").children.find(function (button) { return button.dataset.id === "kick"; });
  kickFamily.dispatch("click");
  textDrawn.length = 0;
  renderAt(1000);
  assert.equal(elements.get("drumSequenceControl").hidden, false);
  assert.equal(elements.get("drumSteps").children.length, 16);
  assert.ok(textDrawn.includes("PATTERN 01 · 16 STEPS"));
  const sidePlay = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "play"; });
  assert.equal(sidePlay.attributes["aria-pressed"], "false");
  sidePlay.dispatch("click");
  assert.equal(sidePlay.attributes["aria-pressed"], "true");
  assert.match(elements.get("stateReadout").textContent, /PREVIEW 120 BPM/);
  const sideBpmUp = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "bpm-up"; });
  sideBpmUp.dispatch("click");
  assert.equal(elements.get("bpmPreview").value, "121");
  const sideVolumeUp = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "volume-up"; });
  sideVolumeUp.dispatch("click");
  assert.match(elements.get("stateReadout").textContent, /MASTER VOL 65 · PREVIEW ONLY/);
  assert.match(elements.get("stateReadout").innerHTML, /class="state-readout-icon"[\s\S]*?<path d="M17 22h-2/);
  elements.get("bpmPreview").value = "140";
  elements.get("setBpmPreview").dispatch("click");
  sidePlay.dispatch("click");
  assert.equal(sidePlay.attributes["aria-pressed"], "false");
  sidePlay.dispatch("click");
  assert.equal(sidePlay.attributes["aria-pressed"], "true");
  assert.equal(elements.get("drumHardwareSteps").children[0].classList.contains("playhead"), true);
  assert.equal(elements.get("drumSteps").children[0].attributes["aria-current"], "step");
  renderAt(1125);
  assert.equal(elements.get("drumHardwareSteps").children[0].classList.contains("playhead"), false);
  assert.equal(elements.get("drumHardwareSteps").children[1].classList.contains("playhead"), true);
  elements.get("play").dispatch("click");
  assert.equal(sidePlay.attributes["aria-pressed"], "false");
  assert.match(elements.get("stateReadout").textContent, /SEQUENCE STOPPED/);
  assert.equal(elements.get("drumHardwareSteps").children[1].classList.contains("playhead"), false);
  assert.match(elements.get("fxUnitPresetReadout").textContent, /FILTER 1\/8/);
  const fxLevelStrip = elements.get("fxStripLevel");
  assert.equal(fxLevelStrip.attributes["aria-disabled"], "false");
  fxLevelStrip.dispatch("keydown", { key: "ArrowUp" });
  assert.equal(elements.get("fxParameter").value, "2");
  assert.equal(elements.get("fxParamValueLabel").textContent, "68");
  elements.get("fxKnob").dispatch("keydown", { key: "ArrowRight" });
  assert.match(elements.get("fxUnitPresetReadout").textContent, /FILTER 2\/8/);
  knobs[5].dispatch("pointerdown", { pointerId: 91, clientY: 90 });
  elements.get("fxKnob").dispatch("wheel", { deltaY: -1 });
  const hatSound = elements.get("preset").children[1].textContent;
  assert.match(elements.get("stateReadout").textContent, /SOUND 2\//);
  textDrawn.length = 0;
  renderAt(1012);
  assert.ok(textDrawn.includes(hatSound));
  knobs[5].dispatch("pointerup", { pointerId: 91 });
  elements.get("fxKnob").dispatch("keydown", { key: "ArrowRight" });
  assert.match(elements.get("fxUnitPresetReadout").textContent, /FILTER 3\/8/);
  elements.get("fxModeControl").dispatch("click");
  assert.equal(elements.get("fxModeControl").attributes["aria-checked"], "true");
  assert.match(elements.get("fxUnitPresetReadout").textContent, /MASTER · FILTER 3\/8/);
  elements.get("fxPageControl").dispatch("click");
  assert.match(elements.get("fxUnitPageReadout").textContent, /^PAGE 2/);
  elements.get("fxStripHighPass").dispatch("keydown", { key: "ArrowUp" });
  assert.equal(elements.get("fxParamValueLabel").textContent, "68");
  elements.get("fxStripHighPass").dispatch("click");
  elements.get("fxPageControl").dispatch("click");
  elements.get("fxStripHighPass").dispatch("keydown", { key: "ArrowUp" });
  textDrawn.length = 0;
  renderAt(1005);
  assert.ok(textDrawn.includes("PERFORMANCE / ACTIVE WHILE HELD"));
  elements.get("fxStripHighPass").dispatch("keyup", { key: "ArrowUp" });
  textDrawn.length = 0;
  renderAt(1010);
  assert.equal(textDrawn.includes("PERFORMANCE / ACTIVE WHILE HELD"), false);
  elements.get("drumHardwareSteps").children[0].dispatch("click");
  assert.equal(elements.get("drumHardwareSteps").children[0].attributes["aria-pressed"], "true");
  assert.equal(elements.get("drumSteps").children[0].attributes["aria-pressed"], "true");
  knobs[0].dispatch("keydown", { key: " " });
  assert.equal(knobs[0].attributes["aria-pressed"], "true");
  assert.equal(knobs[1].attributes["aria-pressed"], "false");
  elements.get("drumHardwareSteps").children[2].dispatch("click", { detail: 1 });
  assert.match(elements.get("stateReadout").textContent, /ALL TRACKS · PATTERN 3 QUEUED/);
  elements.get("drumHardwareSteps").children[2].dispatch("click", { detail: 2 });
  assert.match(elements.get("stateReadout").textContent, /ALL TRACKS · PATTERN 3 SELECTED/);
  knobs[0].dispatch("keyup", { key: " " });
  assert.equal(knobs[0].attributes["aria-pressed"], "false");
  assert.equal(knobs[5].attributes["aria-pressed"], "true");
  const sideMute = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "mute"; });
  sideMute.dispatch("keydown", { key: " " });
  knobs[1].dispatch("pointerdown", { pointerId: 22, clientY: 90 });
  assert.match(elements.get("stateReadout").textContent, /CH 01 · MUTED/);
  knobs[1].dispatch("pointerup", { pointerId: 22 });
  sideMute.dispatch("keyup", { key: " " });
  knobs[0].dispatch("keydown", { key: " " });
  sideMute.dispatch("pointerdown", { pointerId: 23 });
  sideMute.dispatch("pointerup", { pointerId: 23 });
  sideMute.dispatch("click");
  assert.match(elements.get("stateReadout").innerHTML, /<path d="M10 2h4v2h-4z/);
  knobs[0].dispatch("keyup", { key: " " });
  assert.equal(knobs[0].attributes["aria-pressed"], "true");
  knobs[2].dispatch("pointerdown", { pointerId: 24, clientY: 90 });
  assert.match(elements.get("stateReadout").textContent, /CH 02 · MUTED · MUTE MODE/);
  knobs[0].dispatch("pointerdown", { pointerId: 25, clientY: 90 });
  assert.match(elements.get("stateReadout").textContent, /ALL TRACKS UNMUTED · MUTE MODE/);
  knobs[0].dispatch("pointerup", { pointerId: 25 });
  sideMute.dispatch("pointerdown", { pointerId: 26 });
  sideMute.dispatch("pointerup", { pointerId: 26 });
  sideMute.dispatch("click");
  assert.equal(knobs[0].attributes["aria-pressed"], "false");

  sideMute.dispatch("click");
  assert.equal(sideMute.attributes["aria-pressed"], "true");
  knobs[3].dispatch("pointerdown", { pointerId: 27, clientY: 90 });
  assert.match(elements.get("stateReadout").textContent, /CH 03 · MUTED · MUTE MODE/);
  sideMute.dispatch("click");
  assert.equal(sideMute.attributes["aria-pressed"], "false");

  const sideSolo = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "solo"; });
  sideSolo.dispatch("click");
  assert.equal(sideSolo.attributes["aria-pressed"], "true");
  knobs[2].dispatch("pointerdown", { pointerId: 28, clientY: 90 });
  assert.match(elements.get("stateReadout").textContent, /SOLO TRACK 2/);
  assert.equal(sideSolo.attributes["aria-pressed"], "false");

  const sideProject = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "project"; });
  sideProject.dispatch("click");
  assert.equal(elements.get("drumHardwareSteps").children[0].attributes["aria-disabled"], "false");
  elements.get("drumHardwareSteps").children[0].dispatch("click");
  assert.match(elements.get("stateReadout").textContent, /PROJECT SLOT 1 REQUESTED · PROJECT CONTENT NOT LOADED/);
  assert.equal(sideProject.attributes["aria-pressed"], "false");

  const sideDelete = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "delete"; });
  sideDelete.dispatch("click");
  elements.get("drumHardwareSteps").children[0].dispatch("click");
  assert.match(elements.get("stateReadout").textContent, /DELETE \+ DRUM KEY · TARGET DATA IS NOT LOADED/);
  assert.equal(sideDelete.attributes["aria-pressed"], "false");

  const sideSwing = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "swing"; });
  sideSwing.dispatch("click");
  knobs[0].dispatch("wheel", { deltaY: -1 });
  assert.match(elements.get("stateReadout").textContent, /SWING ADJUSTMENT · VALUE NOT AVAILABLE/);
  assert.equal(sideSwing.attributes["aria-pressed"], "false");

  const sidePage = hardwareSideControls.find(function (control) { return control.dataset.sideAction === "page"; });
  sidePage.dispatch("click");
  assert.match(elements.get("fxUnitPageReadout").textContent, /^PAGE 2/);
  assert.equal(sidePage.attributes["aria-pressed"], "true");
  sidePage.dispatch("click");
  assert.match(elements.get("fxUnitPageReadout").textContent, /^PAGE 1/);
  assert.equal(sidePage.attributes["aria-pressed"], "false");
  elements.get("synthHardwareKeys").children[0].dispatch("pointerdown");
  assert.equal(elements.get("synthHardwareKeys").children[0].classList.contains("pressed"), true);
  elements.get("synthHardwareKeys").children[0].dispatch("pointerup");
  assert.equal(elements.get("synthHardwareKeys").children[0].classList.contains("pressed"), false);
  const recordKey = elements.get("recordHardwareKey").children[0];
  recordKey.dispatch("pointerdown");
  assert.equal(recordKey.classList.contains("pressed"), true);
  recordKey.dispatch("pointerup");
  recordKey.dispatch("click");
  assert.equal(recordKey.attributes["aria-pressed"], "true");
  assert.equal(elements.get("recordToggle").textContent, "REC ON");
  recordKey.dispatch("click");
  assert.equal(recordKey.attributes["aria-pressed"], "false");
  elements.get("tracks").children.find(function (button) { return button.dataset.id === "snare"; }).dispatch("click");
  assert.equal(elements.get("drumSteps").children.length, 16);
  elements.get("drumSteps").children[0].dispatch("click");
  assert.equal(elements.get("drumSteps").children[0].attributes["aria-pressed"], "true");
  assert.ok(elements.get("preset").children.length > 1);
  const chosenPreset = elements.get("preset").children[1].textContent;
  elements.get("preset").value = "1";
  elements.get("preset").dispatch("change");
  textDrawn.length = 0;
  renderAt(1050);
  assert.ok(textDrawn.includes(chosenPreset));

  elements.get("cutoff").value = "90";
  elements.get("cutoff").dispatch("input");
  textDrawn.length = 0;
  renderAt(1100);
  assert.ok(textDrawn.includes("FILTER CUTOFF"));
  textDrawn.length = 0;
  renderAt(5000);
  assert.ok(textDrawn.includes("PATTERN 03 · 16 STEPS"));
  assert.equal(textDrawn.includes("FILTER CUTOFF"), false);

  elements.get("fxType").dispatch("change");
  textDrawn.length = 0;
  renderAt(5100);
  assert.ok(textDrawn.includes(elements.get("fxType").children[0].textContent));

  elements.get("midiChannel").value = "1";
  elements.get("midiController").value = "74";
  elements.get("midiValue").value = "90";
  elements.get("applyMidiEvent").dispatch("click");
  assert.match(elements.get("eventLog").textContent, /FILTER CUTOFF/);
  elements.get("bpmPreview").value = "140";
  elements.get("setBpmPreview").dispatch("click");
  textDrawn.length = 0;
  renderAt(5200);
  assert.ok(textDrawn.includes("BPM 140"));

  elements.get("midiChannel").value = "8";
  elements.get("noteOnPreview").dispatch("click");
  textDrawn.length = 0;
  renderAt(5300);
  assert.ok(textDrawn.includes("C"));

  elements.get("themeToggle").dispatch("click");
  renderAt(5400);
  assert.equal(document.documentElement.attributes["data-theme"], "dark");
  assert.ok(fills.includes("#F5F7F5"));
  assert.ok(fills.includes("#080A0D"));
});

test("hardware Sound Design selector matches the photographed parameter order", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const list = html.match(/<g fill="#282c2e" font-family="IBM Plex Mono, monospace" font-size="7\.5">([\s\S]*?)<\/g>/);
  assert.ok(list, "Sound Design parameter list should be present");
  const labels = Array.from(list[1].matchAll(/<text x="793" y="\d+">([^<]+)<\/text>/g), function (match) { return match[1]; });

  assert.deepEqual(labels, [
    "SOUND", "PITCH", "MONO/POLY", "CHORD", "PAN", "VOLUME", "ATTACK", "DECAY", "MICRO TIMING", "FILTER",
    "RESONANCE", "REVERB", "DELAY", "COMP", "DISTORTION", "MODULATION", "DUCKER", "OTHER", "MIXER", "SONG"
  ]);
});

test("FX selector and FX Level column are widened with separate adjacent strips", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const labels = Array.from(html.matchAll(/<text id="fxStripLabel\w+" x="(1027|1127|1247)" y="248" text-anchor="middle">([^<]+)<\/text>/g), function (match) {
    return { x: match[1], label: match[2] };
  });
  const stripLines = Array.from(html.matchAll(/M(1000|1095|1215) (\d+)h(54|64)/g), function (match) {
    return match[1];
  });

  assert.deepEqual(labels, [
    { x: "1027", label: "FX LEVEL" },
    { x: "1127", label: "HIGH PASS" },
    { x: "1247", label: "REPEATER" }
  ]);
  assert.equal(stripLines.filter(function (x) { return x === "1000"; }).length, 8);
  assert.equal(stripLines.filter(function (x) { return x === "1095"; }).length, 8);
  assert.equal(stripLines.filter(function (x) { return x === "1215"; }).length, 8);
  assert.match(html, /rect x="778" y="23" width="289"/);
  assert.match(html, /rect x="1067" y="23" width="240"/);
  assert.match(html, /id="fxStripLevel"[\s\S]*?<rect class="fx-strip-hit" x="989" y="258" width="76"/);
  assert.match(html, /id="fxStripHighPass"[\s\S]*?<rect class="fx-strip-hit" x="1069" y="258" width="116"/);
  assert.match(html, /id="fxStripRepeater"[\s\S]*?<rect class="fx-strip-hit" x="1189" y="258" width="116"/);
});

test("renderer draws each family and unknown MIDI tracks without throwing", function () {
  const context = fakeCanvasContext();
  const state = stateModel.selectFamily(stateModel.createInitialState(), "kick", catalog.presets, catalog.tracks, 0);
  for (const track of catalog.tracks) {
    renderer.render(context, Object.assign({}, state, { track: track }), 50, fxModel);
  }
  const unknown = Object.assign({}, state, {
    source: "midi",
    track: null,
    deviceTrack: { name: "PERC 1", channel: 6 },
    preset: null,
    view: "parameter",
    currentParameter: { key: "volume", name: "TRACK VOLUME", value: 64, min: 0, max: 127 }
  });
  renderer.render(context, unknown, 100, fxModel);
});

test("browser controller boots, applies CC events, and keeps the legacy adapter marked unverified", function () {
  const elements = new Map();
  const drawText = [];
  const transforms = [];
  let nextFrame = null;
  const context2d = new Proxy({}, {
    get: function (target, property) {
      if (property === "setTransform") return function () { transforms.push(Array.from(arguments)); };
      if (property === "fillText") return function (value) { drawText.push(String(value)); };
      if (property in target) return target[property];
      return function () {};
    },
    set: function (target, property, value) { target[property] = value; return true; }
  });

  function makeElement(id, tag) {
    const classes = new Set();
    return {
      id: id,
      tagName: tag || "DIV",
      value: id === "fxScope" ? "Single" : "",
      textContent: "",
      disabled: false,
      min: "0",
      max: "127",
      dataset: {},
      children: [],
      handlers: {},
      style: {},
      classList: {
        add: function (name) { classes.add(name); },
        remove: function (name) { classes.delete(name); },
        toggle: function (name, force) {
          if (force === undefined ? !classes.has(name) : force) classes.add(name);
          else classes.delete(name);
        },
        contains: function (name) { return classes.has(name); }
      },
      addEventListener: function (name, handler) {
        if (!this.handlers[name]) this.handlers[name] = [];
        this.handlers[name].push(handler);
      },
      append: function (child) { this.children.push(child); },
      replaceChildren: function () { this.children = []; },
      getAttribute: function () { return ""; },
      setAttribute: function (name, value) { this.attributes = this.attributes || {}; this.attributes[name] = String(value); },
      dispatch: function (name, event) {
        (this.handlers[name] || []).forEach(function (handler) { handler(event || { target: this }); }, this);
      }
    };
  }

  const ids = [
    "display", "tracks", "preset", "count", "cutoff", "cutoffVal", "resonance", "resonanceVal", "decay", "decayVal",
    "play", "next", "fxScope", "fxCategory", "fxType", "fxParameter", "fxParamValue", "fxParamValueLabel", "fxParamMeta",
    "fxVisualIntensity", "fxVisualIntensityVal", "fxVisualHint", "midiChannel", "midiController", "midiValue", "midiValueLabel",
    "applyMidiEvent", "sysexAddress", "sysexValue", "applyFxEvent", "demoFxSequence", "actual", "zoom", "hardware", "sizeNote", "eventLog",
    "language", "themeToggle", "bpmPreview", "setBpmPreview", "bpmDownPreview", "bpmUpPreview",
    "noteNumber", "noteVelocity", "noteOnPreview", "noteOffPreview"
  ];
  ids.forEach(function (id) { elements.set(id, makeElement(id, id === "preset" || id === "fxScope" || id === "fxCategory" || id === "fxType" || id === "fxParameter" || id === "midiChannel" || id === "midiController" ? "SELECT" : "DIV")); });
  elements.get("display").getContext = function () { return context2d; };
  elements.get("language").value = "en";
  elements.get("noteNumber").value = "60";
  elements.get("noteVelocity").value = "96";
  elements.get("midiValue").value = "64";
  elements.get("fxVisualIntensity").value = "65";
  elements.get("fxParamValue").value = "64";

  const fxTests = ["0", "0.5", "1"].map(function (level) {
    const button = makeElement("", "BUTTON");
    button.dataset.level = level;
    return button;
  });
  const document = {
    getElementById: function (id) { return elements.get(id); },
    createElement: function (tag) { return makeElement("", tag.toUpperCase()); },
    querySelectorAll: function (selector) {
      if (selector === ".tracks button") return elements.get("tracks").children;
      if (selector === ".fx-test") return fxTests;
      return [];
    },
    documentElement: { attributes: {}, setAttribute: function (name, value) { this.attributes[name] = String(value); }, style: { setProperty: function () {} } }
  };
  const sandbox = {
    window: null,
    document: document,
    performance: { now: function () { return 1000; } },
    requestAnimationFrame: function (callback) { nextFrame = callback; return 1; },
    console: console,
    SEQTRAK_CATALOG: catalog,
    SEQTRAK_FX_SPECS: fxSpecs,
    SeqtrakDisplayState: stateModel,
    SeqtrakFxModel: fxModel,
    SeqtrakDisplayRenderer: renderer,
    SeqtrakI18n: i18n
  };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/app.js"), "utf8"), sandbox, { filename: "js/app.js" });

  const event = sandbox.seqtrakControlChange(1, 74, 90);
  assert.equal(event.ok, true);
  assert.equal(event.name, "FILTER CUTOFF");
  assert.match(elements.get("eventLog").textContent, /KICK/);
  assert.deepEqual(transforms[0], [4, 0, 0, 4, 0, 0]);
  assert.equal(typeof nextFrame, "function");
  assert.equal(elements.get("themeToggle").textContent, "Switch to light mode");
  nextFrame(1000);
  assert.ok(drawText.includes("FILTER CUTOFF"));
  assert.ok(drawText.includes("BPM —"));

  sandbox.seqtrakUpdate({ bpm: 140 });
  drawText.length = 0;
  nextFrame(1005);
  assert.ok(drawText.includes("BPM 140"));

  elements.get("bpmPreview").value = "132.5";
  elements.get("setBpmPreview").dispatch("click");
  drawText.length = 0;
  nextFrame(1010);
  assert.ok(drawText.some(function (text) { return text.startsWith("BPM 132.5"); }));
  elements.get("bpmUpPreview").dispatch("click");
  drawText.length = 0;
  nextFrame(1015);
  assert.ok(drawText.some(function (text) { return text.startsWith("BPM 133.5"); }));

  const noteOn = sandbox.seqtrakNoteEvent({ type: "noteOn", channel: 1, note: 60, velocity: 96 });
  assert.equal(noteOn.ok, true);
  drawText.length = 0;
  nextFrame(1020);
  assert.ok(drawText.includes("MIDI NOTES / 60"));
  assert.equal(sandbox.seqtrakNoteEvent({ type: "noteOff", channel: 1, note: 60, velocity: 0 }).ok, true);

  assert.equal(sandbox.seqtrakNoteEvent({ type: "noteOn", channel: 8, note: 61, velocity: 96 }).ok, true);
  drawText.length = 0;
  nextFrame(1022);
  assert.ok(drawText.includes("C#"));
  assert.equal(drawText.includes("C#4"), false);
  assert.equal(sandbox.seqtrakNoteEvent({ type: "noteOff", channel: 8, note: 61, velocity: 0 }).ok, true);
  drawText.length = 0;
  nextFrame(1024);
  assert.equal(drawText.includes("C#"), false);

  sandbox.seqtrakControlChange(1, 23, 64);
  drawText.length = 0;
  nextFrame(1025);
  assert.ok(drawText.includes("MUTED"));
  sandbox.seqtrakControlChange(1, 24, 3);
  drawText.length = 0;
  nextFrame(1030);
  assert.ok(drawText.includes("SOLO TRACK 3"));
  sandbox.seqtrakControlChange(1, 7, 101);
  drawText.length = 0;
  nextFrame(1035);
  assert.ok(drawText.includes("101"));
  sandbox.seqtrakUpdate({ masterVolumeDisplay: "64" });
  drawText.length = 0;
  nextFrame(1040);
  assert.ok(drawText.some(function (text) { return /MASTER VOL 64/.test(text); }));

  sandbox.seqtrakUpdate({ track: "KICK" });
  drawText.length = 0;
  nextFrame(1100);
  assert.ok(drawText.includes("PRESET NOT RECEIVED"));

  elements.get("language").value = "ja";
  elements.get("language").dispatch("change", { target: elements.get("language") });
  assert.equal(document.documentElement.attributes.lang, "ja");
  elements.get("themeToggle").dispatch("click");
  assert.equal(document.documentElement.attributes["data-theme"], "light");
  assert.equal(elements.get("themeToggle").textContent, "ダークモードに切替");
  sandbox.seqtrakUpdate({ preset: "Test Tone" });
  drawText.length = 0;
  nextFrame(1200);
  assert.ok(drawText.includes("音色変更"));
  assert.ok(drawText.includes("音色名"));
  assert.ok(drawText.includes("Test Tone"));

  const legacy = sandbox.seqtrakFxTypeEvent("30 43 00", "01 02");
  assert.equal(legacy.known, true);
  assert.equal(legacy.protocolVerifiedAgainstUserGuide, false);
});

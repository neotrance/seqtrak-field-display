"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const stateModel = require(path.join(root, "js/display-state.js"));
const fxModel = require(path.join(root, "js/fx-model.js"));
const i18n = require(path.join(root, "js/i18n.js"));
const renderer = require(path.join(root, "js/display-renderer.js"));

function loadBrowserData(relativePath, property) {
  const window = {};
  const context = { window: window };
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  vm.runInNewContext(source, context, { filename: relativePath });
  return window[property];
}

const catalog = loadBrowserData("data/catalog.js", "SEQTRAK_CATALOG");
const fxSpecs = loadBrowserData("data/fx-specs.js", "SEQTRAK_FX_SPECS");

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

test("fixed fonts and the 4x canvas backing store remain in place", function () {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
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

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const midi = require(path.join(root, "js/live-monitor-midi.js"));
const monitor = require(path.join(root, "js/live-monitor-state.js"));

test("live monitor classifies notes, velocity-zero note-on, clock, start, and stop", function () {
  assert.equal(midi.classify([0x94, 60, 91]).type, "NOTE ON");
  assert.deepEqual(midi.classify([0x94, 60, 91]), {
    type: "NOTE ON", status: 0x94, channel: 5, note: 60, velocity: 91, bytes: [0x94, 60, 91]
  });
  assert.equal(midi.classify([0x84, 60, 37]).type, "NOTE OFF");
  assert.equal(midi.classify([0x94, 60, 0]).type, "NOTE OFF");
  assert.equal(midi.classify([0xf8]).type, "CLOCK");
  assert.equal(midi.classify([0xfa]).type, "START");
  assert.equal(midi.classify([0xfc]).type, "STOP");
  assert.deepEqual(midi.classify([0xb0, 110, 63]), {
    type: "CC", status: 0xb0, channel: 1, controller: 110, value: 63, bytes: [0xb0, 110, 63]
  });
  assert.equal(midi.classify([0xfb]), null);
});

test("port chooser prefers one SEQTRAK port and leaves ambiguous inputs for manual selection", function () {
  const inputs = [
    { id: "other", name: "USB MIDI", manufacturer: "Other" },
    { id: "seqtrak", name: "SEQTRAK", manufacturer: "Yamaha" }
  ];
  assert.equal(midi.preferredInput(inputs, null).id, "seqtrak");
  assert.equal(midi.preferredInput([{ id: "a", name: "MIDI A" }, { id: "b", name: "MIDI B" }], null), null);
  assert.equal(midi.preferredInput([{ id: "new", name: "Unrelated MIDI" }], { id: "old", name: "SEQTRAK" }), null);
  assert.equal(midi.preferredInput([{ id: "new-seqtrak", name: "SEQTRAK MIDI" }], { id: "old", name: "USB MIDI" }).id, "new-seqtrak");
  assert.equal(midi.preferredInput([{ id: "other-yamaha", name: "MODX", manufacturer: "Yamaha" }], { id: "old", name: "SEQTRAK" }), null);
});

test("LIVE MONITOR track order follows the Yamaha channel table", function () {
  assert.deepEqual(monitor.TRACKS.map(function (track) { return track.name; }), [
    "KICK", "SNARE", "CLAP", "HAT 1", "HAT 2", "PERC 1", "PERC 2", "SYNTH 1", "SYNTH 2", "DX", "SAMPLER"
  ]);
  assert.deepEqual(monitor.TRACKS.map(function (track) { return track.channel; }), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test("live monitor resets on Start, advances one step per six clocks, and stops", function () {
  let state = monitor.createState();
  state = monitor.applyMessage(state, { type: "CLOCK" }, 20);
  assert.equal(state.transport, "clock-only");
  assert.equal(state.currentStep, 0);
  state = monitor.applyMessage(state, { type: "START" }, 30);
  assert.equal(state.transport, "started");
  assert.equal(state.currentStep, 0);
  assert.equal(state.clockTicks, 0);
  for (let tick = 0; tick < 5; tick++) state = monitor.applyMessage(state, { type: "CLOCK" }, 40 + tick);
  assert.equal(state.currentStep, 0);
  state = monitor.applyMessage(state, { type: "CLOCK" }, 46);
  assert.equal(state.currentStep, 1);
  assert.equal(state.clockTicks, 6);
  state = monitor.applyMessage(state, { type: "STOP" }, 50);
  state = monitor.applyMessage(state, { type: "CLOCK" }, 51);
  assert.equal(state.transport, "stopped");
  assert.equal(state.currentStep, 1);
  assert.equal(state.clockTicks, 6);
});

test("track activity follows velocity and percussion decay, while synth activity ends on Note Off", function () {
  let state = monitor.createState();
  state = monitor.applyMessage(state, { type: "NOTE ON", channel: 5, note: 46, velocity: 127 }, 1);
  assert.equal(monitor.trackActivity(state, 5, 1), 1);
  assert.ok(monitor.trackActivity(state, 5, 500) < 1);
  assert.equal(monitor.trackActivity(state, 5, 1200), 0);

  state = monitor.applyMessage(state, { type: "NOTE ON", channel: 8, note: 60, velocity: 64 }, 10);
  assert.ok(monitor.trackActivity(state, 8, 1000) > 0.49);
  state = monitor.applyMessage(state, { type: "NOTE OFF", channel: 8, note: 60, velocity: 0 }, 1010);
  assert.ok(monitor.trackActivity(state, 8, 1010) > 0.49);
  assert.equal(monitor.trackActivity(state, 8, 1200), 0);
});

test("MIDI Clock estimates tempo and advances provisional six-clock steps", function () {
  let state = monitor.applyMessage(monitor.createState(), { type: "START" }, 0);
  for (let tick = 1; tick <= 12; tick++) {
    state = monitor.applyMessage(state, { type: "CLOCK" }, tick * 20.8333);
  }
  assert.equal(state.currentStep, 2);
  assert.equal(state.estimatedBpm, 120);
  assert.equal(monitor.clockStatus(state, 300), "CLOCK RECEIVING");
  assert.equal(monitor.clockStatus(state, 1300), "CLOCK LOST");
});

test("Clock-only playback is visible as SYNC with an estimated phase until Start confirms transport", function () {
  let state = monitor.createState();
  for (let tick = 0; tick < 12; tick++) {
    state = monitor.applyMessage(state, { type: "CLOCK" }, tick * 20.8333);
  }
  assert.equal(state.transport, "clock-only");
  assert.equal(state.currentStep, 2);
  assert.equal(monitor.clockStatus(state, 240), "CLOCK RECEIVING");
  state = monitor.applyMessage(state, { type: "START" }, 250);
  assert.equal(state.transport, "started");
  assert.equal(state.currentStep, 0);
  assert.equal(state.clockTicks, 0);
});

test("only documented FX assigned-parameter CCs update live FX values", function () {
  let state = monitor.createState();
  state = monitor.applyMessage(state, { type: "CC", channel: 1, controller: 110, value: 72 }, 10);
  assert.equal(state.fxValues["1:110"], 72);
  state = monitor.applyMessage(state, { type: "CC", channel: 5, controller: 108, value: 41 }, 20);
  assert.equal(state.fxValues["5:108"], 41);
  assert.equal(state.fxChannel, 5);
  const invalidGlobal = monitor.applyMessage(state, { type: "CC", channel: 5, controller: 110, value: 99 }, 25);
  assert.equal(invalidGlobal, state);
  const unchanged = monitor.applyMessage(state, { type: "CC", channel: 1, controller: 23, value: 127 }, 30);
  assert.equal(unchanged, state);
});

test("live monitor receiver requests non-SysEx access and auto-selects a sole input", async function () {
  const port = {
    id: "usb-1", name: "SEQTRAK MIDI", manufacturer: "Yamaha", state: "connected",
    open: async function () {}, close: async function () { this.closed = true; }
  };
  const access = { inputs: new Map([[port.id, port]]), onstatechange: null };
  let requestedOptions = null;
  const statuses = [];
  const environment = {
    navigator: { requestMIDIAccess: async function (options) { requestedOptions = options; return access; } },
    performance: { now: function () { return 100; } }
  };
  const receiver = midi.createReceiver({ onStatus: function (value) { statuses.push(value.status); } }, environment);
  const result = await receiver.connect();
  await new Promise(function (resolve) { setImmediate(resolve); });
  assert.deepEqual(requestedOptions, { sysex: false });
  assert.equal(result.inputs.length, 1);
  assert.equal(statuses.includes("listening"), true);
  assert.equal(port.onmidimessage !== null, true);
  await receiver.disconnect();
  assert.equal(port.onmidimessage, null);
  assert.equal(port.closed, true);
});

test("live monitor keeps a selected port through cable disconnect and reconnect", async function () {
  const port = {
    id: "usb-seqtrak", name: "SEQTRAK", manufacturer: "Yamaha", state: "connected",
    open: async function () {}, close: async function () {}
  };
  const access = { inputs: new Map([[port.id, port]]), onstatechange: null };
  const statuses = [];
  const receiver = midi.createReceiver({ onStatus: function (value) { statuses.push(value.status); } }, {
    navigator: { requestMIDIAccess: async function () { return access; } },
    performance: { now: function () { return 100; } }
  });
  await receiver.connect();
  await new Promise(function (resolve) { setImmediate(resolve); });
  const firstHandler = port.onmidimessage;
  port.state = "disconnected";
  access.onstatechange();
  await new Promise(function (resolve) { setImmediate(resolve); });
  assert.equal(statuses.includes("device-disconnected"), true);
  assert.equal(port.onmidimessage, null);
  port.state = "connected";
  access.onstatechange();
  await new Promise(function (resolve) { setImmediate(resolve); });
  assert.equal(port.onmidimessage !== null, true);
  assert.notEqual(port.onmidimessage, firstHandler);
  await receiver.disconnect();
});

test("live monitor reports denied MIDI permission and permits retry", async function () {
  const statuses = [];
  let requests = 0;
  const receiver = midi.createReceiver({ onStatus: function (value) { statuses.push(value.status); } }, {
    navigator: { requestMIDIAccess: async function () { requests++; throw new Error("denied"); } },
    performance: { now: function () { return 0; } }
  });
  await assert.rejects(receiver.connect(), /denied/i);
  assert.equal(statuses.includes("permission-denied"), true);
  assert.equal(requests, 1);
});

test("live monitor exposes TRACKS and FX pages, receive-only controls, and a log clear action", function () {
  const live = fs.readFileSync(path.join(root, "live-monitor.html"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const oldPreview = fs.readFileSync(path.join(root, "display-preview.html"), "utf8");
  const midiSource = fs.readFileSync(path.join(root, "js/live-monitor-midi.js"), "utf8");

  assert.match(live, /href="index\.html"[^>]*>SIMULATOR/);
  assert.match(live, /id="livePageTracks"/);
  assert.match(live, /id="livePageFx"/);
  assert.doesNotMatch(live, /id="liveStepGrid"/);
  assert.match(live, /id="liveLogCopy"/);
  assert.match(live, /id="liveLogClear"/);
  assert.match(index, /href="live-monitor\.html">LIVE MONITOR/);
  assert.match(oldPreview, /href="live-monitor\.html">LIVE MONITOR/);
  assert.match(midiSource, /requestMIDIAccess\(\{ sysex: false \}\)/);
  assert.doesNotMatch(midiSource, /\.send\(/);
});

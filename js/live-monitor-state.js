(function (root, factory) {
  const api = factory();
  root.SeqtrakLiveMonitorState = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const TRACKS = [
    { channel: 1, name: "KICK" }, { channel: 2, name: "SNARE" },
    { channel: 3, name: "CLAP" }, { channel: 4, name: "HAT 1" },
    { channel: 5, name: "HAT 2" }, { channel: 6, name: "PERC 1" },
    { channel: 7, name: "PERC 2" }, { channel: 8, name: "SYNTH 1" },
    { channel: 9, name: "SYNTH 2" }, { channel: 10, name: "DX" },
    { channel: 11, name: "SAMPLER" }
  ];
  const CLOCKS_PER_STEP = 6;
  const STEP_COUNT = 16;
  const CLOCK_TIMEOUT_MS = 1000;
  const NOTE_RELEASE_MS = 180;
  const PERCUSSION_DECAY_MS = 720;
  const STUCK_NOTE_TIMEOUT_MS = 10000;

  function createState() {
    return {
      connectionStatus: "disconnected",
      portName: "",
      transport: "unknown",
      clockTicks: 0,
      clockMessages: 0,
      clockIntervals: [],
      estimatedBpm: null,
      currentStep: null,
      lastClockAt: null,
      activeNotes: {},
      fxValues: {},
      fxChannel: null,
      lastNote: null
    };
  }

  function setConnection(state, status, portName) {
    const disconnected = status === "disconnected" || status === "device-disconnected";
    return Object.assign({}, state, {
      connectionStatus: String(status || "disconnected"),
      portName: String(portName || ""),
      transport: disconnected ? "unknown" : state.transport,
      clockTicks: disconnected ? 0 : state.clockTicks,
      clockIntervals: disconnected ? [] : state.clockIntervals,
      estimatedBpm: disconnected ? null : state.estimatedBpm,
      currentStep: disconnected ? null : state.currentStep,
      lastClockAt: disconnected ? null : state.lastClockAt,
      activeNotes: disconnected ? {} : state.activeNotes,
      fxValues: disconnected ? {} : state.fxValues,
      fxChannel: disconnected ? null : state.fxChannel
    });
  }

  function median(values) {
    const sorted = values.slice().sort(function (a, b) { return a - b; });
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function estimateBpm(intervals) {
    if (intervals.length < 6) return null;
    const tickMs = median(intervals);
    if (!Number.isFinite(tickMs) || tickMs <= 0) return null;
    const bpm = 60000 / (tickMs * 24);
    return bpm >= 5 && bpm <= 300 ? Math.round(bpm) : null;
  }

  function trackActivity(state, channel, now) {
    const time = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    const notes = state.activeNotes[channel] || [];
    return notes.reduce(function (level, item) {
      const age = Math.max(0, time - item.at);
      let envelope = 1;
      if (item.releasedAt !== null) {
        const releaseAge = Math.max(0, time - item.releasedAt);
        envelope = Math.max(0, 1 - releaseAge / NOTE_RELEASE_MS);
      } else if (channel <= 7) {
        envelope = Math.exp(-age / (PERCUSSION_DECAY_MS / 3));
        if (age > PERCUSSION_DECAY_MS * 1.5) envelope = 0;
      } else if (age > STUCK_NOTE_TIMEOUT_MS) {
        envelope = 0;
      }
      return Math.max(level, (Math.max(0, Math.min(127, item.velocity)) / 127) * envelope);
    }, 0);
  }

  function applyMessage(state, message, at) {
    const time = Number.isFinite(Number(at)) ? Number(at) : Date.now();
    if (!message) return state;
    if (message.type === "START") {
      return Object.assign({}, state, {
        transport: "started",
        clockTicks: 0,
        currentStep: 0,
        clockIntervals: [],
        estimatedBpm: null,
        lastClockAt: null,
        activeNotes: {},
        lastNote: null
      });
    }
    if (message.type === "STOP") return Object.assign({}, state, { transport: "stopped" });
    if (message.type === "CLOCK") {
      const clockOnlyStart = state.transport === "unknown";
      const clockRunning = state.transport === "started" || state.transport === "clock-only" || clockOnlyStart;
      const ticks = clockRunning ? state.clockTicks + 1 : state.clockTicks;
      const step = clockRunning && ticks > 0 && ticks % CLOCKS_PER_STEP === 0
        ? Math.floor(ticks / CLOCKS_PER_STEP) % STEP_COUNT
        : clockOnlyStart && state.currentStep === null ? 0 : state.currentStep;
      const interval = state.lastClockAt === null ? null : time - state.lastClockAt;
      const clockIntervals = interval !== null && interval >= 2 && interval <= 1000
        ? state.clockIntervals.concat([interval]).slice(-24)
        : interval === null ? state.clockIntervals : [];
      return Object.assign({}, state, {
        clockTicks: ticks,
        clockMessages: state.clockMessages + 1,
        currentStep: step,
        transport: clockOnlyStart ? "clock-only" : state.transport,
        lastClockAt: time,
        clockIntervals: clockIntervals,
        estimatedBpm: estimateBpm(clockIntervals)
      });
    }

    const globalFxController = message && message.type === "CC"
      && ((message.controller >= 102 && message.controller <= 106) || (message.controller >= 110 && message.controller <= 115));
    if (message.type === "CC" && Number.isInteger(message.controller)
      && message.controller >= 102 && message.controller <= 115
      && Number.isInteger(message.channel) && message.channel >= 1 && message.channel <= TRACKS.length
      && (!globalFxController || message.channel === 1)
      && Number.isInteger(message.value) && message.value >= 0 && message.value <= 127) {
      const fxValues = Object.assign({}, state.fxValues);
      fxValues[message.channel + ":" + message.controller] = message.value;
      return Object.assign({}, state, {
        fxValues: fxValues,
        fxChannel: message.controller >= 107 && message.controller <= 109 ? message.channel : state.fxChannel
      });
    }

    if ((message.type === "NOTE ON" || message.type === "NOTE OFF")
      && Number.isInteger(message.channel) && message.channel >= 1 && message.channel <= TRACKS.length
      && Number.isInteger(message.note) && message.note >= 0 && message.note <= 127) {
      const activeNotes = Object.assign({}, state.activeNotes);
      const notes = (activeNotes[message.channel] || []).filter(function (item) {
        const expiredRelease = item.releasedAt !== null && time - item.releasedAt > NOTE_RELEASE_MS;
        const expiredOneShot = message.channel <= 7 && time - item.at > PERCUSSION_DECAY_MS * 1.5;
        const expiredHeldNote = message.channel > 7 && time - item.at > STUCK_NOTE_TIMEOUT_MS;
        return !expiredRelease && !expiredOneShot && !expiredHeldNote;
      });
      const index = notes.findIndex(function (item) { return item.note === message.note; });
      const isOn = message.type === "NOTE ON" && Number(message.velocity) > 0;
      const noteEvent = {
        channel: message.channel,
        track: TRACKS[message.channel - 1].name,
        note: message.note,
        velocity: Number(message.velocity),
        type: isOn ? "NOTE ON" : "NOTE OFF",
        at: time,
      };
      if (isOn) {
        const active = { note: message.note, velocity: Number(message.velocity), at: time, releasedAt: null };
        if (index >= 0) notes[index] = active;
        else notes.push(active);
      } else if (index >= 0) notes[index] = Object.assign({}, notes[index], { releasedAt: time });
      if (notes.length) activeNotes[message.channel] = notes;
      else delete activeNotes[message.channel];
      return Object.assign({}, state, { activeNotes: activeNotes, lastNote: noteEvent });
    }
    return state;
  }

  function clockStatus(state, now) {
    const time = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    if (state.lastClockAt === null) return "CLOCK NOT RECEIVED";
    if (time - state.lastClockAt > CLOCK_TIMEOUT_MS) return "CLOCK LOST";
    return state.transport === "started" || state.transport === "clock-only"
      ? "CLOCK RECEIVING" : "CLOCK RECEIVED · STOPPED";
  }

  function noteName(note) {
    const number = Number(note);
    if (!Number.isInteger(number) || number < 0 || number > 127) return "—";
    const names = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
    return names[number % 12] + (Math.floor(number / 12) - 1);
  }

  return {
    TRACKS: TRACKS,
    CLOCKS_PER_STEP: CLOCKS_PER_STEP,
    STEP_COUNT: STEP_COUNT,
    CLOCK_TIMEOUT_MS: CLOCK_TIMEOUT_MS,
    NOTE_RELEASE_MS: NOTE_RELEASE_MS,
    PERCUSSION_DECAY_MS: PERCUSSION_DECAY_MS,
    createState: createState,
    setConnection: setConnection,
    applyMessage: applyMessage,
    clockStatus: clockStatus,
    trackActivity: trackActivity,
    estimateBpm: estimateBpm,
    noteName: noteName
  };
});

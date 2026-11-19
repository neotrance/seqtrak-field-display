(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakDisplayState = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const ALL_CHANNELS = Array.from({ length: 11 }, function (_, i) { return i + 1; });
  const SYNTH_CHANNELS = [8, 9, 10];
  const DRUM_CHANNELS = [1, 2, 3, 4, 5, 6, 7];
  const MIDI_TRACKS = {
    1: { name: "KICK", family: "kick" },
    2: { name: "SNARE", family: "snare" },
    3: { name: "CLAP", family: null },
    4: { name: "HAT 1", family: "hat" },
    5: { name: "HAT 2", family: "hat" },
    6: { name: "PERC 1", family: null },
    7: { name: "PERC 2", family: null },
    8: { name: "SYNTH 1", family: "synth" },
    9: { name: "SYNTH 2", family: "synth" },
    10: { name: "DX", family: "synth" },
    11: { name: "SAMPLER", family: null }
  };

  // Controller numbers, channels, and value ranges are from the Yamaha user guide.
  const SOUND_CONTROLLERS = {
    7: { key: "volume", name: "TRACK VOLUME", min: 0, max: 127, channels: ALL_CHANNELS },
    10: { key: "pan", name: "TRACK PAN", min: 1, max: 127, channels: ALL_CHANNELS },
    11: { key: "expression", name: "EXPRESSION CONTROL", min: 0, max: 127, channels: ALL_CHANNELS },
    20: { key: "eqHigh", name: "EQ HIGH GAIN", min: 40, max: 88, channels: ALL_CHANNELS },
    21: { key: "eqLow", name: "EQ LOW GAIN", min: 40, max: 88, channels: ALL_CHANNELS },
    23: { key: "mute", name: "MUTE", min: 0, max: 127, channels: ALL_CHANNELS },
    24: { key: "solo", name: "SOLO", min: 0, max: 11, channels: ALL_CHANNELS },
    25: { key: "pitch", name: "DRUM PITCH", min: 40, max: 88, channels: DRUM_CHANNELS },
    26: { key: "voiceMode", name: "MONO / POLY / CHORD", min: 0, max: 2, channels: SYNTH_CHANNELS },
    27: { key: "arpType", name: "ARP TYPE", min: 0, max: 16, channels: SYNTH_CHANNELS },
    28: { key: "arpGate", name: "ARP GATE", min: 0, max: 127, channels: SYNTH_CHANNELS },
    29: { key: "arpSpeed", name: "ARP SPEED", min: 0, max: 9, channels: SYNTH_CHANNELS },
    64: { key: "damper", name: "DAMPER PEDAL", min: 0, max: 127, channels: [8, 9, 10, 11] },
    65: { key: "portamentoSwitch", name: "PORTAMENTO SWITCH", min: 0, max: 1, channels: SYNTH_CHANNELS },
    66: { key: "sostenuto", name: "SOSTENUTO", min: 0, max: 127, channels: [8, 9, 11] },
    71: { key: "resonance", name: "FILTER RESONANCE", min: 0, max: 127, channels: ALL_CHANNELS },
    73: { key: "attack", name: "ATTACK TIME", min: 0, max: 127, channels: ALL_CHANNELS },
    74: { key: "cutoff", name: "FILTER CUTOFF", min: 0, max: 127, channels: ALL_CHANNELS },
    75: { key: "decay", name: "DECAY / RELEASE TIME", min: 0, max: 127, channels: ALL_CHANNELS },
    91: { key: "reverbSend", name: "REVERB SEND", min: 0, max: 127, channels: ALL_CHANNELS },
    94: { key: "delaySend", name: "DELAY SEND", min: 0, max: 127, channels: ALL_CHANNELS },
    5: { key: "portamentoTime", name: "PORTAMENTO TIME", min: 0, max: 127, channels: SYNTH_CHANNELS },
    116: { key: "fmAlgorithm", name: "FM ALGORITHM", min: 0, max: 127, channels: [10] },
    117: { key: "fmAmount", name: "FM MODULATION AMOUNT", min: 0, max: 127, channels: [10] },
    118: { key: "fmFrequency", name: "FM MODULATOR FREQUENCY", min: 0, max: 127, channels: [10] },
    119: { key: "fmFeedback", name: "FM MODULATOR FEEDBACK", min: 0, max: 127, channels: [10] }
  };

  const EFFECT_CONTROLLERS = {
    102: { scope: "Master 1", name: "MASTER EFFECT 1", parameter: 1, channels: [1] },
    103: { scope: "Master 1", name: "MASTER EFFECT 1", parameter: 2, channels: [1] },
    104: { scope: "Master 1", name: "MASTER EFFECT 1", parameter: 3, channels: [1] },
    105: { scope: "Master 2", name: "MASTER EFFECT 2", parameter: null, channels: [1] },
    106: { scope: "Master 3", name: "MASTER EFFECT 3", parameter: null, channels: [1] },
    107: { scope: "Single", name: "SINGLE EFFECT", parameter: 1, channels: ALL_CHANNELS },
    108: { scope: "Single", name: "SINGLE EFFECT", parameter: 2, channels: ALL_CHANNELS },
    109: { scope: "Single", name: "SINGLE EFFECT", parameter: 3, channels: ALL_CHANNELS },
    110: { scope: "Send", bank: "REVERB", name: "SEND REVERB", parameter: 1, channels: [1] },
    111: { scope: "Send", bank: "REVERB", name: "SEND REVERB", parameter: 2, channels: [1] },
    112: { scope: "Send", bank: "REVERB", name: "SEND REVERB", parameter: 3, channels: [1] },
    113: { scope: "Send", bank: "DELAY", name: "SEND DELAY", parameter: 1, channels: [1] },
    114: { scope: "Send", bank: "DELAY", name: "SEND DELAY", parameter: 2, channels: [1] },
    115: { scope: "Send", bank: "DELAY", name: "SEND DELAY", parameter: 3, channels: [1] }
  };

  const CC_CHOICES = Object.keys(SOUND_CONTROLLERS).map(Number)
    .concat(Object.keys(EFFECT_CONTROLLERS).map(Number))
    .sort(function (a, b) { return a - b; })
    .map(function (controller) {
      const definition = SOUND_CONTROLLERS[controller] || EFFECT_CONTROLLERS[controller];
      return { controller: controller, name: definition.name };
    });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function availablePresets(presets, track) {
    if (!track) return [];
    if (track.id === "synth") {
      return presets.filter(function (preset) { return preset.engine === "Synth" || preset.engine === "DX"; });
    }
    if (track.id === "bass") {
      return presets.filter(function (preset) {
        return /bass/i.test(preset.category || "") || /bass/i.test(preset.name || "");
      });
    }
    const categoryPattern = new RegExp(String(track.category || "").replace("-", ".?"), "i");
    return presets.filter(function (preset) {
      return preset.engine === "Drum" && categoryPattern.test((preset.category || "") + " " + (preset.name || ""));
    });
  }

  function createInitialState() {
    return {
      theme: "dark",
      language: "en",
      track: null,
      source: "demo",
      deviceTrack: null,
      soundValue: null,
      presets: [],
      preset: null,
      selectedIndex: -1,
      values: { cutoff: 74, resonance: 35, decay: 55 },
      bpm: null,
      bpmSource: null,
      bpmChange: null,
      masterVolumeDisplay: null,
      volumeByChannel: {},
      muteByChannel: {},
      soloTrack: null,
      noteEvents: [],
      activeNote: null,
      recording: false,
      midiPlayback: createMidiPlaybackState(),
      playbackOverview: false,
      playbackFocus: false,
      currentParameter: { key: "cutoff", name: "FILTER CUTOFF", value: 74, min: 0, max: 127 },
      playing: true,
      view: "overview",
      until: 0,
      fx: {
        scope: "Single",
        effect: null,
        parameter: null,
        parameterValue: null,
        visualIntensity: 65,
        controlChange: null,
        receivedSlotLabel: null
      }
    };
  }

  function createMidiPlaybackState() {
    return {
      mode: "unknown",
      active: false,
      clockTicks: 0,
      currentStep: null,
      lastClockAt: null,
      clockIntervals: [],
      estimatedBpm: null
    };
  }

  function median(values) {
    const ordered = values.slice().sort(function (a, b) { return a - b; });
    if (!ordered.length) return null;
    const middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  }

  function applyMidiRealtime(state, status, at) {
    const time = Number.isFinite(Number(at)) ? Number(at) : Date.now();
    const previous = state.midiPlayback || createMidiPlaybackState();
    if (status === 0xfa) {
      return Object.assign({}, state, {
        playbackOverview: true,
        playbackFocus: false,
        midiPlayback: {
          mode: "started", active: true, clockTicks: 0, currentStep: 0,
          lastClockAt: null, clockIntervals: [], estimatedBpm: null
        }
      });
    }
    if (status === 0xfc) {
      return Object.assign({}, state, {
        playbackOverview: Boolean(state.playing),
        playbackFocus: false,
        midiPlayback: Object.assign({}, previous, { mode: "stopped", active: false })
      });
    }
    if (status !== 0xf8 || previous.mode === "stopped") return state;

    const gap = previous.lastClockAt === null ? null : time - previous.lastClockAt;
    const lostClock = gap !== null && gap > 1000;
    const resetClockPhase = previous.mode === "unknown" || previous.mode === "clock-only" && lostClock;
    const intervals = gap !== null && gap >= 2 && gap <= 1000
      ? previous.clockIntervals.concat([gap]).slice(-24)
      : gap === null || resetClockPhase ? [] : [];
    const clockTicks = resetClockPhase ? 1 : previous.clockTicks + 1;
    const currentStep = resetClockPhase
      ? 0
      : clockTicks > 0 && clockTicks % 6 === 0 ? Math.floor(clockTicks / 6) % 16 : previous.currentStep;
    const tickMs = intervals.length >= 6 ? median(intervals) : null;
    const rawBpm = tickMs ? 60000 / (tickMs * 24) : null;
    return Object.assign({}, state, {
      playbackOverview: !state.playbackFocus,
      midiPlayback: {
        mode: previous.mode === "started" ? "started" : "clock-only",
        active: true,
        clockTicks: clockTicks,
        currentStep: currentStep,
        lastClockAt: time,
        clockIntervals: intervals,
        estimatedBpm: rawBpm !== null && rawBpm >= 5 && rawBpm <= 300 ? Math.round(rawBpm) : null
      }
    });
  }

  function midiPlaybackActive(playback, now) {
    if (!playback || !playback.active) return false;
    if (playback.mode !== "clock-only" || playback.lastClockAt === null) return true;
    return Number(now) - playback.lastClockAt <= 1000;
  }

  function selectFamily(state, familyId, presets, tracks, now) {
    const track = tracks.find(function (item) { return item.id === familyId; });
    if (!track) return state;
    const options = availablePresets(presets, track);
    return Object.assign({}, state, {
      track: track,
      source: "demo",
      deviceTrack: null,
      soundValue: null,
      presets: options,
      preset: options.length ? options[0] : null,
      selectedIndex: options.length ? 0 : -1,
      view: "track",
      until: now + 2400,
      fx: Object.assign({}, state.fx, { controlChange: null, receivedSlotLabel: null })
    });
  }

  function selectPreset(state, index, now) {
    if (!Number.isInteger(index) || index < 0 || index >= state.presets.length) return state;
    return Object.assign({}, state, {
      source: "demo",
      preset: state.presets[index],
      soundValue: null,
      selectedIndex: index,
      view: "sound",
      until: now + 2400,
      fx: Object.assign({}, state.fx, { controlChange: null, receivedSlotLabel: null })
    });
  }

  function setSoundParameter(state, key, value, now, definition) {
    const min = definition ? definition.min : 0;
    const max = definition ? definition.max : 127;
    const normalized = clamp(Number(value), min, max);
    const values = Object.assign({}, state.values);
    if (Object.prototype.hasOwnProperty.call(values, key)) values[key] = normalized;
    return Object.assign({}, state, {
      currentParameter: {
        key: key,
        name: definition ? definition.name : key.toUpperCase(),
        value: normalized,
        min: min,
        max: max
      },
      values: values,
      view: "parameter",
      until: now + 2400,
      fx: Object.assign({}, state.fx, { controlChange: null, receivedSlotLabel: null })
    });
  }

  function decodeControlChange(channel, controller, value) {
    const ch = Number(channel);
    const cc = Number(controller);
    const raw = Number(value);
    if (!Number.isInteger(ch) || ch < 1 || ch > 16) return { ok: false, reason: "MIDI channel must be 1-16" };
    if (!Number.isInteger(cc) || cc < 0 || cc > 127) return { ok: false, reason: "CC number must be 0-127" };
    if (!Number.isInteger(raw) || raw < 0 || raw > 127) return { ok: false, reason: "CC value must be 0-127" };

    const track = MIDI_TRACKS[ch] || null;
    const sound = SOUND_CONTROLLERS[cc];
    if (sound) {
      if (!sound.channels.includes(ch)) return { ok: false, reason: "This CC is not documented for the selected channel" };
      if (raw < sound.min || raw > sound.max) return { ok: false, reason: "Value is outside the documented range" };
      return {
        ok: true,
        kind: "sound",
        channel: ch,
        controller: cc,
        value: raw,
        parameter: sound.key,
        name: sound.name,
        min: sound.min,
        max: sound.max,
        track: track ? Object.assign({ channel: ch }, track) : null
      };
    }

    const effect = EFFECT_CONTROLLERS[cc];
    if (effect) {
      if (!effect.channels.includes(ch)) return { ok: false, reason: "This effect CC is documented on channel 1 only" };
      return {
        ok: true,
        kind: "effect",
        channel: ch,
        controller: cc,
        value: raw,
        scope: effect.scope,
        bank: effect.bank || null,
        name: effect.name,
        parameter: effect.parameter,
        track: track ? Object.assign({ channel: ch }, track) : null
      };
    }
    return { ok: false, reason: "CC is not listed in the user guide" };
  }

  function applyControlChange(state, decoded, tracks, now) {
    if (!decoded || !decoded.ok) return state;
    if (decoded.kind === "sound") {
      const focusChannel = decoded.parameter === "solo" && decoded.value > 0 ? decoded.value : decoded.channel;
      const trackInfo = MIDI_TRACKS[focusChannel] || decoded.track;
      const deviceTrack = trackInfo ? Object.assign({ channel: focusChannel }, trackInfo) : null;
      const family = deviceTrack && deviceTrack.family
        ? tracks.find(function (item) { return item.id === deviceTrack.family; }) || null
        : null;
      const values = Object.assign({}, state.values);
      if (Object.prototype.hasOwnProperty.call(values, decoded.parameter)) values[decoded.parameter] = decoded.value;
      const volumeByChannel = Object.assign({}, state.volumeByChannel);
      const muteByChannel = Object.assign({}, state.muteByChannel);
      let soloTrack = state.soloTrack;
      if (decoded.parameter === "volume") volumeByChannel[decoded.channel] = decoded.value;
      if (decoded.parameter === "mute") muteByChannel[decoded.channel] = decoded.value >= 64;
      if (decoded.parameter === "solo") soloTrack = decoded.value === 0 ? null : decoded.value;
      return Object.assign({}, state, {
        track: family,
        source: "midi",
        deviceTrack: deviceTrack,
        presets: [],
        preset: null,
        selectedIndex: -1,
        values: values,
        volumeByChannel: volumeByChannel,
        muteByChannel: muteByChannel,
        soloTrack: soloTrack,
        currentParameter: {
          key: decoded.parameter,
          name: decoded.name,
          value: decoded.value,
          min: decoded.min,
          max: decoded.max
        },
        view: "parameter",
        until: now + 2400,
        fx: Object.assign({}, state.fx, { controlChange: null, receivedSlotLabel: null })
      });
    }
    const deviceTrack = decoded.scope === "Single" ? decoded.track : null;
    const family = deviceTrack && deviceTrack.family
      ? tracks.find(function (item) { return item.id === deviceTrack.family; }) || null
      : null;
    return Object.assign({}, state, {
      track: family,
      source: "midi",
      deviceTrack: deviceTrack,
      presets: [],
      preset: null,
      selectedIndex: -1,
      view: "effect",
      until: now + 2400,
      fx: Object.assign({}, state.fx, {
        controlChange: decoded,
        receivedSlotLabel: decoded.name
      })
    });
  }

  function decodeStepChange(bytes) {
    const data = Array.from(bytes || [], function (value) { return Number(value) & 0xff; });
    const header = [0xf0, 0x43, 0x10, 0x7f, 0x1c, 0x0c, 0x70];
    if (!header.every(function (value, index) { return data[index] === value; }) || data[data.length - 1] !== 0xf7) return null;
    const operation = Number(data[7]);
    const action = operation >= 0x00 && operation <= 0x0a && data.length === 15 ? "on"
      : operation >= 0x20 && operation <= 0x2a && data.length === 11 ? "off" : null;
    const channel = (operation & 0x1f) + 1;
    const step = Number(data[9]) + 1;
    if (!action || channel < 1 || channel > 11 || step < 1 || step > 128) return null;
    return {
      action: action,
      channel: channel,
      step: step,
      note: action === "on" ? data[10] : null,
      velocity: action === "on" ? data[11] : null,
      gate: action === "on" ? data[12] * 128 + data[13] : null
    };
  }

  function expireView(state, now) {
    if (state.view === "overview" || !state.until || now <= state.until) return state;
    return Object.assign({}, state, { view: "overview", until: 0 });
  }

  return {
    CC_CHOICES: CC_CHOICES,
    MIDI_TRACKS: MIDI_TRACKS,
    SOUND_CONTROLLERS: SOUND_CONTROLLERS,
    EFFECT_CONTROLLERS: EFFECT_CONTROLLERS,
    availablePresets: availablePresets,
    createInitialState: createInitialState,
    createMidiPlaybackState: createMidiPlaybackState,
    applyMidiRealtime: applyMidiRealtime,
    midiPlaybackActive: midiPlaybackActive,
    selectFamily: selectFamily,
    selectPreset: selectPreset,
    setSoundParameter: setSoundParameter,
    decodeControlChange: decodeControlChange,
    decodeStepChange: decodeStepChange,
    applyControlChange: applyControlChange,
    expireView: expireView,
    clamp: clamp
  };
});

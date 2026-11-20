(function (root, factory) {
  const i18n = typeof module === "object" && module.exports ? require("./i18n.js") : root.SeqtrakI18n;
  const pixelArtIcons = typeof module === "object" && module.exports ? require("./pixelarticons.js") : root.SeqtrakPixelArtIcons;
  const api = factory(i18n, pixelArtIcons);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakDisplayRenderer = api;
})(typeof globalThis === "object" ? globalThis : this, function (I18n, PixelArtIcons) {
  "use strict";

  const WIDTH = 320;
  const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const DISPLAY_FONT = '"Space Grotesk", sans-serif';
  const DATA_FONT = '"IBM Plex Mono", monospace';
  // Phosphor Icons 2.1.1 — selected regular icons (MIT License).
  // Source: https://github.com/phosphor-icons/core
  const PHOSPHOR_HEADER_PATHS = Object.freeze({
    waveform: "M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z",
    circle: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z",
    "hands-clapping": "M160.22,24V8a8,8,0,0,1,16,0V24a8,8,0,0,1-16,0ZM196.1,41a7.91,7.91,0,0,0,4.17,1.17,8,8,0,0,0,6.84-3.83l8-13.11a8,8,0,0,0-13.68-8.33l-8,13.1A8,8,0,0,0,196.1,41Zm47.51,12.59a8,8,0,0,0-10.08-5.16l-15.06,4.85a8,8,0,0,0,2.46,15.62,8.15,8.15,0,0,0,2.46-.39l15.05-4.85A8,8,0,0,0,243.61,53.55ZM217,97.58a80.22,80.22,0,0,1-10.22,94c-.34,1.73-.72,3.46-1.19,5.18A80.17,80.17,0,0,1,58.77,216L23.5,155a26,26,0,0,1,19.24-38.79l-3-5.2a26,26,0,0,1,19.2-38.78L58.24,71A26,26,0,0,1,95.47,36.53,26.06,26.06,0,0,1,140.3,37l12.26,21.2A26.07,26.07,0,0,1,195.81,61ZM109.07,55l25,43.17a26,26,0,0,1,17.33-10L126.42,45a10,10,0,1,0-17.35,10ZM72.12,63l6.46,11.17a26.05,26.05,0,0,1,17.32-10L89.45,53A10,10,0,1,0,72.12,63Zm111.54,81-20.22-35a10,10,0,0,0-17.74,9.25L158.3,140a8,8,0,0,1-13.87,8l-36.5-63A10,10,0,1,0,90.58,95l26.05,45a8,8,0,0,1-13.87,8L71,93a10,10,0,0,0-17.33,10l35.22,61A8,8,0,0,1,75,172L54.72,137a10,10,0,0,0-17.34,10l35.27,61a64.12,64.12,0,0,0,117.42-15.44A63.52,63.52,0,0,0,183.66,144Zm19.41-38.42L181.93,69A10,10,0,0,0,164.55,79l33,57.05A80.2,80.2,0,0,1,207,161.51,64.23,64.23,0,0,0,203.07,105.58Z",
    "bell-simple": "M168,224a8,8,0,0,1-8,8H96a8,8,0,1,1,0-16h64A8,8,0,0,1,168,224Zm53.85-32A15.8,15.8,0,0,1,208,200H48a16,16,0,0,1-13.8-24.06C39.75,166.38,48,139.34,48,104a80,80,0,1,1,160,0c0,35.33,8.26,62.38,13.81,71.94A15.89,15.89,0,0,1,221.84,192ZM208,184c-7.73-13.27-16-43.95-16-80a64,64,0,1,0-128,0c0,36.06-8.28,66.74-16,80Z",
    "music-notes": "M212.92,17.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,56V166.08A36,36,0,1,0,88,196V110.25l112-28v51.83A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.69ZM52,216a20,20,0,1,1,20-20A20,20,0,0,1,52,216ZM88,93.75V62.25l112-28v31.5ZM180,184a20,20,0,1,1,20-20A20,20,0,0,1,180,184Z",
    "piano-keys": "M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,48h24v88H80Zm32,104a8,8,0,0,0,8-8V48h16v96a8,8,0,0,0,8,8h8v56H104V152Zm40-16V48h24v88ZM48,48H64v96a8,8,0,0,0,8,8H88v56H48ZM208,208H168V152h16a8,8,0,0,0,8-8V48h16V208Z",
    "wave-sine": "M239.24,131.4c-22,46.8-41.4,68.6-61.2,68.6-25.1,0-40.73-33.32-57.28-68.6C107.7,103.56,92.9,72,78,72c-16.4,0-36.31,37.21-46.72,59.4a8,8,0,0,1-14.48-6.8C38.71,77.8,58.16,56,78,56c25.1,0,40.73,33.32,57.28,68.6C148.3,152.44,163.1,184,178,184c16.4,0,36.31-37.21,46.72-59.4a8,8,0,0,1,14.48,6.8Z",
    microphone: "M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V240a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z"
  });
  const PHOSPHOR_HEADER_ICON_NAMES = Object.freeze({
    KICK: "waveform", SNARE: "circle", CLAP: "hands-clapping",
    "HAT 1": "bell-simple", "HAT 2": "bell-simple",
    "PERC 1": "music-notes", "PERC 2": "music-notes",
    "SYNTH 1": "piano-keys", "SYNTH 2": "piano-keys",
    DX: "wave-sine", SAMPLER: "microphone"
  });
  const phosphorHeaderShapes = {};
  const TRACK_ICON_NAMES = Object.freeze({
    kick: "trex",
    snare: "drum",
    hat: "bell-ring",
    bass: "audio-waveform",
    synth: "keyboard-music",
    clap: "hand",
    perc1: "notes",
    perc2: "music",
    sampler: "mic"
  });
  const TRACK_LABEL_IDS = Object.freeze({
    KICK: "kick",
    SNARE: "snare",
    CLAP: "clap",
    "HAT 1": "hat",
    "HAT 2": "hat",
    "HI-HAT": "hat",
    "PERC 1": "perc1",
    "PERC 2": "perc2",
    BASS: "bass",
    SYNTH: "synth",
    "SYNTH 1": "synth",
    "SYNTH 2": "synth",
    DX: "synth",
    SAMPLER: "sampler"
  });
  const TRACK_ICON_PATHS = {};
  const TRACK_ICON_SHAPES = {};
  Object.keys(TRACK_ICON_NAMES).forEach(function (trackId) {
    const name = TRACK_ICON_NAMES[trackId];
    TRACK_ICON_PATHS[trackId] = PixelArtIcons && PixelArtIcons[name] || "";
  });
  const DARK_PALETTE = {
    screen: "#080A0D", text: "#F3F3EF", muted: "#A4ABB3", secondary: "#B6BCC3", subtle: "#77828B",
    neutral: "#AAB4BC", line: "#343A40", chartLine: "#273039", highlight: "#F4A86A", fxCc: "#7DD9B2",
    stepOff: "#263238", stepOutline: "#65737A",
    mixDry: "#7DD9B2", mixWet: "#77B5F9",
    tracks: { kick: "#F6B04E", snare: "#FF6D84", hat: "#77D8F5", bass: "#8BE1A7", synth: "#B79CFF" },
    effects: { reverb: "#77B5F9", delay: "#7DD9B2", distortion: "#F4A86A", modulation: "#C6A3F6", other: "#F2D27B" }
  };
  const LIGHT_PALETTE = {
    screen: "#F5F7F5", text: "#182326", muted: "#566469", secondary: "#46565B", subtle: "#657379",
    neutral: "#46565B", line: "#BFCBCB", chartLine: "#D3DEDD", highlight: "#A44B17", fxCc: "#087A67",
    stepOff: "#E5E9E6", stepOutline: "#8B9694",
    mixDry: "#087A67", mixWet: "#255F9B",
    tracks: { kick: "#985900", snare: "#B52E4B", hat: "#006B83", bass: "#267343", synth: "#67499B" },
    effects: { reverb: "#255F9B", delay: "#087A67", distortion: "#A44B17", modulation: "#67499B", other: "#826000" }
  };
  let palette = DARK_PALETTE;

  function tr(state, key, values) {
    return I18n.t(state.language || "en", key, values);
  }

  function getTrackColor(track) {
    if (!track) return palette.neutral;
    return palette.tracks[track.id] || track.color || palette.neutral;
  }

  function themedColor(color) {
    const colors = {
      "#080A0D": palette.screen,
      "#F3F3EF": palette.text,
      "#F4F3EF": palette.text,
      "#F4F3EC": palette.text,
      "#F6F5F1": palette.text,
      "#F7F6F1": palette.text,
      "#F5F4EF": palette.text,
      "#A4ABB3": palette.muted,
      "#AAB4BC": palette.neutral,
      "#B4BBC1": palette.secondary,
      "#B6BCC3": palette.secondary,
      "#77828B": palette.subtle,
      "#9CA5AE": palette.muted,
      "#303940": palette.chartLine,
      "#343A40": palette.line,
      "#273039": palette.chartLine,
      "#F4A86A": palette.highlight
    };
    return colors[color] || color;
  }

  function drawText(ctx, value, x, y, size, color, weight, align, family, maxWidth) {
    ctx.font = String(weight || 500) + " " + String(size || 11) + "px " + (family === "display" ? DISPLAY_FONT : DATA_FONT);
    ctx.textAlign = align || "left";
    ctx.fillStyle = themedColor(color || palette.text);
    if (maxWidth) ctx.fillText(String(value), x, y, maxWidth);
    else ctx.fillText(String(value), x, y);
    ctx.textAlign = "left";
  }

  function trackIconId(track) {
    if (!track) return null;
    if (TRACK_ICON_NAMES[track.id]) return track.id;
    const label = String(track.label || "").split("/")[0].trim().toUpperCase();
    return TRACK_LABEL_IDS[label] || null;
  }

  function trackIconName(track) {
    const id = trackIconId(track);
    return id ? TRACK_ICON_NAMES[id] : null;
  }

  function drawPixelIconAt(ctx, track, x, y, size) {
    const trackId = trackIconId(track);
    const name = trackId && TRACK_ICON_NAMES[trackId];
    const pathData = trackId && TRACK_ICON_PATHS[trackId];
    if (!name || !pathData || typeof Path2D !== "function") return false;
    let shape = TRACK_ICON_SHAPES[name];
    if (!shape) {
      try {
        shape = new Path2D(pathData);
        TRACK_ICON_SHAPES[name] = shape;
      } catch (_error) {
        return false;
      }
    }
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 24;
    ctx.scale(scale, scale);
    ctx.fillStyle = getTrackColor(track);
    ctx.fill(shape);
    ctx.restore();
    return true;
  }

  function drawPixelIcon(ctx, track) {
    return drawPixelIconAt(ctx, track, 30, 69, 48);
  }

  function drawPhosphorIcon(ctx, name, x, y, size, color) {
    if (typeof Path2D !== "function") return false;
    const pathData = PHOSPHOR_HEADER_PATHS[name];
    if (!pathData) return false;
    let shape = phosphorHeaderShapes[name];
    if (!shape) {
      try {
        shape = new Path2D(pathData);
        phosphorHeaderShapes[name] = shape;
      } catch (_error) {
        return false;
      }
    }
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 256;
    ctx.scale(scale, scale);
    ctx.fillStyle = themedColor(color || palette.text);
    ctx.fill(shape);
    ctx.restore();
    return true;
  }

  const PLAYBACK_TRACKS = [
    { channel: 1, label: "KICK", id: "kick" }, { channel: 2, label: "SNARE", id: "snare" },
    { channel: 3, label: "CLAP", id: "clap" }, { channel: 4, label: "HAT 1", id: "hat" },
    { channel: 5, label: "HAT 2", id: "hat" }, { channel: 6, label: "PERC 1", id: "perc1" },
    { channel: 7, label: "PERC 2", id: "perc2" }, { channel: 8, label: "SYN 1", id: "synth" },
    { channel: 9, label: "SYN 2", id: "synth" }, { channel: 10, label: "DX", id: "synth" },
    { channel: 11, label: "SAMPLER", id: "sampler" }
  ];

  function noteActivity(state, channel, time) {
    const events = Array.isArray(state.noteEvents) ? state.noteEvents : [];
    return events.reduce(function (level, event) {
      if (Number(event.channel) !== channel) return level;
      const age = Math.max(0, time - Number(event.startedAt || 0));
      let envelope = 0;
      if (event.endedAt !== null && event.endedAt !== undefined) {
        envelope = Math.max(0, 1 - Math.max(0, time - Number(event.endedAt)) / 180);
      } else if (channel <= 7) {
        envelope = age > 900 ? 0 : Math.exp(-age / 240);
      } else {
        envelope = age > 10000 ? 0 : 1;
      }
      return Math.max(level, (Math.max(0, Math.min(127, Number(event.velocity) || 0)) / 127) * envelope);
    }, 0);
  }

  function drawPlaybackOverview(ctx, state, time) {
    const midi = state.midiPlayback || {};
    const useMidi = Boolean(midi.active);
    const previewStep = Number.isInteger(state.previewPlayheadStep) ? state.previewPlayheadStep : null;
    const currentStep = useMidi ? midi.currentStep : previewStep;
    drawText(ctx, useMidi ? "CHANNEL ACTIVITY · MIDI INPUT" : "CHANNEL ACTIVITY", 12, 37, 7, palette.secondary, 600, "left", "data", 278);

    const positions = [
      [28, 49], [81, 49], [134, 49], [187, 49], [240, 49], [293, 49],
      [54, 98], [107, 98], [160, 98], [213, 98], [266, 98]
    ];
    PLAYBACK_TRACKS.forEach(function (track, index) {
      const position = positions[index];
      const intensity = noteActivity(state, track.channel, time);
      const previewHit = !useMidi && state.playing && track.channel === Number(state.deviceTrack && state.deviceTrack.channel)
        && Array.isArray(state.drumPattern) && currentStep !== null && Boolean(state.drumPattern[currentStep]);
      const active = Math.max(intensity, previewHit ? 1 : 0);
      ctx.save();
      ctx.globalAlpha = 0.22 + active * 0.78;
      drawPixelIconAt(ctx, track, position[0] - 9, position[1], 18);
      ctx.restore();
      drawText(ctx, track.label, position[0], position[1] + 25, 6, active > 0.08 ? getTrackColor(track) : palette.muted, 600, "center", "data");
      if (state.muteByChannel && state.muteByChannel[track.channel]) {
        drawText(ctx, "M", position[0], position[1] + 33, 5, palette.highlight, 700, "center", "data");
      } else if (Number(state.soloTrack) === track.channel) {
        drawText(ctx, "S", position[0], position[1] + 33, 5, palette.highlight, 700, "center", "data");
      } else if (active > 0.08) {
        ctx.beginPath();
        ctx.fillStyle = getTrackColor(track);
        ctx.arc(position[0], position[1] + 31, 1.5 + active, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const startX = 12;
    const width = 296;
    const gap = 2;
    const markWidth = (width - gap * 15) / 16;
    for (let step = 0; step < 16; step++) {
      ctx.fillStyle = currentStep === step ? palette.highlight : palette.stepOff;
      ctx.fillRect(startX + step * (markWidth + gap), 143, markWidth, 3);
    }
    if (currentStep === null) {
      drawText(ctx, useMidi ? "WAITING FOR MIDI CLOCK" : "WAITING FOR STEP DATA", 12, 162, 7, palette.muted, 500, "left", "data");
    } else {
      const prefix = useMidi && midi.mode === "clock-only" ? "~" : "";
      drawText(ctx, useMidi ? (midi.mode === "clock-only" ? "CLOCK SYNC" : "MIDI PLAYBACK") : "PLAYBACK", 12, 162, 7, palette.secondary, 600, "left", "data");
      drawText(ctx, prefix + "STEP " + String(currentStep + 1).padStart(2, "0") + " / 16", 308, 162, 7, palette.muted, 500, "right", "data");
    }
  }

  function rule(ctx, x, y, x2, y2, color, width) {
    ctx.beginPath();
    ctx.strokeStyle = themedColor(color || palette.line);
    ctx.lineWidth = width || 1;
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawShape(ctx, track, time) {
    const t = track || { id: "unknown" };
    if (drawPixelIcon(ctx, t)) return;
    const x = 54;
    const y = 93;
    const color = getTrackColor(t);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    if (t.id === "kick") {
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.moveTo(x - 20, y + 22); ctx.lineTo(x - 29, y + 35);
      ctx.moveTo(x + 20, y + 22); ctx.lineTo(x + 29, y + 35);
      ctx.stroke(); ctx.beginPath();
      ctx.arc(x, y, 6 + Math.sin(time * 0.009) * 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.id === "snare") {
      ctx.ellipse(x, y - 14, 30, 8, 0, 0, Math.PI * 2);
      ctx.moveTo(x - 30, y - 14); ctx.lineTo(x - 25, y + 18);
      ctx.quadraticCurveTo(x, y + 29, x + 25, y + 18);
      ctx.lineTo(x + 30, y - 14);
      ctx.moveTo(x - 15, y + 24); ctx.lineTo(x - 24, y + 35);
      ctx.moveTo(x + 15, y + 24); ctx.lineTo(x + 24, y + 35);
      ctx.stroke();
      for (let i = -2; i <= 2; i++) rule(ctx, x + i * 9, y - 7, x + i * 9, y + 17, color, 1);
    } else if (t.id === "hat") {
      ctx.moveTo(x - 31, y + 3); ctx.quadraticCurveTo(x, y - 15, x + 31, y + 3);
      ctx.quadraticCurveTo(x, y + 10, x - 31, y + 3);
      ctx.moveTo(x, y - 30); ctx.lineTo(x, y + 36);
      ctx.moveTo(x - 13, y + 36); ctx.lineTo(x + 13, y + 36);
      ctx.stroke();
    } else if (t.id === "bass") {
      for (let i = 0; i < 4; i++) {
        const a = x - 29 + i * 16;
        ctx.moveTo(a, y + 22);
        ctx.lineTo(a, y - 18 + (i % 2) * 13);
        ctx.lineTo(a + 13, y - 18 + (i % 2) * 13);
      }
      ctx.stroke();
    } else if (t.id === "synth") {
      for (let k = 0; k < 4; k++) {
        ctx.moveTo(x - 32, y - 19 + k * 12);
        for (let i = 0; i < 65; i++) {
          const xx = x - 32 + i;
          ctx.lineTo(xx, y - 19 + k * 12 + Math.sin(i * 0.19 + time * 0.0015 + k * 0.3) * 4);
        }
      }
      ctx.stroke();
    } else {
      // A neutral symbol for tracks whose family is not known from the available input.
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.45 + i * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, 10 + i * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawMotif(ctx, track, time, decay) {
    const t = track || { id: "unknown" };
    const x = 106;
    const y = 94;
    const width = 201;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 53, width, 76);
    ctx.clip();
    ctx.strokeStyle = getTrackColor(t);
    ctx.lineWidth = 2;
    ctx.beginPath();
    const v = Number(decay || 0) / 127;
    for (let i = 0; i <= width; i += 2) {
      const u = i / width;
      let dy = 0;
      if (t.id === "kick") dy = Math.sin(u * 70 + time * 0.001) * Math.exp(-u * (4 + 7 * (1 - v))) * 28;
      else if (t.id === "snare") dy = (Math.sin(u * 160 + time * 0.002) + Math.sin(u * 93)) * Math.exp(-u * 10) * 15;
      else if (t.id === "hat") dy = (Math.sin(u * 225 + time * 0.004) + Math.sin(u * 319)) * 12 * (0.5 + 0.5 * Math.sin(u * 55));
      else if (t.id === "bass") dy = Math.sin(u * 13 + time * 0.001) * 21;
      else if (t.id === "synth") dy = (Math.sin(u * 20 + time * 0.001) + Math.sin(u * 36 + time * 0.0017)) * 12;
      else dy = Math.sin(u * 31 + time * 0.001) * 8;
      if (i === 0) ctx.moveTo(x + i, y + dy);
      else ctx.lineTo(x + i, y + dy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function wrapName(name, maxChars, maxLines) {
    const words = String(name || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (candidate.length <= maxChars || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    const rendered = lines.join(" ");
    if (rendered.length < String(name || "").length && lines.length) {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/[. ]+$/, "") + "…";
    }
    return lines;
  }

  function displayTrack(state) {
    if (state.source !== "demo" && state.deviceTrack) {
      return {
        id: state.track ? state.track.id : "unknown",
        label: state.deviceTrack.name,
        num: String(state.deviceTrack.channel || "--").padStart(2, "0"),
        color: getTrackColor(state.track)
      };
    }
    return state.track || { id: "unknown", label: "TRACK", num: "--", color: palette.neutral };
  }

  function soundIdentityLabel(state, track) {
    if (state.soundValue === null || state.soundValue === undefined || state.soundValue === "") return null;
    const value = Number(state.soundValue);
    if (!Number.isInteger(value) || value < 0 || value > 127) return null;
    const sourceName = String(state.deviceTrack && state.deviceTrack.name || track.label || "TRACK");
    const trackName = sourceName
      .replace(/\s*\/\s*(DRUM|SYNTH|DX|SAMPLER|FM SYNTH)$/i, "")
      .replace(/\b(HAT|PERC|SYNTH)\s+(\d+)\b/gi, "$1$2")
      .toUpperCase();
    return trackName + " / VALUE " + value + " · SOUND NAME UNKNOWN";
  }

  function drawPresetAnnouncement(ctx, state, track, time) {
    const color = getTrackColor(track);
    const sourceName = String(state.deviceTrack && state.deviceTrack.name || track.label || "TRACK").replace(/\s*\/.*$/, "");
    const hasRawValue = state.soundValue !== null && state.soundValue !== undefined && state.soundValue !== "" && Number.isInteger(Number(state.soundValue));
    const title = hasRawValue ? sourceName + " / VALUE " + Number(state.soundValue) : state.preset && state.preset.name;
    const lines = wrapName(title || tr(state, "presetNotReceived"), 28, 2);
    drawText(ctx, sourceName.toUpperCase() + " · SOUND", 12, 41, 10, color, 700, "left", "data", 296);
    drawText(ctx, tr(state, "soundName"), 308, 41, 8, palette.muted, 500, "right", "data");
    drawText(ctx, lines[0] || tr(state, "presetNotReceived"), 12, 73, lines[0] && lines[0].length > 22 ? 18 : 22, palette.text, 700, "left", "display", 296);
    if (lines[1]) drawText(ctx, lines[1], 12, 98, lines[1].length > 22 ? 17 : 20, palette.text, 700, "left", "display", 296);
    const meta = hasRawValue ? "SOUND NAME UNKNOWN" : state.preset ? (state.preset.category || state.preset.engine || "") : tr(state, "noPresetData");
    drawText(ctx, meta, 12, 124, 9, hasRawValue ? palette.muted : color, 600, "left", "data", 240);
    if (!hasRawValue) drawText(ctx, "#" + String(state.preset && state.preset.number || "--").padStart(3, "0"), 308, 124, 10, color, 700, "right", "data");
    rule(ctx, 10, 139, 310, 139);
    drawText(ctx, tr(state, "newPreset"), 12, 160, 8, palette.muted, 500, "left", "data");
  }

  function drawParameter(ctx, state, track, time) {
    if (Array.isArray(state.drumPattern) && state.drumPattern.length === 16) {
      drawDrumParameter(ctx, state, track);
      return;
    }
    const parameter = state.currentParameter || { name: "PARAMETER", value: null, min: 0, max: 127 };
    const value = parameter.value;
    const trackColor = getTrackColor(track);
    const channel = state.deviceTrack && Number(state.deviceTrack.channel);
    const soundIdentity = soundIdentityLabel(state, track);
    let valueText = value === null || value === undefined ? "—" : String(value).padStart(3, "0");
    let semanticValue = false;
    if (parameter.key === "mute" && channel && state.muteByChannel[channel] !== undefined) {
      valueText = tr(state, state.muteByChannel[channel] ? "muted" : "unmuted");
      semanticValue = true;
    } else if (parameter.key === "solo") {
      valueText = state.soloTrack === null ? tr(state, "soloOff") : tr(state, "soloTrack", { n: state.soloTrack });
      semanticValue = true;
    }
    drawText(ctx, parameter.name, 12, 44, 11, trackColor, 700, "left", "display", 210);
    drawText(ctx, valueText, 306, 60, semanticValue ? 17 : 28, "#F7F6F1", 700, "right", "display", 180);
    if (parameter.key === "cutoff" || parameter.key === "resonance") {
      drawFilterValueMeter(ctx, parameter, trackColor);
    } else if (parameter.key === "decay" || parameter.key === "attack") {
      drawMotif(ctx, track, time, parameter.key === "decay" ? value : 127 - Number(value || 0));
    } else if (!semanticValue && value !== null && value !== undefined) {
      const denominator = Math.max(1, Number(parameter.max) - Number(parameter.min));
      const fraction = Math.max(0, Math.min(1, (Number(value) - Number(parameter.min)) / denominator));
      rule(ctx, 14, 101, 306, 101, palette.chartLine, 5);
      rule(ctx, 14, 101, 14 + 292 * fraction, 101, trackColor, 5);
      ctx.beginPath(); ctx.fillStyle = trackColor; ctx.arc(14 + 292 * fraction, 101, 5, 0, Math.PI * 2); ctx.fill();
    }
    rule(ctx, 12, 137, 308, 137);
    drawText(ctx, soundIdentity || (state.preset ? tr(state, "soundTag") + "  " + state.preset.name : tr(state, "presetNotReceived")), 12, 153, soundIdentity ? 11 : 8, soundIdentity ? palette.text : "#B4BBC1", soundIdentity ? 600 : 500, "left", "data", 288);
  }

  function drawFilterValueMeter(ctx, parameter, color) {
    // Show only the received 0–127 controller value; this is not a modeled filter response.
    const min = Number(parameter.min);
    const max = Number(parameter.max);
    const value = Number(parameter.value);
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(value) || max <= min) return;

    const x = 16;
    const y = 105;
    const width = 288;
    const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const marker = x + width * fraction;
    rule(ctx, x, y, x + width, y, palette.chartLine, 5);
    rule(ctx, x, y, marker, y, color, 5);
    for (let index = 0; index <= 4; index++) {
      const tick = x + width * index / 4;
      ctx.beginPath();
      ctx.strokeStyle = themedColor(palette.muted);
      ctx.lineWidth = 1;
      ctx.moveTo(tick, y - 6);
      ctx.lineTo(tick, y + 6);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(marker, y, 5, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, String(min), x, 126, 7, palette.muted, 500, "left", "data");
    drawText(ctx, String(max), x + width, 126, 7, palette.muted, 500, "right", "data");
  }

  function drawNoteTimeline(ctx, state, track, time) {
    const windowMs = 4000;
    const startTime = time - windowMs;
    const events = (state.noteEvents || []).filter(function (event) {
      return time - event.startedAt <= windowMs && (event.endedAt === null || event.endedAt >= startTime);
    });
    if (!events.length) return false;

    const x = 106;
    const y = 67;
    const width = 200;
    const height = 58;
    const notes = events.map(function (event) { return Number(event.note); });
    const lowest = Math.min.apply(null, notes);
    const highest = Math.max.apply(null, notes);
    const span = Math.max(12, highest - lowest);
    const center = (highest + lowest) / 2;
    const latest = events[events.length - 1];

    drawText(ctx, tr(state, "noteActivity", { note: latest.note }), x, 62, 8, palette.secondary, 500, "left", "data", width);
    rule(ctx, x, y + height, x + width, y + height, palette.chartLine, 1);
    for (let column = 1; column < 4; column++) {
      const gridX = x + width * column / 4;
      rule(ctx, gridX, y, gridX, y + height, palette.chartLine, 1);
    }

    events.forEach(function (event) {
      const eventStart = Math.max(startTime, Number(event.startedAt));
      const eventEnd = Math.min(time, event.endedAt === null ? time : Number(event.endedAt));
      const left = x + (eventStart - startTime) / windowMs * width;
      const right = x + (eventEnd - startTime) / windowMs * width;
      const pitchPosition = 0.5 + (Number(event.note) - center) / span;
      const barHeight = 4 + Math.max(0, Math.min(127, Number(event.velocity))) / 127 * 6;
      const top = y + (1 - pitchPosition) * (height - barHeight);
      ctx.fillStyle = getTrackColor(track);
      ctx.globalAlpha = 0.35 + Math.max(0, Math.min(127, Number(event.velocity))) / 127 * 0.65;
      ctx.fillRect(left, top, Math.max(2, right - left), barHeight);
    });
    ctx.globalAlpha = 1;
    return true;
  }

  function drawTrackStatus(ctx, state, track, sourceLabel) {
    const channel = state.deviceTrack && Number(state.deviceTrack.channel)
      ? Number(state.deviceTrack.channel)
      : Number(track.num);
    const states = [];
    if (channel && state.muteByChannel && Object.prototype.hasOwnProperty.call(state.muteByChannel, channel)) {
      states.push(tr(state, state.muteByChannel[channel] ? "muted" : "unmuted"));
    }
    if (state.soloTrack !== null && state.soloTrack !== undefined) {
      states.push(tr(state, channel === Number(state.soloTrack) ? "solo" : "soloTrack", { n: state.soloTrack }));
    }
    if (channel && state.volumeByChannel && Object.prototype.hasOwnProperty.call(state.volumeByChannel, channel)) {
      states.push(tr(state, "volumeValue", { n: state.volumeByChannel[channel] }));
    }
    if (state.masterVolumeDisplay !== null && state.masterVolumeDisplay !== undefined) {
      states.push(tr(state, "masterVolumeValue", { value: state.masterVolumeDisplay }));
    }
    if (!states.length) {
      drawText(ctx, sourceLabel, 308, 40, 8, "#A4ABB3", 500, "right", "data");
      return;
    }
    drawText(ctx, states.slice(0, 2).join(" · "), 308, 40, 8, "#A4ABB3", 500, "right", "data", 142);
    if (states.length > 2) drawText(ctx, states.slice(2, 4).join(" · "), 308, 50, 7, "#A4ABB3", 500, "right", "data", 142);
  }

  function drawOverview(ctx, state, track, time) {
    if (Array.isArray(state.drumPattern) && state.drumPattern.length === 16) {
      drawDrumSequenceOverview(ctx, state, track, time);
      return;
    }
    const trackColor = getTrackColor(track);
    const soundIdentity = soundIdentityLabel(state, track);
    drawText(ctx, track.num && track.num !== "--" ? track.num + "  " + track.label : track.label, 12, 42, 14, trackColor, 700, "left", "display");
    const sourceLabel = state.source === "demo" ? tr(state, "currentSound") : state.source === "event" ? tr(state, "event") : state.source.toUpperCase();
    drawTrackStatus(ctx, state, track, sourceLabel);
    drawShape(ctx, track, time);
    rule(ctx, 92, 54, 92, 128);
    if (!drawNoteTimeline(ctx, state, track, time)) drawMotif(ctx, track, time, state.values.decay);
    rule(ctx, 10, 134, 310, 134);
    const name = state.preset && state.preset.name;
    if (soundIdentity) drawText(ctx, soundIdentity, 12, 153, 11, palette.text, 600, "left", "data", 292);
    else {
      drawText(ctx, name || tr(state, "presetNotReceived"), 12, 153, name && name.length > 24 ? 11 : 16, "#F4F3EF", 700, "left", "display", 292);
      drawText(ctx, state.preset ? "#" + String(state.preset.number).padStart(3, "0") : "—", 309, 166, 8, trackColor, 500, "right", "data");
    }
  }

  function drawDrumStepGrid(ctx, pattern, trackColor, x, y, cellHeight, knownSteps) {
    const width = 198;
    const gap = 2;
    const cellWidth = (width - gap * 15) / 16;
    pattern.forEach(function (active, index) {
      const left = x + index * (cellWidth + gap);
      const known = !Array.isArray(knownSteps) || Boolean(knownSteps[index]);
      ctx.fillStyle = !known ? palette.screen : active ? trackColor : palette.stepOff;
      ctx.fillRect(left, y, cellWidth, cellHeight);
      if (!active || !known) {
        ctx.strokeStyle = known ? palette.stepOutline : palette.line;
        ctx.lineWidth = 1;
        ctx.strokeRect(left + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
      }
    });
    [0, 4, 8, 12].forEach(function (index) {
      const center = x + index * (cellWidth + gap) + cellWidth / 2;
      drawText(ctx, String(index + 1).padStart(2, "0"), center, y + cellHeight + 10, 6, palette.muted, 500, "center", "data");
    });
  }

  function drawDrumDecay(ctx, state, trackColor, x, y, width, compact) {
    const value = Number(state.values && state.values.decay);
    if (!Number.isFinite(value)) return;
    const fraction = Math.max(0, Math.min(1, value / 127));
    drawText(ctx, "DECAY", x, y, compact ? 7 : 8, palette.muted, 600, "left", "data");
    drawText(ctx, String(Math.round(value)), x + width, y, compact ? 9 : 12, trackColor, 700, "right", "display");
    const barY = y + 7;
    rule(ctx, x, barY, x + width, barY, palette.chartLine, compact ? 3 : 4);
    rule(ctx, x, barY, x + width * fraction, barY, trackColor, compact ? 3 : 4);
  }

  function drawDrumSequenceOverview(ctx, state, track, time) {
    const color = getTrackColor(track);
    const channel = state.deviceTrack && state.deviceTrack.channel;
    const capturedEdit = Array.isArray(state.drumPatternKnown);
    const patternNumber = Number(state.drumPatternNumber) || 1;
    const trackName = String(state.deviceTrack && state.deviceTrack.name || track.label || "DRUM").replace(/\b(HAT|PERC|SYNTH)\s+(\d+)\b/gi, "$1$2");
    const soundIdentity = soundIdentityLabel(state, track);
    if (state.view === "sound") {
      const hasRawValue = state.soundValue !== null && state.soundValue !== undefined && state.soundValue !== "" && Number.isInteger(Number(state.soundValue));
      const title = hasRawValue ? trackName + " / VALUE " + Number(state.soundValue) : state.preset && state.preset.name;
      const meta = hasRawValue ? "SOUND NAME UNKNOWN" : state.preset ? (state.preset.category || state.preset.engine || "") : tr(state, "noPresetData");
      drawText(ctx, trackName + " · SOUND", 12, 39, 9, color, 700, "left", "data", 296);
      drawText(ctx, tr(state, "soundName"), 308, 39, 8, palette.muted, 500, "right", "data");
      drawText(ctx, title || tr(state, "presetNotReceived"), 12, 67, title && title.length > 24 ? 16 : 20, palette.text, 700, "left", "display", 296);
      drawText(ctx, meta, 12, 87, 8, hasRawValue ? palette.muted : color, 600, "left", "data", 238);
      if (!hasRawValue) drawText(ctx, "#" + String(state.preset && state.preset.number || "--").padStart(3, "0"), 308, 87, 9, color, 700, "right", "data");
      drawText(ctx, capturedEdit ? "OBSERVED EDITS · 16 STEPS" : "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS", 12, 106, 7, palette.secondary, 600, "left", "data");
      drawDrumStepGrid(ctx, state.drumPattern, color, 105, 99, 15, state.drumPatternKnown);
      rule(ctx, 10, 139, 310, 139);
      drawText(ctx, trackName + " · PATTERN " + patternNumber, 12, 158, 8, palette.muted, 500, "left", "data", 250);
      if (channel) drawText(ctx, "CH " + String(channel).padStart(2, "0"), 308, 158, 8, palette.muted, 500, "right", "data");
      return;
    }
    drawText(ctx, soundIdentity || (trackName + (capturedEdit ? " · EDIT CAPTURE" : " · PATTERN " + patternNumber)), 12, 42, 11, color, 700, "left", soundIdentity ? "data" : "display", 298);
    drawTrackStatus(ctx, state, track, soundIdentity ? "" : state.drumPatternSource || "PREVIEW");
    drawShape(ctx, track, time);
    rule(ctx, 92, 54, 92, 130);
    drawText(ctx, capturedEdit ? "OBSERVED EDITS · 16 STEPS" : "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS", 105, 58, 7, palette.secondary, 600, "left", "data", 200);
    drawDrumStepGrid(ctx, state.drumPattern, color, 105, 65, 20, state.drumPatternKnown);
    drawDrumDecay(ctx, state, color, 105, 107, 198, false);
    rule(ctx, 10, 139, 310, 139);
    if (!soundIdentity) drawText(ctx, state.preset ? state.preset.name : tr(state, "presetNotReceived"), 12, 155, state.preset && state.preset.name.length < 24 ? 11 : 9, palette.secondary, 500, "left", "data", 250);
    if (channel) drawText(ctx, "CH " + String(channel).padStart(2, "0"), 308, 164, 7, palette.muted, 500, "right", "data");
  }

  function drawDrumParameter(ctx, state, track) {
    const parameter = state.currentParameter || { name: "PARAMETER", value: null, min: 0, max: 127 };
    const color = getTrackColor(track);
    const value = parameter.value;
    drawText(ctx, parameter.name, 12, 45, 10, color, 700, "left", "display", 212);
    drawText(ctx, value === null || value === undefined ? "—" : String(value), 306, 63, 25, palette.text, 700, "right", "display", 160);
    if (value !== null && value !== undefined && Number.isFinite(Number(parameter.min)) && Number.isFinite(Number(parameter.max))) {
      const span = Math.max(1, Number(parameter.max) - Number(parameter.min));
      const fraction = Math.max(0, Math.min(1, (Number(value) - Number(parameter.min)) / span));
      rule(ctx, 16, 78, 304, 78, palette.chartLine, 4);
      rule(ctx, 16, 78, 16 + 288 * fraction, 78, color, 4);
    }
    const patternNumber = Number(state.drumPatternNumber) || 1;
    drawText(ctx, "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS", 12, 101, 7, palette.secondary, 600, "left", "data", 294);
    drawDrumStepGrid(ctx, state.drumPattern, color, 105, 106, 20, state.drumPatternKnown);
    if (parameter.key !== "decay") drawDrumDecay(ctx, state, color, 12, 147, 294, true);
    else drawText(ctx, "DECAY VALUE", 12, 153, 7, palette.muted, 500, "left", "data");
  }

  function drawActiveNote(ctx, note, track) {
    if (note === null || note === undefined) return false;
    const midiNote = Number(note);
    if (!Number.isInteger(midiNote) || midiNote < 0 || midiNote > 127) return false;
    const pitchClass = PITCH_CLASSES[midiNote % PITCH_CLASSES.length];
    drawText(ctx, pitchClass, 160, 120, pitchClass.length === 1 ? 76 : 58, getTrackColor(track), 700, "center", "display");
    return true;
  }

  function fxColor(category) {
    const cat = String(category || "").toUpperCase();
    if (cat.includes("REVERB")) return palette.effects.reverb;
    if (cat.includes("DELAY")) return palette.effects.delay;
    if (cat.includes("DISTORT") || cat.includes("AMP")) return palette.effects.distortion;
    if (cat.includes("MODUL") || cat.includes("CHORUS") || cat.includes("FLANGER")) return palette.effects.modulation;
    return palette.effects.other;
  }

  function drawFxControlChange(ctx, state, event) {
    const color = palette.fxCc;
    drawText(ctx, "MIDI CC / " + event.name, 12, 39, 10, color, 700, "left", "display", 280);
    drawText(ctx, tr(state, "fxTypeNotInCc"), 12, 60, 9, "#A4ABB3", 500, "left", "data");
    const parameterLabel = event.parameter ? tr(state, "assignedParameter") + " " + event.parameter : tr(state, "assignedParameter");
    drawText(ctx, parameterLabel, 12, 83, 11, "#F6F5F1", 700, "left", "display");
    const fraction = Number(event.value) / 127;
    rule(ctx, 14, 109, 306, 109, palette.chartLine, 5);
    rule(ctx, 14, 109, 14 + 292 * fraction, 109, color, 5);
    drawText(ctx, "CC " + event.controller + " / CH " + String(event.channel).padStart(2, "0"), 12, 143, 8, "#9CA5AE", 500, "left", "data");
    drawText(ctx, String(event.value).padStart(3, "0") + " / 127", 308, 163, 12, "#F6F5F1", 700, "right", "display");
  }

  function drawFx(ctx, state, time, fxModel) {
    const fx = state.fx;
    if (fx.controlChange) {
      drawFxControlChange(ctx, state, fx.controlChange);
      return;
    }
    const effect = fx.effect;
    if (!effect) {
      drawText(ctx, tr(state, "fxTypeNotSelected"), 12, 45, 12, "#A4ABB3", 700, "left", "display");
      return;
    }
    const category = effect.category || "";
    const color = fxColor(category);
    const parameter = fx.parameter;
    const range = fxModel.rangeForParameter(parameter);
    const hasValue = parameter && range && fx.parameterValue !== null && fx.parameterValue !== undefined;
    const value = hasValue ? Number(fx.parameterValue) : Number(fx.visualIntensity);
    const min = hasValue ? range.min : 0;
    const max = hasValue ? range.max : 127;
    const fraction = Math.max(0, Math.min(1, (value - min) / Math.max(1, max - min)));
    const scopeKey = { Single: "singleEffect", Send: "sendEffect", "Master 1": "masterEffect1", "Master 2": "masterEffect2", "Master 3": "masterEffect3" }[fx.scope];
    const presetIndex = fx.presetNumber ? " · " + (fx.presetCategory || category) + " " + String(fx.presetNumber).padStart(2, "0") + "/08" : "";
    drawText(ctx, "FX / " + (scopeKey ? tr(state, scopeKey) : String(fx.scope).toUpperCase()) + presetIndex, 12, 39, 9, color, 700, "left", "display", 296);
    const displayedEffectName = fx.presetName || effect.name;
    drawText(ctx, displayedEffectName, 12, 61, displayedEffectName.length > 25 ? 12 : 16, "#F6F5F1", 700, "left", "display", 294);
    if (fx.performance && fx.performance.active) {
      drawFxPerformance(ctx, fx.performance, color);
      return;
    }
    if (hasValue) {
      const mode = fxModel.semantic(parameter.name, category);
      drawFxParameterGraphic(ctx, mode, fraction, category, color, time);
    } else {
      drawFxStaticGraphic(ctx, category, color, fraction);
      const message = parameter
        ? tr(state, "parameterRangeNotDefined")
        : tr(state, "parameterDataUnavailable");
      drawText(ctx, message, 12, 83, 8, "#A4ABB3", 500, "left", "data");
    }
    rule(ctx, 10, 137, 310, 137);
    if (hasValue) {
      drawText(ctx, String(parameter.name).toUpperCase().slice(0, 22), 12, 153, 8, "#F4A86A", 500, "left", "data", 210);
      drawText(ctx, fx.formattedValue || String(value), 308, 166, 12, "#F5F4EF", 700, "right", "display", 150);
    } else {
      drawText(ctx, tr(state, "illustrativeIntensity"), 12, 153, 8, "#9CA5AE", 500, "left", "data", 260);
      drawText(ctx, tr(state, "noParameterValue"), 308, 166, 8, "#9CA5AE", 500, "right", "data");
    }
  }

  function drawFxPerformance(ctx, performance, color) {
    const fraction = Math.max(0, Math.min(1, Number(performance.value) / 127));
    const isHighPass = performance.effect === "highPass";
    const label = isHighPass ? "HIGH PASS FILTER CUTOFF" : "BEAT REPEAT LENGTH";
    drawText(ctx, "PERFORMANCE / ACTIVE WHILE HELD", 12, 84, 9, color, 700, "left", "display", 296);
    drawText(ctx, label, 12, 104, 10, "#F6F5F1", 600, "left", "data", 296);
    rule(ctx, 14, 126, 306, 126, palette.chartLine, 5);
    rule(ctx, 14, 126, 14 + 292 * fraction, 126, color, 5);
    drawText(ctx, "HOLD TO APPLY · RELEASE TO BYPASS", 12, 159, 8, "#A4ABB3", 500, "left", "data", 296);
  }

  function drawFxStaticGraphic(ctx, category, color, fraction) {
    const cat = String(category || "").toUpperCase();
    ctx.save();
    ctx.beginPath(); ctx.rect(12, 70, 296, 61); ctx.clip();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    if (cat.includes("REVERB")) {
      for (let k = 0; k < 4; k++) {
        ctx.beginPath(); ctx.ellipse(160, 104, 16 + k * 20, 7 + k * 6, 0, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (cat.includes("DELAY")) {
      for (let k = 0; k < 6; k++) {
        const x = 28 + k * 46;
        ctx.beginPath(); ctx.moveTo(x, 116); ctx.lineTo(x + 8, 83 + k * 3); ctx.lineTo(x + 16, 116); ctx.stroke();
      }
    } else {
      rule(ctx, 16, 109, 304, 109, color, 1);
      rule(ctx, 16, 108, 16 + 286 * fraction, 108, color, 2);
    }
    ctx.restore();
  }

  function drawFxParameterGraphic(ctx, mode, value, category, color, time) {
    ctx.save();
    ctx.beginPath(); ctx.rect(12, 70, 296, 61); ctx.clip();
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineJoin = "round";
    if (mode === "delayTime" || mode === "feedback" || mode === "preDelay") {
      const step = mode === "delayTime" ? 19 + value * 49 : mode === "preDelay" ? 24 + value * 75 : 37;
      const decay = mode === "feedback" ? 0.25 + value * 0.7 : 0.66;
      const start = mode === "preDelay" ? 18 + value * 65 : 18;
      for (let k = 0; k < 12; k++) {
        const x = start + k * step;
        if (x > 306) break;
        const h = 43 * Math.pow(decay, k);
        ctx.globalAlpha = Math.max(0.18, 1 - k * 0.09);
        ctx.beginPath(); ctx.moveTo(x, 107); ctx.lineTo(x + 4, 107 - h); ctx.lineTo(x + 8, 107); ctx.stroke();
      }
    } else if (mode === "mix") {
      const a = 15 + (1 - value) * 33;
      const b = 15 + value * 33;
      for (let x = 13; x < 306; x += 3) {
        const u = (x - 13) / 293;
        ctx.globalAlpha = 0.7; ctx.strokeStyle = palette.mixDry;
        ctx.beginPath(); ctx.moveTo(x, 107 - Math.sin(u * 16 * Math.PI) * a); ctx.lineTo(x + 2, 107 - Math.sin((u + 2 / 293) * 16 * Math.PI) * a); ctx.stroke();
        ctx.globalAlpha = 0.8; ctx.strokeStyle = palette.mixWet;
        ctx.beginPath(); ctx.moveTo(x, 107 - Math.sin(u * 7 * Math.PI + 0.8) * b); ctx.lineTo(x + 2, 107 - Math.sin((u + 2 / 293) * 7 * Math.PI + 0.8) * b); ctx.stroke();
      }
    } else if (mode === "reverbTime") {
      for (let k = 0; k < 7; k++) {
        const rx = 10 + k * (13 + value * 8);
        const ry = 3 + k * (4 + value * 3);
        ctx.globalAlpha = Math.max(0.12, 1 - k * (0.2 - value * 0.12));
        ctx.beginPath(); ctx.ellipse(160, 100, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (mode === "cutoff") {
      ctx.beginPath();
      for (let x = 13; x <= 307; x += 3) {
        const u = (x - 13) / 294;
        const y = 117 - 54 / (1 + Math.exp((u - (0.08 + value * 0.84)) * 23));
        if (x === 13) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (mode === "drive") {
      ctx.beginPath();
      for (let x = 13; x <= 307; x += 2) {
        const u = (x - 13) / 294;
        const y = 96 - 30 * Math.tanh(Math.sin(u * 8 * Math.PI) * (0.3 + value * 14));
        if (x === 13) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (mode === "rate" || mode === "depth") {
      ctx.beginPath();
      for (let x = 13; x <= 307; x += 2) {
        const u = (x - 13) / 294;
        const cycles = mode === "rate" ? 2 + value * 17 : 8;
        const amplitude = mode === "depth" ? 3 + value * 34 : 25;
        const y = 97 - Math.sin(u * cycles * Math.PI + time * 0.001) * amplitude;
        if (x === 13) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      drawFxStaticGraphic(ctx, category, color, value);
    }
    ctx.restore();
  }

  const ALPHA2_PARAMETERS = [
    { key: "volume", short: "VOL", label: "VOLUME" },
    { key: "decay", short: "DECAY", label: "DECAY / RELEASE" },
    { key: "cutoff", short: "CUTOFF", label: "LP–HP CUTOFF" },
    { key: "reverbSend", short: "REV", label: "REVERB SEND" }
  ];

  function alpha2Parameter(state) {
    const current = state.currentParameter || {};
    return ALPHA2_PARAMETERS.find(function (item) { return item.key === current.key; })
      || ALPHA2_PARAMETERS[2];
  }

  function alpha2Color(parameter) {
    if (parameter.key === "volume") return stateThemeColor("#3374D9", "#698EFF");
    if (parameter.key === "decay") return stateThemeColor("#06C755", "#00ED95");
    if (parameter.key === "reverbSend") return stateThemeColor("#DB3F3C", "#FF423F");
    return palette.text;
  }

  function stateThemeColor(light, dark) {
    return palette === LIGHT_PALETTE ? light : dark;
  }

  function alpha2Value(state, channel, key) {
    const values = state.parameterValuesByChannel && state.parameterValuesByChannel[channel];
    if (values && values[key] !== null && values[key] !== undefined) return Number(values[key]);
    if (key === "volume" && state.volumeByChannel && state.volumeByChannel[channel] !== undefined) return Number(state.volumeByChannel[channel]);
    const current = state.currentParameter || {};
    if (Number(state.deviceTrack && state.deviceTrack.channel) === Number(channel) && current.key === key && current.value !== null && current.value !== undefined) return Number(current.value);
    if (Number(state.deviceTrack && state.deviceTrack.channel) === Number(channel) && state.values && state.values[key] !== undefined) return Number(state.values[key]);
    return null;
  }

  function drawAlpha2Tabs(ctx, active, x, y, width) {
    const cell = width / ALPHA2_PARAMETERS.length;
    ALPHA2_PARAMETERS.forEach(function (item, index) {
      const left = x + index * cell;
      const color = alpha2Color(item);
      drawText(ctx, item.short, left + cell / 2, y + 8, 5, item.key === active.key ? palette.text : palette.muted, 600, "center", "data");
      rule(ctx, left + 4, y + 13, left + cell - 4, y + 13, color, item.key === active.key ? 2 : 1);
    });
  }

  function drawAlpha2Graphic(ctx, parameter, value, x, y, width, height) {
    const color = alpha2Color(parameter);
    const fraction = value === null || !Number.isFinite(Number(value)) ? 0 : Math.max(0, Math.min(1, Number(value) / 127));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (parameter.key === "decay") {
      ctx.beginPath();
      ctx.moveTo(x, y + height - 2);
      ctx.lineTo(x + 7, y + 3);
      ctx.bezierCurveTo(x + width * (0.16 + fraction * 0.22), y + 4, x + width * (0.36 + fraction * 0.28), y + height - 3, x + width, y + height - 2);
      ctx.stroke();
    } else if (parameter.key === "cutoff") {
      const cutoffX = x + width * (0.12 + fraction * 0.72);
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(cutoffX, y + 4);
      ctx.bezierCurveTo(cutoffX + width * 0.12, y + 5, cutoffX + width * 0.12, y + height - 2, x + width, y + height - 2);
      ctx.stroke();
    } else if (parameter.key === "reverbSend") {
      for (let index = 0; index < 4; index++) {
        ctx.globalAlpha = 1 - index * 0.2;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, 8 + index * (5 + fraction * 3), 3 + index * (2 + fraction), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      for (let index = 0; index <= width; index += 3) {
        const u = index / width;
        const amplitude = 3 + fraction * (height * 0.38);
        const pointY = y + height / 2 - Math.sin(u * 12 * Math.PI) * amplitude * (0.7 + 0.3 * Math.sin(u * 5));
        if (index === 0) ctx.moveTo(x + index, pointY); else ctx.lineTo(x + index, pointY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function alpha2TrackName(state, track) {
    return String(state.deviceTrack && state.deviceTrack.name || track.label || "TRACK")
      .replace(/\s*\/\s*(DRUM|SYNTH|DX|SAMPLER|FM SYNTH)$/i, "")
      .replace(/\b(HAT|PERC|SYNTH)\s+(\d+)\b/gi, "$1$2")
      .toUpperCase();
  }

  function drawAlpha2Selected(ctx, state, track) {
    const channel = Number(state.deviceTrack && state.deviceTrack.channel) || Number(track.num) || 1;
    const parameter = alpha2Parameter(state);
    const value = alpha2Value(state, channel, parameter.key);
    const color = getTrackColor(track);
    const trackName = alpha2TrackName(state, track);
    const soundValue = state.soundValue !== null && state.soundValue !== undefined ? Number(state.soundValue) : null;
    const soundName = state.preset && state.preset.name || (Number.isFinite(soundValue) ? "SOUND NAME UNKNOWN" : "PRESET NOT RECEIVED");
    const parameterLabel = state.currentParameter && state.currentParameter.key === parameter.key
      ? state.currentParameter.name : parameter.label;
    const patternNumber = Number(state.drumPatternNumber) || 1;
    const hasPattern = Array.isArray(state.drumPattern);
    const recentNote = (state.noteEvents || []).slice().reverse().find(function (event) {
      return Number(event.channel) === channel && (event.endedAt === null || event.endedAt === undefined);
    });

    drawText(ctx, "SELECTED SOUND", 8, 34, 5, palette.muted, 600, "left", "data");
    drawText(ctx, trackName, 8, 55, 19, color, 500, "left", "display", 78);
    drawText(ctx, soundName, 8, 76, 7, palette.text, 600, "left", "data", 76);
    drawText(ctx, Number.isFinite(soundValue) ? "VALUE " + soundValue : "CH " + String(channel).padStart(2, "0"), 8, 88, 5, palette.muted, 500, "left", "data");

    ctx.fillStyle = palette === LIGHT_PALETTE ? "#E7ECE8" : "#11171B";
    ctx.fillRect(88, 24, 224, 82);
    drawAlpha2Tabs(ctx, parameter, 92, 27, 216);
    drawText(ctx, parameterLabel, 94, 53, 5, palette.muted, 600, "left", "data", 126);
    drawAlpha2Graphic(ctx, parameter, value, 94, 60, 120, 36);
    drawText(ctx, value === null ? "--" : String(Math.round(value)), 304, 90, 25, palette.text, 300, "right", "display");
    rule(ctx, 232, 98, 304, 98, palette.chartLine, 2);
    if (value !== null) rule(ctx, 232, 98, 232 + 72 * Math.max(0, Math.min(1, value / 127)), 98, color, 2);

    rule(ctx, 8, 112, 312, 112, palette.line, 1);
    drawText(ctx, hasPattern ? "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS" : "PATTERN " + String(patternNumber).padStart(2, "0"), 8, 124, 7, palette.text, 500, "left", "display", 180);
    drawText(ctx, recentNote ? "MIDI NOTE " + recentNote.note : state.playing ? "PLAY" : "STOP", 312, 124, 6, palette.muted, 600, "right", "data");
    const pattern = hasPattern ? state.drumPattern : Array.from({ length: 16 }, function () { return false; });
    const known = Array.isArray(state.drumPatternKnown) ? state.drumPatternKnown : null;
    const currentStep = state.midiPlayback && state.midiPlayback.active ? state.midiPlayback.currentStep : state.previewPlayheadStep;
    const x = 8;
    const width = 304;
    const gap = 2;
    const cell = (width - gap * 15) / 16;
    pattern.forEach(function (active, index) {
      const left = x + index * (cell + gap);
      const isKnown = !known || Boolean(known[index]);
      ctx.fillStyle = !isKnown ? palette.screen : active ? color : palette.stepOff;
      ctx.fillRect(left, 132, cell, 29);
      if (currentStep === index) {
        ctx.strokeStyle = palette.text;
        ctx.lineWidth = 1;
        ctx.strokeRect(left - 1, 131, cell + 2, 31);
      }
    });
  }

  function drawAlpha2All(ctx, state) {
    const parameter = alpha2Parameter(state);
    drawText(ctx, "SCOPE", 8, 34, 5, palette.muted, 600, "left", "data");
    drawText(ctx, "ALL", 8, 57, 24, palette.text, 300, "left", "display");
    drawText(ctx, "11 TRACKS", 8, 75, 5, palette.muted, 600, "left", "data");
    drawText(ctx, "LIVE VIEW", 8, 85, 5, palette.muted, 600, "left", "data");
    drawText(ctx, "PATTERN", 8, 112, 5, palette.muted, 600, "left", "data");
    drawText(ctx, "01", 8, 133, 17, palette.text, 400, "left", "display");

    ctx.fillStyle = palette === LIGHT_PALETTE ? "#E7ECE8" : "#11171B";
    ctx.fillRect(62, 24, 250, 140);
    drawAlpha2Tabs(ctx, parameter, 65, 27, 244);
    PLAYBACK_TRACKS.forEach(function (track, index) {
      const column = index < 6 ? 0 : 1;
      const row = column === 0 ? index : index - 6;
      const left = 67 + column * 122;
      const y = 57 + row * 17;
      const value = alpha2Value(state, track.channel, parameter.key);
      const color = track.channel === Number(state.deviceTrack && state.deviceTrack.channel) ? getTrackColor(track) : alpha2Color(parameter);
      drawText(ctx, track.label, left, y, 8, track.channel === Number(state.deviceTrack && state.deviceTrack.channel) ? color : palette.muted, 600, "left", "data", 43);
      rule(ctx, left + 46, y - 3, left + 99, y - 3, palette.chartLine, 3);
      if (value !== null) rule(ctx, left + 46, y - 3, left + 46 + 53 * Math.max(0, Math.min(1, value / 127)), y - 3, color, 3);
      drawText(ctx, value === null ? "--" : String(Math.round(value)), left + 116, y, 6, value === null ? palette.subtle : palette.text, 500, "right", "data");
    });
    drawText(ctx, parameter.label + " · RECEIVED VALUES ONLY", 67, 158, 5, palette.muted, 600, "left", "data", 238);
  }

  function drawAlpha2FxGraphic(ctx, mode, fraction, color, x, y, width, height) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "reverbTime" || mode === "preDelay") {
      for (let index = 0; index < 5; index++) {
        ctx.globalAlpha = 1 - index * 0.16;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, 8 + index * (7 + fraction * 4), 3 + index * (2 + fraction * 1.5), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (mode === "delayTime" || mode === "feedback") {
      for (let index = 0; index < 7; index++) {
        const left = x + index * (14 + fraction * 9);
        if (left > x + width) break;
        const level = height * Math.pow(mode === "feedback" ? 0.35 + fraction * 0.55 : 0.7, index);
        ctx.beginPath();
        ctx.moveTo(left, y + height);
        ctx.lineTo(left + 3, y + height - level);
        ctx.lineTo(left + 6, y + height);
        ctx.stroke();
      }
    } else if (mode === "cutoff") {
      const cutoff = x + width * (0.1 + fraction * 0.72);
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(cutoff, y + 4);
      ctx.bezierCurveTo(cutoff + width * 0.12, y + 5, cutoff + width * 0.12, y + height - 2, x + width, y + height - 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let index = 0; index <= width; index += 3) {
        const u = index / width;
        const pointY = y + height / 2 - Math.sin(u * (5 + fraction * 10) * Math.PI) * (4 + fraction * height * 0.36);
        if (index === 0) ctx.moveTo(x + index, pointY); else ctx.lineTo(x + index, pointY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAlpha2SideFeedback(ctx, feedback) {
    const isVolume = feedback.type === "volume";
    const color = isVolume ? stateThemeColor("#3374D9", "#698EFF") : palette.highlight;
    const numericValue = Number(feedback.value);
    drawText(ctx, "SIDE CONTROL", 8, 35, 6, palette.muted, 600, "left", "data");
    drawText(ctx, feedback.label || "CONTROL", 8, 62, 18, color, 500, "left", "display", 304);
    drawText(ctx, String(feedback.value === null || feedback.value === undefined ? "--" : feedback.value), 304, 116, isVolume ? 54 : 34, palette.text, 300, "right", "display", 250);
    if (isVolume && Number.isFinite(numericValue)) {
      const fraction = Math.max(0, Math.min(1, numericValue / 127));
      rule(ctx, 8, 135, 312, 135, palette.chartLine, 5);
      rule(ctx, 8, 135, 8 + 304 * fraction, 135, color, 5);
      drawText(ctx, "0", 8, 157, 6, palette.muted, 500, "left", "data");
      drawText(ctx, "127", 312, 157, 6, palette.muted, 500, "right", "data");
    } else {
      rule(ctx, 8, 141, 312, 141, palette.line, 1);
      drawText(ctx, feedback.label === "SOLO READY" ? "TAP A TRACK KNOB" : "TRACK ISOLATION", 8, 160, 6, palette.muted, 600, "left", "data");
    }
  }

  function drawAlpha2Fx(ctx, state, time, fxModel) {
    const fx = state.fx || {};
    const event = fx.controlChange;
    const effect = fx.effect;
    const performance = fx.performance && fx.performance.active ? fx.performance : null;
    const page = Number(fx.page) === 2 ? 2 : 1;
    const scope = event ? (event.scope || "MIDI CC") : fx.scope || "FX";
    const effectName = event ? event.name : effect ? (fx.presetName || effect.name) : "TYPE UNAVAILABLE";
    const category = effect && effect.category || event && event.name || "FX";
    const color = event ? palette.fxCc : fxColor(category);
    const parameter = event
      ? { name: event.parameter ? "PARAMETER " + event.parameter : event.name }
      : performance
        ? { name: performance.parameter || (performance.effect === "highPass" ? "HIGH PASS FILTER CUTOFF" : "BEAT REPEAT LENGTH") }
        : fx.parameter;
    const range = event ? { min: 0, max: 127 } : performance ? { min: 0, max: 127 } : fxModel.rangeForParameter(parameter);
    const rawValue = event ? event.value : performance ? performance.value : fx.parameterValue;
    const hasValue = rawValue !== null && rawValue !== undefined && range;
    const fraction = hasValue ? Math.max(0, Math.min(1, (Number(rawValue) - Number(range.min)) / Math.max(1, Number(range.max) - Number(range.min)))) : 0;
    const mode = performance && performance.effect === "highPass" ? "cutoff"
      : performance && performance.effect === "repeater" ? "delayTime"
      : parameter ? fxModel.semantic(parameter.name, category) : "unknown";

    drawText(ctx, "FX / " + String(scope).toUpperCase(), 8, 35, 6, color, 600, "left", "data", 96);
    drawText(ctx, String(scope).toUpperCase(), 8, 58, 19, palette.text, 400, "left", "display", 92);
    drawText(ctx, effectName, 8, 78, 7, palette.text, 600, "left", "data", 92);
    drawText(ctx, effect && fx.presetNumber ? String(effect.category || "FX").toUpperCase() + " " + String(fx.presetNumber).padStart(2, "0") + "/08" : event ? "RECEIVED CC " + event.controller : "PAGE " + page + " · CURRENT EFFECT", 8, 92, 5, palette.muted, 500, "left", "data", 92);

    ctx.fillStyle = palette === LIGHT_PALETTE ? "#E7ECE8" : "#11171B";
    ctx.fillRect(108, 24, 204, 112);
    drawText(ctx, parameter ? String(parameter.name).toUpperCase() : "PARAMETER UNAVAILABLE", 114, 41, 6, palette.muted, 600, "left", "data", 190);
    drawAlpha2FxGraphic(ctx, mode, fraction, color, 114, 51, 124, 54);
    drawText(ctx, hasValue ? String(Math.round(Number(rawValue))) : "--", 304, 96, 28, palette.text, 300, "right", "display");
    rule(ctx, 246, 108, 304, 108, palette.chartLine, 3);
    if (hasValue) rule(ctx, 246, 108, 246 + 58 * fraction, 108, color, 3);
    drawText(ctx, performance ? "PERFORMANCE / ACTIVE WHILE HELD" : hasValue ? "RECEIVED / CURRENT VALUE" : "VALUE UNAVAILABLE", 114, 128, 5, performance ? color : palette.muted, 600, "left", "data", 188);

    rule(ctx, 8, 145, 312, 145, palette.line, 1);
    drawText(ctx, performance ? "RELEASE TO BYPASS" : "PAGE " + page + " · MASTER / SINGLE · FX LEVEL · TOUCH STRIPS", 8, 162, 6, palette.muted, 600, "left", "data", 304);
  }

  function drawAlpha2Playback(ctx, state, time) {
    const midi = state.midiPlayback || {};
    const currentStep = midi.active ? midi.currentStep : state.previewPlayheadStep;
    drawText(ctx, "CHANNEL ACTIVITY", 8, 35, 6, palette.muted, 600, "left", "data");
    PLAYBACK_TRACKS.forEach(function (track, index) {
      const column = index < 6 ? 0 : 1;
      const row = column === 0 ? index : index - 6;
      const left = 8 + column * 156;
      const y = 55 + row * 17;
      const intensity = noteActivity(state, track.channel, time);
      const previewHit = !midi.active && state.playing && track.channel === Number(state.deviceTrack && state.deviceTrack.channel)
        && Array.isArray(state.drumPattern) && Number.isInteger(currentStep) && Boolean(state.drumPattern[currentStep]);
      const active = Math.max(intensity, previewHit ? 1 : 0);
      const color = getTrackColor(track);
      drawText(ctx, track.label, left, y, 8, active > 0.04 ? color : palette.muted, 600, "left", "data", 52);
      rule(ctx, left + 57, y - 3, left + 133, y - 3, palette.chartLine, 4);
      if (active > 0) rule(ctx, left + 57, y - 3, left + 57 + 76 * active, y - 3, color, 4);
      drawText(ctx, state.muteByChannel && state.muteByChannel[track.channel] ? "M" : Number(state.soloTrack) === track.channel ? "S" : active > 0.04 ? "ON" : "--", left + 146, y, 6, active > 0.04 ? color : palette.subtle, 600, "right", "data");
    });
    const stepWidth = 304 / 16;
    for (let step = 0; step < 16; step++) {
      ctx.fillStyle = step === currentStep ? palette.text : palette.stepOff;
      ctx.fillRect(8 + step * stepWidth, 151, stepWidth - 2, 11);
    }
  }

  function drawAlpha2Note(ctx, state, track) {
    const note = Number(state.activeNote);
    const pitch = PITCH_CLASSES[note % PITCH_CLASSES.length];
    const event = (state.noteEvents || []).slice().reverse().find(function (item) { return item.note === note && item.endedAt === null; });
    const color = getTrackColor(track);
    drawText(ctx, "NOTE ACTIVITY", 8, 35, 6, palette.muted, 600, "left", "data");
    drawText(ctx, alpha2TrackName(state, track), 8, 58, 18, color, 500, "left", "display", 100);
    drawText(ctx, "MIDI NOTE " + note, 8, 77, 6, palette.muted, 600, "left", "data");
    drawText(ctx, pitch, 160, 118, pitch.length > 1 ? 60 : 76, color, 300, "center", "display");
    rule(ctx, 8, 145, 312, 145, palette.line, 1);
    drawText(ctx, "VELOCITY", 8, 162, 6, palette.muted, 600, "left", "data");
    drawText(ctx, event ? String(event.velocity) : "--", 312, 162, 10, palette.text, 600, "right", "data");
  }

  function render(ctx, state, time, fxModel) {
    const now = Number(time) || 0;
    const useAlpha2 = state.displayMode === "alpha2";
    palette = state.theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
    ctx.fillStyle = palette.screen;
    ctx.fillRect(0, 0, WIDTH, 170);
    const track = displayTrack(state);
    const status = useAlpha2 && state.allView
      ? "LIVE VALUES"
      : state.playbackOverview
      ? (state.midiPlayback && state.midiPlayback.active ? "MIDI LIVE" : "PLAYBACK")
      : state.fx.controlChange
      ? "CC " + state.fx.controlChange.controller
      : state.source === "demo" ? "DEMO" : (state.deviceTrack ? state.deviceTrack.name : "MIDI");
    const midiBpm = state.midiPlayback && state.midiPlayback.active ? state.midiPlayback.estimatedBpm : null;
    let bpmLabel = midiBpm !== null && midiBpm !== undefined
      ? "BPM ~" + String(midiBpm)
      : state.bpm === null || state.bpm === undefined ? tr(state, "bpmUnknown") : "BPM " + String(state.bpm);
    if (state.bpmChange && now - Number(state.bpmChange.at) < 1400) {
      bpmLabel += state.bpmChange.direction === "up" ? " ↑" : " ↓";
    }
    drawText(ctx, "SEQTRAK", 10, 14, 10, "#F3F3EF", 700, "left", "display");
    drawText(ctx, state.playing || state.playbackOverview ? "▶" : "■", 77, 14, 9, "#B6BCC3", 500, "left", "data");
    const headerTrackName = String(status).split("/")[0].trim().toUpperCase();
    const phosphorHeaderIcon = useAlpha2 && PHOSPHOR_HEADER_ICON_NAMES[headerTrackName];
    if (phosphorHeaderIcon) {
      const labelWidth = Math.min(100, Math.max(42, String(status).length * 4.5));
      const groupWidth = 17 + labelWidth;
      const groupLeft = 160 - groupWidth / 2;
      drawPhosphorIcon(ctx, phosphorHeaderIcon, groupLeft, 3, 12, getTrackColor(track));
      drawText(ctx, status, groupLeft + 17 + labelWidth / 2, 14, 8, "#77828B", 500, "center", "data", labelWidth);
    } else {
      drawText(ctx, status, 160, 14, 8, "#77828B", 500, "center", "data");
    }
    if (state.recording === true) {
      ctx.beginPath();
      ctx.fillStyle = "#FF5B62";
      ctx.arc(244, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, "REC", 250, 14, 8, "#FF5B62", 700, "left", "data");
    }
    drawText(ctx, bpmLabel, 310, 14, 9, "#B6BCC3", 500, "right", "data");
    rule(ctx, 10, 22, 310, 22);

    if (useAlpha2 && state.allView) {
      drawAlpha2All(ctx, state);
      return;
    }

    if (useAlpha2 && state.view === "effect") {
      drawAlpha2Fx(ctx, state, now, fxModel);
      return;
    }

    if (useAlpha2 && state.sideFeedback && now <= Number(state.sideFeedback.until)) {
      drawAlpha2SideFeedback(ctx, state.sideFeedback);
      return;
    }

    if (state.playbackOverview) {
      if (useAlpha2) drawAlpha2Playback(ctx, state, now);
      else drawPlaybackOverview(ctx, state, now);
      return;
    }

    if (state.activeNote !== null && state.activeNote !== undefined) {
      if (useAlpha2) drawAlpha2Note(ctx, state, track);
      else drawActiveNote(ctx, state.activeNote, track);
      return;
    }

    if (useAlpha2) {
      if (state.view === "effect") drawAlpha2Fx(ctx, state, now, fxModel);
      else drawAlpha2Selected(ctx, state, track);
    } else {
      const drumSoundOverview = state.view === "sound"
        && Array.isArray(state.drumPattern)
        && String(state.deviceTrack && state.deviceTrack.type || "").toUpperCase() === "DRUM";
      if (state.view === "parameter") drawParameter(ctx, state, track, now);
      else if (state.view === "effect") drawFx(ctx, state, now, fxModel);
      else if (state.view === "sound" && !drumSoundOverview) drawPresetAnnouncement(ctx, state, track, now);
      else drawOverview(ctx, state, track, now);
    }

    if (state.view === "effect" && state.fx.receivedSlotLabel && !state.fx.controlChange) {
      ctx.fillStyle = palette.screen;
      ctx.fillRect(10, 21, 300, 17);
      drawText(ctx, state.fx.receivedSlotLabel, 12, 34, 9, palette.text, 600, "left", "data");
    }
  }

  return {
    render: render,
    drawText: drawText,
    displayTrack: displayTrack,
    getTrackColor: getTrackColor,
    trackIconNames: TRACK_ICON_NAMES,
    trackIconName: trackIconName,
    drawPixelIcon: drawPixelIcon,
    phosphorHeaderPaths: PHOSPHOR_HEADER_PATHS,
    phosphorHeaderIconNames: PHOSPHOR_HEADER_ICON_NAMES
  };
});

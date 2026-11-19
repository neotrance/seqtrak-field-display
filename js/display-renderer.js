(function (root, factory) {
  const i18n = typeof module === "object" && module.exports ? require("./i18n.js") : root.SeqtrakI18n;
  const api = factory(i18n);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakDisplayRenderer = api;
})(typeof globalThis === "object" ? globalThis : this, function (I18n) {
  "use strict";

  const WIDTH = 320;
  const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const DISPLAY_FONT = '"Space Grotesk", sans-serif';
  const DATA_FONT = '"IBM Plex Mono", monospace';
  const DARK_PALETTE = {
    screen: "#080A0D", text: "#F3F3EF", muted: "#A4ABB3", secondary: "#B6BCC3", subtle: "#77828B",
    neutral: "#AAB4BC", line: "#343A40", chartLine: "#273039", highlight: "#F4A86A", fxCc: "#7DD9B2",
    mixDry: "#7DD9B2", mixWet: "#77B5F9",
    tracks: { kick: "#F6B04E", snare: "#FF6D84", hat: "#77D8F5", bass: "#8BE1A7", synth: "#B79CFF" },
    effects: { reverb: "#77B5F9", delay: "#7DD9B2", distortion: "#F4A86A", modulation: "#C6A3F6", other: "#F2D27B" }
  };
  const LIGHT_PALETTE = {
    screen: "#F5F7F5", text: "#182326", muted: "#566469", secondary: "#46565B", subtle: "#657379",
    neutral: "#46565B", line: "#BFCBCB", chartLine: "#D3DEDD", highlight: "#A44B17", fxCc: "#087A67",
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

  function drawPresetAnnouncement(ctx, state, track, time) {
    drawText(ctx, tr(state, "newPreset"), 12, 39, 9, "#A4ABB3", 500, "left", "data");
    drawText(ctx, track.label, 12, 51, 11, getTrackColor(track), 700, "left", "display");
    drawShape(ctx, track, time);
    rule(ctx, 94, 52, 94, 131, "#343A40", 1);
    drawText(ctx, tr(state, "soundName"), 108, 58, 8, "#9CA5AE", 500, "left", "data");
    const lines = wrapName(state.preset && state.preset.name, 20, 2);
    drawText(ctx, lines[0] || tr(state, "presetNotReceived"), 108, 83, lines[0] && lines[0].length > 17 ? 13 : 15, "#F4F3EF", 700, "left", "display", 198);
    if (lines[1]) drawText(ctx, lines[1], 108, 105, lines[1].length > 17 ? 13 : 15, "#F4F3EF", 700, "left", "display", 198);
    drawText(ctx, state.preset ? (state.preset.category || state.preset.engine || "") : tr(state, "noPresetData"), 108, 128, 8, getTrackColor(track), 500, "left", "data", 198);
    rule(ctx, 10, 140, 310, 140);
    drawText(ctx, "#" + String(state.preset && state.preset.number || "--").padStart(3, "0"), 308, 163, 10, getTrackColor(track), 600, "right", "data");
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
    drawText(ctx, state.preset ? tr(state, "soundTag") + "  " + state.preset.name : tr(state, "presetNotReceived"), 12, 153, 8, "#B4BBC1", 500, "left", "data", 288);
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
    drawText(ctx, track.num && track.num !== "--" ? track.num + "  " + track.label : track.label, 12, 42, 14, trackColor, 700, "left", "display");
    const sourceLabel = state.source === "demo" ? tr(state, "currentSound") : state.source === "event" ? tr(state, "event") : state.source.toUpperCase();
    drawTrackStatus(ctx, state, track, sourceLabel);
    drawShape(ctx, track, time);
    rule(ctx, 92, 54, 92, 128);
    if (!drawNoteTimeline(ctx, state, track, time)) drawMotif(ctx, track, time, state.values.decay);
    rule(ctx, 10, 134, 310, 134);
    const name = state.preset && state.preset.name;
    drawText(ctx, name || tr(state, "presetNotReceived"), 12, 153, name && name.length > 28 ? 9 : 12, "#F4F3EF", 700, "left", "display", 292);
    drawText(ctx, state.preset ? "#" + String(state.preset.number).padStart(3, "0") : "—", 309, 166, 8, trackColor, 500, "right", "data");
  }

  function drawDrumStepGrid(ctx, pattern, trackColor, x, y, cellHeight) {
    const width = 198;
    const gap = 2;
    const cellWidth = (width - gap * 15) / 16;
    pattern.forEach(function (active, index) {
      const left = x + index * (cellWidth + gap);
      ctx.fillStyle = active ? trackColor : palette.chartLine;
      ctx.fillRect(left, y, cellWidth, cellHeight);
      if (!active) {
        ctx.strokeStyle = palette.line;
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
    const patternNumber = Number(state.drumPatternNumber) || 1;
    drawText(ctx, track.num && track.num !== "--" ? track.num + "  " + track.label : track.label, 12, 42, 14, color, 700, "left", "display");
    drawTrackStatus(ctx, state, track, state.drumPatternSource || "PREVIEW");
    drawShape(ctx, track, time);
    rule(ctx, 92, 54, 92, 130);
    drawText(ctx, "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS · PREVIEW", 105, 58, 7, palette.secondary, 600, "left", "data", 200);
    drawDrumStepGrid(ctx, state.drumPattern, color, 105, 65, 20);
    drawDrumDecay(ctx, state, color, 105, 107, 198, false);
    rule(ctx, 10, 139, 310, 139);
    drawText(ctx, state.preset ? state.preset.name : tr(state, "presetNotReceived"), 12, 155, 8, palette.secondary, 500, "left", "data", 250);
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
    drawText(ctx, "PATTERN " + String(patternNumber).padStart(2, "0") + " · 16 STEPS · PREVIEW", 12, 101, 7, palette.secondary, 600, "left", "data", 294);
    drawDrumStepGrid(ctx, state.drumPattern, color, 105, 106, 20);
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

  function render(ctx, state, time, fxModel) {
    const now = Number(time) || 0;
    palette = state.theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
    ctx.fillStyle = palette.screen;
    ctx.fillRect(0, 0, WIDTH, 170);
    const track = displayTrack(state);
    const status = state.fx.controlChange
      ? "CC " + state.fx.controlChange.controller
      : state.source === "demo" ? "DEMO" : (state.deviceTrack ? state.deviceTrack.name : "MIDI");
    let bpmLabel = state.bpm === null || state.bpm === undefined ? tr(state, "bpmUnknown") : "BPM " + String(state.bpm);
    if (state.bpmChange && now - Number(state.bpmChange.at) < 1400) {
      bpmLabel += state.bpmChange.direction === "up" ? " ↑" : " ↓";
    }
    drawText(ctx, "SEQTRAK", 10, 14, 10, "#F3F3EF", 700, "left", "display");
    drawText(ctx, state.playing ? "▶" : "■", 77, 14, 9, "#B6BCC3", 500, "left", "data");
    drawText(ctx, status, 160, 14, 8, "#77828B", 500, "center", "data");
    if (state.recording === true) {
      ctx.beginPath();
      ctx.fillStyle = "#FF5B62";
      ctx.arc(244, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, "REC", 250, 14, 8, "#FF5B62", 700, "left", "data");
    }
    drawText(ctx, bpmLabel, 310, 14, 9, "#B6BCC3", 500, "right", "data");
    rule(ctx, 10, 22, 310, 22);

    if (drawActiveNote(ctx, state.activeNote, track)) return;

    if (state.view === "parameter") drawParameter(ctx, state, track, now);
    else if (state.view === "effect") drawFx(ctx, state, now, fxModel);
    else if (state.view === "sound") drawPresetAnnouncement(ctx, state, track, now);
    else drawOverview(ctx, state, track, now);

    if (state.view === "effect" && state.fx.receivedSlotLabel && !state.fx.controlChange) {
      ctx.fillStyle = palette.screen;
      ctx.fillRect(10, 21, 300, 17);
      drawText(ctx, state.fx.receivedSlotLabel, 12, 34, 9, palette.text, 600, "left", "data");
    }
  }

  return { render: render, drawText: drawText, displayTrack: displayTrack, getTrackColor: getTrackColor };
});

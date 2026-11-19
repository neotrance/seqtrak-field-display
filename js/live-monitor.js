(function () {
  "use strict";

  const Midi = window.SeqtrakLiveMidi;
  const Monitor = window.SeqtrakLiveMonitorState;
  const canvas = document.getElementById("liveDisplay");
  const context = canvas.getContext("2d");
  const inputSelect = document.getElementById("liveInputSelect");
  const connectionStatus = document.getElementById("liveConnectionStatus");
  const clockStatusLabel = document.getElementById("liveClockStatus");
  const logElement = document.getElementById("liveEventLog");
  const trackPageButton = document.getElementById("livePageTracks");
  const fxPageButton = document.getElementById("livePageFx");
  const Icons = window.SeqtrakPixelArtIcons || {};
  const TRACK_COLORS = [
    "#F6B04E", "#FF6D84", "#AAB4BC", "#77D8F5", "#77D8F5", "#AAB4BC",
    "#AAB4BC", "#B79CFF", "#B79CFF", "#B79CFF", "#AAB4BC"
  ];
  const ICON_NAMES = ["trex", "drum", "hand", "bell-ring", "bell-ring", "notes", "music", "keyboard-music", "keyboard-music", "keyboard-music", "mic"];
  const LABELS = ["KICK", "SNARE", "CLAP", "HAT 1", "HAT 2", "PERC 1", "PERC 2", "SYN 1", "SYN 2", "DX", "SMP"];
  const ICON_PATHS = ICON_NAMES.map(function (name) {
    if (typeof Path2D !== "function" || !Icons[name]) return null;
    try { return new Path2D(Icons[name]); } catch (_error) { return null; }
  });
  let state = Monitor.createState();
  let accessReady = false;
  let page = "tracks";
  let logRecords = [];

  context.setTransform(4, 0, 0, 4, 0, 0);

  function text(value, x, y, size, color, weight, family, align) {
    context.fillStyle = color;
    context.font = String(weight || 500) + " " + String(size || 8) + "px " + (family === "display" ? "'Space Grotesk', sans-serif" : "'IBM Plex Mono', monospace");
    context.textAlign = align || "left";
    context.fillText(String(value), x, y);
    context.textAlign = "left";
  }

  function drawHeader(now) {
    const clockStatus = Monitor.clockStatus(state, now);
    context.fillStyle = "#0B0E10";
    context.fillRect(0, 0, 320, 170);
    text(page === "tracks" ? "LIVE" : "LIVE / FX", 12, 15, 10, "#F3F2ED", 700, "display");
    const transport = state.transport === "started" ? "PLAY"
      : state.transport === "clock-only" && clockStatus === "CLOCK RECEIVING" ? "SYNC"
        : state.transport === "stopped" ? "STOP" : "WAIT";
    const bpm = state.estimatedBpm === null || clockStatus === "CLOCK LOST" || clockStatus === "CLOCK NOT RECEIVED"
      ? "BPM --" : "BPM ~" + state.estimatedBpm;
    text(transport + "  ·  " + bpm, 308, 14, 7, clockStatus === "CLOCK RECEIVING" ? "#F6B04E" : "#89939A", 500, "data", "right");
    context.fillStyle = "#31383C";
    context.fillRect(12, 22, 296, 1);
  }

  function drawTrackIcon(index, centerX, iconY, now) {
    const path = ICON_PATHS[index];
    if (!path) return;
    const activity = Monitor.trackActivity(state, index + 1, now);
    context.save();
    context.translate(centerX - 12, iconY);
    context.globalAlpha = 0.30 + activity * 0.70;
    context.fillStyle = TRACK_COLORS[index];
    context.fill(path);
    context.restore();
  }

  function drawStepPosition(now) {
    const clockStatus = Monitor.clockStatus(state, now);
    const running = (state.transport === "started" || state.transport === "clock-only") && clockStatus === "CLOCK RECEIVING";
    const startX = 12;
    const width = 296;
    const gap = 2;
    const markWidth = (width - gap * (Monitor.STEP_COUNT - 1)) / Monitor.STEP_COUNT;
    for (let step = 0; step < Monitor.STEP_COUNT; step++) {
      const x = startX + step * (markWidth + gap);
      context.fillStyle = running && state.currentStep === step ? "#F6B04E" : "#343B3F";
      context.fillRect(x, 145, markWidth, 3);
    }
    const step = state.currentStep === null ? "STEP -- / 16" : "STEP " + String(state.currentStep + 1).padStart(2, "0") + " / 16";
    const phaseText = state.transport === "clock-only" ? "~" + step : step;
    const statusText = state.transport === "started"
      ? (running ? "PLAYING" : "WAITING FOR CLOCK")
      : state.transport === "clock-only" ? (running ? "CLOCK ACTIVE" : "CLOCK LOST")
        : state.transport === "unknown" ? "WAITING FOR MIDI" : "STOPPED";
    text(statusText, 12, 162, 7, running ? "#F6B04E" : "#AAB3B8", 500);
    text(phaseText + (state.transport === "clock-only" ? " · PHASE EST." : " · 24 PPQN"), 308, 162, 7, "#89939A", 500, "data", "right");
  }

  function drawTracks(now) {
    const firstRow = [0, 1, 2, 3, 4, 5];
    const secondRow = [6, 7, 8, 9, 10];
    const firstCenter = function (column) { return 34 + column * 50.4; };
    const secondCenter = function (column) { return 58 + column * 51; };
    firstRow.forEach(function (index, column) {
      const centerX = firstCenter(column);
      drawTrackIcon(index, centerX, 34, now);
      text(LABELS[index], centerX, 65, 6, "#AAB3B8", 500, "data", "center");
    });
    secondRow.forEach(function (index, column) {
      const centerX = secondCenter(column);
      drawTrackIcon(index, centerX, 91, now);
      text(LABELS[index], centerX, 122, 6, "#AAB3B8", 500, "data", "center");
    });
    drawStepPosition(now);
  }

  function drawFx() {
    const channel = state.fxChannel;
    const value = function (controller, midiChannel) {
      const key = (midiChannel || 1) + ":" + controller;
      return Object.prototype.hasOwnProperty.call(state.fxValues, key) ? String(state.fxValues[key]).padStart(3, "0") : "---";
    };
    text("SEND REVERB", 14, 51, 7, "#F3F2ED", 600, "data");
    text("P1 " + value(110) + "   P2 " + value(111) + "   P3 " + value(112), 306, 51, 6, "#AAB3B8", 500, "data", "right");
    text("SEND DELAY", 14, 76, 7, "#F3F2ED", 600, "data");
    text("P1 " + value(113) + "   P2 " + value(114) + "   P3 " + value(115), 306, 76, 6, "#AAB3B8", 500, "data", "right");
    text("MASTER FX", 14, 101, 7, "#F3F2ED", 600, "data");
    text("M1 " + value(102) + "/" + value(103) + "/" + value(104) + "   M2 " + value(105) + "   M3 " + value(106), 306, 101, 6, "#AAB3B8", 500, "data", "right");
    text("SINGLE FX" + (channel === null ? "" : " · CH " + String(channel).padStart(2, "0")), 14, 126, 7, "#F3F2ED", 600, "data");
    text("P1 " + value(107, channel) + "   P2 " + value(108, channel) + "   P3 " + value(109, channel), 306, 126, 6, "#AAB3B8", 500, "data", "right");
    text("TYPE / ON-OFF NOT RECEIVED", 14, 159, 6, "#89939A", 500, "data");
  }

  function drawDisplay(now) {
    drawHeader(now);
    if (page === "tracks") drawTracks(now);
    else drawFx();
    const label = page === "tracks" ? "TRACKS 1 / 2" : "FX 2 / 2";
    text(label, 308, 34, 6, "#667177", 500, "data", "right");
    const active = Monitor.TRACKS.filter(function (track) { return Monitor.trackActivity(state, track.channel, now) > 0.08; }).map(function (track) { return track.name; });
    const transportLabel = state.transport === "started" ? "Playing, MIDI Start received."
      : state.transport === "clock-only" ? "MIDI Clock active; transport phase is estimated."
        : state.transport === "stopped" ? "Stopped." : "Waiting for MIDI transport.";
    canvas.setAttribute("aria-label", "Live " + page.toUpperCase() + " display. " + (active.length ? "Active: " + active.join(", ") : "No MIDI note activity") + ". " + transportLabel);
  }

  function renderStatus(now) {
    const status = Monitor.clockStatus(state, now);
    clockStatusLabel.textContent = status + (state.estimatedBpm === null ? "" : " · EST. BPM " + state.estimatedBpm);
    if (status === "CLOCK RECEIVING") clockStatusLabel.dataset.state = "receiving";
    else if (status === "CLOCK LOST") clockStatusLabel.dataset.state = "lost";
    else clockStatusLabel.dataset.state = "missing";
    drawDisplay(now);
  }

  function logMessage(received) {
    const message = received.message;
    const now = Date.now();
    const record = {
      time: new Date(now).toLocaleString(),
      port: received.portName,
      status: "0x" + message.status.toString(16).toUpperCase().padStart(2, "0"),
      type: message.type,
      channel: message.channel === undefined ? null : message.channel,
      note: message.note === undefined ? null : message.note,
      velocity: message.velocity === undefined ? null : message.velocity,
      controller: message.controller === undefined ? null : message.controller,
      value: message.value === undefined ? null : message.value
    };
    const bucket = Math.floor(now / 1000);
    const previous = logRecords[logRecords.length - 1];
    if (message.type === "CLOCK" && previous && previous.type === "CLOCK"
      && previous.port === record.port && previous._clockBucket === bucket) {
      previous.coalescedCount += 1;
    } else {
      if (message.type === "CLOCK") {
        record.coalescedCount = 1;
        record._clockBucket = bucket;
      }
      logRecords.push(record);
      if (logRecords.length > 200) logRecords = logRecords.slice(-200);
    }
    logElement.textContent = logRecords.length
      ? logRecords.map(function (item) {
        const output = Object.assign({}, item);
        delete output._clockBucket;
        return JSON.stringify(output);
      }).join("\n") + "\n"
      : "No live MIDI events received.";
    logElement.scrollTop = logElement.scrollHeight;
  }

  function updateInputs(inputs, selectedId) {
    inputSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = inputs.length ? "SELECT MIDI INPUT" : "NO MIDI INPUT FOUND";
    inputSelect.append(placeholder);
    inputs.forEach(function (input) {
      const option = document.createElement("option");
      option.value = input.id;
      option.textContent = [input.name, input.manufacturer].filter(Boolean).join(" · ");
      inputSelect.append(option);
    });
    if (selectedId) inputSelect.value = selectedId;
    inputSelect.disabled = !accessReady || inputs.length === 0;
  }

  const receiver = Midi.createReceiver({
    onStatus: function (result) {
      connectionStatus.textContent = result.message;
      connectionStatus.dataset.state = result.status;
      accessReady = !["disconnected", "permission-denied", "error"].includes(result.status);
      document.getElementById("liveConnect").disabled = accessReady;
      document.getElementById("liveDisconnect").disabled = !accessReady;
      inputSelect.disabled = !accessReady || inputSelect.options.length <= 1;
      state = Monitor.setConnection(state, result.status, result.inputName);
      renderStatus(performance.now());
    },
    onInputs: updateInputs,
    onMessage: function (received) {
      state = Monitor.applyMessage(state, received.message, performance.now());
      logMessage(received);
      renderStatus(performance.now());
    }
  });

  document.getElementById("liveConnect").addEventListener("click", async function () {
    try {
      await receiver.connect();
    } catch (error) {
      connectionStatus.textContent = error.message;
      connectionStatus.dataset.state = "permission-denied";
    }
  });
  document.getElementById("liveDisconnect").addEventListener("click", async function () {
    await receiver.disconnect();
  });
  inputSelect.addEventListener("change", async function () {
    if (!this.value) return;
    try {
      await receiver.selectInput(this.value);
    } catch (error) {
      connectionStatus.textContent = error.message;
      connectionStatus.dataset.state = "error";
    }
  });
  document.getElementById("liveLogCopy").addEventListener("click", async function () {
    const button = this;
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(logElement.textContent);
      button.textContent = "COPIED";
    } catch (_error) {
      button.textContent = "COPY FAILED";
    }
    window.setTimeout(function () { button.textContent = "COPY LOG"; }, 1400);
  });
  document.getElementById("liveLogClear").addEventListener("click", function () {
    logRecords = [];
    logElement.textContent = "No live MIDI events received.";
  });
  trackPageButton.addEventListener("click", function () { page = "tracks"; trackPageButton.setAttribute("aria-pressed", "true"); fxPageButton.setAttribute("aria-pressed", "false"); renderStatus(performance.now()); });
  fxPageButton.addEventListener("click", function () { page = "fx"; trackPageButton.setAttribute("aria-pressed", "false"); fxPageButton.setAttribute("aria-pressed", "true"); renderStatus(performance.now()); });
  document.getElementById("themeToggle").addEventListener("click", function () {
    const light = document.documentElement.getAttribute("data-theme") !== "light";
    document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
    this.textContent = light ? "DARK MODE" : "LIGHT MODE";
    this.setAttribute("aria-pressed", String(light));
  });
  renderStatus(performance.now());
  window.setInterval(function () { renderStatus(performance.now()); }, 33);
})();

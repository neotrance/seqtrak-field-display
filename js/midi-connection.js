(function (root) {
  "use strict";

  function classify(data) {
    const bytes = Array.from(data || [], function (value) { return Number(value) & 0xff; });
    const status = bytes[0];
    if (!Number.isInteger(status)) return { type: "UNKNOWN", bytes: bytes };

    const command = status & 0xf0;
    const channel = (status & 0x0f) + 1;
    if (status === 0xf0) return { type: "SYSEX", bytes: bytes };
    if (command === 0x80 && bytes.length >= 3) return { type: "NOTE OFF", channel: channel, note: bytes[1], velocity: bytes[2], bytes: bytes };
    if (command === 0x90 && bytes.length >= 3) {
      return bytes[2] === 0
        ? { type: "NOTE OFF", channel: channel, note: bytes[1], velocity: 0, bytes: bytes }
        : { type: "NOTE ON", channel: channel, note: bytes[1], velocity: bytes[2], bytes: bytes };
    }
    if (command === 0xb0 && bytes.length >= 3) return { type: "CONTROL CHANGE", channel: channel, controller: bytes[1], value: bytes[2], bytes: bytes };
    if (command === 0xc0 && bytes.length >= 2) return { type: "PROGRAM CHANGE", channel: channel, program: bytes[1], bytes: bytes };
    if (status >= 0xf8) {
      const names = { 0xf8: "CLOCK", 0xfa: "START", 0xfb: "CONTINUE", 0xfc: "STOP", 0xfe: "ACTIVE SENSING", 0xff: "RESET" };
      return { type: "SYSTEM REALTIME", realtime: names[status] || "UNDEFINED", bytes: bytes };
    }
    if (status >= 0xf0) return { type: "SYSTEM COMMON", bytes: bytes };
    return { type: "OTHER", channel: channel, bytes: bytes };
  }

  function copyText(text) {
    const clipboard = root.navigator && root.navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      return Promise.resolve().then(function () { return clipboard.writeText(text); }).catch(function () { return copyTextFallback(text); });
    }
    return copyTextFallback(text);
  }

  function copyTextFallback(text) {
    if (!root.document || typeof root.document.execCommand !== "function") {
      return Promise.reject(new Error("Clipboard access is unavailable."));
    }
    const field = root.document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    field.style.pointerEvents = "none";
    root.document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = root.document.execCommand("copy"); }
    finally { root.document.body.removeChild(field); }
    return copied ? Promise.resolve() : Promise.reject(new Error("The browser could not copy the log."));
  }

  function bindLogCopyButtons() {
    if (!root.document || typeof root.document.querySelectorAll !== "function") return;
    Array.from(root.document.querySelectorAll(".midi-log-copy")).forEach(function (button) {
      button.addEventListener("click", async function () {
        const target = root.document.getElementById(button.dataset.copyTarget);
        if (!target) return;
        const label = button.dataset.defaultLabel || button.textContent;
        button.dataset.defaultLabel = label;
        button.disabled = true;
        try {
          await copyText(target.textContent);
          button.textContent = "COPIED";
          button.setAttribute("aria-label", "MIDI log copied");
        } catch (error) {
          button.textContent = "COPY FAILED";
          button.setAttribute("aria-label", "Could not copy MIDI log");
        }
        root.setTimeout(function () {
          button.textContent = label;
          button.setAttribute("aria-label", "Copy received MIDI log");
          button.disabled = false;
        }, 1400);
      });
    });
  }

  function bindLogClearButtons() {
    if (!root.document || typeof root.document.querySelectorAll !== "function") return;
    Array.from(root.document.querySelectorAll(".midi-log-clear")).forEach(function (button) {
      button.addEventListener("click", function () {
        const target = root.document.getElementById(button.dataset.clearTarget);
        if (!target) return;
        target.textContent = button.dataset.emptyLabel || "No MIDI messages received.";
        target.scrollTop = 0;
      });
    });
  }

  function createReceiver(callbacks) {
    const handlers = callbacks || {};
    let access = null;
    let selectedPort = null;
    let sysexGranted = false;

    function notifyStatus(status, message) {
      if (typeof handlers.onStatus === "function") handlers.onStatus({ status: status, message: message, sysexGranted: sysexGranted, inputName: selectedPort ? selectedPort.name : "" });
    }

    function getInputs() {
      if (!access) return [];
      return Array.from(access.inputs.values()).map(function (port) {
        return { id: port.id, name: port.name || "Unnamed MIDI input", manufacturer: port.manufacturer || "", state: port.state || "connected" };
      }).filter(function (port) { return port.state !== "disconnected"; });
    }

    function notifyInputs() {
      if (typeof handlers.onInputs === "function") handlers.onInputs(getInputs(), selectedPort ? selectedPort.id : "");
    }

    function detachSelected() {
      const previous = selectedPort;
      selectedPort = null;
      if (!previous) return Promise.resolve();
      previous.onmidimessage = null;
      return typeof previous.close === "function" ? Promise.resolve(previous.close()).catch(function () {}) : Promise.resolve();
    }

    function refreshInputs() {
      const inputs = getInputs();
      if (selectedPort && !inputs.some(function (port) { return port.id === selectedPort.id; })) {
        detachSelected();
        notifyStatus(access ? "ready" : "disconnected", "The selected MIDI input disconnected.");
      }
      notifyInputs();
      if (access && inputs.length === 0) notifyStatus("ready", "MIDI access is ready, but no input ports were found.");
      else if (access && !selectedPort) notifyStatus("ready", "MIDI access is ready. Choose an input port.");
    }

    async function connect() {
      if (!root.navigator || typeof root.navigator.requestMIDIAccess !== "function") {
        throw new Error("Web MIDI is unavailable. Open this page in a supported browser using HTTPS or localhost.");
      }
      await detachSelected();
      access = null;
      sysexGranted = false;
      try {
        access = await root.navigator.requestMIDIAccess({ sysex: true });
        sysexGranted = true;
      } catch (sysexError) {
        try {
          access = await root.navigator.requestMIDIAccess();
          sysexGranted = false;
        } catch (midiError) {
          access = null;
          throw new Error("MIDI permission was not granted: " + (midiError && midiError.message ? midiError.message : "connection unavailable"));
        }
      }
      access.onstatechange = refreshInputs;
      refreshInputs();
      const baseStatus = sysexGranted
        ? "SysEx access granted; unknown SysEx data will only be logged."
        : "SysEx permission unavailable; Note, CC, and Program Change input can still be used.";
      notifyStatus("ready", getInputs().length
        ? "MIDI ready. " + baseStatus
        : "MIDI ready, but no input ports were found. " + baseStatus);
      return { inputs: getInputs(), sysexGranted: sysexGranted };
    }

    async function selectInput(id) {
      await detachSelected();
      if (!id) {
        notifyInputs();
        notifyStatus(access ? "ready" : "disconnected", access ? "Choose a MIDI input port." : "Not connected.");
        return null;
      }
      if (!access) throw new Error("Connect MIDI access before selecting an input.");
      const port = access.inputs.get(String(id));
      if (!port) throw new Error("That MIDI input is no longer available.");
      if (typeof port.open === "function") await port.open();
      selectedPort = port;
      port.onmidimessage = function (event) {
        if (typeof handlers.onMessage === "function") {
          handlers.onMessage({ data: Array.from(event.data || []), timestamp: Number(event.timeStamp) || Date.now(), portId: port.id, portName: port.name || "Unnamed MIDI input" });
        }
      };
      notifyInputs();
      notifyStatus("listening", "Receiving from " + (port.name || "Unnamed MIDI input") + ". Input only; no MIDI is sent.");
      return port;
    }

    async function disconnect() {
      if (access) access.onstatechange = null;
      await detachSelected();
      access = null;
      sysexGranted = false;
      notifyInputs();
      notifyStatus("disconnected", "MIDI disconnected.");
    }

    return { connect: connect, selectInput: selectInput, disconnect: disconnect, getInputs: getInputs, classify: classify };
  }

  const api = { classify: classify, createReceiver: createReceiver, copyText: copyText };
  root.SeqtrakMidiConnection = api;
  bindLogCopyButtons();
  bindLogClearButtons();
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis === "object" ? globalThis : this);

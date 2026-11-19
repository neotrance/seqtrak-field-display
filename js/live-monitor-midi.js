(function (root) {
  "use strict";

  function classify(data) {
    const bytes = Array.from(data || [], function (value) { return Number(value) & 0xff; });
    const status = bytes[0];
    if (!Number.isInteger(status)) return null;
    if (status === 0xf8) return { type: "CLOCK", status: status, bytes: bytes };
    if (status === 0xfa) return { type: "START", status: status, bytes: bytes };
    if (status === 0xfc) return { type: "STOP", status: status, bytes: bytes };

    const command = status & 0xf0;
    const channel = (status & 0x0f) + 1;
    if ((command === 0x80 || command === 0x90) && bytes.length >= 3) {
      const noteOff = command === 0x80 || bytes[2] === 0;
      return {
        type: noteOff ? "NOTE OFF" : "NOTE ON",
        status: status,
        channel: channel,
        note: bytes[1],
        velocity: bytes[2],
        bytes: bytes
      };
    }
    if (command === 0xb0 && bytes.length >= 3) {
      return {
        type: "CC",
        status: status,
        channel: channel,
        controller: bytes[1],
        value: bytes[2],
        bytes: bytes
      };
    }
    return null;
  }

  function preferredInput(inputs, preferred) {
    if (!inputs.length) return null;
    if (preferred) {
      const exactId = inputs.find(function (input) { return input.id === preferred.id; });
      if (exactId) return exactId;
      if (preferred.name) {
        const exactName = inputs.filter(function (input) { return input.name === preferred.name; });
        if (exactName.length === 1) return exactName[0];
      }
      const reconnectedSeqtrak = inputs.filter(function (input) {
        return /seqtrak/i.test(input.name + " " + input.manufacturer);
      });
      if (reconnectedSeqtrak.length === 1) return reconnectedSeqtrak[0];
      return null;
    }
    const namedSeqtrak = inputs.filter(function (input) {
      return /seqtrak/i.test(input.name + " " + input.manufacturer);
    });
    if (namedSeqtrak.length === 1) return namedSeqtrak[0];
    const yamaha = inputs.filter(function (input) { return /yamaha/i.test(input.manufacturer); });
    if (yamaha.length === 1) return yamaha[0];
    return inputs.length === 1 && !preferred ? inputs[0] : null;
  }

  function createReceiver(callbacks, environment) {
    const handlers = callbacks || {};
    const host = environment || root;
    let access = null;
    let selectedPort = null;
    let preferred = null;
    let enabled = false;
    let selecting = false;

    function notifyStatus(status, message) {
      if (typeof handlers.onStatus === "function") {
        handlers.onStatus({ status: status, message: message, inputName: selectedPort ? selectedPort.name : "" });
      }
    }

    function getInputs() {
      if (!access) return [];
      return Array.from(access.inputs.values()).map(function (port) {
        return {
          id: port.id,
          name: port.name || "Unnamed MIDI input",
          manufacturer: port.manufacturer || "",
          state: port.state || "connected"
        };
      }).filter(function (port) { return port.state !== "disconnected"; });
    }

    function notifyInputs() {
      if (typeof handlers.onInputs === "function") handlers.onInputs(getInputs(), selectedPort ? selectedPort.id : "");
    }

    async function detachSelected() {
      const previous = selectedPort;
      selectedPort = null;
      if (!previous) return;
      previous.onmidimessage = null;
      if (typeof previous.close === "function") {
        try { await previous.close(); } catch (error) { /* Port may already be disconnected. */ }
      }
    }

    async function selectInput(id, automatic) {
      if (!access) throw new Error("Connect MIDI access before selecting an input.");
      const port = access.inputs.get(String(id));
      if (!port || port.state === "disconnected") throw new Error("That MIDI input is not connected.");
      await detachSelected();
      if (typeof port.open === "function") await port.open();
      selectedPort = port;
      preferred = { id: port.id, name: port.name || "" };
      port.onmidimessage = function (event) {
        const parsed = classify(event.data);
        if (parsed && typeof handlers.onMessage === "function") {
          handlers.onMessage({
            data: Array.from(event.data || []),
            message: parsed,
            timestamp: Number(event.timeStamp) || (host.performance ? host.performance.now() : Date.now()),
            portId: port.id,
            portName: port.name || "Unnamed MIDI input"
          });
        }
      };
      notifyInputs();
      notifyStatus("listening", (automatic ? "Auto-selected " : "Receiving from ") + (port.name || "Unnamed MIDI input") + ". Input only; no MIDI is sent.");
      return port;
    }

    async function autoSelectIfPossible() {
      if (!enabled || !access || selectedPort || selecting) return;
      const candidate = preferredInput(getInputs(), preferred);
      if (!candidate) return;
      selecting = true;
      try {
        await selectInput(candidate.id, true);
      } catch (error) {
        notifyStatus("ready", "MIDI input found but could not be opened. Select it manually or reconnect.");
      } finally {
        selecting = false;
      }
    }

    function refreshInputs() {
      const ports = getInputs();
      let disconnectedName = "";
      if (selectedPort && !ports.some(function (port) { return port.id === selectedPort.id; })) {
        preferred = { id: selectedPort.id, name: selectedPort.name || "" };
        disconnectedName = selectedPort.name || "MIDI input";
        detachSelected();
      }
      notifyInputs();
      if (!ports.length) {
        notifyStatus(disconnectedName ? "device-disconnected" : "waiting-device", disconnectedName
          ? disconnectedName + " disconnected. Waiting to reconnect."
          : "MIDI permission is ready. Connect the SEQTRAK by USB; this page will select it when available.");
        return;
      }
      if (!selectedPort) {
        autoSelectIfPossible();
        if (ports.length > 1 && !preferredInput(ports, preferred)) {
          notifyStatus(disconnectedName ? "device-disconnected" : "ready", disconnectedName
            ? disconnectedName + " disconnected. Choose an input or wait for it to reconnect."
            : "Multiple MIDI inputs found. Choose the SEQTRAK input.");
        } else if (!preferredInput(ports, preferred) && disconnectedName) {
          notifyStatus("device-disconnected", disconnectedName + " disconnected. Waiting for the same input to return.");
        }
      }
    }

    async function connect() {
      if (!host.navigator || typeof host.navigator.requestMIDIAccess !== "function") {
        throw new Error("Web MIDI is unavailable. Use Chrome on HTTPS or localhost.");
      }
      await detachSelected();
      enabled = true;
      access = null;
      try {
        access = await host.navigator.requestMIDIAccess({ sysex: false });
      } catch (error) {
        enabled = false;
        notifyStatus("permission-denied", "MIDI permission was denied or unavailable. Allow MIDI input in Chrome and try again.");
        throw new Error("MIDI permission was denied or is unavailable.");
      }
      access.onstatechange = refreshInputs;
      refreshInputs();
      return { inputs: getInputs(), selectedId: selectedPort ? selectedPort.id : "" };
    }

    async function disconnect() {
      enabled = false;
      if (access) access.onstatechange = null;
      await detachSelected();
      access = null;
      preferred = null;
      notifyInputs();
      notifyStatus("disconnected", "MIDI disconnected.");
    }

    return {
      connect: connect,
      selectInput: function (id) { return id ? selectInput(id, false) : Promise.resolve(null); },
      disconnect: disconnect,
      getInputs: getInputs
    };
  }

  const api = { classify: classify, preferredInput: preferredInput, createReceiver: createReceiver };
  root.SeqtrakLiveMidi = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis === "object" ? globalThis : this);

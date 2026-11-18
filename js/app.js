(function () {
  "use strict";

  const catalog = window.SEQTRAK_CATALOG;
  const fxSpecs = window.SEQTRAK_FX_SPECS;
  const Model = window.SeqtrakDisplayState;
  const FxModel = window.SeqtrakFxModel;
  const Renderer = window.SeqtrakDisplayRenderer;
  const I18n = window.SeqtrakI18n;
  const $ = function (id) { return document.getElementById(id); };
  const canvas = $("display");
  const ctx = canvas.getContext("2d");
  const state = Model.createInitialState();
  const now = function () { return performance.now(); };
  const fxAddressSlots = {
    "30 41": "SEND REVERB",
    "30 42": "SEND VARIATION",
    "30 43": "MASTER 1",
    "30 44": "MASTER 2",
    "30 45": "MASTER 3",
    "30 46": "MASTER 4"
  };
  const legacyDemoEvents = [
    ["30 43 00", "01 02"],
    ["30 44 00", "02 10"],
    ["30 45 00", "0C 70"],
    ["31 27 00", "08 10"],
    ["30 41 00", "01 02"]
  ];
  let stateValue = Model.selectFamily(state, "kick", catalog.presets, catalog.tracks, now());
  let legacyDemoIndex = 0;

  function tr(key, values) {
    return I18n.t(stateValue.language, key, values);
  }

  // The canvas is a 1280x680 backing store with a 320x170 logical display.
  ctx.setTransform(4, 0, 0, 4, 0, 0);

  function setAccent(track) {
    const lightAccents = { kick: "#985900", snare: "#B52E4B", hat: "#006B83", bass: "#267343", synth: "#67499B" };
    const accent = stateValue.theme === "light"
      ? lightAccents[track && track.id] || "#46565B"
      : track && track.color ? track.color : "#AAB4BC";
    document.documentElement.style.setProperty("--accent", accent);
  }

  function syncThemeControls() {
    document.documentElement.setAttribute("data-theme", stateValue.theme);
    $("themeToggle").textContent = tr(stateValue.theme === "dark" ? "themeLight" : "themeDark");
    $("themeToggle").setAttribute("aria-pressed", String(stateValue.theme === "light"));
  }

  function applyLanguage(language) {
    const previousLanguage = stateValue.language;
    const readyMessage = $("eventLog").textContent === I18n.t(previousLanguage, "logReady");
    stateValue = Object.assign({}, stateValue, { language: language === "ja" ? "ja" : "en" });
    document.documentElement.setAttribute("lang", stateValue.language);
    I18n.apply(document, stateValue.language);
    syncThemeControls();
    reflectState();
    if (readyMessage) $("eventLog").textContent = tr("logReady");
    refreshFxMeta();
    updateFxHint();
    $("sizeNote").textContent = tr($("hardware").classList.contains("actual") ? "actualNote" : "zoomNote");
  }

  function updateTrackButtons() {
    document.querySelectorAll(".tracks button").forEach(function (button) {
      button.classList.toggle("active", Boolean(stateValue.track && stateValue.track.id === button.dataset.id));
    });
  }

  function populatePresetSelect() {
    const select = $("preset");
    select.replaceChildren();
    if (!stateValue.presets.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = tr("presetNotReceived");
      select.append(option);
      select.disabled = true;
      $("count").textContent = tr("soundsCount", { n: 0 });
      return;
    }
    select.disabled = false;
    stateValue.presets.forEach(function (preset, index) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = preset.name;
      select.append(option);
    });
    select.value = String(stateValue.selectedIndex);
    $("count").textContent = tr("soundsCount", { n: stateValue.presets.length });
  }

  function reflectState() {
    updateTrackButtons();
    setAccent(stateValue.track);
    populatePresetSelect();
    ["cutoff", "resonance", "decay"].forEach(function (key) {
      $(key).value = String(stateValue.values[key]);
      $(key + "Val").textContent = String(stateValue.values[key]);
    });
    $("bpmPreview").value = stateValue.bpm === null ? "" : String(stateValue.bpm);
    $("bpmDownPreview").disabled = stateValue.bpm === null || stateValue.bpm <= 5;
    $("bpmUpPreview").disabled = stateValue.bpm === null || stateValue.bpm >= 300;
    $("play").textContent = tr(stateValue.playing ? "stop" : "play");
  }

  function setFxParameter(parameter, show) {
    const slider = $("fxParamValue");
    const label = $("fxParamValueLabel");
    const meta = $("fxParamMeta");
    const range = FxModel.rangeForParameter(parameter);
    stateValue.fx = Object.assign({}, stateValue.fx, {
      parameter: parameter,
      parameterValue: null,
      controlChange: null,
      receivedSlotLabel: null
    });
    if (!range) {
      slider.disabled = true;
      label.textContent = "—";
      meta.textContent = parameter ? tr("rangeUnverified") : tr("parameterDefinitionUnavailable");
    } else {
      const existing = Number(slider.value);
      const initial = Number.isFinite(existing) ? Model.clamp(existing, range.min, range.max) : range.min;
      slider.disabled = false;
      slider.min = String(range.min);
      slider.max = String(range.max);
      slider.value = String(initial);
      label.textContent = FxModel.formatValue(parameter, initial, fxSpecs.assignTables);
      stateValue.fx.parameterValue = initial;
      meta.textContent = tr("specRange", { display: parameter.display || tr("undocumented"), value: initial });
    }
    document.querySelectorAll(".fx-test").forEach(function (button) { button.disabled = !range; });
    if (show) setView("effect");
    updateFxHint();
  }

  function refreshFxMeta() {
    const parameter = stateValue.fx.parameter;
    const range = FxModel.rangeForParameter(parameter);
    if (!range) {
      $("fxParamMeta").textContent = parameter ? tr("rangeUnverified") : tr("parameterDefinitionUnavailable");
      return;
    }
    const value = stateValue.fx.parameterValue;
    $("fxParamMeta").textContent = tr("specRange", {
      display: parameter.display || tr("undocumented"),
      value: value === null || value === undefined ? "—" : value
    });
  }

  function getCurrentFxParameters() {
    return FxModel.getFxParameters(stateValue.fx.effect, stateValue.fx.scope, fxSpecs.parameters);
  }

  function syncFxParameterOptions(preferredNumber, show) {
    const select = $("fxParameter");
    const parameters = getCurrentFxParameters();
    select.replaceChildren();
    if (!parameters.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = tr("parameterDataUnavailable");
      select.append(option);
      select.disabled = true;
      setFxParameter(null, false);
      if (show) setView("effect");
      return;
    }
    select.disabled = false;
    parameters.forEach(function (parameter) {
      const option = document.createElement("option");
      option.value = String(parameter.number);
      option.textContent = String(parameter.number).padStart(2, "0") + " / " + parameter.name;
      select.append(option);
    });
    const chosen = parameters.find(function (parameter) { return Number(parameter.number) === Number(preferredNumber); }) || parameters[0];
    select.value = String(chosen.number);
    setFxParameter(chosen, show);
  }

  function findEffect(scope, category, typeId) {
    return catalog.effects.find(function (effect) {
      const assignable = String(effect.assignable || "").split(",").map(function (item) { return item.trim(); });
      return assignable.includes(scope) && effect.category === category && effect.msb + ":" + effect.lsb === typeId;
    }) || null;
  }

  function updateFxOptions(preferredCategory, preferredType, show) {
    const scope = $("fxScope").value;
    const choices = catalog.effects.filter(function (effect) {
      return String(effect.assignable || "").split(",").map(function (item) { return item.trim(); }).includes(scope);
    });
    const categories = Array.from(new Set(choices.map(function (effect) { return effect.category; })));
    const categorySelect = $("fxCategory");
    categorySelect.replaceChildren();
    categories.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.append(option);
    });
    const category = categories.includes(preferredCategory) ? preferredCategory : categories[0] || "";
    if (category) categorySelect.value = category;
    const types = choices.filter(function (effect) { return effect.category === category; });
    const typeSelect = $("fxType");
    typeSelect.replaceChildren();
    types.forEach(function (effect) {
      const option = document.createElement("option");
      option.value = effect.msb + ":" + effect.lsb;
      option.textContent = effect.name;
      typeSelect.append(option);
    });
    const selected = types.find(function (effect) { return effect.msb + ":" + effect.lsb === preferredType; }) || types[0] || null;
    if (selected) typeSelect.value = selected.msb + ":" + selected.lsb;
    typeSelect.disabled = !selected;
    categorySelect.disabled = !categories.length;
    stateValue.fx = Object.assign({}, stateValue.fx, { scope: scope, effect: selected, controlChange: null, receivedSlotLabel: null });
    syncFxParameterOptions(stateValue.fx.parameter && stateValue.fx.parameter.number, false);
    if (show) setView("effect");
  }

  function setView(view) {
    stateValue = Object.assign({}, stateValue, { view: view, until: now() + 2400 });
  }

  function updateFxHint() {
    const hint = $("fxVisualHint");
    const parameter = stateValue.fx.parameter;
    if (stateValue.fx.controlChange) {
      hint.textContent = tr("hintCcNoName");
      return;
    }
    if (!stateValue.fx.effect) {
      hint.textContent = tr("hintNoEffect");
      return;
    }
    if (!parameter) {
      hint.textContent = tr("hintTypeOnly");
      return;
    }
    if (!FxModel.rangeForParameter(parameter)) {
      hint.textContent = tr("hintNoRange", { name: parameter.name });
      return;
    }
    hint.textContent = tr("hintIllustration", { name: parameter.name });
  }

  function setFxParameterValue(value, show) {
    const parameter = stateValue.fx.parameter;
    const range = FxModel.rangeForParameter(parameter);
    if (!range) return { ok: false, reason: "Parameter range is not unambiguous" };
    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric < range.min || numeric > range.max) {
      return { ok: false, reason: "Value is outside the defined parameter range" };
    }
    stateValue.fx = Object.assign({}, stateValue.fx, {
      parameterValue: numeric,
      controlChange: null,
      receivedSlotLabel: null
    });
    $("fxParamValue").value = String(numeric);
    $("fxParamValueLabel").textContent = FxModel.formatValue(parameter, numeric, fxSpecs.assignTables);
    $("fxParamMeta").textContent = tr("specRange", { display: parameter.display || tr("undocumented"), value: numeric });
    if (show) setView("effect");
    updateFxHint();
    return { ok: true, value: numeric };
  }

  function setBpmValue(raw, source) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 5 || value > 300) {
      return { ok: false, reason: tr("invalidBpm") };
    }
    const previous = stateValue.bpm;
    const changedAt = now();
    const bpmChange = previous !== null && previous !== value
      ? { direction: value > previous ? "up" : "down", at: changedAt }
      : stateValue.bpmChange;
    stateValue = Object.assign({}, stateValue, { bpm: value, bpmSource: source || "event", bpmChange: bpmChange });
    return { ok: true, value: value };
  }

  function adjustPreviewBpm(delta) {
    if (stateValue.bpm === null) return;
    const result = setBpmValue(stateValue.bpm + delta, "preview");
    if (!result.ok) return;
    reflectState();
    $("eventLog").textContent = JSON.stringify({ source: "preview", bpm: result.value }, null, 2);
  }

  function syncControllerValueRange() {
    const controller = Number($("midiController").value);
    const definition = Model.SOUND_CONTROLLERS[controller];
    const min = definition ? definition.min : 0;
    const max = definition ? definition.max : 127;
    const slider = $("midiValue");
    const old = Number(slider.value);
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(Model.clamp(Number.isFinite(old) ? old : 64, min, max));
    $("midiValueLabel").textContent = slider.value;
  }

  function populateMidiControls() {
    const channelSelect = $("midiChannel");
    for (let channel = 1; channel <= 11; channel++) {
      const track = Model.MIDI_TRACKS[channel];
      const option = document.createElement("option");
      option.value = String(channel);
      option.textContent = String(channel).padStart(2, "0") + " / " + track.name;
      channelSelect.append(option);
    }
    const ccSelect = $("midiController");
    Model.CC_CHOICES.forEach(function (choice) {
      const option = document.createElement("option");
      option.value = String(choice.controller);
      option.textContent = String(choice.controller).padStart(3, "0") + " / " + choice.name;
      ccSelect.append(option);
    });
    ccSelect.value = "74";
    syncControllerValueRange();
  }

  function applyMidiControlChange(channel, controller, value) {
    const event = Model.decodeControlChange(channel, controller, value);
    if (!event.ok) {
      $("eventLog").textContent = JSON.stringify(event, null, 2);
      return event;
    }
    stateValue = Model.applyControlChange(stateValue, event, catalog.tracks, now());
    reflectState();
    updateFxHint();
    $("eventLog").textContent = JSON.stringify(event, null, 2);
    return event;
  }

  function receiveNoteEvent(input) {
    const event = input || {};
    const channel = Number(event.channel);
    const note = Number(event.note);
    const velocity = event.velocity === undefined ? 0 : Number(event.velocity);
    const type = event.type === "noteOn" || event.type === "on" ? "noteOn"
      : event.type === "noteOff" || event.type === "off" ? "noteOff" : null;
    if (!type || !Number.isInteger(channel) || channel < 1 || channel > 16
      || !Number.isInteger(note) || note < 0 || note > 127
      || !Number.isInteger(velocity) || velocity < 0 || velocity > 127) {
      return { ok: false, reason: tr("invalidNote") };
    }

    const timestamp = now();
    const noteEvents = stateValue.noteEvents.slice();
    const noteOn = type === "noteOn" && velocity > 0;
    let activeIndex = -1;
    for (let index = noteEvents.length - 1; index >= 0; index--) {
      const item = noteEvents[index];
      if (item.channel === channel && item.note === note && item.endedAt === null) {
        activeIndex = index;
        break;
      }
    }
    if (noteOn) {
      if (activeIndex >= 0) noteEvents[activeIndex] = Object.assign({}, noteEvents[activeIndex], { endedAt: timestamp });
      noteEvents.push({ channel: channel, note: note, velocity: velocity, startedAt: timestamp, endedAt: null });
    } else if (activeIndex >= 0) {
      noteEvents[activeIndex] = Object.assign({}, noteEvents[activeIndex], { endedAt: timestamp });
    }

    const recent = noteEvents.filter(function (item) {
      return timestamp - (item.endedAt === null ? timestamp : item.endedAt) <= 8000;
    }).slice(-24);
    stateValue = Object.assign({}, stateValue, { noteEvents: recent, view: "overview", until: 0 });
    return { ok: true, type: noteOn ? "noteOn" : "noteOff", channel: channel, note: note, velocity: velocity };
  }

  function parseHexBytes(raw, count) {
    const tokens = String(raw).trim().replace(/^0x/i, "").split(/[\s,:-]+/).filter(Boolean);
    if (tokens.length !== count || tokens.some(function (token) { return !/^[0-9a-f]{1,2}$/i.test(token); })) {
      throw new Error("Expected " + count + " hex bytes");
    }
    return tokens.map(function (token) { return parseInt(token, 16); });
  }

  function findLegacySlot(address) {
    if (address.length !== 3 || address[2] !== 0) return null;
    const key = address.slice(0, 2).map(function (byte) { return byte.toString(16).toUpperCase().padStart(2, "0"); }).join(" ");
    if (fxAddressSlots[key]) return { name: fxAddressSlots[key], part: null };
    if (address[0] === 0x31 && address[1] >= 0x20 && address[1] <= 0x2f) {
      return { name: "INSERT", part: address[1] - 0x20 };
    }
    return null;
  }

  function receiveLegacyFxTypeEvent(addressInput, valueInput) {
    const address = Array.isArray(addressInput) ? addressInput : parseHexBytes(addressInput, 3);
    const value = Array.isArray(valueInput) ? valueInput : parseHexBytes(valueInput, 2);
    const slot = findLegacySlot(address);
    if (!slot) throw new Error("Unknown legacy test address (offset 00 only)");
    const hex = function (number) { return number.toString(16).toUpperCase().padStart(2, "0"); };
    const effect = catalog.effects.find(function (item) { return item.msb.toUpperCase() === hex(value[0]) && item.lsb.toUpperCase() === hex(value[1]); }) || null;
    const slotLabel = slot.part === null ? slot.name : "INSERT / PART " + slot.part;
    const scope = slot.name === "INSERT" ? "Single"
      : slot.name.indexOf("SEND") === 0 ? "Send"
      : slot.name.replace(/^MASTER /, "Master ");
    stateValue.fx = Object.assign({}, stateValue.fx, {
      scope: scope,
      effect: effect || { name: "UNKNOWN " + hex(value[0]) + " " + hex(value[1]), category: "OTHER", msb: hex(value[0]), lsb: hex(value[1]) },
      controlChange: null,
      receivedSlotLabel: slotLabel
    });
    syncFxParameterOptions(null, false);
    stateValue.fx = Object.assign({}, stateValue.fx, { scope: scope, receivedSlotLabel: slotLabel });
    setView("effect");
    const result = {
      slot: slotLabel,
      address: address.map(hex).join(" "),
      type: value.map(hex).join(" "),
      effect: effect ? effect.name : null,
      known: Boolean(effect),
      protocolVerifiedAgainstUserGuide: false
    };
    $("eventLog").textContent = JSON.stringify(result, null, 2);
    updateFxHint();
    return result;
  }

  catalog.tracks.forEach(function (track) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = track.label;
    button.dataset.id = track.id;
    button.addEventListener("click", function () {
      stateValue = Model.selectFamily(stateValue, track.id, catalog.presets, catalog.tracks, now());
      reflectState();
    });
    $("tracks").append(button);
  });

  $("language").addEventListener("change", function (event) {
    applyLanguage(event.target.value);
  });
  $("themeToggle").addEventListener("click", function () {
    stateValue = Object.assign({}, stateValue, { theme: stateValue.theme === "dark" ? "light" : "dark" });
    syncThemeControls();
    setAccent(stateValue.track);
  });

  $("preset").addEventListener("change", function (event) {
    stateValue = Model.selectPreset(stateValue, Number(event.target.value), now());
  });

  ["cutoff", "resonance", "decay"].forEach(function (key) {
    $(key).addEventListener("input", function (event) {
      const definition = { name: event.target.getAttribute("aria-label") || key.toUpperCase(), min: Number(event.target.min), max: Number(event.target.max) };
      const names = { cutoff: "FILTER CUTOFF", resonance: "FILTER RESONANCE", decay: "DECAY / RELEASE TIME" };
      definition.name = names[key];
      stateValue = Model.setSoundParameter(stateValue, key, Number(event.target.value), now(), definition);
      $(key + "Val").textContent = event.target.value;
    });
  });

  $("play").addEventListener("click", function () {
    stateValue = Object.assign({}, stateValue, { playing: !stateValue.playing });
    reflectState();
  });
  $("next").addEventListener("click", function () {
    if (!stateValue.presets.length) return;
    const index = (stateValue.selectedIndex + 1) % stateValue.presets.length;
    stateValue = Model.selectPreset(stateValue, index, now());
    reflectState();
  });

  $("fxScope").addEventListener("change", function () {
    stateValue.fx = Object.assign({}, stateValue.fx, { scope: $("fxScope").value });
    updateFxOptions(null, null, true);
  });
  $("fxCategory").addEventListener("change", function () {
    updateFxOptions($("fxCategory").value, null, true);
  });
  $("fxType").addEventListener("change", function () {
    const effect = findEffect($("fxScope").value, $("fxCategory").value, $("fxType").value);
    stateValue.fx = Object.assign({}, stateValue.fx, { effect: effect, scope: $("fxScope").value });
    syncFxParameterOptions(null, true);
    updateFxHint();
  });
  $("fxParameter").addEventListener("change", function () {
    const parameter = getCurrentFxParameters().find(function (item) { return Number(item.number) === Number($("fxParameter").value); }) || null;
    setFxParameter(parameter, true);
  });
  $("fxParamValue").addEventListener("input", function (event) {
    const result = setFxParameterValue(Number(event.target.value), true);
    if (!result.ok) $("eventLog").textContent = JSON.stringify(result, null, 2);
  });
  $("fxVisualIntensity").addEventListener("input", function (event) {
    stateValue.fx = Object.assign({}, stateValue.fx, { visualIntensity: Number(event.target.value), controlChange: null });
    $("fxVisualIntensityVal").textContent = event.target.value;
    setView("effect");
  });
  document.querySelectorAll(".fx-test").forEach(function (button) {
    button.addEventListener("click", function () {
      const parameter = stateValue.fx.parameter;
      const range = FxModel.rangeForParameter(parameter);
      if (!range) return;
      const fraction = Number(button.dataset.level);
      setFxParameterValue(Math.round(range.min + (range.max - range.min) * fraction), true);
    });
  });

  $("midiController").addEventListener("change", syncControllerValueRange);
  $("midiValue").addEventListener("input", function (event) { $("midiValueLabel").textContent = event.target.value; });
  $("applyMidiEvent").addEventListener("click", function () {
    applyMidiControlChange($("midiChannel").value, $("midiController").value, $("midiValue").value);
  });

  $("setBpmPreview").addEventListener("click", function () {
    const result = setBpmValue($("bpmPreview").value, "preview");
    if (!result.ok) {
      $("eventLog").textContent = result.reason;
      return;
    }
    reflectState();
    $("eventLog").textContent = JSON.stringify({ source: "preview", bpm: result.value }, null, 2);
  });
  $("bpmDownPreview").addEventListener("click", function () { adjustPreviewBpm(-1); });
  $("bpmUpPreview").addEventListener("click", function () { adjustPreviewBpm(1); });
  $("noteOnPreview").addEventListener("click", function () {
    const result = receiveNoteEvent({
      type: "noteOn",
      channel: $("midiChannel").value,
      note: $("noteNumber").value,
      velocity: $("noteVelocity").value
    });
    $("eventLog").textContent = result.ok ? JSON.stringify(result, null, 2) : result.reason;
  });
  $("noteOffPreview").addEventListener("click", function () {
    const result = receiveNoteEvent({
      type: "noteOff",
      channel: $("midiChannel").value,
      note: $("noteNumber").value,
      velocity: 0
    });
    $("eventLog").textContent = result.ok ? JSON.stringify(result, null, 2) : result.reason;
  });

  $("applyFxEvent").addEventListener("click", function () {
    try {
      receiveLegacyFxTypeEvent($("sysexAddress").value, $("sysexValue").value);
    } catch (error) {
      $("eventLog").textContent = "ERROR: " + error.message;
    }
  });
  $("demoFxSequence").addEventListener("click", function () {
    const entry = legacyDemoEvents[legacyDemoIndex++ % legacyDemoEvents.length];
    $("sysexAddress").value = entry[0];
    $("sysexValue").value = entry[1];
    try {
      receiveLegacyFxTypeEvent(entry[0], entry[1]);
    } catch (error) {
      $("eventLog").textContent = "ERROR: " + error.message;
    }
  });

  $("actual").addEventListener("click", function () {
    $("hardware").classList.add("actual");
    $("actual").classList.add("active");
    $("zoom").classList.remove("active");
    $("sizeNote").textContent = tr("actualNote");
  });
  $("zoom").addEventListener("click", function () {
    $("hardware").classList.remove("actual");
    $("zoom").classList.add("active");
    $("actual").classList.remove("active");
    $("sizeNote").textContent = tr("zoomNote");
  });

  window.seqtrakUpdate = function (event) {
    const input = event || {};
    const hasTrack = Object.prototype.hasOwnProperty.call(input, "track");
    if (hasTrack && input.track) {
      const track = catalog.tracks.find(function (item) { return item.id === input.track || item.label === input.track; }) || null;
      stateValue = Object.assign({}, stateValue, {
        track: track,
        source: "event",
        deviceTrack: { name: track ? track.label : String(input.track), channel: null, family: track ? track.id : null },
        presets: [],
        preset: null,
        selectedIndex: -1,
        view: "track",
        until: now() + 2400
      });
    } else if (hasTrack) {
      stateValue = Object.assign({}, stateValue, {
        source: "event",
        deviceTrack: null,
        track: null,
        presets: [],
        preset: null,
        selectedIndex: -1
      });
    }
    if (input.preset !== undefined) {
      const preset = typeof input.preset === "string" ? { name: input.preset } : input.preset;
      stateValue = Object.assign({}, stateValue, { source: "event", preset: preset, view: "sound", until: now() + 2400 });
    }
    ["cutoff", "resonance", "decay"].forEach(function (key) {
      if (input[key] !== undefined) {
        const definition = Model.SOUND_CONTROLLERS[key === "cutoff" ? 74 : key === "resonance" ? 71 : 75];
        stateValue = Model.setSoundParameter(stateValue, key, Number(input[key]), now(), definition);
      }
    });
    if (input.bpm !== undefined) {
      const bpmResult = setBpmValue(input.bpm, "event");
      if (!bpmResult.ok) $("eventLog").textContent = bpmResult.reason;
    }
    if (input.masterVolumeDisplay !== undefined) {
      const display = input.masterVolumeDisplay;
      const valid = display === null || typeof display === "string" || (typeof display === "number" && Number.isFinite(display));
      if (valid) stateValue = Object.assign({}, stateValue, {
        masterVolumeDisplay: display === null || display === "" ? null : String(display),
        view: "overview",
        until: 0
      });
    }
    const inputChannel = Number(input.channel);
    if (Number.isInteger(inputChannel) && inputChannel >= 1 && inputChannel <= 11) {
      const channelTrack = Model.MIDI_TRACKS[inputChannel];
      if (channelTrack) {
        const namedTrack = hasTrack && input.track
          ? catalog.tracks.find(function (item) { return item.id === input.track || item.label === input.track; }) || null
          : null;
        const familyId = namedTrack ? namedTrack.id : channelTrack.family;
        const family = familyId ? catalog.tracks.find(function (item) { return item.id === familyId; }) || null : null;
        const trackName = namedTrack ? namedTrack.label : hasTrack && input.track ? String(input.track) : channelTrack.name;
        const activeChannel = stateValue.deviceTrack && Number(stateValue.deviceTrack.channel);
        if (activeChannel !== inputChannel || hasTrack) {
          stateValue = Object.assign({}, stateValue, {
            source: "midi",
            deviceTrack: { name: trackName, family: familyId, channel: inputChannel },
            track: family,
            presets: [],
            preset: null,
            selectedIndex: -1,
            view: "overview",
            until: 0
          });
        }
      }
      let directParameter = null;
      if (input.volume !== undefined) {
        const volume = Number(input.volume);
        if (Number.isInteger(volume) && volume >= 0 && volume <= 127) {
          const volumeByChannel = Object.assign({}, stateValue.volumeByChannel, { [inputChannel]: volume });
          stateValue = Object.assign({}, stateValue, { volumeByChannel: volumeByChannel });
          directParameter = { key: "volume", name: "TRACK VOLUME", value: volume, min: 0, max: 127 };
        }
      }
      if (typeof input.muted === "boolean") {
        const muteByChannel = Object.assign({}, stateValue.muteByChannel, { [inputChannel]: input.muted });
        stateValue = Object.assign({}, stateValue, { muteByChannel: muteByChannel });
        directParameter = { key: "mute", name: "MUTE", value: input.muted ? 64 : 0, min: 0, max: 127 };
      }
      if (directParameter) {
        stateValue = Object.assign({}, stateValue, {
          currentParameter: directParameter,
          view: "parameter",
          until: now() + 2400,
          fx: Object.assign({}, stateValue.fx, { controlChange: null, receivedSlotLabel: null })
        });
      }
    }
    if (input.soloTrack === null || (Number.isInteger(Number(input.soloTrack)) && Number(input.soloTrack) >= 1 && Number(input.soloTrack) <= 11)) {
      if (Object.prototype.hasOwnProperty.call(input, "soloTrack")) {
        stateValue = Object.assign({}, stateValue, {
          soloTrack: input.soloTrack === null ? null : Number(input.soloTrack),
          view: "overview",
          until: 0
        });
        if (input.soloTrack !== null) {
          const soloChannel = Number(input.soloTrack);
          const soloDeviceTrack = Model.MIDI_TRACKS[soloChannel];
          const soloFamily = soloDeviceTrack && soloDeviceTrack.family
            ? catalog.tracks.find(function (item) { return item.id === soloDeviceTrack.family; }) || null
            : null;
          if (soloDeviceTrack) {
            stateValue = Object.assign({}, stateValue, {
              source: "midi",
              deviceTrack: Object.assign({ channel: soloChannel }, soloDeviceTrack),
              track: soloFamily,
              presets: [],
              preset: null,
              selectedIndex: -1
            });
          }
        }
      }
    }
    if (input.playing !== undefined) stateValue = Object.assign({}, stateValue, { playing: Boolean(input.playing) });
    if (input.fxScope) {
      $("fxScope").value = input.fxScope;
      updateFxOptions(input.fxCategory || null, null, false);
    }
    if (input.fxCategory) {
      $("fxCategory").value = input.fxCategory;
      updateFxOptions(input.fxCategory, null, false);
    }
    if (input.fxType) {
      const effect = catalog.effects.find(function (item) { return item.name === input.fxType; });
      if (effect) {
        const possibleScopes = String(effect.assignable || "").split(",").map(function (item) { return item.trim(); });
        const scope = possibleScopes.includes($("fxScope").value) ? $("fxScope").value : possibleScopes[0];
        $("fxScope").value = scope;
        updateFxOptions(effect.category, effect.msb + ":" + effect.lsb, true);
      }
    }
    if (input.fxDepth !== undefined) {
      const depth = Model.clamp(Number(input.fxDepth), 0, 127);
      $("fxVisualIntensity").value = String(depth);
      $("fxVisualIntensityVal").textContent = String(depth);
      stateValue.fx = Object.assign({}, stateValue.fx, { visualIntensity: depth });
    }
    reflectState();
  };

  window.seqtrakControlChange = function (channel, controller, value) {
    if (channel && typeof channel === "object") {
      const message = channel;
      return applyMidiControlChange(message.channel, message.controller, message.value);
    }
    return applyMidiControlChange(channel, controller, value);
  };

  window.seqtrakNoteEvent = receiveNoteEvent;

  window.seqtrakFxTypeEvent = receiveLegacyFxTypeEvent;
  window.seqtrakFxVisualMode = function () {
    return FxModel.semantic(stateValue.fx.parameter && stateValue.fx.parameter.name, stateValue.fx.effect && stateValue.fx.effect.category);
  };
  window.seqtrakFxParameterEvent = function (parameterNumber, rawValue) {
    const parameter = getCurrentFxParameters().find(function (item) { return Number(item.number) === Number(parameterNumber); }) || null;
    const range = FxModel.rangeForParameter(parameter);
    const value = Number(rawValue);
    if (!parameter) return { ok: false, reason: "Parameter not defined for selected effect and scope" };
    if (!range) return { ok: false, reason: "Parameter range is not unambiguous" };
    if (!stateValue.fx.parameter || Number(stateValue.fx.parameter.number) !== Number(parameter.number)) {
      setFxParameter(parameter, false);
    }
    const result = setFxParameterValue(value, true);
    if (!result.ok) return result;
    $("fxParameter").value = String(parameter.number);
    return {
      ok: true,
      effect: stateValue.fx.effect.name,
      parameter: parameter.name,
      raw: value,
      display: FxModel.formatValue(parameter, value, fxSpecs.assignTables)
    };
  };

  function tick(time) {
    stateValue = Model.expireView(stateValue, time);
    const renderState = Object.assign({}, stateValue, {
      fx: Object.assign({}, stateValue.fx, {
        formattedValue: stateValue.fx.parameter && stateValue.fx.parameterValue !== null
          ? FxModel.formatValue(stateValue.fx.parameter, stateValue.fx.parameterValue, fxSpecs.assignTables)
          : null
      })
    });
    Renderer.render(ctx, renderState, time, FxModel);
    requestAnimationFrame(tick);
  }

  I18n.apply(document, stateValue.language);
  syncThemeControls();
  $("language").value = stateValue.language;
  $("eventLog").textContent = tr("logReady");
  populateMidiControls();
  updateFxOptions(null, null, false);
  reflectState();
  requestAnimationFrame(tick);
})();

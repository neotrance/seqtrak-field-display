(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakFxUnit = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const CATEGORY_TO_CATALOG = {
    COMPRESSOR: "COMPRESSOR / DUCKER",
    DUCKER: "COMPRESSOR / DUCKER"
  };

  const STRIP_MAPPINGS = {
    1: {
      fxLevel: { kind: "effectParameter", number: 1 },
      highPass: { kind: "performance", parameter: "HIGH PASS FILTER CUTOFF", effect: "highPass" },
      repeater: { kind: "performance", parameter: "BEAT REPEAT LENGTH", effect: "repeater" }
    },
    2: {
      fxLevel: { kind: "effectParameter", number: 1 },
      highPass: { kind: "effectParameter", number: 2 },
      repeater: { kind: "effectParameter", number: 3 }
    }
  };

  function normalizeName(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function catalogCategory(category) {
    return CATEGORY_TO_CATALOG[category] || category;
  }

  function findEffectType(preset, effects) {
    if (!preset || !Array.isArray(effects)) return null;
    const expectedCategory = catalogCategory(preset.category);
    const expectedType = normalizeName(preset.type);
    const assignableScope = preset.scope;
    return effects.find(function (effect) {
      const assignable = String(effect.assignable || "").split(",").map(function (item) { return item.trim(); });
      return assignable.includes(assignableScope)
        && effect.category === expectedCategory
        && normalizeName(effect.name) === expectedType;
    }) || null;
  }

  function presetsFor(scope, presetData, effects) {
    const entries = presetData && presetData.scopes && presetData.scopes[scope];
    if (!Array.isArray(entries)) return [];
    return entries.map(function (preset) {
      return Object.assign({}, preset, { effect: findEffectType(preset, effects) });
    });
  }

  function nextIndex(index, direction, length) {
    if (!Number.isInteger(length) || length < 1) return -1;
    const current = Number.isInteger(index) ? index : 0;
    const increment = direction < 0 ? -1 : 1;
    return (current + increment + length) % length;
  }

  function findIndexForPreset(presets, preset) {
    if (!Array.isArray(presets) || !presets.length || !preset) return 0;
    const exact = presets.findIndex(function (item) {
      return item.category === preset.category && item.number === preset.number && item.name === preset.name;
    });
    if (exact >= 0) return exact;
    const sameSlot = presets.findIndex(function (item) {
      return item.category === preset.category && item.number === preset.number;
    });
    return sameSlot >= 0 ? sameSlot : 0;
  }

  function stripMapping(page, strip) {
    const pageMap = STRIP_MAPPINGS[Number(page)];
    return pageMap && pageMap[strip] ? Object.assign({}, pageMap[strip]) : null;
  }

  function pointerValue(y, top, bottom, min, max) {
    if (![y, top, bottom, min, max].every(Number.isFinite) || bottom <= top || max < min) return null;
    const fraction = Math.max(0, Math.min(1, (bottom - y) / (bottom - top)));
    return Math.round(min + fraction * (max - min));
  }

  function fraction(value, min, max) {
    if (![value, min, max].every(Number.isFinite) || max <= min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  return {
    findEffectType: findEffectType,
    fraction: fraction,
    findIndexForPreset: findIndexForPreset,
    nextIndex: nextIndex,
    normalizeName: normalizeName,
    pointerValue: pointerValue,
    presetsFor: presetsFor,
    stripMapping: stripMapping
  };
});

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SeqtrakFxModel = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  function getFxParameters(effect, scope, parameterMap) {
    if (!effect || !parameterMap) return [];
    const candidates = parameterMap[String(effect.name || "").toUpperCase()] || [];
    const blockMatches = candidates.filter(function (parameter) {
      const block = String(parameter.block || "");
      if (!block) return true;
      if (scope === "Send") return /send/i.test(block);
      if (scope === "Single") return /single/i.test(block) && !/send/i.test(block);
      if (/^Master/.test(scope)) return /master/i.test(block) && !/send/i.test(block);
      return false;
    });

    const byNumber = new Map();
    for (const parameter of blockMatches) {
      const number = Number(parameter.number);
      if (!Number.isInteger(number)) continue;
      const previous = byNumber.get(number);
      if (!previous) {
        byNumber.set(number, { item: parameter, conflict: false });
      } else if (signature(previous.item) !== signature(parameter)) {
        previous.conflict = true;
      }
    }
    return Array.from(byNumber.entries())
      .filter(function (entry) { return !entry[1].conflict; })
      .map(function (entry) { return entry[1].item; })
      .sort(function (a, b) { return Number(a.number) - Number(b.number); });
  }

  function signature(parameter) {
    const copy = Object.assign({}, parameter);
    delete copy.block;
    return JSON.stringify(copy, Object.keys(copy).sort());
  }

  function rangeForParameter(parameter) {
    if (!parameter || typeof parameter.range !== "string") return null;
    const match = parameter.range.match(/^\s*\(?\s*(\d+)\s*[-–]\s*(\d+)\s*\)?\s*$/);
    if (!match) return null;
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (min > max) return null;
    return { min: min, max: max };
  }

  function formatValue(parameter, value, assignTables) {
    if (!parameter) return "—";
    const tableId = String(parameter.table || "");
    const table = assignTables && assignTables[tableId];
    if (table && Object.prototype.hasOwnProperty.call(table, String(value))) return table[String(value)];
    return String(value);
  }

  function semantic(name, category) {
    const n = String(name || "").toLowerCase();
    const c = String(category || "").toLowerCase();
    if (/feedback|fb level|repeat/.test(n)) return "feedback";
    if (/delay time|time l|time r|tempo delay/.test(n)) return "delayTime";
    if (/wet|dry|mix|balance/.test(n)) return "mix";
    if (/reverb time|decay time|room size/.test(n)) return "reverbTime";
    if (/pre.?delay|initial delay/.test(n)) return "preDelay";
    if (/cutoff|frequency|freq/.test(n) && /filter|eq/.test(c)) return "cutoff";
    if (/drive|distortion|gain/.test(n) && /distort|amp/.test(c)) return "drive";
    if (/rate|speed/.test(n) && /modulat|chorus|flanger|phaser|tremolo/.test(c)) return "rate";
    if (/depth/.test(n)) return "depth";
    return "generic";
  }

  return {
    getFxParameters: getFxParameters,
    rangeForParameter: rangeForParameter,
    formatValue: formatValue,
    semantic: semantic
  };
});

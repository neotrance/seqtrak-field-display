(function (root) {
  "use strict";

  const sharedCategories = [
    {
      category: "FILTER",
      type: "CONTROL FILTER",
      names: [
        "LPF - NO RESONANCE", "LPF - LOW RESONANCE", "LPF - MID RESONANCE", "LPF - HIGH RESONANCE",
        "HPF - NO RESONANCE", "HPF - LOW RESONANCE", "HPF - MID RESONANCE", "HPF - HIGH RESONANCE"
      ]
    },
    {
      category: "REVERB",
      names: ["SMALL ROOM 1", "SMALL ROOM 2", "MID ROOM", "SMALL HALL", "MID HALL", "STAGE", "GATED REVERB", "REVERSE REVERB"],
      types: ["SPX ROOM", "SPX ROOM", "SPX ROOM", "SPX HALL", "SPX HALL", "SPX STAGE", "GATED REVERB", "REVERSE REVERB"]
    },
    {
      category: "DELAY",
      names: ["TEMPO DELAY 4TH", "PING PONG DELAY 4TH", "TEMPO DELAY 8TH DOT", "TEMPO DELAY 8TH", "PING PONG DELAY 8TH", "TEMPO DELAY 16TH", "ANALOG DELAY - MODERN", "ANALOG DELAY RETRO"],
      types: ["TEMPO DELAY STEREO", "TEMPO CROSS DELAY", "TEMPO DELAY STEREO", "TEMPO DELAY STEREO", "TEMPO CROSS DELAY", "TEMPO DELAY STEREO", "ANALOG DELAY MODERN", "ANALOG DELAY RETRO"]
    },
    {
      category: "COMPRESSOR",
      type: "UNI COMP DOWN",
      names: ["COMP - SETTING 1", "COMP - SETTING 2", "COMP - SETTING 3", "COMP - SETTING 4", "COMP - SETTING 5", "COMP - SETTING 6", "COMP - SETTING 7", "COMP - SETTING 8"]
    },
    {
      category: "MODULATION",
      names: ["SPX CHORUS", "TEMPO FLANGER", "TEMPO PHASER", "ENSEMBLE DETUNE", "AUTO PAN", "TREMOLO", "VCM AUTO WAH", "RING MODULATOR"],
      types: ["SPX CHORUS", "TEMPO FLANGER", "TEMPO PHASER", "ENSEMBLE DETUNE", "AUTO PAN", "TREMOLO", "VCM AUTO WAH", "RING MODULATOR"]
    },
    {
      category: "DUCKER",
      type: "UNI COMP DOWN",
      names: ["DUCKER - SETTING 1", "DUCKER - SETTING 2", "DUCKER - SETTING 3", "DUCKER - SETTING 4", "DUCKER - SETTING 5", "DUCKER - SETTING 6", "DUCKER - SETTING 7", "DUCKER - SETTING 8"]
    },
    {
      category: "OTHER",
      names: ["BEAT REPEAT", "TALKING MODULATOR", "ROTARY SPEAKER 1 - SLOW", "ROTARY SPEAKER 2 - FAST", "HARMONIC ENHANCER", "AUTO SYNTH", "SLICE", "VINYL BREAK"],
      types: ["BEAT REPEAT", "TALKING MODULATOR", "ROTARY SPEAKER 1", "ROTARY SPEAKER 2", "HARMONIC ENHANCER", "AUTO SYNTH", "SLICE", "VINYL BREAK"]
    }
  ];

  const distortionPresets = {
    master: [
      ["WAVE FOLDER - SATURATION", "WAVE FOLDER"], ["COMP DISTORTION", "COMP DISTORTION"],
      ["WAVE FOLDER", "WAVE FOLDER"], ["AMP SIMULATOR 2 - SETTING 1", "AMP SIMULATOR 2"],
      ["AMP SIMULATOR 1", "AMP SIMULATOR 1"], ["AMP SIMULATOR 2 - SETTING 2", "AMP SIMULATOR 2"],
      ["BIT CRUSHER", "BIT CRUSHER"], ["DIGITAL TURNTABLE", "DIGITAL TURNTABLE"]
    ],
    single: [
      ["WAVE FOLDER - SATURATION", "WAVE FOLDER"], ["AMP SIMULATOR 2 - SETTING 1", "AMP SIMULATOR 2"],
      ["AMP SIMULATOR 2 - SETTING 2", "AMP SIMULATOR 2"], ["JAZZ COMBO", "JAZZ COMBO"],
      ["AMP SIMULATOR 1", "AMP SIMULATOR 1"], ["SMALL STEREO", "SMALL STEREO"],
      ["BIT CRUSHER", "BIT CRUSHER"], ["DIGITAL TURNTABLE", "DIGITAL TURNTABLE"]
    ]
  };

  function expand(scope) {
    const entries = [];
    sharedCategories.forEach(function (group) {
      group.names.forEach(function (name, index) {
        entries.push({
          scope: scope,
          category: group.category,
          number: index + 1,
          name: name,
          type: (group.types || []).length ? group.types[index] : group.type
        });
      });
    });
    distortionPresets[scope === "Master 1" ? "master" : "single"].forEach(function (item, index) {
      entries.push({ scope: scope, category: "DISTORTION", number: index + 1, name: item[0], type: item[1] });
    });
    const categoryOrder = ["FILTER", "REVERB", "DELAY", "COMPRESSOR", "DISTORTION", "MODULATION", "DUCKER", "OTHER"];
    entries.sort(function (a, b) {
      const categoryDifference = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      return categoryDifference || a.number - b.number;
    });
    return entries;
  }

  root.SEQTRAK_HARDWARE_FX_PRESETS = {
    categories: ["FILTER", "REVERB", "DELAY", "COMPRESSOR", "DISTORTION", "MODULATION", "DUCKER", "OTHER"],
    scopes: {
      Single: expand("Single"),
      "Master 1": expand("Master 1")
    }
  };
})(window);

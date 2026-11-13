// ---------------------------------------------------------------- audio
var ac = null, master = null, noiseBuf = null, amb = null, sfxGain = null, musicGain = null;
// ---- player preferences: volume, music/sfx split, difficulty, motion
var PREF_KEY = 'lh_prefs_v1';
var prefs = { vol: 80, musicOn: true, music: 65, sfxOn: true, sfx: 85, motion: 'auto', diff: 'normal' };
var DIFFS = {
  easy: { dmg: 0.5, hunger: 0.36, hp: 0, name: 'Gentle', note: 'Half damage, hunger runs slower, enemies keep their usual hearts.' },
  normal: { dmg: 1, hunger: 0.5, hp: 0, name: 'Normal', note: 'The island as it was built.' },
  hard: { dmg: 1.5, hunger: 0.64, hp: 1, name: 'Hard', note: 'Harder hits, faster hunger, one extra heart on every enemy.' }
};
var REDUCE = false, muted = false;
function prefsLoad() {
  try {
    var o = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    Object.keys(prefs).forEach(function (k) { if (o[k] !== undefined) prefs[k] = o[k]; });
  } catch (e) { /* no storage: defaults */ }
  if (!DIFFS[prefs.diff]) prefs.diff = 'normal';
  applyMotion();
}
function prefsSave() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }
function diffNow() { return DIFFS[prefs.diff] || DIFFS.normal; }
function motionReduced() {
  if (prefs.motion === 'reduced') return true;
  if (prefs.motion === 'full') return false;
  return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function applyMotion() {
  REDUCE = motionReduced();
  document.documentElement.classList.toggle('reduce-motion', REDUCE);
  document.documentElement.classList.toggle('motion-full', prefs.motion === 'full');
}
function applyAudio() {
  if (!ac || !master) return;
  var t = ac.currentTime;
  master.gain.setTargetAtTime(muted ? 0 : prefs.vol / 100, t, 0.05);
  if (musicGain) musicGain.gain.setTargetAtTime(prefs.musicOn ? prefs.music / 100 : 0, t, 0.08);
  if (sfxGain) sfxGain.gain.setTargetAtTime(prefs.sfxOn ? prefs.sfx / 100 : 0, t, 0.08);
}
prefsLoad();
function audioInit() {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    if (!master) {
      master = ac.createGain(); master.gain.value = prefs.vol / 100;
      sfxGain = ac.createGain(); sfxGain.gain.value = prefs.sfxOn ? prefs.sfx / 100 : 0;
      musicGain = ac.createGain(); musicGain.gain.value = prefs.musicOn ? prefs.music / 100 : 0;
      sfxGain.connect(master); musicGain.connect(master); master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      initAmbient();
      initMusic();
    }
    return true;
  } catch (e) { return false; }
}
// A burst of filtered noise: footsteps, whooshes, thuds, hisses.
function noise(d, f0, f1, type, v, q) {
  if (muted || !audioInit()) return;
  try {
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    src.buffer = noiseBuf; f.type = type || 'lowpass'; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    src.connect(f); f.connect(g); g.connect(sfxGain || master); src.start(t, Math.random()); src.stop(t + d + 0.02);
  } catch (e) { /* audio not available */ }
}
// Looping background layers that fade in and out with the zone the hunter is in.
function noiseLoop(type, freq, q) {
  var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = noiseBuf; src.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7; g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(sfxGain || master); src.start();
  return g;
}
function initAmbient() {
  var cr = ac.createOscillator(), crg = ac.createGain(), lfo = ac.createOscillator(), lfog = ac.createGain();
  cr.type = 'sine'; cr.frequency.value = 4400; crg.gain.value = 0;
  lfo.type = 'square'; lfo.frequency.value = 7.5; lfog.gain.value = 0.5;
  lfo.connect(lfog); cr.connect(crg); crg.connect(sfxGain || master); cr.start(); lfo.start();
  var dr = ac.createOscillator(), drg = ac.createGain();
  dr.type = 'sine'; dr.frequency.value = 52; drg.gain.value = 0; dr.connect(drg); drg.connect(sfxGain || master); dr.start();
  amb = { waves: noiseLoop('lowpass', 520, 0.5), wind: noiseLoop('bandpass', 380, 0.6), leaves: noiseLoop('bandpass', 2400, 0.9), rumble: noiseLoop('lowpass', 140, 0.5), crick: crg, drone: drg, rain: noiseLoop('highpass', 3200, 0.4) };
}
var AMB_LEVELS = [
  { waves: 0.11, wind: 0.025, leaves: 0.0, rumble: 0, crick: 0, drone: 0, rain: 0 },
  { waves: 0.0, wind: 0.02, leaves: 0.035, rumble: 0, crick: 0.007, drone: 0, rain: 0 },
  { waves: 0.0, wind: 0.0, leaves: 0.0, rumble: 0.07, crick: 0, drone: 0.03, rain: 0 },
  { waves: 0.03, wind: 0.09, leaves: 0.0, rumble: 0, crick: 0, drone: 0, rain: 0.02 },
  { waves: 0.07, wind: 0.1, leaves: 0.0, rumble: 0.02, crick: 0, drone: 0, rain: 0.05 }
];
function ambientUpdate() {
  if (!master || !amb) return;
  var t = ac.currentTime, on = !muted && S.mode !== 'title';
  applyAudio();
  var zi = zoneIndex(S.p.x), lv = AMB_LEVELS[zi];
  for (var k in amb) {
    var base = on ? lv[k] : 0;
    if (k === 'waves') base *= 0.6 + 0.4 * Math.sin(S.t * 0.55);
    if (k === 'wind') base *= 0.7 + 0.3 * Math.sin(S.t * 0.31 + 1);
    amb[k].gain.setTargetAtTime(base, t, 0.7);
  }
  musicUpdate();
}
var thunderT = 0;
function ambientEvents(dt) {
  if (muted || !master || S.mode !== 'play') return;
  var zi = zoneIndex(S.p.x);
  S.evT = (S.evT || 0) - dt;
  if (S.evT > 0) return;
  if (zi <= 1) { S.evT = 2.5 + Math.random() * 5; var b = 2200 + Math.random() * 1400, n = 2 + (Math.random() * 3 | 0); for (var i = 0; i < n; i++) (function (i) { setTimeout(function () { tone(b + i * 120, b * (1.1 + Math.random() * 0.2), 0.07, 'sine', 0.02); }, i * 95); })(i); }
  else if (zi === 2) { S.evT = 2 + Math.random() * 3.5; tone(1900, 1100, 0.07, 'sine', 0.035); setTimeout(function () { tone(1700, 1000, 0.09, 'sine', 0.014); }, 220); }
  else { S.evT = 6 + Math.random() * 8; if (zi >= 3 && Math.random() < 0.5) { noise(1.8, 260, 70, 'lowpass', 0.12, 0.6); } }
}
function tone(f, f2, d, type, v) {
  if (muted) return;
  try {
    if (!audioInit()) return;
    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    g.gain.setValueAtTime(v || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(sfxGain || master); o.start(t); o.stop(t + d + 0.02);
  } catch (e) { /* audio not available */ }
}
var SFX = {
  jump: function () { noise(0.14, 900, 2200, 'bandpass', 0.05, 1.2); tone(220, 330, 0.08, 'sine', 0.025); },
  throw_: function () { noise(0.16, 3200, 700, 'bandpass', 0.09, 1.6); },
  hit: function () { noise(0.12, 1400, 200, 'lowpass', 0.16, 0.8); tone(150, 55, 0.12, 'triangle', 0.07); },
  kill: function () { noise(0.28, 1800, 120, 'lowpass', 0.18, 0.7); tone(120, 40, 0.3, 'triangle', 0.08); },
  pick: function () { noise(0.07, 2600, 1200, 'bandpass', 0.07, 2); setTimeout(function () { noise(0.07, 2200, 900, 'bandpass', 0.06, 2); }, 90); tone(520, 780, 0.12, 'sine', 0.035); },
  hurt: function () { noise(0.22, 900, 120, 'lowpass', 0.2, 0.6); tone(170, 55, 0.3, 'sawtooth', 0.06); },
  step: function (z) {
    if (z === 0) noise(0.09, 1100, 350, 'lowpass', 0.05, 0.6);
    else if (z === 1) noise(0.08, 2400, 1100, 'bandpass', 0.045, 1.2);
    else if (z === 2) { noise(0.05, 3000, 900, 'highpass', 0.04, 0.8); tone(210, 140, 0.04, 'sine', 0.02); }
    else tone(150, 85, 0.07, 'triangle', 0.045);
  },
  land: function (z) { noise(0.14, 700, 150, 'lowpass', 0.11, 0.7); if (z >= 3) tone(110, 60, 0.1, 'triangle', 0.05); },
  thunder: function () { noise(2.4, 420, 60, 'lowpass', 0.32, 0.5); },
  voice: function (type, vol) {
    if (type === 'snake') noise(0.5, 6500, 3200, 'highpass', 0.11 * vol, 0.7);
    else if (type === 'crab') { tone(1800, 1500, 0.025, 'square', 0.03 * vol); setTimeout(function () { tone(1800, 1500, 0.025, 'square', 0.03 * vol); }, 70); }
    else if (type === 'boar') { tone(95, 70, 0.28, 'sawtooth', 0.07 * vol); noise(0.28, 500, 200, 'lowpass', 0.08 * vol, 0.8); }
    else if (type === 'bat') { tone(3600, 2200, 0.09, 'sine', 0.035 * vol); setTimeout(function () { tone(3300, 2500, 0.07, 'sine', 0.03 * vol); }, 110); }
    else if (type === 'panther') { tone(140, 85, 0.6, 'sawtooth', 0.075 * vol); noise(0.6, 700, 180, 'lowpass', 0.07 * vol, 0.8); }
    else { tone(75, 48, 0.9, 'sawtooth', 0.11 * vol); noise(0.9, 500, 110, 'lowpass', 0.12 * vol, 0.7); }
  },
  heart: function () { tone(62, 48, 0.12, 'sine', 0.12); setTimeout(function () { tone(58, 45, 0.1, 'sine', 0.09); }, 150); },
  sun: function () {
    [784, 1046, 1318, 1568].forEach(function (f, i) { setTimeout(function () { tone(f, f * 1.01, 0.32, 'sine', 0.045); }, i * 80); });
  },
  drum: function (i) { noise(0.16, 320 + i * 90, 130, 'lowpass', 0.16, 0.9); tone(90 + i * 26, 62 + i * 20, 0.2, 'triangle', 0.06); },
  door: function () { noise(0.9, 300, 90, 'lowpass', 0.2, 0.7); tone(70, 42, 0.9, 'triangle', 0.07); },
  rock: function () { noise(0.22, 1400, 180, 'lowpass', 0.17, 0.8); tone(140, 60, 0.16, 'triangle', 0.06); },
  checkpoint: function () {
    [659, 880, 1318].forEach(function (f, i) { setTimeout(function () { tone(f, f * 1.01, 0.26, 'sine', 0.05); }, i * 95); });
    noise(0.34, 2400, 700, 'bandpass', 0.05, 1.3);
  },
  win: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, f * 1.01, 0.3, 'triangle', 0.07); }, i * 140); }); },
  lose: function () { tone(260, 60, 0.7, 'sawtooth', 0.08); }
};

// ---------------------------------------------------------------- music
// A short looping theme for each place: a chord bed, a bass line, a tune and a
// little percussion, all synthesised live on the same graph as the sound effects.
// Nothing is downloaded, so the whole game stays one file.
var MUSIC = [
  { // 1. The Beach - bright and easy, steel-drum melody over a lazy strum
    bpm: 100, lvl: 1.6, inst: 'pluck', melV: 0.062, padV: 0.017, bassV: 0.07,
    chords: [[50, 57, 62], [45, 52, 57], [47, 54, 59], [43, 50, 55]],
    bass: [[0, 0, 4], [6, 0, 2], [8, 7, 4], [14, 0, 2]],
    mel: [
      [[0, 69, 3], [3, 74, 2], [6, 76, 3], [10, 74, 2], [12, 69, 4]],
      [[0, 73, 3], [4, 76, 2], [7, 81, 4], [12, 76, 3]],
      [[0, 71, 3], [3, 74, 2], [6, 78, 3], [10, 74, 2], [12, 71, 4]],
      [[0, 74, 4], [6, 71, 3], [10, 67, 6]]
    ],
    shaker: [2, 6, 10, 14], shakerV: 0.028
  },
  { // 2. The Jungle - driving, syncopated marimba with hand drums
    bpm: 116, lvl: 1.5, inst: 'pluck', melV: 0.058, padV: 0.012, bassV: 0.075,
    chords: [[45, 52, 57], [45, 52, 57], [41, 48, 53], [43, 50, 55]],
    bass: [[0, 0, 3], [3, 0, 2], [8, 0, 3], [11, 7, 2], [14, 0, 2]],
    mel: [
      [[0, 69, 2], [2, 72, 2], [4, 74, 2], [7, 76, 3], [11, 74, 2], [14, 72, 2]],
      [[0, 69, 2], [3, 76, 2], [6, 79, 4], [11, 76, 2], [13, 74, 3]],
      [[0, 77, 2], [2, 74, 2], [5, 72, 3], [9, 74, 2], [12, 72, 2], [14, 69, 2]],
      [[0, 69, 4], [5, 72, 3], [9, 74, 2], [12, 67, 4]]
    ],
    kick: [0, 3, 8, 11], tom: [5, 13], shaker: [2, 4, 6, 10, 12, 14]
  },
  { // 3. The Crystal Cave - slow bell arpeggios in a wide, empty space
    bpm: 66, lvl: 2.1, inst: 'bell', melV: 0.052, padV: 0.032, bassV: 0.06,
    chords: [[50, 57, 62], [46, 53, 58], [43, 50, 55], [45, 52, 57]],
    bass: [[0, 0, 16]],
    mel: [
      [[0, 74, 6], [8, 77, 6]],
      [[2, 70, 6], [10, 74, 4]],
      [[0, 67, 8], [8, 70, 6]],
      [[2, 69, 10]]
    ],
    kick: [0], kickV: 0.055
  },
  { // 4. The Old Bridge - sparse, billowy, nothing quite resolving
    bpm: 84, lvl: 2.4, inst: 'pluck', melV: 0.05, padV: 0.022, bassV: 0.065,
    chords: [[40, 47, 52], [36, 43, 48], [43, 50, 55], [38, 45, 50]],
    bass: [[0, 0, 4], [8, 0, 4]],
    mel: [
      [[0, 71, 3], [6, 74, 3], [12, 76, 4]],
      [[2, 79, 4], [10, 74, 4]],
      [[0, 72, 3], [4, 71, 3], [8, 67, 6]],
      [[0, 69, 8]]
    ],
    kick: [0, 8], kickV: 0.05
  },
  { // 5. The Lighthouse - full, bright, marching to the top of the tower
    bpm: 126, lvl: 1.9, inst: 'bell', melV: 0.058, padV: 0.024, bassV: 0.075,
    chords: [[48, 55, 60], [43, 50, 55], [45, 52, 57], [41, 48, 53]],
    bass: [[0, 0, 2], [4, 0, 2], [8, 0, 2], [12, 7, 2]],
    mel: [
      [[0, 72, 3], [4, 76, 3], [8, 79, 4], [12, 76, 2]],
      [[0, 74, 3], [4, 79, 2], [7, 83, 5], [12, 79, 2]],
      [[0, 81, 3], [4, 84, 3], [8, 81, 4], [12, 76, 3]],
      [[0, 79, 6], [8, 72, 6]]
    ],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14]
  }
];
var mus = { bus: null, ch: null, zone: -1, want: -1, step: 0, nextT: 0, timer: null, active: false };
function initMusic() {
  if (mus.bus || !ac) return;
  mus.bus = ac.createGain(); mus.bus.gain.value = 0; mus.bus.connect(musicGain || master);
}
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
// One note. pluck = wooden/hollow, bell = long ringing, bass = round low, pad = wide chord.
function voice(when, midi, dur, inst, vol) {
  if (!ac || !mus.ch) return;
  var f = mtof(midi);
  try {
    var g = ac.createGain(), o, o2, flt, gg;
    if (inst === 'pad') {
      flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 820; flt.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(vol, when + Math.min(0.55, dur * 0.4));
      g.gain.setTargetAtTime(0.0001, when + dur * 0.8, 0.42);
      o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = -8;
      o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f; o2.detune.value = 8;
      o.connect(flt); o2.connect(flt); flt.connect(g); g.connect(mus.ch);
      o.start(when); o2.start(when); o.stop(when + dur + 1.6); o2.stop(when + dur + 1.6);
      return;
    }
    if (inst === 'bell') {
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0006, when + Math.max(0.45, dur * 1.5));
      o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
      gg = ac.createGain(); gg.gain.value = 0.26;
      o.connect(g); o2.connect(gg); gg.connect(g); g.connect(mus.ch);
      o.start(when); o2.start(when); o.stop(when + Math.max(0.5, dur * 1.6)); o2.stop(when + Math.max(0.5, dur * 1.6));
      return;
    }
    if (inst === 'bass') {
      flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 520;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.02);
      g.gain.setTargetAtTime(0.0001, when + Math.max(0.12, dur * 0.6), 0.14);
      o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      o.connect(flt); flt.connect(g); g.connect(mus.ch);
      o.start(when); o.stop(when + dur + 0.5);
      return;
    }
    flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 2700;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0007, when + Math.max(0.14, dur * 1.1));
    o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    gg = ac.createGain(); gg.gain.value = 0.2;
    o.connect(flt); o2.connect(gg); gg.connect(flt); flt.connect(g); g.connect(mus.ch);
    o.start(when); o2.start(when); o.stop(when + dur + 0.6); o2.stop(when + dur + 0.6);
  } catch (e) { /* audio not available */ }
}
// One drum hit, scheduled ahead of time.
function mhit(when, kind, vol) {
  if (!ac || !mus.ch || !noiseBuf) return;
  try {
    if (kind === 'kick') {
      var ko = ac.createOscillator(), kg = ac.createGain();
      ko.type = 'sine';
      ko.frequency.setValueAtTime(150, when); ko.frequency.exponentialRampToValueAtTime(46, when + 0.12);
      kg.gain.setValueAtTime(vol, when); kg.gain.exponentialRampToValueAtTime(0.001, when + 0.24);
      ko.connect(kg); kg.connect(mus.ch); ko.start(when); ko.stop(when + 0.26);
      return;
    }
    var dur = 0.16, type = 'bandpass', freq = 1900, q = 0.9;
    if (kind === 'hat') { dur = 0.05; type = 'highpass'; freq = 7200; q = 0.5; }
    else if (kind === 'shaker') { dur = 0.08; type = 'highpass'; freq = 5200; q = 0.7; }
    else if (kind === 'tom') { dur = 0.2; type = 'lowpass'; freq = 330; q = 1.1; }
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f); f.connect(g); g.connect(mus.ch);
    src.start(when, Math.random()); src.stop(when + dur + 0.02);
  } catch (e) { /* audio not available */ }
}
// Lay down one 16th-note column of the current theme.
function musicStep(t, stepIdx, when) {
  var bar = Math.floor(stepIdx / 16) % t.mel.length, s = stepIdx % 16;
  var ch = t.chords[bar % t.chords.length], root = ch[0] - 12, sd = 15 / t.bpm, g = t.lvl || 1;
  if (s === 0) for (var i = 0; i < ch.length; i++) voice(when + i * 0.02, ch[i], 16 * sd, 'pad', t.padV * g);
  for (var b = 0; b < t.bass.length; b++) { var bp = t.bass[b]; if (bp[0] === s) voice(when, root + bp[1], (bp[2] || 3) * sd, 'bass', t.bassV * g); }
  var m = t.mel[bar] || [];
  for (var k = 0; k < m.length; k++) { var n = m[k]; if (n[0] === s) voice(when, n[1], n[2] * sd, t.inst, t.melV * g); }
  if (t.kick && t.kick.indexOf(s) >= 0) mhit(when, 'kick', (t.kickV || 0.12) * g);
  if (t.snare && t.snare.indexOf(s) >= 0) mhit(when, 'snare', (t.snareV || 0.05) * g);
  if (t.hat && t.hat.indexOf(s) >= 0) mhit(when, 'hat', (t.hatV || 0.022) * g);
  if (t.shaker && t.shaker.indexOf(s) >= 0) mhit(when, 'shaker', (t.shakerV || 0.03) * g);
  if (t.tom && t.tom.indexOf(s) >= 0) mhit(when, 'tom', (t.tomV || 0.06) * g);
}
function musStart(zone) {
  var t = MUSIC[zone];
  if (!t || !mus.bus) return;
  mus.zone = zone; mus.step = 0;
  if (mus.nextT < ac.currentTime + 0.04) mus.nextT = ac.currentTime + 0.06;
  var g = ac.createGain(); g.gain.value = 0.0001; g.connect(mus.bus);
  g.gain.setTargetAtTime(1, ac.currentTime, 0.5);
  if (mus.ch) {
    var old = mus.ch;
    old.gain.setTargetAtTime(0.0001, ac.currentTime, 0.3);
    setTimeout(function () { try { old.disconnect(); } catch (e) { } }, 3000);
  }
  mus.ch = g;
}
// Look-ahead scheduler: keeps a quarter second of the loop queued up.
function musicTick() {
  if (!ac || !mus.bus) return;
  if (!mus.active) { mus.nextT = ac.currentTime + 0.05; return; }
  if (mus.nextT < ac.currentTime - 0.5) mus.nextT = ac.currentTime + 0.05;
  var guard = 0;
  while (mus.nextT < ac.currentTime + 0.3 && guard++ < 48) {
    if (mus.want !== mus.zone && mus.step % 16 === 0) musStart(mus.want);
    var t = MUSIC[mus.zone];
    if (!t) break;
    musicStep(t, mus.step, mus.nextT);
    mus.nextT += 15 / t.bpm;
    mus.step++;
  }
}
// Called every frame: decides whether music should be heard and which place it belongs to.
function musicUpdate() {
  if (!ac || !master) return;
  initMusic();
  if (!mus.bus) return;
  var m = S.mode, lvl = 0;
  if (m === 'play' || m === 'winning') lvl = 0.8;
  else if (m === 'paused') lvl = 0.28;
  var live = lvl > 0 && !muted;
  mus.bus.gain.setTargetAtTime(muted ? 0 : lvl, ac.currentTime, 0.3);
  if (live) {
    mus.want = zoneIndex(S.p.x);
    if (mus.zone < 0) musStart(mus.want);
    mus.active = true;
    if (!mus.timer) mus.timer = setInterval(musicTick, 40);
  } else {
    mus.active = false;
    if (mus.zone >= 0 && (m === 'title' || m === 'dead' || m === 'won')) { mus.zone = -1; mus.step = 0; }
  }
}


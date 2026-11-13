(function () {
// Bump this whenever an art file changes so browsers and the CDN refetch it.
var ASSET_V = '7';
'use strict';

// ---------------------------------------------------------------- constants
var H = 360, GROUND = 296, WORLD = 7000;
var GRAV = 1700, RUN = 215, JUMP = 640;
var ARENA_L = 6070, ARENA_R = 6640, BOSS_TRIGGER = 6140, GATE_X = 5380, BEACON_X = 6800;

var cv = document.getElementById('cv');
var ctx = cv.getContext('2d');
var dk = document.createElement('canvas');
var dctx = dk.getContext('2d');
var VW = 640, SC = 1;
var gfxLite = false, gfxAcc = 0, gfxN = 0;

function $(id) { return document.getElementById(id); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sm(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function rnd(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function sign(v) { return v < 0 ? -1 : 1; }

// ---------------------------------------------------------------- level data
var PITS = [{ x: 1750, w: 100 }, { x: 2250, w: 115 }, { x: 2900, w: 125 }, { x: 3300, w: 105 }, { x: 4200, w: 110 }, { x: 4800, w: 120 }];
var CHASM = { x: 5400, w: 360 };
var PLATS = [
  { x: 1500, w: 120, y: 236 }, { x: 2060, w: 110, y: 228 }, { x: 2480, w: 90, y: 252 }, { x: 2600, w: 150, y: 204 },
  { x: 3100, w: 120, y: 236 }, { x: 3900, w: 120, y: 236 }, { x: 4420, w: 110, y: 222 }, { x: 5000, w: 100, y: 240 }
];
// Five sunstones, one tucked into each stretch of the island. Each is behind
// something: a tide, a carved drum puzzle, a cracked seam, a high ledge, a wall.
var SECRETS = [
  { id: 'tide', name: 'the tide pocket', x: 902, y: GROUND - 30 },
  { id: 'drums', name: 'the drum rock', x: 2366, y: GROUND - 30 },
  { id: 'seam', name: 'the cracked seam', x: 4362, y: GROUND - 30 },
  { id: 'ledge', name: 'the high ledge', x: 5048, y: 214 },
  { id: 'cache', name: "the keeper's cache", x: 5902, y: GROUND - 30 }
];
var DRUM_X = [2326, 2364, 2402], SEAM_X = 4340, CACHE_X = 5876, LOG_X = 1650, LOG_OUT = 2520;
var SUN_KEY = 'lh_suns_v1';
var CHECKPOINTS = [
  { x: 60, name: 'The Beach' },
  { x: 1420, name: 'The Jungle' },
  { x: 3640, name: 'The Cave' },
  { x: 5230, name: 'The Old Bridge' },
  { x: 6005, name: 'The Lighthouse' }
];
// One signature obstacle per place:
//   Beach: boulders to climb and tide surges   Jungle: thorn thickets and mud bogs   Cave: rockfalls
//   Old Bridge: gales and rolling boulders      Lighthouse: lightning strikes
var OBST_SPEC = [
  { k: 'rock', x: 360, w: 28, h: 30 }, { k: 'rock', x: 790, w: 34, h: 38 }, { k: 'rock', x: 1230, w: 30, h: 32 },
  { k: 'thorn', x: 1580, w: 44, h: 22 }, { k: 'mud', x: 1965, w: 130 }, { k: 'thorn', x: 2070, w: 46, h: 22 }, { k: 'thorn', x: 2440, w: 44, h: 22 },
  { k: 'mud', x: 2560, w: 160 }, { k: 'thorn', x: 2750, w: 50, h: 22 }, { k: 'thorn', x: 3150, w: 44, h: 22 }, { k: 'mud', x: 3490, w: 140 },
  { k: 'rock', x: 4090, w: 32, h: 34 }, { k: 'rock', x: 4700, w: 34, h: 36 }
];
var TIDES = [{ x: 470, w: 230 }, { x: 900, w: 250 }];
var TIDE_PERIOD = 7;
var FALLZ = [{ x0: 3720, x1: 3960 }, { x0: 4330, x1: 4640 }, { x0: 4930, x1: 5150 }];
function tidePhase() { return S.t % TIDE_PERIOD; }
function tideSurge() { return tidePhase() > 5.2; }
function inTide(x) { for (var i = 0; i < TIDES.length; i++) if (x > TIDES[i].x && x < TIDES[i].x + TIDES[i].w) return true; return false; }
function windLevel() { var ph = S.t % 6; return ph < 4.4 ? 0 : sm((ph - 4.4) / 0.4); }
function windWarn() { var ph = S.t % 6; return ph > 3.5 && ph < 4.4; }
var ZONES_META = [
  { name: 'The Beach', x0: 0, x1: 1400 }, { name: 'The Jungle', x0: 1400, x1: 3600 }, { name: 'The Cave', x0: 3600, x1: 5200 },
  { name: 'The Old Bridge', x0: 5200, x1: 6000 }, { name: 'The Lighthouse', x0: 6000, x1: 7000 }
];
var ENEMY_SPEC = [
  { t: 'crab', x: 650, r: 70 }, { t: 'crab', x: 1000, r: 90 }, { t: 'crab', x: 1250, r: 60 },
  { t: 'snake', x: 1640, r: 50 }, { t: 'boar', x: 1960, r: 40 }, { t: 'snake', x: 2430, r: 70 }, { t: 'boar', x: 2700, r: 40 },
  { t: 'panther', x: 3150, r: 50 }, { t: 'snake', x: 3450, r: 60 },
  { t: 'bat', x: 3850, r: 60, y: 190 }, { t: 'snake', x: 4070, r: 40 }, { t: 'bat', x: 4350, r: 60, y: 200 },
  { t: 'bat', x: 4650, r: 60, y: 205 }, { t: 'snake', x: 4950, r: 30 }, { t: 'bat', x: 5050, r: 40, y: 195 },
  { t: 'bat', x: 5880, r: 40, y: 215 },
  { t: 'boss', x: 6420, r: 0 }
];
var FRUITS = [
  { x: 760, y: 280 }, { x: 1330, y: 280 }, { x: 1560, y: 220 }, { x: 2115, y: 212 }, { x: 2380, y: 280 }, { x: 3160, y: 220 },
  { x: 3500, y: 280 }, { x: 3960, y: 220 }, { x: 4580, y: 280 }, { x: 5050, y: 224 }, { x: 5280, y: 280 }, { x: 6050, y: 280 }
];
var ROPE_POS = { x: 2680, y: 184 };
var LANTERN_POS = { x: 4475, y: 204 };
var POOL = { x: 4030, w: 90 };
var HP = { crab: 1, snake: 1, bat: 1, boar: 2, panther: 3, boss: 10 };
var SIZE = { crab: [30, 16], snake: [36, 16], bat: [26, 16], boar: [48, 28], panther: [56, 28], boss: [90, 46] };
var POINTS = { crab: 50, snake: 100, bat: 100, boar: 200, panther: 400, boss: 2000 };

// ---------------------------------------------------------------- colour themes
function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c, a) { var s = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0); return a === undefined ? 'rgb(' + s + ')' : 'rgba(' + s + ',' + a + ')'; }
// k > 0 lightens towards white, k < 0 darkens towards black. Used for volume shading.
function tint(c, k) { return k >= 0 ? rgb(mixc(c, [255, 255, 255], k)) : rgb(mixc(c, [0, 0, 0], -k)); }
// A soft band of coloured air, laid over the far layers so distance reads as depth.
var grainPat = null;
// A fixed film-grain texture. Laid over the whole frame it stops the painted
// backdrops and the code-drawn props from reading as two different media.
function grainTexture() {
  if (grainPat) return grainPat;
  var s = document.createElement('canvas'); s.width = s.height = 140;
  var g = s.getContext('2d'), img = g.createImageData(140, 140), d = img.data;
  for (var i = 0; i < d.length; i += 4) {
    var v = 108 + Math.random() * 74;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 30;
  }
  g.putImageData(img, 0, 0);
  grainPat = ctx.createPattern(s, 'repeat');
  return grainPat;
}
var softDot = null;
function softDotSprite() {
  if (softDot) return softDot;
  var s = document.createElement('canvas'); s.width = s.height = 64;
  var g = s.getContext('2d'), rg = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(0.6, 'rgba(0,0,0,0.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  softDot = s; return s;
}
function hazeBand(c, y, h, a) {
  var g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgb(c, 0)); g.addColorStop(0.55, rgb(c, a)); g.addColorStop(1, rgb(c, 0));
  ctx.fillStyle = g; ctx.fillRect(0, y, VW, h);
}
var COLOR_KEYS = ['skyT', 'skyB', 'gT', 'gB', 'far', 'tree1', 'tree2'];
var NUM_KEYS = ['sun', 'stars', 'moon', 'sea', 'palm', 'dens', 'grass', 'fire', 'fg'];
function mkTheme(o) { var r = {}; COLOR_KEYS.forEach(function (k) { r[k] = hex(o[k]); }); NUM_KEYS.forEach(function (k) { r[k] = o[k]; }); return r; }
function mixTheme(a, b, t) {
  var r = {};
  COLOR_KEYS.forEach(function (k) { r[k] = mixc(a[k], b[k], t); });
  NUM_KEYS.forEach(function (k) { r[k] = a[k] + (b[k] - a[k]) * t; });
  return r;
}
var THEMES = [
  mkTheme({ skyT: '#5a2a96', skyB: '#ff9a3c', gT: '#ffd98a', gB: '#e0964a', far: '#8a5fc9', tree1: '#0f9d74', tree2: '#0a7557', sun: 1, stars: 0.15, moon: 0, sea: 1, palm: 1, dens: 0.55, grass: 0.15, fire: 0, fg: 0.2 }),
  mkTheme({ skyT: '#0a7a4e', skyB: '#5ce08c', gT: '#3ed470', gB: '#1c7c3e', far: '#1ea262', tree1: '#0f8a45', tree2: '#076b33', sun: 0, stars: 0, moon: 0, sea: 0, palm: 0, dens: 0.95, grass: 1, fire: 1, fg: 1 }),
  mkTheme({ skyT: '#1a0f42', skyB: '#4a2a9c', gT: '#8177d8', gB: '#2c2460', far: '#2b1a6b', tree1: '#1c1240', tree2: '#130b2e', sun: 0, stars: 0, moon: 0, sea: 0, palm: 0, dens: 0, grass: 0, fire: 0.6, fg: 0.6 }),
  mkTheme({ skyT: '#0a1a6b', skyB: '#4a5df0', gT: '#a7b6ff', gB: '#2c3c9a', far: '#2b3ac0', tree1: '#134a7a', tree2: '#0e3560', sun: 0, stars: 1, moon: 1, sea: 0, palm: 1, dens: 0.2, grass: 0.2, fire: 0.2, fg: 0.3 }),
  mkTheme({ skyT: '#08123f', skyB: '#2a4ad8', gT: '#93a6f5', gB: '#26337e', far: '#2032a8', tree1: '#0e3260', tree2: '#0a2448', sun: 0, stars: 1, moon: 1, sea: 1, palm: 1, dens: 0.15, grass: 0.2, fire: 0.1, fg: 0.3 })
];
function zoneIndex(x) { for (var i = 0; i < ZONES_META.length - 1; i++) if (x < ZONES_META[i].x1) return i; return ZONES_META.length - 1; }
function themeAt(x) {
  var i = zoneIndex(x), z = ZONES_META[i], th = THEMES[i];
  if (i < ZONES_META.length - 1 && x > z.x1 - 150) return mixTheme(th, THEMES[i + 1], sm((x - (z.x1 - 150)) / 300));
  if (i > 0 && x < z.x0 + 150) return mixTheme(THEMES[i - 1], th, sm((x - (z.x0 - 150)) / 300));
  return th;
}
function caveAmt(x) { return sm((x - 3560) / 160) * (1 - sm((x - 5160) / 160)); }

// ---------------------------------------------------------------- state
var S, keys = { left: false, right: false, jump: false, throw_: false };
var padAx = 0, stickAx = 0;   // gamepad stick and on-screen stick, -1..1
var jumpEdge = false, attackEdge = false, useEdge = false, touchMode = false, muted = false, best = 0;
// personal bests live on the device; the board itself is served by the backend function
var LB_URL = 'https://superagent-ed4394ba.base44.app/functions/beaconBoard';
var bestTime = 0, playerName = '', lbRows = null, winState = null;
try {
  best = parseInt(localStorage.getItem('lighthouse-hunter-best') || '0', 10) || 0;
  bestTime = parseFloat(localStorage.getItem('lighthouse-hunter-best-time') || '0') || 0;
  playerName = localStorage.getItem('lighthouse-hunter-name') || '';
} catch (e) { best = 0; bestTime = 0; playerName = ''; }
function fmtT(t) { t = Math.max(0, Math.round(t)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
function escH(s) { return String(s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }
function boardHTML(mark) {
  if (!lbRows) return '<p class="none">Loading the board...</p>';
  if (!lbRows.length) return '<p class="none">No runs posted yet. Be the first to light the beacon.</p>';
  var h = '<div class="board"><div class="row head"><span>#</span><span>Hunter</span><span>Time</span></div>';
  for (var i = 0; i < lbRows.length && i < 8; i++) {
    var r = lbRows[i], mine = mark && r.name === mark.name && Math.abs(r.time - mark.time) <= 1;
    h += '<div class="row' + (mine ? ' me' : '') + '"><span>' + (i + 1) + '</span><span>' + escH(r.name) + '</span><b>' + fmtT(r.time) + '</b></div>';
  }
  return h + '</div>';
}
function lbPaint() {
  var bt = $('board-title'); if (bt) bt.innerHTML = boardHTML(null);
  var bw = $('boardwrap'); if (bw) bw.hidden = !lbRows || !lbRows.length;
  var yb = $('yourbest');
  if (yb) yb.textContent = bestTime ? 'Your best run: ' + fmtT(bestTime) + (best ? '  ·  best score ' + best : '') : '';
}
function lbGet(cb) {
  try {
    fetch(LB_URL, { method: 'GET', cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) lbRows = d.fastest || []; lbPaint(); if (cb) cb(); })
      .catch(function () { lbRows = lbRows || []; if (cb) cb(); });
  } catch (e) { if (cb) cb(); }
}
function lbPost(name, cb) {
  try {
    fetch(LB_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, time: Math.round(S.time), score: S.score, kills: S.kills }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) { lbRows = d.fastest || []; } if (cb) cb(d); })
      .catch(function () { if (cb) cb(null); });
  } catch (e) { if (cb) cb(null); }
}

function newState() {
  return {
    mode: 'title', time: 0, cam: 0, shake: 0, t: 0,
    p: { x: 60, y: GROUND, vx: 0, vy: 0, face: 1, onGround: true, coy: 0, jbuf: 0, hp: 5, inv: 0, kb: 0, throwCd: 0, throwT: 0, stab: 0, anim: 0, rope: false, ropeUsed: false, lantern: false, lanternUsed: false, food: 100, starveT: 0, sq: 0, stepN: 0, ph: 0, bleedT: 0, heartT: 0 },
    enemies: [], spears: [], parts: [], items: [], floaters: [],
    score: 0, kills: 0, cp: 60, cpI: 0, cpT: 3, suns: 0, open: {}, drumsHit: [false, false, false], drumT: 0, seamHp: 2, cacheHp: 3, blink: 0, logUsed: false, regenT: 0, hungerAsk: 0, lastSafe: 60, safeTimer: 0, bridgeGrow: false, bridgeT: 0, tie: null,
    tutGate: tutStored(), ate: false, bossAwake: false, bossDead: false, poolUsed: false, winT: 0, toasted: {}, toastT: 0, flash: 0, freeze: 0, bolt: 0, boltT: 8, evT: 3, obst: [], falls: [], fz: [], boulders: [], bolts: [], bcd: 1.5, boltCd: 2.2
  };
}

function spawnWorld() {
  S.enemies = ENEMY_SPEC.map(function (s, i) {
    var sz = SIZE[s.t];
    return {
      type: s.t, x: s.x, y: s.t === 'bat' ? s.y : GROUND, homeY: s.y || GROUND, home: s.x, range: s.r, dir: i % 2 ? 1 : -1,
      hp: HP[s.t] + diffNow().hp, maxhp: HP[s.t] + diffNow().hp, w: sz[0], h: sz[1], vx: 0, vy: 0, state: s.t === 'boss' ? 'sleep' : 'patrol', st: 0, t: i * 1.7,
      hurt: 0, dying: 0, cool: 0, air: false
    };
  });
  S.obst = OBST_SPEC.map(function (o) { return { k: o.k, x: o.x, w: o.w, h: o.h || 0 }; });
  S.fz = FALLZ.map(function () { return { cd: 1.0 }; });
  S.items = [];
  FRUITS.forEach(function (f) { S.items.push({ type: 'fruit', x: f.x, y: f.y, got: false }); });
  S.items.push({ type: 'rope', x: ROPE_POS.x, y: ROPE_POS.y, got: false });
  S.items.push({ type: 'lantern', x: LANTERN_POS.x, y: LANTERN_POS.y, got: false });
  SECRETS.forEach(function (sc) { S.items.push({ type: 'sun', sid: sc.id, x: sc.x, y: sc.y, got: false }); });
}

function solidAt(x) {
  for (var i = 0; i < PITS.length; i++) if (x > PITS[i].x && x < PITS[i].x + PITS[i].w) return false;
  if (x > CHASM.x && x < CHASM.x + CHASM.w) return x < CHASM.x + CHASM.w * S.bridgeT;
  return true;
}

function barriers() {
  var p = S.p;
  return [
    { x: GATE_X, side: 'L', on: !S.bridgeGrow, kind: 'gate' },
    { x: ARENA_L, side: 'R', on: S.bossAwake && !S.bossDead, kind: 'vine' },
    { x: ARENA_R, side: 'L', on: !S.bossDead, kind: 'vine' }
  ];
}

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

// ---------------------------------------------------------------- HUD and messages
var hudCache = '', trackSig = '';
var heartsEl = $('hearts');
for (var hi = 0; hi < 5; hi++) {
  var hd = document.createElement('span');
  hd.className = 'heart on';
  hd.innerHTML = '<svg viewBox="0 0 24 22"><path d="M12 21C4 14 1 10 1 6.5 1 3.4 3.4 1 6.4 1c2.3 0 4.5 1.3 5.6 3.4C13.100 2.300 15.300 1 17.600 1 20.600 1 23 3.400 23 6.500 23 10 20 14 12 21Z"/></svg>';
  heartsEl.appendChild(hd);
}
// The objective tracker: five stages of the run, the next one always named and
// pointed at, the ones behind you ticked off.
function nearestFruit(p) {
  var best = 1e9, bx = -1;
  S.items.forEach(function (it) {
    if (it.got || it.type !== 'fruit') return;
    var d = Math.abs(it.x - p.x);
    if (d < best) { best = d; bx = it.x; }
  });
  return bx;
}
function distanceHint(p, x) {
  if (x < 0) return '';
  var d = Math.abs(x - p.x);
  if (d < 140) return 'close by';
  return Math.round(d / 20) + ' m ' + (x > p.x ? 'ahead' : 'behind you');
}
function trackState() {
  var p = S.p, atLh = p.x > 5980;
  var out = [
    { k: 'food', label: 'Find food', done: S.ate, hint: 'Mangoes hang over the path', at: nearestFruit(p) },
    { k: 'rope', label: p.rope ? 'Tie the rope across the bridge' : 'Locate the rope', done: p.ropeUsed, hint: p.rope ? 'The rotten bridge in the gorge' : 'In the jungle, past the thorns', at: p.rope ? GATE_X : ROPE_POS.x },
    { k: 'cave', label: 'Explore the cave', done: p.x > 3620 || p.lantern, hint: 'East, where the trees give way to rock', at: 3660 },
    { k: 'lantern', label: 'Find the lantern', done: p.lantern || p.lanternUsed, hint: 'On a ledge deep in the cave', at: LANTERN_POS.x },
    { k: 'lh', label: (atLh || p.lanternUsed) ? 'Light the beacon' : 'Reach the lighthouse', done: p.lanternUsed,
      hint: p.lanternUsed ? 'The island is lit' : (S.bossDead ? 'Climb to the lamp, then press Use' : (atLh ? 'The Storm Panther guards the stair' : 'East along the headland')), at: BEACON_X }
  ];
  for (var b = out.length - 2; b >= 0; b--) if (out[b + 1].done) out[b].done = true;   // progress is sequential
  for (var i = 0; i < out.length; i++) {
    if (out[i].done) continue;
    var d = distanceHint(p, out[i].at);
    if (d) out[i].hint += '  ' + d;
    break;
  }
  return out;
}
function renderTrack(ts) {
  var rows = $('tlist').children, done = 0, nowI = -1, i;
  for (i = 0; i < ts.length; i++) if (ts[i].done) done++;
  for (i = 0; i < rows.length && i < ts.length; i++) {
    if (!ts[i].done && nowI < 0) nowI = i;
    rows[i].className = ts[i].done ? 'done' : (i === nowI ? 'now' : '');
    rows[i].children[1].textContent = ts[i].label;
  }
  $('tcount').textContent = done + '/' + ts.length;
  $('thint').textContent = nowI >= 0 ? ts[nowI].hint : 'Every objective done. Light it up.';
  $('track').hidden = S.mode === 'title' || TUT.on;
}
function updateHud() {
  var p = S.p;
  var zi = zoneIndex(p.x);
  var ts = trackState(), sig = '', ti;
  for (ti = 0; ti < ts.length; ti++) sig += ts[ti].label + (ts[ti].done ? '1' : '0') + ts[ti].hint;
  sig += '|' + S.mode + '|' + TUT.on;
  if (sig !== trackSig) { trackSig = sig; renderTrack(ts); }
  var key = [p.hp, Math.round(p.food / 2), p.rope, p.ropeUsed, p.lantern, p.lanternUsed, S.score, zi, S.bossDead, S.bridgeGrow, S.mode, Math.floor(S.time)].join('|');
  if (key === hudCache) return;
  hudCache = key;
  for (var i = 0; i < 5; i++) heartsEl.children[i].classList.toggle('on', i < p.hp);
  heartsEl.setAttribute('aria-label', 'Health ' + p.hp + ' of 5');
  $('score').textContent = S.score;
  $('clock').textContent = S.mode === 'title' ? '' : fmtT(S.time);
  $('foodfill').style.width = Math.max(0, Math.round(p.food)) + '%';
  $('food').classList.toggle('low', p.food < 25);
  $('slot-rope').classList.toggle('have', p.rope);
  $('slot-rope').classList.toggle('done', p.ropeUsed);
  $('sunnum').textContent = S.suns + '/5';
  $('slot-sun').classList.toggle('have', S.suns > 0);
  $('slot-lantern').classList.toggle('have', p.lantern);
  $('slot-lantern').classList.toggle('done', p.lanternUsed);
  $('zone').textContent = (zi + 1) + '/5 ' + ZONES_META[zi].name;
  var rt = $('route').children;
  for (var ri = 0; ri < 5; ri++) { rt[ri].className = ri < zi ? 'seen' : (ri === zi ? 'now' : ''); }
}
var toastEl = $('toast');
function toast(msg, ms) { if (TUT.on) return; toastEl.textContent = msg; toastEl.classList.add('show'); S.toastT = (ms || 3200) / 1000; }
function toastOnce(key, msg, ms) { if (!S.toasted[key]) { S.toasted[key] = true; toast(msg, ms); } }
function toastRate(key, msg) { if (!S.toasted[key] || S.t - S.toasted[key] > 4) { S.toasted[key] = S.t; toast(msg, 2800); } }

// ---------------------------------------------------------------- effects
function burst(x, y, n, col, spd, life) {
  if (REDUCE) n = Math.ceil(n / 4);
  for (var i = 0; i < n && S.parts.length < 320; i++) {
    var a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * spd;
    S.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.3, life: life * (0.5 + Math.random() * 0.7), max: life, col: col, r: 1.5 + Math.random() * 2.5 });
  }
}
function floater(x, y, text, col) { S.floaters.push({ x: x, y: y, text: text, col: col || '#fff', t: 0 }); }

// ---------------------------------------------------------------- tutorial
// A short guided start, once per browser: walk, jump, collect, hunger, fight,
// then shove a jammed gate open with Use. The run clock waits until it is done.
var TUT_KEY = 'lh_tut_v1', TUT_GATE_X = 430;
function tutStored() { try { return localStorage.getItem(TUT_KEY) === '1'; } catch (e) { return false; } }
function tutStore() { try { localStorage.setItem(TUT_KEY, '1'); } catch (e) { /* private mode */ } }
var TUT_STEPS = [
  { id: 'move', title: 'Walk', text: 'Hold right, or slide the stick, to walk along the shore.' },
  { id: 'grab', title: 'Collect', text: 'Walk into the mango to pick it up.' },
  { id: 'food', title: 'Hunger', text: 'That bar up top is hunger. It drains as you run. Above 60 it mends a heart every few seconds, below 25 you stop healing and slow down, and at 0 it eats your health. Fruit fills it.', ok: true },
  { id: 'jump', title: 'Jump', text: 'Press Space or tap Jump to leap. The boulder ahead has to be cleared.' },
  { id: 'fight', title: 'Fight', text: 'Press X or tap Attack to throw your spear. Land on a crab to stomp it.' },
  { id: 'use', title: 'Use', text: 'The driftwood gate is jammed. Stand by it, then press E or tap Use to shove it open.' }
];
var TUT = { on: false, step: 0, t: 0, x0: 60, jumped: false, got: false, atk: false, force: false };
function tutStart() {
  TUT.on = true; TUT.step = 0; TUT.t = 0; TUT.x0 = S.p.x;
  TUT.jumped = false; TUT.got = false; TUT.atk = false;
  S.tutGate = false;
  S.p.food = Math.min(S.p.food, 62);   // you set out hungry, so the lesson lands
  tutShow();
}
function tutShow() {
  var st = TUT_STEPS[TUT.step];
  if (!st) return tutEnd();
  TUT.t = 0;
  if (st.id === 'move') TUT.x0 = S.p.x;
  if (st.id === 'jump') TUT.jumped = false;
  if (st.id === 'fight') TUT.atk = false;
  st.pressed = false;
  $('tut').hidden = false;
  $('tutk').textContent = 'Lesson ' + (TUT.step + 1) + ' of ' + TUT_STEPS.length;
  $('tutT').textContent = st.title;
  $('tutX').textContent = st.text;
  $('tutok').hidden = !st.ok;
  if (st.id === 'grab') {
    var fx = clamp(S.p.x + 95, 150, TUT_GATE_X - 100);
    S.items.push({ type: 'fruit', x: fx, y: 280, got: false, tut: true });
  }
  SFX.pick();
}
function tutNext() { TUT.step += 1; if (TUT.step >= TUT_STEPS.length) tutEnd(); else tutShow(); }
function tutEnd() {
  TUT.on = false;
  S.tutGate = true;
  tutStore();
  $('tut').hidden = true;
  var b = $('tutagain'); if (b) b.hidden = false;
  SFX.pick();
  toast('The way is open. Head east, into the jungle.', 3400);
}
function tutTick(dt) {
  if (!TUT.on) return;
  TUT.t += dt;
  var st = TUT_STEPS[TUT.step]; if (!st) return;
  var p = S.p, ok = false;
  if (st.id === 'move') ok = Math.abs(p.x - TUT.x0) > 55;
  else if (st.id === 'jump') ok = TUT.jumped;
  else if (st.id === 'grab') ok = TUT.got;
  else if (st.id === 'food') ok = TUT.t > 10 || st.pressed;
  else if (st.id === 'fight') ok = TUT.atk;
  else if (st.id === 'use') ok = S.tutGate;
  if (ok) tutNext();
}

// ---------------------------------------------------------------- game flow
function startGame() {
  var keepBest = best;
  audioInit();
  enterFull();
  S = newState();
  best = keepBest;
  spawnWorld();
  S.mode = 'play';
  $('ov').hidden = true;
  hungerCard(false);
  hudCache = '';
  if (!tutStored() || TUT.force) { TUT.force = false; tutStart(); }
  else toast(touchMode ? 'Slide the stick to walk. Tap Attack to fight. Land on enemies to stomp them.' : 'Run right. Press X or click to attack. Land on enemies to stomp them.', 5000);
}

function cpName() { return CHECKPOINTS[clamp(S.cpI | 0, 0, CHECKPOINTS.length - 1)].name; }
// Reaching a stage lights its cairn and makes it the place you resume from.
function cpReached(i) {
  S.cpT = 0;
  S.score += 30;
  SFX.checkpoint();
  floater(S.p.x, GROUND - 98, 'Checkpoint', '#ffd68a');
  toast('Checkpoint: ' + CHECKPOINTS[i].name + '. Fall after this and you resume here.', 2800);
}
function respawnAt(x) {
  var p = S.p;
  p.x = x; p.y = GROUND; p.vx = 0; p.vy = 0; p.inv = 1.6; p.kb = 0; p.onGround = true;
  S.falls = []; S.boulders = []; S.bolts = [];
}

function showOverlay(html) { var ov = $('ov'); ov.classList.remove('hero'); ov.innerHTML = '<div class="card">' + html + '</div>'; ov.hidden = false; }

function die() {
  S.mode = 'dead';
  SFX.lose();
  var cp = cpName();
  showOverlay('<p class="kicker">Out of strength</p><h2>The island wins this round</h2>' +
    '<p class="lede">You keep everything you found. ' +
    (S.cpI > 0 ? 'You pick up again at ' + cp + '.' : 'You pick up again at the shore.') + '</p>' +
    '<button class="primary" id="retry" type="button">Continue from ' + cp + '</button>' +
    '<button class="tiny" id="restart" type="button">Start over from the beach</button>');
  $('retry').addEventListener('click', retry);
  $('restart').addEventListener('click', function () { TUT.force = false; startGame(); });
  $('retry').focus();
}
function retry() {
  var p = S.p;
  p.hp = 5;
  respawnAt(Math.min(S.cp + 46, WORLD - 40));
  S.lastSafe = S.cp;
  S.bossAwake = false;
  S.enemies.forEach(function (e) {
    if (e.type === 'boss' && !e.dying) { e.hp = e.maxhp; e.x = 6420; e.y = GROUND; e.state = 'sleep'; e.vx = 0; e.vy = 0; }
    if (e.type !== 'boss' && !e.dying && e.type !== 'bat') { e.vx = 0; e.state = 'patrol'; }
  });
  p.food = Math.max(p.food, 55);
  S.mode = 'play';
  $('ov').hidden = true;
  toast('Back at ' + cpName() + '. Keep hunting.', 2200);
}

function win() {
  S.mode = 'winning';
  S.winT = 0;
  SFX.win();
}
function finishWin() {
  var p = S.p;
  var bonus = Math.max(0, Math.round(3000 - S.time * 10)) + p.hp * 200;
  S.score += bonus;
  var isBest = S.score > best;
  if (isBest) { best = S.score; try { localStorage.setItem('lighthouse-hunter-best', String(best)); } catch (e) { /* storage unavailable */ } }
  var run = Math.round(S.time), prev = bestTime;
  var faster = !prev || run < prev;
  if (faster) { bestTime = run; try { localStorage.setItem('lighthouse-hunter-best-time', String(run)); } catch (e) { /* storage unavailable */ } }
  S.mode = 'won';
  winState = { run: run, prev: prev, faster: faster, posted: false, rank: 0, err: false, posting: false };
  drawWin();
  lbGet(drawWin);
}

function endingFor(n) {
  if (n >= 5) return {
    kicker: 'Keeper of the light',
    title: 'You gave the island its light back',
    text: 'All five sunstones burn in the lamp. The storm breaks, the sea goes flat, and a ship far out on the horizon turns its bow toward the harbour. You are not a castaway any more. You are the keeper, and the light will burn for the next one.'
  };
  if (n >= 3) return {
    kicker: 'Rescued',
    title: 'The beacon is lit',
    text: 'A boat sees the light and turns toward the island. You leave with ' + n + ' sunstones in your pack: a good haul. Somewhere out there the island is still holding the rest of them in the dark.'
  };
  return {
    kicker: 'Rescued',
    title: 'The beacon is lit',
    text: 'A boat sees the light and turns toward the island. You escaped with little more than your spear. The island keeps its secrets: five sunstones are hidden out there, if you ever come back for them.'
  };
}
function gemRow(n, total) {
  var h = '<div class="gems" aria-label="' + n + ' of ' + total + ' sunstones">';
  for (var i = 0; i < total; i++) h += '<i' + (i < n ? ' class="on"' : '') + '></i>';
  return h + '</div>';
}
function drawWin() {
  var w = winState, en = endingFor(S.suns), seen = sunTotal();
  var html = '<p class="kicker">' + en.kicker + '</p><h2>' + en.title + '</h2>' +
    '<p class="lede">' + en.text + '</p>' +
    '<div class="gemsrow"><span>Sunstones this run</span>' + gemRow(S.suns, 5) + '</div>' +
    (seen >= 5 ? '<p class="record">Every sunstone on the island has passed through your hands.</p>' : (seen ? '<p class="note">Sunstones found across your runs: ' + seen + ' of 5.</p>' : '')) +
    '<div class="stats">' +
      '<div class="stat"><span>Score</span><b>' + S.score + '</b></div>' +
      '<div class="stat"><span>Time</span><b>' + fmtT(w.run) + '</b></div>' +
      '<div class="stat"><span>Best time</span><b>' + (bestTime ? fmtT(bestTime) : '--') + '</b></div>' +
      '<div class="stat"><span>Hunted</span><b>' + S.kills + '</b></div>' +
      '<div class="stat"><span>Sunstones</span><b>' + S.suns + '/5</b></div>' +
      '<div class="stat"><span>Best score</span><b>' + best + '</b></div>' +
    '</div>' +
    (w.faster && w.prev ? '<p class="record">New record: ' + fmtT(w.prev - w.run) + ' faster than your best.</p>'
      : (w.faster ? '<p class="record">First recorded time.</p>' : '')) +
    '<div class="boardwrap"><p class="kicker">Fastest runs</p>' + boardHTML(w.posted ? { name: playerName, time: w.run } : null) + '</div>' +
    (w.posted
      ? '<p class="note">' + (w.rank ? 'You are #' + w.rank + ' on the board.' : 'Your time is posted.') + '</p>'
      : '<div class="namebar"><input id="pname" maxlength="14" placeholder="Your name" value="' + escH(playerName) + '" aria-label="Name for the leaderboard"><button class="primary" id="post" type="button">' + (w.posting ? 'Posting...' : 'Post my time') + '</button></div>' +
        (w.err ? '<p class="note">The board is unreachable right now. Your time is still saved on this device.</p>' : '')) +
    '<button class="primary" id="again" type="button">Hunt again</button>' +
    '<button class="tiny" id="winagain" type="button">Replay the basics</button>';
  showOverlay(html);
  $('again').addEventListener('click', startGame);
  $('winagain').addEventListener('click', function () { TUT.force = true; startGame(); });
  if ($('post')) $('post').addEventListener('click', function () {
    var v = $('pname').value.replace(/\s+/g, ' ').trim().slice(0, 14) || 'Hunter';
    playerName = v;
    try { localStorage.setItem('lighthouse-hunter-name', v); } catch (e) { /* storage unavailable */ }
    winState.posting = true; drawWin();
    lbPost(v, function (d) {
      winState.posting = false;
      if (d && d.ok) { winState.posted = true; winState.rank = d.rank || 0; winState.err = false; }
      else { winState.err = true; }
      drawWin();
    });
  });
  ($('post') || $('again')).focus();
}

function hurtPlayer(dir) {
  var p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  S.freeze = Math.max(S.freeze, 0.07);
  var dmg = Math.max(1, Math.round(diffNow().dmg));
  p.hp -= dmg; p.inv = 1.3; buzz(28); p.vy = -280; p.vx = dir * 250; p.kb = 0.22; p.onGround = false;
  S.shake = 0.25;
  burst(p.x, p.y - 26, 8, '#ee5a43', 150, 0.5);
  SFX.hurt();
  if (p.hp <= 0) die();
}

function killEnemy(e) {
  e.dying = 0.0001; S.freeze = Math.max(S.freeze, e.type === 'boss' ? 0.18 : 0.08);
  S.kills += 1;
  S.score += POINTS[e.type];
  floater(e.x, e.y - e.h - 6, '+' + POINTS[e.type], '#ffd66b');
  burst(e.x, e.y - e.h / 2, e.type === 'boss' ? 40 : 14, e.type === 'boss' ? '#b9a7ff' : '#ffd0a0', 200, 0.7);
  SFX.kill();
  if (e.type === 'boss') {
    S.bossDead = true; S.shake = 0.7;
    S.items.push({ type: 'fruit', x: e.x, y: GROUND - 16, got: false });
    toast('The Storm Panther falls. The way to the lighthouse is open.', 4200);
  }
}
function hitEnemy(e, dmg, dirx) {
  e.hp -= dmg; e.hurt = 0.16; S.freeze = Math.max(S.freeze, 0.05);
  if (e.type !== 'boss') e.x += dirx * 7;
  burst(e.x, e.y - e.h / 2, 7, '#ff9a6b', 130, 0.4);
  SFX.hit();
  if (e.hp <= 0) killEnemy(e);
}

// The rope: stand at the broken bridge and use it to tie the bridge across the gap.
function nearGate() {
  var p = S.p;
  return !S.bridgeGrow && !S.tie && p.onGround && p.x > GATE_X - 130 && p.x < GATE_X + 8;
}
function nearTower() {
  var p = S.p;
  return S.bossDead && S.mode === 'play' && p.onGround && p.x > BEACON_X - 130 && p.x < BEACON_X + 50;
}
function interact() {
  var p = S.p;
  if (S.mode !== 'play') return;
  if (!S.tutGate && Math.abs(p.x - TUT_GATE_X) < 90) {
    S.tutGate = true;
    S.score += 50;
    SFX.throw_();
    floater(TUT_GATE_X, GROUND - 74, 'Gate open', '#ffd66b');
    burst(TUT_GATE_X, GROUND - 28, 14, '#d9b878', 110, 0.65);
    return;
  }
  if (nearTower()) {
    if (p.lantern) {
      p.lantern = false; p.lanternUsed = true; S.score += 300;
      toast('You carry the lantern up into the lamp...', 2600);
      SFX.throw_();
      win();
    } else toastRate('nolamp', 'The lamp needs a flame. You need the lantern from the cave.');
    return;
  }
  if (!S.logUsed && Math.abs(p.x - LOG_X) < 70) {
    S.logUsed = true;
    S.score += 150;
    S.blink = 1;
    SFX.throw_();
    setTimeout(function () { respawnAt(LOG_OUT); S.blink = 0.85; toast('You crawl through the hollow log and come out downwind, past the thorns.', 3200); }, 260);
    return;
  }
  if (!nearGate()) return;
  if (p.rope) {
    p.rope = false; p.ropeUsed = true; S.tie = { t: 0 }; S.score += 200;
    floater(p.x, p.y - 62, 'Rope tied!', '#ffd66b');
    toast('You throw the rope across and pull it tight.', 2600);
    SFX.throw_();
  } else {
    toastRate('gate', 'You need a rope to cross. Find one in the jungle.');
  }
}

// One attack button: stab whatever is right in front of you, otherwise throw the spear.
function attack() {
  buzz(10);
  TUT.atk = true;
  var p = S.p;
  if (p.throwCd > 0) return;
  for (var i = 0; i < S.enemies.length; i++) {
    var e = S.enemies[i];
    if (e.dying) continue;
    var ahead = (e.x - p.x) * p.face;
    var ec = e.y - e.h / 2;
    if (ahead > -14 && ahead < 40 + e.w / 2 && Math.abs(ec - (p.y - 30)) < 30 + e.h / 2) {
      p.throwCd = 0.28; p.stab = 0.18; p.throwT = 0;
      hitEnemy(e, 1, p.face);
      S.shake = Math.max(S.shake, 0.06);
      return;
    }
  }
  throwSpear();
}
function throwSpear() {
  var p = S.p;
  if (p.throwCd > 0 || S.spears.length >= 4) return;
  p.throwCd = 0.38; p.throwT = 0.2;
  S.spears.push({ x: p.x + p.face * 14, y: p.y - 28, vx: p.face * 560, vy: -40, mode: 'fly', t: 0, ang: 0 });
  SFX.throw_();
}

// ---------------------------------------------------------------- update
function updatePlayer(dt) {
  var p = S.p;
  var ax = padAx || stickAx || ((keys.right ? 1 : 0) - (keys.left ? 1 : 0));
  if (S.tie) { ax = 0; jumpEdge = false; p.inv = Math.max(p.inv, 0.4); }
  // hunger: you tire when hungry and weaken when starving (never to death by hunger alone)
  p.food = Math.max(0, p.food - dt * diffNow().hunger);
  // a full belly does the healing work: fruit above 60 mends a heart every 13s
  if (p.food > 60 && p.hp < 5 && S.mode === 'play') {
    S.regenT += dt;
    if (S.regenT > 13) {
      S.regenT = 0; p.hp++;
      floater(p.x, p.y - 74, '+1 heart', '#9be58f');
      burst(p.x, p.y - 30, 6, '#9be58f', 60, 0.5);
      SFX.pick();
    }
  } else S.regenT = 0;
  var tired = p.food <= 0 ? 0.8 : (p.food < 25 ? 0.9 : 1);
  if (p.food < 60) toastOnce('hungry60', 'Hunger is dropping. Above 60 it slowly mends your hearts.', 3600);
  if (p.food < 25) toastOnce('hungry', 'Hungry: you heal no more and your legs are heavy. Eat fruit from the trees.', 3800);
  if (p.food <= 0) { toastOnce('starving', 'You are starving. You move slower. Find fruit.', 3600); p.starveT += dt; if (p.starveT > 9 && p.hp > 1) { p.starveT = 0; p.hp -= 1; S.shake = 0.15; SFX.hurt(); floater(p.x, p.y - 60, 'starving', '#ffb4a4'); } } else p.starveT = 0;
  if (p.kb > 0) { p.kb -= dt; p.vx *= 0.92; } else {
    var tgt = ax * RUN * tired * (p.hp <= 1 ? 0.92 : 1);
    var rate = (ax ? 1750 : 2500) * dt;
    var dv = tgt - p.vx;
    if (Math.abs(dv) <= rate) p.vx = tgt; else p.vx += dv > 0 ? rate : -rate;
    if (ax) {
      // hard turn at speed: boot heels skid a little
      if (tgt * p.vx < 0 && Math.abs(p.vx) > 110 && p.onGround) burst(p.x + p.face * 4, p.y, 1, DUST[zoneIndex(p.x)], 95, 0.3);
      p.face = ax < 0 ? -1 : 1;
    }
  }
  if (jumpEdge) { p.jbuf = 0.12; jumpEdge = false; buzz(8); }
  p.jbuf -= dt;
  p.coy -= dt;
  if (p.onGround) p.coy = 0.1;
  if (p.jbuf > 0 && p.coy > 0) { p.vy = -JUMP * (p.food <= 0 ? 0.93 : 1) * (inMudNow(p) ? 0.9 : 1); p.jbuf = 0; p.coy = 0; p.onGround = false; p.sq = -0.22; TUT.jumped = true; SFX.jump(); burst(p.x, p.y, 5, DUST[zoneIndex(p.x)], 70, 0.35); }
  // mud drags, tide surges push you back, gales shove you
  var inMud = false;
  if (p.onGround) for (var mi = 0; mi < S.obst.length; mi++) { var mo = S.obst[mi]; if (mo.k === 'mud' && Math.abs(p.x - mo.x) < mo.w / 2) inMud = true; }
  if (inMud && p.kb <= 0) { p.vx *= 0.45; if (Math.abs(p.vx) > 5 && Math.random() < 0.25) burst(p.x, p.y, 1, '#4a3320', 50, 0.35); }
  if (p.y > GROUND - 30 && inTide(p.x) && tideSurge() && p.kb <= 0) {
    p.vx = -200 + ax * RUN * 0.15;
    if (S.tideHit !== Math.floor(S.t / TIDE_PERIOD)) { S.tideHit = Math.floor(S.t / TIDE_PERIOD); floater(p.x, p.y - 62, 'Wave!', '#8fd8ff'); p.food = Math.max(0, p.food - 3); SFX.land(0); burst(p.x, p.y - 8, 10, '#bfe6ff', 120, 0.5); }
  }
  if (S.bridgeGrow && p.x > 5200 && p.x < 6050 && p.kb <= 0) { var wl = windLevel(); if (wl > 0) p.vx -= 150 * wl; }
  p.vy += GRAV * dt * ((!keys.jump && p.vy < 0) ? 2.2 : 1);
  if (p.vy > 900) p.vy = 900;

  var nx = p.x + p.vx * dt;
  var bs = barriers();
  for (var i = 0; i < bs.length; i++) {
    var b = bs[i];
    if (!b.on) continue;
    if (b.side === 'L' && p.x <= b.x && nx > b.x - 10) { nx = b.x - 10; if (b.kind === 'gate' && ax > 0) toastRate('gate', p.rope ? (touchMode ? 'Tap Use' : 'Press E') + ' to tie your rope across the gap.' : 'The planks are rotten. You need a rope to cross.'); }
    if (b.side === 'R' && p.x >= b.x && nx < b.x + 10) nx = b.x + 10;
  }
  // solid boulders: climb over them
  for (var ro = 0; ro < S.obst.length; ro++) {
    var rk = S.obst[ro]; if (rk.k !== 'rock') continue;
    var rl = rk.x - rk.w / 2 - 8, rr = rk.x + rk.w / 2 + 8;
    if (p.y > GROUND - rk.h + 3) {
      if (p.x <= rl && nx > rl) nx = rl;
      if (p.x >= rr && nx < rr) nx = rr;
    }
  }
  p.x = clamp(nx, 20, WORLD - 40);
  if (!S.tutGate && p.x > TUT_GATE_X - 18) p.x = TUT_GATE_X - 18;

  var prev = p.y;
  p.y += p.vy * dt;
  var was = p.onGround;
  p.onGround = false;
  if (p.vy >= 0) {
    if (prev <= GROUND + 1 && p.y >= GROUND && (solidAt(p.x - 7) || solidAt(p.x + 7))) { p.y = GROUND; p.vy = 0; p.onGround = true; }
    else {
      for (var ro2 = 0; ro2 < S.obst.length && !p.onGround; ro2++) {
        var rk2 = S.obst[ro2]; if (rk2.k !== 'rock') continue;
        var top = GROUND - rk2.h;
        if (prev <= top + 2 && p.y >= top && p.x + 8 > rk2.x - rk2.w / 2 && p.x - 8 < rk2.x + rk2.w / 2) { p.y = top; p.vy = 0; p.onGround = true; }
      }
      for (var k = 0; k < PLATS.length && !p.onGround; k++) {
        var pl = PLATS[k];
        if (prev <= pl.y + 2 && p.y >= pl.y && p.x + 9 > pl.x && p.x - 9 < pl.x + pl.w) { p.y = pl.y; p.vy = 0; p.onGround = true; break; }
      }
    }
  }
  if (p.onGround && !was && p.vy === 0) { burst(p.x, p.y, 7, DUST[zoneIndex(p.x)], 80, 0.35); p.sq = 0.28; SFX.land(zoneIndex(p.x)); }
  p.sq += (0 - p.sq) * Math.min(1, dt * 12);
  // footsteps with dust
  if (Math.abs(p.vx) > 10 && p.onGround) {
    var sn = Math.floor(p.ph / Math.PI);
    if (sn !== p.stepN) { p.stepN = sn; SFX.step(zoneIndex(p.x)); burst(p.x - p.face * 3, p.y, 2, DUST[zoneIndex(p.x)], 42, 0.3); }
  }
  // wounded: blood drips and a heartbeat
  if (p.hp <= 2) { p.bleedT -= dt; if (p.bleedT <= 0) { p.bleedT = 0.9; S.parts.push({ x: p.x + p.face * 4, y: p.y - 30, vx: 0, vy: 20, life: 0.5, max: 0.5, r: 1.6, col: '#a52a22' }); } }
  if (p.hp <= 1) { p.heartT -= dt; if (p.heartT <= 0) { p.heartT = 0.95; SFX.heart(); } }
  if (p.inv > 0) p.inv -= dt;
  if (p.throwCd > 0) p.throwCd -= dt;
  if (p.throwT > 0) p.throwT -= dt;
  if (p.stab > 0) p.stab -= dt;
  if (keys.throw_ || attackEdge) { attackEdge = false; attack(); }
  if (useEdge) { useEdge = false; interact(); }
  if (Math.abs(p.vx) > 10 && p.onGround) {
    var sp = Math.min(1.2, Math.abs(p.vx) / RUN);
    p.anim += dt;
    p.ph = (p.ph + dt * Math.PI * 2 * (0.55 + 1.05 * sp));
  }

  // fell into a pit or chasm
  if (p.y > H + 70) {
    p.hp -= 1; S.shake = 0.3; SFX.hurt();
    if (p.hp <= 0) { die(); return; }
    respawnAt(S.lastSafe);
    toast('You fell. Mind the gaps.', 2000);
  }

  // checkpoints and safe ground
  for (var c = 0; c < CHECKPOINTS.length; c++) {
    if (p.x >= CHECKPOINTS[c].x + 18 && CHECKPOINTS[c].x > S.cp) { S.cp = CHECKPOINTS[c].x; S.cpI = c; cpReached(c); }
  }
  if (S.cpT < 3) S.cpT = Math.min(3, S.cpT + dt);
  S.safeTimer -= dt;
  if (p.onGround && S.safeTimer <= 0 && p.y === GROUND && solidAt(p.x - 90) && solidAt(p.x + 90) && p.x >= S.cp) { S.lastSafe = p.x; S.safeTimer = 0.25; }

  // throwing the rope across the gap, then the planks lay out along it
  if (S.tie) {
    S.tie.t += dt;
    if (!S.bridgeGrow && S.tie.t >= 0.55) { S.bridgeGrow = true; SFX.pick(); toast('The rope is tied. The planks lay out. Cross!', 3000); }
    if (S.tie.t >= 1.0) S.tie = null;
  }
  if (S.bridgeGrow && S.bridgeT < 1) S.bridgeT = Math.min(1, S.bridgeT + dt / 1.0);

  // story toasts
  if (p.x < 1400) toastOnce('beach', 'The Beach. Your ship is wrecked. Head east, into the jungle.', 3400);
  if (p.x > 1420) toastOnce('jungle', 'The jungle. Fruit restores health. Snakes and boars bite.', 3600);
  if (p.x > 3620) toastOnce('cave', 'The cave is dark. Something glows deeper in.', 3400);
  if (p.x > 5230 && !S.bridgeGrow && !p.ropeUsed) {
    if (p.rope) toastOnce('bridge2', 'The bridge is broken. Walk up to the post, then ' + (touchMode ? 'tap Use' : 'press E') + ' to tie your rope across.', 4800);
    else toastOnce('bridge', 'The old bridge. The planks are rotten. You need a rope.', 3400);
  }
  if (p.x > 6010 && p.x <= BOSS_TRIGGER) toastOnce('lh', 'The Lighthouse. The beacon is at the top.', 3000);
  if (p.x > BOSS_TRIGGER && !S.bossAwake && !S.bossDead) { S.bossAwake = true; toast('The Storm Panther guards the lighthouse!', 3400); S.shake = 0.4; }

  // approaching the lighthouse door
  if (S.bossDead && p.x > BEACON_X - 130 && S.mode === 'play') {
    if (p.lantern) toastOnce('lamp', (touchMode ? 'Tap Use' : 'Press E') + ' to carry your lantern up into the lamp and light the beacon.', 4600);
    else toastRate('nolamp', 'The lamp needs a flame. You need the lantern from the cave.');
  }
}

function patrol(e, sp, dt) {
  e.x += e.dir * sp * dt;
  if (e.x > e.home + e.range) e.dir = -1;
  else if (e.x < e.home - e.range) e.dir = 1;
  if (!solidAt(e.x + e.dir * (e.w / 2 + 8))) e.dir = -e.dir;
}
function canStep(e, d) { return solidAt(e.x + d * (e.w / 2 + 10)); }

function updateEnemy(e, dt) {
  var p = S.p;
  e.t += dt;
  if (e.hurt > 0) e.hurt -= dt;
  if (e.cool > 0) e.cool -= dt;
  if (e.dying) { e.dying += dt; return; }
  var dx = p.x - e.x, adx = Math.abs(dx);
  var near = adx < 340 && Math.abs(p.y - e.y) < 90;

  if (e.type === 'crab') patrol(e, 40, dt);
  else if (e.type === 'snake') patrol(e, 52, dt);
  else if (e.type === 'boar') {
    e.st -= dt;
    if (e.state === 'patrol') {
      patrol(e, 50, dt);
      if (adx < 300 && Math.abs(p.y - e.y) < 50 && e.cool <= 0) { e.state = 'wind'; e.st = 0.45; e.dir = sign(dx); }
    } else if (e.state === 'wind') { if (e.st <= 0) { e.state = 'charge'; e.st = 0.9; } }
    else if (e.state === 'charge') {
      if (canStep(e, e.dir)) e.x += e.dir * 270 * dt; else e.st = 0;
      if (e.st <= 0) { e.state = 'rest'; e.st = 0.7; }
    } else if (e.state === 'rest') { if (e.st <= 0) { e.state = 'patrol'; e.cool = 1.2; } }
  } else if (e.type === 'bat') {
    var homeBob = e.homeY + Math.sin(e.t * 3) * 14;
    var wantY = homeBob;
    if (adx < 330) { e.x += sign(dx) * 80 * dt; wantY = clamp(p.y - 28, 150, GROUND - 26); }
    else if (Math.abs(e.x - e.home) > e.range) e.x += sign(e.home - e.x) * 50 * dt;
    e.y += (wantY - e.y) * Math.min(1, dt * 2.2);
    e.dir = sign(dx);
  } else if (e.type === 'panther' || e.type === 'boss') {
    var boss = e.type === 'boss';
    var rage = boss && e.hp <= e.maxhp / 2;
    e.st -= dt;
    if (boss && e.state === 'sleep') { if (S.bossAwake) { e.state = 'stalk'; e.st = 1.0; } return; }
    if (e.state === 'patrol') {
      patrol(e, 50, dt);
      if (near && adx < 380 && e.cool <= 0) { e.state = 'crouch'; e.st = 0.45; e.dir = sign(dx); }
    } else if (e.state === 'stalk') {
      e.dir = sign(dx);
      if (adx > 150) e.x += e.dir * (rage ? 110 : 80) * dt;
      if (e.st <= 0) { e.state = 'crouch'; e.st = rage ? 0.38 : 0.55; }
    } else if (e.state === 'crouch') {
      e.dir = sign(dx);
      if (e.st <= 0) {
        var vy = boss ? 500 : 400, T = 2 * vy / GRAV;
        e.vy = -vy; e.vx = clamp(dx / T, boss ? -350 : -300, boss ? 350 : 300); e.air = true; e.state = 'leap';
      }
    } else if (e.state === 'leap') {
      e.x += e.vx * dt; e.vy += GRAV * dt; e.y += e.vy * dt;
      if (e.y >= GROUND) {
        e.y = GROUND; e.vy = 0; e.vx = 0; e.air = false; e.state = 'recover'; e.st = boss ? (rage ? 0.5 : 0.8) : 0.8;
        burst(e.x, e.y, 6, '#d8caa0', 90, 0.35); if (boss) S.shake = 0.18;
      }
    } else if (e.state === 'recover') {
      if (e.st <= 0) { if (boss) { e.state = 'stalk'; e.st = rage ? 0.5 : 1.1; } else { e.state = 'patrol'; e.cool = 1.3; } }
    }
    if (boss) e.x = clamp(e.x, ARENA_L + 30, ARENA_R - 30);
  }

  // touching the hunter: land on top of it to stomp it, otherwise it bites
  if (S.mode === 'play') {
    var top = e.y - e.h + 4, bot = e.y - 2;
    if ((e.type === 'crab' || e.type === 'boar') && Math.abs(e.vx || 0) > 2) ctx.rotate(Math.sin(t * 11) * 0.045);
    if (e.type === 'bat') { top = e.y - e.h; bot = e.y; }
    if (Math.abs(p.x - e.x) < e.w / 2 + 6 && p.y - 4 > top && p.y - 50 < bot) {
      if (p.vy > 60 && p.y - p.vy / 60 <= e.y - e.h + 8) {
        p.vy = -470; p.onGround = false; p.inv = Math.max(p.inv, 0.3);
        floater(e.x, e.y - e.h - 18, 'Stomp!', '#ffffff');
        hitEnemy(e, 1, sign(e.x - p.x));
      } else if (p.inv <= 0) hurtPlayer(sign(p.x - e.x));
    }
  }
}

function updateSpears(dt) {
  var keep = [];
  S.spears.forEach(function (s) {
    s.t += dt;
    if (s.mode === 'fly') {
      s.vy += 520 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.ang = Math.atan2(s.vy, s.vx);
      var tx = s.x + Math.cos(s.ang) * 18, ty = s.y + Math.sin(s.ang) * 18;
      var hit = false;
      for (var i = 0; i < S.enemies.length && !hit; i++) {
        var e = S.enemies[i];
        if (e.dying) continue;
        var top = e.y - e.h - 18, bot = e.y + 2;
        if (tx > e.x - e.w / 2 - 3 && tx < e.x + e.w / 2 + 3 && ty > top && ty < bot) { hitEnemy(e, 1, sign(s.vx)); hit = true; }
      }
      if (hit) return;
      if (hitSecret(tx, ty)) { s.mode = 'stuck'; s.t = 0; s.y = Math.min(ty, GROUND - 1); }
      else if (ty >= GROUND - 1 && solidAt(tx)) { s.mode = 'stuck'; s.t = 0; s.y = GROUND - 1; }
      else if (s.t > 1.4 || Math.abs(s.x - S.cam - VW / 2) > VW) return;
      keep.push(s);
    } else {
      if (s.t < 0.8) keep.push(s);
    }
  });
  S.spears = keep;
}

// A thrown spear can ring a drum, crack a wall or split a seam of crystal.
function hitSecret(tx, ty) {
  var i;
  if (!S.open.drums) {
    for (i = 0; i < 3; i++) {
      if (Math.abs(tx - DRUM_X[i]) < 16 && ty > GROUND - 54 && ty < GROUND - 2) {
        S.drumT = 8;
        if (!S.drumsHit[i]) {
          S.drumsHit[i] = true;
          S.score += 25;
          floater(DRUM_X[i], GROUND - 62, 'dum', '#ffd68a');
          burst(DRUM_X[i], GROUND - 40, 8, '#c9a06a', 90, 0.5);
          SFX.drum(i);
          if (S.drumsHit[0] && S.drumsHit[1] && S.drumsHit[2]) {
            S.open.drums = true;
            S.shake = 0.5;
            SFX.door();
            floater(2366, GROUND - 90, 'The rock splits', '#ffd06b');
            toast('All three drums ring together. The drum rock grinds open.', 3600);
          }
        }
        return true;
      }
    }
  }
  if (!S.open.seam && Math.abs(tx - SEAM_X) < 22 && ty > GROUND - 80) {
    S.seamHp -= 1;
    S.shake = 0.28;
    burst(SEAM_X, GROUND - 40, 10, '#8fd8ff', 110, 0.6);
    if (S.seamHp <= 0) {
      S.open.seam = true;
      SFX.door();
      toast('The seam splits and a cold draft comes out. There is a hollow behind it.', 3400);
    } else SFX.rock();
    return true;
  }
  if (!S.open.cache && Math.abs(tx - CACHE_X) < 22 && ty > GROUND - 96) {
    S.cacheHp -= 1;
    S.shake = 0.26;
    burst(CACHE_X, GROUND - 50, 10, '#b9a98c', 100, 0.6);
    if (S.cacheHp <= 0) {
      S.open.cache = true;
      SFX.door();
      toast('The wall gives way. A keeper\u2019s cache: dry rope, a lamp, one sunstone.', 3600);
    } else SFX.rock();
    return true;
  }
  return false;
}

function updateItems() {
  var p = S.p;
  S.items.forEach(function (it) {
    if (it.got) return;
    var dx = p.x - it.x, dy = (p.y - 24) - it.y;
    if (dx * dx + dy * dy < 26 * 26) {
      if (it.type === 'fruit') {
        if (p.hp >= 5 && p.food >= 85) return;
        it.got = true; if (it.tut) TUT.got = true; S.ate = true; p.food = Math.min(100, p.food + 38); var healed = p.hp < 5; if (healed) p.hp += 1; S.score += 25; floater(it.x, it.y - 12, healed ? '+1 health, fed' : 'fed', '#9be58f'); burst(it.x, it.y, 8, '#ffb84a', 90, 0.5); SFX.pick();
      } else if (it.type === 'rope') {
        it.got = true; p.rope = true; S.score += 300; floater(it.x, it.y - 14, 'Rope!', '#ffd66b'); burst(it.x, it.y, 14, '#d9b878', 130, 0.7); SFX.pick(); toast('You found the rope. The old bridge is waiting.', 3400);
      } else if (it.type === 'sun') {
        if (!sunOpen(it.sid)) return;
        it.got = true; S.suns++; S.score += 400; S.open[it.sid] = true;
        sunSave(it.sid);
        floater(it.x, it.y - 18, 'Sunstone', '#ffd06b');
        burst(it.x, it.y, 18, '#ffc94e', 150, 0.8);
        SFX.sun();
        toast('Sunstone ' + S.suns + ' of 5, from ' + sunName(it.sid) + '. ' +
          (S.suns >= 5 ? 'All five. The beacon will burn like a bonfire.' : 'Four more are hidden on this island.'), 3600);
      } else if (it.type === 'lantern') {
        it.got = true; p.lantern = true; S.score += 300; floater(it.x, it.y - 14, 'Lantern!', '#ffd66b'); burst(it.x, it.y, 14, '#ffcf70', 130, 0.7); SFX.pick(); toast('You found the lantern. Light the beacon with it.', 3400);
      }
    }
  });
  if (!S.poolUsed && Math.abs(p.x - (POOL.x + POOL.w / 2)) < POOL.w / 2 && p.y === GROUND && (p.hp < 5 || p.food < 80)) {
    S.poolUsed = true; p.hp = Math.min(5, p.hp + 2); p.food = Math.min(100, p.food + 15); floater(p.x, p.y - 56, '+2 health', '#8fd8ff'); burst(p.x, p.y - 10, 12, '#8fd8ff', 90, 0.6); SFX.pick(); toast('The cool water heals you.', 2200);
  }
}

function sunName(id) { for (var i = 0; i < SECRETS.length; i++) if (SECRETS[i].id === id) return SECRETS[i].name; return 'somewhere'; }
function sunOpen(id) {
  if (id === 'drums') return !!S.open.drums;
  if (id === 'seam') return !!S.open.seam;
  if (id === 'cache') return !!S.open.cache;
  if (id === 'tide') return !tideSurge();
  return true;
}
function sunSave(id) {
  try {
    var a = JSON.parse(localStorage.getItem(SUN_KEY) || '[]');
    if (a.indexOf(id) < 0) { a.push(id); localStorage.setItem(SUN_KEY, JSON.stringify(a)); }
  } catch (e) { /* storage unavailable */ }
}
function sunTotal() {
  try { return (JSON.parse(localStorage.getItem(SUN_KEY) || '[]')).length; } catch (e) { return 0; }
}
function inMudNow(p) { for (var i = 0; i < S.obst.length; i++) if (S.obst[i].k === 'mud' && Math.abs(p.x - S.obst[i].x) < S.obst[i].w / 2) return true; return false; }

// Obstacles: thorns, rockfalls, rolling boulders, lightning
function updateHazards(dt) {
  var p = S.p, i;
  // thorns and the first warnings
  for (i = 0; i < S.obst.length; i++) {
    var o = S.obst[i], d = Math.abs(p.x - o.x);
    if (o.k === 'thorn') {
      if (d < 280) toastOnce('thorn', 'Thorn thickets. Jump over them.', 3000);
      if (p.y > GROUND - 18 && d < o.w / 2 + 3 && p.inv <= 0) { hurtPlayer(sign(p.x - o.x)); floater(p.x, p.y - 60, 'Thorns!', '#ffb4a4'); }
    } else if (o.k === 'mud' && d < 260) toastOnce('mud', 'Mud bogs drag at your feet. Jump to keep your speed... or wade through.', 3600);
    else if (o.k === 'rock' && d < 220 && p.x < o.x) toastOnce('rock', 'A boulder blocks the way. Jump and climb over it.', 3000);
  }
  if (p.x < 1250 && p.x > 380) toastOnce('tide', 'The tide surges in waves. Wait for the water to pull back, then run.', 4200);
  // tide sounds
  var ph = tidePhase();
  if (p.x < 1400 && ph > 4.2 && ph - dt <= 4.2) noise(1.0, 600, 2200, 'lowpass', 0.07, 0.6);
  if (p.x < 1400 && ph > 5.2 && ph - dt <= 5.2) noise(1.6, 1500, 300, 'lowpass', 0.14, 0.7);
  // rockfalls in the cave
  for (i = 0; i < FALLZ.length; i++) {
    var z = FALLZ[i], zs = S.fz[i];
    if (p.x > z.x0 - 120 && p.x < z.x1 + 30) {
      toastOnce('rockfall', 'The ceiling is loose. Dust on the ground means a rock is about to fall.', 4200);
      zs.cd -= dt;
      if (zs.cd <= 0) {
        zs.cd = 1.5 + Math.random() * 0.9;
        var fx = Math.random() < 0.7 ? clamp(p.x + 20 + Math.random() * 110, z.x0, z.x1) : z.x0 + Math.random() * (z.x1 - z.x0);
        S.falls.push({ x: fx, y: 10, vy: 0, t: 0, state: 'warn' });
      }
    }
  }
  S.falls.forEach(function (f) {
    if (f.state === 'warn') {
      f.t += dt;
      if (Math.random() < dt * 14) S.parts.push({ x: f.x + (Math.random() - 0.5) * 14, y: 24, vx: 0, vy: 30, life: 0.5, max: 0.5, r: 1.3, col: '#9aa3aa' });
      if (f.t > 0.75) { f.state = 'fall'; noise(0.25, 900, 300, 'lowpass', 0.1, 0.8); }
    } else if (f.state === 'fall') {
      f.vy += 1900 * dt; f.y += f.vy * dt;
      if (Math.abs(p.x - f.x) < 15 && f.y > p.y - 74 && f.y < p.y + 6 && p.inv <= 0) { hurtPlayer(sign(p.x - f.x)); floater(p.x, p.y - 62, 'Rockfall!', '#ffb4a4'); f.state = 'dead'; burst(f.x, f.y, 10, '#9aa3aa', 160, 0.5); }
      else if (f.y >= GROUND) { f.state = 'dead'; burst(f.x, GROUND, 12, '#8a949c', 170, 0.55); S.shake = Math.max(S.shake, 0.12); SFX.land(2); }
    }
  });
  S.falls = S.falls.filter(function (f) { return f.state !== 'dead'; });
  // gale and rolling boulders on the old bridge
  if (S.bridgeGrow && p.x > 5300 && p.x < 5990) {
    toastOnce('gale', 'A gale blows across the bridge, and boulders roll down it. Jump them.', 4200);
    S.bcd -= dt;
    if (S.bcd <= 0 && S.boulders.length < 3) { S.bcd = 3.4 + Math.random() * 1.6; S.boulders.push({ x: Math.min(6040, p.x + 380), rot: 0 }); noise(0.6, 300, 120, 'lowpass', 0.12, 0.8); }
  }
  var wph = S.t % 6;
  if (S.bridgeGrow && p.x > 5200 && p.x < 6050 && wph > 4.4 && wph - dt <= 4.4) noise(1.4, 500, 1400, 'bandpass', 0.18, 0.5);
  S.boulders.forEach(function (b) {
    b.x -= 150 * dt; b.rot += dt * 9;
    if (p.y > GROUND - 26 && Math.abs(p.x - b.x) < 21 && p.inv <= 0) { hurtPlayer(sign(p.x - b.x)); floater(p.x, p.y - 62, 'Boulder!', '#ffb4a4'); }
    if (Math.random() < dt * 6) burst(b.x, GROUND, 1, '#9a8a6a', 40, 0.3);
  });
  S.boulders = S.boulders.filter(function (b) { return b.x > 5230; });
  // lightning at the lighthouse
  if (p.x > 6030 && p.x < 6800) {
    toastOnce('bolts', 'Lightning strikes where the red rings appear. Move or jump.', 4000);
    S.boltCd -= dt;
    if (S.boltCd <= 0) { S.boltCd = 2.4 + Math.random() * 1.2; S.bolts.push({ x: clamp(p.x + 10 + Math.random() * 120, 6040, 6780), t: 0 }); }
  }
  S.bolts.forEach(function (b) {
    b.t += dt;
    if (b.t >= 0.9 && b.t - dt < 0.9) {
      S.bolt = 0.3; S.shake = Math.max(S.shake, 0.2); SFX.thunder();
      if (Math.abs(p.x - b.x) < 28 && p.y > GROUND - 44) { hurtPlayer(sign(p.x - b.x)); floater(p.x, p.y - 62, 'Struck!', '#ffe08a'); }
    }
  });
  S.bolts = S.bolts.filter(function (b) { return b.t < 1.3; });
}

function voiceTick(e, dt) {
  if (e.dying || !master) return;
  e.vt = (e.vt === undefined ? 1 + Math.random() * 3 : e.vt) - dt;
  var d = Math.abs(e.x - S.p.x);
  if (e.vt > 0 || d > 420) return;
  e.vt = (e.type === 'boss' ? 4 : 3.5) + Math.random() * 3.5;
  if (e.type === 'boss' && !S.bossAwake) return;
  SFX.voice(e.type, clamp(1.15 - d / 420, 0.15, 1));
}
// storm weather near the bridge and lighthouse: rain and lightning with thunder
function stormAmt(x) { return sm((x - 5000) / 700); }
function storm(dt) {
  var a = stormAmt(S.p.x);
  if (S.bolt > 0) S.bolt -= dt;
  if (a < 0.3) return;
  S.boltT -= dt;
  if (S.boltT <= 0) { S.boltT = 9 + Math.random() * 10; S.bolt = 0.35; setTimeout(function () { SFX.thunder(); }, 350 + Math.random() * 500); }
}
function step(dt) {
  S.t += dt;
  if (S.toastT > 0) { S.toastT -= dt; if (S.toastT <= 0) toastEl.classList.remove('show'); }
  if (S.shake > 0) S.shake -= dt;
  if (S.flash > 0) S.flash -= dt;
  S.parts = S.parts.filter(function (q) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; return q.life > 0; });
  S.floaters = S.floaters.filter(function (f) { f.t += dt; f.y -= 24 * dt; return f.t < 1.1; });

  if (S.mode === 'play' && S.freeze > 0) {
    S.freeze -= dt;
  } else if (S.mode === 'play') {
    if (!TUT.on) S.time += dt;   // the clock starts when the lesson is over
    tutTick(dt);
    updatePlayer(dt);
    if (S.mode !== 'play' && S.mode !== 'winning') { return; }
    S.enemies.forEach(function (e) { updateEnemy(e, dt); voiceTick(e, dt); });
    S.enemies = S.enemies.filter(function (e) { return !(e.dying > 0.45); });
    updateSpears(dt);
    if (S.blink > 0) S.blink = Math.max(0, S.blink - dt * 2.4);
    if (S.drumT > 0) { S.drumT -= dt; if (S.drumT <= 0 && !S.open.drums) S.drumsHit = [false, false, false]; }
    updateItems();
    updateHazards(dt);
    ambientEvents(dt);
    storm(dt);
  } else if (S.mode === 'winning') {
    S.winT += dt;
    S.p.vx = 0; S.p.face = 1;
    S.p.x += (BEACON_X - S.p.x) * Math.min(1, dt * 3);
    if (S.winT > 0.8 && S.winT - dt <= 0.8) S.flash = 0.6;
    if (S.winT > 3.2) finishWin();
  }
  // camera: leads the way you run
  var target = clamp(S.p.x - VW * 0.36 + S.p.face * VW * 0.06 + S.p.vx * 0.12, 0, WORLD - VW);
  S.cam += (target - S.cam) * Math.min(1, dt * 6);
  $('b-use').classList.toggle('ready', S.mode === 'play' && ((S.p.rope && nearGate()) || (S.p.lantern && nearTower()) || (!S.tutGate && Math.abs(S.p.x - TUT_GATE_X) < 90) || (!S.logUsed && Math.abs(S.p.x - LOG_X) < 70)));
  updateHud();
}

// ---------------------------------------------------------------- drawing helpers
var cam = 0;
function limb(x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function ell(x, y, rx, ry, col, rot) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fill(); }

function drawPalm(x, base, h, c) {
  var tx = x + h * 0.16, ty = base - h;
  var wb = h * 0.05 + 2, wt = h * 0.028 + 1.1;
  ctx.beginPath();
  ctx.moveTo(x - wb, base + 3);
  ctx.quadraticCurveTo(x + h * 0.03 - wt, base - h * 0.55, tx - wt, ty);
  ctx.lineTo(tx + wt, ty);
  ctx.quadraticCurveTo(x + h * 0.10 + wt, base - h * 0.55, x + wb, base + 3);
  ctx.closePath();
  var tg = ctx.createLinearGradient(x - wb, 0, x + wb, 0);
  tg.addColorStop(0, tint(c, -0.42)); tg.addColorStop(0.5, tint(c, -0.12)); tg.addColorStop(1, tint(c, 0.26));
  ctx.fillStyle = tg; ctx.fill();
  ctx.strokeStyle = tint(c, -0.5); ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
  for (var r = 1; r < 7; r++) {
    var tt = r / 7, rx = x + (tx - x) * tt * tt, ry = base - h * tt, rw = wb * (1 - tt * 0.45);
    ctx.beginPath(); ctx.moveTo(rx - rw, ry); ctx.lineTo(rx + rw, ry); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (var pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? tint(c, 0.2) : tint(c, -0.2);
    for (var k = 0; k < 8; k++) {
      var a = -Math.PI * 0.98 + (k * Math.PI) / 6.4 + (pass ? 0.06 : 0);
      var len = h * (0.42 + 0.07 * Math.sin(k * 2.1));
      var ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + h * 0.08;
      var mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.3 - h * 0.14;
      var wd = h * 0.05 * (pass ? 0.7 : 1);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(mx, my - wd, ex, ey);
      ctx.quadraticCurveTo(mx, my + wd, tx, ty);
      ctx.fill();
    }
  }
}
function drawBroad(x, base, h, c) {
  var tw = h * 0.042, ty = base - h * 0.62;
  var tg = ctx.createLinearGradient(x - tw, 0, x + tw, 0);
  tg.addColorStop(0, tint(c, -0.5)); tg.addColorStop(0.55, tint(c, -0.14)); tg.addColorStop(1, tint(c, 0.22));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(x - tw, base + 3); ctx.quadraticCurveTo(x - tw * 0.7, (base + ty) / 2, x - tw * 0.8, ty);
  ctx.lineTo(x + tw * 0.8, ty); ctx.quadraticCurveTo(x + tw * 0.7, (base + ty) / 2, x + tw, base + 3);
  ctx.closePath(); ctx.fill();
  var cl = [[0, -0.8, 0.31, 0.21], [-0.21, -0.67, 0.22, 0.15], [0.22, -0.69, 0.24, 0.16], [-0.1, -0.92, 0.19, 0.14], [0.13, -0.94, 0.17, 0.13]];
  ctx.fillStyle = tint(c, -0.34);
  for (var i = 0; i < cl.length; i++) ell(x + cl[i][0] * h, base + cl[i][1] * h, cl[i][2] * h, cl[i][3] * h, tint(c, -0.34));
  ctx.fillStyle = tint(c, -0.1);
  for (var j = 0; j < cl.length; j++) ell(x + cl[j][0] * h - h * 0.025, base + cl[j][1] * h - h * 0.03, cl[j][2] * h * 0.76, cl[j][3] * h * 0.72, tint(c, -0.1));
  ctx.fillStyle = tint(c, 0.2);
  for (var k = 0; k < 3; k++) ell(x + cl[k][0] * h - h * 0.05, base + cl[k][1] * h - h * 0.05, cl[k][2] * h * 0.4, cl[k][3] * h * 0.36, tint(c, 0.2));
  ctx.strokeStyle = tint(c, 0.06); ctx.lineWidth = 1.3;
  for (var v = -1; v <= 1; v++) { ctx.beginPath(); ctx.moveTo(x + v * h * 0.17, base - h * 0.62); ctx.quadraticCurveTo(x + v * h * 0.17 + 3, base - h * 0.42, x + v * h * 0.17 - 2, base - h * 0.27 - rnd(v + h) * 10); ctx.stroke(); }
}
function treeLayer(f, tile, hBase, colKey, seed, th) {
  if (th.dens <= 0.01) return;
  var off = cam * f, i0 = Math.floor(off / tile) - 1, i1 = Math.floor((off + VW) / tile) + 1;
  for (var i = i0; i <= i1; i++) {
    if (rnd(i * 7 + seed) > th.dens) continue;
    var sx = i * tile - off + rnd(i + seed) * tile * 0.7;
    var h = hBase * (0.75 + rnd(i * 3 + seed) * 0.6);
    var c = th[colKey];
    if (!gfxLite && f > 0.45) { var sd = softDotSprite(), sr = h * 0.36; ctx.drawImage(sd, sx - sr, GROUND + 4 - sr * 0.24, sr * 2, sr * 0.48); }
    if (th.palm > 0.5) drawPalm(sx, GROUND + 4, h, c); else drawBroad(sx, GROUND + 6, h * 1.25, c);
  }
}

function drawSky(th, cave) {
  var g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, rgb(th.skyT));
  g.addColorStop(0.56, rgb(mixc(th.skyT, th.skyB, 0.62)));
  g.addColorStop(1, rgb(th.skyB));
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, H);
  // soft cloud banks drifting above the horizon
  if (!gfxLite && cave < 0.98 && th.dens < 0.9) {
    var cc = mixc(th.skyB, [255, 255, 255], th.sun > 0.4 ? 0.4 : 0.16);
    var cg2 = ctx.createRadialGradient(0, 0, 0.12, 0, 0, 1);
    cg2.addColorStop(0, rgb(cc, 0.2)); cg2.addColorStop(0.55, rgb(cc, 0.08)); cg2.addColorStop(1, rgb(cc, 0));
    ctx.fillStyle = cg2;
    for (var ci = 0; ci < 4; ci++) {
      var cw = 55 + rnd(ci * 3.7) * 70;
      var cxp = ((ci * 280 + 40 - cam * 0.05 - S.t * 3) % (VW + 320) + VW + 320) % (VW + 320) - 160;
      var cyp = 30 + rnd(ci * 5.1) * 86;
      ctx.save(); ctx.translate(cxp, cyp); ctx.scale(cw, cw * 0.7); ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    }
  }
  if (th.stars > 0.02 && cave < 1) {
    ctx.fillStyle = '#fff';
    for (var i = 0; i < 46; i++) {
      var sx = ((rnd(i) * 900 - cam * 0.03) % 900 + 900) % 900, sy = rnd(i + 99) * 150;
      if (sx > VW) continue;
      ctx.globalAlpha = th.stars * (0.35 + 0.5 * Math.abs(Math.sin(S.t * 1.5 + i)));
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  if (th.moon > 0.02) {
    var mx = VW * 0.2 - cam * 0.01;
    var mg = ctx.createRadialGradient(mx, 56, 10, mx, 56, 46);
    mg.addColorStop(0, 'rgba(238,242,216,' + th.moon * 0.35 + ')'); mg.addColorStop(1, 'rgba(238,242,216,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 50, 6, 100, 100);
    ctx.globalAlpha = th.moon * 0.92; ell(mx, 56, 16, 16, '#eef2d8'); ctx.globalAlpha = 1;
  }
  if (th.sun > 0.02) {
    var sx2 = VW * 0.72 - cam * 0.02;
    var sg = ctx.createRadialGradient(sx2, 190, 4, sx2, 190, 120);
    sg.addColorStop(0, 'rgba(255,224,160,' + th.sun * 0.95 + ')'); sg.addColorStop(1, 'rgba(255,170,100,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 60, VW, 260);
    ell(sx2, 190, 22, 22, 'rgba(255,238,190,' + th.sun + ')');
  }
}
function drawFar(th) {
  var off = cam * 0.12;
  ctx.fillStyle = rgb(th.far);
  ctx.beginPath(); ctx.moveTo(0, GROUND);
  for (var x = 0; x <= VW + 20; x += 20) {
    var wx = x + off;
    ctx.lineTo(x, GROUND - 52 - 26 * Math.sin(wx * 0.006) - 18 * Math.sin(wx * 0.017 + 2) - 8 * Math.sin(wx * 0.041));
  }
  ctx.lineTo(VW + 20, GROUND); ctx.closePath(); ctx.fill();
}
function drawSea(th) {
  if (th.sea < 0.02) return;
  ctx.globalAlpha = th.sea;
  var g = ctx.createLinearGradient(0, 186, 0, GROUND);
  g.addColorStop(0, rgb(mixc(th.skyB, th.skyT, 0.35))); g.addColorStop(1, rgb(mixc(th.skyT, [0, 0, 0], 0.25)));
  ctx.fillStyle = g; ctx.fillRect(0, 196, VW, GROUND - 196);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.4;
  for (var i = 0; i < 9; i++) {
    var y = 206 + i * 9, x = ((i * 91 + S.t * (10 + i * 2) - cam * 0.2) % (VW + 80)) - 40;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 3, x + 28, y); ctx.stroke();
  }
  // the sky lying on the water, and glitter under the sun
  var rg = ctx.createLinearGradient(0, 196, 0, GROUND);
  rg.addColorStop(0, rgb(mixc(th.skyB, [255, 240, 200], 0.45), 0.26));
  rg.addColorStop(1, rgb(mixc(th.skyT, [255, 255, 255], 0.2), 0.04));
  ctx.fillStyle = rg; ctx.fillRect(0, 196, VW, GROUND - 196);
  for (var s2 = 0; s2 < 24; s2++) {
    var gx2 = ((s2 * 137 + S.t * (12 + (s2 % 5) * 6)) % (VW + 60)) - 30;
    var gy2 = 202 + rnd(s2 * 4.1) * (GROUND - 208);
    ctx.globalAlpha = th.sea * (0.1 + 0.22 * Math.abs(Math.sin(S.t * 1.6 + s2)));
    ctx.fillStyle = '#fff'; ctx.fillRect(gx2, gy2, 5 + rnd(s2) * 10, 1.2);
  }
  ctx.globalAlpha = 1;
}
function drawDistantTower(th) {
  var k = 0.55 + (cam / WORLD) * 1.1;
  var x = VW * 0.8 - cam * 0.02;
  ctx.save(); ctx.translate(x, GROUND - 40); ctx.scale(k, k);
  ctx.fillStyle = rgb(mixc(th.far, [0, 0, 0], 0.3));
  ctx.beginPath(); ctx.moveTo(-12, 40); ctx.lineTo(-8, -60); ctx.lineTo(8, -60); ctx.lineTo(12, 40); ctx.closePath(); ctx.fill();
  ctx.fillRect(-11, -68, 22, 8); ctx.fillRect(-6, -80, 12, 12);
  ctx.beginPath(); ctx.moveTo(-8, -80); ctx.lineTo(0, -90); ctx.lineTo(8, -80); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawCaveWall(cave) {
  if (cave < 0.01) return;
  ctx.globalAlpha = cave;
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b1d78'); g.addColorStop(1, '#4b38a8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, H);
  var off = cam * 0.4;
  ctx.fillStyle = '#33248c';
  for (var i = Math.floor(off / 90) - 1; i < (off + VW) / 90 + 1; i++) {
    var sx = i * 90 - off, r = rnd(i * 5 + 3);
    ell(sx + 40, 120 + r * 120, 60 + r * 40, 50 + r * 30, '#3d2c9c');
  }
  ctx.fillStyle = '#241a5e';
  var off2 = cam * 0.7;
  for (var j = Math.floor(off2 / 70) - 1; j < (off2 + VW) / 70 + 1; j++) {
    var x = j * 70 - off2, hh = 26 + rnd(j * 11 + 1) * 70;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0); ctx.lineTo(x + 19, hh); ctx.closePath(); ctx.fill();
  }
  // crystals
  for (var c = 0; c < 10; c++) {
    var cx = ((c * 173 + 40 - cam * 0.55) % (VW + 160) + VW + 160) % (VW + 160) - 40, cy = 90 + rnd(c * 13) * 160;
    var cc2 = (c % 2 ? '255,130,230,' : '110,215,255,');
    var gl = ctx.createRadialGradient(cx + 5, cy - 6, 0.5, cx + 5, cy - 6, 19);
    gl.addColorStop(0, 'rgba(' + cc2 + (0.3 + 0.16 * Math.sin(S.t * 2 + c)) + ')');
    gl.addColorStop(1, 'rgba(' + cc2 + '0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - 15, cy - 26, 40, 40);
    ctx.fillStyle = 'rgba(' + cc2 + (0.5 + 0.3 * Math.sin(S.t * 2 + c)) + ')';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 5, cy - 14); ctx.lineTo(cx + 10, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.22 + 0.16 * Math.sin(S.t * 2 + c)) + ')';
    ctx.beginPath(); ctx.moveTo(cx + 4, cy - 1); ctx.lineTo(cx + 5, cy - 13); ctx.lineTo(cx + 7, cy - 1); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGround(th) {
  var gg = ctx.createLinearGradient(0, GROUND, 0, H);
  gg.addColorStop(0, rgb(th.gB)); gg.addColorStop(1, rgb(mixc(th.gB, [0, 0, 0], 0.65)));
  ctx.fillStyle = gg; ctx.fillRect(0, GROUND, VW, H - GROUND);
  // the surface itself: a photo of real sand, soil, rock or planks, tiled and darkened with depth
  var gtex = groundTexAt(zoneIndex(cam + VW / 2));
  if (gtex) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, GROUND, VW, H - GROUND); ctx.clip();
    var TW = 384, TH = 52, gx = -((cam * 1.0) % TW);
    for (var tx = gx - TW; tx < VW + TW; tx += TW) ctx.drawImage(gtex, tx, GROUND, TW, TH);
    var dg2 = ctx.createLinearGradient(0, GROUND, 0, H);
    dg2.addColorStop(0, 'rgba(0,0,0,0.10)'); dg2.addColorStop(0.5, 'rgba(0,0,0,0.40)'); dg2.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = dg2; ctx.fillRect(0, GROUND, VW, H - GROUND);
    ctx.restore();
  }
  // sediment layers and grit
  ctx.save();
  ctx.beginPath(); ctx.rect(0, GROUND, VW, H - GROUND); ctx.clip();
  for (var li = 1; li <= 3; li++) {
    var ly = GROUND + li * 10 + 3;
    ctx.strokeStyle = li % 2 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.055)';
    ctx.lineWidth = li === 1 ? 2.2 : 1.2;
    ctx.beginPath();
    for (var lx = 0; lx <= VW; lx += 20) {
      var wy = ly + Math.sin((lx + cam) * 0.028 + li) * 1.8 + Math.sin((lx + cam) * 0.011 + li * 2) * 1.2;
      if (lx === 0) ctx.moveTo(lx, wy); else ctx.lineTo(lx, wy);
    }
    ctx.stroke();
  }
  for (var gi = 0; gi < (gfxLite ? 32 : 72); gi++) {
    var qx = (gi * 79 + 13) % VW, qy = GROUND + 6 + ((gi * 41) % Math.max(10, H - GROUND - 8));
    var qr = rnd(gi * 2.3);
    ctx.fillStyle = qr > 0.62 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.11)';
    ctx.fillRect(qx, qy, 1 + qr * 2.6, 1 + qr);
  }
  ctx.restore();
  // pits and chasm
  var holes = PITS.map(function (p) { return { x: p.x, w: p.w }; });
  holes.push({ x: CHASM.x + CHASM.w * S.bridgeT, w: CHASM.w * (1 - S.bridgeT) });
  holes.forEach(function (h) {
    var sx = h.x - cam;
    if (sx > VW + 4 || sx + h.w < -4 || h.w <= 0) return;
    var g = ctx.createLinearGradient(0, GROUND, 0, H);
    g.addColorStop(0, '#05080a'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(sx, GROUND - 2, h.w, H - GROUND + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx - 4, GROUND, 4, H - GROUND); ctx.fillRect(sx + h.w, GROUND, 4, H - GROUND);
  });
  // top strip
  ctx.fillStyle = rgb(th.gT);
  var x0 = Math.floor(cam / 14) * 14;
  ctx.fillRect(0, GROUND, VW, 7);
  ctx.fillStyle = rgb(mixc(th.gT, [255, 255, 255], 0.12));
  ctx.fillRect(0, GROUND, VW, 2);
  for (var x = x0; x < cam + VW + 14; x += 14) {
    var r = rnd(x * 0.31);
    var sx = x - cam;
    if (r < th.grass) {
      ctx.strokeStyle = rgb(mixc(th.gT, [20, 80, 30], 0.35 * r)); ctx.lineWidth = 1.6;
      for (var b = 0; b < 3; b++) { ctx.beginPath(); ctx.moveTo(sx + b * 3, GROUND + 1); ctx.lineTo(sx + b * 3 + (b - 1) * 3, GROUND - 6 - r * 10); ctx.stroke(); }
    } else if (r > 0.85) { ell(sx, GROUND + 12 + r * 6, 3 + r * 4, 2, rgb(mixc(th.gB, [0, 0, 0], 0.3))); }
  }
  // cover the strip over pits
  holes.forEach(function (h) {
    var sx = h.x - cam;
    if (sx > VW || sx + h.w < 0 || h.w <= 0) return;
    ctx.fillStyle = '#05080a'; ctx.fillRect(sx, GROUND - 8, h.w, 18);
  });
}
function drawObstacles(th) {
  var i, ph = tidePhase();
  // tide: wet sand shows where the water reaches; it surges in on a timer
  TIDES.forEach(function (t) {
    var x = t.x - cam; if (x > VW || x + t.w < 0) return;
    var lvl = ph > 5.2 ? (ph < 5.45 ? sm((ph - 5.2) / 0.25) : (ph > 6.5 ? 1 - sm((ph - 6.5) / 0.5) : 1)) : 0;
    ctx.fillStyle = 'rgba(40,70,90,0.18)'; ctx.fillRect(x, GROUND, t.w, 4);
    var h = lvl * 30 + (ph > 4.2 && ph <= 5.2 ? 3 + Math.sin(S.t * 9) * 1.5 : 0);
    if (h > 0.5) {
      var g = ctx.createLinearGradient(0, GROUND - h, 0, GROUND); g.addColorStop(0, 'rgba(120,225,255,0.8)'); g.addColorStop(1, 'rgba(40,120,220,0.65)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, GROUND);
      for (var wx = 0; wx <= t.w; wx += 10) ctx.lineTo(x + wx, GROUND - h + Math.sin(wx * 0.12 + S.t * 6) * 2.5);
      ctx.lineTo(x + t.w, GROUND); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath();
      for (var fx = 0; fx <= t.w; fx += 10) { var fy = GROUND - h + Math.sin(fx * 0.12 + S.t * 6) * 2.5; if (fx === 0) ctx.moveTo(x + fx, fy); else ctx.lineTo(x + fx, fy); } ctx.stroke();
    }
  });
  S.obst.forEach(function (o) {
    var x = o.x - cam; if (x < -90 || x > VW + 90) return;
    if (o.k === 'rock') {
      var w = o.w, h = o.h;
      shadowAt(o.x, GROUND, w * 0.8, 0.35);
      var g = ctx.createLinearGradient(x - w / 2, GROUND - h, x + w / 2, GROUND); g.addColorStop(0, '#a6acb1'); g.addColorStop(1, '#4a5157');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, GROUND + 1);
      ctx.quadraticCurveTo(x - w / 2 - 3, GROUND - h * 0.7, x - w * 0.22, GROUND - h);
      ctx.quadraticCurveTo(x + w * 0.1, GROUND - h - 5, x + w * 0.34, GROUND - h * 0.84);
      ctx.quadraticCurveTo(x + w / 2 + 4, GROUND - h * 0.4, x + w / 2, GROUND + 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w * 0.3, GROUND - h * 0.8); ctx.quadraticCurveTo(x - w * 0.05, GROUND - h * 0.98, x + w * 0.2, GROUND - h * 0.86); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(x - 2, GROUND - h * 0.7); ctx.lineTo(x + 3, GROUND - h * 0.35); ctx.stroke();
    } else if (o.k === 'thorn') {
      var tw = o.w;
      ctx.fillStyle = '#1d3a22'; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, tw / 2, 8, 0, Math.PI, 0); ctx.fill();
      for (var k = 0; k < 9; k++) {
        var tx = x - tw / 2 + 3 + k * ((tw - 6) / 8), th2 = 12 + (k % 3) * 5 + rnd(o.x + k) * 4, lean = (k - 4) * 1.2;
        ctx.fillStyle = k % 2 ? '#2f5a2c' : '#3a6b32'; ctx.beginPath(); ctx.moveTo(tx - 3, GROUND); ctx.lineTo(tx + lean, GROUND - th2); ctx.lineTo(tx + 3, GROUND); ctx.fill();
        ctx.fillStyle = '#c4452f'; ctx.beginPath(); ctx.arc(tx + lean, GROUND - th2, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (o.k === 'mud') {
      var g2 = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 7); g2.addColorStop(0, '#6b4a2b'); g2.addColorStop(1, '#2f1f12');
      ctx.fillStyle = g2; rrect(x - o.w / 2, GROUND - 2, o.w, 9, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(x - o.w / 2 + 6, GROUND - 1, o.w - 12, 1.5);
      for (var b = 0; b < 4; b++) { var bp = (S.t * 0.6 + b * 0.27 + o.x) % 1; ctx.strokeStyle = 'rgba(255,220,170,' + (0.5 * (1 - bp)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - o.w / 2 + 14 + b * (o.w - 28) / 3, GROUND + 2 - bp * 3, 1 + bp * 2, 0, Math.PI * 2); ctx.stroke(); }
    }
  });
}
function drawHazards() {
  var i;
  // ground markers for rocks about to fall
  S.falls.forEach(function (f) {
    var x = f.x - cam;
    if (f.state === 'warn') {
      var a = 0.25 + 0.3 * Math.abs(Math.sin(S.t * 16));
      ctx.save(); ctx.translate(x, GROUND); ctx.scale(1, 0.22);
      ctx.fillStyle = 'rgba(255,90,60,' + a + ')'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(255,200,170,' + (a * 1.2) + ')'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, GROUND - 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#6b737a'; ctx.beginPath(); ctx.moveTo(x - 9 + Math.sin(S.t * 40) * 1, 0); ctx.lineTo(x + 9, 0); ctx.lineTo(x, 24); ctx.fill();
    } else {
      ctx.fillStyle = '#80888f'; ctx.beginPath(); ctx.moveTo(x - 9, f.y - 30); ctx.lineTo(x + 9, f.y - 30); ctx.lineTo(x + 1, f.y + 4); ctx.lineTo(x - 2, f.y + 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x - 5, f.y - 30, 3, 26);
    }
  });
  // rolling boulders
  S.boulders.forEach(function (b) {
    var x = b.x - cam; if (x < -40 || x > VW + 40) return;
    shadowAt(b.x, GROUND, 20, 0.4);
    ctx.save(); ctx.translate(x, GROUND - 16); ctx.rotate(-b.rot);
    var g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 17); g.addColorStop(0, '#b4a78a'); g.addColorStop(1, '#5a5040');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,22,12,0.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-2, 3); ctx.lineTo(6, -5); ctx.moveTo(2, 3); ctx.lineTo(4, 12); ctx.stroke();
    ctx.restore();
  });
  // lightning: red ring warns, then the bolt
  S.bolts.forEach(function (b) {
    var x = b.x - cam;
    if (b.t < 0.9) {
      var a = 0.25 + 0.4 * (b.t / 0.9), pul = 0.6 + 0.4 * Math.abs(Math.sin(S.t * 18));
      ctx.save(); ctx.translate(x, GROUND); ctx.scale(1, 0.24);
      ctx.strokeStyle = 'rgba(255,90,70,' + (a * pul + 0.2) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 28 - 10 * (b.t / 0.9), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,90,70,' + (a * 0.5) + ')'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else {
      var fa = 1 - (b.t - 0.9) / 0.4;
      ctx.strokeStyle = 'rgba(235,240,255,' + fa + ')'; ctx.lineWidth = 3; ctx.shadowColor = '#bcd0ff'; ctx.shadowBlur = 12;
      ctx.beginPath(); var yy = 0, xx = x + 6; ctx.moveTo(xx, yy);
      while (yy < GROUND) { yy += 22 + rnd(b.x + yy) * 14; xx = x + (rnd(b.x * 3 + yy) - 0.5) * 30 * (1 - yy / GROUND); ctx.lineTo(xx, Math.min(yy, GROUND)); }
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,' + fa * 0.5 + ')'; ctx.beginPath(); ctx.arc(x, GROUND - 4, 22 * fa + 6, 0, Math.PI * 2); ctx.fill();
    }
  });
  // wind streaks
  var wl = S.bridgeGrow && S.p.x > 5100 && S.p.x < 6150 ? windLevel() : 0, ww = S.bridgeGrow && S.p.x > 5100 && S.p.x < 6150 && windWarn();
  if (wl > 0.02 || ww) {
    var amt = wl > 0.02 ? wl : 0.25;
    ctx.strokeStyle = 'rgba(220,235,245,' + 0.28 * amt + ')'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (i = 0; i < 26; i++) {
      var sp = 700 + rnd(i) * 500, yy2 = 30 + rnd(i * 3 + 1) * (GROUND - 40), xx2 = VW + 60 - ((S.t * sp + i * 97) % (VW + 160));
      ctx.moveTo(xx2, yy2); ctx.lineTo(xx2 + 40 + rnd(i + 5) * 40, yy2 + 2);
    }
    ctx.stroke();
  }
}
function drawPlatforms(th) {
  PLATS.forEach(function (pl) {
    var sx = pl.x - cam;
    if (sx > VW + 10 || sx + pl.w < -10) return;
    // soft contact shadow so the ledge sits in the painting
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath();
    ctx.ellipse(sx + pl.w / 2, pl.y + 20, pl.w * 0.56, 6, 0, 0, Math.PI * 2); ctx.fill();
    // body: warm light on top, cool weight underneath
    var bg = ctx.createLinearGradient(0, pl.y, 0, pl.y + 18);
    bg.addColorStop(0, rgb(th.gT)); bg.addColorStop(0.45, rgb(mixc(th.gB, th.gT, 0.35))); bg.addColorStop(1, rgb(mixc(th.gB, [0, 0, 0], 0.55)));
    ctx.fillStyle = bg; rrect(sx - 2, pl.y, pl.w + 4, 17, 5); ctx.fill();
    var ptex = groundTexAt(zoneIndex(pl.x));
    if (ptex) {
      ctx.save(); rrect(sx - 2, pl.y, pl.w + 4, 17, 5); ctx.clip();
      ctx.globalAlpha = 0.62;
      var pOff = pl.x % 384;
      for (var pt = sx - 2 - pOff; pt < sx + pl.w; pt += 384) ctx.drawImage(ptex, pt, pl.y - 16, 384, 52);
      ctx.globalAlpha = 1; ctx.restore();
    }
    // lit cap
    ctx.fillStyle = 'rgba(255,244,214,0.3)'; rrect(sx, pl.y + 0.6, pl.w, 3, 2); ctx.fill();
    // brush strokes for stone grain
    ctx.strokeStyle = rgbaInk(th, 0.16); ctx.lineWidth = 1.1;
    for (var i = 1; i < 4; i++) {
      var bx = sx + (pl.w / 4) * i;
      ctx.beginPath(); ctx.moveTo(bx, pl.y + 3); ctx.quadraticCurveTo(bx + 2.5, pl.y + 9, bx + 1, pl.y + 15); ctx.stroke();
    }
    // warm rim on the sunward edge
    ctx.strokeStyle = 'rgba(255,206,150,0.34)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx + 1, pl.y + 4); ctx.lineTo(sx + 1, pl.y + 13); ctx.stroke();
    // grass tufts when the zone has them
    if (th.grass > 0.25) {
      ctx.strokeStyle = rgb(mixc(th.gT, [20, 90, 40], 0.45)); ctx.lineWidth = 1.4;
      for (var k = 0; k < 4; k++) {
        var gx = sx + 8 + k * (pl.w - 16) / 3 + (rnd(pl.x + k) - 0.5) * 6;
        if (rnd(pl.x + k * 7) < 0.45) continue;
        ctx.beginPath(); ctx.moveTo(gx, pl.y + 1); ctx.lineTo(gx - 1.5, pl.y - 6 - rnd(k + pl.x) * 4); ctx.stroke();
      }
    }
  });
}
function rgbaInk(th, a) { return rgb(mixc(th.gB, [0, 0, 0], 0.7), a); }
function drawBridge() {
  var t = S.bridgeT;
  var sx0 = CHASM.x - cam, w = CHASM.w;
  // posts
  function post(x) { ctx.fillStyle = '#5a4128'; ctx.fillRect(x - 5, GROUND - 56, 10, 58); ctx.fillStyle = '#7a5a38'; ctx.fillRect(x - 5, GROUND - 56, 10, 4); }
  post(sx0 - 6); post(sx0 + w + 6);
  if (t <= 0) {
    // frayed ropes and stub planks
    ctx.strokeStyle = '#a58b5a'; ctx.lineWidth = 2;
    for (var i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(sx0 - 6, GROUND - 48 + i * 20); ctx.quadraticCurveTo(sx0 + 10, GROUND - 20 + i * 16, sx0 + 16 + i * 6, GROUND + 26 + i * 8); ctx.stroke(); }
    ctx.fillStyle = '#6e5338'; ctx.fillRect(sx0, GROUND, 14, 5); ctx.save(); ctx.translate(sx0 + 22, GROUND + 4); ctx.rotate(0.5); ctx.fillRect(0, 0, 12, 5); ctx.restore();
    // sign
    ctx.fillStyle = '#4a3622'; ctx.fillRect(sx0 - 40, GROUND - 40, 4, 40);
    ctx.fillStyle = '#8a6a40'; rrect(sx0 - 66, GROUND - 52, 56, 22, 3); ctx.fill();
    ctx.fillStyle = '#2a1c0c'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ROTTEN', sx0 - 38, GROUND - 38); ctx.textAlign = 'left';
    return;
  }
  var len = w * t;
  // rails (sag)
  ctx.strokeStyle = '#c4a56a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(sx0 - 6, GROUND - 48);
  ctx.quadraticCurveTo(sx0 + len / 2, GROUND - 48 + 18 * t, sx0 + len, GROUND - 48 + (t >= 1 ? 0 : 6)); ctx.stroke();
  // deck
  for (var x = 0; x < len; x += 12) {
    ctx.fillStyle = (x / 12) % 2 ? '#7a5c3a' : '#6b4f31';
    ctx.fillRect(sx0 + x, GROUND, 11, 6);
    if (x % 36 === 0) { ctx.strokeStyle = '#a58b5a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx0 + x + 5, GROUND); ctx.lineTo(sx0 + x + 5, GROUND - 48 + 18 * t * (1 - Math.pow((x / len) * 2 - 1, 2)) + 0); ctx.stroke(); }
  }
}
function drawPool(th) {
  var sx = POOL.x - cam;
  if (sx > VW + 20 || sx + POOL.w < -20) return;
  var lit = S.poolUsed ? 0.25 : 1;
  ctx.fillStyle = '#10181d'; ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 2, POOL.w / 2 + 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  var g = ctx.createRadialGradient(sx + POOL.w / 2, GROUND, 4, sx + POOL.w / 2, GROUND, POOL.w / 2);
  g.addColorStop(0, 'rgba(140,220,255,' + lit + ')'); g.addColorStop(1, 'rgba(30,90,130,' + lit + ')');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 1, POOL.w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.4 * lit + ')'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(sx + POOL.w / 2, GROUND + 1, POOL.w / 4 + Math.sin(S.t * 2) * 3, 3, 0, 0, Math.PI * 2); ctx.stroke();
}
// Every stage boundary gets a cairn with a lantern post. Unlit it is just stone;
// once you reach it the flame comes up and it becomes your resume point.
// The hiding places themselves: alcoves, drums, cracks and walls.
function drawSecrets() {
  var i, sx;
  // ---- tide pocket: a low mouth in the beach rock, drowned at the surge
  sx = SECRETS[0].x - cam;
  if (sx > -120 && sx < VW + 120) {
    var arch = ctx.createLinearGradient(0, GROUND - 66, 0, GROUND + 4);
    arch.addColorStop(0, 'rgba(10,16,26,0.92)'); arch.addColorStop(1, 'rgba(24,34,44,0.98)');
    ctx.fillStyle = arch;
    ctx.beginPath(); ctx.moveTo(sx - 34, GROUND + 2); ctx.quadraticCurveTo(sx - 34, GROUND - 62, sx, GROUND - 66);
    ctx.quadraticCurveTo(sx + 34, GROUND - 62, sx + 34, GROUND + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,180,0.22)'; ctx.lineWidth = 2; ctx.stroke();
    var wet = ctx.createLinearGradient(0, GROUND - 10, 0, GROUND + 4);
    wet.addColorStop(0, 'rgba(150,210,235,0.4)'); wet.addColorStop(1, 'rgba(60,120,160,0.15)');
    ctx.fillStyle = wet; ctx.fillRect(sx - 32, GROUND - 8, 64, 11);
    if (tideSurge()) {
      ctx.fillStyle = 'rgba(120,205,240,0.5)';
      ctx.beginPath(); ctx.moveTo(sx - 34, GROUND + 2);
      for (var wx = -34; wx <= 34; wx += 8) ctx.lineTo(sx + wx, GROUND - 54 + Math.sin(wx * 0.2 + S.t * 7) * 3);
      ctx.lineTo(sx + 34, GROUND + 2); ctx.closePath(); ctx.fill();
    }
  }
  // ---- the drum rock
  sx = 2366 - cam;
  if (sx > -140 && sx < VW + 140) {
    if (!S.open.drums) {
      var rg = ctx.createLinearGradient(sx - 44, GROUND - 96, sx + 44, GROUND);
      rg.addColorStop(0, '#6a5c48'); rg.addColorStop(1, '#3c3327');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.moveTo(sx - 44, GROUND + 2); ctx.lineTo(sx - 40, GROUND - 74); ctx.lineTo(sx - 12, GROUND - 96);
      ctx.lineTo(sx + 20, GROUND - 92); ctx.lineTo(sx + 44, GROUND - 66); ctx.lineTo(sx + 44, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,168,0.16)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx - 30, GROUND - 70); ctx.lineTo(sx - 6, GROUND - 40); ctx.lineTo(sx + 18, GROUND - 62); ctx.stroke();
    } else {
      // split open: two halves leaning apart, a lit slot between them
      var gl = ctx.createLinearGradient(0, GROUND - 80, 0, GROUND);
      gl.addColorStop(0, 'rgba(255,190,90,0.35)'); gl.addColorStop(1, 'rgba(255,150,60,0.08)');
      ctx.fillStyle = gl; ctx.fillRect(sx - 20, GROUND - 84, 40, 86);
      ctx.fillStyle = '#5c5040';
      ctx.beginPath(); ctx.moveTo(sx - 46, GROUND + 2); ctx.lineTo(sx - 42, GROUND - 72); ctx.lineTo(sx - 20, GROUND - 84);
      ctx.lineTo(sx - 20, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a4034';
      ctx.beginPath(); ctx.moveTo(sx + 46, GROUND + 2); ctx.lineTo(sx + 42, GROUND - 74); ctx.lineTo(sx + 22, GROUND - 82);
      ctx.lineTo(sx + 22, GROUND + 2); ctx.closePath(); ctx.fill();
    }
    for (i = 0; i < 3; i++) {
      var dx = DRUM_X[i] - cam, dhit = S.drumsHit[i];
      ctx.fillStyle = dhit ? '#8a6a44' : '#6d5537';
      rrect(dx - 9, GROUND - 34, 18, 34, 4); ctx.fill();
      ctx.fillStyle = dhit ? 'rgba(255,214,138,0.8)' : 'rgba(210,180,130,0.35)';
      ctx.beginPath(); ctx.ellipse(dx, GROUND - 34, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(20,14,8,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dx - 8, GROUND - 22); ctx.lineTo(dx + 8, GROUND - 22); ctx.moveTo(dx - 8, GROUND - 12); ctx.lineTo(dx + 8, GROUND - 12); ctx.stroke();
    }
    if (!S.open.drums && Math.abs(S.p.x - 2366) < 110) drawPrompt(2366 - cam, GROUND - 108, 'X', 'ring the drums');
  }
  // ---- cracked seam in the cave wall
  sx = SEAM_X - cam;
  if (sx > -80 && sx < VW + 80) {
    if (!S.open.seam) {
      var sg = ctx.createLinearGradient(sx - 20, GROUND - 80, sx + 20, GROUND);
      sg.addColorStop(0, 'rgba(20,26,40,0.9)'); sg.addColorStop(1, 'rgba(8,12,22,0.95)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(sx - 22, GROUND + 2); ctx.lineTo(sx - 16, GROUND - 62); ctx.lineTo(sx + 6, GROUND - 84);
      ctx.lineTo(sx + 20, GROUND - 58); ctx.lineTo(sx + 22, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(130,230,255,' + (0.45 + 0.25 * Math.sin(S.t * 3)) + ')'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(sx - 4, GROUND - 78); ctx.lineTo(sx + 2, GROUND - 50); ctx.lineTo(sx - 6, GROUND - 34); ctx.lineTo(sx + 4, GROUND - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 2, GROUND - 50); ctx.lineTo(sx + 16, GROUND - 40); ctx.stroke();
      if (Math.abs(S.p.x - SEAM_X) < 120) drawPrompt(SEAM_X - cam, GROUND - 104, 'X', 'split the seam');
    } else {
      ctx.fillStyle = 'rgba(6,9,18,0.95)';
      ctx.beginPath(); ctx.moveTo(sx - 24, GROUND + 2); ctx.lineTo(sx - 16, GROUND - 64); ctx.lineTo(sx + 8, GROUND - 84);
      ctx.lineTo(sx + 22, GROUND - 56); ctx.lineTo(sx + 24, GROUND + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(130,230,255,0.3)'; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
  // ---- the keeper's wall
  sx = CACHE_X - cam;
  if (sx > -80 && sx < VW + 80) {
    if (!S.open.cache) {
      for (i = 0; i < 4; i++) {
        var by = GROUND - 22 - i * 22;
        ctx.fillStyle = i % 2 ? '#6a6154' : '#5b5347';
        rrect(sx - 11 + (i % 2 ? 2 : -1), by, 22, 20, 3); ctx.fill();
        ctx.fillStyle = 'rgba(255,235,200,0.12)'; ctx.fillRect(sx - 10, by + 1, 20, 2);
      }
      if (S.cacheHp < 3) {
        ctx.strokeStyle = 'rgba(20,16,12,0.7)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sx - 6, GROUND - 70); ctx.lineTo(sx + 3, GROUND - 44); ctx.lineTo(sx - 4, GROUND - 20); ctx.stroke();
      }
      if (Math.abs(S.p.x - CACHE_X) < 120) drawPrompt(CACHE_X - cam, GROUND - 112, 'X', 'break the wall');
    } else {
      ctx.fillStyle = '#574f44';
      for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(sx - 16 + i * 13, GROUND - 3 + (i % 2) * 2, 8, 4, 0.2 * i, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(8,10,16,0.8)';
      ctx.beginPath(); ctx.moveTo(sx - 12, GROUND + 2); ctx.lineTo(sx - 8, GROUND - 40); ctx.lineTo(sx + 10, GROUND - 38); ctx.lineTo(sx + 12, GROUND + 2); ctx.closePath(); ctx.fill();
    }
  }
  // ---- the hollow log
  sx = LOG_X - cam;
  if (sx > -90 && sx < VW + 90) {
    var lg2 = ctx.createLinearGradient(sx - 26, GROUND - 30, sx + 26, GROUND);
    lg2.addColorStop(0, '#6b5233'); lg2.addColorStop(1, '#3d2d1a');
    ctx.fillStyle = lg2;
    rrect(sx - 26, GROUND - 30, 52, 32, 14); ctx.fill();
    ctx.fillStyle = 'rgba(4,6,10,0.92)';
    ctx.beginPath(); ctx.ellipse(sx + 24, GROUND - 14, 7, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.16)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx - 22, GROUND - 26); ctx.quadraticCurveTo(sx, GROUND - 34, sx + 20, GROUND - 26); ctx.stroke();
    ctx.fillStyle = '#3f6b34';
    for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(sx - 18 + i * 11, GROUND - 32 - (i % 2) * 3, 5, 3, -0.4, 0, Math.PI * 2); ctx.fill(); }
    if (!S.logUsed && Math.abs(S.p.x - LOG_X) < 100) drawPrompt(LOG_X - cam, GROUND - 70, touchMode ? 'Use' : 'E', 'slip through');
  }
}
function drawCheckpoints() {
  for (var i = 1; i < CHECKPOINTS.length; i++) {
    var cx = CHECKPOINTS[i].x, sx = cx - cam;
    if (sx < -80 || sx > VW + 80) continue;
    var lit = i <= S.cpI;
    var bloom = (i === S.cpI && S.cpT < 1.15) ? 1 - S.cpT / 1.15 : 0;
    shadowAt(cx + 2, GROUND, 30, 0.28);
    // stacked stones
    var stones = [[-16, 0, 10, 5.6, -0.1], [-13, -8, 7.6, 4.4, 0.1], [-10, -15, 5.4, 3.3, -0.12]];
    for (var s = 0; s < stones.length; s++) {
      var st = stones[s], bx = sx + st[0], by = GROUND + st[1], bw = st[2], bh = st[3];
      var sg = ctx.createLinearGradient(bx - bw, by - bh, bx + bw, by + bh);
      sg.addColorStop(0, '#98a0aa'); sg.addColorStop(0.5, '#646c76'); sg.addColorStop(1, '#39404a');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(bx, by, bw, bh, st[4], 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit ? 'rgba(255,226,168,0.34)' : 'rgba(200,225,240,0.22)';
      ctx.beginPath(); ctx.ellipse(bx + bw * 0.34, by - bh * 0.46, bw * 0.34, bh * 0.28, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // post
    var pg = ctx.createLinearGradient(sx + 6, GROUND - 76, sx + 16, GROUND);
    pg.addColorStop(0, '#8d6c46'); pg.addColorStop(0.5, '#a58154'); pg.addColorStop(1, '#4a3721');
    ctx.fillStyle = pg; rrect(sx + 8, GROUND - 76, 8, 76, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,224,162,0.26)'; ctx.fillRect(sx + 14.2, GROUND - 74, 1.9, 72);
    // arm and pennant
    ctx.strokeStyle = '#7a5c39'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx + 12, GROUND - 72); ctx.quadraticCurveTo(sx + 22, GROUND - 78, sx + 30, GROUND - 70); ctx.stroke();
    var fl = Math.sin(S.t * 2.3 + i * 1.7) * 2.6;
    ctx.fillStyle = lit ? 'rgba(208,94,62,0.95)' : 'rgba(108,80,66,0.72)';
    ctx.beginPath(); ctx.moveTo(sx + 9, GROUND - 74);
    ctx.quadraticCurveTo(sx - 4, GROUND - 70 + fl, sx - 16, GROUND - 72 + fl * 1.5);
    ctx.quadraticCurveTo(sx - 4, GROUND - 63 + fl, sx + 9, GROUND - 59);
    ctx.closePath(); ctx.fill();
    // lantern
    var lx = sx + 30, ly = GROUND - 56;
    if (lit) {
      var glow = 0.42 + 0.1 * Math.sin(S.t * 3.1 + i) + bloom * 0.55;
      var rad = 40 + bloom * 26;
      var rg = ctx.createRadialGradient(lx, ly, 1, lx, ly, rad);
      rg.addColorStop(0, 'rgba(255,206,120,' + Math.min(0.8, glow) + ')');
      rg.addColorStop(0.42, 'rgba(255,168,74,' + Math.min(0.32, glow * 0.42) + ')');
      rg.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(lx, ly, rad, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,188,104,' + (0.13 + bloom * 0.18) + ')';
      ctx.beginPath(); ctx.ellipse(lx, GROUND + 1, 36, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,206,130,' + (0.12 + bloom * 0.14) + ')';
      ctx.beginPath(); ctx.ellipse(lx, GROUND + 1, 20, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#2d271f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lx, GROUND - 70); ctx.lineTo(lx, GROUND - 64); ctx.stroke();
    ctx.fillStyle = '#3b332a'; rrect(lx - 6.2, ly - 8, 12.4, 17, 3); ctx.fill();
    ctx.fillStyle = lit ? '#ffd98c' : 'rgba(126,148,160,0.45)';
    rrect(lx - 3.8, ly - 5, 7.6, 10.5, 2); ctx.fill();
    if (lit) { ctx.fillStyle = 'rgba(255,255,240,0.92)'; ctx.beginPath(); ctx.arc(lx, ly - 0.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.34)'; rrect(lx - 7, ly + 8, 14, 3, 1.5); ctx.fill();
    if (bloom > 0) {
      ctx.strokeStyle = 'rgba(255,214,138,' + (bloom * 0.75) + ')'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(lx, ly, (1 - bloom) * 54 + 9, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
function drawTutGate() {
  if (S.tutGate) return;
  var x = TUT_GATE_X - cam;
  if (x < -90 || x > VW + 90) return;
  shadowAt(TUT_GATE_X, GROUND, 42, 0.32);
  ctx.fillStyle = '#6b4a2b';
  rrect(x - 18, GROUND - 60, 9, 60, 3); ctx.fill();
  rrect(x + 9, GROUND - 60, 9, 60, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,0.22)';
  ctx.fillRect(x - 17, GROUND - 60, 2.4, 60); ctx.fillRect(x + 10, GROUND - 60, 2.4, 60);
  for (var i = 0; i < 4; i++) {
    var yy = GROUND - 12 - i * 13;
    ctx.save(); ctx.translate(x, yy); ctx.rotate((i % 2 ? 1 : -1) * 0.035);
    var g = ctx.createLinearGradient(-22, 0, 22, 0);
    g.addColorStop(0, '#8a6236'); g.addColorStop(0.5, '#ab7a46'); g.addColorStop(1, '#5a3f22');
    ctx.fillStyle = g; rrect(-22, -5, 44, 9.5, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.fillRect(-22, 2, 44, 1.6);
    ctx.restore();
  }
  ctx.strokeStyle = '#d9b878'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 17, GROUND - 54); ctx.lineTo(x + 16, GROUND - 16); ctx.moveTo(x + 17, GROUND - 54); ctx.lineTo(x - 16, GROUND - 16); ctx.stroke();
  if (Math.abs(S.p.x - TUT_GATE_X) < 110) drawPrompt(x, GROUND - 80, touchMode ? 'Use' : 'E', 'shove the gate');
}

function drawVines(b) {
  var sx = b.x - cam;
  if (sx < -30 || sx > VW + 30) return;
  ctx.strokeStyle = '#2f7a3f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (var i = 0; i < 5; i++) {
    var ox = (i - 2) * 5 + Math.sin(S.t * 1.4 + i) * 2;
    ctx.beginPath(); ctx.moveTo(sx + ox, GROUND); ctx.bezierCurveTo(sx + ox + 12, GROUND - 40, sx + ox - 12, GROUND - 80, sx + ox, GROUND - 130); ctx.stroke();
  }
  ctx.strokeStyle = '#a8c86a'; ctx.lineWidth = 1.5;
  for (var k = 0; k < 8; k++) { var y = GROUND - 12 - k * 15; ctx.beginPath(); ctx.moveTo(sx - 10, y); ctx.lineTo(sx - 15, y - 5); ctx.moveTo(sx + 10, y - 6); ctx.lineTo(sx + 15, y - 11); ctx.stroke(); }
}
function drawTower() {
  var sx = BEACON_X - cam;
  if (sx < -140 || sx > VW + 140) return;
  var lit = S.mode === 'winning' || S.mode === 'won';
  var litAmt = lit ? sm((S.winT - 0.7) / 0.6) : 0;
  ctx.save(); ctx.translate(sx, GROUND);
  if (litAmt > 0) {
    for (var s = -1; s <= 1; s += 2) {
      var bg = ctx.createLinearGradient(0, -250, s * 340, -250);
      bg.addColorStop(0, 'rgba(255,214,120,' + 0.55 * litAmt + ')'); bg.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -252); ctx.lineTo(s * 340, -300); ctx.lineTo(s * 340, -200); ctx.closePath(); ctx.fill();
    }
  }
  var g = ctx.createLinearGradient(-30, 0, 30, 0);
  g.addColorStop(0, '#b8b3a2'); g.addColorStop(0.5, '#ece8d8'); g.addColorStop(1, '#9d9886');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(-20, -240); ctx.lineTo(20, -240); ctx.lineTo(36, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b9473c';
  [[-30, -50, -27, -90], [-24, -130, -22, -170]].forEach(function (b) {
    var k0 = (b[1] / -240), k1 = (b[3] / -240);
    var w0 = 36 - 16 * k0, w1 = 36 - 16 * k1;
    ctx.beginPath(); ctx.moveTo(-w0, b[1]); ctx.lineTo(-w1, b[3]); ctx.lineTo(w1, b[3]); ctx.lineTo(w0, b[1]); ctx.closePath(); ctx.fill();
  });
  ctx.fillStyle = '#3a2c20'; rrect(-10, -44, 20, 44, 8); ctx.fill();
  ctx.fillStyle = '#2a343c'; ctx.fillRect(-26, -246, 52, 8);
  ctx.fillStyle = '#b9473c'; ctx.beginPath(); ctx.moveTo(-18, -264); ctx.lineTo(0, -286); ctx.lineTo(18, -264); ctx.closePath(); ctx.fill();
  ctx.fillStyle = litAmt > 0 ? 'rgba(255,214,110,' + (0.4 + 0.6 * litAmt) + ')' : '#3c4a52'; ctx.fillRect(-12, -264, 24, 18);
  if (litAmt > 0) { var rg = ctx.createRadialGradient(0, -255, 4, 0, -255, 150); rg.addColorStop(0, 'rgba(255,220,130,' + 0.7 * litAmt + ')'); rg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = rg; ctx.fillRect(-160, -400, 320, 300); }
  ctx.restore();
}
function drawSpearShape(len) {
  ctx.strokeStyle = '#8a6a40'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.stroke();
  ctx.fillStyle = '#cfd6d8'; ctx.beginPath(); ctx.moveTo(len / 2 + 9, 0); ctx.lineTo(len / 2 - 2, -3.5); ctx.lineTo(len / 2 - 2, 3.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d96b4a'; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(-len / 2 - 5, -3); ctx.lineTo(-len / 2 + 3, 0); ctx.lineTo(-len / 2 - 5, 3); ctx.closePath(); ctx.fill();
}

function drawItem(it) {
  if (it.got) return;
  if (it.type === 'sun' && !sunOpen(it.sid)) return;   // still sealed in its hiding place
  var sx = it.x - cam; if (sx < -30 || sx > VW + 30) return;
  var bob = Math.sin(S.t * 3 + it.x) * 3, y = it.y + bob;
  if (it.type === 'fruit') {
    ell(sx, y, 8, 8, '#e8923b'); ell(sx - 2, y - 2, 3, 3, 'rgba(255,255,255,0.4)');
    ctx.fillStyle = '#4aa35a'; ctx.beginPath(); ctx.ellipse(sx + 3, y - 9, 5, 2.4, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (it.type === 'rope') {
    var g = ctx.createRadialGradient(sx, y, 2, sx, y, 36); g.addColorStop(0, 'rgba(255,220,130,0.55)'); g.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 40, y - 40, 80, 80);
    ctx.strokeStyle = '#d7b878'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.ellipse(sx, y + 2, 15, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx, y, 9, 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 14, y + 4); ctx.quadraticCurveTo(sx + 24, y + 10, sx + 30, y + 4); ctx.stroke();
  } else if (it.type === 'sun') {
    var pu = 0.75 + 0.25 * Math.sin(S.t * 2.6 + it.x);
    var gg = ctx.createRadialGradient(sx, y, 2, sx, y, 54);
    gg.addColorStop(0, 'rgba(255,205,90,' + 0.55 * pu + ')'); gg.addColorStop(0.5, 'rgba(255,170,60,0.2)'); gg.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = gg; ctx.fillRect(sx - 58, y - 58, 116, 116);
    // faceted amber stone
    ctx.save(); ctx.translate(sx, y); ctx.rotate(Math.sin(S.t * 0.9 + it.x) * 0.12);
    var fg = ctx.createLinearGradient(-9, -11, 9, 11);
    fg.addColorStop(0, '#fff0bd'); fg.addColorStop(0.45, '#ffc94e'); fg.addColorStop(1, '#d97a1f');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, -3); ctx.lineTo(6, 9); ctx.lineTo(-6, 9); ctx.lineTo(-9, -3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,235,0.75)';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4.4, -3.5); ctx.lineTo(0, 2); ctx.lineTo(-4.4, -3.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,10,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 9); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.stroke();
    ctx.restore();
  } else if (it.type === 'lantern') {
    var fl = 0.8 + 0.2 * Math.sin(S.t * 9);
    var g2 = ctx.createRadialGradient(sx, y, 2, sx, y, 60); g2.addColorStop(0, 'rgba(255,200,90,' + 0.7 * fl + ')'); g2.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = g2; ctx.fillRect(sx - 64, y - 64, 128, 128);
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, y - 12, 5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(sx - 8, y - 12, 16, 3); ctx.fillRect(sx - 8, y + 9, 16, 3);
    ctx.fillStyle = 'rgba(255,214,110,' + fl + ')'; ctx.fillRect(sx - 6, y - 9, 12, 18);
    ctx.fillStyle = '#fff6cf'; ctx.fillRect(sx - 2, y - 4, 4, 8);
  }
}

// ---------------------------------------------------------------- characters
function shadowAt(x, y, w, a) {
  ctx.save(); ctx.translate(x - cam, y); ctx.scale(1, 0.22);
  var g = ctx.createRadialGradient(0, 0, 1, 0, 0, w);
  g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// ------------------------------------------------ painted hunter
// Hand-painted poses, one texture each. Offsets place every pose on the same
// feet line so swapping between them never makes the hunter jitter.
var HUNTER_META = {"idle":{"w":20.5,"h":64.0,"dx":-12.38,"dy":-64.19},"run1":{"w":50.5,"h":61.5,"dx":-34.45,"dy":-63.94},"run2":{"w":51.5,"h":61.5,"dx":-35.36,"dy":-64.0},"jump":{"w":38.5,"h":56.5,"dx":-21.84,"dy":-63.09},"stab":{"w":60.0,"h":54.5,"dx":-38.24,"dy":-59.0},"run3":{"w":53.0,"h":61.5,"dx":-34.2,"dy":-64.0}};
var HUNTER_SPR = {};
(function loadHunter() {
  for (var k in HUNTER_META) (function (k) {
    var im = new Image(), m = HUNTER_META[k];
    var o = { img: im, ready: false, w: m.w, h: m.h, dx: m.dx, dy: m.dy };
    HUNTER_SPR[k] = o;
    im.onload = function () { o.ready = im.naturalWidth > 0; };
    im.src = 'art/hunter_' + k + '.webp?v=' + ASSET_V;
  })(k);
})();
function hunterPose(p, run) {
  if (p.stab > 0) return 'stab';
  if (!p.onGround) return 'jump';
  if (run) return ['run1', 'run2', 'run3', 'run2'][Math.floor(p.ph / (Math.PI / 2)) & 3];
  return 'idle';
}
function hunterFallback() {
  ctx.fillStyle = '#422a18'; rrect(-8, -24, 6.5, 24, 3); ctx.fill();
  ctx.fillStyle = '#5f3f24'; rrect(1.5, -24, 6.5, 24, 3); ctx.fill();
  var g = ctx.createLinearGradient(-8, -46, 8, -24);
  g.addColorStop(0, '#9d7a3c'); g.addColorStop(0.55, '#d9b76d'); g.addColorStop(1, '#f2d79a');
  ctx.fillStyle = g; rrect(-8, -46, 16, 24, 4); ctx.fill();
  ctx.fillStyle = '#e9b98c'; ctx.beginPath(); ctx.ellipse(1, -51, 7, 7.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b58a4a'; ctx.beginPath(); ctx.ellipse(1, -55.6, 12.8, 3.3, 0, 0, Math.PI * 2); ctx.fill();
}

function drawHunter() {
  var p = S.p;
  if (S.mode === 'dead') return;
  // soft contact shadow on the ground below (fades as you jump)
  var gy = p.onGround ? p.y : (solidAt(p.x) ? GROUND : -1);
  if (gy > 0) shadowAt(p.x, gy, 22 - Math.min(10, (gy - p.y) * 0.06), clamp(0.5 - (gy - p.y) / 260, 0.1, 0.5));
  var blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  var run = Math.abs(p.vx) > 10 && p.onGround;
  var ph = p.ph || 0, spd = Math.min(1, Math.abs(p.vx) / RUN);
  var bob = run ? -Math.abs(Math.sin(ph)) * 3.1 : Math.sin(S.t * 2.2) * 0.5;
  var lean = run ? 0.045 + 0.085 * spd + Math.sin(ph) * 0.012 : (p.vy < -50 ? -0.05 : (p.vy > 200 ? 0.06 : 0));
  ctx.save(); ctx.translate(p.x - cam, p.y); ctx.scale(p.face, 1);
  var contact = run ? Math.abs(Math.cos(ph)) * 0.055 : 0;   // dip as each foot plants
  ctx.scale(1 + p.sq * 0.55 + contact * 0.5, 1 - p.sq - contact);
  ctx.translate(0, bob);
  ctx.rotate(lean);

  var spr = HUNTER_SPR[hunterPose(p, run)];
  if (spr && spr.ready) ctx.drawImage(spr.img, spr.dx, spr.dy, spr.w, spr.h);
  else hunterFallback();

  var baseA = ctx.globalAlpha;
  // ---------------- lantern on the belt
  if (p.lantern) {
    var sw = Math.sin(S.t * 5 + (run ? p.anim * 8 : 0)) * (run ? 2 : 0.6);
    ctx.save(); ctx.translate(7, -25); ctx.rotate(sw * 0.05);
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,90,' + (0.2 + 0.05 * Math.sin(S.t * 13)) + ')'; ctx.beginPath(); ctx.arc(0, 8, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f2f2f'; ctx.fillRect(-3.5, 3, 7, 1.7); ctx.fillRect(-3.5, 12, 7, 1.7);
    var lgg = ctx.createLinearGradient(-2.8, 4.6, 2.8, 12);
    lgg.addColorStop(0, '#fff2c2'); lgg.addColorStop(0.6, '#ffd66e'); lgg.addColorStop(1, '#e8a63c');
    ctx.fillStyle = lgg; ctx.fillRect(-2.8, 4.6, 5.6, 7.4);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-1.2, 6.2, 1.4, 3.6);
    ctx.restore();
  }

  // ---------------- spear, held in the painted hand position
  ctx.globalAlpha = baseA;
  if (p.stab > 0) {
    var reach = Math.sin((1 - p.stab / 0.18) * Math.PI) * 14;
    ctx.save(); ctx.translate(16 + reach, -34); drawSpearShape(46); ctx.restore();
  } else if (p.throwT > 0) {
    ctx.save(); ctx.translate(14, -40); ctx.rotate(-0.5); drawSpearShape(46); ctx.restore();
  } else {
    ctx.save(); ctx.translate(11, -31); ctx.rotate(-1.35 + (run ? Math.sin(ph) * 0.13 : 0)); drawSpearShape(46); ctx.restore();
  }

  // ---------------- lantern glow over the body
  if (p.lantern) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,70,0.07)'; rrect(-9, -46, 18, 26, 5); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ------------------------------------------------ painted enemies
// Each creature is one or two painted poses, sized to its collision box and
// anchored on its feet so state changes never shift it off the ground.
var ENEMY_META = {"crab1":{"w":43.5,"h":26.0,"dx":-21.75,"dy":-26.0},"snake1":{"w":44.0,"h":34.0,"dx":-22.0,"dy":-34.0},"bat1":{"w":33.5,"h":32.0,"dx":-16.75,"dy":-32.0},"boar1":{"w":52.5,"h":42.0,"dx":-26.25,"dy":-42.0},"panther1":{"w":81.5,"h":44.0,"dx":-40.75,"dy":-44.0},"panther2":{"w":118.5,"h":44.0,"dx":-59.25,"dy":-44.0},"boss1":{"w":148.0,"h":94.0,"dx":-74.0,"dy":-94.0}};
var ENEMY_SPR = {};
(function loadEnemies() {
  for (var k in ENEMY_META) (function (k) {
    var im = new Image(), m = ENEMY_META[k];
    var o = { img: im, ready: false, w: m.w, h: m.h, dx: m.dx, dy: m.dy };
    ENEMY_SPR[k] = o;
    im.onload = function () { o.ready = im.naturalWidth > 0; };
    im.src = 'art/' + k + '.webp?v=' + ASSET_V;
  })(k);
})();
function enemyPose(e, t) {
  if (e.type === 'panther') return e.state === 'leap' ? 'panther2' : 'panther1';
  if (e.type === 'boss') return 'boss1';
  if (e.type === 'boar') return 'boar1';
  if (e.type === 'bat') return 'bat1';
  if (e.type === 'snake') return 'snake1';
  return 'crab1';
}

function drawEnemy(e) {
  var sx = e.x - cam;
  if (sx < -140 || sx > VW + 140) return;
  var fade = e.dying ? Math.max(0, 1 - e.dying / 0.45) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(sx, e.y);
  if (e.dying) { ctx.rotate(e.dying * 4 * (e.dir || 1)); ctx.translate(0, e.dying * 20); }
  ctx.scale(e.dir || 1, 1);
  if (e.hurt > 0 && 'filter' in ctx) ctx.filter = 'brightness(2.6)';
  var t = e.t, name = enemyPose(e, t), s = ENEMY_SPR[name];

  // the boss throws its own storm light
  if (e.type === 'boss') {
    var rage = e.hp <= e.maxhp / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var bg = ctx.createRadialGradient(0, -30, 4, 0, -30, 62);
    bg.addColorStop(0, 'rgba(' + (rage ? '190,110,255' : '130,90,240') + ',' + (rage ? 0.34 : 0.2) + ')');
    bg.addColorStop(1, 'rgba(120,80,220,0)');
    ctx.fillStyle = bg; ctx.fillRect(-70, -96, 140, 100);
    ctx.restore();
  }

  if (e.type !== 'bat' && !e.dying) shadowAt(e.x, e.y, (s ? s.w : e.w) * 0.42, 0.34);
  if (s && s.ready) {
    // a little life: bats beat, everything else breathes
    var amp = e.type === 'bat' ? 2.6 : (e.type === 'boss' || e.type === 'panther' ? 0.6 : 0.9);
    var spd = e.type === 'bat' ? 9 : 2.6;
    var bob = Math.sin(t * spd + e.x * 0.05) * amp;
    var lift = (e.state === 'leap' && e.type === 'panther') ? -6 : 0;
    if (e.type === 'bat') {
      ctx.save();
      ctx.translate(0, s.dy * 0.5);
      ctx.scale(1 + Math.sin(t * 18) * 0.04, 1 + Math.sin(t * 18) * 0.14);
      ctx.translate(0, -s.dy * 0.5);
      ctx.drawImage(s.img, s.dx, s.dy + bob, s.w, s.h);
      ctx.restore();
    } else {
      ctx.drawImage(s.img, s.dx, s.dy + bob + lift, s.w, s.h);
    }
  } else {
    ctx.fillStyle = e.type === 'boss' ? '#3a2358' : '#7a3a2a';
    rrect(-e.w / 2, -e.h, e.w, e.h, 5); ctx.fill();
  }
  if (e.type === 'boss' && e.hp <= e.maxhp / 2 && s && s.ready) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(200,140,255,' + (0.2 + 0.2 * Math.abs(Math.sin(t * 7))) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-26, -50); ctx.lineTo(-14, -44); ctx.lineTo(-22, -34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -48); ctx.lineTo(26, -40); ctx.lineTo(16, -32); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  if ('filter' in ctx) ctx.filter = 'none';
  ctx.restore();
}

function drawTie() {
  if (!S.tie) return;
  var p = S.p, t = S.tie.t;
  var x0 = p.x - cam + 14, y0 = p.y - 36;
  var x1 = CHASM.x + CHASM.w + 6 - cam, y1 = GROUND - 50;
  var q = clamp(t / 0.5, 0, 1);
  var ex = x0 + (x1 - x0) * q, ey = y0 + (y1 - y0) * q;
  var cx = (x0 + ex) / 2, cy = Math.min(y0, ey) - 46 * (1 - q * 0.6) + (q >= 1 ? 40 : 0);
  ctx.strokeStyle = '#d7b878'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  if (q < 1) { ell(ex, ey, 4, 4, '#a58b5a'); }
}
// The lantern rising up the tower into the lamp room while the beacon is being lit.
function drawLanternFlight() {
  if (S.mode !== 'winning' || S.winT > 0.9) return;
  var q = clamp(S.winT / 0.8, 0, 1), e = q * q * (3 - 2 * q);
  var x0 = S.p.x - cam + 10, y0 = S.p.y - 44, x1 = BEACON_X - cam, y1 = GROUND - 256;
  var x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e - Math.sin(q * Math.PI) * 26;
  var fl = 0.85 + 0.15 * Math.sin(S.t * 14);
  var g = ctx.createRadialGradient(x, y, 2, x, y, 48);
  g.addColorStop(0, 'rgba(255,200,90,' + 0.8 * fl + ')'); g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 50, y - 50, 100, 100);
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 12, 5, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#2f2f2f'; ctx.fillRect(x - 8, y - 12, 16, 3); ctx.fillRect(x - 8, y + 9, 16, 3);
  ctx.fillStyle = 'rgba(255,214,110,' + fl + ')'; ctx.fillRect(x - 6, y - 9, 12, 18);
  ctx.fillStyle = '#fff6cf'; ctx.fillRect(x - 2, y - 4, 4, 8);
}
// A small "press this key" bubble above the hunter.
function drawPrompt(x, y, keyText, label) {
  ctx.font = '700 11px Karla, sans-serif';
  var cap = keyText.length > 1 ? 30 : 18;
  var w = ctx.measureText(label).width + cap + 22;
  ctx.fillStyle = 'rgba(5,12,9,0.82)'; rrect(x - w / 2, y - 16, w, 24, 7); ctx.fill();
  ctx.strokeStyle = '#f6b73c'; ctx.lineWidth = 1.2; rrect(x - w / 2, y - 16, w, 24, 7); ctx.stroke();
  ctx.fillStyle = '#f6b73c'; rrect(x - w / 2 + 5, y - 12, cap, 16, 4); ctx.fill();
  ctx.fillStyle = '#2a1c04'; ctx.textAlign = 'center'; ctx.fillText(keyText, x - w / 2 + 5 + cap / 2, y);
  ctx.fillStyle = '#f2eedd'; ctx.textAlign = 'left'; ctx.fillText(label, x - w / 2 + cap + 11, y);
  ctx.beginPath(); ctx.moveTo(x - 5, y + 8); ctx.lineTo(x, y + 14); ctx.lineTo(x + 5, y + 8); ctx.fillStyle = 'rgba(5,12,9,0.82)'; ctx.fill();
}

// ---------------------------------------------------------------- render
var flies = [];
var DUST = ['#e8d6a4', '#6b5a38', '#8a949c', '#9a8a6a', '#7f8a90'];
for (var fi = 0; fi < 26; fi++) flies.push({ x: rnd(fi) * 700, y: 80 + rnd(fi + 40) * 190, ph: rnd(fi + 7) * 6 });

// ---------------------------------------------------------------- painted backdrops
// One hand-painted vista per zone, loaded from art/. If a file is missing the
// procedural sky keeps drawing, so the game never shows a blank frame.
var ART_NAMES = ['beach', 'jungle', 'cave', 'bridge', 'lighthouse'];
var GROUND_TEX = [], GROUND_OK = [];
(function loadGroundTex() {
  for (var i = 0; i < ART_NAMES.length; i++) (function (i) {
    var im = new Image();
    im.onload = function () { GROUND_OK[i] = im.naturalWidth > 0; };
    im.onerror = function () { GROUND_OK[i] = false; };
    im.src = 'art/ground_' + ART_NAMES[i] + '.webp?v=' + ASSET_V;
    GROUND_TEX[i] = im;
  })(i);
})();
function groundTexAt(i) { var im = GROUND_TEX[i]; return (im && GROUND_OK[i]) ? im : null; }
var ART = [], ART_OK = [];
(function loadPaintedArt() {
  for (var i = 0; i < ART_NAMES.length; i++) (function (i) {
    var im = new Image();
    im.onload = function () { ART_OK[i] = im.naturalWidth > 0; };
    im.onerror = function () { ART_OK[i] = false; };
    im.src = 'art/' + ART_NAMES[i] + '.webp?v=' + ASSET_V;
    ART[i] = im;
  })(i);
})();
function drawPaintedLayer(i, alpha) {
  var im = ART[i];
  if (!im || !ART_OK[i] || alpha <= 0.004) return;
  var pad = VW * 0.09;                       // slack for the slow parallax drift
  var dw = VW + pad * 2, dh = H;
  var ir = im.naturalWidth / im.naturalHeight, cr = dw / dh, sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight;
  if (ir > cr) { sw = sh * cr; sx = (im.naturalWidth - sw) * 0.5; }
  else { sh = sw / cr; sy = (im.naturalHeight - sh) * 0.55; }
  var br = 1.048 + 0.014 * Math.sin(S.t * 0.13 + i * 2.1);
  var drift = -pad - ((cam * 0.045) % pad) + Math.sin(S.t * 0.071 + i) * 9 + (S.p.vx || 0) * 0.025;
  var driftY = Math.sin(S.t * 0.05 + i * 1.3) * 3;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(VW / 2, H * 0.56); ctx.scale(br, br); ctx.translate(-VW / 2, -H * 0.56);
  ctx.drawImage(im, sx, sy, sw, sh, drift, driftY, dw, dh);
  ctx.restore();
  ctx.globalAlpha = 1;
}
function drawBackdrop() {
  var cx = cam + VW / 2, i = zoneIndex(cx), z = ZONES_META[i], j = -1, f = 0;
  if (i < ZONES_META.length - 1 && cx > z.x1 - 220) { j = i + 1; f = sm((cx - (z.x1 - 220)) / 220); }
  else if (i > 0 && cx < z.x0 + 220) { j = i - 1; f = sm((z.x0 + 220 - cx) / 220); }
  var a = ART_OK[i], b = j >= 0 && ART_OK[j];
  if (!a && !b) return false;
  if (a && b) { drawPaintedLayer(i, 1); drawPaintedLayer(j, f); }
  else if (a) drawPaintedLayer(i, 1);
  else drawPaintedLayer(j, 1);
  return true;
}

// ---------------------------------------------------------------- living air
// The plates are photographs, so the life has to come from what moves between
// the camera and them: cloud shadow, ground haze, drifting motes, wind, weather
// and the out-of-focus grass and leaves you are standing behind.
var MOTES = (function () {
  var m = [];
  for (var i = 0; i < 72; i++) m.push({
    x: rnd(i * 3.1), y: rnd(i * 7.7), r: 0.5 + rnd(i * 1.3) * 1.7,
    sp: 0.35 + rnd(i * 5.1) * 1.3, ph: rnd(i * 2.2) * 6.283,
    dp: 0.25 + rnd(i * 9.3) * 0.9, sw: rnd(i * 4.4) * 6.283
  });
  return m;
})();
var LIFE_TINT = ['#ffe2b4', '#e9ffb4', '#a8ecff', '#cfe0ff', '#e2edff'];
var lFlash = 0;
function plateLife(th) {
  if (gfxLite || REDUCE) return;
  var zi = zoneIndex(cam + VW / 2), t = S.t;
  // cloud shadow rolling across the whole view
  for (var c = 0; c < 2; c++) {
    var cw = 460 + c * 200;
    var cx0 = ((t * (10 + c * 7) + c * 300 - cam * 0.1) % (VW + cw * 2) + VW + cw * 2) % (VW + cw * 2) - cw;
    var cy = 34 + c * 64;
    var g = ctx.createRadialGradient(cx0 + cw / 2, cy, 6, cx0 + cw / 2, cy, cw * 0.52);
    g.addColorStop(0, 'rgba(6,9,20,' + (0.075 + c * 0.028) + ')'); g.addColorStop(1, 'rgba(6,9,20,0)');
    ctx.fillStyle = g; ctx.fillRect(cx0, 0, cw, H);
  }
  // the air thickens toward the ground
  var hz = ctx.createLinearGradient(0, GROUND - 130, 0, GROUND + 8);
  hz.addColorStop(0, 'rgba(255,236,208,0)'); hz.addColorStop(0.6, 'rgba(255,236,208,0.05)'); hz.addColorStop(1, 'rgba(255,236,208,0.11)');
  ctx.fillStyle = hz; ctx.fillRect(0, GROUND - 130, VW, 138);
  // dust, pollen, sand and spray hanging in the light
  ctx.fillStyle = LIFE_TINT[zi];
  for (var i = 0; i < MOTES.length; i++) {
    var m = MOTES[i];
    var x = ((m.x * (VW + 80) - cam * m.dp * 0.4 + t * m.sp * 7) % (VW + 80) + VW + 80) % (VW + 80) - 40;
    var y = m.y * H * 0.8 + Math.sin(t * 0.6 + m.ph) * 12 + Math.sin(t * 1.7 + m.sw) * 3;
    ctx.globalAlpha = 0.1 + 0.42 * (0.5 + 0.5 * Math.sin(t * 1.4 + m.ph));
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (zi === 2) {                                   // the cave breathing with its own light
    var pu = 0.5 + 0.5 * Math.sin(t * 0.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var cg = ctx.createRadialGradient(VW * 0.48, H * 0.44, 20, VW * 0.48, H * 0.44, VW * 0.62);
    cg.addColorStop(0, 'rgba(110,215,255,' + (0.09 + 0.07 * pu) + ')'); cg.addColorStop(1, 'rgba(110,215,255,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, VW, H); ctx.restore();
  }
  if (zi === 3) {                                   // a storm you can feel coming
    if (Math.random() < 0.0032) lFlash = 1;
    if (lFlash > 0.01) {
      ctx.fillStyle = 'rgba(198,222,255,' + (0.16 * lFlash) + ')'; ctx.fillRect(0, 0, VW, H);
      lFlash *= 0.82;
    }
  }
  if (zi === 1) {                                   // dappled sun moving on the forest floor
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < 5; d++) {
      var dx = ((d * 150 + t * 5 - cam * 0.25) % (VW + 200) + VW + 200) % (VW + 200) - 100;
      var dy = GROUND - 6 + Math.sin(t * 0.5 + d) * 3;
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.9 + d * 2);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.ellipse(dx, dy, 60, 9, 0, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
  }
}
// Grass and leaves close enough to the lens to be out of focus.
function drawNearLayer(th) {
  if (gfxLite) return;
  var zi = zoneIndex(cam + VW / 2), off = cam * 1.55, t = S.t;
  var ink = rgb(mixc(th.tree2, [0, 0, 0], 0.6));
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = ink;
  // grass on the shore, forest and cliff; wet stone instead of grass deep in the cave
  for (var i = Math.floor(off / 46) - 1; i < (off + VW) / 46 + 1; i++) {
    if (zi === 2) break;
    if (rnd(i * 5.7 + 3) > 0.52) continue;
    var bx = i * 46 - off + rnd(i * 2.1) * 22, hgt = 15 + rnd(i * 3.9) * 32, sway = Math.sin(t * 1.1 + i * 0.7) * 3.2;
    ctx.beginPath(); ctx.moveTo(bx - 5, H + 6);
    ctx.quadraticCurveTo(bx - 2 + sway * 0.5, H - hgt * 0.6, bx + sway, H - hgt);
    ctx.quadraticCurveTo(bx + 3 + sway * 0.5, H - hgt * 0.6, bx + 6, H + 6);
    ctx.closePath(); ctx.fill();
  }
  if (zi === 2) {
    ctx.fillStyle = rgb(mixc([40, 46, 58], [0, 0, 0], 0.55));
    for (var q = Math.floor(off / 130) - 1; q < (off + VW) / 130 + 1; q++) {
      var qx = q * 130 - off + rnd(q * 6.2) * 60, qw = 34 + rnd(q * 2.8) * 46;
      ctx.beginPath(); ctx.ellipse(qx, H + 12, qw, 26 + rnd(q * 3.3) * 16, 0, Math.PI, 0); ctx.fill();
    }
  }
  if (zi !== 2 && th.fg > 0.05) {
    ctx.fillStyle = rgb(mixc(th.tree1, [0, 0, 0], 0.72));
    for (var j = Math.floor(off / 230) - 1; j < (off + VW) / 230 + 1; j++) {
      if (rnd(j * 13.3) > 0.46) continue;
      var lx = j * 230 - off + rnd(j * 4.4) * 90, sw2 = Math.sin(t * 0.8 + j) * 4;
      ctx.beginPath(); ctx.moveTo(lx, -8);
      ctx.quadraticCurveTo(lx + 28 + sw2, 30, lx + 50 + sw2, 72);
      ctx.quadraticCurveTo(lx + 14 + sw2, 28, lx + 10, -8);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
// Small sounds that prove something is alive out there.
function chirp(f0, f1, dur, type, vol, delay) {
  if (muted || !audioInit() || !ac) return;
  try {
    var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + (delay || 0);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(sfxGain || master); o.start(t0); o.stop(t0 + dur + 0.06);
  } catch (e) {}
}
var lifeSnd = 3;
function lifeTick(dt) {
  if (S.mode !== 'play' || muted || !ac) return;
  lifeSnd -= dt;
  if (lifeSnd > 0) return;
  lifeSnd = 3.4 + Math.random() * 6.5;
  var zi = zoneIndex(S.p.x), r = Math.random();
  if (zi === 0) {
    if (r < 0.6) { chirp(720, 1450, 0.18, 'sine', 0.045); chirp(880, 1180, 0.13, 'sine', 0.03, 0.21); }
    else noise(0.7, 380, 900, 'bandpass', 0.02, 0.7);
  } else if (zi === 1) {
    if (r < 0.55) { chirp(2100, 3100, 0.07, 'sine', 0.03); chirp(2400, 2900, 0.05, 'sine', 0.022, 0.1); }
    else if (r < 0.8) chirp(340, 250, 0.4, 'triangle', 0.03);
    else noise(0.5, 2600, 3200, 'bandpass', 0.018, 0.9);
  } else if (zi === 2) {
    if (r < 0.7) chirp(1500, 240, 0.14, 'sine', 0.05);
    else noise(0.9, 120, 60, 'lowpass', 0.035, 0.6);
  } else if (zi === 3) {
    if (r < 0.45) noise(1.7, 130, 55, 'lowpass', 0.05, 0.6);
    else noise(0.9, 500, 1100, 'bandpass', 0.028, 0.8);
  } else {
    if (r < 0.5) noise(1.1, 420, 900, 'bandpass', 0.035, 0.8);
    else if (r < 0.8) chirp(1150, 1600, 0.22, 'sine', 0.028);
    else chirp(700, 1300, 0.16, 'sine', 0.025);
  }
}

function render() {
  cam = S.cam;
  var shx = S.shake > 0 && !REDUCE ? (Math.random() - 0.5) * 7 * Math.min(1, S.shake * 3) : 0;
  var shy = S.shake > 0 && !REDUCE ? (Math.random() - 0.5) * 5 * Math.min(1, S.shake * 3) : 0;
  ctx.setTransform(SC, 0, 0, SC, shx * SC, shy * SC);
  var cx = cam + VW / 2, th = themeAt(cx), cave = caveAmt(cx);
  var artDrawn = drawBackdrop();
  plateLife(th);
  if (!artDrawn) {
    drawSky(th, cave);
    drawSea(th);
    drawFar(th);
    if (!gfxLite && cave < 0.7) hazeBand(mixc(th.skyB, th.far, 0.55), GROUND - 110, 130, 0.24);
    drawDistantTower(th);
    treeLayer(0.3, 230, 150, 'tree2', 1, th);
    if (!gfxLite && cave < 0.7) hazeBand(mixc(th.skyB, th.tree1, 0.5), GROUND - 95, 115, 0.17);
    treeLayer(0.6, 210, 190, 'tree1', 50, th);
  }
  if (!artDrawn) drawCaveWall(cave);
  drawGround(th);
  drawPlatforms(th);
  drawPool(th);
  drawObstacles(th);
  drawBridge();
  drawTutGate();
  drawCheckpoints();
  drawSecrets();
  drawTower();
  S.items.forEach(drawItem);
  barriers().forEach(function (b) { if (b.on && b.kind === 'vine') drawVines(b); });
  S.enemies.forEach(function (e) { if (e.dying > 0.2 || e.x - cam < -120 || e.x - cam > VW + 120) return; var big = e.type === 'boss' ? 54 : e.type === 'panther' ? 34 : e.type === 'boar' ? 28 : 18; if (e.type === 'bat') shadowAt(e.x, GROUND, 10, 0.18); else shadowAt(e.x, e.y, big, 0.4); });
  S.enemies.forEach(function (e) { if (e.type === 'boss' || e.type === 'panther') return; drawEnemy(e); });
  S.enemies.forEach(function (e) { if (e.type === 'boss' || e.type === 'panther') drawEnemy(e); });
  drawHunter();
  drawHazards();
  drawTie();
  if (S.mode === 'play' && S.p.rope && nearGate()) drawPrompt(S.p.x - cam, S.p.y - 84, touchMode ? 'Use' : 'E', 'Tie the rope');
  if (S.p.lantern && nearTower()) drawPrompt(S.p.x - cam, S.p.y - 84, touchMode ? 'Use' : 'E', 'Light the beacon');
  drawLanternFlight();
  S.spears.forEach(function (s) {
    ctx.save(); ctx.translate(s.x - cam, s.y); ctx.rotate(s.mode === 'stuck' ? (s.vx > 0 ? 0.5 : Math.PI - 0.5) : s.ang);
    ctx.globalAlpha = s.mode === 'stuck' ? Math.max(0, 1 - s.t / 0.8) : 1; drawSpearShape(40); ctx.restore();
  });
  ctx.globalAlpha = 1;
  S.parts.forEach(function (q) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(q.x - cam, q.y, q.r, 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  drawAtmosphere(th, cave);
  // foreground tufts and leaves
  if (th.fg > 0.05) {
    var off = cam * 1.35;
    ctx.fillStyle = rgb(mixc(th.tree2, [0, 0, 0], 0.4));
    for (var i = Math.floor(off / 260) - 1; i < (off + VW) / 260 + 1; i++) {
      if (rnd(i * 17 + 5) > th.fg * 0.6) continue;
      var lx = i * 260 - off + rnd(i + 9) * 120;
      ctx.beginPath(); ctx.moveTo(lx, H + 2); ctx.quadraticCurveTo(lx + 10, H - 34 - rnd(i) * 26, lx + 36, H - 6 - rnd(i + 3) * 8); ctx.quadraticCurveTo(lx + 22, H - 8, lx + 40, H + 2); ctx.fill();
    }
  }
  // fireflies
  if (th.fire > 0.05) {
    flies.forEach(function (f) {
      var x = ((f.x - cam * 0.8 + Math.sin(S.t * 0.7 + f.ph) * 22) % (VW + 40) + VW + 40) % (VW + 40) - 20, y = f.y + Math.sin(S.t * 1.1 + f.ph) * 14;
      ctx.globalAlpha = th.fire * (0.4 + 0.6 * Math.abs(Math.sin(S.t * 2 + f.ph)));
      ctx.fillStyle = '#e9ff9a'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  drawNearLayer(th);
  // floating text
  S.floaters.forEach(function (f) {
    ctx.globalAlpha = clamp(1.1 - f.t, 0, 1); ctx.fillStyle = f.col; ctx.font = '400 15px "Lilita One", sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3; ctx.strokeText(f.text, f.x - cam, f.y); ctx.fillText(f.text, f.x - cam, f.y);
  });
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  // cave darkness with light around the hunter and glowing things
  if (cave > 0.01) {
    var p = S.p;
    dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, dk.width, dk.height);
    dctx.fillStyle = 'rgba(1,3,5,' + (0.96 * cave) + ')'; dctx.fillRect(0, 0, dk.width, dk.height);
    dctx.setTransform(SC, 0, 0, SC, 0, 0); dctx.globalCompositeOperation = 'destination-out';
    var hole = function (x, y, r, a) { var g = dctx.createRadialGradient(x, y, r * 0.15, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.fillRect(x - r, y - r, r * 2, r * 2); };
    var flick = 1 + 0.04 * Math.sin(S.t * 11);
    hole(p.x - cam, p.y - 30, (p.lantern ? 250 : 120) * flick, 1);
    S.items.forEach(function (it) { if (!it.got && it.type === 'lantern') hole(it.x - cam, it.y, 90, 0.95); });
    hole(POOL.x + POOL.w / 2 - cam, GROUND, 80, 0.7);
    S.enemies.forEach(function (e) { if (e.type === 'bat' && !e.dying) hole(e.x - cam, e.y - 8, 26, 0.6); });
    S.spears.forEach(function (s) { hole(s.x - cam, s.y, 30, 0.6); });
    S.falls.forEach(function (f) { hole(f.x - cam, f.state === 'warn' ? GROUND - 10 : f.y, 44, 0.8); });
    if (p.lantern) {
      ctx.globalCompositeOperation = 'lighter';
      var wg = ctx.createRadialGradient(p.x - cam, p.y - 30, 6, p.x - cam, p.y - 30, 230);
      wg.addColorStop(0, 'rgba(255,170,70,0.28)'); wg.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, VW, H); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dk, 0, 0); ctx.setTransform(SC, 0, 0, SC, shx * SC, shy * SC);
  }
  // colour grade: cool air up top, warm light near the horizon
  if (!gfxLite) {
    var grade = ctx.createLinearGradient(0, 0, 0, H);
    grade.addColorStop(0, 'rgba(48,74,168,0.10)');
    grade.addColorStop(0.55, 'rgba(255,196,130,0.045)');
    grade.addColorStop(1, 'rgba(26,10,46,0.11)');
    ctx.fillStyle = grade; ctx.fillRect(0, 0, VW, H);
  }
  // fixed film grain, laid over backdrop and props alike
  if (!gfxLite) {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.55;
    ctx.fillStyle = grainTexture(); ctx.fillRect(0, 0, VW, H); ctx.restore();
  }
  // vignette and hit flash
  var vg = ctx.createRadialGradient(VW / 2, H / 2, H * 0.55, VW / 2, H / 2, VW * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, H);
  if (S.p.inv > 1.0 && S.mode === 'play') { ctx.fillStyle = 'rgba(220,40,30,' + (S.p.inv - 1.0) * 0.9 + ')'; ctx.fillRect(0, 0, VW, H); }
  if (S.flash > 0) { ctx.fillStyle = 'rgba(255,240,190,' + Math.min(1, S.flash * 1.6) * (REDUCE ? 0.45 : 1) + ')'; ctx.fillRect(0, 0, VW, H); }
  if (S.blink > 0) { ctx.fillStyle = 'rgba(3,5,10,' + Math.min(1, S.blink) + ')'; ctx.fillRect(0, 0, VW, H); }
}

// Light shafts, mist, rain, lightning, sea foam and film grain.
var grain = document.createElement('canvas'); grain.width = grain.height = 96;
(function () { var g = grain.getContext('2d'), id = g.createImageData(96, 96); for (var i = 0; i < id.data.length; i += 4) { var v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); })();
var rain = []; for (var ri = 0; ri < 110; ri++) rain.push({ x: Math.random() * 700, y: Math.random() * 380, l: 8 + Math.random() * 10, s: 380 + Math.random() * 260 });
function drawAtmosphere(th, cave) {
  var cx = cam + VW / 2, jung = sm((cx - 1300) / 300) * (1 - sm((cx - 3500) / 300));
  // sunbeams through the canopy
  if (jung > 0.02) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 5; i++) {
      var x = ((i * 190 + 40 - cam * 0.5) % (VW + 220) + VW + 220) % (VW + 220) - 60, sw = 0.6 + 0.4 * Math.sin(S.t * 0.4 + i * 2);
      var g = ctx.createLinearGradient(x, 0, x + 70, GROUND); g.addColorStop(0, 'rgba(255,240,170,' + 0.13 * jung * sw + ')'); g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 34, 0); ctx.lineTo(x + 130, GROUND); ctx.lineTo(x + 62, GROUND); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // ground mist: jungle, the chasm and the cave floor
  var mist = jung * 0.5 + sm((cx - 5100) / 200) * (1 - sm((cx - 5900) / 200)) * 0.8 + cave * 0.35;
  if (mist > 0.02) {
    for (var m = 0; m < 3; m++) {
      var mx = ((m * 330 - cam * (0.25 + m * 0.12) + S.t * (6 + m * 3)) % (VW + 360) + VW + 360) % (VW + 360) - 180;
      var mg = ctx.createRadialGradient(mx, GROUND - 6 - m * 4, 4, mx, GROUND - 6 - m * 4, 190);
      mg.addColorStop(0, 'rgba(200,220,215,' + 0.16 * mist + ')'); mg.addColorStop(1, 'rgba(200,220,215,0)');
      ctx.save(); ctx.translate(0, GROUND - 6 - m * 4); ctx.scale(1, 0.22); ctx.translate(0, -(GROUND - 6 - m * 4));
      ctx.fillStyle = mg; ctx.fillRect(mx - 190, GROUND - 200 - m * 4, 380, 400); ctx.restore();
    }
  }
  // beach foam along the water
  if (th.sea > 0.3 && cx < 1700) {
    ctx.globalAlpha = th.sea * 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.6;
    for (var f = 0; f < 4; f++) {
      var fy = 262 + f * 7, off = Math.sin(S.t * 0.8 + f * 1.7) * 10;
      ctx.beginPath(); for (var fx = -20; fx <= VW + 20; fx += 20) { var yy = fy + Math.sin(fx * 0.05 + S.t * 1.3 + f) * 1.6; if (fx === -20) ctx.moveTo(fx + off, yy); else ctx.lineTo(fx + off, yy); } ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // storm: rain and lightning
  var sa = stormAmt(cx);
  if (sa > 0.02) {
    ctx.strokeStyle = 'rgba(190,210,235,' + 0.35 * sa + ')'; ctx.lineWidth = 1; ctx.beginPath();
    var dt2 = 1 / 60;
    for (var r = 0; r < rain.length; r++) {
      var q = rain[r]; q.y += q.s * dt2; q.x -= q.s * 0.28 * dt2;
      if (q.y > H) { q.y = -10; q.x = Math.random() * (VW + 120); } if (q.x < -20) q.x += VW + 120;
      ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.l * 0.28, q.y + q.l);
    }
    ctx.stroke();
    if (S.bolt > 0) { ctx.fillStyle = 'rgba(210,225,255,' + Math.min(0.45, S.bolt * (Math.random() > 0.6 ? 1.6 : 0.6)) * sa + ')'; ctx.fillRect(0, 0, VW, H); }
  }
  // film grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  var gx = (Math.random() * 96) | 0, gy2 = (Math.random() * 96) | 0;
  for (var yy2 = -gy2; yy2 < H; yy2 += 96) for (var xx = -gx; xx < VW; xx += 96) ctx.drawImage(grain, xx, yy2);
  ctx.restore();
}

// ---------------------------------------------------------------- layout
var stage = $('stage'), ctl = $('ctl'), barEl = document.querySelector('.bar');
function layout() {
  var coarse = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
  coarsePointer = !!coarse;
  // A phone or tablet held upright gets its play area turned a quarter turn, so the game
  // is already a landscape frame and reads the moment the device is tipped sideways.
  var upright = innerHeight > innerWidth * 1.02;
  forced = coarsePointer && rotDeg() !== 0 && !fsActive() && upright;
  applyRotation(forced);
  var flipBtn = $('flip');
  if (flipBtn) flipBtn.hidden = !(coarsePointer && upright);
  var PW = forced ? innerHeight : innerWidth, PH = forced ? innerWidth : innerHeight;
  var land = forced || (innerWidth > innerHeight && innerHeight < 520);
  var showCtl = coarse || PW < 700;
  touchMode = showCtl;
  ctl.hidden = !showCtl;
  $('keys').hidden = showCtl;
  var wrapW = Math.min(PW - (forced ? 8 : 32), forced ? PW : 960);
  // the pad floats over the picture, so the picture gets every pixel left over
  var hAvail = Math.max(200, PH - barEl.offsetHeight - (showCtl ? (forced ? 8 : 14) : 48));
  var asp = wrapW / hAvail;
  VW = asp >= 1.45 ? 640 : (asp >= 1.0 ? 480 : 340);
  var w = Math.min(wrapW, hAvail * VW / H), h = w * H / VW;
  stage.style.width = Math.round(w) + 'px'; stage.style.height = Math.round(h) + 'px';
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  dk.width = cv.width; dk.height = cv.height;
  SC = cv.width / VW;
  var trk = $('track');
  if (trk) trk.classList.toggle('compact', h < 352);
  if (S) S.cam = clamp(S.cam, 0, WORLD - VW);
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });

// ---------------------------------------------------------------- phone display
// Tap start and the game takes the whole screen and, where the browser allows it,
// locks itself to landscape. iOS has no orientation lock, so a portrait device gets
// a gentle rotate prompt with a way to keep playing as is.
var coarsePointer = false, forced = false, rotStep = 0;
var ROT_STEPS = [90, -90, 0];   // quarter turn one way, the other way, or leave it upright
function fsActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}
function lockLandscape() {
  try {
    var so = screen.orientation || screen.msOrientation;
    if (so && so.lock) { var p = so.lock('landscape'); if (p && p.catch) p.catch(function () {}); }
  } catch (e) { /* browser refuses: the rotate prompt covers it */ }
}
function enterFull() {
  var el = document.documentElement;
  if (!fsActive()) {
    try {
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' })
        : el.webkitRequestFullscreen ? el.webkitRequestFullscreen()
        : el.msRequestFullscreen ? el.msRequestFullscreen() : null;
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* not supported, stay inline */ }
  }
  lockLandscape();
  setTimeout(layout, 260);
}
function exitFull() {
  try {
    var p = document.exitFullscreen ? document.exitFullscreen()
      : document.webkitExitFullscreen ? document.webkitExitFullscreen() : null;
    if (p && p.catch) p.catch(function () {});
  } catch (e) { /* nothing to leave */ }
  setTimeout(layout, 260);
}
function syncFullBtn() {
  var b = $('full'); if (!b) return;
  var on = fsActive();
  b.textContent = on ? 'Exit full screen' : 'Full screen';
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  document.documentElement.classList.toggle('playing', on);
}
function rotDeg() { return ROT_STEPS[rotStep]; }
function applyRotation(on) {
  var w = document.querySelector('.wrap'); if (!w) return;
  var s = w.style, root = document.documentElement;
  if (on) {
    s.position = 'fixed'; s.top = '50%'; s.left = '50%';
    s.width = innerHeight + 'px'; s.height = innerWidth + 'px';
    s.maxWidth = 'none'; s.margin = '0'; s.padding = '0'; s.overflow = 'hidden';
    s.transformOrigin = '50% 50%';
    s.transform = 'translate(-50%, -50%) rotate(' + rotDeg() + 'deg)';
    root.classList.add('fl');
  } else if (root.classList.contains('fl')) {
    ['position', 'top', 'left', 'width', 'height', 'maxWidth', 'margin', 'padding', 'overflow', 'transformOrigin', 'transform']
      .forEach(function (k) { s[k] = ''; });
    root.classList.remove('fl');
  }
  var b = $('flip');
  if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
}
['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (ev) {
  document.addEventListener(ev, function () { syncFullBtn(); setTimeout(layout, 80); });
});
if (screen.orientation && screen.orientation.addEventListener) {
  screen.orientation.addEventListener('change', function () { lockLandscape(); setTimeout(layout, 160); });
}
$('full').addEventListener('click', function () { if (fsActive()) exitFull(); else enterFull(); });
$('flip').addEventListener('click', function () {
  rotStep = (rotStep + 1) % ROT_STEPS.length;   // quarter turn, the other quarter, upright
  layout();
});
syncFullBtn();

// ---------------------------------------------------------------- input
var CODE = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyX: 'throw_', KeyJ: 'throw_', KeyK: 'throw_', KeyZ: 'throw_', KeyE: 'use', ArrowDown: 'use', KeyS: 'use' };
document.addEventListener('keydown', function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); e.preventDefault(); return; }
  var k = CODE[e.code];
  if (!k || S.mode !== 'play') { return; }
  e.preventDefault();
  if (k === 'use') { useEdge = true; return; }
  if (k === 'jump' && !keys.jump) jumpEdge = true;
  keys[k] = true;
});
document.addEventListener('keyup', function (e) { var k = CODE[e.code]; if (k && k !== 'use') { keys[k] = false; } });
window.addEventListener('blur', function () { keys.left = keys.right = keys.jump = keys.throw_ = false; if (S && S.mode === 'play') pause(); });
document.addEventListener('visibilitychange', function () {
  if (document.hidden && S && S.mode === 'play') pause();
  if (!ac) return;
  try { if (document.hidden) ac.suspend(); else ac.resume(); } catch (e) { /* audio not available */ }
});

function bindPad(id, key) {
  var el = $(id);
  function down(e) { e.preventDefault(); if (key === 'jump' && !keys.jump) jumpEdge = true; keys[key] = true; el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
  function up(e) { e.preventDefault(); keys[key] = false; el.classList.remove('down'); }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
bindPad('b-jump', 'jump'); bindPad('b-throw', 'throw_');

// ---------------------------------------------------------------- gamepad
var padPrev = { jump: false, atk: false, use: false, start: false }, padLive = false;
function padBtn(b, i) {
  var x = b && b[i];
  if (!x) return false;
  return typeof x === 'object' ? (x.pressed || x.value > 0.5) : x > 0.5;
}
function pollPad() {
  if (!navigator.getGamepads) return;
  var list = navigator.getGamepads(), g = null, i;
  for (i = 0; i < list.length; i++) { if (list[i] && list[i].connected) { g = list[i]; break; } }
  if (!g) { padAx = 0; padPrev.jump = padPrev.atk = padPrev.use = padPrev.start = false; padLive = false; return; }
  if (!padLive) { padLive = true; toast('Controller connected. Stick to walk, A jump, X strike, B use.', 3200); }
  var b = g.buttons || [];
  var ax = (g.axes && g.axes.length) ? g.axes[0] : 0, dz = 0.2;
  ax = Math.abs(ax) < dz ? 0 : (ax < 0 ? -1 : 1) * (Math.abs(ax) - dz) / (1 - dz);
  if (padBtn(b, 14)) ax = -1; else if (padBtn(b, 15)) ax = 1;
  padAx = clamp(ax, -1, 1);
  var jump = padBtn(b, 0), atk = padBtn(b, 2) || padBtn(b, 5) || padBtn(b, 4), use = padBtn(b, 1) || padBtn(b, 3), start = padBtn(b, 9);
  var playing = S.mode === 'play';
  if (jump && !padPrev.jump && playing) jumpEdge = true;
  if (atk && !padPrev.atk && playing) attackEdge = true;
  if (use && !padPrev.use && playing) useEdge = true;
  if (start && !padPrev.start) { if (playing) pause(); else if (S.mode === 'paused') resume(); }
  if (S.mode === 'title' && ((jump && !padPrev.jump) || (start && !padPrev.start))) startGame();
  padPrev.jump = jump; padPrev.atk = atk; padPrev.use = use; padPrev.start = start;
}
window.addEventListener('gamepadconnected', function () { padLive = false; });

// ---------------------------------------------------------------- on-screen stick
(function () {
  var el = $('stick'), knob = $('knob'), R = 40, pid = null, cx = 0, cy = 0;
  function place(nx, ny) {
    knob.style.transform = 'translate(' + (nx * R).toFixed(1) + 'px,' + (ny * R * 0.75).toFixed(1) + 'px)';
  }
  function read(e) {
    var dx = e.clientX - cx, dy = e.clientY - cy;
    if (forced && rotDeg() !== 0) { var t0 = dx; dx = rotDeg() > 0 ? dy : -dy; dy = rotDeg() > 0 ? -t0 : t0; }
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.001) { place(0, 0); stickAx = 0; return; }
    var k = Math.min(1, d / R), nx = (dx / d) * k, ny = (dy / d) * k;
    place(nx, ny);
    var a = Math.abs(nx) < 0.16 ? 0 : ((nx < 0 ? -1 : 1) * (Math.abs(nx) - 0.16)) / 0.84;
    stickAx = clamp(a, -1, 1);
    el.setAttribute('aria-valuenow', stickAx.toFixed(2));
  }
  function end(e) {
    if (pid !== null && e && e.pointerId !== undefined && e.pointerId !== pid) return;
    pid = null; stickAx = 0; el.classList.remove('act'); place(0, 0); el.setAttribute('aria-valuenow', '0');
  }
  el.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var r = el.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    pid = e.pointerId; el.classList.add('act');
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    read(e);
  });
  el.addEventListener('pointermove', function (e) { if (pid === e.pointerId) { e.preventDefault(); read(e); } });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();

// A short tap when something lands.
function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignore */ } } }
(function () {
  var el = $('b-use');
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); useEdge = true; el.classList.add('down'); });
  el.addEventListener('pointerup', function () { el.classList.remove('down'); });
  el.addEventListener('pointercancel', function () { el.classList.remove('down'); });
  el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();

function pause() {
  if (S.mode !== 'play') return;
  S.mode = 'paused';
  showOverlay('<p class="kicker">Paused</p><h2>Catch your breath</h2><button class="primary" id="resume" type="button">Keep hunting</button>' +
    '<button class="tiny" id="tutagain" type="button">Replay the basics</button>' +
    '<button class="tiny" id="pauseset" type="button">Settings and controls</button>');
  $('pauseset').addEventListener('click', openSettings);
  $('resume').addEventListener('click', resume);
  $('tutagain').addEventListener('click', function () { TUT.force = true; startGame(); });
  $('resume').focus();
}
function resume() { if (S.mode !== 'paused') return; S.mode = 'play'; $('ov').hidden = true; last = performance.now(); }
function togglePause() { if (S.mode === 'play') pause(); else if (S.mode === 'paused') resume(); }

// Click or tap anywhere on the game to attack.
cv.addEventListener('pointerdown', function () { if (S.mode === 'play') attackEdge = true; });
$('start').addEventListener('click', startGame);
function hungerCard(on) {
  var c = $('hcard'), f = $('food');
  var show = on === undefined ? c.hidden : on;
  c.hidden = !show;
  f.setAttribute('aria-expanded', show ? 'true' : 'false');
}
$('food').addEventListener('click', function () { hungerCard(); });
$('food').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hungerCard(); } });
$('thead').addEventListener('click', function () {
  var t = $('track'), on = t.classList.toggle('open');
  this.setAttribute('aria-expanded', on ? 'true' : 'false');
});
$('tutok').addEventListener('click', function () { if (TUT.on) { var st = TUT_STEPS[TUT.step]; if (st) st.pressed = true; } });
$('tutskip').addEventListener('click', function () { if (TUT.on) tutEnd(); });
$('tutagain').addEventListener('click', function () { TUT.force = true; startGame(); });
if (tutStored()) $('tutagain').hidden = false;   // returning players can pick the lesson again
function syncMuteBtn() {
  var b = $('mute');
  b.textContent = muted ? 'Sound off' : 'Sound on';
  b.setAttribute('aria-pressed', String(muted));
}
$('mute').addEventListener('click', function () { muted = !muted; syncMuteBtn(); applyAudio(); });

// ---------------------------------------------------------------- settings panel
function setSwitch(sel, on) {
  var el = typeof sel === 'string' ? $(sel) : sel;
  el.setAttribute('aria-pressed', on ? 'true' : 'false');
  el.textContent = on ? 'On' : 'Off';
  el.classList.toggle('on', !!on);
}
function syncSettings() {
  $('volV').value = prefs.vol; $('volN').textContent = prefs.vol;
  $('musV').value = prefs.music; setSwitch('musT', prefs.musicOn);
  $('sfxV').value = prefs.sfx; setSwitch('sfxT', prefs.sfxOn);
  document.querySelectorAll('.seg button[data-diff]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-diff') === prefs.diff); b.setAttribute('aria-pressed', String(b.getAttribute('data-diff') === prefs.diff)); });
  document.querySelectorAll('.seg button[data-motion]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-motion') === prefs.motion); b.setAttribute('aria-pressed', String(b.getAttribute('data-motion') === prefs.motion)); });
  $('dnote').textContent = diffNow().note;
}
function openSettings() {
  syncSettings();
  $('set').hidden = false;
  if (S.mode === 'play') { S.mode = 'paused'; }
  $('setclose').focus();
}
function closeSettings() {
  $('set').hidden = true;
  if (S.mode === 'paused' && $('ov').hidden) { S.mode = 'play'; last = performance.now(); }
}
$('setbtn').addEventListener('click', openSettings);
$('titleset').addEventListener('click', openSettings);
$('setclose').addEventListener('click', closeSettings);
$('set').addEventListener('pointerdown', function (e) { if (e.target === this) closeSettings(); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !$('set').hidden) { closeSettings(); e.preventDefault(); return; }
  if (e.key === 'Escape' && S.mode === 'paused') { resume(); e.preventDefault(); return; }
  if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey) { muted = !muted; syncMuteBtn(); applyAudio(); }
});
$('volV').addEventListener('input', function () { prefs.vol = +this.value; $('volN').textContent = this.value; muted = prefs.vol > 0 ? false : muted; syncMuteBtn(); applyAudio(); prefsSave(); });
$('musV').addEventListener('input', function () { prefs.music = +this.value; prefs.musicOn = prefs.music > 0; syncSettings(); applyAudio(); prefsSave(); });
$('sfxV').addEventListener('input', function () { prefs.sfx = +this.value; prefs.sfxOn = prefs.sfx > 0; syncSettings(); applyAudio(); prefsSave(); });
$('musT').addEventListener('click', function () { prefs.musicOn = !prefs.musicOn; syncSettings(); applyAudio(); prefsSave(); });
$('sfxT').addEventListener('click', function () { prefs.sfxOn = !prefs.sfxOn; syncSettings(); applyAudio(); prefsSave(); });
document.querySelectorAll('.seg button[data-diff]').forEach(function (b) {
  b.addEventListener('click', function () { prefs.diff = b.getAttribute('data-diff'); syncSettings(); prefsSave(); toast('Difficulty: ' + diffNow().name + '. ' + diffNow().note, 3600); });
});
document.querySelectorAll('.seg button[data-motion]').forEach(function (b) {
  b.addEventListener('click', function () { prefs.motion = b.getAttribute('data-motion'); applyMotion(); syncSettings(); prefsSave(); });
});
if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').addEventListener) {
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () { if (prefs.motion === 'auto') applyMotion(); });
}

// ---------------------------------------------------------------- main loop
var last = performance.now(), acc = 0;
function frame(now) {
  if (window.__LH_TEST && window.__LH_LOOP === 0) { last = now; ambientUpdate(); render(); requestAnimationFrame(frame); return; }
  var rawDt = (now - last) / 1000, dt = Math.min(0.1, rawDt);
  last = now;
  pollPad();
  // Keep the look, but shed the optional polish on a slow device.
  if (rawDt > 0 && rawDt < 0.5) { gfxAcc += rawDt; gfxN++; }
  if (gfxN >= 90) {
    var avg = gfxAcc / gfxN;
    if (avg > 0.028 && !gfxLite) gfxLite = true;
    else if (avg < 0.017 && gfxLite) gfxLite = false;
    gfxAcc = 0; gfxN = 0;
  }
  if (S.mode === 'play' || S.mode === 'winning' || S.mode === 'dead' || S.mode === 'won') {
    acc += dt;
    while (acc > 1 / 60) { step(1 / 60); acc -= 1 / 60; }
  }
  if (S.mode === 'title') { S.t += dt; S.p.anim += dt; S.cam = 0; updateHud(); }
  ambientUpdate();
  lifeTick(dt);
  render();
  requestAnimationFrame(frame);
}

S = newState();
spawnWorld();
layout();
updateHud();
requestAnimationFrame(frame);
lbGet();   // the board is finished loading long before anyone reaches the beacon

// Test hook, only present when a test harness asks for it.
if (window.__LH_TEST) {
  window.__LH = {
    get S() { return S; },
    step: function (dt) { step(dt); },
    setLoop: function (on) { window.__LH_LOOP = on ? 1 : 0; },
    steps: function (n, dt) { var d = dt || 1 / 60; for (var i = 0; i < n; i++) step(d); },
    hurt: function (dir) { hurtPlayer(dir); },
    die: function () { die(); },
    respawn: function () { respawnAt(S.cp); },
    lbPost: function (n, cb) { lbPost(n, cb); },
    lbGet: function (cb) { lbGet(cb); },
    start: startGame,
    setKeys: function (o) { Object.keys(o).forEach(function (k) { if (k === 'use') { if (o.use) useEdge = true; return; } if (k === 'jump' && o.jump && !keys.jump) jumpEdge = true; keys[k] = o[k]; }); },
    solidAt: solidAt, PLATS: PLATS, PITS: PITS, constants: { GROUND: GROUND, WORLD: WORLD }, render: render, layout: layout, retry: retry,
    hitSecret: hitSecret, interact: interact, win: win, sunOpen: sunOpen, sunTotal: sunTotal, SECRETS: SECRETS, endingFor: endingFor,
    artOk: function () { return ART_OK.slice(); }, artW: function () { return ART.map(function (i) { return i.naturalWidth; }); }
  };
}
})();

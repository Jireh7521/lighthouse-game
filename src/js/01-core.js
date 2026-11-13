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


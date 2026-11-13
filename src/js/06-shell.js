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


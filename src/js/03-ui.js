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


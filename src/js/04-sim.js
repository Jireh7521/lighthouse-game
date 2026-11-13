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


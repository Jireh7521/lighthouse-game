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

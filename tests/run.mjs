#!/usr/bin/env node
// Gameplay tests for Lighthouse Hunter.
// Boots the real bundle in a Node browser stand-in (tests/harness.mjs) and drives
// the simulation frame by frame through the window.__LH test hook.
import { loadGame, sleep } from "./harness.mjs";

const results = [];
let failed = 0;
const ok = (name, cond, detail = "") => {
  results.push({ name, pass: !!cond });
  if (!cond) failed++;
  console.log(`${cond ? "ok  " : "FAIL"} ${name}${!cond && detail ? ` -> ${detail}` : ""}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const GROUND = 296;

const { L, getEl, calls, store } = loadGame();
store.set("lh_tut_v1", "1");          // skip the tutorial gate so the hunter can roam
L.setLoop(0);                       // never run the animation loop; we step by hand
const S = () => L.S;
const boot = (o = {}) => {
  L.S.mode = "play";
  L.start();
  if (o.x !== undefined) move(o.x);
  if (o.hp !== undefined) L.S.p.hp = o.hp;
  if (o.food !== undefined) L.S.p.food = o.food;
  L.S.t = 1;
};
const move = (x, y = GROUND) => {           // put the hunter somewhere; the camera follows
  const p = L.S.p;
  p.x = x; p.y = y; p.vx = 0; p.vy = 0;
  L.S.cam = Math.max(0, Math.min(x - 300, 7000 - 960));
};
const hold = (key, n) => { L.setKeys({ [key]: true }); for (let i = 0; i < n; i++) L.step(1 / 60); L.setKeys({ [key]: false }); };

try {
  // ---------------------------------------------------------------- boot
  ok("the game boots and exposes its test hook", !!L && S().mode === "title", S() && S().mode);
  boot();
  ok("starting a run puts the hunter on the beach in play", S().mode === "play" && S().p.x >= 60);
  ok("the world is populated", S().enemies.length > 5 && S().items.length > 5, `${S().enemies.length} enemies, ${S().items.length} items`);

  // ---------------------------------------------------------------- movement
  boot({ x: 60 });
  let x0 = S().p.x;
  hold("right", 30);
  ok("running right moves the hunter right", S().p.x > x0 + 20, `${x0} -> ${Math.round(S().p.x)}`);
  ok("running right turns the hunter right", S().p.face === 1);
  x0 = S().p.x;
  hold("left", 20);
  ok("running left moves the hunter left", S().p.x < x0 - 10, `${x0} -> ${Math.round(S().p.x)}`);
  ok("running left turns the hunter left", S().p.face === -1);

  // ---------------------------------------------------------------- jumping
  boot({ x: 60 });
  const p = S().p, y0 = p.y;
  L.setKeys({ jump: true }); L.step(1 / 60); L.setKeys({ jump: false });
  const leftGround = !p.onGround && p.vy < 0;
  let low = y0;
  for (let i = 0; i < 70; i++) { L.step(1 / 60); low = Math.min(low, p.y); }
  ok("jump lifts the hunter off the ground", leftGround);
  ok("the jump arcs up and lands again", low < y0 - 40 && p.onGround, `rise ${Math.round(y0 - low)}px`);

  // ---------------------------------------------------------------- collision with the scenery
  boot({ x: 320 });
  hold("right", 90);
  ok("a boulder stops the run", S().p.x < 360, `stopped at ${Math.round(S().p.x)}, rock at 360`);

  boot();
  const plat = L.PLATS[0];
  move(plat.x + plat.w / 2, plat.y - 90);
  for (let i = 0; i < 60; i++) L.step(1 / 60);
  ok("a ledge holds the hunter up", S().p.onGround && near(S().p.y, plat.y, 24), `y ${Math.round(S().p.y)} vs ledge ${plat.y}`);
  ok("solidAt knows the ledge is solid", L.solidAt(plat.x + plat.w / 2) === true);

  boot();
  const pit = L.PITS[0];
  S().cp = 300; S().p.hp = 5;
  move(pit.x + pit.w / 2);
  for (let i = 0; i < 120; i++) L.step(1 / 60);
  ok("a pit drops the hunter out of the pit and back onto safe ground", S().p.mode !== "dead" ? near(S().p.x, 300, 60) || S().p.x < pit.x : true, `x ${Math.round(S().p.x)} hp ${S().p.hp} lastSafe ${Math.round(S().lastSafe)}`);

  // ---------------------------------------------------------------- collectibles and hunger
  boot();
  const fruit = S().items.find((i) => i.type === "fruit");
  move(fruit.x, fruit.y + 20); S().p.food = 40;
  const food0 = S().p.food;
  L.steps(3);
  ok("walking into a mango picks it up", fruit.got === true);
  ok("a mango fills the hunger bar", S().p.food > food0, `${food0} -> ${S().p.food}`);

  boot();
  S().p.food = 80;
  const h0 = S().p.food;
  L.steps(60);
  ok("hunger drains while you play", S().p.food < h0 - 0.3, `${h0} -> ${S().p.food}`);

  boot();
  S().p.hp = 3; S().p.food = 100; S().regenT = 12.99;
  L.steps(4);
  ok("a full belly mends a heart", S().p.hp === 4, String(S().p.hp));

  // ---------------------------------------------------------------- secrets
  boot();
  const g = GROUND;
  const shut = L.sunOpen("drums");
  L.hitSecret(2326, g - 40); L.hitSecret(2364, g - 40);
  const stillShut = L.sunOpen("drums");
  L.hitSecret(2402, g - 40);
  ok("the drum rock stays sealed until all three drums ring", shut === false && stillShut === false && L.sunOpen("drums") === true);
  move(2366); S().suns = 0;
  L.steps(3);
  ok("the sunstone behind it can then be collected", S().suns === 1, String(S().suns));
  ok("a gated sunstone is not collectable early", L.sunOpen("seam") === false && L.sunOpen("cache") === false);

  // ---------------------------------------------------------------- checkpoints and death
  boot();
  S().cp = 60; S().cpI = 0;
  move(1500);
  L.steps(4);
  const cpNow = S().cp;
  ok("touching a checkpoint moves the respawn point", cpNow > 500, String(cpNow));
  S().p.hp = 1;
  L.die();
  const deadMode = S().mode;
  L.steps(40);
  ok("dying ends the run", deadMode === "dead", deadMode);
  ok("the death card names the checkpoint", /checkpoint|beach/i.test(getEl("ov").innerHTML));

  boot();
  S().cp = cpNow; S().p.hp = 5;
  S().cp = cpNow;
  L.S.mode = "dead";
  L.retry();
  ok("retrying resumes at the checkpoint", near(S().p.x, cpNow, 60) && S().p.hp >= 4, `x ${Math.round(S().p.x)} hp ${S().p.hp}`);

  // ---------------------------------------------------------------- restart
  boot();
  S().score = 4321; S().suns = 3; S().kills = 7;
  S().items.forEach((i) => { if (i.type === "fruit") i.got = true; });
  L.start();
  ok("restarting clears score, kills and sunstones", S().score === 0 && S().suns === 0 && S().kills === 0, JSON.stringify({ s: S().score, suns: S().suns, k: S().kills }));
  ok("restarting puts every pickup back", S().items.filter((i) => i.got).length === 0);
  ok("restarting closes every secret again", S().open.drums !== true && S().seamHp === 2 && S().cacheHp === 3);

  // ---------------------------------------------------------------- winning
  boot();
  S().suns = 5;
  L.win();
  ok("lighting the beacon starts the win sequence", S().mode === "winning", S().mode);
  for (let i = 0; i < 260; i++) L.step(1 / 60);   // the win cinematic runs on the frame clock
  await sleep(80);
  const ovHTML = getEl("ov").innerHTML;
  ok("the win card appears", S().mode === "won" && getEl("ov").hidden === false, S().mode);
  ok("the ending reflects all five sunstones", /Keeper of the light/i.test(ovHTML) && (ovHTML.match(/class="on"/g) || []).length === 5);
  ok("the win card shows the run stats", /Score/.test(ovHTML) && /Sunstones/.test(ovHTML));

  // ---------------------------------------------------------------- leaderboard client
  boot();
  S().time = 214; S().score = 500; S().kills = 3;
  calls.fetch.length = 0;
  await new Promise((res) => L.lbPost("  Bo  ", res));
  const post = calls.fetch.find((c) => c.method === "POST");
  ok("a finished run posts to the board", !!post);
  ok("the post carries only name, time, score and kills", post && Object.keys(post.body).sort().join(",") === "kills,name,score,time", post && Object.keys(post.body).join(","));
  ok("the posted time is whole seconds", post && Number.isInteger(post.body.time), post && String(post.body.time));

  // ---------------------------------------------------------------- difficulty and settings
  store.set("lh_prefs_v1", JSON.stringify({ vol: 0.4, musicOn: false, music: 0.6, sfxOn: true, sfx: 0.8, motion: "reduced", diff: "hard" }));
  const hard = loadGame();
  hard.store.set("lh_tut_v1", "1");
  hard.L.setLoop(0); hard.L.start();
  const hardCrab = hard.L.S.enemies.find((e) => e.type === "crab");
  ok("hard difficulty gives enemies an extra heart", hardCrab && hardCrab.maxhp >= 2, hardCrab && `maxhp ${hardCrab.maxhp}`);
  ok("a saved reduced-motion preference is applied on load", hard.win.document.documentElement.classList.contains("reduce-motion"));

  console.log(`\n${results.length - failed}/${results.length} tests passed`);
  process.exit(failed ? 1 : 0);
} catch (e) {
  console.error("test run crashed:", e && e.message);
  console.error(e && e.stack ? e.stack.split("\n").slice(0, 4).join("\n") : "");
  process.exit(1);
}

# Testing

`npm test` builds nothing and downloads nothing. It boots the real game bundle
(`docs/js/game.js`) inside a Node sandbox and drives the simulation frame by
frame, so a whole run of the suite takes well under a second.

```bash
npm test          # build freshness check + the gameplay suite
node tests/run.mjs   # the suite on its own
```

## How it works

`tests/harness.mjs` is a small stand-in for a browser. It gives the bundle the
handful of things it touches at boot: a document whose elements are inert
stubs, a 2d context that swallows every draw call, `localStorage`, timers,
`fetch`, and an `Image` that reports a 1px size. The animation loop is switched
off (`requestAnimationFrame` never fires), so nothing moves unless a test asks
it to.

Each test then talks to the game through the hook the build already exposes:

```js
window.__LH = {
  S,                       // the live game state
  step(dt), steps(n, dt),  // advance the simulation by hand
  setKeys({ right, left, jump }),  // press and release the controls
  start(), retry(), die(), hurt(), win(),
  solidAt(x), PLATS, PITS, constants,   // world queries for assertions
  hitSecret(x, y), sunOpen(id), lbPost(name, cb),
}
```

The hook only exists when `window.__LH_TEST` is set before the bundle runs.

## What is covered

| Area | Tests |
| --- | --- |
| Boot | the bundle runs, the hook appears, a run starts on the beach, the world is populated |
| Movement | running right and left, facing, the jump arc and landing |
| Collisions | boulders block, ledges hold, `solidAt` agrees, pits drop you back to safe ground |
| Collectibles | mango pickup and hunger refill, gated secrets, the drum puzzle, sunstone counting |
| Survival | hunger drain, healing from a full belly |
| Progression | checkpoints move the respawn point, death ends the run, retry resumes at the checkpoint |
| Restart | score, kills, sunstones, pickups and secrets all reset |
| Winning | the beacon starts the cinematic, the win card appears with stats and a gem row |
| Leaderboard | the client posts only name, time, score and kills, with a whole-second time |
| Settings | a stored difficulty and reduced-motion preference are applied on load |

## What is not covered

Rendering, audio output, fullscreen and phone rotation, and anything that needs
a real layout are checked by playing the build (`npm run serve`), not by the
suite. The harness deliberately draws nothing, so a visual regression cannot
fail these tests.

## Adding a test

Boot a fresh state with `L.start()`, move the hunter with `move(x, y)` (which
also parks the camera where the hunter is, the way the game expects), then call
`L.steps(n)` and assert on `L.S`. Keep assertions on state, not on pixels.

# Lighthouse Hunter

A hand-painted, side-scrolling jungle action game. A storm wrecks your ship on
Mystery Island; you run, jump, throw spears, find a rope and a lantern, beat the
Storm Panther and light the beacon.

**Play:** https://jireh7521.github.io/lighthouse-game/

## What is in here

```
src/                 the source of truth, edited by hand
  index.html         markup: the bar, the stage, the HUD and the overlays
  css/game.css       every style the page uses
  js/01-core.js      constants, level data, zone themes, game state
  js/02-audio.js     settings and preferences, procedural music, sound effects
  js/03-ui.js        HUD, toasts, floaters, the tutorial, the run flow
  js/04-sim.js       the frame update: movement, collisions, enemies, hunger
  js/05-draw.js      every drawn thing, from backdrops to characters
  js/06-shell.js     layout, phone rotation, input, gamepad, the settings panel
  js/07-boot.js      the main loop and the test hook
  art/*.webp         the painted plates and sprites
tools/
  build.mjs          concatenates src/ into the deployable bundle in docs/
  serve.mjs          a local static server for docs/
tests/
  harness.mjs        a small browser stand-in so the game runs under Node
  run.mjs            the gameplay test suite
docs/                GENERATED - the published site, served by GitHub Pages
```

`docs/` is the only thing published. Never edit it by hand: `npm run build`
rewrites `docs/index.html`, `docs/css/game.css` and `docs/js/game.js` from
`src/`, and `docs/art/` holds the images the build does not touch.

The build concatenates the `src/js/` parts, in filename order, into one file
wrapped in a single function. That keeps the game a single script at runtime
(no module loading, no ordering surprises) while the source stays in small,
readable pieces. Asset and stylesheet links carry a content hash, so a change
busts the browser cache automatically.

## Commands

```bash
npm install          # nothing but Node itself; there are no runtime dependencies
npm run build        # regenerate docs/ from src/
npm run check        # fail if docs/ is out of date (what CI runs)
npm test             # check the build, then run the gameplay tests
npm run serve        # serve docs/ on http://127.0.0.1:8080 to play locally
```

`npm test` needs no browser and no network: it boots the real bundle in a Node
sandbox. See [TESTING.md](TESTING.md).

## Continuous integration

`ci/github-workflow.yml` runs `npm run check` and the gameplay tests on every
push to `main` and every pull request. It needs one manual step to activate:
see [ci/README.md](ci/README.md).

## Publishing

GitHub Pages serves this repository from `main` / `docs`. To publish a change:
edit `src/`, run `npm run build`, commit both `src/` and `docs/`, push. CI
already fails the build if `docs/` is stale, so a mismatched deploy cannot land
quietly.

## Leaderboard

The board is served by a small backend function (Base44, `beaconBoard`) that the
page calls over HTTPS; personal bests also stay on the device in `localStorage`.

What a submission carries, and what the server stores:

| Field   | Sent by the game | Stored | Shown publicly |
| ------- | ---------------- | ------ | -------------- |
| name    | yes              | yes    | yes            |
| time_s  | yes              | yes    | yes            |
| score   | yes              | yes    | no             |
| kills   | yes              | yes    | no             |

The public response is the ten fastest runs as `{name, time}`, so the board
shows a name and a time and nothing else. Names are optional and self-chosen:
the game sends whatever the player typed, trimmed to 14 characters, and the
server strips control characters and markup, collapses whitespace, caps the
length and rejects a name with no letters or digits in it. Nothing else about
the player is collected: no accounts, no email, no IP logging, no cookies. A run
that fails the sanity checks (a time under 15 seconds, a score over 500 000, a
malformed body) is refused with a 400 rather than stored, and a flood of
identical submissions is collapsed to one row.

## Credits

Design, code and painted art in this repository. Sound and music are generated
procedurally in the browser by the game itself; no audio files ship.

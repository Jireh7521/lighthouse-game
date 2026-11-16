#!/usr/bin/env node
// Builds the deployable site in docs/ from the sources in src/.
//   src/js/*.js   -> docs/js/game.js   (one IIFE, parts concatenated in filename order)
//   src/css/*.css -> docs/css/game.css
//   src/index.html -> docs/index.html  (stylesheet and script tags get a content hash)
//   src/static/*  -> docs/*            (icons, manifest, social card: copied byte for byte)
//   src/art/*     -> docs/art/*        (painted plates and sprites: copied byte for byte)
// `--check` rebuilds in memory and fails if the committed output is stale.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const check = process.argv.includes("--check");

const readDir = (dir) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir)).filter((f) => !f.startsWith(".")).sort()
    : [];

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 8);

const css = readDir("src/css").map((f) => readFileSync(join(root, "src/css", f), "utf8")).join("\n");
const parts = readDir("src/js").map((f) => ({ file: f, code: readFileSync(join(root, "src/js", f), "utf8") }));
if (!parts.length) {
  console.error("build: no javascript parts found in src/js");
  process.exit(1);
}
const jsBody = parts.map((p) => p.code).join("").replace(/\n+$/, "\n");
const js = "(function () {\n" + jsBody + "})();\n";

const htmlSrc = readFileSync(join(root, "src/index.html"), "utf8");
const html = htmlSrc
  .replace("<!--CSS-->", `<link rel="stylesheet" href="css/game.css?v=${hash(css)}">`)
  .replace("<!--JS-->", `<script src="js/game.js?v=${hash(js)}"></script>`);

const art = readDir("src/art").map((f) => ({
  path: `docs/art/${f}`,
  file: join(root, "src/art", f),
}));

const statics = readDir("src/static").map((f) => ({
  path: `docs/${f}`,
  file: join(root, "src/static", f),
}));

// ---- service worker: one cache keyed by a hash of everything published
const swSrc = readFileSync(join(root, "src/sw.template.js"), "utf8");
const precache = [
  "./",
  "index.html",
  `css/game.css?v=${hash(css)}`,
  `js/game.js?v=${hash(js)}`,
  ...readDir("src/static").map((f) => f),
  ...readDir("src/art").map((f) => `art/${f}`),
];
const swVersion = createHash("sha256")
  .update(css)
  .update(js)
  .update(html)
  .update(Buffer.concat([
    ...readDir("src/static").map((f) => readFileSync(join(root, "src/static", f))),
    ...readDir("src/art").map((f) => readFileSync(join(root, "src/art", f))),
  ]))
  .digest("hex")
  .slice(0, 8);
const sw = swSrc
  .replace("'__VERSION__'", JSON.stringify(swVersion))
  .replace("__FILES__", JSON.stringify(precache, null, 2));

const outputs = [
  { path: "docs/js/game.js", body: js },
  { path: "docs/css/game.css", body: css },
  { path: "docs/index.html", body: html },
  { path: "docs/sw.js", body: sw },
];

let stale = 0;
for (const out of outputs) {
  const full = join(root, out.path);
  const now = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (check) {
    if (now !== out.body) {
      console.error(`build --check: ${out.path} is out of date. Run: npm run build`);
      stale++;
    }
  } else {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, out.body);
    console.log(`built ${out.path} (${Buffer.byteLength(out.body)} bytes)`);
  }
}
for (const st of [...statics, ...art]) {
  const full = join(root, st.path);
  const now = existsSync(full) ? readFileSync(full) : null;
  const want = readFileSync(st.file);
  if (check) {
    if (!now || !now.equals(want)) {
      console.error(`build --check: ${st.path} is out of date. Run: npm run build`);
      stale++;
    }
  } else {
    mkdirSync(dirname(full), { recursive: true });
    copyFileSync(st.file, full);
    console.log(`copied ${st.path} (${want.length} bytes)`);
  }
}
if (check) {
  if (stale) process.exit(1);
  console.log(`build --check: docs/ matches src/ (${parts.length} js parts, ${Buffer.byteLength(js)} bytes of js, ${statics.length + art.length} copied files)`);
}

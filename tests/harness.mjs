// A tiny browser stand-in so the real game bundle can be driven from Node.
// It stubs only what the game touches: elements, a no-op 2d context, storage,
// timers and fetch. No rendering happens, so the simulation runs in microseconds.
import { readFileSync } from "node:fs";
import vm from "node:vm";

function ctxStub() {
  const gradient = { addColorStop() {} };
  const target = {
    canvas: null,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    measureText: () => ({ width: 10 }),
    save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === "symbol") return undefined;
      t[k] = () => {};
      return t[k];
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function el(id = "") {
  const node = {
    id, textContent: "", innerHTML: "", value: "", hidden: false, width: 1280, height: 800,
    style: {}, dataset: {}, children: new Proxy([], {
      get(t, k) { if (typeof k === "string" && /^\d+$/.test(k)) { if (!t[k]) t[k] = el("child" + k); return t[k]; } return t[k]; },
    }),
    className: "", classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, on) { if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (on) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    appendChild(c) { this.children.push(c); return c; }, focus() {}, blur() {}, click() {},
    querySelector(sel) { return getEl('sel:' + sel); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    requestFullscreen() { return Promise.resolve(); },
    getContext() { const c = ctxStub(); c.canvas = node; return c; },
  };
  return node;
}

const nodes = new Map();
const getEl = (id) => {
  if (!nodes.has(id)) nodes.set(id, el(id));
  return nodes.get(id);
};

const store = new Map();
const calls = { fetch: [] };

export function loadGame(bundlePath = new URL("../docs/js/game.js", import.meta.url).pathname) {
  const code = readFileSync(bundlePath, "utf8");
  const logs = [];
  const document = {
    documentElement: el("html"),
    body: el("body"),
    getElementById: getEl,
    createElement: (tag) => el(tag),
    querySelector: (sel) => getEl('sel:' + sel),
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    exitFullscreen: () => Promise.resolve(),
    fullscreenElement: null,
  };
  const win = {
    __LH_TEST: 1,
    __LH_LOOP: 1,
    document,
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    location: { search: "", href: "http://localhost/", reload() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i],
      get length() { return store.size; },
    },
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    setTimeout, clearTimeout, setInterval, clearInterval,
    performance,
    fetch: (u, o) => {
      calls.fetch.push({ url: String(u), method: (o && o.method) || "GET", body: o && o.body ? JSON.parse(o.body) : null });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, fastest: [] }) });
    },
    navigator: { userAgent: "node-test", vibrate() {}, maxTouchPoints: 0, getGamepads: () => [] },
    Image: class { constructor() { this.naturalWidth = 1; this.naturalHeight = 1; this.width = 1; this.height = 1; this.complete = true; this.style = {}; } addEventListener() {} set src(v) { this._src = v; } get src() { return this._src; } },
    AudioContext: function () { throw new Error("no audio in tests"); },
    console: { log: (...a) => logs.push(a.join(" ")), warn: (...a) => logs.push(a.join(" ")), error: (...a) => logs.push(a.join(" ")) },
    screen: { orientation: { lock: () => Promise.resolve(), unlock() {}, type: "landscape-primary" }, width: 1280, height: 800 },
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    alert() {},
  };
  win.window = win;
  win.self = win;
  win.globalThis = win;
  const context = vm.createContext(win);
  vm.runInContext(code, context, { filename: "game.js" });
  return { win, L: win.__LH, getEl, store, calls, logs, context };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

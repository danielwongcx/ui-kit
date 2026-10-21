/**
 * Harbour ferry — original ui-kit picture.
 * A night crossing: lit towers, black-green water, one double-ended
 * Star Ferry (Celestial Star 天星). Not derived from ascii-sharks or
 * ascii-magic-art. The skyline, moon, and water stay; only the vessel
 * wears the red hull, green promenade, and cream cabin.
 *
 * The page plays this the same way as the viaduct train: a fixed 192×108
 * square-cell frame at 15fps, halftone dots on black. Every cell is a shade
 * block plus a palette key so the shared player can size the dots.
 *
 *   import * as ferry from "./harbour.js";
 *   play(pre, ferry, { look: { look: "dots" } });
 */
const W = 192;
const H = 108;
const HORIZON = 50;
const BOAT_W = 92;
const BOAT_H = 23;
const BOAT_TOP = 51;
const SPEED = 11;
const GAP = 24;
const SPAN = W + BOAT_W + GAP;
const PHASE = (W + BOAT_W) / 2;
const LEVELS = "▁▂▃▄▅▆▇█";
const KEYS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const SKY = 1;
const BLDG = 2;
const WATER = 3;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

/* Luminance stays in the train's band: a bright field, dark silhouettes,
 * and highlights that do not blow the halftone white point. */
const ANCHORS = [
  ["#3d6ea6", "#7eacd4", "#b7cce4", 8],
  ["#9a8078", "#c8b098", 3],
  ["#d8c8a8", "#e4d4b4", 2],
  ["#141820", "#222a38", "#3a465c", 4],
  ["#d4a060", "#e4c888", 3],
  ["#c5d4e4", "#d8e2ee", 2],
  ["#2f6e84", "#4a9eb4", "#7ec8d4", 6],
  ["#a8cdd6", "#c5dde6", 2],
  ["#d4c29a", "#e0cfae", 3],
  ["#0f4a28", "#1b6e3a", "#2e9450", 4],
  ["#a0141c", "#e02830", "#ff5c50", 4],
  ["#f3eee4", 1],
  ["#dcd4c6", 1],
  ["#e4cba6", "#dcc49a", 2],
  ["#e6b454", 1],
  ["#e07068", 1],
  ["#121614", "#24302a", 2],
];

const PAL = [];
for (const a of ANCHORS) {
  const n = a[a.length - 1];
  const cs = a.slice(0, -1).map(hex);
  for (let i = 0; i < n; i++) {
    const t = (i / Math.max(1, n - 1)) * (cs.length - 1);
    const k = Math.min(cs.length - 2, Math.floor(t));
    PAL.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k));
  }
}

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);

export const meta = {
  slug: "harbour-ferry",
  name: "Harbour Ferry",
  note: "Star Ferry Celestial Star — red hull, green promenade, cream cabin — crosses a night harbour.",
  cols: W,
  rows: H,
  fps: 15,
  cell: "square",
  look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const C = {
  skyTop: hex("#3d6ea6"),
  skyMid: hex("#7eacd4"),
  skyHor: hex("#b7cce4"),
  haze: hex("#c8b098"),
  moon: hex("#e4d4b4"),
  moonEdge: hex("#d8c8a8"),
  glow: hex("#d0c0a4"),
  star: hex("#d8e2ee"),
  starDim: hex("#b7c8dc"),
  bld: hex("#161a24"),
  bldLite: hex("#3a465c"),
  brace: hex("#8ea0b4"),
  win: hex("#e4c888"),
  winCool: hex("#d8e2ee"),
  winDim: hex("#2a303c"),
  beacon: hex("#e07068"),
  waterDeep: hex("#2f6e84"),
  waterMid: hex("#4a9eb4"),
  waterLit: hex("#7ec8d4"),
  shore: hex("#c8b098"),
  reflect: hex("#c4a070"),
  path: hex("#c5dde6"),
  cream: hex("#e0cfae"),
  cream2: hex("#d4c29a"),
  white: hex("#f3eee4"),
  ivory: hex("#dcd4c6"),
  cabin: hex("#e4cba6"),
  cabinShade: hex("#dcc49a"),
  lamp: hex("#e4c888"),
  green: hex("#1b6e3a"),
  greenLite: hex("#2e9450"),
  red: hex("#e02830"),
  redDeep: hex("#a0141c"),
  redHi: hex("#ff5c50"),
  gold: hex("#e6b454"),
  band: hex("#14181e"),
  glass: hex("#141820"),
  wake: hex("#c5dde6"),
  wakeDim: hex("#8ec4d0"),
  far: hex("#d4c8b0"),
  post: hex("#1a1e28"),
  peak: hex("#141816"),
  peakLite: hex("#24302a"),
};

function hash01(x, y, s) {
  let n = Math.imul((x + 1) ^ Math.imul(s + 3, 0x9e3779b1), 0x85ebca6b) ^ Math.imul(y + 1, 0xc2b2ae35);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise2(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = (x - xi);
  const yf = (y - yi);
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const h = (px, py) => hash01(px, py, seed);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

/* Hand-placed skyline on the 192-wide grid. Heights are rows above the water. */
const BUILDINGS = [
  { x: 0, w: 9, h: 14, step: 3, lit: 0.42 },
  { x: 10, w: 6, h: 26, spire: 5, lit: 0.52 },
  { x: 17, w: 12, h: 11, step: 2, lit: 0.36 },
  { x: 30, w: 8, h: 32, antenna: 6, beacon: true, lit: 0.64 },
  { x: 39, w: 5, h: 18, lit: 0.34 },
  { x: 45, w: 12, h: 24, chevron: true, lit: 0.5 },
  { x: 58, w: 7, h: 15, lit: 0.4 },
  { x: 66, w: 10, h: 28, step: 4, lit: 0.58 },
  { x: 77, w: 5, h: 34, antenna: 6, beacon: true, lit: 0.7 },
  { x: 83, w: 11, h: 13, step: 2, lit: 0.34 },
  { x: 95, w: 8, h: 26, spire: 4, lit: 0.56 },
  { x: 104, w: 14, h: 10, step: 2, lit: 0.3 },
  { x: 119, w: 6, h: 21, lit: 0.46 },
  { x: 126, w: 9, h: 16, step: 3, lit: 0.4 },
  { x: 136, w: 7, h: 20, lit: 0.44 },
  { x: 144, w: 8, h: 12, lit: 0.28 },
  { x: 153, w: 6, h: 9, lit: 0.22 },
  { x: 160, w: 10, h: 13, step: 2, lit: 0.33 },
  { x: 171, w: 5, h: 18, lit: 0.4 },
  { x: 177, w: 15, h: 11, step: 2, lit: 0.3 },
];

/* Celestial Star, local grid. Waterline sits on the lower red, local y 20. */
const MASTS = [16, 74];
const FUNNEL_X0 = 41;
const FUNNEL_X1 = 51;

/* Side profile. u is 0 at midships and 1 at the stems. The red bottom
 * rises toward both ends; the promenade sheer rises with it. */
function starProfile(x) {
  const u = Math.abs(x - 45.5) / 45.5;
  const end = u < 0.4 ? 0 : (u - 0.4) / 0.6;
  const su = end * end * (3 - 2 * end);
  const rise = u < 0.78 ? 0 : (u - 0.78) / 0.22;
  const bottom = Math.round(lerp(21, 17, rise));
  const redTop = Math.round(lerp(17, 12, su));
  const deckTop = Math.round(lerp(13, 12, su));
  return { u, bottom, redTop, deckTop };
}

function paintStar(add, left, top) {
  const px = (x, y, c, lv) => add(left + x, top + y, c, 1, lv || 0);

  for (let x = 0; x < BOAT_W; x++) {
    const { u, bottom, redTop, deckTop } = starProfile(x);
    if (u > 0.985) continue;
    const stem = u > 0.9;
    for (let y = (stem ? redTop : deckTop); y <= bottom; y++) {
      let col = C.green;
      let lv = 1;
      if (y >= redTop) {
        col = y === redTop ? C.redHi : y >= bottom - 1 ? C.redDeep : C.red;
        lv = 1;
      } else if (y === redTop - 1) {
        col = C.gold;
        lv = 1;
      } else if (y === deckTop) {
        col = C.greenLite;
      }
      px(x, y, col, lv);
    }
    if (u < 0.74) px(x, 7, C.white, 0);
    if (u < 0.62) {
      const edge = u > 0.54;
      for (let y = 8; y <= 11; y++) {
        const win = !edge && (y === 9 || y === 10) && x % 4 !== 0;
        px(x, y, win ? C.glass : y >= 11 ? C.cabinShade : C.cabin, 0);
      }
    }
    if (u < 0.78) px(x, 12, C.ivory, 0);
  }

  for (let i = 0; i < 6; i++) {
    const x = 26 + i * 8;
    px(x, 14, C.ivory, 0);
    px(x + 1, 14, C.ivory, 0);
    px(x, 15, C.ivory, 0);
    px(x + 1, 15, C.redHi, 1);
  }

  px(2, 12, C.redHi, 1);
  px(3, 12, C.redHi, 1);
  px(BOAT_W - 4, 12, C.greenLite, 1);
  px(BOAT_W - 3, 12, C.greenLite, 1);

  for (let m = 0; m < MASTS.length; m++) {
    const mx = MASTS[m];
    for (let y = 0; y <= 7; y++) {
      px(mx, y, C.ivory, 0);
      px(mx + 1, y, C.ivory, 0);
    }
    for (let dx = -2; dx <= 3; dx++) px(mx + dx, 1, C.ivory, 0);
    px(mx, 0, C.lamp, 1);
    px(mx + 1, 0, C.ivory, 0);
  }

  for (let y = 2; y <= 6; y++) {
    const inset = y === 2 || y === 6 ? 1 : 0;
    for (let x = FUNNEL_X0 + inset; x < FUNNEL_X1 - inset; x++) {
      const band = y === 3 || y === 4;
      px(x, y, band ? C.band : C.ivory, 0);
    }
  }
  px(44, 3, C.ivory, 1);
  px(48, 3, C.ivory, 1);

  for (const base of [24, 58]) {
    for (let x = base; x < base + 12; x++) {
      const red = Math.floor((x - base) / 3) % 2 === 0;
      px(x, 6, red ? C.redHi : C.white, red ? 1 : 0);
      px(x, 7, red ? C.red : C.ivory, 0);
    }
  }

  const prop = (x, y) => {
    px(x, y, C.band, 0);
    px(x + 1, y, C.gold, 1);
    px(x + 2, y, C.band, 0);
    px(x + 1, y + 1, C.band, 0);
  };
  prop(1, starProfile(2).bottom - 1);
  prop(BOAT_W - 4, starProfile(BOAT_W - 3).bottom - 1);
}

const MOON_X = 158;
const MOON_Y = 14;
const MOON_R = 6;

function boatLeft(t) {
  let x = (t * SPEED + PHASE) % SPAN;
  if (x < 0) x += SPAN;
  return x - BOAT_W;
}

export default function create() {
  const rgb = new Float32Array(W * H * 3);
  const mask = new Uint8Array(W * H);
  const put = (x, y, c, m) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    rgb[i * 3] = c[0];
    rgb[i * 3 + 1] = c[1];
    rgb[i * 3 + 2] = c[2];
    if (m) mask[i] = m;
  };

  for (let y = 0; y < H; y++) {
    const v = y / HORIZON;
    let sky = v < 0.55 ? mix(C.skyTop, C.skyMid, v / 0.55) : mix(C.skyMid, C.skyHor, (v - 0.55) / 0.45);
    if (v > 0.72 && v < 1) sky = mix(sky, C.haze, ((v - 0.72) / 0.28) * 0.45);
    for (let x = 0; x < W; x++) {
      let c = sky;
      const d = Math.hypot(x - MOON_X, (y - MOON_Y) * 1.15);
      if (y < HORIZON) c = mix(c, C.glow, clamp(1 - (d - MOON_R) / 26, 0, 1) ** 1.6 * 0.5);
      put(x, y, c, y < HORIZON ? SKY : WATER);
    }
  }

  for (let y = HORIZON; y < H; y++) {
    const depth = (y - HORIZON) / (H - HORIZON);
    const band = depth < 0.45 ? mix(C.waterLit, C.waterMid, depth / 0.45) : mix(C.waterMid, C.waterDeep, (depth - 0.45) / 0.55);
    for (let x = 0; x < W; x++) {
      let c = band;
      const n = noise2(x / 7, y / 3, 11);
      c = mix(c, C.waterLit, n * 0.22 * (1 - depth));
      if (y < HORIZON + 7) c = mix(c, C.shore, (1 - (y - HORIZON) / 7) * 0.28);
      put(x, y, c, WATER);
    }
  }

  for (let y = MOON_Y - MOON_R; y <= MOON_Y + MOON_R; y++) {
    for (let x = MOON_X - MOON_R; x <= MOON_X + MOON_R; x++) {
      const d = Math.hypot(x - MOON_X, y - MOON_Y);
      if (d <= MOON_R) put(x, y, d > MOON_R - 1.4 ? C.moonEdge : C.moon, SKY);
    }
  }

  const rng = mulberry32(20261021);
  for (let i = 0; i < Math.round(W * 0.85); i++) {
    const x = rng() * W | 0;
    const y = 1 + (rng() * (MOON_Y + 22) | 0);
    if (y >= HORIZON || mask[y * W + x] !== SKY) continue;
    if (Math.hypot(x - MOON_X, y - MOON_Y) < MOON_R + 3) continue;
    put(x, y, rng() < 0.22 ? C.star : C.starDim, SKY);
  }

  for (let x = 0; x < W; x++) {
    const hump = Math.exp(-(((x - 168) / 30) ** 2));
    const left = Math.exp(-(((x - 22) / 40) ** 2));
    const top = 46 - 9 * hump - 5 * left - 1.5 * Math.sin(x * 0.16);
    for (let y = Math.floor(top); y < HORIZON; y++) {
      put(x, y, mix(C.peak, C.peakLite, clamp((y - top) / 7, 0, 1)), SKY);
    }
  }

  const twinkles = [];
  const beacons = [];
  for (let bi = 0; bi < BUILDINGS.length; bi++) {
    const b = BUILDINGS[bi];
    const y1 = HORIZON;
    const y0 = y1 - b.h;
    const face = mix(C.bld, C.bldLite, (bi % 5) * 0.06);
    for (let y = y0; y < y1; y++) {
      let inset = 0;
      if (b.step && y < y0 + b.step && b.w > 5) inset = 1;
      const xa = b.x + inset;
      const xb = b.x + b.w - inset;
      for (let x = xa; x < xb; x++) {
        const edge = (x - xa) / Math.max(1, xb - xa - 1);
        const grain = (hash01(x, y, 6) - 0.5) * 0.18;
        put(x, y, mix(face, C.bldLite, clamp(edge * 0.45 + grain, 0, 0.7)), BLDG);
      }
    }
    if (b.chevron) {
      const mid = y0 + Math.round(b.h * 0.42);
      for (let y = y0 + 1; y < mid; y++) {
        const v = (y - y0) / Math.max(1, mid - y0);
        put(b.x + 1 + Math.round(v * (b.w - 3)), y, C.brace, BLDG);
        put(b.x + b.w - 2 - Math.round(v * (b.w - 3)), y, C.brace, BLDG);
      }
    }
    if (b.spire || b.antenna) {
      const cx = b.x + (b.w >> 1);
      const reach = b.antenna || b.spire;
      let tip = y0;
      for (let s = 1; s <= reach; s++) {
        const y = y0 - s;
        if (y < 1) break;
        put(cx, y, C.bldLite, BLDG);
        tip = y;
      }
      if (b.beacon && tip > 1) {
        const y = tip - 1;
        beacons.push({ i: y * W + cx, phase: hash01(cx, y, 4) * 4 });
        put(cx, y, C.bldLite, BLDG);
      }
    }
    if (b.w < 3 || b.h < 5) continue;
    for (let y = y0 + 2; y < y1 - 1; y += 2) {
      for (let x = b.x + 1; x < b.x + b.w - 1; x += 2) {
        if (hash01(x, y, 2) > b.lit) continue;
        const warm = hash01(x, y, 5) < 0.78;
        const col = warm ? C.win : C.winCool;
        put(x, y, col, BLDG);
        const drop = HORIZON - y;
        const ry = HORIZON + Math.max(2, Math.round(drop * 0.42));
        if (ry < H - 10 && hash01(x, ry, 3) > 0.42) {
          put(x, ry, mix(C.waterMid, warm ? C.reflect : C.winCool, 0.55), WATER);
          if (ry + 1 < H - 8 && hash01(x, ry, 7) > 0.55) put(x, ry + 1, mix(C.waterDeep, C.reflect, 0.28), WATER);
        }
        if (hash01(x, y, 8) < 0.18) {
          twinkles.push({
            i: y * W + x,
            on: col,
            off: mix(C.bld, C.winDim, 0.4),
            phase: hash01(x, y, 9) * 8,
          });
        }
      }
    }
  }

  const posts = [8, 16, 170, 180];
  for (let p = 0; p < posts.length; p++) {
    const x = posts[p];
    const y0 = 98 + (p % 2);
    for (let y = y0; y < H; y++) {
      put(x, y, C.post, WATER);
      put(x + 1, y, C.bld, WATER);
    }
    put(x - 1, y0, C.bldLite, WATER);
    put(x, y0, C.cream2, WATER);
    put(x + 1, y0, C.cream2, WATER);
    put(x + 2, y0, C.bldLite, WATER);
  }

  const out = new Float32Array(W * H * 3);
  const adj = new Int8Array(W * H);
  const keyCache = new Int16Array(32768);
  keyCache.fill(-1);
  const nearest = (r, g, b) => {
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const hit = keyCache[key];
    if (hit >= 0) return hit;
    let best = 0;
    let bd = 1e9;
    for (let i = 0; i < PAL.length; i++) {
      const p = PAL[i];
      const d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    keyCache[key] = best;
    return best;
  };

  const rowCh = new Array(W);
  const rowCo = new Array(W);

  return (t) => {
    out.set(rgb);
    adj.fill(0);
    const band = HORIZON + 24;
    for (let y = HORIZON; y < band; y++) {
      const shift = Math.round(Math.sin(t * 0.55 + y * 0.5));
      if (!shift) continue;
      const row = y * W;
      for (let x = 0; x < W; x++) {
        let src = x - shift;
        if (src < 0) src += W;
        else if (src >= W) src -= W;
        const s = (row + src) * 3;
        const d = (row + x) * 3;
        out[d] = rgb[s];
        out[d + 1] = rgb[s + 1];
        out[d + 2] = rgb[s + 2];
      }
    }

    for (let y = HORIZON; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const wob = Math.sin(x * 0.31 + t * 0.9) * Math.sin(y * 0.22 - t * 0.35);
        adj[y * W + x] = wob > 0.62 ? 1 : wob < -0.62 ? -1 : 0;
      }
    }

    for (let y = HORIZON + 1; y < HORIZON + 32; y++) {
      const fade = 1 - (y - HORIZON) / 32;
      const wob = Math.round(Math.sin(t * 0.75 + y * 0.65));
      const width = 1 + Math.round(fade * 2);
      for (let dx = -width; dx <= width; dx++) {
        if (Math.sin(y * 1.25 + dx * 1.7 + t * 1.15) < -0.05) continue;
        const x = MOON_X + wob + dx;
        if (x < 0 || x >= W) continue;
        const i = y * W + x;
        const o = i * 3;
        const a = fade * (dx === 0 ? 0.72 : 0.4);
        out[o] = lerp(out[o], C.path[0], a);
        out[o + 1] = lerp(out[o + 1], C.path[1], a);
        out[o + 2] = lerp(out[o + 2], C.path[2], a);
        if (a > 0.35) adj[i] = 1;
      }
    }

    for (let i = 0; i < twinkles.length; i++) {
      const w = twinkles[i];
      const period = 7.5 + (w.phase % 3);
      if (((t + w.phase) % period) > 1.1) continue;
      const o = w.i * 3;
      out[o] = w.off[0];
      out[o + 1] = w.off[1];
      out[o + 2] = w.off[2];
    }
    for (let i = 0; i < beacons.length; i++) {
      const b = beacons[i];
      if (((t + b.phase) % 3.4) > 0.28) continue;
      const o = b.i * 3;
      out[o] = C.beacon[0];
      out[o + 1] = C.beacon[1];
      out[o + 2] = C.beacon[2];
      adj[b.i] = 1;
    }

    const add = (x, y, c, a, lv) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      const o = i * 3;
      out[o] = lerp(out[o], c[0], a);
      out[o + 1] = lerp(out[o + 1], c[1], a);
      out[o + 2] = lerp(out[o + 2], c[2], a);
      adj[i] = lv || 0;
    };

    const far = ((t * SPEED * 0.42 + 70) % (W + 36) + (W + 36)) % (W + 36) - 18;
    for (let ry = 0; ry < 3; ry++) {
      const inset = ry === 0 ? 4 : ry === 2 ? 1 : 0;
      for (let rx = inset; rx < 16 - inset; rx++) {
        const col = ry === 1 && rx % 4 === 1 ? C.win : C.far;
        add(far + rx, HORIZON + 2 + ry, col, 1, 0);
      }
    }

    const left = boatLeft(t);
    const top = BOAT_TOP + Math.round(Math.sin(t * 0.62) * 0.45);
    paintStar(add, left, top);

    const stern = left + 2;
    const bow = left + BOAT_W - 3;
    const waterY = top + 20;
    for (let i = 1; i <= 40; i++) {
      const fade = 1 - i / 41;
      const spread = Math.min(4, Math.round(0.3 + i * 0.1));
      const x = Math.round(stern - i);
      const col = fade > 0.55 ? C.wake : C.wakeDim;
      const a = 0.35 + fade * 0.6;
      const lv = fade > 0.4 ? 1 : 0;
      add(x, waterY, col, a, lv);
      if (waterY - spread > HORIZON) add(x, waterY - spread, C.wakeDim, a * 0.7, 0);
      if (waterY + spread < H) add(x, waterY + spread, C.wakeDim, a * 0.7, 0);
    }
    for (let i = 1; i <= 6; i++) add(bow + i, waterY, i < 3 ? C.wake : C.wakeDim, i < 3 ? 0.8 : 0.45, i < 3 ? 1 : 0);

    for (let dy = 1; dy <= 8; dy++) {
      const y = top + BOAT_H - 1 + dy;
      if (y >= H) break;
      const fade = (1 - dy / 9) * 0.62;
      for (let rx = 1; rx < BOAT_W - 1; rx++) {
        if (Math.sin(rx * 0.85 + dy * 1.3 + t * 1.05) < 0.02) continue;
        const src = (top + BOAT_H - 1 - Math.min(4, dy)) * W + Math.round(left + rx);
        if (src < 0 || src >= W * H) continue;
        const o = src * 3;
        add(left + rx, y, [out[o] * 0.7, out[o + 1] * 0.75, out[o + 2] * 0.72], fade, 0);
      }
    }

    const text = new Array(H);
    const color = new Array(H);
    for (let y = 0; y < H; y++) {
      const base = y * W;
      for (let x = 0; x < W; x++) {
        const o = (base + x) * 3;
        const r = out[o];
        const g = out[o + 1];
        const b = out[o + 2];
        const k = nearest(r, g, b);
        const yl = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = yl > 0.86 ? 7 : clamp(Math.round(5 + (yl - LUM[k]) * 12) + adj[base + x], 2, 6);
        rowCh[x] = LEVELS[lv];
        rowCo[x] = KEYS[k];
      }
      text[y] = rowCh.join("");
      color[y] = rowCo.join("");
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}

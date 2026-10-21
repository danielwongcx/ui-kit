/**
 * MTR night crossing — original ui-kit picture.
 * A silver metro with a red stripe runs an elevated guideway above the harbour.
 * Not derived from ascii-sharks, ascii-magic-art, or the harbour ferry.
 *
 * The page plays this the same way as the viaduct train and the ferry: a fixed
 * 192×108 square-cell frame at 15fps, halftone dots on black.
 *
 *   import * as mtr from "./metro.js";
 *   play(pre, mtr, { look: { look: "dots" } });
 */
const W = 192;
const H = 108;
const CARS = 4;
const CAR_W = 30;
const COUPLER = 2;
const TRAIN_W = CARS * CAR_W + (CARS - 1) * COUPLER;
const SPEED = 11;
const GAP = 28;
const SPAN = W + TRAIN_W + GAP;
const PHASE = (W + TRAIN_W) / 2;

const SHORE = 56;
const ROOF = 47;
const RAIL = 63;
const GIRDER_TOP = 65;
const GIRDER_BOT = 71;
const WATER = 73;

const LEVELS = "▁▂▃▄▅▆▇█";
const KEYS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const SKY = 1;
const BLDG = 2;
const WATER_M = 3;
const DECK = 4;
const PIER = 5;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");

/* Luminance stays in the train and ferry band so the shared halftone
 * stretches shadows to specks and the lit body to large dots. */
const ANCHORS = [
  ["#345f96", "#6e9ec8", "#b9c8d8", 8],
  ["#c4b09a", "#d4c4ae", 3],
  ["#e6d6b6", "#f3e6cc", 2],
  ["#d5e0ee", "#f4f7fb", 2],
  ["#12151c", "#1c2433", "#3c4a62", 5],
  ["#c4924a", "#f0d090", 3],
  ["#9eb4c8", "#d5e2ee", 2],
  ["#1c4e66", "#3d8aa6", "#7ec6d4", 6],
  ["#6e6860", "#a8a196", "#ddd4c8", 4],
  ["#8e98a4", "#d0d8e0", 2],
  ["#cbbfae", "#e7dccb", "#f6f0e6", 4],
  ["#8a8176", "#5c564e", 2],
  ["#9a1e28", "#e23a38", "#ff6a60", 4],
  ["#e09830", "#f0c060", "#ffe0a0", 3],
  ["#fff4d4", "#fffdf8", 2],
  ["#152033", "#243044", 2],
  ["#14171d", "#2a3038", 2],
  ["#1c6e48", "#3dce7a", 2],
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
if (PAL.length > KEYS.length) throw new Error("MTR palette exceeds colour keys");

const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);

export const meta = {
  slug: "mtr-night-crossing",
  name: "MTR Night Crossing",
  note: "A silver metro with a red stripe crosses an elevated guideway above the harbour at night.",
  cols: W,
  rows: H,
  fps: 15,
  cell: "square",
  look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const C = {
  skyTop: hex("#345f96"),
  skyMid: hex("#6e9ec8"),
  skyHor: hex("#b9c8d8"),
  haze: hex("#c4b09a"),
  moon: hex("#f3e6cc"),
  moonEdge: hex("#e6d6b6"),
  glow: hex("#e4d4b4"),
  star: hex("#f4f7fb"),
  starDim: hex("#d5e0ee"),
  bld: hex("#141820"),
  bldLite: hex("#3c4a62"),
  win: hex("#f0d090"),
  winDim: hex("#c4924a"),
  winCool: hex("#d5e2ee"),
  waterDeep: hex("#1c4e66"),
  waterMid: hex("#3d8aa6"),
  waterLit: hex("#7ec6d4"),
  conc: hex("#ddd4c8"),
  concMid: hex("#a8a196"),
  concDark: hex("#6e6860"),
  rail: hex("#d0d8e0"),
  railDim: hex("#8e98a4"),
  ivory: hex("#d8cfc0"),
  ivoryMid: hex("#e4dcd0"),
  ivoryLo: hex("#c4b8a6"),
  shadow: hex("#8a8176"),
  under: hex("#2a3038"),
  wheel: hex("#14171d"),
  red: hex("#ff7468"),
  redMid: hex("#ff5c52"),
  redDeep: hex("#e0443c"),
  amber: hex("#ffd080"),
  dest: hex("#f0c060"),
  head: hex("#fffdf8"),
  lamp: hex("#ffe0a0"),
  glass: hex("#1a2436"),
  glassLite: hex("#243044"),
  hvac: hex("#f7f4ee"),
  hvacShade: hex("#cfc6ba"),
  signal: hex("#3dce7a"),
  hill: hex("#121614"),
  hillLite: hex("#1e2a24"),
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

/* Hand-placed towers on the 192-wide grid. Heights are rows above the shore. */
const TOWERS = [
  { x: 0, w: 11, h: 18, lit: 0.4 },
  { x: 12, w: 6, h: 30, mast: 5, lit: 0.55 },
  { x: 19, w: 14, h: 14, lit: 0.32 },
  { x: 34, w: 9, h: 36, mast: 6, beacon: true, lit: 0.62 },
  { x: 44, w: 8, h: 22, lit: 0.4 },
  { x: 53, w: 15, h: 20, crown: 11, lit: 0.48 },
  { x: 69, w: 7, h: 26, lit: 0.44 },
  { x: 77, w: 12, h: 32, step: 5, lit: 0.58 },
  { x: 90, w: 6, h: 40, mast: 6, beacon: true, lit: 0.7 },
  { x: 97, w: 16, h: 13, lit: 0.3 },
  { x: 114, w: 10, h: 44, mast: 5, taper: true, beacon: true, lit: 0.66 },
  { x: 125, w: 8, h: 24, lit: 0.42 },
  { x: 134, w: 7, h: 30, lit: 0.5 },
  { x: 142, w: 7, h: 24, bridge: 152, lit: 0.46 },
  { x: 152, w: 8, h: 28, lit: 0.52 },
  { x: 162, w: 9, h: 16, lit: 0.34 },
  { x: 172, w: 6, h: 22, lit: 0.4 },
  { x: 179, w: 13, h: 12, lit: 0.28 },
];

const PIERS = [18, 54, 90, 126, 162];
const MOON_X = 166;
const MOON_Y = 13;
const MOON_R = 5;

/* Window bays and red doors, local to a 30-wide car. */
const BAYS = [
  [1, 5],
  [10, 5],
  [19, 5],
];
const DOORS = [
  [6, 4],
  [15, 4],
  [24, 4],
];

function trainLeft(t) {
  let x = (t * SPEED + PHASE) % SPAN;
  if (x < 0) x += SPAN;
  return x - TRAIN_W;
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
    const v = y / SHORE;
    let sky = v < 0.55 ? mix(C.skyTop, C.skyMid, v / 0.55) : mix(C.skyMid, C.skyHor, (v - 0.55) / 0.45);
    if (v > 0.7 && v < 1) sky = mix(sky, C.haze, ((v - 0.7) / 0.3) * 0.42);
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - MOON_X, (y - MOON_Y) * 1.15);
      let c = sky;
      if (y < SHORE) c = mix(c, C.glow, clamp(1 - (d - MOON_R) / 24, 0, 1) ** 1.7 * 0.45);
      put(x, y, c, y < WATER ? SKY : WATER_M);
    }
  }

  for (let y = MOON_Y - MOON_R; y <= MOON_Y + MOON_R; y++) {
    for (let x = MOON_X - MOON_R; x <= MOON_X + MOON_R; x++) {
      const d = Math.hypot(x - MOON_X, y - MOON_Y);
      if (d <= MOON_R) put(x, y, d > MOON_R - 1.3 ? C.moonEdge : C.moon, SKY);
    }
  }

  const rng = mulberry32(20261021);
  for (let i = 0; i < Math.round(W * 0.7); i++) {
    const x = rng() * W | 0;
    const y = 1 + (rng() * (MOON_Y + 18) | 0);
    if (y >= SHORE - 8) continue;
    if (Math.hypot(x - MOON_X, y - MOON_Y) < MOON_R + 3) continue;
    put(x, y, rng() < 0.2 ? C.star : C.starDim, SKY);
  }

  for (let x = 0; x < W; x++) {
    const left = Math.exp(-(((x - 24) / 46) ** 2));
    const right = Math.exp(-(((x - 158) / 34) ** 2));
    const mid = Math.exp(-(((x - 96) / 80) ** 2));
    const top = SHORE - 2 - 7 * left - 9 * right - 3 * mid;
    for (let y = Math.floor(top); y < SHORE; y++) {
      put(x, y, mix(C.hill, C.hillLite, clamp((y - top) / 6, 0, 1)), SKY);
    }
  }

  const twinkles = [];
  const beacons = [];
  for (let ti = 0; ti < TOWERS.length; ti++) {
    const b = TOWERS[ti];
    const y1 = SHORE;
    const y0 = y1 - b.h;
    const face = mix(C.bld, C.bldLite, (ti % 4) * 0.07);
    for (let y = y0; y < y1; y++) {
      let inset = 0;
      if (b.taper && y < y0 + Math.round(b.h * 0.28)) inset = 1;
      if (b.step && y < y0 + b.step) inset = 1;
      const xa = b.x + inset;
      const xb = Math.min(W, b.x + b.w - inset);
      for (let x = xa; x < xb; x++) {
        const edge = (x - xa) / Math.max(1, xb - xa - 1);
        put(x, y, mix(face, C.bldLite, clamp(edge * 0.4, 0, 0.55)), BLDG);
      }
    }
    if (b.crown) {
      const cx = b.x + (b.w >> 1);
      for (let s = 1; s <= b.crown; s++) {
        const y = y0 - s;
        const half = Math.max(0, Math.round((b.w * 0.5) * (1 - s / (b.crown + 1))));
        for (let x = cx - half; x <= cx + half; x++) put(x, y, C.bldLite, BLDG);
      }
    }
    if (b.mast) {
      const cx = b.x + (b.w >> 1);
      let tip = y0 - (b.crown || 0);
      for (let s = 1; s <= b.mast; s++) {
        const y = tip - s;
        if (y < 1) break;
        put(cx, y, C.bldLite, BLDG);
        if (b.beacon && s === b.mast && y > 1) {
          beacons.push({ i: (y - 1) * W + cx, phase: hash01(cx, y, 4) * 5 });
        }
      }
    }
    if (b.bridge) {
      const yb = y0 + 8;
      for (let x = b.x + b.w; x < b.bridge; x++) {
        put(x, yb, C.bldLite, BLDG);
        put(x, yb + 1, face, BLDG);
      }
    }
    for (let y = y0 + 2; y < y1 - 1; y += 2) {
      for (let x = b.x + 1; x < b.x + b.w - 1; x += 2) {
        if (hash01(x, y, 2) > b.lit) continue;
        const warm = hash01(x, y, 5) < 0.8;
        const col = warm ? C.win : C.winCool;
        put(x, y, col, BLDG);
        const drop = SHORE - y;
        const ry = WATER + Math.round(drop * 0.42);
        if (ry > WATER + 2 && ry < H - 6 && mask[ry * W + x] !== PIER) {
          put(x, ry, mix(C.waterMid, warm ? C.winDim : C.winCool, 0.45), WATER_M);
        }
        if (hash01(x, y, 8) < 0.16) {
          twinkles.push({
            i: y * W + x,
            on: col,
            off: mix(C.bld, hex("#2a303c"), 0.45),
            phase: hash01(x, y, 9) * 9,
          });
        }
      }
    }
  }

  for (let y = WATER; y < H; y++) {
    const depth = (y - WATER) / (H - WATER);
    const band = depth < 0.4 ? mix(C.waterLit, C.waterMid, depth / 0.4) : mix(C.waterMid, C.waterDeep, (depth - 0.4) / 0.6);
    for (let x = 0; x < W; x++) {
      const n = hash01(x, y, 11);
      let c = mix(band, C.waterLit, (n - 0.35) * 0.28 * (1 - depth));
      put(x, y, c, WATER_M);
    }
  }

  for (let p = 0; p < PIERS.length; p++) {
    const cx = PIERS[p];
    for (let y = GIRDER_BOT; y < H - 2; y++) {
      const sink = (y - GIRDER_BOT) / (H - GIRDER_BOT);
      const half = y < GIRDER_BOT + 3 ? 6 : 2 + (sink > 0.72 ? 1 : 0);
      for (let x = cx - half; x <= cx + half; x++) {
        const edge = Math.abs(x - cx) / half;
        put(x, y, mix(C.concMid, C.concDark, clamp(edge * 0.65 + sink * 0.25, 0, 1)), PIER);
      }
    }
  }

  for (let y = RAIL; y <= GIRDER_BOT; y++) {
    for (let x = 0; x < W; x++) {
      let c = C.concMid;
      if (y === RAIL) c = (x % 3 === 0) ? C.railDim : C.under;
      else if (y === RAIL + 1) c = C.concDark;
      else if (y === GIRDER_TOP) c = C.conc;
      else if (y === GIRDER_BOT) c = C.concDark;
      else c = mix(C.concMid, C.concDark, (y - GIRDER_TOP) / (GIRDER_BOT - GIRDER_TOP));
      if ((x % 32) === 0 && y > GIRDER_TOP && y < GIRDER_BOT) c = C.concDark;
      put(x, y, c, DECK);
    }
  }
  for (let x = 0; x < W; x += 16) put(x, GIRDER_TOP, C.lamp, DECK);

  /* One lineside signal, far side of the guideway, clear of the centred train. */
  for (let y = ROOF + 4; y <= RAIL; y++) put(8, y, C.under, DECK);
  put(7, ROOF + 3, C.concDark, DECK);
  put(8, ROOF + 3, C.signal, DECK);
  put(9, ROOF + 3, C.concDark, DECK);

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

  const add = (x, y, c, a, lv) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    const o = i * 3;
    out[o] = lerp(out[o], c[0], a);
    out[o + 1] = lerp(out[o + 1], c[1], a);
    out[o + 2] = lerp(out[o + 2], c[2], a);
    if (lv) adj[i] = lv;
  };

  const paintCar = (ox, kind, spin, car) => {
    const y = ROOF;
    for (let ry = 0; ry <= 11; ry++) {
      for (let rx = 0; rx < CAR_W; rx++) {
        let col = C.ivory;
        if (ry === 0) col = C.ivoryMid;
        else if (ry >= 10) col = C.ivoryLo;
        else if (rx === 0 || rx === CAR_W - 1) col = C.ivoryLo;
        add(ox + rx, y + ry, col, 1, 0);
      }
    }
    const pods = [[4, 7], [17, 7]];
    for (let p = 0; p < pods.length; p++) {
      const px = ox + pods[p][0];
      const pw = pods[p][1];
      for (let rx = 0; rx < pw; rx++) {
        const edge = rx === 0 || rx === pw - 1;
        add(px + rx, y - 2, edge ? C.hvacShade : C.hvac, 1, 0);
        add(px + rx, y - 1, C.hvacShade, 1, 0);
      }
    }
    const bays = kind === "front" ? BAYS.slice(0, 2) : BAYS;
    const doors = kind === "front" ? DOORS.slice(0, 2) : DOORS;
    for (let i = 0; i < bays.length; i++) {
      const bx = ox + bays[i][0];
      const bw = bays[i][1];
      const lit = hash01(car, i, 6) > 0.18;
      for (let ry = 2; ry <= 4; ry++) {
        for (let rx = 1; rx < bw - 1; rx++) {
          let col = C.glass;
          if (lit) col = hash01(car * 8 + i, ry + rx, 12) > 0.8 ? C.winDim : C.win;
          if (lit && ry === 4 && rx === 2 && hash01(car, i, 14) > 0.6) col = C.glassLite;
          add(bx + rx, y + ry, col, 1, 0);
        }
      }
    }
    for (let rx = 0; rx < CAR_W; rx++) {
      add(ox + rx, y + 5, C.red, 1, 2);
      add(ox + rx, y + 6, C.red, 1, 2);
    }
    for (let i = 0; i < doors.length; i++) {
      const dx = ox + doors[i][0];
      const dw = doors[i][1];
      for (let ry = 2; ry <= 9; ry++) {
        for (let rx = 0; rx < dw; rx++) {
          const pane = rx > 0 && rx < dw - 1 && ry <= 4;
          add(dx + rx, y + ry, pane ? C.glass : C.red, 1, pane ? 0 : 2);
        }
      }
    }
    if (kind === "front") {
      for (let ry = 0; ry <= 10; ry++) {
        for (let rx = 21; rx < CAR_W; rx++) {
          let col = ry <= 6 ? C.ivoryMid : C.ivoryLo;
          if (ry >= 2 && ry <= 5 && rx >= 23 && rx <= 28) col = C.glass;
          if (ry === 1 && rx >= 23 && rx <= 27) col = C.dest;
          if (ry >= 6 && ry <= 9 && rx >= 22 && rx <= 28) col = C.red;
          if ((ry === 8 || ry === 9) && (rx === 23 || rx === 27)) col = C.head;
          const hot = col === C.head || col === C.dest;
          add(ox + rx, y + ry, col, 1, hot ? 2 : col === C.red ? 2 : 0);
        }
      }
    }
    if (kind === "rear") {
      add(ox + 1, y + 8, C.red, 1, 2);
      add(ox + 2, y + 8, C.red, 1, 2);
      add(ox + 1, y + 9, C.red, 1, 2);
      add(ox + 2, y + 9, C.red, 1, 2);
    }
    const hubY = spin ? 0 : 2;
    for (let b = 0; b < 2; b++) {
      const cx = ox + (b === 0 ? 5 : 18);
      for (let rx = 0; rx < 8; rx++) add(cx + rx, y + 11, C.under, 1, 0);
      for (let w = 0; w < 2; w++) {
        const wx = cx + w * 4;
        for (let dy = 0; dy < 3; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            const hub = dx === 1 && dy === hubY;
            add(wx + dx, y + 12 + dy, hub ? C.wheel : C.railDim, 1, 0);
          }
        }
      }
    }
  };

  return (t) => {
    out.set(rgb);
    adj.fill(0);

    for (let y = WATER; y < H; y++) {
      const shift = Math.round(Math.sin(t * 0.48 + y * 0.45));
      if (shift) {
        const row = y * W;
        for (let x = 0; x < W; x++) {
          if (mask[row + x] !== WATER_M) continue;
          let src = x - shift;
          if (src < 0) src += W;
          else if (src >= W) src -= W;
          if (mask[row + src] !== WATER_M) continue;
          const s = (row + src) * 3;
          const d = (row + x) * 3;
          out[d] = rgb[s];
          out[d + 1] = rgb[s + 1];
          out[d + 2] = rgb[s + 2];
        }
      }
      for (let x = 0; x < W; x++) {
        if (mask[y * W + x] !== WATER_M) continue;
        const wob = Math.sin(x * 0.27 + t * 0.8) * Math.sin(y * 0.19 - t * 0.3);
        adj[y * W + x] = wob > 0.55 ? 1 : wob < -0.55 ? -1 : 0;
      }
    }

    for (let y = WATER; y < WATER + 26; y++) {
      const fade = 1 - (y - WATER) / 26;
      const wob = Math.round(Math.sin(t * 0.7 + y * 0.55));
      const width = 1 + Math.round(fade * 2);
      for (let dx = -width; dx <= width; dx++) {
        if (Math.sin(y * 1.1 + dx + t) < 0) continue;
        const x = MOON_X + wob + dx;
        if (x < 0 || x >= W || mask[y * W + x] !== WATER_M) continue;
        const o = (y * W + x) * 3;
        const a = fade * (dx === 0 ? 0.55 : 0.3);
        out[o] = lerp(out[o], C.waterLit[0], a);
        out[o + 1] = lerp(out[o + 1], C.waterLit[1], a);
        out[o + 2] = lerp(out[o + 2], C.waterLit[2], a);
      }
    }

    for (let i = 0; i < twinkles.length; i++) {
      const w = twinkles[i];
      const period = 8 + (w.phase % 3);
      if (((t + w.phase) % period) > 1.15) continue;
      const o = w.i * 3;
      out[o] = w.off[0];
      out[o + 1] = w.off[1];
      out[o + 2] = w.off[2];
    }
    for (let i = 0; i < beacons.length; i++) {
      const b = beacons[i];
      if (((t + b.phase) % 3.2) > 0.26) continue;
      const o = b.i * 3;
      out[o] = C.red[0];
      out[o + 1] = C.red[1];
      out[o + 2] = C.red[2];
      adj[b.i] = 1;
    }

    const blink = (t % 2.6) < 1.5;
    if (!blink) {
      const si = (ROOF + 3) * W + 8;
      const o = si * 3;
      out[o] = C.concDark[0];
      out[o + 1] = C.concDark[1];
      out[o + 2] = C.concDark[2];
    } else adj[(ROOF + 3) * W + 8] = 1;

    const left = trainLeft(t);
    const spin = (Math.floor(t * SPEED) % 4) < 2 ? 1 : 0;
    for (let c = 0; c < CARS; c++) {
      const ox = left + c * (CAR_W + COUPLER);
      const kind = c === 0 ? "rear" : c === CARS - 1 ? "front" : "mid";
      paintCar(ox, kind, spin, c);
      if (c === CARS - 1) continue;
      const gx = ox + CAR_W;
      for (let ry = 3; ry <= 9; ry++) {
        add(gx, ROOF + ry, C.under, 1, 0);
        add(gx + 1, ROOF + ry, C.wheel, 1, 0);
      }
      add(gx, ROOF, C.shadow, 1, 0);
      add(gx + 1, ROOF, C.shadow, 1, 0);
    }

    const nose = left + TRAIN_W - 2;
    for (let i = 1; i <= 16; i++) {
      const a = (1 - i / 17) * 0.8;
      add(nose + i, RAIL - 1, C.lamp, a, a > 0.45 ? 1 : 0);
      add(nose + i, RAIL, C.amber, a * 0.65, 0);
      if (i < 8) add(nose + i, RAIL - 2, C.head, a * 0.35, 0);
    }
    for (let i = 1; i <= 5; i++) add(left - i, RAIL - 2, C.redMid, (1 - i / 6) * 0.4, 0);

    const bodyTop = ROOF - 2;
    const bodyBot = ROOF + 15;
    for (let y = WATER + 1; y < H - 4; y++) {
      const v = (y - WATER) / (H - WATER);
      if (v > 0.62) break;
      const srcY = bodyTop + Math.round(((y - (WATER + 1)) / 18) * (bodyBot - bodyTop));
      if (srcY < bodyTop || srcY > bodyBot) continue;
      const fade = (1 - v / 0.62) * 0.5;
      const wob = Math.round(Math.sin(y * 0.8 + t * 1.1));
      for (let x = 0; x < W; x++) {
        if (mask[y * W + x] !== WATER_M) continue;
        if (Math.sin(x * 0.65 + y * 0.4 + t * 0.9) < -0.05) continue;
        const sx = x - wob;
        if (sx < 0 || sx >= W) continue;
        const so = (srcY * W + sx) * 3;
        add(x, y, [out[so], out[so + 1], out[so + 2]], fade, 0);
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

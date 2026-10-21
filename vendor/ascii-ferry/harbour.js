/**
 * Harbour ferry — original ui-kit ASCII scene.
 * A quiet night crossing: block skyline, a few lit windows, one ferry,
 * ripple water, and a soft wake. Drawn on a fixed-budget grid.
 * Not derived from ascii-sharks or ascii-magic-art.
 *
 *   import { startHarbour } from "./harbour.js";
 *   const stop = startHarbour(canvas);
 */
"use strict";

var COLS0 = 120;
var ROWS0 = 64;
var HORIZON0 = 26;
var WATERLINE0 = 50;
var LOOP_SECONDS = 36;
var FPS = 20;

/* Side-on ferry. Legend:
 *   # cream mass   = dark lower deck   % boot topping   F funnel
 *   * cabin window + deck lamp         . mast lamp      | mast
 *   r stern light  g bow light         / \ raked ends
 * Leading spaces keep the mast lined up with the hull. */
var FERRY = [
  "                         .                            ",
  "                         |                            ",
  "                    FF   |                            ",
  "                    FF########                        ",
  "                      #******#                        ",
  "        ########################################      ",
  "        ###*###*###*###*###*###*###*###*###*####      ",
  "        ########################################      ",
  "     /############################################\\   ",
  "   /===+====+====+====+====+====+====+====+====+====\\ ",
  "  r##################################################g",
  "    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%  "
];

var FERRY_H = FERRY.length;
var BOAT_W = FERRY[0].length;
var HULL_ROW = 10;
var HULL_L = FERRY[HULL_ROW].indexOf("#");
var HULL_R = FERRY[HULL_ROW].lastIndexOf("#");

/* Hand-placed skyline in a 120-column canonical grid. Heights are
 * rows above the waterline. Scaled to whatever grid the viewport needs. */
var BUILDINGS = [
  { x: 0, w: 8, h: 9, step: true },
  { x: 9, w: 4, h: 16, spire: 4 },
  { x: 14, w: 10, h: 7, step: true },
  { x: 25, w: 6, h: 12 },
  { x: 32, w: 3, h: 21, spire: 4, beacon: true },
  { x: 36, w: 9, h: 8, step: true },
  { x: 46, w: 5, h: 5 },
  { x: 52, w: 12, h: 10, step: true },
  { x: 65, w: 4, h: 15, spire: 3 },
  { x: 70, w: 7, h: 6 },
  { x: 78, w: 5, h: 18, spire: 3 },
  { x: 84, w: 13, h: 8, step: true },
  { x: 98, w: 6, h: 13 },
  { x: 105, w: 7, h: 6, step: true },
  { x: 113, w: 7, h: 10 }
];

var SPARKS = [
  { xf: 0.2, yf: 0.56, period: 7.4, phase: 0.3 },
  { xf: 0.47, yf: 0.68, period: 9.1, phase: 2.4 },
  { xf: 0.74, yf: 0.52, period: 6.2, phase: 4.0 }
];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function hash01(x, y, s) {
  var n = Math.imul((x + 1) ^ Math.imul(s + 3, 0x9e3779b1), 0x85ebca6b) ^ Math.imul(y + 1, 0xc2b2ae35);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spanOf(cols) {
  return cols + BOAT_W + 6;
}

function speedOf(cols) {
  return spanOf(cols) / LOOP_SECONDS;
}

function boatLeft(t, cols) {
  var span = spanOf(cols);
  var x = (t * speedOf(cols)) % span;
  if (x < 0) x += span;
  return x - BOAT_W;
}

function stillTime(cols) {
  var left = (cols - BOAT_W) * 0.5;
  return (left + BOAT_W) / speedOf(cols);
}

function moonClear(mask, cols, rows, x, y) {
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -2; dx <= 2; dx++) {
      var xx = x + dx;
      var yy = y + dy;
      if (yy < 0 || yy >= rows || xx < 0 || xx >= cols) continue;
      if (mask[yy * cols + xx]) return false;
    }
  }
  return true;
}

function buildView(cols, rows) {
  var horizon = clamp(Math.round(rows * HORIZON0 / ROWS0), 12, rows - 22);
  var waterline = clamp(
    Math.round(rows * WATERLINE0 / ROWS0),
    horizon + FERRY_H + 2,
    rows - 4
  );
  var mask = new Uint8Array(cols * rows);
  var windows = [];
  var spires = [];
  var beacons = [];

  for (var bi = 0; bi < BUILDINGS.length; bi++) {
    var b = BUILDINGS[bi];
    var x0 = Math.round(b.x / COLS0 * cols);
    var x1 = Math.round((b.x + b.w) / COLS0 * cols);
    if (x1 <= x0) x1 = Math.min(cols, x0 + 1);
    if (x0 < 0) x0 = 0;
    if (x1 > cols) x1 = cols;
    var bh = Math.max(3, Math.round(b.h / ROWS0 * rows));
    var y1 = horizon;
    var y0 = Math.max(1, y1 - bh);
    var tone = (bi % 2) + 1;
    var stepRows = b.step ? Math.max(1, Math.round((y1 - y0) * 0.16)) : 0;
    for (var y = y0; y < y1; y++) {
      var inset = y < y0 + stepRows && x1 - x0 > 5 ? 1 : 0;
      var xa = x0 + inset;
      var xb = x1 - inset;
      for (var x = xa; x < xb; x++) mask[y * cols + x] = tone;
    }
    if (b.spire && x1 > x0) {
      var cx = (x0 + x1 - 1) >> 1;
      var sh = Math.max(2, Math.round((b.spire / ROWS0) * rows));
      var top = y0;
      for (var s = 1; s <= sh; s++) {
        var sy = y0 - s;
        if (sy < 1) break;
        if (mask[sy * cols + cx]) break;
        spires.push({ x: cx, y: sy });
        top = sy;
      }
      if (b.beacon && top > 1) {
        beacons.push({ x: cx, y: top - 1, phase: hash01(cx, top, 4) * 5 });
      }
    }
    if (x1 - x0 < 3 || y1 - y0 < 4) continue;
    for (var wy = y0 + 1; wy < y1 - 1; wy += 2) {
      for (var wx = x0 + 1; wx < x1 - 1; wx += 2) {
        if (!mask[wy * cols + wx]) continue;
        if (hash01(wx, wy, 2) > 0.44) continue;
        windows.push({
          x: wx,
          y: wy,
          warm: hash01(wx, wy, 5) < 0.8,
          blink: hash01(wx, wy, 8) < 0.16,
          phase: hash01(wx, wy, 9) * 10
        });
      }
    }
  }

  var stars = [];
  var rng = mulberry32(20261021);
  var starN = Math.round(cols * 0.7);
  for (var i = 0; i < starN; i++) {
    var sx = rng() * cols | 0;
    var sy = 1 + (rng() * Math.max(1, horizon - 3) | 0);
    if (sy >= horizon || sy < 0 || mask[sy * cols + sx]) continue;
    var roll = rng();
    stars.push({
      x: sx,
      y: sy,
      ch: roll < 0.07 ? "*" : roll < 0.42 ? "." : "·",
      bright: rng() < 0.32,
      tw: rng() < 0.18,
      phase: rng() * 6.283
    });
  }

  var moonX = Math.round(cols * 0.8);
  var moonY = Math.max(2, Math.round(horizon * 0.3));
  for (var n = 0; n < 18; n++) {
    if (moonClear(mask, cols, rows, moonX, moonY)) break;
    moonX -= 2;
    if (moonX < 3) {
      moonX = Math.round(cols * 0.8);
      moonY += 1;
    }
  }

  var ripples = [];
  var rr = mulberry32(77);
  var waterRows = Math.max(1, rows - horizon - 1);
  var ripN = Math.min(400, Math.round(cols * waterRows * 0.042));
  for (var k = 0; k < ripN; k++) {
    var depth = Math.pow(rr(), 0.62);
    var ry = horizon + 1 + (waterRows * depth | 0);
    if (ry >= rows) ry = rows - 1;
    ripples.push({
      x: rr() * cols | 0,
      y: ry,
      phase: rr() * 6.283,
      depth: depth
    });
  }

  return {
    cols: cols,
    rows: rows,
    horizon: horizon,
    waterline: waterline,
    mask: mask,
    windows: windows,
    spires: spires,
    beacons: beacons,
    stars: stars,
    moonX: moonX,
    moonY: moonY,
    ripples: ripples,
    buoys: [
      { xf: 0.08, phase: 0.15 },
      { xf: 0.9, phase: 1.85 }
    ]
  };
}

function measureRatio(ctx) {
  ctx.font = '100px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  var w = ctx.measureText("M").width / 100;
  if (!(w > 0.35 && w < 0.85)) return 0.6;
  return w;
}

function computeLayout(cssW, cssH, ratio) {
  var target = cssW < 720 ? 7.1 : 9.1;
  var cols = clamp(Math.round(cssW / target), 72, 150);
  var cellW = cssW / cols;
  var idealH = cellW / ratio;
  var rows = clamp(Math.round(cssH / idealH), 52, 86);
  var cellH = cssH / rows;
  var fontPx = Math.min(cellH * 0.94, cellW / ratio);
  return { cols: cols, rows: rows, cellW: cellW, cellH: cellH, fontPx: fontPx, cssW: cssW, cssH: cssH };
}

function windowLit(win, t, still) {
  if (still || !win.blink) return true;
  var period = 8.5 + (win.phase % 4);
  return ((t + win.phase) % period) > 1.25;
}

/**
 * Play the harbour on a canvas. Returns stop().
 * Honours prefers-reduced-motion with one still frame, pauses when the
 * canvas leaves the viewport or the tab is hidden, and caps the frame rate.
 */
export function startHarbour(canvas) {
  if (!canvas || !canvas.getContext) return function () {};
  var ctx = canvas.getContext("2d");
  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  var ratio = measureRatio(ctx);
  var layout = null;
  var view = null;
  var elapsed = 0;
  var lastWall = 0;
  var lastDrawWall = 0;
  var raf = 0;
  var stopped = false;
  var visible = true;
  var step = 1000 / FPS;

  function layoutNow() {
    var w = canvas.clientWidth || document.documentElement.clientWidth || 0;
    var h = canvas.clientHeight || document.documentElement.clientHeight || 0;
    if (w < 2 || h < 2) return false;
    layout = computeLayout(w, h, ratio);
    layout.dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!view || view.cols !== layout.cols || view.rows !== layout.rows) {
      view = buildView(layout.cols, layout.rows);
    }
    var bw = Math.max(1, Math.round(w * layout.dpr));
    var bh = Math.max(1, Math.round(h * layout.dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    return true;
  }

  function prep() {
    ctx.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
    ctx.font = layout.fontPx.toFixed(2) + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  function glyph(gx, gy, ch, color) {
    ctx.fillStyle = color;
    ctx.fillText(ch, gx * layout.cellW + layout.cellW * 0.5, gy * layout.cellH + layout.cellH * 0.5);
  }

  function mass(gx, gy, color) {
    ctx.fillStyle = color;
    ctx.fillRect(gx * layout.cellW, gy * layout.cellH, layout.cellW + 0.7, layout.cellH + 0.7);
  }

  function pane(gx, gy, color) {
    var px = gx * layout.cellW;
    var py = gy * layout.cellH;
    ctx.fillStyle = "#1c140e";
    ctx.fillRect(px, py, layout.cellW + 0.7, layout.cellH + 0.7);
    ctx.fillStyle = color;
    ctx.fillRect(
      px + layout.cellW * 0.1,
      py + layout.cellH * 0.14,
      layout.cellW * 0.8,
      layout.cellH * 0.7
    );
  }

  function lamp(gx, gy, color) {
    var cx = gx * layout.cellW + layout.cellW * 0.5;
    var cy = gy * layout.cellH + layout.cellH * 0.5;
    var r = Math.max(1.4, Math.min(layout.cellW, layout.cellH) * 0.36);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function streak(gx, gy, color, weight) {
    var px = gx * layout.cellW;
    var py = gy * layout.cellH + layout.cellH * (0.5 - weight * 0.5);
    ctx.fillStyle = color;
    ctx.fillRect(px + layout.cellW * 0.06, py, layout.cellW * 0.88, Math.max(1.25, layout.cellH * weight));
    glyph(gx, gy, weight > 0.16 ? "~" : "-", color);
  }

  function paintFerry(left, top) {
    for (var ry = 0; ry < FERRY_H; ry++) {
      var row = FERRY[ry];
      for (var rx = 0; rx < row.length; rx++) {
        var ch = row.charAt(rx);
        if (ch === " ") continue;
        var gx = left + rx;
        var gy = top + ry;
        if (gy < -2 || gy > view.rows + 1 || gx < -2 || gx > view.cols + 1) continue;
        if (ch === "#") mass(gx, gy, ry >= HULL_ROW ? "#e4ddd0" : "#f6f3eb");
        else if (ch === "F") mass(gx, gy, "#7a3a34");
        else if (ch === "%") mass(gx, gy, "#3a2c22");
        else if (ch === "=") mass(gx, gy, "#141b28");
        else if (ch === "/" || ch === "\\") mass(gx, gy, "#f3efe6");
        else if (ch === "*") pane(gx, gy, "#ffd48a");
        else if (ch === "+") lamp(gx, gy, "#f0b45a");
        else if (ch === ".") lamp(gx, gy, "#fff6d8");
        else if (ch === "r") lamp(gx, gy, "#ff5c54");
        else if (ch === "g") lamp(gx, gy, "#3ddc78");
        else if (ch === "|") {
          var px = gx * layout.cellW;
          var py = gy * layout.cellH;
          ctx.fillStyle = "#e6e0d2";
          ctx.fillRect(px + layout.cellW * 0.36, py, Math.max(1.2, layout.cellW * 0.26), layout.cellH + 0.6);
          glyph(gx, gy, "|", "#f4f0e6");
        }
      }
    }
  }

  function draw(nowT, still) {
    if (!layout || !view) return;
    prep();
    var t = still ? stillTime(view.cols) : nowT;
    var cols = view.cols;
    var rows = view.rows;
    var horizon = view.horizon;
    var waterline = view.waterline;
    var cellW = layout.cellW;
    var cellH = layout.cellH;
    var hy = horizon * cellH;

    var sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#0b1020");
    sky.addColorStop(0.62, "#16233a");
    sky.addColorStop(1, "#314864");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, layout.cssW, hy + 1);

    var sea = ctx.createLinearGradient(0, hy, 0, layout.cssH);
    sea.addColorStop(0, "#123044");
    sea.addColorStop(0.35, "#0a1c2a");
    sea.addColorStop(1, "#050e16");
    ctx.fillStyle = sea;
    ctx.fillRect(0, hy, layout.cssW, layout.cssH - hy + 1);

    for (var si = 0; si < view.stars.length; si++) {
      var star = view.stars[si];
      var dim = star.tw && !still && Math.sin(t * 0.9 + star.phase) > 0.86;
      glyph(star.x, star.y, dim ? "·" : star.ch, dim ? "#2a3548" : star.bright ? "#e8eef8" : "#8494a8");
    }

    glyph(view.moonX - 1, view.moonY, "(", "#c9b992");
    glyph(view.moonX, view.moonY, "o", "#f6f0de");
    glyph(view.moonX + 1, view.moonY, ")", "#c9b992");

    var mask = view.mask;
    for (var y = 0; y < horizon; y++) {
      var x = 0;
      while (x < cols) {
        var tone = mask[y * cols + x];
        if (!tone) { x++; continue; }
        var x0 = x;
        x++;
        while (x < cols && mask[y * cols + x] === tone) x++;
        ctx.fillStyle = tone === 1 ? "#080a10" : "#141a26";
        ctx.fillRect(x0 * cellW, y * cellH, (x - x0) * cellW + 0.65, cellH + 0.65);
      }
    }

    ctx.fillStyle = "#ddd6c8";
    for (var sp = 0; sp < view.spires.length; sp++) {
      var spire = view.spires[sp];
      ctx.fillRect(
        spire.x * cellW + cellW * 0.4,
        spire.y * cellH,
        Math.max(1, cellW * 0.18),
        cellH + 0.6
      );
    }

    for (var bi = 0; bi < view.beacons.length; bi++) {
      var beacon = view.beacons[bi];
      var beaconOn = still || ((t + beacon.phase) % 2.6) < 0.22;
      if (beaconOn) lamp(beacon.x, beacon.y, "#ff5a4a");
    }

    for (var wi = 0; wi < view.windows.length; wi++) {
      var win = view.windows[wi];
      if (!windowLit(win, t, still)) continue;
      pane(win.x, win.y, win.warm ? "#ffcc78" : "#d5e6f8");
    }

    for (var ri = 0; ri < view.ripples.length; ri++) {
      var rp = view.ripples[ri];
      var wave = Math.sin(t * 0.8 + rp.phase);
      var gate = rp.depth > 0.62 ? -0.2 : 0.16;
      if (!still && wave < gate) continue;
      if (still && wave < -0.05) continue;
      var rch = "·";
      var rcol = rp.depth > 0.45 ? "#1e4e60" : "#163848";
      if (wave > 0.62) {
        rch = "-";
        rcol = rp.depth > 0.4 ? "#2c7490" : "#1c4c62";
      }
      if (wave > 0.9 && rp.depth > 0.5) {
        rch = "~";
        rcol = "#3c96a8";
      }
      glyph(rp.x, rp.y, rch, rcol);
    }

    var band = Math.max(4, Math.round((waterline - horizon) * 0.42));
    for (var wr = 0; wr < view.windows.length; wr++) {
      var src = view.windows[wr];
      if (!windowLit(src, t, still)) continue;
      var drop = horizon - src.y;
      if (drop < 1) continue;
      var ry = horizon + Math.max(1, Math.round(drop * 0.4));
      if (ry >= horizon + band || ry >= waterline - 1 || ry >= rows) continue;
      if (!still && Math.sin(t * 1.25 + src.x * 0.65 + src.y) < -0.05) continue;
      var wob = still ? 0 : Math.round(Math.sin(t * 0.7 + src.x * 0.35));
      glyph(src.x + wob, ry, "·", src.warm ? "#6a5434" : "#3a4e60");
    }

    var mReflect = Math.min(rows - 1, horizon + Math.max(5, Math.round(rows * 0.1)));
    for (var my = horizon + 1; my < mReflect; my++) {
      if (!still && Math.sin(t * 1.15 + my * 0.8) < -0.25) continue;
      var mx = view.moonX + (still ? 0 : Math.round(Math.sin(t * 0.6 + my) * 0.8));
      glyph(mx, my, my % 2 ? ":" : "·", "#5d6b5e");
    }

    ctx.fillStyle = "#3d5e78";
    ctx.fillRect(0, hy + cellH * 0.42, layout.cssW, Math.max(1, cellH * 0.07));

    var left = boatLeft(t, cols);
    var bob = still ? 0 : Math.sin(t * 0.72) * 0.4;
    var top = waterline - (FERRY_H - 1) + bob;
    var stern = left + HULL_L;
    var bow = left + HULL_R;
    var reach = Math.min(36, Math.round(cols * 0.28));
    for (var i = 1; i <= reach; i++) {
      var fade = 1 - i / (reach + 1);
      var spread = Math.min(4.2, 0.45 + i * 0.13);
      var wx = Math.round(stern - i);
      if (wx < 0 || wx >= cols) continue;
      var near = fade > 0.62;
      var mid = fade > 0.32;
      var col = near ? "#e7fbff" : mid ? "#8fd0de" : "#3d7f90";
      var weight = near ? 0.2 : mid ? 0.12 : 0.08;
      streak(wx, waterline, col, weight);
      var arm = Math.round(spread);
      if (waterline - arm > horizon) streak(wx, waterline - arm, mid ? "#6eb4c4" : "#2c6574", mid ? 0.1 : 0.07);
      if (waterline + arm < rows) streak(wx, waterline + arm, mid ? "#6eb4c4" : "#2c6574", mid ? 0.1 : 0.07);
    }
    for (var bk = 1; bk <= 5; bk++) {
      var bx = Math.round(bow + bk);
      if (bx < 0 || bx >= cols) continue;
      streak(bx, waterline, bk < 3 ? "#d5f6ff" : "#5ea8b8", bk < 3 ? 0.16 : 0.09);
      if (waterline > horizon + 1) glyph(bx, waterline - 1, "·", "#8fd4e4");
    }

    var reflectL = Math.round(left + HULL_L);
    var reflectR = Math.round(left + HULL_R);
    for (var hy2 = 1; hy2 <= 3; hy2++) {
      var ry2 = waterline + hy2;
      if (ry2 >= rows) break;
      for (var hx = reflectL; hx <= reflectR; hx++) {
        if (hx < 0 || hx >= cols) continue;
        var hs = Math.sin(hx * 0.9 + hy2 + t * (still ? 0 : 1.1));
        if (hs < 0.15) continue;
        glyph(hx, ry2, hs > 0.55 ? "-" : "·", hy2 === 1 ? "#c5c6bc" : hy2 === 2 ? "#7a8078" : "#3e4844");
      }
    }

    for (var bu = 0; bu < view.buoys.length; bu++) {
      var buoy = view.buoys[bu];
      var ux = Math.round(cols * buoy.xf);
      var uy = horizon + Math.round((waterline - horizon) * 0.46);
      var ubob = still ? 0 : Math.sin(t * 1.1 + buoy.phase) * 0.35;
      var flash = still || ((t + buoy.phase) % 2.7) < 0.24;
      glyph(ux, uy + ubob, "o", "#d4923e");
      if (flash) lamp(ux, uy + ubob - 1, "#ffe3a4");
      else glyph(ux, uy + ubob - 1, "·", "#6e5830");
    }

    for (var sk = 0; sk < SPARKS.length; sk++) {
      var spark = SPARKS[sk];
      var show = still ? sk === 1 : ((t + spark.phase) % spark.period) < 0.42;
      if (!show) continue;
      var sx2 = Math.round(cols * spark.xf);
      var sy2 = horizon + Math.round((rows - horizon - 2) * spark.yf);
      if (sy2 <= horizon || sy2 >= rows) continue;
      glyph(sx2, sy2, "+", "#f4fbff");
    }

    paintFerry(left, top);
  }

  function onResize() {
    layoutNow();
    draw(elapsed, reduced);
  }

  function pauseClock() {
    lastWall = 0;
  }

  function onVis() {
    if (document.hidden) pauseClock();
  }

  layoutNow();
  if (view) elapsed = stillTime(view.cols);
  draw(elapsed, reduced);

  window.addEventListener("resize", onResize);
  if (reduced) {
    return function stop() {
      stopped = true;
      window.removeEventListener("resize", onResize);
    };
  }

  document.addEventListener("visibilitychange", onVis);
  var io = null;
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(function (entries) {
      visible = !!(entries[0] && entries[0].isIntersecting);
      if (!visible) pauseClock();
    });
    io.observe(canvas);
  }

  // Date.now, not the rAF timestamp: after a hidden scene, some browsers
  // flush a burst of animation frames and the boat would cross in a blink.
  var loop = function () {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) {
      pauseClock();
      return;
    }
    var wall = Date.now();
    if (!lastWall) {
      lastWall = wall;
      lastDrawWall = wall;
      return;
    }
    var dt = (wall - lastWall) / 1000;
    lastWall = wall;
    if (dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    elapsed += dt;
    if (wall - lastDrawWall < step) return;
    lastDrawWall = wall;
    draw(elapsed, false);
  };
  raf = requestAnimationFrame(loop);

  return function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    if (io) io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("resize", onResize);
  };
}

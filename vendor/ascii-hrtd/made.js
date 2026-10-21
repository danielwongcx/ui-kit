/**
 * made with 💕 by HRTD — original ui-kit ASCII scene.
 * Two shining phrases and one heart that drifts between them.
 * Not derived from ascii-sharks or ascii-magic-art.
 *
 *   import { startMade } from "./made.js";
 *   const stop = startMade(canvas);
 */
"use strict";

var FPS = 24;
var LEFT = "made with";
var RIGHT = "by HRTD";
var DIM = [176, 132, 148];
var HOT = [255, 248, 252];

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function mixColor(amount) {
  var t = clamp(amount, 0, 1);
  var r = Math.round(DIM[0] + (HOT[0] - DIM[0]) * t);
  var g = Math.round(DIM[1] + (HOT[1] - DIM[1]) * t);
  var b = Math.round(DIM[2] + (HOT[2] - DIM[2]) * t);
  return "rgb(" + r + "," + g + "," + b + ")";
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

function shineAmount(index, count, t, still, phase) {
  if (still) return 0.78;
  var pos = count <= 1 ? 0.5 : index / (count - 1);
  var sweep = ((t * 0.28 + phase) % 1.35) - 0.18;
  var band = Math.exp(-Math.pow((pos - sweep) / 0.2, 2));
  var breath = 0.62 + 0.16 * Math.sin(t * 1.15 + phase * 4 + index * 0.45);
  return clamp(breath + band * 0.7, 0, 1);
}

/**
 * Play the HRTD line on a canvas. Returns stop().
 * Pauses off-screen, caps the frame rate, and holds one frame
 * when the visitor prefers reduced motion.
 */
export function startMade(canvas) {
  if (!canvas || !canvas.getContext) return function () {};
  if (typeof canvas._hrtdStop === "function") {
    var previous = canvas._hrtdStop;
    canvas._hrtdStop = null;
    previous();
  }
  var ctx = canvas.getContext("2d");
  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var cssW = 0;
  var cssH = 0;
  var dpr = 1;
  var fontPx = 48;
  var stars = [];
  var elapsed = 0;
  var lastDrawWall = 0;
  var raf = 0;
  var stopped = false;
  var visible = true;
  var step = 1000 / FPS;
  var trail = [];
  var io = null;

  function layoutNow() {
    var w = canvas.clientWidth || document.documentElement.clientWidth || 0;
    var h = canvas.clientHeight || document.documentElement.clientHeight || 0;
    if (w < 2 || h < 2) return false;
    cssW = w;
    cssH = h;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var bw = Math.max(1, Math.round(w * dpr));
    var bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var guard = w < 520 ? 28 : 64;
    var next = clamp(Math.floor((w - guard) / 16.5), 18, 76);
    if (next !== fontPx || !stars.length) {
      fontPx = next;
      buildStars();
    }
    return true;
  }

  function buildStars() {
    var rand = mulberry32(0x48525444);
    var count = clamp(Math.round((cssW * cssH) / 18000), 28, 70);
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: rand(),
        y: rand(),
        ch: rand() > 0.82 ? "+" : rand() > 0.55 ? "·" : ".",
        phase: rand() * Math.PI * 2,
        bright: rand() > 0.8
      });
    }
  }

  function phraseWidth(text) {
    ctx.font = fontPx + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    return ctx.measureText(text).width;
  }

  function heartOffset(t, still) {
    if (still) return { x: 0, y: 0 };
    return {
      x: Math.sin(t * 1.15) * fontPx * 0.2,
      y: Math.cos(t * 1.05) * fontPx * 0.55
    };
  }

  function drawStars(t, still) {
    ctx.font = Math.max(11, fontPx * 0.28) + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var i = 0; i < stars.length; i++) {
      var star = stars[i];
      var tw = still ? 0.45 : 0.28 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.6 + star.phase));
      if (!star.bright) tw *= 0.55;
      ctx.fillStyle = "rgba(232, 196, 214, " + tw.toFixed(3) + ")";
      ctx.fillText(star.ch, star.x * cssW, star.y * cssH);
    }
  }

  function drawPhrase(text, originX, baseline, t, still, phase) {
    ctx.font = fontPx + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    var x = originX;
    var sparkleAt = still ? -1 : Math.floor(t / 1.6) % text.length;
    var sparkleOn = !still && (t % 1.6) < 0.38;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var w = ctx.measureText(ch).width;
      var amount = ch === " " ? 0 : shineAmount(i, text.length, t, still, phase);
      ctx.fillStyle = mixColor(amount);
      ctx.fillText(ch, x, baseline);
      if (sparkleOn && i === sparkleAt && ch !== " ") {
        ctx.fillStyle = "rgba(255, 236, 246, 0.9)";
        ctx.fillText("·", x + w * 0.35, baseline - fontPx * 0.62);
      }
      x += w;
    }
  }

  function drawTrail(still) {
    var count = trail.length;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var i = 0; i < count; i++) {
      var mark = trail[i];
      var age = (count - 1 - i) / count;
      var alpha = still ? 0.28 : (1 - age) * 0.45;
      if (alpha < 0.04) continue;
      var size = fontPx * (0.34 + (1 - age) * 0.22);
      ctx.font = size.toFixed(1) + 'px ui-monospace, "Segoe UI Symbol", Menlo, sans-serif';
      ctx.fillStyle = "rgba(255, 154, 186, " + alpha.toFixed(3) + ")";
      ctx.fillText("♥", mark.x, mark.y);
    }
  }

  function drawHeart(x, y, t, still) {
    var pulse = still ? 1 : 1 + Math.sin(t * 2.1) * 0.045;
    var s = fontPx * 0.34 * pulse;
    var glow = ctx.createRadialGradient(x, y, s * 0.2, x, y, s * 3.2);
    glow.addColorStop(0, "rgba(255, 120, 164, 0.28)");
    glow.addColorStop(1, "rgba(255, 120, 164, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, s * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y - s * 0.15);
    ctx.scale(s, s * 0.96);
    ctx.beginPath();
    ctx.moveTo(0, 0.35);
    ctx.bezierCurveTo(-0.15, -0.55, -1.35, -0.45, -1.15, 0.4);
    ctx.bezierCurveTo(-1.05, 0.9, -0.35, 1.25, 0, 1.7);
    ctx.bezierCurveTo(0.35, 1.25, 1.05, 0.9, 1.15, 0.4);
    ctx.bezierCurveTo(1.35, -0.45, 0.15, -0.55, 0, 0.35);
    ctx.closePath();
    var fill = ctx.createLinearGradient(0, -0.6, 0, 1.6);
    fill.addColorStop(0, "#ffd0e0");
    fill.addColorStop(0.45, "#ff6d95");
    fill.addColorStop(1, "#e23b68");
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();

    ctx.font = (fontPx * 0.72).toFixed(1) + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💕", x, y);
  }

  function draw(nowT, still) {
    if (!cssW || !cssH) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sky = ctx.createLinearGradient(0, 0, 0, cssH);
    sky.addColorStop(0, "#100814");
    sky.addColorStop(0.55, "#160a16");
    sky.addColorStop(1, "#09060c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cssW, cssH);

    var t = still ? 1.15 : nowT;
    drawStars(t, still);

    ctx.font = fontPx + 'px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    var leftW = phraseWidth(LEFT);
    var rightW = phraseWidth(RIGHT);
    var gap = fontPx * 1.7;
    var total = leftW + gap + rightW;
    var origin = (cssW - total) / 2;
    var baseline = cssH * 0.46;
    var heartX = origin + leftW + gap * 0.5;
    var heartY = baseline;
    var drift = heartOffset(t, still);
    var hx = heartX + drift.x;
    var hy = heartY + drift.y;

    if (!still) {
      var last = trail[trail.length - 1];
      if (!last || Math.hypot(hx - last.x, hy - last.y) > fontPx * 0.08) {
        trail.push({ x: hx, y: hy });
        if (trail.length > 7) trail.shift();
      }
    } else if (!trail.length) {
      trail.push({ x: hx, y: hy - fontPx * 0.28 });
      trail.push({ x: hx - fontPx * 0.12, y: hy - fontPx * 0.08 });
    }

    drawTrail(still);
    drawPhrase(LEFT, origin, baseline, t, still, 0);
    drawPhrase(RIGHT, origin + leftW + gap, baseline, t, still, 0.45);
    drawHeart(hx, hy, t, still);
  }

  function onResize() {
    layoutNow();
    draw(elapsed, reduced);
  }

  function pauseClock() {
    lastDrawWall = 0;
  }

  function onVis() {
    if (document.hidden) pauseClock();
  }

  function stop() {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (io) io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("resize", onResize);
    if (canvas._hrtdStop === stop) canvas._hrtdStop = null;
  }

  layoutNow();
  draw(elapsed, reduced);
  window.addEventListener("resize", onResize);
  if (reduced) {
    canvas._hrtdStop = stop;
    return stop;
  }

  document.addEventListener("visibilitychange", onVis);
  if (typeof IntersectionObserver !== "undefined") {
    io = new IntersectionObserver(function (entries) {
      visible = !!(entries[0] && entries[0].isIntersecting);
      if (!visible) pauseClock();
    });
    io.observe(canvas);
  }

  var loop = function () {
    if (stopped) return;
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) {
      pauseClock();
      return;
    }
    if (!cssW) {
      if (!layoutNow()) return;
      lastDrawWall = Date.now();
      draw(elapsed, false);
      return;
    }
    var wall = Date.now();
    if (!lastDrawWall) {
      lastDrawWall = wall;
      return;
    }
    if (wall - lastDrawWall < step) return;
    lastDrawWall = wall;
    elapsed += step / 1000;
    draw(elapsed, false);
  };
  raf = requestAnimationFrame(loop);
  canvas._hrtdStop = stop;
  return stop;
}

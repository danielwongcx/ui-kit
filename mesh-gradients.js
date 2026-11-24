(function () {
  "use strict";

  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";
  var params = new URLSearchParams(location.search);
  var seek = parseFloat(params.get("t"));
  if (!isFinite(seek) || seek < 0) seek = 0;
  var play0 = !reduce && params.get("pause") !== "1";

  var DUR = { field: 5, posters: 14, glass: 27, tiles: 15 };
  var HOLD = { field: 0.88, posters: 0.86, glass: 24.4, tiles: 0 };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rgba(c, a) {
    return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")";
  }

  function mixBlob(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      r: lerp(a.r, b.r, t),
      a: lerp(a.a, b.a, t),
      c: [
        lerp(a.c[0], b.c[0], t),
        lerp(a.c[1], b.c[1], t),
        lerp(a.c[2], b.c[2], t)
      ]
    };
  }

  function sampleBlobs(keys, u) {
    var i = 0;
    while (i < keys.length - 2 && keys[i + 1].u < u) i++;
    var A = keys[i];
    var B = keys[i + 1];
    var span = B.u - A.u || 1;
    var t = smooth((u - A.u) / span);
    var out = [];
    var n = Math.min(A.blobs.length, B.blobs.length);
    for (var k = 0; k < n; k++) out.push(mixBlob(A.blobs[k], B.blobs[k], t));
    return out;
  }

  var studies = {};
  var jobs = [];
  var raf = 0;
  var last = 0;
  var running = false;

  function anyPlaying() {
    if (reduce) return false;
    var keys = Object.keys(studies);
    for (var i = 0; i < keys.length; i++) if (studies[keys[i]].playing) return true;
    return false;
  }

  function frame(now) {
    if (!last) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (var i = 0; i < jobs.length; i++) jobs[i](dt);
    if (anyPlaying()) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function kick() {
    if (reduce || running || !anyPlaying()) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function fitCanvas(canvas, maxEdge) {
    var rect = canvas.getBoundingClientRect();
    var cssW = Math.max(2, rect.width);
    var cssH = Math.max(2, rect.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(cssW * dpr));
    var h = Math.max(2, Math.round(cssH * dpr));
    if (maxEdge) {
      var scale = Math.min(1, maxEdge / Math.max(w, h));
      w = Math.max(2, Math.round(w * scale));
      h = Math.max(2, Math.round(h * scale));
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return { w: w, h: h };
  }

  function setPlayButton(study, playing) {
    var btn = document.querySelector('[data-study="' + study + '"][data-act="play"]');
    if (!btn) return;
    if (reduce) {
      btn.disabled = true;
      btn.textContent = "Held";
      btn.setAttribute("aria-pressed", "true");
      return;
    }
    btn.disabled = false;
    btn.textContent = playing ? "Pause" : "Play";
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
  }

  /* ---------- 1. Soft field ---------- */

  function superR(theta, n, rx, ry) {
    var c = Math.abs(Math.cos(theta)) / rx;
    var s = Math.abs(Math.sin(theta)) / ry;
    return Math.pow(Math.pow(c, n) + Math.pow(s, n), -1 / n);
  }

  function triR(theta) {
    var a = theta + Math.PI / 2;
    var c = Math.cos(3 * a);
    return 0.9 + 0.2 * Math.pow((c + 1) * 0.5, 0.85);
  }

  var fieldPoses = [
    { u: 0.00, n: 4.4, hole: 0.00, tri: 0, rx: 1.00, ry: 0.96 },
    { u: 0.16, n: 3.1, hole: 0.28, tri: 0.15, rx: 0.98, ry: 1.00 },
    { u: 0.32, n: 2.05, hole: 0.58, tri: 0.05, rx: 1.00, ry: 1.00 },
    { u: 0.46, n: 2.2, hole: 0.62, tri: 1, rx: 1.02, ry: 1.06 },
    { u: 0.60, n: 2.3, hole: 0.64, tri: 1, rx: 1.00, ry: 1.05 },
    { u: 0.74, n: 2.05, hole: 0.60, tri: 0.08, rx: 1.00, ry: 1.00 },
    { u: 0.88, n: 4.2, hole: 0.66, tri: 0, rx: 1.02, ry: 1.00 },
    { u: 0.94, n: 4.3, hole: 0.66, tri: 0, rx: 1.02, ry: 1.00 },
    { u: 1.00, n: 4.4, hole: 0.00, tri: 0, rx: 1.00, ry: 0.96 }
  ];

  function fieldPose(u) {
    var i = 0;
    while (i < fieldPoses.length - 2 && fieldPoses[i + 1].u < u) i++;
    var A = fieldPoses[i];
    var B = fieldPoses[i + 1];
    var t = smooth((u - A.u) / (B.u - A.u || 1));
    return {
      n: lerp(A.n, B.n, t),
      hole: lerp(A.hole, B.hole, t),
      tri: lerp(A.tri, B.tri, t),
      rx: lerp(A.rx, B.rx, t),
      ry: lerp(A.ry, B.ry, t)
    };
  }

  function radiusAt(theta, pose) {
    var squ = superR(theta, pose.n, pose.rx, pose.ry);
    var tri = triR(theta) * ((pose.rx + pose.ry) * 0.5);
    return squ * (1 - pose.tri) + tri * pose.tri;
  }

  function tracePath(ctx, cx, cy, scale, pose, holeScale) {
    var steps = 96;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var theta = (i / steps) * Math.PI * 2;
      var r = radiusAt(theta, pose) * scale * holeScale;
      var x = cx + Math.cos(theta) * r;
      var y = cy + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function initField() {
    var canvas = document.getElementById("field-canvas");
    var ctx = canvas.getContext("2d");
    var color = document.createElement("canvas");
    var mask = document.createElement("canvas");
    var hole = document.createElement("canvas");
    var cctx = color.getContext("2d");
    var mctx = mask.getContext("2d");
    var hctx = hole.getContext("2d");
    var state = { t: reduce ? HOLD.field * DUR.field : seek % DUR.field, playing: play0 };
    studies.field = state;
    setPlayButton("field", state.playing);

    function draw() {
      var size = fitCanvas(canvas, 720);
      var w = size.w;
      var h = size.h;
      if (color.width !== w) {
        color.width = mask.width = hole.width = w;
        color.height = mask.height = hole.height = h;
      }
      var u = (state.t % DUR.field) / DUR.field;
      var pose = fieldPose(reduce ? HOLD.field : u);
      var cx = w * 0.5;
      var cy = h * 0.52;
      var scale = Math.min(w, h) * 0.30;
      var drift = state.t;

      cctx.clearRect(0, 0, w, h);
      var wash = cctx.createRadialGradient(cx - scale * 0.15, cy, scale * 0.05, cx, cy, scale * 1.45);
      wash.addColorStop(0, "rgba(198, 186, 255, 0.98)");
      wash.addColorStop(0.4, "rgba(132, 164, 255, 0.92)");
      wash.addColorStop(1, "rgba(244, 196, 226, 0.35)");
      cctx.fillStyle = wash;
      cctx.fillRect(0, 0, w, h);
      var blobs = [
        { x: -0.36, y: 0.06, col: [96, 140, 255], a: 0.95, s: 1.05 },
        { x: 0.08, y: -0.04, col: [186, 156, 255], a: 0.9, s: 0.95 },
        { x: 0.32, y: -0.24, col: [245, 150, 210], a: 0.88, s: 0.85 },
        { x: 0.0, y: 0.12, col: [255, 255, 255], a: 0.28, s: 0.42 }
      ];
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var px = cx + (b.x + Math.sin(drift * 0.35 + i) * 0.04) * scale * 1.15;
        var py = cy + (b.y + Math.cos(drift * 0.28 + i * 1.3) * 0.035) * scale * 1.15;
        var rad = scale * b.s;
        var g = cctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, rgba(b.col, b.a));
        g.addColorStop(0.5, rgba(b.col, b.a * 0.45));
        g.addColorStop(1, rgba(b.col, 0));
        cctx.fillStyle = g;
        cctx.beginPath();
        cctx.arc(px, py, rad, 0, Math.PI * 2);
        cctx.fill();
      }

      mctx.clearRect(0, 0, w, h);
      mctx.filter = "blur(" + Math.max(8, scale * 0.1) + "px)";
      mctx.fillStyle = "#fff";
      tracePath(mctx, cx, cy, scale, pose, 1);
      mctx.fill();
      mctx.filter = "none";

      cctx.globalCompositeOperation = "destination-in";
      cctx.drawImage(mask, 0, 0);
      cctx.globalCompositeOperation = "source-over";

      if (pose.hole > 0.04) {
        hctx.clearRect(0, 0, w, h);
        hctx.filter = "blur(" + Math.max(2, scale * 0.035) + "px)";
        hctx.fillStyle = "#fff";
        tracePath(hctx, cx, cy, scale, pose, pose.hole);
        hctx.fill();
        hctx.filter = "none";
        cctx.globalCompositeOperation = "destination-out";
        cctx.drawImage(hole, 0, 0);
        cctx.globalCompositeOperation = "source-over";
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(color, 0, 0);

      if (pose.hole > 0.45) {
        var rim = clamp((pose.hole - 0.45) / 0.25, 0, 1);
        tracePath(ctx, cx, cy, scale, pose, pose.hole * 0.98);
        var grad = ctx.createLinearGradient(cx - scale, cy + scale * 0.2, cx + scale, cy - scale * 0.4);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.42, "rgba(255,255,255," + (0.15 * rim) + ")");
        grad.addColorStop(0.7, "rgba(255,255,255," + (0.95 * rim) + ")");
        grad.addColorStop(1, "rgba(255,255,255," + (0.35 * rim) + ")");
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.25, w * 0.007);
        ctx.stroke();
      }
    }

    jobs.push(function (dt) {
      if (state.playing) state.t += dt;
      draw();
    });
    draw();
    return state;
  }

  /* ---------- 2. Posters ---------- */

  function blob(x, y, r, c, a) { return { x: x, y: y, r: r, c: c, a: a }; }

  var posterKeys = {
    wind: [
      { u: 0, blobs: [
        blob(0.22, 0.16, 0.62, [255, 150, 166], 0.92),
        blob(0.16, 0.48, 0.5, [255, 196, 204], 0.55),
        blob(0.28, 0.96, 0.48, [148, 206, 255], 0.9),
        blob(0.62, 0.78, 0.4, [255, 214, 214], 0.45)
      ]},
      { u: 0.32, blobs: [
        blob(0.42, 0.12, 0.7, [176, 228, 255], 0.88),
        blob(0.3, 0.55, 0.45, [255, 228, 220], 0.35),
        blob(0.32, 0.9, 0.5, [255, 168, 156], 0.8),
        blob(0.7, 0.62, 0.42, [255, 236, 220], 0.4)
      ]},
      { u: 0.58, blobs: [
        blob(0.48, 0.22, 0.55, [186, 226, 255], 0.7),
        blob(0.4, 0.5, 0.58, [255, 140, 186], 0.88),
        blob(0.55, 0.86, 0.42, [255, 196, 210], 0.5),
        blob(0.2, 0.7, 0.36, [255, 210, 220], 0.4)
      ]},
      { u: 0.86, blobs: [
        blob(0.4, 0.18, 0.66, [226, 198, 255], 0.82),
        blob(0.28, 0.48, 0.4, [255, 210, 230], 0.4),
        blob(0.38, 0.9, 0.55, [255, 226, 176], 0.78),
        blob(0.68, 0.55, 0.4, [255, 244, 250], 0.35)
      ]},
      { u: 1, blobs: [
        blob(0.22, 0.16, 0.62, [255, 150, 166], 0.92),
        blob(0.16, 0.48, 0.5, [255, 196, 204], 0.55),
        blob(0.28, 0.96, 0.48, [148, 206, 255], 0.9),
        blob(0.62, 0.78, 0.4, [255, 214, 214], 0.45)
      ]}
    ],
    land: [
      { u: 0, blobs: [
        blob(0.4, 1.05, 0.55, [255, 176, 130], 0.9),
        blob(0.62, 1.0, 0.38, [255, 214, 110], 0.7),
        blob(0.26, 1.1, 0.34, [150, 214, 150], 0.4)
      ]},
      { u: 0.34, blobs: [
        blob(0.46, 0.92, 0.58, [186, 202, 232], 0.72),
        blob(0.3, 1.02, 0.36, [214, 222, 240], 0.45),
        blob(0.66, 1.06, 0.3, [200, 210, 230], 0.35)
      ]},
      { u: 0.6, blobs: [
        blob(0.5, 0.94, 0.55, [255, 156, 124], 0.85),
        blob(0.34, 1.02, 0.4, [255, 206, 160], 0.6),
        blob(0.7, 1.04, 0.28, [255, 186, 170], 0.4)
      ]},
      { u: 0.86, blobs: [
        blob(0.4, 0.98, 0.46, [70, 200, 176], 0.75),
        blob(0.64, 1.04, 0.36, [255, 168, 190], 0.5),
        blob(0.24, 1.08, 0.32, [110, 214, 156], 0.48)
      ]},
      { u: 1, blobs: [
        blob(0.4, 1.05, 0.55, [255, 176, 130], 0.9),
        blob(0.62, 1.0, 0.38, [255, 214, 110], 0.7),
        blob(0.26, 1.1, 0.34, [150, 214, 150], 0.4)
      ]}
    ],
    night: [
      { u: 0, blobs: [
        blob(0.34, 1.06, 0.46, [255, 128, 24], 0.95),
        blob(0.55, 1.02, 0.38, [255, 206, 48], 0.8),
        blob(0.22, 1.1, 0.3, [90, 200, 60], 0.5)
      ]},
      { u: 0.28, blobs: [
        blob(0.5, 1.02, 0.42, [170, 230, 255], 0.75),
        blob(0.32, 1.08, 0.32, [90, 150, 255], 0.4),
        blob(0.68, 1.06, 0.26, [220, 240, 255], 0.35)
      ]},
      { u: 0.55, blobs: [
        blob(0.4, 1.04, 0.48, [255, 120, 30], 0.95),
        blob(0.58, 1.0, 0.36, [255, 196, 40], 0.75),
        blob(0.24, 1.08, 0.28, [255, 80, 40], 0.45)
      ]},
      { u: 0.72, blobs: [
        blob(0.46, 1.08, 0.3, [80, 40, 20], 0.18),
        blob(0.3, 1.1, 0.22, [40, 20, 30], 0.1),
        blob(0.66, 1.1, 0.2, [30, 20, 40], 0.08)
      ]},
      { u: 0.86, blobs: [
        blob(0.38, 0.9, 0.42, [40, 220, 160], 0.9),
        blob(0.66, 0.96, 0.36, [230, 40, 160], 0.75),
        blob(0.22, 1.02, 0.3, [120, 40, 210], 0.5)
      ]},
      { u: 1, blobs: [
        blob(0.34, 1.06, 0.46, [255, 128, 24], 0.95),
        blob(0.55, 1.02, 0.38, [255, 206, 48], 0.8),
        blob(0.22, 1.1, 0.3, [90, 200, 60], 0.5)
      ]}
    ]
  };

  function initPosters() {
    var canvases = Array.prototype.slice.call(document.querySelectorAll("[data-poster]"));
    var state = { t: reduce ? HOLD.posters * DUR.posters : seek % DUR.posters, playing: play0 };
    studies.posters = state;
    setPlayButton("posters", state.playing);

    function drawOne(canvas) {
      var kind = canvas.getAttribute("data-poster");
      var size = fitCanvas(canvas, 900);
      var ctx = canvas.getContext("2d");
      var w = size.w;
      var h = size.h;
      var u = reduce ? HOLD.posters : (state.t % DUR.posters) / DUR.posters;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = kind === "night" ? "#070708" : "#ffffff";
      ctx.fillRect(0, 0, w, h);
      var blobs = sampleBlobs(posterKeys[kind], u);
      var wobble = state.t;
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = (b.x + Math.sin(wobble * 0.23 + i * 1.7) * 0.025) * w;
        var y = (b.y + Math.cos(wobble * 0.19 + i) * 0.02) * h;
        var rad = b.r * Math.max(w, h);
        var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, rgba(b.c, b.a));
        g.addColorStop(0.42, rgba(b.c, b.a * 0.55));
        g.addColorStop(1, rgba(b.c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function draw() {
      for (var i = 0; i < canvases.length; i++) drawOne(canvases[i]);
    }

    jobs.push(function (dt) {
      if (state.playing) state.t += dt;
      draw();
    });
    draw();
  }

  /* ---------- 3. Glass ---------- */

  var GLASS_VERT = [
    "attribute vec2 aPos;",
    "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  var GLASS_FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uIdA;",
    "uniform float uIdB;",
    "uniform float uK;",
    "uniform float uFlat;",
    "uniform float uYaw;",
    "uniform float uCam;",
    "float sdRoundBox(vec3 p, vec3 b, float r){",
    "  vec3 q = abs(p) - b;",
    "  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;",
    "}",
    "vec3 rotX(vec3 p, float a){",
    "  float c = cos(a), s = sin(a);",
    "  return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);",
    "}",
    "vec3 rotY(vec3 p, float a){",
    "  float c = cos(a), s = sin(a);",
    "  return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);",
    "}",
    "vec3 rotZ(vec3 p, float a){",
    "  float c = cos(a), s = sin(a);",
    "  return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);",
    "}",
    "float sdI(vec3 p){",
    "  vec3 q = rotX(p, -0.14);",
    "  float box = sdRoundBox(q, vec3(0.72, 0.56, 0.22), 0.18);",
    "  float bL = length(q.xy - vec2(-0.96, 0.0)) - 0.48;",
    "  float bR = length(q.xy - vec2( 0.96, 0.0)) - 0.48;",
    "  return max(box, -min(bL, bR));",
    "}",
    "float sdTwo(vec3 p){",
    "  vec3 q = p; q.y = abs(q.y) - 0.34;",
    "  return length(q) - 0.36;",
    "}",
    "float sdFour(vec3 p){",
    "  vec3 q = p; q.xy = abs(q.xy) - vec2(0.30);",
    "  return length(q) - 0.30;",
    "}",
    "float sdCube(vec3 p){",
    "  vec3 q = rotY(rotX(p, -0.42), 0.55);",
    "  return sdRoundBox(q, vec3(0.40), 0.045);",
    "}",
    "float sdDiamond(vec3 p){",
    "  vec3 q = rotX(rotZ(p, 0.785398), -0.16);",
    "  return sdRoundBox(q, vec3(0.58, 0.58, 0.07), 0.045);",
    "}",
    "float sdFrame(vec3 p){",
    "  float o = sdRoundBox(p, vec3(0.54, 0.54, 0.15), 0.12);",
    "  float i = sdRoundBox(p, vec3(0.32, 0.32, 0.5), 0.08);",
    "  return max(o, -i);",
    "}",
    "float sdPyramid(vec3 p, float h){",
    "  float m2 = h*h + 0.25;",
    "  p.xz = abs(p.xz);",
    "  p.xz = (p.z > p.x) ? p.zx : p.xz;",
    "  p.xz -= 0.5;",
    "  vec3 q = vec3(p.z, h*p.y - 0.5*p.x, h*p.x + 0.5*p.y);",
    "  float s = max(-q.x, 0.0);",
    "  float t = clamp((q.y - 0.5*p.z) / (m2 + 0.25), 0.0, 1.0);",
    "  float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;",
    "  float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);",
    "  float d2 = (min(q.y, -q.x*m2 - q.y*0.5) > 0.0) ? 0.0 : min(a, b);",
    "  return sqrt((d2 + q.z*q.z) / m2) * sign(max(q.z, -p.y));",
    "}",
    "float sdPyr(vec3 p){",
    "  vec3 q = rotY(p, 0.5);",
    "  q.y += 0.28;",
    "  return sdPyramid(q * vec3(1.05, 1.0, 1.05), 1.05);",
    "}",
    "float sdArm(vec2 p){",
    "  float y = p.y;",
    "  float t = clamp(y, 0.0, 1.0);",
    "  float halfw = mix(0.0, 0.46, pow(t, 0.55));",
    "  halfw *= mix(0.35, 1.0, smoothstep(0.0, 0.72, t));",
    "  float d = abs(p.x) - halfw;",
    "  d = max(d, 0.012 - y);",
    "  d = max(d, y - 1.0);",
    "  return d;",
    "}",
    "float sdCross2(vec2 p){",
    "  float d = sdArm(p);",
    "  d = min(d, sdArm(vec2(-p.y, p.x)));",
    "  d = min(d, sdArm(-p));",
    "  d = min(d, sdArm(vec2(p.y, -p.x)));",
    "  return d;",
    "}",
    "float sdCross(vec3 p){",
    "  vec2 w = vec2(sdCross2(p.xy), abs(p.z) - 0.16);",
    "  return length(max(w, 0.0)) + min(max(w.x, w.y), 0.0) - 0.04;",
    "}",
    "float shapeOf(vec3 p, float id){",
    "  int i = int(id + 0.5);",
    "  if (i == 0) return sdI(p);",
    "  if (i == 1) return length(p) - 0.52;",
    "  if (i == 2) return sdTwo(p);",
    "  if (i == 3) return sdFour(p);",
    "  if (i == 4) return sdCube(p);",
    "  if (i == 5) return sdDiamond(p);",
    "  if (i == 6) return sdFrame(p);",
    "  if (i == 7) return sdPyr(p);",
    "  return sdCross(p);",
    "}",
    "float mapAt(vec3 p){",
    "  vec3 q = rotY(p, uYaw);",
    "  float sx = mix(1.0, 0.30, uFlat);",
    "  float sy = mix(1.0, 6.5, uFlat);",
    "  q.x *= sx;",
    "  q.y *= sy;",
    "  float d = mix(shapeOf(q, uIdA), shapeOf(q, uIdB), uK);",
    "  return d / sy;",
    "}",
    "vec3 normalAt(vec3 p){",
    "  float e = 0.0022;",
    "  vec2 h = vec2(1.0, -1.0) * 0.5773;",
    "  return normalize(",
    "    h.xyy * mapAt(p + h.xyy * e) +",
    "    h.yyx * mapAt(p + h.yyx * e) +",
    "    h.yxy * mapAt(p + h.yxy * e) +",
    "    h.xxx * mapAt(p + h.xxx * e)",
    "  );",
    "}",
    "vec3 bgOf(vec2 uv){",
    "  float g = uv.y * 0.62 + uv.x * 0.22;",
    "  vec3 top = vec3(0.91, 0.91, 1.0);",
    "  vec3 bot = vec3(0.63, 0.74, 0.96);",
    "  vec3 c = mix(bot, top, clamp(g, 0.0, 1.0));",
    "  float v = length(uv - vec2(0.42, 0.62));",
    "  c = mix(c, vec3(0.58, 0.70, 0.95), smoothstep(0.35, 0.85, v));",
    "  return c;",
    "}",
    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",
    "  vec2 suv = gl_FragCoord.xy / uRes;",
    "  vec3 ro = vec3(0.0, 0.16, uCam);",
    "  vec3 rd = normalize(vec3(uv, -1.45));",
    "  float dist = 0.0;",
    "  float hit = -1.0;",
    "  for (int i = 0; i < 72; i++){",
    "    float d = mapAt(ro + rd * dist);",
    "    if (d < 0.0016){ hit = dist; break; }",
    "    dist += d;",
    "    if (dist > 8.0) break;",
    "  }",
    "  vec3 bg = bgOf(suv);",
    "  if (hit < 0.0){ gl_FragColor = vec4(bg, 1.0); return; }",
    "  vec3 p = ro + rd * hit;",
    "  vec3 n = normalAt(p);",
    "  float ndv = max(dot(n, -rd), 0.0);",
    "  float fres = pow(1.0 - ndv, 2.35);",
    "  float up = clamp(n.y * 0.55 + p.y * 0.35 + 0.45, 0.0, 1.0);",
    "  vec3 tint = mix(vec3(0.20, 0.72, 1.0), vec3(0.96, 0.28, 0.92), up);",
    "  float side = clamp(n.x * 0.5 + 0.5, 0.0, 1.0);",
    "  tint = mix(tint, mix(vec3(0.15, 0.86, 1.0), vec3(1.0, 0.32, 0.78), side), 0.55);",
    "  vec3 through = bgOf(suv + n.xy * 0.14) * tint;",
    "  vec3 edge = mix(vec3(0.35, 0.95, 1.0), vec3(1.0, 0.25, 0.86), clamp(side * 0.75 + up * 0.35, 0.0, 1.0));",
    "  vec3 col = mix(through, tint, 0.22);",
    "  col = mix(col, vec3(1.0), fres * 0.22);",
    "  col += edge * fres * 0.95;",
    "  vec3 l1 = normalize(vec3(-0.4, 0.9, 0.45));",
    "  vec3 h1 = normalize(l1 - rd);",
    "  col += vec3(1.0) * pow(max(dot(n, h1), 0.0), 80.0) * 0.75;",
    "  vec3 l2 = normalize(vec3(0.6, -0.2, 0.5));",
    "  vec3 h2 = normalize(l2 - rd);",
    "  col += vec3(1.0, 0.45, 0.9) * pow(max(dot(n, h2), 0.0), 50.0) * 0.28;",
    "  col = mix(col, bg, smoothstep(5.5, 7.6, hit));",
    "  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);",
    "}"
  ].join("\n");

  /* shape ids: 0 I, 1 sphere, 2 two, 3 four, 4 cube, 5 diamond, 6 frame, 7 pyramid, 8 cross */
  var GLASS_SEGS = [
    [0.0, 2.8, 0, 0, 0, 0, 0.04, 0.1],
    [2.8, 4.2, 0, 1, 0, 1, 0.1, 0.35],
    [4.2, 5.2, 1, 1, 1, 0, 0.2, 0.0],
    [5.2, 6.6, 1, 2, 0, 0, 0.0, 0.0],
    [6.6, 7.4, 2, 2, 0, 0, 0.0, 0.0],
    [7.4, 8.6, 2, 3, 0, 0, 0.0, 0.0],
    [8.6, 9.4, 3, 3, 0, 0, 0.0, 0.0],
    [9.4, 10.6, 3, 4, 0, 0, 0.05, 0.4],
    [10.6, 11.3, 4, 4, 0, 0, 0.4, 0.4],
    [11.3, 12.2, 4, 5, 0, 0, 0.15, 0.0],
    [12.2, 13.8, 5, 5, 0, 0, 0.0, 0.0],
    [13.8, 14.8, 5, 6, 0, 0, 0.0, 0.0],
    [14.8, 15.8, 6, 6, 0, 0, 0.0, 0.0],
    [15.8, 17.2, 6, 7, 0, 1, 0.0, 0.3],
    [17.2, 18.2, 7, 7, 1, 0, 0.25, 0.2],
    [18.2, 20.0, 7, 7, 0, 0, 0.35, 0.35],
    [20.0, 21.4, 7, 5, 0, 0, 0.2, 0.08],
    [21.4, 22.8, 5, 8, 0, 0, 0.08, 0.0],
    [22.8, 25.8, 8, 8, 0, 0, 0.0, 0.04],
    [25.8, 27.0, 8, 0, 0, 0, 0.04, 0.04]
  ];

  function glassUniforms(t) {
    var time = ((t % DUR.glass) + DUR.glass) % DUR.glass;
    var seg = GLASS_SEGS[0];
    for (var i = 0; i < GLASS_SEGS.length; i++) {
      if (time >= GLASS_SEGS[i][0] && time <= GLASS_SEGS[i][1] + 0.0001) seg = GLASS_SEGS[i];
    }
    var k = smooth((time - seg[0]) / (seg[1] - seg[0] || 1));
    var flat = lerp(seg[4], seg[5], k);
    return {
      a: seg[2],
      b: seg[3],
      k: seg[2] === seg[3] ? 0 : k,
      flat: flat,
      yaw: lerp(seg[6], seg[7], k),
      cam: lerp(4.05, 1.15, flat)
    };
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function initGlass() {
    var canvas = document.getElementById("glass-canvas");
    var gl = canvas.getContext("webgl", { antialias: true, alpha: false, premultipliedAlpha: false });
    var state = { t: reduce ? HOLD.glass : seek % DUR.glass, playing: play0 };
    studies.glass = state;
    setPlayButton("glass", state.playing);

    if (!gl) {
      var ctx = canvas.getContext("2d");
      jobs.push(function () {
        var size = fitCanvas(canvas, 640);
        if (!ctx) return;
        var g = ctx.createLinearGradient(0, 0, size.w, size.h);
        g.addColorStop(0, "#e8e9ff");
        g.addColorStop(1, "#8fb0ee");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size.w, size.h);
      });
      return;
    }

    var vs = compile(gl, gl.VERTEX_SHADER, GLASS_VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, GLASS_FRAG);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    var loc = {
      res: gl.getUniformLocation(prog, "uRes"),
      a: gl.getUniformLocation(prog, "uIdA"),
      b: gl.getUniformLocation(prog, "uIdB"),
      k: gl.getUniformLocation(prog, "uK"),
      flat: gl.getUniformLocation(prog, "uFlat"),
      yaw: gl.getUniformLocation(prog, "uYaw"),
      cam: gl.getUniformLocation(prog, "uCam")
    };

    function draw() {
      var size = fitCanvas(canvas, 640);
      var u = glassUniforms(reduce ? HOLD.glass : state.t);
      gl.viewport(0, 0, size.w, size.h);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(loc.res, size.w, size.h);
      gl.uniform1f(loc.a, u.a);
      gl.uniform1f(loc.b, u.b);
      gl.uniform1f(loc.k, u.k);
      gl.uniform1f(loc.flat, u.flat);
      gl.uniform1f(loc.yaw, u.yaw);
      gl.uniform1f(loc.cam, u.cam);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    jobs.push(function (dt) {
      if (state.playing) state.t += dt;
      draw();
    });
    draw();
  }

  /* ---------- 4. Tile row ---------- */

  var TILES = [
    { id: "design", name: "Product&Design", aspect: 1.42, radius: "3rem", glow: "#ff7eb6" },
    { id: "engineering", name: "Engineering", aspect: 1, radius: "3rem", glow: "#3aa0ff" },
    { id: "data", name: "Data", aspect: 1.86, radius: "999px", glow: "#3dce55" },
    { id: "light", name: "Light", label: false, aspect: 1.08, radius: "3rem", glow: "#ffd27a" },
    { id: "business", name: "Business", aspect: 1.92, radius: "999px", glow: "#b06bff" },
    { id: "security", name: "Security", aspect: 1, radius: "2.75rem", glow: "#ff8a2a" }
  ];

  var BITS = [
    "010011010110110010110100101101001011010",
    "110100101101001011001011010010110100101",
    "001011010010110101101001011010010110010",
    "101101001011010010110100101100101101001",
    "010110100101101001011001011010010110100",
    "110010110100101101001011010010110100101",
    "001011001011010010110101101001011010010"
  ];

  function tileFace(tile) {
    if (tile.id === "design") {
      return (
        '<div class="design-stack">' +
          '<svg class="spline" viewBox="0 0 200 56" aria-hidden="true">' +
            '<path d="M12 36 C 48 36, 72 18, 100 18 S 152 36, 188 36" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' +
            '<circle cx="100" cy="18" r="4.2" fill="none" stroke="#fff" stroke-width="1.4"/>' +
            '<path d="M12 36 l3.1 -3.1 l3.1 3.1 l-3.1 3.1 z" fill="none" stroke="#fff" stroke-width="1.15"/>' +
            '<path d="M188 36 l3.1 -3.1 l3.1 3.1 l-3.1 3.1 z" fill="none" stroke="#fff" stroke-width="1.15" transform="translate(-6.2 0)"/>' +
          "</svg>" +
          '<span class="tile-label">Product&amp;Design</span>' +
        "</div>"
      );
    }
    if (tile.id === "engineering") {
      return '<div class="eng-row"><span class="orb" aria-hidden="true"></span><span class="tile-label">Engineering</span></div>';
    }
    if (tile.id === "data") {
      return '<div class="bits" aria-hidden="true">' + BITS.join("<br>") + '</div><div class="center-label"><span class="tile-label">Data</span></div>';
    }
    if (tile.id === "business") {
      return '<div class="floor" aria-hidden="true"></div><div class="center-label"><span class="tile-label">Business</span></div>';
    }
    if (tile.id === "security") {
      return '<div class="streaks" aria-hidden="true"></div><div class="center-label"><span class="tile-label">Security</span></div>';
    }
    return "";
  }

  function tileNode(tile, copy) {
    var el = document.createElement("div");
    el.className = "tile tile-" + tile.id;
    el.style.setProperty("--aspect", String(tile.aspect));
    el.style.setProperty("--tile-radius", tile.radius);
    el.style.setProperty("--glow", tile.glow);
    el.setAttribute("data-id", tile.id);
    el.setAttribute("data-copy", String(copy));
    if (tile.label === false) el.setAttribute("aria-label", "Warm light");
    el.innerHTML =
      '<div class="tile-glow" aria-hidden="true"></div>' +
      '<div class="tile-face"><div class="mesh"></div>' + tileFace(tile) + "</div>";
    return el;
  }

  function initTiles() {
    var stage = document.getElementById("row-stage");
    var track = document.getElementById("row-track");
    var live = document.getElementById("row-live");
    var n = TILES.length;
    for (var c = 0; c < 3; c++) {
      for (var i = 0; i < n; i++) track.appendChild(tileNode(TILES[i], c));
    }
    var meshes = {
      design: "radial-gradient(120% 80% at 50% 18%, #ff8a3d 0%, transparent 42%), radial-gradient(90% 70% at 50% 48%, #ff4fa3 0%, transparent 55%), radial-gradient(120% 80% at 50% 100%, #d7ecff 0%, #f7fbff 42%, transparent 70%), linear-gradient(#ffe0f2, #c9ddff)",
      engineering: "radial-gradient(70% 80% at 32% 50%, #bff7ff 0%, transparent 46%), radial-gradient(120% 120% at 70% 40%, #2f7dff 0%, #1a4ed8 55%, #3d8bff 100%)",
      data: "radial-gradient(80% 70% at 50% 50%, #0e7a28 0%, transparent 62%), radial-gradient(120% 100% at 50% 0%, #b6ff8a 0%, transparent 46%), linear-gradient(#7CFF6A, #2fce45 55%, #8dff72)",
      light: "radial-gradient(70% 42% at 50% 32%, #fff 0%, #ffd48a 28%, transparent 62%), radial-gradient(70% 42% at 50% 70%, #fff 0%, #ffbf6a 30%, transparent 64%), linear-gradient(#fff7ea, #ffe0b0)",
      business: "radial-gradient(90% 70% at 50% 0%, #f3c6ff 0%, transparent 50%), radial-gradient(80% 60% at 50% 72%, #5a2d88 0%, transparent 70%), linear-gradient(#e39bff, #7a4dff 58%, #c084fc)",
      security: "radial-gradient(80% 80% at 50% 45%, #ffb15a 0%, transparent 60%), linear-gradient(#ff9a3c, #ff6a1a 70%, #ffb067)"
    };
    var faces = track.querySelectorAll(".tile");
    for (var f = 0; f < faces.length; f++) {
      var id = faces[f].getAttribute("data-id");
      var mesh = faces[f].querySelector(".mesh");
      if (mesh && meshes[id]) mesh.style.setProperty("--mesh", meshes[id]);
    }

    var origin = n + 1;
    var cursor = origin;
    var target = origin;
    var acc = 0;
    var announced = "";
    var state = { t: 0, playing: play0 };
    studies.tiles = state;
    setPlayButton("tiles", state.playing);

    if (reduce) {
      cursor = n;
      target = n;
    } else if (seek) {
      var steps = Math.floor((seek % DUR.tiles) / 2.5);
      cursor = origin + steps;
      target = cursor;
    }

    function nodeAt(index) {
      var nodes = track.children;
      var i = ((Math.round(index) % (n * 3)) + n * 3) % (n * 3);
      return nodes[i];
    }

    function announce(index) {
      var shown = TILES[((Math.round(index) % n) + n) % n];
      var name = shown.label === false ? "Warm light" : shown.name;
      if (name === announced) return;
      announced = name;
      live.textContent = name;
    }

    function layout(animateCss) {
      var node = nodeAt(cursor);
      if (!node) return;
      var stageW = stage.clientWidth;
      var center = node.offsetLeft + node.offsetWidth / 2;
      var x = stageW / 2 - center;
      var frac = cursor - Math.floor(cursor);
      if (frac > 0.001 && frac < 0.999) {
        var a = nodeAt(Math.floor(cursor));
        var b = nodeAt(Math.ceil(cursor));
        var ca = a.offsetLeft + a.offsetWidth / 2;
        var cb = b.offsetLeft + b.offsetWidth / 2;
        x = stageW / 2 - lerp(ca, cb, frac);
      }
      track.style.transition = animateCss ? "transform 700ms var(--ease)" : "none";
      track.style.transform = "translate3d(" + x + "px,0,0)";
    }

    function normalize() {
      if (Math.abs(cursor - target) > 0.02) return;
      if (cursor >= n * 2) {
        cursor -= n;
        target -= n;
        layout(false);
      } else if (cursor < n) {
        cursor += n;
        target += n;
        layout(false);
      }
    }

    jobs.push(function (dt) {
      if (state.playing && !pointer && Math.abs(target - cursor) < 0.02) {
        acc += dt;
        if (acc >= 2.5) {
          acc = 0;
          target += 1;
          announce(target);
        }
      }
      var diff = target - cursor;
      if (Math.abs(diff) > 0.0008) {
        cursor += diff * (1 - Math.pow(0.035, dt));
        if (Math.abs(target - cursor) < 0.0008) cursor = target;
        layout(false);
        normalize();
      }
    });

    var pointer = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      pointer = { x: e.clientX, cursor: cursor, target: target };
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", function (e) {
      if (!pointer) return;
      var dx = e.clientX - pointer.x;
      var unit = Math.max(80, stage.clientHeight * 0.55);
      cursor = pointer.cursor - dx / unit;
      target = cursor;
      layout(false);
    });
    function endPointer() {
      if (!pointer) return;
      target = Math.round(cursor);
      pointer = null;
      acc = 0;
      if (reduce || !state.playing) {
        cursor = target;
        layout(false);
        normalize();
      }
      announce(target);
    }
    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    stage.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      studies.tiles.nudge(dir);
    });

    layout(false);
    announce(target);
    window.addEventListener("resize", function () { layout(false); });

    function snapTo(index) {
      target = index;
      cursor = index;
      acc = 0;
      layout(false);
      normalize();
      announce(target);
    }

    studies.tiles.hold = function () {
      snapTo(Math.round(cursor));
    };

    studies.tiles.replay = function () {
      acc = 0;
      if (reduce) {
        cursor = n;
        target = n;
      } else {
        cursor = origin;
        target = origin;
        state.playing = true;
        setPlayButton("tiles", true);
        kick();
      }
      layout(false);
      announce(target);
    };
    studies.tiles.nudge = function (dir) {
      snapTo(Math.round(cursor) + dir);
      if (!reduce && state.playing) {
        cursor = target - dir;
        layout(false);
      }
    };
  }

  function wire() {
    var buttons = document.querySelectorAll("[data-study]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", onControl);
    }
  }

  function onControl(e) {
    var btn = e.currentTarget;
    var id = btn.getAttribute("data-study");
    var act = btn.getAttribute("data-act");
    var state = studies[id];
    if (!state) return;
    if (act === "replay") {
      if (id === "tiles" && state.replay) {
        state.replay();
        return;
      }
      state.t = reduce ? (id === "glass" ? HOLD.glass : HOLD[id] * DUR[id]) : 0;
      if (!reduce) {
        state.playing = true;
        setPlayButton(id, true);
        kick();
      }
      return;
    }
    if (act === "play") {
      if (reduce) return;
      state.playing = !state.playing;
      setPlayButton(id, state.playing);
      if (!state.playing && state.hold) state.hold();
      if (state.playing) kick();
      return;
    }
    if (id === "tiles" && state.nudge) {
      state.nudge(act === "next" ? 1 : -1);
    }
  }

  function redraw() {
    for (var i = 0; i < jobs.length; i++) jobs[i](0);
  }

  initField();
  initPosters();
  initGlass();
  initTiles();
  wire();
  kick();
  window.addEventListener("resize", redraw);
  window.addEventListener("load", redraw);

  if (reduce) redraw();
})();

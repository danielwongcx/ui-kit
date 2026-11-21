(function () {
  "use strict";

  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function wrap(t) { t %= 1; return t < 0 ? t + 1 : t; }
  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function mix(a, b, t) { return a + (b - a) * t; }
  function mix3(a, b, t) {
    return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  }
  function mixW(parts, weights) {
    var s = 0;
    var i;
    for (i = 0; i < weights.length; i++) s += weights[i];
    if (s < 0.0001) s = 1;
    var r = 0, g = 0, b = 0;
    for (i = 0; i < parts.length; i++) {
      r += parts[i][0] * weights[i];
      g += parts[i][1] * weights[i];
      b += parts[i][2] * weights[i];
    }
    return [r / s, g / s, b / s];
  }
  function rgb(c) {
    return "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")";
  }
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(c) {
    function h(v) { var s = clamp(v, 0, 255) | 0; return (s < 16 ? "0" : "") + s.toString(16); }
    return "#" + h(c[0]) + h(c[1]) + h(c[2]);
  }

  /* ------------------------------------------------------------------ Capsule */

  var capsule = (function () {
    var SW = 60;
    var SH = 26;
    var cell = document.getElementById("capsule-cell");
    var shell = document.getElementById("capsule");
    var view = document.getElementById("capsule-view");
    var canvas = document.getElementById("capsule-canvas");
    var slider = document.getElementById("capsule-scrub");
    var ctx = canvas.getContext("2d", { alpha: false });
    var off = document.createElement("canvas");
    off.width = SW;
    off.height = SH;
    var octx = off.getContext("2d", { alpha: false });
    var image = octx.createImageData(SW, SH);
    var px = image.data;

    var PAL = {
      W: [236, 236, 236],
      R: [196, 42, 50],
      K: [28, 26, 32],
      B: [48, 92, 156],
      N: [232, 216, 188],
      D: [112, 74, 44],
      S: [186, 150, 98],
      G: [36, 112, 58],
      g: [72, 158, 82],
      E: [244, 244, 238],
      H: [232, 232, 228]
    };

    var LH = [
      "....YY....",
      "...YYYY...",
      "...YKKY...",
      "....WW....",
      "...WRRW...",
      "...WWWW...",
      "...WRRW...",
      "...WWWW...",
      "...WRRW...",
      "...WWWW...",
      "...WRRW...",
      "...WWWW...",
      "...WRRW...",
      "..WWWWWW..",
      ".WWKWWWKW.",
      "WWWWWWWWWW",
      ".WWWWWWWW."
    ];
    var HOUSE = [
      "...BBBB...",
      "..BBBBBB..",
      ".BBBBBBBB.",
      "NNNNNNNNNN",
      "NNLLNNLLNN",
      "NNLLNNLLNN",
      "NNNNNDNNNN",
      "NNNNNDNNNN",
      "SSSSSSSSSS"
    ];
    var TREE = [
      "...GGGG...",
      "..GgggGG..",
      ".GggggggG.",
      "GggGgggggG",
      ".GggggggG.",
      "..GGggGG..",
      "....DD....",
      "....DD....",
      "....DD....",
      "...DDDD..."
    ];
    var BOAT = [
      "....E.....",
      "...EEE....",
      "..EEEEE...",
      ".EEEEEEE..",
      "....K.....",
      ".KKKKKKK..",
      "..KKKKKK..",
      "...HHHH..."
    ];
    var BENCH = [
      "DDDDDDDD",
      "D......D",
      "D......D"
    ];
    var STARS = [
      [6, 3], [14, 6], [22, 2], [34, 5], [46, 3], [54, 7],
      [10, 9], [28, 8], [40, 4], [18, 12], [50, 10]
    ];

    var phase = reduce ? 0.08 : 0.02;
    var hold = 0;
    var lensX = 0.22;
    var lensY = 0.46;
    var targetX = lensX;
    var targetY = lensY;
    var pointerInside = false;
    var dragX = null;
    var cssW = 0;
    var cssH = 0;
    var label = "";

    function setPx(x, y, c) {
      x |= 0;
      y |= 0;
      if (x < 0 || y < 0 || x >= SW || y >= SH || !c) return;
      var i = (y * SW + x) * 4;
      px[i] = c[0] < 0 ? 0 : c[0] > 255 ? 255 : c[0];
      px[i + 1] = c[1] < 0 ? 0 : c[1] > 255 ? 255 : c[1];
      px[i + 2] = c[2] < 0 ? 0 : c[2] > 255 ? 255 : c[2];
      px[i + 3] = 255;
    }

    function disc(cx, cy, rad, col) {
      var r = Math.ceil(rad);
      var r2 = rad * rad;
      for (var y = -r; y <= r; y++) {
        for (var x = -r; x <= r; x++) {
          if (x * x + y * y <= r2) setPx(cx + x, cy + y, col);
        }
      }
    }

    function blit(sprite, ox, oy, night, sunset) {
      var k = 1 - night * 0.62 - sunset * 0.12;
      for (var y = 0; y < sprite.length; y++) {
        var row = sprite[y];
        for (var x = 0; x < row.length; x++) {
          var ch = row.charAt(x);
          if (ch === "." || ch === " ") continue;
          var col;
          if (ch === "L") {
            col = night > 0.35 ? [255, 214, 120] : [36 * k, 44 * k, 62 * k];
          } else if (ch === "Y") {
            col = night > 0.25 ? [255, 236, 150] : [255, 220, 120];
          } else if (ch === "P") {
            col = [255, 244, 210];
          } else {
            var base = PAL[ch];
            if (!base) continue;
            col = [
              base[0] * k + sunset * 26,
              base[1] * k * (1 - sunset * 0.08),
              base[2] * k * (1 - sunset * 0.22)
            ];
          }
          setPx(ox + x, oy + y, col);
        }
      }
    }

    function weights(t) {
      var day = Math.max(1 - smoothstep(0.16, 0.34, t), smoothstep(0.78, 0.96, t));
      var sunset = smoothstep(0.18, 0.36, t) * (1 - smoothstep(0.46, 0.6, t));
      var night = smoothstep(0.48, 0.64, t) * (1 - smoothstep(0.76, 0.9, t));
      var s = day + sunset + night;
      if (s < 0.001) return { day: 1, sunset: 0, night: 0 };
      return { day: day / s, sunset: sunset / s, night: night / s };
    }

    function paintScene(now) {
      var w = weights(phase);
      var day = w.day;
      var sunset = w.sunset;
      var night = w.night;
      var top = mixW(
        [[132, 198, 232], [244, 122, 88], [12, 14, 40]],
        [day, sunset, night]
      );
      var bot = mixW(
        [[236, 216, 186], [255, 176, 112], [34, 30, 64]],
        [day, sunset, night]
      );
      var water = mixW(
        [[52, 142, 182], [86, 72, 118], [16, 34, 70]],
        [day, sunset, night]
      );
      var waterHi = mixW(
        [[150, 206, 224], [168, 124, 142], [42, 70, 118]],
        [day, sunset, night]
      );
      var sand = mixW(
        [[214, 178, 116], [168, 118, 82], [72, 60, 48]],
        [day, sunset, night]
      );
      var y, x;
      var horizon = 16;
      for (y = 0; y < horizon; y++) {
        var col = mix3(top, bot, y / (horizon - 1));
        for (x = 0; x < SW; x++) setPx(x, y, col);
      }
      if (night > 0.15) {
        for (var s = 0; s < STARS.length; s++) {
          var tw = 0.55 + 0.45 * Math.sin(now * 0.003 + s * 1.7);
          if (tw < 0.2) continue;
          var sc = [230 * night * tw, 234 * night * tw, 255 * night * tw];
          setPx(STARS[s][0], STARS[s][1], sc);
        }
      }
      if (day + sunset > 0.08) {
        var sunR = 1.6 + sunset * 5.2 + day * 0.3;
        var sunX = 30 + day * 2 - sunset * 8;
        var sunY = 3 + sunset * 2;
        disc(sunX, sunY, sunR, [255, 220 - sunset * 30, 130]);
        disc(sunX, sunY, Math.max(1, sunR * 0.4), [255, 246, 214]);
      }
      if (night > 0.2) {
        disc(12, 4, 1.8, [236, 230, 206]);
        disc(13, 4, 1.2, [18, 20, 42]);
      }
      var wave = Math.floor(now / 280) % 8;
      for (y = horizon; y < SH; y++) {
        for (x = 0; x < SW; x++) {
          var shore = 34 + (y - horizon) * 0.4;
          if (x > shore) setPx(x, y, sand);
          else if ((x + wave + y * 3) % 7 === 0) setPx(x, y, waterHi);
          else setPx(x, y, water);
        }
      }
      blit(LH, 2, 2, night, sunset);
      blit(HOUSE, 13, 8, night, sunset);
      blit(TREE, 44, 6, night, sunset);
      blit(BENCH, 52, 18, night, sunset);
      var bob = reduce ? 0 : Math.round(Math.sin(now * 0.002) * 0.6);
      blit(BOAT, 26, 16 + bob, night, sunset);
      if (night > 0.35) {
        var beam = [255, 220, 120];
        for (var i = 0; i < 8; i++) {
          var fall = 1 - i / 8;
          setPx(11 + i, 3, [beam[0] * fall, beam[1] * fall, beam[2] * fall * 0.55]);
        }
      }
      return w;
    }

    function resize() {
      var rect = view.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
    }

    function drawLens(wts) {
      var R = cssH * 0.42;
      var sx = lensX * cssW;
      var sy = lensY * cssH;
      var scaleX = cssW / SW;
      var scaleY = cssH / SH;
      var step = Math.max(3, Math.round(Math.min(scaleX, scaleY)));
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, R, 0, Math.PI * 2);
      ctx.clip();
      var x, y;
      for (y = sy - R; y < sy + R; y += step) {
        for (x = sx - R; x < sx + R; x += step) {
          var dx = x + step * 0.5 - sx;
          var dy = y + step * 0.5 - sy;
          var nx = dx / R;
          var ny = dy / R;
          var r2 = nx * nx + ny * ny;
          if (r2 > 1) continue;
          var z = Math.sqrt(1 - r2);
          var mag = 0.28 + 0.2 * (1 - z);
          var srcX = (sx + dx * mag) / scaleX;
          var srcY = (sy + dy * mag) / scaleY;
          var si = clamp(srcX, 0, SW - 1) | 0;
          var sj = clamp(srcY, 0, SH - 1) | 0;
          var i = (sj * SW + si) * 4;
          var rim = Math.pow(1 - z, 1.5);
          var shade = 1 - rim * 0.5;
          var r = px[i] * shade + rim * 48 + wts.sunset * 18;
          var g = px[i + 1] * shade + rim * 52;
          var b = px[i + 2] * shade + rim * 70;
          ctx.fillStyle = "rgb(" + clamp(r, 0, 255) + "," + clamp(g, 0, 255) + "," + clamp(b, 0, 255) + ")";
          ctx.fillRect(x, y, step, step);
        }
      }
      ctx.restore();
      var hg = ctx.createRadialGradient(sx - R * 0.34, sy - R * 0.38, R * 0.02, sx - R * 0.05, sy - R * 0.08, R);
      hg.addColorStop(0, "rgba(255,255,255,0.5)");
      hg.addColorStop(0.12, "rgba(255,255,255,0.1)");
      hg.addColorStop(0.3, "rgba(255,255,255,0)");
      hg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(sx, sy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, R - 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, R - 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(20,16,12,0.28)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function draw(now) {
      if (!cssW || !cssH) return;
      var wts = paintScene(now || 0);
      var dpr = canvas.width / cssW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      octx.putImageData(image, 0, 0);
      ctx.drawImage(off, 0, 0, cssW, cssH);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      var gx = cssW / SW;
      var gy = cssH / SH;
      var i;
      for (i = 0; i <= SW; i++) ctx.rect(i * gx, 0, 1, cssH);
      for (i = 0; i <= SH; i++) ctx.rect(0, i * gy, cssW, 1);
      ctx.fill();
      drawLens(wts);
      var bg = mixW(
        [[243, 237, 227], [120, 104, 112], [36, 34, 44]],
        [wts.day, wts.sunset, wts.night]
      );
      cell.style.background = rgb(bg);
      cell.style.color = wts.night > 0.55 ? "#F4F1EA" : "#1C1C22";
      shell.style.setProperty("--warm", (wts.sunset * 0.95 + wts.night * 0.4).toFixed(3));
      var nextLabel = wts.night > 0.55 ? "Night" : wts.sunset > 0.45 ? "Sunset" : "Day";
      if (nextLabel !== label) {
        label = nextLabel;
        slider.setAttribute("aria-valuetext", nextLabel);
      }
      if (document.activeElement !== slider) slider.value = String(Math.round(phase * 1000));
    }

    function tick(dt, now) {
      if (hold > 0) hold -= dt;
      else phase = wrap(phase + dt / 16);
      if (!pointerInside) {
        targetX = 0.16 + 0.58 * (0.5 + 0.5 * Math.sin(now * 0.00032));
        targetY = 0.5 + 0.08 * Math.sin(now * 0.00021);
      }
      var k = 1 - Math.exp(-dt * 8);
      lensX += (targetX - lensX) * k;
      lensY += (targetY - lensY) * k;
      lensX = clamp(lensX, 0.12, 0.88);
      lensY = clamp(lensY, 0.3, 0.72);
      draw(now);
    }

    slider.addEventListener("input", function () {
      phase = Number(slider.value) / 1000;
      hold = 1.8;
      if (reduce) draw(0);
    });

    cell.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      phase = wrap(phase + e.deltaY * 0.00045);
      hold = 1.8;
      if (reduce) draw(0);
    }, { passive: false });

    view.addEventListener("pointerenter", function () { pointerInside = true; });
    view.addEventListener("pointerleave", function () {
      pointerInside = false;
      dragX = null;
    });
    view.addEventListener("pointerdown", function (e) {
      pointerInside = true;
      dragX = e.clientX;
      view.setPointerCapture(e.pointerId);
    });
    view.addEventListener("pointermove", function (e) {
      var rect = view.getBoundingClientRect();
      if (!rect.width) return;
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
      if (dragX != null) {
        phase = wrap(phase + (e.clientX - dragX) / rect.width);
        dragX = e.clientX;
        hold = 1.8;
      }
      if (reduce) {
        lensX = clamp(targetX, 0.12, 0.88);
        lensY = clamp(targetY, 0.3, 0.72);
        draw(0);
      }
    });
    view.addEventListener("pointerup", function () { dragX = null; });
    view.addEventListener("pointercancel", function () { dragX = null; });

    resize();
    if (reduce) draw(0);

    return { tick: tick, resize: resize, draw: function () { draw(0); } };
  })();

  /* ------------------------------------------------------------------ Receipt */

  var receipt = (function () {
    var LINES = [
      { item: "Site visit", hrs: 1 },
      { item: "Sketch", hrs: 1.5 },
      { item: "Note", hrs: 0.5 },
      { item: "Type", hrs: 2 },
      { item: "Export", hrs: 0.5 }
    ];
    var RATES = { solo: 32, bench: 48, atelier: 64 };
    var PRICES = { solo: 0, bench: 18, atelier: 36 };
    var FEATS = {
      solo: ["One clock on the desk", "A receipt for the client", "The rate stays where you set it"],
      bench: ["One rate for the room", "Hours split by person", "A nudge when a job runs long"],
      atelier: ["Rooms, roles, and payouts", "The ledger closes itself", "A file your bookkeeper knows"]
    };
    var sky = document.getElementById("sky");
    var rowsEl = document.getElementById("slip-rows");
    var totalEl = document.getElementById("slip-total");
    var rateEl = document.getElementById("slip-rate");
    var timeEl = document.getElementById("screen-time");
    var payEl = document.getElementById("screen-pay");
    var slip = document.getElementById("slip");
    var feats = document.getElementById("feats");
    var live = document.getElementById("receipt-live");
    var monthBtn = document.getElementById("bill-month");
    var yearBtn = document.getElementById("bill-year");
    var plan = "bench";
    var yearly = false;
    var state = { elapsed: 0, acc: 0, next: 0, eject: 0, lines: [] };

    function money(n) { return "$" + n.toFixed(2); }
    function clock(seconds) {
      seconds = Math.max(0, Math.floor(seconds));
      var h = Math.floor(seconds / 3600);
      var m = Math.floor(seconds / 60) % 60;
      var s = seconds % 60;
      function p(v) { return (v < 10 ? "0" : "") + v; }
      return h + ":" + p(m) + ":" + p(s);
    }
    function skyWeights(t) {
      var day = Math.max(1 - smoothstep(0.18, 0.36, t), smoothstep(0.78, 0.96, t));
      var sunset = smoothstep(0.22, 0.4, t) * (1 - smoothstep(0.5, 0.64, t));
      var night = smoothstep(0.52, 0.68, t) * (1 - smoothstep(0.8, 0.94, t));
      return [day, sunset, night];
    }
    function applySky(t) {
      var w = skyWeights(wrap(t));
      var top = mixW([[142, 200, 232], [242, 132, 96], [16, 20, 48]], w);
      var bot = mixW([[240, 214, 176], [255, 186, 128], [28, 32, 64]], w);
      var sea = mixW([[60, 148, 184], [92, 78, 124], [18, 40, 78]], w);
      var sand = mixW([[228, 196, 140], [196, 150, 112], [92, 78, 62]], w);
      var sun = mixW([[255, 227, 138], [255, 176, 96], [255, 176, 96]], w);
      sky.style.setProperty("--top", rgb(top));
      sky.style.setProperty("--bot", rgb(bot));
      sky.style.setProperty("--sea", rgb(sea));
      sky.style.setProperty("--sand", rgb(sand));
      sky.style.setProperty("--sun", rgb(sun));
      var day = w[0], sunset = w[1], night = w[2];
      var sum = day + sunset + night || 1;
      sky.style.setProperty("--sun-o", String(clamp((day + sunset) / sum, 0, 1)));
      sky.style.setProperty("--moon-o", String(clamp(night / sum, 0, 1)));
      sky.style.setProperty("--sun-x", (82 - night / sum * 28) + "%");
      sky.style.setProperty("--sun-y", (16 + sunset / sum * 10) + "%");
      sky.style.setProperty("--sun-s", (2.25 + sunset / sum * 3.25) + "rem");
    }
    function renderPrices() {
      ["solo", "bench", "atelier"].forEach(function (id) {
        var node = document.getElementById("price-" + id);
        if (!node) return;
        if (id === "solo") node.textContent = "Free";
        else {
          var n = PRICES[id];
          if (yearly) n = Math.round(n * 0.8);
          node.textContent = "$" + n;
        }
      });
    }
    function renderFeats() {
      feats.textContent = "";
      FEATS[plan].forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        feats.appendChild(li);
      });
    }
    function renderRows() {
      rowsEl.textContent = "";
      var total = 0;
      var rate = RATES[plan];
      state.lines.forEach(function (line) {
        var amt = line.hrs * rate;
        total += amt;
        var row = document.createElement("div");
        row.className = "slip-row";
        [line.item, line.hrs.toFixed(1), money(amt)].forEach(function (text) {
          var span = document.createElement("span");
          span.textContent = text;
          row.appendChild(span);
        });
        rowsEl.appendChild(row);
      });
      totalEl.textContent = money(total);
      payEl.textContent = money(total);
      rateEl.textContent = rate + " / hour";
    }
    function setPlan(next) {
      plan = next;
      document.querySelectorAll('input[name="quay-plan"]').forEach(function (input) {
        input.checked = input.value === plan;
      });
      document.querySelectorAll(".device-tabs button").forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-plan") === plan ? "true" : "false");
      });
      renderPrices();
      renderFeats();
      renderRows();
    }
    function renderStatic() {
      state.lines = LINES.slice(0, 4);
      state.next = 4;
      state.eject = 0;
      slip.classList.remove("is-out");
      renderRows();
      timeEl.textContent = "1:12:00";
      applySky(0.08);
    }

    document.querySelectorAll('input[name="quay-plan"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (input.checked) setPlan(input.value);
      });
    });
    document.querySelectorAll(".device-tabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setPlan(btn.getAttribute("data-plan"));
      });
    });
    monthBtn.addEventListener("click", function () {
      yearly = false;
      monthBtn.setAttribute("aria-pressed", "true");
      yearBtn.setAttribute("aria-pressed", "false");
      renderPrices();
    });
    yearBtn.addEventListener("click", function () {
      yearly = true;
      monthBtn.setAttribute("aria-pressed", "false");
      yearBtn.setAttribute("aria-pressed", "true");
      renderPrices();
    });
    document.getElementById("compare-plans").addEventListener("click", function () {
      var on = document.querySelector('input[name="quay-plan"]:checked');
      if (on) on.focus();
    });
    document.getElementById("start-clock").addEventListener("click", function () {
      if (reduce) {
        renderStatic();
        live.textContent = "The clock stays on the afternoon receipt.";
        return;
      }
      state.elapsed = 0;
      state.acc = 0;
      state.eject = 0;
      state.next = 0;
      state.lines = [];
      slip.classList.remove("is-out");
      renderRows();
      applySky(0);
      timeEl.textContent = "0:00:00";
      live.textContent = "Clock restarted.";
    });

    if (reduce) renderStatic();
    else {
      renderRows();
      renderFeats();
      applySky(0);
      timeEl.textContent = "0:00:00";
    }

    return {
      tick: function (dt) {
        state.elapsed += dt;
        applySky(state.elapsed / 22);
        timeEl.textContent = clock(state.elapsed * 48);
        if (state.eject > 0) {
          state.eject -= dt;
          if (state.eject <= 0) {
            state.lines = [];
            state.next = 0;
            slip.classList.remove("is-out");
            renderRows();
          }
          return;
        }
        state.acc += dt;
        if (state.acc < 2.15) return;
        state.acc = 0;
        if (state.next >= LINES.length) {
          slip.classList.add("is-out");
          state.eject = 0.7;
          return;
        }
        state.lines.push(LINES[state.next]);
        state.next += 1;
        renderRows();
      }
    };
  })();

  /* ------------------------------------------------------------------- Shader */

  var shader = (function () {
    var cell = document.querySelector(".cell-shader");
    var canvas = document.getElementById("shader-canvas");
    var ctx = canvas.getContext("2d", { alpha: false });
    var BAYER = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
    var phase = reduce ? 0.22 : 0;
    var bendX = 0;
    var bendY = 0;
    var targetX = 0;
    var targetY = 0;
    var cssW = 0;
    var cssH = 0;

    function resize() {
      var rect = cell.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
    }

    function orbit(u) {
      var ang = u * Math.PI * 2;
      var x = cssW * 0.5 + Math.cos(ang) * cssW * 0.3 + Math.cos(ang * 2 + 0.7) * cssW * 0.05;
      var y = cssH * 0.5 + Math.sin(ang) * cssH * 0.26 + Math.sin(ang * 3) * cssH * 0.045;
      x += bendX * 0.35 * Math.sin(ang);
      y += bendY * 0.35 * Math.cos(ang);
      return [x, y];
    }

    function cometColor(f) {
      var tail = [106, 76, 255];
      var mid = [225, 91, 196];
      var head = [255, 138, 60];
      if (f < 0.5) return mix3(tail, mid, f / 0.5);
      return mix3(mid, head, (f - 0.5) / 0.5);
    }

    function draw() {
      if (!cssW || !cssH) return;
      var dpr = canvas.width / cssW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#08090d";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.beginPath();
      var gstep = 14;
      var i;
      for (i = 0; i <= cssW; i += gstep) ctx.rect(i, 0, 1, cssH);
      for (i = 0; i <= cssH; i += gstep) ctx.rect(0, i, cssW, 1);
      ctx.fill();

      var size = Math.max(22, Math.min(cssW * 0.072, 68));
      ctx.fillStyle = "#F5F7FA";
      ctx.font = "700 " + size + "px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "-0.03em";
      while (size > 16 && ctx.measureText("Move through it.").width > cssW * 0.86) {
        size -= 1;
        ctx.font = "700 " + size + "px ui-sans-serif, system-ui, sans-serif";
      }
      ctx.fillText("Move through it.", cssW * 0.5, cssH * 0.5);

      var block = Math.max(5, Math.round(Math.min(cssW, cssH) / 72));
      function stamp(x, y, radius, color, fade) {
        var x0 = Math.floor((x - radius) / block) * block;
        var y0 = Math.floor((y - radius) / block) * block;
        var py, px0;
        for (py = y0; py <= y + radius; py += block) {
          for (px0 = x0; px0 <= x + radius; px0 += block) {
            var cx = px0 + block * 0.5;
            var cy = py + block * 0.5;
            var d = Math.hypot(cx - x, cy - y);
            if (d > radius) continue;
            var cover = 1 - d / radius;
            var thresh = (BAYER[(py / block | 0) & 3][(px0 / block | 0) & 3] + 0.5) / 16;
            if (cover < thresh * (0.5 + 0.5 * (1 - fade))) continue;
            var light = 0.62 + 0.38 * cover;
            ctx.fillStyle = "rgb(" +
              (color[0] * light | 0) + "," +
              (color[1] * light | 0) + "," +
              (color[2] * light | 0) + ")";
            ctx.fillRect(px0, py, block - 1, block - 1);
          }
        }
      }
      for (i = 22; i >= 0; i--) {
        var f = 1 - i / 22;
        var p = orbit(phase - i * 0.0105);
        stamp(p[0], p[1], block * (0.9 + f * 3.15), cometColor(f), f);
      }
      var vig = ctx.createRadialGradient(cssW * 0.5, cssH * 0.5, cssW * 0.2, cssW * 0.5, cssH * 0.5, cssW * 0.72);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.38)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    cell.addEventListener("pointermove", function (e) {
      if (reduce) return;
      var rect = cell.getBoundingClientRect();
      targetX = clamp(e.clientX - rect.left - rect.width * 0.5, -rect.width * 0.4, rect.width * 0.4);
      targetY = clamp(e.clientY - rect.top - rect.height * 0.5, -rect.height * 0.4, rect.height * 0.4);
    });
    cell.addEventListener("pointerleave", function () {
      targetX = 0;
      targetY = 0;
    });

    resize();
    if (reduce) draw();

    return {
      resize: resize,
      draw: draw,
      tick: function (dt) {
        phase = wrap(phase + dt / 6.4);
        var k = 1 - Math.exp(-dt * 3.5);
        bendX += (targetX - bendX) * k;
        bendY += (targetY - bendY) * k;
        draw();
      }
    };
  })();

  /* ------------------------------------------------------------------- Mixer */

  var mixer = (function () {
    var root = document.getElementById("channels");
    var LEDS = ["#3DDC78", "#5BE07A", "#B6E04A", "#2EC8B8", "#7AA6FF"];
    var GLOWS = [
      "rgba(61,220,120,0.45)",
      "rgba(91,224,122,0.4)",
      "rgba(182,224,74,0.4)",
      "rgba(46,200,184,0.45)",
      "rgba(122,166,255,0.45)"
    ];
    var channels = [];
    var anySolo = false;

    function dbOf(v) { return -60 + v * 66; }
    function formatDb(db) {
      var n = Math.round(db * 10) / 10;
      var body = Math.abs(n).toFixed(1);
      if (n > 0) return "+" + body + " dB";
      if (n < 0) return "−" + body + " dB";
      return "0.0 dB";
    }
    function refreshSolo() {
      anySolo = channels.some(function (c) { return c.solo; });
    }
    function paint(ch) {
      var db = dbOf(ch.value);
      var level = ch.mute ? 0 : ch.meter;
      var dim = 1;
      if (anySolo && !ch.solo) {
        level *= 0.3;
        dim = 0.3;
      }
      ch.meterEl.style.setProperty("--level", String(clamp(level, 0, 1)));
      ch.meterEl.style.setProperty("--dim", String(dim));
      ch.rail.style.setProperty("--v", String(ch.value));
      ch.db.textContent = formatDb(db);
      ch.channel.classList.toggle("is-mute", ch.mute);
      ch.rail.setAttribute("aria-valuenow", String(Math.round(db)));
      ch.rail.setAttribute("aria-valuetext", formatDb(db) + (ch.mute ? ", muted" : "") + (ch.solo ? ", solo" : ""));
    }

    for (var i = 0; i < 5; i++) {
      (function (index) {
        var channel = document.createElement("div");
        channel.className = "channel";
        var name = document.createElement("div");
        name.className = "ch-name";
        name.textContent = "In " + (index + 1);
        var lane = document.createElement("div");
        lane.className = "lane";
        var meter = document.createElement("div");
        meter.className = "meter";
        meter.setAttribute("aria-hidden", "true");
        var meterOn = document.createElement("div");
        meterOn.className = "meter-on";
        meterOn.style.setProperty("--led", LEDS[index]);
        meterOn.style.setProperty("--glow", GLOWS[index]);
        meter.appendChild(meterOn);
        var rail = document.createElement("div");
        rail.className = "rail";
        rail.tabIndex = 0;
        rail.setAttribute("role", "slider");
        rail.setAttribute("aria-orientation", "vertical");
        rail.setAttribute("aria-valuemin", "-60");
        rail.setAttribute("aria-valuemax", "6");
        rail.setAttribute("aria-label", "In " + (index + 1) + " level");
        var line = document.createElement("span");
        line.className = "rail-line";
        var cap = document.createElement("span");
        cap.className = "cap";
        rail.appendChild(line);
        rail.appendChild(cap);
        lane.appendChild(meter);
        lane.appendChild(rail);
        var db = document.createElement("div");
        db.className = "db";
        var ms = document.createElement("div");
        ms.className = "ms";
        function makeBtn(kind, label) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.kind = kind;
          btn.textContent = label;
          btn.setAttribute("aria-pressed", "false");
          btn.setAttribute("aria-label", (kind === "m" ? "Mute " : "Solo ") + "In " + (index + 1));
          ms.appendChild(btn);
          return btn;
        }
        var muteBtn = makeBtn("m", "M");
        var soloBtn = makeBtn("s", "S");
        channel.appendChild(name);
        channel.appendChild(lane);
        channel.appendChild(db);
        channel.appendChild(ms);
        root.appendChild(channel);

        var ch = {
          index: index,
          value: [0.86, 0.94, 0.72, 0.36, 0.14][index],
          base: [0.86, 0.94, 0.72, 0.36, 0.14][index],
          amp: [0.07, 0.05, 0.1, 0.11, 0.07][index],
          speed: [0.65, 0.9, 0.5, 0.8, 0.55][index],
          phase: [0.2, 1.3, 2.4, 0.5, 2.8][index],
          meter: [0.86, 0.94, 0.72, 0.36, 0.14][index],
          owned: false,
          mute: false,
          solo: false,
          channel: channel,
          meterEl: meterOn,
          rail: rail,
          db: db
        };
        channels.push(ch);

        function setFromY(clientY) {
          var rect = rail.getBoundingClientRect();
          if (!rect.height) return;
          ch.value = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
          ch.owned = true;
          if (reduce) ch.meter = ch.value;
          refreshSolo();
          paint(ch);
        }
        rail.addEventListener("pointerdown", function (e) {
          rail.classList.add("is-grab");
          rail.setPointerCapture(e.pointerId);
          setFromY(e.clientY);
        });
        rail.addEventListener("pointermove", function (e) {
          if (!rail.classList.contains("is-grab")) return;
          setFromY(e.clientY);
        });
        function endGrab() { rail.classList.remove("is-grab"); }
        rail.addEventListener("pointerup", endGrab);
        rail.addEventListener("pointercancel", endGrab);
        rail.addEventListener("keydown", function (e) {
          var v = ch.value;
          var step = 1 / 66;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") v += step;
          else if (e.key === "ArrowDown" || e.key === "ArrowLeft") v -= step;
          else if (e.key === "PageUp") v += 0.1;
          else if (e.key === "PageDown") v -= 0.1;
          else if (e.key === "Home") v = 0;
          else if (e.key === "End") v = 1;
          else return;
          e.preventDefault();
          ch.value = clamp(v, 0, 1);
          ch.owned = true;
          if (reduce) ch.meter = ch.value;
          paint(ch);
        });
        muteBtn.addEventListener("click", function () {
          ch.mute = !ch.mute;
          muteBtn.setAttribute("aria-pressed", ch.mute ? "true" : "false");
          if (reduce) ch.meter = ch.mute ? 0 : ch.value;
          paint(ch);
        });
        soloBtn.addEventListener("click", function () {
          ch.solo = !ch.solo;
          soloBtn.setAttribute("aria-pressed", ch.solo ? "true" : "false");
          refreshSolo();
          channels.forEach(paint);
        });
        paint(ch);
      })(i);
    }

    return {
      tick: function (dt, seconds) {
        refreshSolo();
        channels.forEach(function (ch) {
          if (!ch.owned) {
            ch.value = clamp(ch.base + Math.sin(seconds * ch.speed + ch.phase) * ch.amp, 0.04, 0.98);
          }
          var target = ch.mute ? 0 : ch.value;
          ch.meter += (target - ch.meter) * (1 - Math.exp(-dt * 8));
          ch.meter += (Math.random() - 0.45) * 0.035 * (ch.mute ? 0 : ch.value);
          ch.meter = clamp(ch.meter, 0, 1);
          paint(ch);
        });
      }
    };
  })();

  /* ------------------------------------------------------------------- Morph */

  var morph = (function () {
    var N = 72;
    var PEOPLE = [
      { name: "Mira Adel", role: "Garden editor", likes: 86, comments: 14, color: "#8FE0D0" },
      { name: "Jonah Pell", role: "Field recordist", likes: 64, comments: 9, color: "#F3A8C4" },
      { name: "Noor Hale", role: "Harbor pilot", likes: 71, comments: 11, color: "#7EDFC8" },
      { name: "Ellis Voss", role: "Night driver", likes: 53, comments: 6, color: "#7ED0DE" },
      { name: "Ren Park", role: "Set designer", likes: 92, comments: 18, color: "#F5A8B8" },
      { name: "Ivo March", role: "Dog walker", likes: 77, comments: 8, color: "#A8E6C8" }
    ];

    function polar(radiusFn) {
      var pts = [];
      for (var i = 0; i < N; i++) {
        var a = -Math.PI / 2 + (i / N) * Math.PI * 2;
        var r = radiusFn(a);
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      return pts;
    }
    function normalize(pts) {
      var cx = 0;
      var cy = 0;
      var i;
      for (i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
      cx /= pts.length;
      cy /= pts.length;
      var max = 0.0001;
      for (i = 0; i < pts.length; i++) {
        var d = Math.hypot(pts[i][0] - cx, pts[i][1] - cy);
        if (d > max) max = d;
      }
      var s = 0.9 / max;
      return pts.map(function (p) { return [(p[0] - cx) * s, (p[1] - cy) * s]; });
    }
    function alignTop(pts) {
      var best = 0;
      var by = Infinity;
      for (var i = 0; i < pts.length; i++) {
        if (pts[i][1] < by) { by = pts[i][1]; best = i; }
      }
      return pts.slice(best).concat(pts.slice(0, best));
    }
    function heart() {
      var pts = [];
      for (var i = 0; i < N; i++) {
        var t = (i / N) * Math.PI * 2;
        var x = 16 * Math.pow(Math.sin(t), 3);
        var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push([x, y]);
      }
      return pts;
    }
    var SHAPES = [
      polar(function (a) { return 0.72 + 0.14 * Math.cos(5 * a); }),
      polar(function (a) { return 0.54 + 0.28 * Math.cos(6 * a + 0.2); }),
      heart(),
      polar(function () { return 0.78; }),
      polar(function () { return 0.8; }),
      polar(function (a) { return 0.68 + 0.12 * Math.sin(3 * a) + 0.07 * Math.cos(5 * a + 0.8); })
    ].map(function (pts) { return alignTop(normalize(pts)); });

    var fill = document.getElementById("profile-fill");
    var clip = document.getElementById("profile-clip-path");
    var arts = Array.prototype.slice.call(document.querySelectorAll(".art"));
    var nameEl = document.getElementById("profile-name");
    var roleEl = document.getElementById("profile-role");
    var likesEl = document.getElementById("profile-likes");
    var commentsEl = document.getElementById("profile-comments");
    var avatar = document.getElementById("profile-avatar");
    var top = document.querySelector(".profile-top");
    var live = document.getElementById("profile-live");
    var card = document.getElementById("profile");
    var state = {
      index: 0,
      from: SHAPES[0],
      to: SHAPES[0],
      fromColor: hexToRgb(PEOPLE[0].color),
      toColor: hexToRgb(PEOPLE[0].color),
      t: 1
    };
    var timer = 0;
    var hovering = false;
    var fadeToken = 0;

    function fmt(n) { return n.toFixed(3); }
    function toPath(pts) {
      var n = pts.length;
      var parts = [];
      for (var i = 0; i < n; i++) {
        var p0 = pts[(i - 1 + n) % n];
        var p1 = pts[i];
        var p2 = pts[(i + 1) % n];
        var p3 = pts[(i + 2) % n];
        if (i === 0) parts.push("M " + fmt(p1[0]) + " " + fmt(p1[1]));
        var c1x = p1[0] + (p2[0] - p0[0]) / 6;
        var c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6;
        var c2y = p2[1] - (p3[1] - p1[1]) / 6;
        parts.push("C " + fmt(c1x) + " " + fmt(c1y) + " " + fmt(c2x) + " " + fmt(c2y) + " " + fmt(p2[0]) + " " + fmt(p2[1]));
      }
      return parts.join(" ") + " Z";
    }
    function lerpPts(a, b, t) {
      var out = new Array(a.length);
      for (var i = 0; i < a.length; i++) {
        out[i] = [mix(a[i][0], b[i][0], t), mix(a[i][1], b[i][1], t)];
      }
      return out;
    }
    function paint() {
      var e = smoothstep(0, 1, state.t);
      var pts = state.t >= 1 ? state.to : lerpPts(state.from, state.to, e);
      var d = toPath(pts);
      fill.setAttribute("d", d);
      clip.setAttribute("d", d);
      fill.setAttribute("fill", rgbToHex(mix3(state.fromColor, state.toColor, e)));
    }
    function applyPerson(i, announce) {
      var token = ++fadeToken;
      var person = PEOPLE[i];
      function write() {
        if (token !== fadeToken) return;
        nameEl.textContent = person.name;
        roleEl.textContent = person.role;
        likesEl.textContent = String(person.likes);
        commentsEl.textContent = String(person.comments);
        avatar.style.setProperty("--blob", person.color);
        arts.forEach(function (el, n) { el.classList.toggle("is-on", n === i); });
        top.classList.remove("is-dim");
        if (announce) live.textContent = person.name + ", " + person.role;
      }
      if (reduce) { write(); return; }
      top.classList.add("is-dim");
      window.setTimeout(write, 150);
    }
    function queue() {
      window.clearTimeout(timer);
      if (reduce || hovering) return;
      timer = window.setTimeout(function () { go(state.index + 1); }, 3800);
    }
    function go(next, announce) {
      next = (next % PEOPLE.length + PEOPLE.length) % PEOPLE.length;
      var e = smoothstep(0, 1, state.t);
      state.from = state.t >= 1 ? state.to : lerpPts(state.from, state.to, e);
      state.fromColor = mix3(state.fromColor, state.toColor, e);
      state.to = SHAPES[next];
      state.toColor = hexToRgb(PEOPLE[next].color);
      state.index = next;
      state.t = reduce ? 1 : 0;
      applyPerson(next, announce);
      paint();
      queue();
    }

    document.getElementById("profile-next").addEventListener("click", function () { go(state.index + 1, true); });
    document.getElementById("profile-next-shape").addEventListener("click", function () { go(state.index + 1, true); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(state.index + 1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(state.index - 1, true); }
    });
    card.addEventListener("pointerenter", function () { hovering = true; window.clearTimeout(timer); });
    card.addEventListener("pointerleave", function () { hovering = false; queue(); });
    card.addEventListener("focusin", function () { hovering = true; window.clearTimeout(timer); });
    card.addEventListener("focusout", function (e) {
      if (card.contains(e.relatedTarget)) return;
      hovering = false;
      queue();
    });

    avatar.style.setProperty("--blob", PEOPLE[0].color);
    paint();
    queue();

    return {
      tick: function (dt) {
        if (state.t >= 1) return;
        state.t = Math.min(1, state.t + dt / 0.7);
        paint();
      }
    };
  })();

  /* --------------------------------------------------------------- Guestbook */

  (function () {
    var GUESTS = [
      {
        name: "Nell Adler",
        stay: "Four nights in April",
        quote: "The fire was already going. We put the bags down and left them there until Sunday.",
        paper: "#1B2748",
        ink: "#F7F4EE",
        hair: "#2A211C",
        skin: "#E7C2A4",
        shirt: "#31457A"
      },
      {
        name: "June Okonkwo",
        stay: "A long weekend",
        quote: "Rain on the roof, soup on the stove, and one book that lasted the whole afternoon.",
        paper: "#D7E36A",
        ink: "#1C1C22",
        hair: "#1C1C22",
        skin: "#8D5A3C",
        shirt: "#C9D45A"
      },
      {
        name: "Mateo Ruiz",
        stay: "Two nights in May",
        quote: "The path down to the water is short. The path back up taught us to stay a little longer.",
        paper: "#F0C6A2",
        ink: "#1C1C22",
        hair: "#3A2418",
        skin: "#E0B088",
        shirt: "#E2B48E"
      },
      {
        name: "Sable Quinn",
        stay: "One quiet week",
        quote: "No schedule at all. Bread in the morning. The lake turned silver just after four.",
        paper: "#164838",
        ink: "#F7F4EE",
        hair: "#241816",
        skin: "#C98862",
        shirt: "#1E5C48"
      },
      {
        name: "Priya Raman",
        stay: "Three nights in June",
        quote: "I came to sleep. I left with a list of birds and no names for any of them.",
        paper: "#F3E4D0",
        ink: "#1C1C22",
        hair: "#1C1C22",
        skin: "#C48A62",
        shirt: "#E7D3BC"
      },
      {
        name: "Leif Holm",
        stay: "A Friday to Monday",
        quote: "Left the city noise in the car. It was still there when we opened the door to leave.",
        paper: "#7E2E2E",
        ink: "#F7F4EE",
        hair: "#D9D4CC",
        skin: "#E8C4A8",
        shirt: "#8E3A3A"
      }
    ];

    function face(g) {
      return '<svg viewBox="0 0 32 32" aria-hidden="true">' +
        '<circle cx="16" cy="16" r="16" fill="' + g.shirt + '"/>' +
        '<circle cx="16" cy="15" r="7" fill="' + g.skin + '"/>' +
        '<path d="M9 14 Q16 6 23 14 Q19 11 16 11 Q13 11 9 14Z" fill="' + g.hair + '"/>' +
        '<circle cx="13.6" cy="15.2" r="0.8" fill="#1C1C22"/>' +
        '<circle cx="18.4" cy="15.2" r="0.8" fill="#1C1C22"/>' +
        "</svg>";
    }

    var row = document.getElementById("book-row");
    var live = document.getElementById("book-live");
    var buttons = [];
    var current = -1;
    var leaveTimer = 0;

    GUESTS.forEach(function (g, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guest";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.tabIndex = -1;
      btn.style.setProperty("--paper", g.paper);
      btn.style.setProperty("--ink", g.ink);
      var num = (i + 1 < 10 ? "0" : "") + (i + 1);
      btn.innerHTML =
        '<span class="spine-name"></span>' +
        '<span class="spine-face"></span>' +
        '<span class="card-body">' +
          '<span class="card-top"><span class="qmark" aria-hidden="true">“</span><span class="idx"></span></span>' +
          '<p class="quote"></p>' +
          '<span class="who"><span class="who-face"></span><span><b></b><small></small></span>' +
          '<span class="stars" aria-hidden="true">★★★★★</span></span>' +
        "</span>";
      btn.querySelector(".spine-name").textContent = g.name;
      btn.querySelector(".spine-face").innerHTML = face(g);
      btn.querySelector(".idx").textContent = num + " / 06";
      btn.querySelector(".quote").textContent = g.quote;
      btn.querySelector(".who-face").innerHTML = face(g);
      btn.querySelector("b").textContent = g.name;
      btn.querySelector("small").textContent = g.stay;
      btn.addEventListener("click", function () { select(i); });
      row.appendChild(btn);
      buttons.push(btn);
    });

    function select(i) {
      if (i === current) return;
      var prev = current;
      current = i;
      buttons.forEach(function (btn, n) {
        var on = n === i;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
        if (n !== i && n !== prev) btn.classList.remove("is-open", "is-leaving");
      });
      buttons[i].classList.add("is-open");
      buttons[i].classList.remove("is-leaving");
      if (prev >= 0) {
        if (reduce) buttons[prev].classList.remove("is-open", "is-leaving");
        else {
          buttons[prev].classList.remove("is-open");
          buttons[prev].classList.add("is-leaving");
          window.clearTimeout(leaveTimer);
          var leaving = prev;
          leaveTimer = window.setTimeout(function () {
            buttons[leaving].classList.remove("is-leaving");
          }, 280);
        }
      }
      if (prev >= 0) live.textContent = GUESTS[i].name + ". " + GUESTS[i].quote;
    }

    row.addEventListener("keydown", function (e) {
      var next = current;
      if (e.key === "ArrowRight") next = (current + 1) % GUESTS.length;
      else if (e.key === "ArrowLeft") next = (current - 1 + GUESTS.length) % GUESTS.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = GUESTS.length - 1;
      else return;
      e.preventDefault();
      select(next);
      buttons[next].focus();
    });

    select(0);
  })();

  /* -------------------------------------------------------------------- Loop */

  if (window.ResizeObserver) {
    var observer = new ResizeObserver(function () {
      capsule.resize();
      shader.resize();
      if (reduce) {
        capsule.draw();
        shader.draw();
      }
    });
    var view = document.getElementById("capsule-view");
    var shaderCell = document.querySelector(".cell-shader");
    if (view) observer.observe(view);
    if (shaderCell) observer.observe(shaderCell);
  }

  if (!reduce) {
    var last = 0;
    var looping = true;
    function frame(now) {
      if (!looping) return;
      var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      capsule.tick(dt, now);
      receipt.tick(dt);
      shader.tick(dt);
      mixer.tick(dt, now / 1000);
      morph.tick(dt);
      window.requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        looping = false;
      } else if (!looping) {
        looping = true;
        last = 0;
        window.requestAnimationFrame(frame);
      }
    });
    window.requestAnimationFrame(frame);
  }
})();

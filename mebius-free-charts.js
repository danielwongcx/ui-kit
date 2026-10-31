/* Shared SVG charts for the 62 Mebius free-chart cards. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var MASK = "••••••";
  var errors = [];
  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function svg(name, attrs) {
    var node = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      });
    }
    return node;
  }

  function fmt(n, kind) {
    var v = Number(n);
    if (!Number.isFinite(v)) return "—";
    var opt = { maximumFractionDigits: 2 };
    if (kind === "usd" || kind === "usd2") opt = { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 };
    else if (kind === "usd0") opt = { style: "currency", currency: "USD", maximumFractionDigits: 0 };
    else if (kind === "usds") opt = { style: "currency", currency: "USD", signDisplay: "exceptZero", minimumFractionDigits: 2, maximumFractionDigits: 2 };
    else if (kind === "compact") opt = { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 };
    else if (kind === "pct") opt = { style: "percent", maximumFractionDigits: 1 };
    else if (kind === "pct0") opt = { style: "percent", maximumFractionDigits: 0 };
    else if (kind === "pcts") opt = { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 1 };
    else if (kind === "num") opt = { maximumFractionDigits: 0 };
    else if (kind === "num1") opt = { maximumFractionDigits: 1 };
    else if (kind === "num2") opt = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    else if (kind === "days") {
      var d = Math.round(v);
      if (d === 0) return "on time";
      var abs = Math.abs(d);
      return abs + (abs === 1 ? " day " : " days ") + (d > 0 ? "early" : "late");
    }
    var base = kind === "pct" || kind === "pct0" || kind === "pcts" ? v / 100 : v;
    return new Intl.NumberFormat("en-US", opt).format(base);
  }

  function deltaHTML(delta, hidden) {
    if (!delta || (delta.amt == null && delta.pct == null && !delta.text)) return "";
    var sign = delta.amt != null ? delta.amt : delta.pct || 0;
    var parts = [];
    if (delta.amt != null) parts.push(fmt(delta.amt, "usds"));
    if (delta.pct != null) parts.push(fmt(delta.pct, "pcts"));
    var note = delta.text ? '<span class="delta-note">' + esc(delta.text) + "</span>" : "";
    return '<p class="delta ' + (sign < 0 ? "down" : "up") + '"><span>' + (hidden ? MASK : esc(parts.join("  "))) + "</span>" + note + "</p>";
  }

  function showNum(n, kind, hidden) {
    return hidden ? MASK : fmt(n, kind || "usd");
  }

  function nice(min, max, count) {
    if (!(max > min)) max = min + 1;
    var span = max - min;
    var step0 = span / (count || 4);
    var mag = Math.pow(10, Math.floor(Math.log10(step0)));
    var err = step0 / mag;
    var step = err >= 7.5 ? 10 * mag : err >= 3.5 ? 5 * mag : err >= 1.5 ? 2 * mag : mag;
    var start = Math.floor(min / step) * step;
    var end = Math.ceil(max / step) * step;
    var ticks = [];
    for (var v = start; v <= end + step * 0.01; v += step) ticks.push(Math.round(v * 1000) / 1000);
    return { min: start, max: end, ticks: ticks };
  }

  function extent(values) {
    var min = Infinity;
    var max = -Infinity;
    values.forEach(function (v) {
      if (v < min) min = v;
      if (v > max) max = v;
    });
    if (!Number.isFinite(min)) return { min: 0, max: 1 };
    return { min: min, max: max };
  }

  function seriesOn(plot, off) {
    return (plot.s || []).filter(function (s) { return !off[s.n]; });
  }

  function lenOf(plot) {
    if (!plot) return 0;
    if (plot.items && plot.t === "candle") return plot.items.length;
    if (plot.items && plot.t === "float") return plot.items.length;
    if (plot.items && plot.t === "time") return plot.items.length;
    if (plot.cols) return plot.cols.length;
    if (plot.d) return plot.d.length;
    if (plot.values) return plot.values.length;
    if (plot.s && plot.s[0] && plot.s[0].d) return plot.s[0].d.length;
    if (plot.up) return plot.up.d.length;
    if (plot.slices) return plot.slices.length;
    if (plot.parts) return plot.parts.length;
    return 0;
  }

  function tipLines(plot, i, off) {
    var lines = [];
    var label = (plot.titles && plot.titles[i]) || (plot.labels && plot.labels[i]) || "";
    if (label) lines.push(label);
    var kind = plot.tip || "usd";
    if (plot.t === "candle") {
      var c = plot.items[i];
      return [c.l, "Open " + fmt(c.o, "usd2"), "High " + fmt(c.h, "usd2"), "Low " + fmt(c.lo, "usd2"), "Close " + fmt(c.c, "usd2"), "Volume " + fmt(c.v, "num")];
    }
    if (plot.t === "float") {
      var item = plot.items[i];
      return [label || "Slot", "Spent " + fmt(item.spent, "usd0"), "In " + fmt(item.top, "usd0"), "Left " + fmt(item.bot, "usd0")];
    }
    if (plot.t === "matrix") {
      var col = plot.cols[i];
      return [label || "Period", "In " + fmt(col.inn, kind), "Out " + fmt(col.out, kind), "Net " + fmt(col.inn - col.out, kind)];
    }
    if (plot.t === "cells") return [label, fmt(plot.values[i], kind)];
    if (plot.t === "cols" || plot.t === "band" || (plot.d && !plot.s)) {
      lines.push(fmt(plot.d[i], kind));
      if (plot.target) lines.push("Target " + fmt(plot.target[i], kind));
      return lines;
    }
    if (plot.t === "div") {
      lines.push(plot.up.n + " " + fmt(plot.up.d[i], kind));
      lines.push(plot.down.n + " " + fmt(plot.down.d[i], kind));
      return lines;
    }
    if (plot.s) {
      seriesOn(plot, off).forEach(function (s) {
        if (s.d && s.d[i] != null) lines.push(s.n + "  " + fmt(s.d[i], kind));
      });
    }
    var meta = plot.meta && plot.meta[i];
    if (meta && meta.extra) lines.push(meta.extra);
    return lines;
  }

  function placeTip(host, xPct, lines) {
    var tip = host.querySelector(".tip");
    if (!tip) return;
    tip.innerHTML = lines.map(function (line) { return "<div>" + esc(line) + "</div>"; }).join("");
    tip.hidden = !lines.length;
    tip.style.left = Math.max(12, Math.min(88, xPct)) + "%";
  }

  function addPatterns(root, id) {
    var defs = svg("defs");
    var stripe = svg("pattern", { id: id + "-stripe", width: "6", height: "6", patternUnits: "userSpaceOnUse" });
    stripe.appendChild(svg("rect", { width: "6", height: "6", fill: "#e4e4e4" }));
    stripe.appendChild(svg("path", { d: "M0 6 L6 0", stroke: "#ffffff", "stroke-width": "2" }));
    var hatch = svg("pattern", { id: id + "-hatch", width: "8", height: "8", patternUnits: "userSpaceOnUse" });
    hatch.appendChild(svg("rect", { width: "8", height: "8", fill: "#e7f7ed" }));
    hatch.appendChild(svg("path", { d: "M-1 3 H9 M-1 7 H9", stroke: "#12aa4c", "stroke-width": "1.4" }));
    var soft = svg("pattern", { id: id + "-soft", width: "6", height: "6", patternUnits: "userSpaceOnUse" });
    soft.appendChild(svg("rect", { width: "6", height: "6", fill: "#f3f3f3" }));
    soft.appendChild(svg("path", { d: "M0 6 L6 0", stroke: "#e5e5e5", "stroke-width": "2" }));
    defs.appendChild(stripe);
    defs.appendChild(hatch);
    defs.appendChild(soft);
    root.appendChild(defs);
    return { stripe: "url(#" + id + "-stripe)", hatch: "url(#" + id + "-hatch)", soft: "url(#" + id + "-soft)" };
  }

  function axisText(root, x, y, text, anchor, fill) {
    var node = svg("text", { x: x, y: y, fill: fill || "#5c5c5c", "font-size": "11", "font-family": "Nunito, ui-rounded, sans-serif", "font-weight": "700", "text-anchor": anchor || "middle" });
    node.textContent = text;
    root.appendChild(node);
  }

  function yScale(min, max, top, bottom) {
    var span = max - min || 1;
    return function (v) { return bottom - ((v - min) / span) * (bottom - top); };
  }

  function domain(values, padZero) {
    var box = extent(values);
    if (padZero) {
      box.min = Math.min(0, box.min);
      box.max = Math.max(0, box.max);
    }
    var span = box.max - box.min || Math.abs(box.max) || 1;
    if (!padZero) {
      box.min -= span * 0.08;
      box.max += span * 0.08;
    } else if (box.min < 0) {
      box.min -= span * 0.06;
    }
    return nice(box.min, box.max, 4);
  }

  function grid(root, ticks, y, left, right) {
    var show = ticks;
    if (ticks.length > 5) {
      show = [];
      var step = Math.ceil(ticks.length / 5);
      ticks.forEach(function (tick, i) { if (i % step === 0) show.push(tick); });
    }
    show.forEach(function (tick) {
      var yy = y(tick);
      root.appendChild(svg("line", { x1: left, x2: right, y1: yy, y2: yy, stroke: "#ebebeb", "stroke-dasharray": "3 4" }));
    });
    return show;
  }

  function smooth(pts) {
    if (pts.length < 2) return "";
    if (pts.length === 2) return "M " + pts[0][0] + " " + pts[0][1] + " L " + pts[1][0] + " " + pts[1][1];
    var d = "M " + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[Math.min(pts.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + p2[0] + " " + p2[1];
    }
    return d;
  }

  function markActive(host, index, accent) {
    host.querySelectorAll("[data-i]").forEach(function (node) {
      var on = Number(node.getAttribute("data-i")) === index;
      node.classList.toggle("is-on", on);
      if (node.dataset.base) node.setAttribute("fill", on && accent ? accent : node.dataset.base);
    });
    var cursor = host.querySelector("[data-cursor]");
    var point = host.querySelector('[data-i="' + index + '"][data-x]');
    if (cursor && point) {
      var x = point.getAttribute("data-x");
      cursor.setAttribute("x1", x);
      cursor.setAttribute("x2", x);
      cursor.setAttribute("opacity", "1");
    }
  }

  function drawBarsLike(root, plot, box, mode, off, patterns) {
    var shown = seriesOn(plot, off);
    var n = (shown[0] && shown[0].d.length) || (plot.labels || []).length;
    var values = [];
    if (mode === "stack") {
      for (var i = 0; i < n; i++) {
        var total = 0;
        shown.forEach(function (s) { total += s.d[i] || 0; });
        values.push(total);
      }
    } else {
      shown.forEach(function (s) { values = values.concat(s.d); });
    }
    var dom = domain(values, true);
    var y = yScale(dom.min, dom.max, box.t, box.b);
    grid(root, dom.ticks, y, box.l, box.r).forEach(function (tick) { axisText(root, box.l - 6, y(tick) + 4, fmt(tick, Math.abs(dom.max) >= 1000 ? "compact" : (plot.tip || "num")), "end"); });
    var zero = y(0);
    root.appendChild(svg("line", { x1: box.l, x2: box.r, y1: zero, y2: zero, stroke: "#d1d1d1" }));
    var gap = n > 20 ? 2 : n > 10 ? 4 : 8;
    var inner = box.r - box.l;
    var groupW = n ? (inner - gap * (n - 1)) / n : inner;
    var step = Math.ceil(n / 6);
    for (var k = 0; k < n; k++) {
      var x = box.l + k * (groupW + gap);
      if (plot.labels && plot.labels[k] && (n <= 8 || k % step === 0 || k === n - 1)) axisText(root, x + groupW / 2, box.h - 8, plot.labels[k]);
      if (mode === "bars") {
        var s0 = shown[0];
        var val = s0 ? s0.d[k] : 0;
        var y0 = y(Math.max(val, 0));
        var y1 = y(Math.min(val, 0));
        var fill = (plot.colors && plot.colors[k]) || (plot.stripe ? patterns.stripe : plot.hatch ? patterns.hatch : (s0 && s0.c) || "#097df6");
        var rect = svg("rect", { x: x, y: Math.min(y0, y1), width: Math.max(groupW, 1), height: Math.max(2, Math.abs(y1 - y0)), rx: plot.capsule ? groupW / 2 : 5, fill: fill, "data-i": k, "data-base": fill, "data-x": x + groupW / 2 });
        if (!reduce) rect.setAttribute("class", "grow");
        root.appendChild(rect);
      } else if (mode === "stack") {
        var acc = 0;
        shown.forEach(function (s) {
          var part = s.d[k] || 0;
          var top = y(acc + part);
          var bot = y(acc);
          var h = Math.max(0, bot - top);
          if (h > 0) {
            var bit = svg("rect", { x: x, y: top, width: Math.max(groupW, 1), height: h, fill: s.c, "data-i": k, "data-base": s.c });
            root.appendChild(bit);
          }
          acc += part;
        });
      } else {
        var bw = shown.length ? groupW / shown.length : groupW;
        shown.forEach(function (s, si) {
          var v = s.d[k] || 0;
          var topY = y(Math.max(v, 0));
          var botY = y(Math.min(v, 0));
          root.appendChild(svg("rect", { x: x + si * bw + 1, y: Math.min(topY, botY), width: Math.max(bw - 2, 1), height: Math.max(2, Math.abs(botY - topY)), rx: 3, fill: s.c, "data-i": k, "data-base": s.c }));
        });
      }
    }
    return n;
  }

  function drawLine(root, plot, box, off, filled) {
    var shown = seriesOn(plot, off);
    var n = shown[0] ? shown[0].d.length : 0;
    if (!n) return 0;
    var values = [];
    shown.forEach(function (s) { values = values.concat(s.d); });
    var dom = domain(values, false);
    var y = yScale(dom.min, dom.max, box.t, box.b);
    var x = function (i) { return n < 2 ? (box.l + box.r) / 2 : box.l + (i / (n - 1)) * (box.r - box.l); };
    grid(root, dom.ticks, y, box.l, box.r).forEach(function (tick) { axisText(root, box.l - 6, y(tick) + 4, fmt(tick, Math.abs(dom.max) >= 10000 ? "compact" : (plot.tip === "pct" ? "pct0" : Math.abs(dom.max) >= 1000 ? "compact" : "num")), "end"); });
    var base = y(Math.min(dom.max, Math.max(dom.min, 0)));
    shown.forEach(function (s) {
      var pts = s.d.map(function (v, i) { return [x(i), y(v)]; });
      var path = plot.smooth === false ? "M " + pts.map(function (p) { return p.join(" "); }).join(" L ") : smooth(pts);
      if (filled) {
        var area = svg("path", { d: path + " L " + pts[pts.length - 1][0] + " " + base + " L " + pts[0][0] + " " + base + " Z", fill: s.c, opacity: "0.18" });
        root.appendChild(area);
      }
      root.appendChild(svg("path", { d: path, fill: "none", stroke: s.c, "stroke-width": "2.4", "stroke-linejoin": "round", "stroke-linecap": "round" }));
    });
    for (var i = 0; i < n; i++) {
      root.appendChild(svg("circle", { cx: x(i), cy: y(shown[0].d[i]), r: n > 40 ? 6 : 10, fill: "transparent", "data-i": i, "data-x": x(i) }));
    }
    var cursor = svg("line", { "data-cursor": "1", y1: box.t, y2: box.b, stroke: "#171717", "stroke-dasharray": "3 3", opacity: "0" });
    root.appendChild(cursor);
    var step = Math.ceil(n / 6);
    (plot.labels || []).forEach(function (label, i) {
      if (!label) return;
      if (n > 8 && i % step !== 0 && i !== n - 1) return;
      axisText(root, x(i), box.h - 8, label);
    });
    if (plot.column) {
      var hi = plot.hi || 0;
      root.appendChild(svg("rect", { x: x(hi) - 10, y: box.t, width: 20, height: box.b - box.t, fill: "#a22dff", opacity: "0.12" }));
    }
    return n;
  }

  function drawDiv(root, plot, box) {
    var n = plot.up.d.length;
    var max = Math.max(1, extent(plot.up.d.concat(plot.down.d)).max);
    var mid = (box.t + box.b) / 2;
    var half = (box.b - box.t) / 2 - 4;
    var yUp = function (v) { return mid - (v / max) * half; };
    var yDn = function (v) { return mid + (v / max) * half; };
    root.appendChild(svg("line", { x1: box.l, x2: box.r, y1: mid, y2: mid, stroke: "#d1d1d1" }));
    var gap = n > 16 ? 2 : 6;
    var bw = (box.r - box.l - gap * (n - 1)) / n;
    var step = Math.ceil(n / 6);
    for (var i = 0; i < n; i++) {
      var x = box.l + i * (bw + gap);
      root.appendChild(svg("rect", { x: x, y: yUp(plot.up.d[i]), width: bw, height: Math.max(1, mid - yUp(plot.up.d[i])), rx: 3, fill: plot.up.c, "data-i": i, "data-base": plot.up.c, "data-x": x + bw / 2 }));
      root.appendChild(svg("rect", { x: x, y: mid, width: bw, height: Math.max(1, yDn(plot.down.d[i]) - mid), rx: 3, fill: plot.down.c, "data-i": i, "data-base": plot.down.c }));
      if (plot.labels[i] && (n <= 8 || i % step === 0)) axisText(root, x + bw / 2, box.h - 6, plot.labels[i]);
    }
    return n;
  }

  function drawCols(root, plot, box) {
    var n = plot.d.length;
    var values = plot.d.concat(plot.target || []);
    if (plot.goal) values.push(plot.goal);
    var dom = domain(values, true);
    var y = yScale(dom.min, dom.max, box.t, box.b);
    grid(root, dom.ticks, y, box.l, box.r);
    var zero = y(0);
    var gap = n > 16 ? 4 : 10;
    var bw = (box.r - box.l - gap * (n - 1)) / n;
    var depth = Math.min(10, bw * 0.35);
    if (plot.goal) {
      var gy = y(plot.goal);
      root.appendChild(svg("line", { x1: box.l, x2: box.r, y1: gy, y2: gy, stroke: "#a3a3a3", "stroke-dasharray": "4 4" }));
    }
    for (var i = 0; i < n; i++) {
      var x = box.l + i * (bw + gap);
      var top = y(plot.d[i]);
      var h = Math.max(2, zero - top);
      if (plot.target) {
        var ty = y(plot.target[i]);
        root.appendChild(svg("rect", { x: x, y: Math.min(ty, zero), width: bw - depth, height: Math.max(2, Math.abs(zero - ty)), fill: "none", stroke: "#d1d1d1", "stroke-dasharray": "3 3" }));
      }
      var face = plot.c;
      root.appendChild(svg("polygon", { points: [x + bw - depth, top - depth, x + bw, top, x + bw, zero, x + bw - depth, zero - depth].join(" "), fill: "#171717", opacity: "0.08" }));
      var rect = svg("rect", { x: x, y: top, width: bw - depth, height: h, rx: 3, fill: face, "data-i": i, "data-base": face, "data-x": x + bw / 2 });
      if (!reduce) rect.setAttribute("class", "grow");
      root.appendChild(rect);
      if (plot.labels && plot.labels[i]) axisText(root, x + bw / 2, box.h - 8, plot.labels[i]);
    }
    return n;
  }

  function drawCandle(root, plot, box) {
    var items = plot.items;
    var n = items.length;
    var highs = items.map(function (c) { return c.h; });
    var lows = items.map(function (c) { return c.lo; });
    var dom = domain(highs.concat(lows), false);
    var priceBottom = box.t + (box.b - box.t) * 0.74;
    var y = yScale(dom.min, dom.max, box.t, priceBottom);
    grid(root, dom.ticks, y, box.l, box.r).forEach(function (tick) { axisText(root, box.l - 6, y(tick) + 4, fmt(tick, "compact"), "end"); });
    var vols = items.map(function (c) { return c.v; });
    var vmax = extent(vols).max || 1;
    var gap = n > 40 ? 1 : 3;
    var bw = Math.max(2, (box.r - box.l - gap * (n - 1)) / n);
    var step = Math.ceil(n / 6);
    items.forEach(function (c, i) {
      var x = box.l + i * (bw + gap);
      var up = c.c >= c.o;
      var color = up ? "#12aa4c" : "#f93b29";
      var yH = y(c.h);
      var yL = y(c.lo);
      var yO = y(c.o);
      var yC = y(c.c);
      root.appendChild(svg("line", { x1: x + bw / 2, x2: x + bw / 2, y1: yH, y2: yL, stroke: color, "stroke-width": "1.4" }));
      root.appendChild(svg("rect", { x: x, y: Math.min(yO, yC), width: bw, height: Math.max(1.5, Math.abs(yC - yO)), fill: color, "data-i": i, "data-base": color, "data-x": x + bw / 2 }));
      var vh = ((c.v || 0) / vmax) * (box.b - priceBottom - 16);
      root.appendChild(svg("rect", { x: x, y: box.b - 8 - vh, width: bw, height: Math.max(1, vh), fill: color, opacity: "0.45" }));
      if (n <= 8 || i % step === 0) axisText(root, x + bw / 2, box.h - 4, c.l);
    });
    return n;
  }

  function arcPath(cx, cy, r0, r1, a0, a1) {
    var large = a1 - a0 > Math.PI ? 1 : 0;
    function p(r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    var p0 = p(r1, a0);
    var p1 = p(r1, a1);
    var p2 = p(r0, a1);
    var p3 = p(r0, a0);
    return "M " + p0.join(" ") + " A " + r1 + " " + r1 + " 0 " + large + " 1 " + p1.join(" ") + " L " + p2.join(" ") + " A " + r0 + " " + r0 + " 0 " + large + " 0 " + p3.join(" ") + " Z";
  }

  function drawDonut(root, plot, box) {
    var slices = plot.slices.filter(function (s) { return s.v > 0; });
    var total = slices.reduce(function (a, s) { return a + s.v; }, 0) || 1;
    var cx = 220;
    var cy = box.h / 2;
    var a = -Math.PI / 2;
    slices.forEach(function (s, i) {
      var sweep = (s.v / total) * Math.PI * 2;
      var r1 = plot.spiral ? 108 - i * 6 : 108;
      var path = svg("path", { d: arcPath(cx, cy, 64, r1, a + 0.015, a + sweep - 0.015), fill: s.hatch ? "#f3f3f3" : s.c, stroke: s.hatch ? "#d1d1d1" : "#fff", "stroke-width": "2", "data-i": i, "data-base": s.hatch ? "#f3f3f3" : s.c });
      if (s.hatch) path.setAttribute("stroke-dasharray", "3 3");
      root.appendChild(path);
      a += sweep;
    });
    axisText(root, cx, cy - 6, plot.center || "", "middle");
    var value = svg("text", { x: cx, y: cy + 18, "text-anchor": "middle", fill: "#171717", "font-size": "22", "font-weight": "700", "font-family": "Nunito, sans-serif" });
    value.textContent = fmt(plot.centerValue, plot.centerFmt || "usd");
    value.setAttribute("data-center", "1");
    root.appendChild(value);
    slices.forEach(function (s, i) {
      var y = 36 + i * 28;
      root.appendChild(svg("circle", { cx: 390, cy: y, r: 6, fill: s.c }));
      axisText(root, 406, y + 4, s.n + "  " + fmt(s.v, plot.centerFmt || "usd0"), "start");
    });
    return slices.length;
  }

  function drawGauge(root, plot, box) {
    var cx = 320;
    var cy = box.h - 36;
    var r = 120;
    var segs = plot.segments || 1;
    var ratio = plot.max ? Math.max(0, Math.min(1, plot.value / plot.max)) : 0;
    if (segs > 1) {
      for (var i = 0; i < segs; i++) {
        var a0 = Math.PI + (i / segs) * Math.PI + 0.02;
        var a1 = Math.PI + ((i + 1) / segs) * Math.PI - 0.02;
        var lit = i / segs < ratio - 1e-6;
        var shade = lit ? (i / segs > 0.66 ? "#0a5e2a" : i / segs > 0.33 ? "#12aa4c" : "#92d8ad") : "#ececec";
        root.appendChild(svg("path", { d: arcPath(cx, cy, r - 22, r, a0, a1), fill: shade }));
      }
    } else {
      root.appendChild(svg("path", { d: arcPath(cx, cy, r - 18, r, Math.PI, Math.PI * 2), fill: "#ececec" }));
      if (ratio > 0) root.appendChild(svg("path", { d: arcPath(cx, cy, r - 18, r, Math.PI, Math.PI + Math.PI * ratio), fill: plot.c || "#097df6" }));
    }
    var ang = Math.PI + Math.PI * ratio;
    root.appendChild(svg("circle", { cx: cx + r * Math.cos(ang), cy: cy + r * Math.sin(ang), r: 7, fill: "#fff", stroke: plot.c || "#12aa4c", "stroke-width": "3" }));
    var label = svg("text", { x: cx, y: cy - 28, "text-anchor": "middle", fill: "#171717", "font-size": "28", "font-weight": "700", "font-family": "Nunito, sans-serif" });
    label.textContent = plot.label || fmt(plot.value, "usd0");
    root.appendChild(label);
    axisText(root, cx, cy - 8, fmt(plot.value, "compact") + " / " + fmt(plot.max, "compact"));
    return 1;
  }

  function drawRadial(root, plot, box) {
    var n = plot.d.length;
    var max = extent(plot.d).max || 1;
    var cx = 250;
    var cy = box.h / 2 + 4;
    var hi = {};
    (plot.hi || []).forEach(function (i) { hi[i] = true; });
    plot.d.forEach(function (v, i) {
      var a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      var inner = 58;
      var outer = inner + (v / max) * 70;
      var color = hi[i] ? "#097df6" : "#b3d7fc";
      root.appendChild(svg("line", {
        x1: cx + inner * Math.cos(a),
        y1: cy + inner * Math.sin(a),
        x2: cx + outer * Math.cos(a),
        y2: cy + outer * Math.sin(a),
        stroke: color,
        "stroke-width": hi[i] ? 8 : 5,
        "stroke-linecap": "round",
        "data-i": i,
        "data-base": color
      }));
    });
    var value = svg("text", { x: cx, y: cy + 6, "text-anchor": "middle", fill: "#171717", "font-size": "18", "font-weight": "700", "font-family": "Nunito, sans-serif" });
    value.textContent = fmt(plot.center, plot.centerFmt || "usd0");
    root.appendChild(value);
    axisText(root, cx, cy + 24, plot.centerLabel || "");
    return n;
  }

  function drawShare(root, plot, box) {
    var parts = plot.parts;
    var total = parts.reduce(function (a, p) { return a + p.v; }, 0) || 1;
    var x = 24;
    var y = 48;
    var w = 592;
    var h = 28;
    parts.forEach(function (p, i) {
      var pw = (p.v / total) * w;
      root.appendChild(svg("rect", { x: x, y: y, width: Math.max(pw, 0), height: h, fill: p.c, "data-i": i, "data-base": p.c }));
      x += pw;
    });
    parts.forEach(function (p, i) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      root.appendChild(svg("circle", { cx: 32 + col * 300, cy: 110 + row * 28, r: 6, fill: p.c }));
      axisText(root, 46 + col * 300, 114 + row * 28, p.n + "  " + fmt(p.v, "compact") + " · " + fmt((p.v / total) * 100, "pct0"), "start");
    });
    return parts.length;
  }

  function drawSplit(root, plot, box) {
    var total = plot.a.v + plot.b.v || 1;
    var w = 560;
    var a = (plot.a.v / total) * w;
    root.appendChild(svg("rect", { x: 40, y: 70, width: w, height: 22, rx: 11, fill: plot.b.c }));
    root.appendChild(svg("rect", { x: 40, y: 70, width: Math.max(8, a), height: 22, rx: 11, fill: plot.a.c }));
    axisText(root, 40, 56, plot.a.n + " " + fmt(plot.a.v, "usd0"), "start");
    axisText(root, 600, 56, plot.b.n + " " + fmt(plot.b.v, "usd0"), "end");
    [0, 25, 50, 75, 100].forEach(function (t) { axisText(root, 40 + (t / 100) * w, 114, t + "%"); });
    return 1;
  }

  function drawWaffle(root, plot) {
    var cells = [];
    plot.parts.forEach(function (part) {
      for (var i = 0; i < part.count; i++) cells.push(part.c);
    });
    var cols = 14;
    var r = 8;
    cells.forEach(function (color, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = 28 + col * 18 + (row % 2 ? 9 : 0);
      var cy = 20 + row * 16;
      var pts = [];
      for (var k = 0; k < 6; k++) {
        var a = Math.PI / 6 + (k * Math.PI) / 3;
        pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2));
      }
      root.appendChild(svg("polygon", { points: pts.join(" "), fill: color }));
    });
    return cells.length;
  }

  function drawScatter(root, plot, box, off) {
    var ys = [];
    var xs = [];
    seriesOn(plot, off).forEach(function (s) {
      s.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); });
    });
    var xdom = nice(Math.min.apply(null, xs.concat([0])), Math.max.apply(null, xs.concat([1])), 4);
    var ydom = domain(ys, true);
    var x = function (v) { return box.l + ((v - xdom.min) / (xdom.max - xdom.min || 1)) * (box.r - box.l); };
    var y = yScale(ydom.min, ydom.max, box.t, box.b);
    for (var gx = 0; gx < 18; gx++) {
      for (var gy = 0; gy < 8; gy++) {
        root.appendChild(svg("rect", { x: box.l + gx * ((box.r - box.l) / 18), y: box.t + gy * ((box.b - box.t) / 8), width: 3, height: 3, fill: "#f0f0f0" }));
      }
    }
    if (plot.trend && plot.trend.length > 1) {
      var tpts = plot.trend.map(function (p) { return [x(p[0]), y(p[1])]; });
      root.appendChild(svg("path", { d: smooth(tpts), fill: "none", stroke: "#fa7319", "stroke-width": "2", "stroke-dasharray": "5 4" }));
    }
    seriesOn(plot, off).forEach(function (s) {
      s.pts.forEach(function (p, i) {
        root.appendChild(svg("circle", { cx: x(p[0]), cy: y(p[1]), r: 5, fill: s.c, "data-i": Math.round(p[0]), "data-base": s.c }));
      });
    });
    (plot.xLabels || []).forEach(function (label, i) {
      if (label) axisText(root, x(i), box.h - 8, label);
    });
    return Math.max(xs.length, 1);
  }

  function drawSankey(root, plot) {
    var left = plot.nodes.filter(function (n) { return n.side === "l"; });
    var right = plot.nodes.filter(function (n) { return n.side === "r"; });
    function weight(id, side) {
      return plot.links.reduce(function (a, link) {
        return a + ((side === "l" ? link.from : link.to) === id ? link.v : 0);
      }, 0);
    }
    var lTotal = left.reduce(function (a, n) { return a + weight(n.id, "l"); }, 0) || 1;
    var rTotal = right.reduce(function (a, n) { return a + weight(n.id, "r"); }, 0) || 1;
    var top = 28;
    var height = 250;
    function layout(nodes, total, side) {
      var y = top;
      var map = {};
      nodes.forEach(function (n) {
        var h = Math.max(18, (weight(n.id, side) / total) * (height - (nodes.length - 1) * 10));
        map[n.id] = { y: y, h: h, n: n };
        y += h + 10;
      });
      return map;
    }
    var L = layout(left, lTotal, "l");
    var R = layout(right, rTotal, "r");
    var usedL = {};
    var usedR = {};
    plot.links.forEach(function (link) {
      var a = L[link.from];
      var b = R[link.to];
      if (!a || !b) return;
      var lh = (link.v / lTotal) * (height - (left.length - 1) * 10);
      var rh = (link.v / rTotal) * (height - (right.length - 1) * 10);
      var y1 = a.y + (usedL[link.from] || 0);
      var y2 = b.y + (usedR[link.to] || 0);
      usedL[link.from] = (usedL[link.from] || 0) + lh;
      usedR[link.to] = (usedR[link.to] || 0) + rh;
      var x1 = 150;
      var x2 = 470;
      var c = (x2 - x1) / 2;
      var d = "M " + x1 + " " + y1 + " C " + (x1 + c) + " " + y1 + ", " + (x2 - c) + " " + y2 + ", " + x2 + " " + y2 +
        " L " + x2 + " " + (y2 + rh) + " C " + (x2 - c) + " " + (y2 + rh) + ", " + (x1 + c) + " " + (y1 + lh) + ", " + x1 + " " + (y1 + lh) + " Z";
      root.appendChild(svg("path", { d: d, fill: a.n.c, opacity: "0.55" }));
    });
    Object.keys(L).forEach(function (id) {
      var node = L[id];
      root.appendChild(svg("rect", { x: 24, y: node.y, width: 126, height: node.h, rx: 8, fill: node.n.c }));
      axisText(root, 32, node.y + Math.min(16, node.h / 2 + 4), node.n.n, "start", "#171717");
    });
    Object.keys(R).forEach(function (id) {
      var node = R[id];
      root.appendChild(svg("rect", { x: 470, y: node.y, width: 140, height: node.h, rx: 8, fill: node.n.c }));
      axisText(root, 482, node.y + Math.min(16, node.h / 2 + 4), node.n.n, "start", "#171717");
    });
    return plot.links.length;
  }

  function drawStream(root, plot, box, off) {
    var shown = seriesOn(plot, off);
    var n = shown[0].d.length;
    var totals = [];
    for (var i = 0; i < n; i++) {
      var t = 0;
      shown.forEach(function (s) { t += s.d[i] || 0; });
      totals.push(t);
    }
    var max = extent(totals).max || 1;
    var x = function (i) { return n < 2 ? (box.l + box.r) / 2 : box.l + (i / (n - 1)) * (box.r - box.l); };
    var mid = (box.t + box.b) / 2;
    var amp = (box.b - box.t) / 2 - 8;
    var lower = totals.map(function (t) { return t / 2; });
    shown.forEach(function (s) {
      var top = [];
      var bot = [];
      for (var k = 0; k < n; k++) {
        var next = lower[k] - s.d[k];
        top.push([x(k), mid - (lower[k] / max) * amp]);
        bot.push([x(k), mid - (next / max) * amp]);
        lower[k] = next;
      }
      var d = smooth(top) + " L " + bot.reverse().map(function (p) { return p.join(" "); }).join(" L ") + " Z";
      root.appendChild(svg("path", { d: d, fill: s.c, opacity: "0.85" }));
    });
    (plot.labels || []).forEach(function (label, i) { if (label) axisText(root, x(i), box.h - 8, label); });
    for (var p = 0; p < n; p++) root.appendChild(svg("circle", { cx: x(p), cy: mid, r: 12, fill: "transparent", "data-i": p, "data-x": x(p) }));
    return n;
  }

  function drawTime(root, plot, box) {
    var items = plot.items.slice().sort(function (a, b) { return a.a - b.a; });
    var lanes = [];
    items.forEach(function (item) {
      var lane = -1;
      for (var i = 0; i < lanes.length; i++) if (item.a >= lanes[i]) { lane = i; break; }
      if (lane < 0) { lane = lanes.length; lanes.push(item.b); }
      else lanes[lane] = item.b;
      item.lane = lane;
    });
    var span = plot.end - plot.start || 1;
    var x = function (t) { return box.l + ((t - plot.start) / span) * (box.r - box.l); };
    var laneH = Math.min(28, (box.b - box.t) / Math.max(1, lanes.length));
    root.appendChild(svg("rect", { x: box.l, y: box.t + 8, width: box.r - box.l, height: 8, rx: 4, fill: "#f3e8ff" }));
    items.forEach(function (item, i) {
      var y = box.t + 28 + item.lane * (laneH + 6);
      var x0 = x(item.a);
      var w = Math.max(6, x(item.b) - x0);
      var depth = Math.min(1, item.v / (extent(items.map(function (it) { return it.v; })).max || 1));
      root.appendChild(svg("rect", { x: x0, y: y, width: w, height: laneH - 4, rx: 6, fill: plot.c || "#a22dff", opacity: 0.45 + depth * 0.55, "data-i": i, "data-base": plot.c || "#a22dff" }));
    });
    axisText(root, box.l, box.h - 8, "Start", "start");
    axisText(root, box.r, box.h - 8, "Week", "end");
    return items.length;
  }

  function drawCells(root, plot, box) {
    var n = plot.values.length;
    var max = extent(plot.values).max || 1;
    var rows = plot.rows || 12;
    var gap = 3;
    var colW = (box.r - box.l) / n;
    var cell = Math.min(colW - 4, (box.b - box.t) / rows);
    for (var i = 0; i < n; i++) {
      var lit = Math.max(1, Math.round((plot.values[i] / max) * rows));
      for (var r = 0; r < rows; r++) {
        var on = r >= rows - lit;
        var x = box.l + i * colW + (colW - cell) / 2;
        var y = box.t + (rows - 1 - r) * (cell + 1);
        root.appendChild(svg("rect", { x: x, y: y, width: cell, height: cell, rx: 2, fill: on ? plot.c : "#f3f3f3", "data-i": on ? i : null }));
      }
      if (plot.labels[i]) axisText(root, box.l + i * colW + colW / 2, box.h - 4, plot.labels[i]);
    }
    for (var k = 0; k < n; k++) root.appendChild(svg("rect", { x: box.l + k * colW, y: box.t, width: colW, height: box.b - box.t, fill: "transparent", "data-i": k, "data-x": box.l + k * colW + colW / 2 }));
    return n;
  }

  function drawMatrix(root, plot, box) {
    var n = plot.cols.length;
    var max = 0;
    plot.cols.forEach(function (c) { max = Math.max(max, c.inn + c.out); });
    max = max || 1;
    var rows = 8;
    var colW = (box.r - box.l) / n;
    var cell = Math.min(14, (box.b - box.t) / rows);
    plot.cols.forEach(function (col, i) {
      var inn = Math.round((col.inn / max) * rows);
      var out = Math.round((col.out / max) * rows);
      var x = box.l + i * colW + 2;
      for (var r = 0; r < out; r++) root.appendChild(svg("rect", { x: x, y: box.b - 24 - r * (cell + 2), width: Math.max(4, colW - 6), height: cell, rx: 2, fill: "#d4d4d4" }));
      for (var g = 0; g < inn; g++) root.appendChild(svg("rect", { x: x, y: box.b - 24 - (out + g) * (cell + 2), width: Math.max(4, colW - 6), height: cell, rx: 2, fill: "#12aa4c" }));
      root.appendChild(svg("rect", { x: box.l + i * colW, y: box.t, width: colW, height: box.b - box.t, fill: "transparent", "data-i": i, "data-x": box.l + i * colW }));
      if (plot.labels[i]) axisText(root, box.l + i * colW + colW / 2, box.h - 6, plot.labels[i]);
    });
    return n;
  }

  function drawCombo(root, plot, box) {
    var pts = [];
    plot.lines.forEach(function (line) { pts = pts.concat(line.pts); });
    plot.bars.forEach(function (bar) { pts.push([bar.x, bar.v]); });
    var xs = pts.map(function (p) { return p[0]; });
    var ys = pts.map(function (p) { return p[1]; });
    var xdom = { min: Math.min.apply(null, xs), max: Math.max.apply(null, xs) };
    var ydom = domain(ys.concat([0]), true);
    var x = function (v) { return box.l + ((v - xdom.min) / (xdom.max - xdom.min || 1)) * (box.r - box.l); };
    var y = yScale(ydom.min, ydom.max, box.t, box.b);
    grid(root, ydom.ticks, y, box.l, box.r).forEach(function (tick) { axisText(root, box.l - 6, y(tick) + 4, fmt(tick, "compact"), "end"); });
    var zero = y(0);
    root.appendChild(svg("line", { x1: box.l, x2: box.r, y1: zero, y2: zero, stroke: "#d1d1d1" }));
    var span = (xdom.max - xdom.min) / Math.max(1, plot.bars.length);
    plot.bars.forEach(function (bar) {
      var xx = x(bar.x);
      var yy = y(bar.v);
      var bw = Math.max(4, (box.r - box.l) / plot.bars.length * 0.45);
      root.appendChild(svg("rect", { x: xx - bw / 2, y: Math.min(zero, yy), width: bw, height: Math.max(1, Math.abs(yy - zero)), fill: bar.v < 0 ? "#f93b29" : "#12aa4c", opacity: "0.85" }));
    });
    plot.lines.forEach(function (line) {
      var path = smooth(line.pts.map(function (p) { return [x(p[0]), y(p[1])]; }));
      root.appendChild(svg("path", { d: path, fill: "none", stroke: line.c, "stroke-width": "2.4", "stroke-dasharray": line.dash ? "5 4" : null }));
    });
    return plot.lines[0].pts.length;
  }

  function drawFloat(root, plot, box) {
    var items = plot.items;
    var values = [];
    items.forEach(function (item) { values.push(item.top, item.bot); });
    var dom = domain(values, true);
    var y = yScale(dom.min, dom.max, box.t, box.b);
    grid(root, dom.ticks, y, box.l, box.r);
    var n = items.length;
    var gap = n > 24 ? 2 : 4;
    var bw = (box.r - box.l - gap * (n - 1)) / n;
    var step = Math.ceil(n / 6);
    items.forEach(function (item, i) {
      var x = box.l + i * (bw + gap);
      var y0 = y(item.top);
      var y1 = y(item.bot);
      var fill = item.over ? "#fa7319" : "#c8c8c8";
      root.appendChild(svg("rect", { x: x, y: Math.min(y0, y1), width: Math.max(bw, 1), height: Math.max(3, Math.abs(y1 - y0)), rx: Math.min(8, bw / 2), fill: fill, "data-i": i, "data-base": fill, "data-x": x }));
      if (plot.labels[i] && (n <= 8 || i % step === 0)) axisText(root, x + bw / 2, box.h - 6, plot.labels[i]);
    });
    return n;
  }

  function drawBand(root, plot, box, low, high) {
    var dom = domain(plot.d.concat([low, high]), false);
    var y = yScale(dom.min, dom.max, box.t, box.b);
    var n = plot.d.length;
    var x = function (i) { return box.l + (i / (n - 1)) * (box.r - box.l - (plot.liq ? 48 : 0)); };
    grid(root, dom.ticks, y, box.l, box.r);
    var yLow = y(low);
    var yHigh = y(high);
    root.appendChild(svg("rect", { "data-role": "band", x: box.l, y: Math.min(yLow, yHigh), width: box.r - box.l - (plot.liq ? 48 : 0), height: Math.abs(yHigh - yLow), fill: "#12aa4c", opacity: "0.12" }));
    var pts = plot.d.map(function (v, i) { return [x(i), y(v)]; });
    root.appendChild(svg("path", { d: smooth(pts), fill: "none", stroke: plot.c || "#097df6", "stroke-width": "2.2" }));
    root.appendChild(svg("line", { "data-role": "low", x1: box.l, x2: box.r - (plot.liq ? 48 : 0), y1: yLow, y2: yLow, stroke: "#12aa4c", "stroke-width": "2", cursor: plot.lock ? "default" : "ns-resize" }));
    root.appendChild(svg("line", { "data-role": "high", x1: box.l, x2: box.r - (plot.liq ? 48 : 0), y1: yHigh, y2: yHigh, stroke: "#0d7936", "stroke-width": "2" }));
    var last = n - 1;
    root.appendChild(svg("line", { x1: x(last), x2: box.r, y1: y(plot.d[last]), y2: y(plot.d[last]), stroke: "#171717", "stroke-dasharray": "3 3" }));
    root.appendChild(svg("circle", { cx: x(last), cy: y(plot.d[last]), r: 4, fill: plot.c || "#097df6" }));
    for (var i = 0; i < n; i += Math.ceil(n / 40)) {
      root.appendChild(svg("circle", { cx: x(i), cy: y(plot.d[i]), r: 8, fill: "transparent", "data-i": i, "data-x": x(i) }));
    }
    if (plot.liq && plot.liq.amounts) {
      var amounts = plot.liq.amounts;
      var maxA = extent(amounts).max || 1;
      amounts.forEach(function (amt, i) {
        var price = plot.liq.from + i * plot.liq.step;
        if (price < dom.min || price > dom.max) return;
        var yy = y(price);
        var inside = price >= Math.min(low, high) && price <= Math.max(low, high);
        root.appendChild(svg("rect", { x: box.r - 40, y: yy, width: (amt / maxA) * 36, height: 2, fill: inside ? "#12aa4c" : "#d4d4d4" }));
      });
    }
    var step = Math.ceil(n / 5);
    (plot.labels || []).forEach(function (label, i) { if (label && i % step === 0) axisText(root, x(i), box.h - 6, label); });
    root._bandScale = { y: y, dom: dom, box: box };
    return n;
  }

  function drawPanels(host, plot, hidden) {
    host.classList.add("panels");
    var wrap = el("div", "stats");
    plot.items.forEach(function (panel) {
      var card = el("div", "stat");
      card.innerHTML = "<p class='fig-label'>" + esc(panel.title) + "</p><b>" + showNum(panel.fig.value, panel.fig.fmt, hidden) + "</b>" + deltaHTML(panel.fig.delta, hidden);
      var svgRoot = svg("svg", { viewBox: "0 0 220 88", role: "img" });
      var max = extent(panel.d.concat([0])).max || 1;
      panel.d.forEach(function (v, i) {
        var h = (v / max) * 64;
        var bw = 200 / panel.d.length;
        svgRoot.appendChild(svg("rect", { x: 8 + i * bw, y: 72 - h, width: Math.max(2, bw - 3), height: h, rx: 2, fill: panel.c }));
      });
      card.appendChild(svgRoot);
      wrap.appendChild(card);
    });
    host.appendChild(wrap);
    return plot.items.length;
  }

  function drawMeter(host, plot) {
    var meter = el("div", "meter");
    meter.tabIndex = 0;
    meter.style.setProperty("--meter", plot.c || "#097df6");
    meter.setAttribute("role", "slider");
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", String(plot.n));
    meter.setAttribute("aria-label", "Meter");
    for (var i = 0; i < plot.n; i++) {
      var col = document.createElement("i");
      col.dataset.i = String(i);
      if (i < plot.filled) col.className = "on";
      meter.appendChild(col);
    }
    host.appendChild(meter);
    if (plot.ticks && plot.ticks.length) {
      var scale = el("div", "meter-scale");
      plot.ticks.forEach(function (tick) {
        var s = el("span");
        s.textContent = tick.label;
        scale.appendChild(s);
      });
      host.appendChild(scale);
    }
    if (plot.caption) {
      var cap = el("p", "note");
      cap.textContent = plot.caption;
      host.appendChild(cap);
    }
    return plot.n;
  }

  function mountPlot(host, plot, state, hooks) {
    host.replaceChildren();
    if (!plot) return;
    if (plot.t === "meter") {
      drawMeter(host, plot);
      var meter = host.querySelector(".meter");
      function meterAt(event) {
        var rect = meter.getBoundingClientRect();
        var i = Math.max(0, Math.min(plot.n - 1, Math.floor(((event.clientX - rect.left) / rect.width) * plot.n)));
        return i;
      }
      function meterTip(i) {
        meter.querySelectorAll("i").forEach(function (node) { node.classList.toggle("hot", Number(node.dataset.i) === i); });
        var level = plot.limit ? (plot.limit * (i + 1)) / plot.n : ((i + 1) / plot.n) * 100;
        var lines = ["Mark " + (i + 1) + " / " + plot.n];
        if (plot.limit) lines.push(fmt(level, plot.tip === "pct0" ? "pct0" : "usd0"));
        else lines.push(fmt(level, "pct0"));
        placeTip(host, ((i + 0.5) / plot.n) * 100, lines);
      }
      meter.addEventListener("pointermove", function (event) { meterTip(meterAt(event)); });
      meter.addEventListener("pointerleave", function () { host.querySelector(".tip").hidden = true; });
      meter.addEventListener("keydown", function (event) {
        var i = state.index || plot.filled || 0;
        if (event.key === "ArrowRight") i = Math.min(plot.n - 1, i + 1);
        else if (event.key === "ArrowLeft") i = Math.max(0, i - 1);
        else return;
        event.preventDefault();
        state.index = i;
        meterTip(i);
      });
      var tip = el("div", "tip");
      tip.hidden = true;
      tip.setAttribute("role", "status");
      host.appendChild(tip);
      host.dataset.n = String(plot.n);
      return;
    }
    if (plot.t === "panels") {
      drawPanels(host, plot, hooks.hidden);
      return;
    }
    var heights = { donut: 300, radial: 320, gauge: 220, sankey: 320, waffle: 200, share: 210, scatter: 240, time: 220, cells: 240 };
    var h = heights[plot.t] || (plot.t === "candle" ? 250 : 228);
    if (plot.t === "waffle") h = 200;
    var root = svg("svg", { viewBox: "0 0 640 " + h, role: "img" });
    root.setAttribute("aria-label", hooks.label || "Chart");
    var pid = "p" + (++mountPlot.uid);
    var patterns = addPatterns(root, pid);
    var box = { w: 640, h: h, l: plot.t === "sankey" ? 16 : 52, r: 620, t: 16, b: h - 28 };
    var n = 0;
    var low = state.low != null ? state.low : plot.low;
    var high = state.high != null ? state.high : plot.high;
    if (plot.t === "bars") n = drawBarsLike(root, plot, box, "bars", state.off, patterns);
    else if (plot.t === "stack") n = drawBarsLike(root, plot, box, "stack", state.off, patterns);
    else if (plot.t === "group") n = drawBarsLike(root, plot, box, "group", state.off, patterns);
    else if (plot.t === "area") n = drawLine(root, plot, box, state.off, true);
    else if (plot.t === "line" || plot.t === "stream" && plot.s.length === 1) n = plot.t === "stream" ? drawStream(root, plot, box, state.off) : drawLine(root, plot, box, state.off, false);
    else if (plot.t === "stream") n = drawStream(root, plot, box, state.off);
    else if (plot.t === "div") n = drawDiv(root, plot, box);
    else if (plot.t === "cols") n = drawCols(root, plot, box);
    else if (plot.t === "candle") n = drawCandle(root, plot, box);
    else if (plot.t === "donut") n = drawDonut(root, plot, box);
    else if (plot.t === "gauge") n = drawGauge(root, plot, box);
    else if (plot.t === "radial") n = drawRadial(root, plot, box);
    else if (plot.t === "share") n = drawShare(root, plot, box);
    else if (plot.t === "split") n = drawSplit(root, plot, box);
    else if (plot.t === "waffle") n = drawWaffle(root, plot);
    else if (plot.t === "scatter") n = drawScatter(root, plot, box, state.off);
    else if (plot.t === "sankey") n = drawSankey(root, plot);
    else if (plot.t === "time") n = drawTime(root, plot, box);
    else if (plot.t === "cells") n = drawCells(root, plot, box);
    else if (plot.t === "matrix") n = drawMatrix(root, plot, box);
    else if (plot.t === "combo") n = drawCombo(root, plot, box);
    else if (plot.t === "float") n = drawFloat(root, plot, box);
    else if (plot.t === "band") n = drawBand(root, plot, box, low, high);
    host.dataset.n = String(n);
    host.appendChild(root);
    var tip = el("div", "tip");
    tip.hidden = true;
    tip.setAttribute("role", "status");
    host.appendChild(tip);
    host.tabIndex = 0;

    function indexAt(event) {
      var rect = root.getBoundingClientRect();
      var px = ((event.clientX - rect.left) / rect.width) * 640;
      var best = 0;
      var bestD = Infinity;
      root.querySelectorAll("[data-i]").forEach(function (node) {
        var x = Number(node.getAttribute("data-x") || node.getAttribute("cx") || node.getAttribute("x") || 0);
        var d = Math.abs(x - px);
        if (d < bestD) { bestD = d; best = Number(node.getAttribute("data-i")); }
      });
      return best;
    }

    host.addEventListener("pointermove", function (event) {
      if (!n) return;
      var i = indexAt(event);
      var rect = host.getBoundingClientRect();
      placeTip(host, ((event.clientX - rect.left) / rect.width) * 100, tipLines(plot, i, state.off));
      markActive(host, i, plot.accent);
      hooks.preview(i);
    });
    host.addEventListener("pointerleave", function () {
      tip.hidden = true;
      markActive(host, state.index, plot.accent);
      hooks.preview(state.index);
    });
    host.addEventListener("click", function (event) {
      var i = indexAt(event);
      state.index = i;
      hooks.preview(i);
    });
    host.addEventListener("keydown", function (event) {
      if (!n) return;
      var i = state.index || 0;
      if (event.key === "ArrowRight") i = Math.min(n - 1, i + 1);
      else if (event.key === "ArrowLeft") i = Math.max(0, i - 1);
      else if (event.key === "Home") i = 0;
      else if (event.key === "End") i = n - 1;
      else return;
      event.preventDefault();
      state.index = i;
      markActive(host, i, plot.accent);
      placeTip(host, 50, tipLines(plot, i, state.off));
      hooks.preview(i);
    });

    if (plot.t === "band" && !plot.lock) {
      root.querySelectorAll("[data-role='low'], [data-role='high']").forEach(function (handle) {
        handle.style.cursor = "ns-resize";
        handle.addEventListener("pointerdown", function (event) {
          event.preventDefault();
          var role = handle.getAttribute("data-role");
          function move(ev) {
            var rect = root.getBoundingClientRect();
            var py = ((ev.clientY - rect.top) / rect.height) * h;
            var scale = root._bandScale;
            if (!scale) return;
            var value = scale.dom.max - ((py - scale.box.t) / (scale.box.b - scale.box.t)) * (scale.dom.max - scale.dom.min);
            if (role === "low") state.low = value;
            else state.high = value;
            if (state.low > state.high) {
              var swap = state.low;
              state.low = state.high;
              state.high = swap;
            }
            hooks.band(state.low, state.high);
            var y = scale.y;
            var band = root.querySelector("[data-role='band']");
            var yA = y(state.low);
            var yB = y(state.high);
            band.setAttribute("y", Math.min(yA, yB));
            band.setAttribute("height", Math.abs(yB - yA));
            root.querySelector("[data-role='low']").setAttribute("y1", y(state.low));
            root.querySelector("[data-role='low']").setAttribute("y2", y(state.low));
            root.querySelector("[data-role='high']").setAttribute("y1", y(state.high));
            root.querySelector("[data-role='high']").setAttribute("y2", y(state.high));
          }
          function up() {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          }
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        });
      });
    }
    markActive(host, state.index, plot.accent);
  }
  mountPlot.uid = 0;

  function viewOf(chart, state) {
    if (chart.modes && chart.segs) return chart.views[state.mode + "|" + state.seg];
    if (chart.segs) return chart.views[state.seg];
    if (chart.modes) return chart.views[state.mode];
    return chart.views._;
  }

  function focusValue(plot, i) {
    if (plot.t === "candle") return plot.items[i].c;
    if (plot.d) return plot.d[i];
    if (plot.values) return plot.values[i];
    if (plot.s && plot.s[0] && plot.s[0].d) return plot.s[0].d[i];
    if (plot.s && plot.s[0] && plot.s[0].pts && plot.s[0].pts[i]) return plot.s[0].pts[i][1];
    return null;
  }

  function renderRows(rows, hidden) {
    return rows.map(function (row) {
      return '<li class="row"><span class="dot" style="background:' + esc(row.tone || "#097df6") + '"></span><div><p class="row-name">' +
        esc(row.name) + "</p>" + (row.cap ? '<p class="row-cap">' + esc(row.cap) + "</p>" : "") +
        '</div><div><p class="row-amt">' + showNum(row.amt, row.fmt || "usd", hidden) + "</p>" + deltaHTML(row.delta, hidden) + "</div></li>";
    }).join("");
  }

  function figBlock(fig, hidden, follow) {
    return '<div class="fig"><p class="fig-label">' + esc(fig.label || "") + '</p><p class="fig-value" ' +
      (follow ? 'data-follow="1"' : "") + ' data-fig="' + esc(fig.label || "") + '">' + showNum(fig.value, fig.fmt, hidden) +
      "</p>" + deltaHTML(fig.delta, hidden).replace("<p class=\"delta", follow ? '<p data-follow-delta="1" class="delta' : '<p class="delta') + "</div>";
  }

  function paint(article, chart) {
    var state = article._state;
    var view = viewOf(chart, state);
    if (!view) return;
    if (state.index == null || state.reset) {
      state.index = view.plot.hi || 0;
      state.reset = false;
    }
    if (view.plot && view.plot.t === "band") {
      if (state.low == null) state.low = view.plot.low;
      if (state.high == null) state.high = view.plot.high;
    }
    var hidden = !!state.eye;
    var body = article.querySelector(".card-body");
    var figs = (view.figs || []).slice();
    if (view.follow && !figs.some(function (f) { return f.label === view.follow.label; })) {
      var seed = focusValue(view.plot, state.index);
      figs.push({ label: view.follow.label, value: seed, fmt: view.follow.fmt, delta: null, _follow: true });
    }
    var html = "";
    if (view.kicker) html += '<p class="kicker">' + esc(view.kicker) + "</p>";
    if (view.ticker) {
      var track = view.ticker.concat(view.ticker).map(function (q) {
        return '<span class="quote ' + (q.change < 0 ? "down" : "up") + '">' + esc(q.symbol) + " " + fmt(q.price, q.price < 5 ? "num2" : "usd0") + " " + fmt(q.change, "pcts") + "</span>";
      }).join("");
      html += '<div class="ticker" aria-hidden="true"><div class="ticker-track">' + track + "</div></div>";
    }
    if (figs.length) html += '<div class="figs">' + figs.map(function (f) { return figBlock(f, hidden, view.follow && f.label === view.follow.label); }).join("") + "</div>";
    if (chart.modes) {
      html += '<div class="modes" role="radiogroup" aria-label="Series">' + chart.modes.map(function (m) {
        return '<button type="button" role="radio" data-mode="' + esc(m.id) + '" aria-checked="' + (m.id === state.mode) + '">' + esc(m.label) + "</button>";
      }).join("") + "</div>";
    }
    if (chart.segs) {
      html += '<div class="segs" role="radiogroup" aria-label="Range">' + chart.segs.map(function (s) {
        return '<button type="button" role="radio" data-seg="' + esc(s.id) + '" aria-checked="' + (s.id === state.seg) + '">' + esc(s.label) + "</button>";
      }).join("") + "</div>";
    }
    if (view.stats) {
      html += '<div class="stats">' + view.stats.map(function (s) {
        return '<div class="stat"><p class="fig-label">' + esc(s.label) + '</p><b style="color:' + esc(s.color || "#171717") + '">' + showNum(s.value, s.fmt, hidden) + "</b>" + deltaHTML(s.delta, hidden) + "</div>";
      }).join("") + "</div>";
    }
    html += '<div class="plot" data-plot="1"></div>';
    if (view.plot2) html += '<div class="plot plot-2" data-plot="2"></div>';
    var legendSeries = (view.plot.s || []).concat(view.plot.up ? [view.plot.up, view.plot.down] : []).concat(view.plot.lines || []);
    if (view.plot.legend && legendSeries.length) {
      html += '<div class="legend">' + legendSeries.map(function (s) {
        var on = !state.off[s.n];
        return '<button type="button" data-series="' + esc(s.n) + '" aria-pressed="' + on + '"><span class="swatch" style="background:' + esc(s.c) + '"></span>' + esc(s.n) + "</button>";
      }).join("") + "</div>";
    }
    var meta = view.plot.meta && view.plot.meta[state.index];
    var note = (meta && meta.note) || view.note || "";
    if (note) html += '<p class="note" data-note>' + esc(note) + "</p>";
    else html += '<p class="note" data-note hidden></p>';
    if (view.tabs) {
      var tab = view.tabs.filter(function (t) { return t.id === state.tab; })[0] || view.tabs[0];
      state.tab = tab.id;
      html += '<div class="tabs" role="tablist">' + view.tabs.map(function (t) {
        return '<button type="button" role="tab" data-tab="' + esc(t.id) + '" aria-selected="' + (t.id === state.tab) + '">' + esc(t.label) + "</button>";
      }).join("") + "</div>";
      html += '<ul class="rows" data-rows>' + renderRows(tab.rows || [], hidden) + "</ul>";
    } else {
      var rows = (meta && meta.rows) || view.rows || [];
      if (rows.length) html += '<ul class="rows" data-rows>' + renderRows(rows, hidden) + "</ul>";
    }
    body.innerHTML = html;

    function preview(i) {
      var value = focusValue(view.plot, i);
      var node = body.querySelector("[data-follow]");
      if (node && value != null) node.textContent = hidden ? MASK : fmt(value, view.follow.fmt);
      var metaNow = view.plot.meta && view.plot.meta[i];
      var delta = body.querySelector("[data-follow-delta]");
      if (delta && metaNow && (metaNow.pct != null || metaNow.amt != null)) {
        delta.outerHTML = deltaHTML({ amt: metaNow.amt, pct: metaNow.pct, text: (metaNow.text || (view.follow && view.follow.deltaText) || "") }, hidden).replace("<p class=\"delta", '<p data-follow-delta="1" class="delta');
      }
      var noteNode = body.querySelector("[data-note]");
      if (noteNode && metaNow && metaNow.note) {
        noteNode.hidden = false;
        noteNode.textContent = metaNow.note;
      }
      if (metaNow && metaNow.rows && !view.tabs) {
        var list = body.querySelector("[data-rows]");
        if (!list) {
          list = el("ul", "rows");
          list.dataset.rows = "1";
          body.appendChild(list);
        }
        list.innerHTML = renderRows(metaNow.rows, hidden);
      }
    }

    var host = body.querySelector("[data-plot='1']");
    try {
      mountPlot(host, view.plot, state, {
        label: chart.title,
        hidden: hidden,
        preview: preview,
        band: function (low, high) {
          body.querySelectorAll("[data-fig]").forEach(function (node) {
            var name = node.getAttribute("data-fig") || "";
            if (/^low/i.test(name)) node.textContent = hidden ? MASK : fmt(low, "usd0");
            if (/^high/i.test(name)) node.textContent = hidden ? MASK : fmt(high, "usd0");
          });
        }
      });
    } catch (err) {
      errors.push(chart.id + ": " + err.message);
      host.textContent = "Could not draw this chart";
    }
    if (view.plot2) {
      var host2 = body.querySelector("[data-plot='2']");
      try {
        mountPlot(host2, view.plot2, { index: view.plot2.hi || 0, off: {}, low: null, high: null }, { label: chart.title + " detail", hidden: hidden, preview: function () {}, band: function () {} });
      } catch (err2) {
        errors.push(chart.id + " detail: " + err2.message);
      }
    }
    preview(state.index);

    body.querySelectorAll("[data-seg]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.seg = button.getAttribute("data-seg");
        state.index = null;
        state.reset = true;
        state.low = null;
        state.high = null;
        state.off = {};
        paint(article, chart);
      });
    });
    body.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.mode = button.getAttribute("data-mode");
        state.index = null;
        state.reset = true;
        state.low = null;
        state.high = null;
        state.off = {};
        paint(article, chart);
      });
    });
    body.querySelectorAll("[data-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.tab = button.getAttribute("data-tab");
        paint(article, chart);
      });
    });
    body.querySelectorAll("[data-series]").forEach(function (button) {
      button.addEventListener("click", function () {
        var name = button.getAttribute("data-series");
        state.off[name] = !state.off[name];
        paint(article, chart);
      });
    });
  }

  function eyeIcon(open) {
    if (open) {
      return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1.5 8S3.8 4.5 8 4.5 14.5 8 14.5 8 12.2 11.5 8 11.5 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="1.8"/></svg>';
    }
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 2l12 12M6.8 4.2A6.7 6.7 0 0 1 8 4.5C12.2 4.5 14.5 8 14.5 8a11 11 0 0 1-2.1 2.6M4.8 5.4C3.1 6.4 1.5 8 1.5 8A11 11 0 0 0 8 11.5c.7 0 1.3-.1 1.9-.3"/></svg>';
  }

  function cardArticle(chart, index) {
    var article = el("article", "card" + (chart.wide ? " wide" : ""));
    article.id = chart.id;
    article.dataset.kind = chart.kind;
    article.dataset.chart = chart.id;
    article.style.animationDelay = Math.min(index * 0.025, 0.36) + "s";
    article._state = {
      seg: chart.defSeg,
      mode: chart.defMode,
      tab: "",
      eye: false,
      index: null,
      reset: true,
      off: {},
      low: null,
      high: null
    };
    var head = el("div", "card-head");
    var titles = el("div");
    if (chart.kicker) {
      var k = el("p", "kicker");
      k.textContent = chart.kicker;
      titles.appendChild(k);
    }
    var h2 = el("h2", "card-title");
    h2.textContent = chart.title;
    titles.appendChild(h2);
    if (chart.desc) {
      var d = el("p", "desc");
      d.textContent = chart.desc;
      titles.appendChild(d);
    }
    head.appendChild(titles);
    if (chart.eye) {
      var eye = el("button", "eye");
      eye.type = "button";
      eye.setAttribute("aria-pressed", "false");
      eye.setAttribute("aria-label", "Hide amounts");
      eye.innerHTML = eyeIcon(true);
      eye.addEventListener("click", function () {
        article._state.eye = !article._state.eye;
        eye.setAttribute("aria-pressed", article._state.eye ? "true" : "false");
        eye.setAttribute("aria-label", article._state.eye ? "Show amounts" : "Hide amounts");
        eye.innerHTML = eyeIcon(!article._state.eye);
        paint(article, chart);
      });
      head.appendChild(eye);
    }
    article.appendChild(head);
    article.appendChild(el("div", "card-body"));
    paint(article, chart);
    return article;
  }

  function boot() {
    var charts = window.MEBIUS_CHARTS || [];
    var grid = document.getElementById("chart-grid");
    var empty = document.getElementById("chart-empty");
    var count = document.getElementById("chart-count");
    var search = document.getElementById("chart-search");
    var filters = document.getElementById("chart-filters");
    if (!grid) return;
    var order = ["All", "Bar", "Line", "Area", "Pie", "Radial", "Progress", "Candle", "Scatter", "Sankey", "Stream", "Timeline", "Waffle"];
    var kinds = order.filter(function (kind) {
      return kind === "All" || charts.some(function (c) { return c.kind === kind; });
    });
    var active = "All";
    kinds.forEach(function (kind) {
      var button = el("button");
      button.type = "button";
      button.textContent = kind === "All" ? "All" : kind;
      button.setAttribute("aria-pressed", kind === "All" ? "true" : "false");
      button.addEventListener("click", function () {
        active = kind;
        filters.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === button ? "true" : "false"); });
        apply();
      });
      filters.appendChild(button);
    });
    charts.forEach(function (chart, i) {
      try {
        grid.appendChild(cardArticle(chart, i));
      } catch (err) {
        errors.push(chart.id + " card: " + (err && err.stack ? err.stack : err));
        var failed = el("article", "card");
        failed.id = chart.id;
        failed.dataset.chart = chart.id;
        failed.dataset.kind = chart.kind;
        var title = el("h2", "card-title");
        title.textContent = chart.title;
        failed.appendChild(title);
        var msg = el("p", "note");
        msg.textContent = "Could not draw this chart";
        failed.appendChild(msg);
        grid.appendChild(failed);
      }
    });

    function apply() {
      var q = (search.value || "").trim().toLowerCase();
      var shown = 0;
      grid.querySelectorAll(".card").forEach(function (card) {
        var title = (card.querySelector(".card-title").textContent || "").toLowerCase();
        var kind = card.dataset.kind;
        var ok = (active === "All" || kind === active) && (!q || title.indexOf(q) >= 0 || kind.toLowerCase().indexOf(q) >= 0 || card.id.indexOf(q) >= 0);
        card.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown + (shown === 1 ? " chart" : " charts");
      empty.hidden = shown !== 0;
    }
    search.addEventListener("input", apply);
    var params = new URLSearchParams(location.search);
    if (params.get("q")) search.value = params.get("q");
    if (params.get("kind") && kinds.indexOf(params.get("kind")) >= 0) {
      active = params.get("kind");
      filters.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", b.textContent === active || (active === "All" && b.textContent === "All") ? "true" : "false");
      });
    }
    apply();
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
    var log = el("pre");
    log.id = "errlog";
    log.hidden = true;
    log.textContent = errors.join("\n");
    document.body.appendChild(log);
    window.__mebiusErrors = errors;
    window.__mebiusCount = charts.length;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

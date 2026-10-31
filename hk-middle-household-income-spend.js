/* HK middle household income and spend.
   A 16s film. Each beat is a pure function of time.
   Motion Prompt techniques, adapted from the vendored cells (MIT, Shohei Ohtaki).
   Scenes: #183 #007 #002 #005 #144 #004 #027 #071 #006 #187.
   Cuts: #017 #018 #137 #020 #044. Landed figures: #080.
   Demo scenes from those cells are not drawn. */
(function () {
  "use strict";

  var W = 1280;
  var H = 720;
  var DURATION = 16;
  var FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  var FONT_YUE = '"PingFang HK", "PingFang TC", "Noto Sans CJK HK", "Noto Sans CJK TC", "WenQuanYi Micro Hei", "Heiti TC", "Microsoft JhengHei", sans-serif';
  var INK = "#1c1c22";
  var MUTED = "#5c5c66";
  var PAGE = "#f6f5f3";
  var CARD = "#ffffff";
  var LINE = "rgba(28, 28, 34, 0.1)";
  var TRACK = "#eceae6";
  var MARK = "rgba(28, 28, 34, 0.18)";

  /* Cell indexes match catalog-slim.json order inside each pack. */
  var EFFECTS = {
    "183": { pack: "camera2", index: 14, name: "Establishing shot" },
    "007": { pack: "motion", index: 6, name: "Count-up" },
    "002": { pack: "motion", index: 1, name: "Stagger" },
    "005": { pack: "motion", index: 4, name: "Mask reveal" },
    "144": { pack: "motion2", index: 23, name: "Split screen" },
    "004": { pack: "motion", index: 3, name: "Line draw" },
    "027": { pack: "camera", index: 2, name: "Dolly in" },
    "071": { pack: "ui", index: 22, name: "Badge" },
    "006": { pack: "motion", index: 5, name: "Typewriter" },
    "187": { pack: "camera2", index: 18, name: "Fade to black" },
    "017": { pack: "motion", index: 16, name: "Mask transition" },
    "018": { pack: "motion", index: 17, name: "Shape transition" },
    "022": { pack: "motion", index: 21, name: "Light sweep" },
    "020": { pack: "motion", index: 19, name: "Zoom through" },
    "137": { pack: "motion2", index: 16, name: "Push transition" },
    "044": { pack: "camera", index: 19, name: "Cross dissolve" },
    "080": { pack: "lp", index: 7, name: "Highlighter animation" }
  };

  /* Cuts sit on the beat boundary. The outgoing frame is held; the incoming beat keeps playing. */
  var CUTS = [
    { t0: 2, dur: 0.5, id: "017" },
    { t0: 5, dur: 0.5, id: "018" },
    { t0: 8, dur: 0.5, id: "137" },
    { t0: 12, dur: 0.5, id: "020" },
    { t0: 14, dur: 0.5, id: "044" }
  ];

  var BEATS = [
    {
      id: "hook",
      t0: 0,
      t1: 2,
      label: "Hook",
      effects: ["183"],
      en: "Hong Kong \u00b7 middle of the pack",
      yue: "\u9999\u6e2f \u00b7 \u4e2d\u7522\u6c34\u5e73\u4e00\u77a5",
      live: "Hong Kong, middle of the pack. \u9999\u6e2f, \u4e2d\u7522\u6c34\u5e73\u4e00\u77a5."
    },
    {
      id: "income",
      t0: 2,
      t1: 5,
      label: "Income",
      effects: ["007", "002", "080"],
      en: "Median household income $30,000/mo \u00b7 economically active $40,000",
      yue: "\u4f4f\u6236\u5165\u606f\u4e2d\u4f4d\u6578\u6bcf\u6708\u4e09\u842c \u00b7 \u6709\u5de5\u4f5c\u4f4f\u6236\u56db\u842c",
      live: "Median household income $30,000 per month. Economically active households, $40,000. \u4f4f\u6236\u5165\u606f\u4e2d\u4f4d\u6578\u6bcf\u6708\u4e09\u842c, \u6709\u5de5\u4f5c\u4f4f\u6236\u56db\u842c."
    },
    {
      id: "spend",
      t0: 5,
      t1: 8,
      label: "Spend",
      effects: ["005", "144", "080"],
      en: "Average spend $32,472 \u00b7 median $26,000",
      yue: "\u5e73\u5747\u958b\u652f\u4e09\u842c\u4e8c\u5343 \u00b7 \u4e2d\u4f4d\u6578\u4e8c\u842c\u516d\u5343",
      live: "Average household spend, $32,472 per month. Median spend, $26,000. \u5e73\u5747\u958b\u652f\u4e09\u842c\u4e8c\u5343, \u4e2d\u4f4d\u6578\u4e8c\u842c\u516d\u5343."
    },
    {
      id: "where",
      t0: 8,
      t1: 12,
      label: "Where it goes",
      effects: ["004", "002", "080"],
      en: "Housing 39% \u00b7 food 24% \u00b7 transport 8%",
      yue: "\u4f4f\u5c4b\u4e09\u6210\u4e5d \u00b7 \u98df\u7269\u5169\u6210\u56db \u00b7 \u4ea4\u901a\u7d04\u4e00\u6210",
      live: "Housing 39 percent, $12,775. Food 24 percent, $7,836. Transport 8 percent, $2,499. \u4f4f\u5c4b\u4e09\u6210\u4e5d, \u98df\u7269\u5169\u6210\u56db, \u4ea4\u901a\u7d04\u4e00\u6210."
    },
    {
      id: "scale",
      t0: 12,
      t1: 14,
      label: "Scale",
      effects: ["027", "071"],
      en: "Avg household 2.6 people \u00b7 third-quartile spend ~$32k",
      yue: "\u5e73\u5747\u4f4f\u6236\u4e8c\u9ede\u516d\u4eba \u00b7 \u7b2c\u4e09\u56db\u5206\u4f4d\u958b\u652f\u7d04\u4e09\u842c\u4e8c",
      live: "Average household, 2.6 people. Third-quartile spend band, about $32,000. \u5e73\u5747\u4f4f\u6236\u4e8c\u9ede\u516d\u4eba, \u7b2c\u4e09\u56db\u5206\u4f4d\u958b\u652f\u7d04\u4e09\u842c\u4e8c."
    },
    {
      id: "close",
      t0: 14,
      t1: 16,
      label: "Close",
      effects: ["006", "187"],
      en: "No official middle-class line \u00b7 Censtatd medians",
      yue: "\u5b98\u65b9\u7121\u300c\u4e2d\u7522\u300d\u5b9a\u7fa9 \u00b7 \u7528\u7d71\u8a08\u8655\u4e2d\u4f4d\u6578",
      live: "No official middle class line. Census and Statistics Department medians. \u5b98\u65b9\u7121\u4e2d\u7522\u5b9a\u7fa9, \u7528\u7d71\u8a08\u8655\u4e2d\u4f4d\u6578."
    }
  ];

  /* On-screen labels use the beat sheet. Bar length uses the survey share. */
  var SPEND_ROWS = [
    { label: "Housing 39% · $12,775", share: 0.393 },
    { label: "Food 24% · $7,836", share: 0.241 },
    { label: "Transport 8% · $2,499", share: 0.077 }
  ];

  var CLOSE_LINE = "No official \u201cmiddle class\u201d line \u00b7 Censtatd medians";
  var SOURCE_LINES = [
    "Census & Statistics Department \u2014 Quarterly Report on General Household Survey Q4 2025;",
    "Report on 2024/25 Household Expenditure Survey."
  ];

  var FRONT = [
    [120, 44, 78],
    [172, 28, 128],
    [208, 56, 64],
    [272, 32, 168],
    [312, 48, 96],
    [368, 80, 52],
    [456, 26, 110],
    [490, 42, 72],
    [760, 40, 86],
    [808, 30, 176],
    [846, 54, 108],
    [908, 34, 70],
    [950, 26, 136],
    [984, 50, 60],
    [1042, 70, 48],
    [1120, 36, 98]
  ];

  var BACK = [
    [80, 90, 44],
    [180, 130, 58],
    [330, 100, 36],
    [700, 150, 50],
    [870, 110, 66],
    [1000, 120, 40],
    [1140, 64, 32]
  ];

  function clamp(x, a, b) {
    return Math.min(b, Math.max(a, x));
  }

  function lerp(a, b, x) {
    return a + (b - a) * x;
  }

  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  /* Cubic-out. Same curve as the packs' eOut. */
  function cubicOut(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  /* Quintic-out. Same curve as the packs' eOut5, used by mask reveal. */
  function quintOut(x) {
    return 1 - Math.pow(1 - x, 5);
  }

  /* Cubic in-out. Same curve as the packs' eIO, used by the split. */
  function cubicIO(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  /* Quadratic in-out. Same curve as the packs' eIOs, used by fade to black. */
  function quadIO(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  function setFont(ctx, size, weight, ls, face) {
    ctx.font = weight + " " + size + "px " + (face || FONT);
    if ("letterSpacing" in ctx) ctx.letterSpacing = ls || "0px";
  }

  function clearSpacing(ctx) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  function measure(ctx, text, size, weight, ls, face) {
    setFont(ctx, size, weight, ls, face);
    var w = ctx.measureText(text).width;
    clearSpacing(ctx);
    return w;
  }

  function txt(ctx, text, x, y, size, weight, color, align, base, ls, face) {
    setFont(ctx, size, weight, ls, face);
    ctx.fillStyle = color;
    ctx.textAlign = align || "left";
    ctx.textBaseline = base || "middle";
    ctx.fillText(text, x, y);
    clearSpacing(ctx);
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, w, h, rad);
      return;
    }
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function card(ctx, x, y, w, h) {
    if (w < 1 || h < 1) return;
    roundRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = CARD;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function formatMoney(n) {
    var v = Math.max(0, Math.round(n));
    var s = String(v);
    var out = "";
    var i;
    for (i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 === 0) out += ",";
      out += s.charAt(i);
    }
    return "$" + out;
  }

  function glyphWidth(ctx, ch, size, ls) {
    setFont(ctx, size, 600, ls);
    var w = ctx.measureText(ch === "," || ch === "$" ? ch : "0").width;
    clearSpacing(ctx);
    return w;
  }

  function moneyWidth(ctx, text, size, ls) {
    var w = 0;
    var i;
    for (i = 0; i < text.length; i++) w += glyphWidth(ctx, text.charAt(i), size, ls);
    return w;
  }

  function drawMoneySlots(ctx, text, x, baseline, size, color, ls) {
    var i;
    var cursor = x;
    for (i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var w = glyphWidth(ctx, ch, size, ls);
      txt(ctx, ch, cursor + w / 2, baseline, size, 600, color, "center", "alphabetic", ls);
      cursor += w;
    }
  }

  function fitSteps(ctx, text, weight, steps, max, ls, face) {
    var i;
    for (i = 0; i < steps.length; i++) {
      if (measure(ctx, text, steps[i], weight, ls, face) <= max) return steps[i];
    }
    return steps[steps.length - 1];
  }

  /* #080 Highlighter: a stroke draws across the landed figure, then holds. */
  function highlighter(ctx, x, y, w, h, p) {
    if (p <= 0.001 || w <= 0 || h <= 0) return;
    roundRect(ctx, x, y, Math.max(1, w * p), h, 4);
    ctx.fillStyle = MARK;
    ctx.fill();
  }

  function beatAt(t) {
    var i;
    for (i = BEATS.length - 1; i >= 0; i--) {
      if (t >= BEATS[i].t0) return BEATS[i];
    }
    return BEATS[0];
  }

  function effectLine(ids) {
    return ids
      .map(function (id) {
        return "#" + id + " " + EFFECTS[id].name;
      })
      .join(" · ");
  }

  function clock(t) {
    var clamped = clamp(t, 0, DURATION);
    var sec = Math.floor(clamped);
    var tenth = Math.min(9, Math.floor((clamped - sec) * 10 + 1e-6));
    return "0:" + (sec < 10 ? "0" : "") + sec + "." + tenth;
  }

  function tower(ctx, x, base, w, h, color) {
    ctx.fillStyle = color;
    var podium = Math.min(24, h * 0.2);
    ctx.fillRect(x - 4, base - podium, w + 8, podium);
    ctx.fillRect(x, base - h, w, h - podium + 1);
    if (h > 150) ctx.fillRect(x + w / 2 - 1, base - h - 16, 2, 16);
  }

  function drawCluster(ctx, list, base, color) {
    var i;
    for (i = 0; i < list.length; i++) {
      tower(ctx, list[i][0], base, list[i][1], list[i][2], color);
    }
  }

  /* #183 Establishing shot: wide place, ease-out 0.6s, then hold. */
  function drawHook(ctx, local) {
    var p = cubicOut(seg(local, 0, 0.6));
    var title = "Hong Kong \u00b7 middle of the pack";
    var size = fitSteps(ctx, title, 600, [48, 36, 30], 1120, "-0.02em");

    ctx.save();
    ctx.globalAlpha = p;
    txt(ctx, title, W / 2, 196 + (1 - p) * 16, size, 600, INK, "center", "middle", "-0.02em");
    ctx.restore();

    ctx.save();
    ctx.translate(W / 2, 520);
    ctx.scale(lerp(0.97, 1, p), lerp(0.97, 1, p));
    ctx.translate(-W / 2, -520);
    drawCluster(ctx, BACK, 528, MUTED);
    ctx.restore();

    ctx.save();
    ctx.translate(W / 2, 560);
    ctx.scale(lerp(0.92, 1, p), lerp(0.92, 1, p));
    ctx.translate(-W / 2, -560);
    ctx.fillStyle = TRACK;
    ctx.fillRect(64, 560, 1152, 48);
    ctx.fillStyle = INK;
    ctx.fillRect(64, 559, 1152, 1);
    drawCluster(ctx, FRONT, 560, INK);
    ctx.restore();
  }

  /* #007 Count-up on $30,000, cubic-out 1.2s. #002 Stagger on the second line, 80ms. */
  function drawIncome(ctx, local) {
    var labelP = cubicOut(seg(local, 0, 0.25));
    ctx.save();
    ctx.globalAlpha = labelP;
    txt(
      ctx,
      "Median household income",
      W / 2,
      236 + (1 - labelP) * 8,
      20,
      500,
      MUTED,
      "center",
      "middle"
    );
    ctx.restore();

    var countP = cubicOut(seg(local, 0.05, 1.25));
    var shown = formatMoney(Math.round(30000 * countP));
    var ls = "-0.03em";
    var finalW = moneyWidth(ctx, "$30,000", 64, ls);
    var shownW = moneyWidth(ctx, shown, 64, ls);
    var suffix = "/ mo";
    var suffixW = measure(ctx, suffix, 20, 500);
    var gap = 16;
    var left = (W - (finalW + gap + suffixW)) / 2;
    var baseline = 340;
    highlighter(ctx, left, baseline - 36, finalW, 40, cubicOut(seg(local, 1.25, 1.7)));
    drawMoneySlots(ctx, shown, left + (finalW - shownW), baseline, 64, INK, ls);
    txt(ctx, suffix, left + finalW + gap, baseline, 20, 500, MUTED, "left", "alphabetic");

    var parts = [
      { t: "Economically", weight: 500, color: MUTED },
      { t: "active", weight: 500, color: MUTED },
      { t: "\u00b7", weight: 500, color: MUTED },
      { t: "$40,000", weight: 600, color: INK }
    ];
    var wordGap = 8;
    var widths = parts.map(function (part) {
      return measure(ctx, part.t, 24, part.weight);
    });
    var total = wordGap * (parts.length - 1);
    var i;
    for (i = 0; i < widths.length; i++) total += widths[i];
    var x = (W - total) / 2;
    for (i = 0; i < parts.length; i++) {
      var wp = cubicOut(seg(local, 0.85 + i * 0.08, 1.3 + i * 0.08));
      if (wp > 0) {
        ctx.save();
        ctx.globalAlpha = wp;
        txt(ctx, parts[i].t, x, 448 + (1 - wp) * 12, 24, parts[i].weight, parts[i].color, "left", "middle");
        ctx.restore();
      }
      x += widths[i] + wordGap;
    }
  }

function spendCopy(ctx, x, y, w, h, kicker, amount, suffix, rise, mark) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, Math.max(1, w), h);
  ctx.clip();
  if (rise > 0) {
    ctx.beginPath();
    ctx.rect(x, y, Math.max(1, w), h / 2 + 88);
    ctx.clip();
  }
  var cx = x + w / 2;
  var cy = y + h / 2 + rise;
  txt(ctx, kicker, cx, cy - 48, 20, 500, MUTED, "center", "middle");
  if (mark > 0) {
    var aw = measure(ctx, amount, 48, 600, "-0.03em");
    highlighter(ctx, cx - aw / 2, cy + 8 - 22, aw, 40, mark);
  }
  txt(ctx, amount, cx, cy + 8, 48, 600, INK, "center", "middle", "-0.03em");
  if (suffix) txt(ctx, suffix, cx, cy + 56, 20, 500, MUTED, "center", "middle");
  ctx.restore();
}

  /* #005 Mask reveal 0.5s, then #144 split screen, held for 2s. */
  function drawSpend(ctx, local) {
    var x = 96;
    var y = 140;
    var w = 1088;
    var h = 440;
    var gap = 24;
    var open = local < 0.5 ? 0 : cubicIO(seg(local, 0.5, 1));
    var half = (w - gap) / 2;
    var leftW = lerp(w, half, open);
    var rightW = lerp(0, half, open);
    var rightX = x + leftW + gap * open;
    var rise = open > 0 ? 0 : (1 - quintOut(seg(local, 0, 0.5))) * 160;
    var mark = local < 0.5 ? 0 : cubicOut(seg(local, 0.5, 0.95));

    card(ctx, x, y, leftW, h);
    spendCopy(ctx, x, y, leftW, h, "Average household spend", "$32,472", "/ mo", rise, mark);
    if (rightW > 1) {
      card(ctx, rightX, y, rightW, h);
      spendCopy(ctx, rightX, y, rightW, h, "Median spend", "$26,000", "", 0, 0);
    }
  }

  /* #004 Line draw on the bars, 0.8s ease-out. #002 Stagger on the labels, 100ms. */
function drawWhere(ctx, local) {
  var x = 148;
  var track = 968;
  var barP = cubicOut(seg(local, 0.2, 1));
  var i;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 16;
    for (i = 0; i < SPEND_ROWS.length; i++) {
      var row = SPEND_ROWS[i];
      var yLabel = 180 + i * 152;
      var yBar = yLabel + 48;
      var lp = cubicOut(seg(local, 0.08 + i * 0.1, 0.48 + i * 0.1));
      var houseMark = i === 0 ? cubicOut(seg(local, 1, 1.5)) : 0;
      if (houseMark > 0) {
        highlighter(ctx, x, yLabel - 16, measure(ctx, row.label, 24, 600), 32, houseMark);
      }
      ctx.save();
      ctx.globalAlpha = lp;
      txt(ctx, row.label, x, yLabel + (1 - lp) * 12, 24, 600, INK, "left", "middle");
      ctx.restore();
      ctx.strokeStyle = TRACK;
      ctx.beginPath();
      ctx.moveTo(x, yBar);
      ctx.lineTo(x + track, yBar);
      ctx.stroke();
      var len = track * row.share * barP;
      if (len > 0.5) {
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.moveTo(x, yBar);
        ctx.lineTo(x + len, yBar);
        ctx.stroke();
      }
      if (i === 0 && houseMark > 0.01) {
        ctx.strokeStyle = "rgba(255,255,255,0.78)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, yBar);
        ctx.lineTo(x + track * row.share * houseMark, yBar);
        ctx.stroke();
        ctx.lineWidth = 16;
      }
    }
    ctx.restore();
  }

  /* #027 Dolly in: the near line grows more than the far plate. #071 Badge settles beside it. */
  function drawScale(ctx, local) {
    var p = cubicOut(seg(local, 0, 0.85));
    var cx = W / 2;
    var cy = 292;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(lerp(1, 1.04, p), lerp(1, 1.04, p));
    card(ctx, -420, -108, 840, 216);
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy + 8);
    ctx.scale(lerp(0.86, 1, p), lerp(0.86, 1, p));
    var lead = "Avg household \u00b7 ";
    var num = "2.6";
    var tail = " people";
    var lw = measure(ctx, lead, 24, 500);
    var nw = measure(ctx, num, 64, 600, "-0.03em");
    var tw = measure(ctx, tail, 24, 600);
    var total = lw + nw + tw;
    var left = -total / 2;
    txt(ctx, lead, left, 0, 24, 500, MUTED, "left", "alphabetic");
    txt(ctx, num, left + lw, 0, 64, 600, INK, "left", "alphabetic", "-0.03em");
    txt(ctx, tail, left + lw + nw, 0, 24, 600, INK, "left", "alphabetic");
    ctx.restore();

    var bp = cubicOut(seg(local, 0.35, 0.8));
    var band = "Third-quartile spend band";
    var chip = "~$32k";
    var bandW = measure(ctx, band, 20, 500);
    var chipW = measure(ctx, chip, 16, 600) + 32;
    var rowW = bandW + 12 + chipW;
    var rowX = (W - rowW) / 2;
    var rowY = 500;
    ctx.save();
    ctx.globalAlpha = bp;
    txt(ctx, band, rowX, rowY, 20, 500, MUTED, "left", "middle");
    ctx.restore();
    ctx.save();
    ctx.translate(rowX + bandW + 12 + chipW / 2, rowY);
    ctx.globalAlpha = bp;
    ctx.scale(lerp(0.72, 1, bp), lerp(0.72, 1, bp));
    roundRect(ctx, -chipW / 2, -20, chipW, 40, 12);
    ctx.fillStyle = INK;
    ctx.fill();
    txt(ctx, chip, 0, 1, 16, 600, CARD, "center", "middle");
    ctx.restore();
  }

  /* #006 Typewriter, then #187 fade to black. */
  function drawClose(ctx, local) {
    var size = fitSteps(ctx, CLOSE_LINE, 600, [36, 30, 24], 1080, "-0.02em");
    var p = seg(local, 0, 1.15);
    var n = p >= 1 ? CLOSE_LINE.length : Math.max(1, Math.ceil(p * CLOSE_LINE.length));
    var shown = CLOSE_LINE.slice(0, n);
    var fullW = measure(ctx, CLOSE_LINE, size, 600, "-0.02em");
    var x = (W - fullW) / 2;
    var y = 300;
    txt(ctx, shown, x, y, size, 600, INK, "left", "middle", "-0.02em");
    if (n < CLOSE_LINE.length) {
      var shownW = measure(ctx, shown, size, 600, "-0.02em");
      ctx.fillStyle = INK;
      ctx.fillRect(x + shownW + 4, y - size * 0.38, 2, size * 0.76);
    }

    var srcA = cubicOut(seg(local, 0.12, 0.48));
    ctx.save();
    ctx.globalAlpha = srcA;
    txt(ctx, SOURCE_LINES[0], W / 2, 372, 16, 500, MUTED, "center", "middle");
    txt(ctx, SOURCE_LINES[1], W / 2, 396, 16, 500, MUTED, "center", "middle");
    ctx.restore();
  }

  function drawSubtitles(ctx, beat) {
    var enSize = fitSteps(ctx, beat.en, 600, [18, 16, 14], 1120, "0px");
    var yueSize = fitSteps(ctx, beat.yue, 500, [16, 14], 1120, "0px", FONT_YUE);
    ctx.fillStyle = PAGE;
    ctx.fillRect(0, 624, W, 96);
    ctx.fillStyle = LINE;
    ctx.fillRect(64, 624, W - 128, 1);
    txt(ctx, beat.en, W / 2, 656, enSize, 600, INK, "center", "middle");
    txt(ctx, beat.yue, W / 2, 686, yueSize, 500, MUTED, "center", "middle", "0px", FONT_YUE);
  }

  function fadeAmount(time) {
    if (time < 14) return 0;
    return quadIO(seg(time - 14, 1.45, 2));
  }

  function paintScene(c, time) {
    var shown = clamp(time, 0, DURATION);
    var beat = beatAt(Math.min(shown, DURATION - 0.0001));
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.lineCap = "butt";
    c.lineJoin = "miter";
    c.fillStyle = PAGE;
    c.fillRect(0, 0, W, H);
    DRAW[beat.id](c, shown);
    drawSubtitles(c, beat);
    var fade = fadeAmount(shown);
    if (fade > 0) {
      c.save();
      c.globalAlpha = fade;
      c.fillStyle = INK;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
  }

  function activeTransition(time) {
    var i;
    for (i = 0; i < CUTS.length; i++) {
      var cut = CUTS[i];
      if (time >= cut.t0 && time < cut.t0 + cut.dur) {
        return {
          id: cut.id,
          p: (time - cut.t0) / cut.dur,
          outTime: cut.t0 - 0.001,
          inTime: time
        };
      }
    }
    return null;
  }

  /* #017 Mask transition: the next scene opens inside a growing circle. */
  function compositeMask(main, a, b, p) {
    var e = cubicIO(p);
    var radius = lerp(0, 820, e);
    main.drawImage(a, 0, 0, W, H);
    if (e <= 0) return;
    main.save();
    main.beginPath();
    main.arc(W / 2, H / 2 - 24, radius, 0, Math.PI * 2);
    main.clip();
    main.drawImage(b, 0, 0, W, H);
    main.restore();
    if (e < 0.995) {
      main.beginPath();
      main.arc(W / 2, H / 2 - 24, radius, 0, Math.PI * 2);
      main.strokeStyle = CARD;
      main.lineWidth = 3;
      main.stroke();
    }
  }

  /* #018 Shape transition: bands cover the frame, then leave on the next scene. */
  function compositeShape(main, a, b, p) {
    var cover = cubicIO(clamp(p / 0.5, 0, 1));
    var reveal = cubicIO(clamp((p - 0.5) / 0.5, 0, 1));
    main.drawImage(reveal > 0 ? b : a, 0, 0, W, H);
    var colors = [INK, "rgba(28,28,34,0.72)", MUTED, "rgba(28,28,34,0.42)"];
    var n = 4;
    var i;
    for (i = 0; i < n; i++) {
      var delay = i * 0.1;
      var enter = cubicIO(clamp((cover - delay) / 0.7, 0, 1));
      var leave = cubicIO(clamp((reveal - delay) / 0.7, 0, 1));
      if (enter <= 0 || leave >= 1) continue;
      var bh = H / n + 16;
      var y = i * (H / n) - 8;
      var span = W + 160;
      var xa = -100 + leave * span;
      var xb = -100 + enter * span;
      var skew = 36;
      main.fillStyle = colors[i];
      main.beginPath();
      main.moveTo(xa + skew, y);
      main.lineTo(xb + skew, y);
      main.lineTo(xb, y + bh);
      main.lineTo(xa, y + bh);
      main.closePath();
      main.fill();
    }
  }

  /* #137 Push transition: the next scene pushes the current one off. */
  function compositePush(main, a, b, p) {
    var e = cubicIO(p);
    main.save();
    main.beginPath();
    main.rect(0, 0, W, H);
    main.clip();
    main.drawImage(a, -e * W, 0, W, H);
    main.drawImage(b, (1 - e) * W, 0, W, H);
    main.fillStyle = INK;
    main.fillRect((1 - e) * W - 2, 0, 4, H);
    main.restore();
  }

  /* #020 Zoom through: the frame moves into the picture and the next scene arrives inside it. */
  function compositeZoom(main, a, b, p) {
    var e = cubicIO(p);
    if (e >= 0.995) {
      main.drawImage(b, 0, 0, W, H);
      return;
    }
    var zoom = lerp(1, 2.2, e);
    main.save();
    main.translate(W / 2, H / 2);
    main.scale(zoom, zoom);
    main.translate(-W / 2, -H / 2);
    main.drawImage(a, 0, 0, W, H);
    main.restore();
    var radius = lerp(0, 860, e);
    var inner = lerp(0.62, 1, e);
    main.save();
    main.beginPath();
    main.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
    main.clip();
    main.translate(W / 2, H / 2);
    main.scale(inner, inner);
    main.translate(-W / 2, -H / 2);
    main.drawImage(b, 0, 0, W, H);
    main.restore();
  }

  /* #044 Cross dissolve: one shot blends into the next. */
  function compositeDissolve(main, a, b, p) {
    var e = quadIO(p);
    main.drawImage(a, 0, 0, W, H);
    main.save();
    main.globalAlpha = e;
    main.drawImage(b, 0, 0, W, H);
    main.restore();
  }

  var COMPOSITE = {
    "017": compositeMask,
    "018": compositeShape,
    "137": compositePush,
    "020": compositeZoom,
    "044": compositeDissolve
  };

  var DRAW = {
    hook: function (ctx, t) { drawHook(ctx, t); },
    income: function (ctx, t) { drawIncome(ctx, t - 2); },
    spend: function (ctx, t) { drawSpend(ctx, t - 5); },
    where: function (ctx, t) { drawWhere(ctx, t - 8); },
    scale: function (ctx, t) { drawScale(ctx, t - 12); },
    close: function (ctx, t) { drawClose(ctx, t - 14); }
  };

  function packsOk() {
    if (!window.MotionPrompt || !MotionPrompt.packs) return false;
    var ids = Object.keys(EFFECTS);
    var i;
    for (i = 0; i < ids.length; i++) {
      var spec = EFFECTS[ids[i]];
      var pack = MotionPrompt.packs[spec.pack];
      if (!pack || typeof pack.cells[spec.index] !== "function") return false;
    }
    return true;
  }

  if (document.documentElement.getAttribute("data-motion") === "reduce") {
    window.__hkSpend = { reduced: true, duration: DURATION, beats: BEATS, packsOk: packsOk };
    return;
  }

  var canvas = document.getElementById("stage");
  var frame = document.getElementById("frame");
  var wrap = document.getElementById("stage-wrap");
  var beatsNav = document.getElementById("beats");
  var playBtn = document.getElementById("play");
  var scrub = document.getElementById("scrub");
  var clockEl = document.getElementById("clock");
  var beatName = document.getElementById("beat-name");
  var effectName = document.getElementById("effect-name");
  var live = document.getElementById("live");
  var ctx = canvas.getContext("2d", { alpha: false });
  var bufA = document.createElement("canvas");
  var bufB = document.createElement("canvas");
  bufA.width = W;
  bufA.height = H;
  bufB.width = W;
  bufB.height = H;
  var ctxA = bufA.getContext("2d", { alpha: false });
  var ctxB = bufB.getContext("2d", { alpha: false });
  var view = { sx: 1, sy: 1 };
  var t = 0;
  var playing = true;
  var dragging = false;
  var resumeAfter = false;
  var lastNow = 0;
  var lastBeat = "";
  var beatButtons = [];

  function layout() {
    if (!wrap || !frame) return;
    var cs = getComputedStyle(wrap);
    var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var availW = wrap.clientWidth - padX;
    var availH = wrap.clientHeight - padY;
    if (availW < 8 || availH < 8) return;
    var fw = availW;
    var fh = fw * 9 / 16;
    if (fh > availH) {
      fh = availH;
      fw = fh * 16 / 9;
    }
    fw = Math.max(1, Math.floor(fw));
    fh = Math.max(1, Math.floor(fh));
    frame.style.width = fw + "px";
    frame.style.height = fh + "px";
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var bufW = Math.max(1, Math.round(fw * dpr));
    var bufH = Math.max(1, Math.round(fh * dpr));
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }
    view.sx = canvas.width / W;
    view.sy = canvas.height / H;
  }

function render() {
    var beat = beatAt(Math.min(t, DURATION - 0.0001));
    var cut = activeTransition(t);
    var ids = beat.effects.slice();
    paintScene(ctxA, cut ? cut.outTime : t);
    ctx.setTransform(view.sx, 0, 0, view.sy, 0, 0);
    ctx.globalAlpha = 1;
    if (!cut) {
      ctx.drawImage(bufA, 0, 0, W, H);
    } else {
      paintScene(ctxB, cut.inTime);
      COMPOSITE[cut.id](ctx, bufA, bufB, cut.p);
      ids = [cut.id].concat(ids);
    }
    canvas.setAttribute("data-beat", beat.id);
    canvas.setAttribute("data-effects", ids.join(" "));
    canvas.setAttribute("data-cut", cut ? cut.id : "");
    canvas.setAttribute("data-time", t.toFixed(3));
  }

  function paintTransport() {
    var ended = t >= DURATION - 0.001 && !playing;
    var label = ended ? "Replay" : playing ? "Pause" : "Play";
    playBtn.textContent = label;
    playBtn.setAttribute("aria-label", ended ? "Replay the film" : playing ? "Pause the film" : "Play the film");
    playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (!dragging) scrub.value = String(Math.round(t * 100) / 100);
    var beat = beatAt(Math.min(t, DURATION - 0.001));
    var cut = activeTransition(t);
    var shownEffects = cut ? [cut.id].concat(beat.effects) : beat.effects;
    clockEl.textContent = clock(t) + " / 0:16";
    beatName.textContent = beat.label;
    effectName.textContent = effectLine(shownEffects);
    scrub.setAttribute("aria-valuetext", clock(t) + ", " + beat.label + ". " + beat.live);
    scrub.setAttribute("aria-valuenow", String(Math.round(t * 100) / 100));
    var i;
    for (i = 0; i < beatButtons.length; i++) {
      var on = beatButtons[i].beat.id === beat.id;
      if (on) beatButtons[i].el.setAttribute("aria-current", "true");
      else beatButtons[i].el.removeAttribute("aria-current");
    }
    if (beat.id !== lastBeat) {
      lastBeat = beat.id;
      live.textContent = beat.label + ". " + beat.live;
    }
  }

  function seek(n, pauseUser) {
    t = clamp(n, 0, DURATION);
    if (pauseUser) playing = false;
    if (t >= DURATION) playing = false;
    render();
    paintTransport();
  }

  function toggle() {
    if (t >= DURATION - 0.001) {
      t = 0;
      playing = true;
    } else {
      playing = !playing;
    }
    render();
    paintTransport();
  }

  BEATS.forEach(function (beat) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "beat";
    btn.textContent = clock(beat.t0).slice(0, 4) + " " + beat.label;
    btn.setAttribute(
      "aria-label",
      beat.label + ", " + clock(beat.t0).slice(0, 4) + " to " + clock(beat.t1).slice(0, 4) + ", " + effectLine(beat.effects)
    );
    btn.addEventListener("click", function () {
      seek(beat.t0, true);
    });
    beatsNav.appendChild(btn);
    beatButtons.push({ el: btn, beat: beat });
  });

  playBtn.addEventListener("click", toggle);
  scrub.addEventListener("pointerdown", function () {
    dragging = true;
    resumeAfter = playing;
    playing = false;
  });
  window.addEventListener("pointerup", function () {
    if (!dragging) return;
    dragging = false;
    if (resumeAfter && t < DURATION) playing = true;
    paintTransport();
  });
  scrub.addEventListener("input", function () {
    t = clamp(Number(scrub.value), 0, DURATION);
    if (t >= DURATION) playing = false;
    render();
    paintTransport();
  });

  document.addEventListener("keydown", function (event) {
    var tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || tag === "SELECT") return;
    if (event.code === "Space") {
      event.preventDefault();
      toggle();
    } else if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
      event.preventDefault();
      var was = playing;
      var next = t + (event.code === "ArrowRight" ? 0.5 : -0.5);
      t = clamp(next, 0, DURATION);
      if (t >= DURATION) playing = false;
      else playing = was;
      render();
      paintTransport();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) playing = false;
    paintTransport();
  });

  try {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function () {
      var q = location.search || "";
      if (/(?:^|[?&])motion=1(?:&|$)/.test(q) || /(?:^|[?&])reduce=1(?:&|$)/.test(q)) return;
      location.reload();
    });
  } catch (err) {}

  var params = new URLSearchParams(location.search);
  var t0 = params.get("t");
  if (t0 != null && t0 !== "" && !isNaN(parseFloat(t0))) {
    t = clamp(parseFloat(t0), 0, DURATION);
    playing = false;
  }

  layout();
  render();
  paintTransport();
  lastNow = performance.now();

  function tick(now) {
    if (playing && !document.hidden) {
      var dt = Math.min(0.05, (now - lastNow) / 1000);
      t += dt;
      if (t >= DURATION) {
        t = DURATION;
        playing = false;
      }
    }
    lastNow = now;
    render();
    paintTransport();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  window.addEventListener("resize", function () {
    layout();
    render();
  });
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(function () {
      layout();
      render();
    });
    observer.observe(wrap);
  }

  var ok = packsOk();
  if (!ok) console.warn("Motion Prompt packs did not register the film's effect ids.");
  canvas.setAttribute("data-packs", ok ? "ok" : "missing");

  window.__hkSpend = {
    reduced: false,
    duration: DURATION,
    beats: BEATS,
    packsOk: packsOk,
    time: function () { return t; },
    seek: function (n) { seek(n, true); },
    play: function () { playing = true; paintTransport(); },
    pause: function () { playing = false; paintTransport(); },
    beatId: function () { return beatAt(Math.min(t, DURATION - 0.001)).id; },
    playing: function () { return playing; }
  };
})();

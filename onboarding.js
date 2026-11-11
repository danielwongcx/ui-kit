/* Playable Letterly-style onboarding. Springs for births and touches; ease-out everywhere else. */
(function () {
  "use strict";

  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";
  var ORDER = ["welcome", "name", "role", "week", "crew", "task", "tools", "nudge", "paywall", "allset"];
  var TILE_COLORS = ["#ff8a24", "#ffc83a", "#ff5b9a", "#2ec6d0", "#3dcb6c", "#7b6cff", "#3b6cff", "#ff6a3d"];
  var TILTS = [-7, 6, -4, 8, -5, 4, -8, 5, -3, 7, -6, 3];
  var PREMIUM = [
    { ch: "P", color: "#ff4d93" },
    { ch: "R", color: "#ff8a24" },
    { ch: "E", color: "#ffc83a" },
    { ch: "M", color: "#3dcb6c" },
    { ch: "I", color: "#2ec6d0" },
    { ch: "U", color: "#7eb6ff" },
    { ch: "M", color: "#b9a6ff" }
  ];
  var ROLES = [
    { id: "product", label: "Product", icon: "cube" },
    { id: "design", label: "Design", icon: "pencil" },
    { id: "engineering", label: "Engineering", icon: "code" },
    { id: "marketing", label: "Marketing", icon: "mega" },
    { id: "sales", label: "Sales", icon: "trend" },
    { id: "operations", label: "Operations", icon: "nodes" },
    { id: "founder", label: "Founder", icon: "flag" },
    { id: "other", label: "Other", icon: "dots" }
  ];
  var NAMES = { gigi: "Gigi", olo: "Olo", pip: "Pip", quinn: "Quinn", dex: "Dex", bo: "Bo" };
  var STOCK = "Tell the client we need two more days for the logo files.";
  var BEZEL = "0 0 0 11px #1c1c1e, 0 0 0 13px #3a3a3e, 0 28px 64px rgba(40,30,20,0.16)";

  var state = {
    step: "welcome",
    name: "",
    role: 1,
    awake: { gigi: true, olo: true, pip: true, quinn: false, dex: false, bo: false },
    taskPhase: "edit",
    userText: "",
    variant: "default",
    calendar: false,
    tools: { chat: false, files: false, notes: false },
    plan: "yearly",
    remind: true,
    framed: true,
    crewIndex: 0
  };

  var run = 0;
  var busyUntil = 0;
  var autoToken = 0;
  var tileToken = 0;
  var autotyping = false;
  var prevLen = 0;
  var scroll = 1;
  var dragging = false;
  var wheelMoved = false;
  var wheelRaf = 0;
  var kenTween = null;
  var introTween = null;
  var settleTimer = 0;
  var snapTimer = 0;
  var carX = 0;
  var carDrag = false;
  var carMoved = false;
  var carRaf = 0;
  var toastTimer = 0;
  var sheetReturn = null;
  var particles = [];
  var confettiOn = false;
  var lastC = 0;
  var connecting = false;

  var stage = document.getElementById("stage");
  var screen = document.getElementById("screen");
  var island = document.getElementById("island");
  var adaRow = document.getElementById("adaRow");
  var avatar = document.getElementById("avatar");
  var bubble = document.getElementById("bubble");
  var bubbleText = document.getElementById("bubbleText");
  var pill = document.getElementById("pill");
  var pillLabel = document.getElementById("pillLabel");
  var quiet = document.getElementById("quiet");
  var fine = document.getElementById("fine");
  var live = document.getElementById("live");
  var hello = document.getElementById("hello");
  var nameInput = document.getElementById("nameInput");
  var tilesEl = document.getElementById("tiles");
  var wheel = document.getElementById("wheel");
  var awakeNum = document.getElementById("awakeNum");
  var carousel = document.getElementById("carousel");
  var track = document.getElementById("track");
  var dots = document.getElementById("dots");
  var taskInput = document.getElementById("taskInput");
  var composer = document.getElementById("composer");
  var thread = document.getElementById("thread");
  var ububble = document.getElementById("ububble");
  var userLine = document.getElementById("userLine");
  var ticks = document.getElementById("ticks");
  var gigiTyping = document.getElementById("gigiTyping");
  var draft = document.getElementById("draft");
  var draftSubject = document.getElementById("draftSubject");
  var draftBody = document.getElementById("draftBody");
  var chips = document.getElementById("chips");
  var doneBanner = document.getElementById("doneBanner");
  var dim = document.getElementById("dim");
  var sheet = document.getElementById("sheet");
  var toast = document.getElementById("toast");
  var toastText = document.getElementById("toastText");
  var bell = document.getElementById("bell");
  var canvas = document.getElementById("confetti");
  var premiumRow = document.getElementById("premiumRow");
  var freeBadge = document.getElementById("freeBadge");
  var panels = {};
  ORDER.forEach(function (id) { panels[id] = document.getElementById("panel-" + id); });

  function dur(ms) { return reduce ? Math.min(100, ms) : ms; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function displayName() {
    var n = (state.name || (nameInput && nameInput.value) || "").trim();
    return n || "Ritu";
  }
  function shownChar(ch) {
    return /[a-z]/.test(ch) ? ch.toUpperCase() : ch;
  }
  function lock(ms) { busyUntil = Math.max(busyUntil, Date.now() + ms); }
  function isBusy() { return Date.now() < busyUntil; }
  function fullRadius() {
    return window.matchMedia("(max-width: 520px)").matches ? 0 : 32;
  }

  function faceHTML(mood) {
    return '<span class="face face-' + mood + '" aria-hidden="true"><span class="eyes"><i></i><i></i></span><i class="mouth"></i></span>';
  }
  function paintGlyph(el) {
    if (!el || !el.dataset) return;
    var mood = el.dataset.mood || "happy";
    var ch = el.dataset.ch || "a";
    el.innerHTML = '<span class="ch">' + escapeHtml(ch) + "</span>" + faceHTML(mood);
    el.classList.toggle("is-asleep", mood === "sleep");
    el.setAttribute("aria-hidden", "true");
  }
  function paintAll() {
    document.querySelectorAll(".glyph[data-ch]").forEach(paintGlyph);
  }

  function springTo(el, toVars, fromVars) {
    if (!el) return;
    if (reduce) { gsap.set(el, toVars); return; }
    var token = (el._sp || 0) + 1;
    el._sp = token;
    var keys = Object.keys(toVars);
    var from = {};
    keys.forEach(function (k) {
      from[k] = fromVars && fromVars[k] != null ? fromVars[k] : 0;
    });
    var p = 0;
    var v = 0;
    var stiff = 360;
    var damp = 17;
    var mass = 0.7;
    var last = performance.now();
    function frame(now) {
      if (el._sp !== token || !el.isConnected) return;
      var dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      v += ((-stiff * (p - 1)) - damp * v) / mass * dt;
      p += v * dt;
      var vars = {};
      keys.forEach(function (key) {
        vars[key] = from[key] + (toVars[key] - from[key]) * p;
      });
      gsap.set(el, vars);
      if (Math.abs(p - 1) < 0.004 && Math.abs(v) < 0.025) {
        gsap.set(el, toVars);
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function luminance(btn) {
    var bg = getComputedStyle(btn).backgroundColor || "";
    var m = bg.match(/[\d.]+/g);
    if (!m || m.length < 3) return 0;
    return (0.2126 * Number(m[0]) + 0.7152 * Number(m[1]) + 0.0722 * Number(m[2])) / 255;
  }

  function ink(btn, ev) {
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    if (!rect.width) return;
    var x = ev && ev.clientX != null ? ev.clientX - rect.left : rect.width / 2;
    var y = ev && ev.clientY != null ? ev.clientY - rect.top : rect.height / 2;
    var spot = document.createElement("span");
    spot.className = "ink " + (luminance(btn) > 0.62 ? "is-dark" : "is-light");
    spot.style.left = x + "px";
    spot.style.top = y + "px";
    btn.appendChild(spot);
    spot.addEventListener("animationend", function () { spot.remove(); });
    if (reduce) return;
    btn.querySelectorAll(".pill-label .ch, .ch").forEach(function (ch) {
      if (!btn.contains(ch) || ch.closest(".glyph")) return;
      var cr = ch.getBoundingClientRect();
      var dist = Math.abs(cr.left + cr.width / 2 - rect.left - x);
      ch.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0.2, transform: "translateY(-3px)", offset: 0.45 },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 420, delay: dist * 0.35, easing: "ease-out" }
      );
    });
  }

  function burst(opts) {
    if (reduce) return;
    opts = opts || {};
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = screen.clientWidth;
    var h = screen.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var colors = ["#ff5b9a", "#ffc83a", "#3dcb6c", "#3b6cff", "#ff8a24", "#7b6cff", "#2ec6d0", "#ff6a4a"];
    var n = opts.n || 76;
    var ox = w * (opts.x == null ? 0.5 : opts.x);
    var oy = h * (opts.y == null ? 0.55 : opts.y);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = 160 + Math.random() * 480;
      particles.push({
        x: ox + (Math.random() - 0.5) * 24,
        y: oy,
        vx: Math.cos(a) * s * (0.35 + Math.random() * 0.7),
        vy: Math.sin(a) * s * 0.35 - 260 - Math.random() * 220,
        w: 4 + Math.random() * 5,
        h: 7 + Math.random() * 7,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 9,
        color: colors[i % colors.length],
        life: 1.45 + Math.random() * 0.7,
        age: 0
      });
    }
    if (!confettiOn) {
      confettiOn = true;
      lastC = 0;
      requestAnimationFrame(tickConfetti);
    }
  }
  function tickConfetti(now) {
    if (!lastC) lastC = now;
    var dt = Math.min(0.033, (now - lastC) / 1000);
    lastC = now;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, screen.clientWidth, screen.clientHeight);
    particles.forEach(function (p) {
      p.age += dt;
      p.vy += 980 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.992;
      p.rot += p.vr * dt;
      var fade = Math.max(0, 1 - p.age / p.life);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    particles = particles.filter(function (p) { return p.age < p.life && p.y < screen.clientHeight + 40; });
    if (particles.length) requestAnimationFrame(tickConfetti);
    else {
      confettiOn = false;
      lastC = 0;
      ctx.clearRect(0, 0, screen.clientWidth, screen.clientHeight);
    }
  }

  function icon(name) {
    var common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    var paths = {
      cube: '<svg ' + common + '><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
      pencil: '<svg ' + common + '><path d="M4 20l1.2-4.2L16.4 4.6a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8.2 18.8z"/><path d="M13.8 6.2l4 4"/></svg>',
      mega: '<svg ' + common + '><path d="M5 10v4a2 2 0 0 0 2 2h1l4 4V6L8 8H7a2 2 0 0 0-2 2z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path d="M8 16.2c.4 1.6 1.2 2.8 2.4 2.8"/></svg>',
      trend: '<svg ' + common + '><path d="M4 16l5-5 3.2 3.2L20 7"/><path d="M14 7h6v6"/></svg>',
      nodes: '<svg ' + common + '><circle cx="12" cy="12" r="2.2"/><circle cx="6" cy="7" r="1.6"/><circle cx="18" cy="7" r="1.6"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/><path d="M7.4 8.2l3 2.4M16.6 8.2l-3 2.4M8.2 16.2l2.4-2.2M15.8 16.2l-2.4-2.2"/></svg>',
      flag: '<svg ' + common + '><path d="M6 20V4"/><path d="M6 5h11l-2 3.2L17 12H6"/></svg>',
      dots: '<svg ' + common + '><circle cx="7" cy="8" r="1.3" fill="currentColor"/><circle cx="12" cy="8" r="1.3" fill="currentColor"/><circle cx="17" cy="8" r="1.3" fill="currentColor"/><circle cx="7" cy="14" r="1.3" fill="currentColor"/><circle cx="12" cy="14" r="1.3" fill="currentColor"/><circle cx="17" cy="14" r="1.3" fill="currentColor"/></svg>'
    };
    return paths[name] || "";
  }

  function buildWheel() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "arc");
    svg.setAttribute("viewBox", "0 0 100 320");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M62 10 Q 98 160 62 310");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#c5c8d4");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-dasharray", "1.2 7");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    wheel.appendChild(svg);
    var tick = document.createElement("div");
    tick.className = "tick";
    tick.setAttribute("aria-hidden", "true");
    wheel.appendChild(tick);
    ROLES.forEach(function (role, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wheel-item";
      btn.setAttribute("role", "option");
      btn.dataset.i = String(i);
      btn.innerHTML = '<span class="wl">' + role.label + '</span><span class="wi">' +
        (role.icon === "code" ? '<span class="code-ico">&lt;/&gt;</span>' : icon(role.icon)) +
        "</span>";
      btn.addEventListener("click", function () {
        if (wheelMoved) return;
        snapTo(i, true);
      });
      wheel.appendChild(btn);
    });
    layoutWheel();
  }

  function wheelItems() {
    return Array.prototype.slice.call(wheel.querySelectorAll(".wheel-item"));
  }
  function layoutWheel() {
    wheelItems().forEach(function (el, i) {
      var d = i - scroll;
      var ad = Math.abs(d);
      var y = d * 58;
      var x = -16 * d * d;
      var scale = Math.max(0.7, 1 - ad * 0.12);
      var opacity = Math.max(0.12, 1 - ad * 0.3);
      el.style.transform = "translate(" + x + "px, calc(-50% + " + y + "px)) scale(" + scale + ")";
      el.style.opacity = String(opacity);
      var on = ad < 0.45;
      el.classList.toggle("is-focus", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
  }
  function snapTo(index, fromClick) {
    var target = clamp(Math.round(index), 0, ROLES.length - 1);
    var start = scroll;
    var t0 = performance.now();
    var ms = dur(320);
    cancelAnimationFrame(wheelRaf);
    function tick(now) {
      var p = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      scroll = start + (target - start) * e;
      layoutWheel();
      if (p < 1) wheelRaf = requestAnimationFrame(tick);
      else onWheelSettled();
    }
    if (Math.abs(start - target) < 0.001) onWheelSettled();
    else wheelRaf = requestAnimationFrame(tick);
    if (fromClick) wheelMoved = false;
  }
  function onWheelSettled() {
    state.role = clamp(Math.round(scroll), 0, ROLES.length - 1);
    clearTimeout(settleTimer);
    if (state.step !== "role") return;
    settleTimer = setTimeout(function () {
      if (state.step !== "role") return;
      if (Math.abs(scroll - state.role) > 0.08) return;
      setAda("type");
    }, dur(700));
  }
  function bindWheel() {
    var lastY = 0;
    var lastT = 0;
    var vel = 0;
    function down(e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      wheelMoved = false;
      lastY = e.clientY;
      lastT = performance.now();
      vel = 0;
      cancelAnimationFrame(wheelRaf);
      clearTimeout(settleTimer);
      clearTimeout(snapTimer);
      if (bubble.classList.contains("is-typing") && state.step === "role") setAda("talk", roleLine());
      wheel.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!dragging) return;
      var y = e.clientY;
      var t = performance.now();
      var dy = y - lastY;
      var dt = Math.max(8, t - lastT);
      if (Math.abs(dy) > 3) wheelMoved = true;
      scroll = clamp(scroll - dy / 64, 0, ROLES.length - 1);
      vel = (-dy / 64) / dt;
      lastY = y;
      lastT = t;
      layoutWheel();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      var v = vel;
      function coast() {
        v *= 0.9;
        scroll = clamp(scroll + v * 16.7, 0, ROLES.length - 1);
        layoutWheel();
        if (Math.abs(v) < 0.00035) snapTo(scroll);
        else wheelRaf = requestAnimationFrame(coast);
      }
      cancelAnimationFrame(wheelRaf);
      if (reduce || Math.abs(v) < 0.0008) snapTo(scroll);
      else wheelRaf = requestAnimationFrame(coast);
    }
    wheel.addEventListener("pointerdown", down);
    wheel.addEventListener("pointermove", move);
    wheel.addEventListener("pointerup", up);
    wheel.addEventListener("pointercancel", up);
    wheel.addEventListener("wheel", function (e) {
      e.preventDefault();
      scroll = clamp(scroll + e.deltaY / 220, 0, ROLES.length - 1);
      layoutWheel();
      clearTimeout(snapTimer);
      clearTimeout(settleTimer);
      if (bubble.classList.contains("is-typing")) setAda("talk", roleLine());
      snapTimer = setTimeout(function () { snapTo(scroll); }, 140);
    }, { passive: false });
    wheel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); snapTo(state.role + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); snapTo(state.role - 1); }
      else if (e.key === "Home") { e.preventDefault(); snapTo(0); }
      else if (e.key === "End") { e.preventDefault(); snapTo(ROLES.length - 1); }
    });
  }

  function roleLine() {
    return "Lovely to meet you, " + displayName() + "! Tell me about your work.";
  }

  function setAda(mode, text) {
    adaRow.classList.add("is-on");
    adaRow.setAttribute("aria-hidden", "false");
    var mood = mode === "type" ? "line" : "happy";
    avatar.dataset.mood = mood;
    paintGlyph(avatar);
    avatar.classList.toggle("is-glance", mode === "type");
    bubble.classList.toggle("is-typing", mode === "type");
    if (mode === "talk") {
      bubbleText.textContent = text || "";
      live.textContent = "Ada: " + (text || "");
    }
  }
  function hideAda() {
    adaRow.classList.remove("is-on");
    adaRow.setAttribute("aria-hidden", "true");
  }
  function adaTypingThen(token, text, ms) {
    setAda("type");
    wait(dur(ms)).then(function () {
      if (token !== run) return;
      setAda("talk", text);
    });
  }

  function setPill(label, opts) {
    opts = opts || {};
    pill.classList.toggle("is-muted", !!opts.muted);
    pill.classList.toggle("is-blue", !!opts.blue);
    pill.classList.toggle("has-arrow", !!opts.arrow);
    pillLabel.innerHTML = Array.from(label).map(function (ch) {
      return '<span class="ch">' + (ch === " " ? "&nbsp;" : escapeHtml(ch)) + "</span>";
    }).join("");
    pill.setAttribute("aria-label", label);
    pillLabel.setAttribute("aria-hidden", "true");
    if (!reduce) {
      gsap.fromTo(pillLabel, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
    }
    if (opts.quiet) {
      quiet.hidden = false;
      quiet.textContent = opts.quiet;
    } else quiet.hidden = true;
    if (opts.fine) {
      fine.hidden = false;
      fine.textContent = opts.fine;
    } else fine.hidden = true;
  }
  var pillRose = false;
  function updateNamePill(rise) {
    if (state.step !== "name") return;
    var has = nameInput.value.trim().length > 0;
    setPill(has ? "Continue" : "Type your name", { muted: !has });
    if (has && rise && !pillRose && !reduce) {
      pillRose = true;
      gsap.fromTo(pill, { y: 18 }, { y: 0, duration: 0.32, ease: "power2.out" });
    }
    if (!has) pillRose = false;
  }
  function updateDock(step) {
    if (step === "welcome") setPill("Meet the crew", { arrow: true });
    else if (step === "name") updateNamePill(false);
    else if (step === "role") setPill("Continue");
    else if (step === "week") setPill("Meet my crew");
    else if (step === "crew") setPill("See them in action");
    else if (step === "task") setPill("Nice, keep going");
    else if (step === "tools") setPill("Continue", { quiet: "I'll do this later" });
    else if (step === "nudge") setPill("Turn on nudges", { quiet: "Not now" });
    else if (step === "paywall") setPill("Start 7-day free trial", { blue: true, fine: "₹0 today. Cancel anytime in Settings." });
    else     if (step === "allset") setPill("Start working");
    if (step !== "task") doneBanner.hidden = true;
  }
  function chromeFor(step) {
    if (step === "welcome") return "welcome";
    if (step === "paywall") return "paywall";
    if (step === "allset") return "allset";
    return "flow";
  }
  function applyChrome(step) {
    var mode = chromeFor(step);
    screen.dataset.chrome = mode;
    document.querySelectorAll(".chrome-mode").forEach(function (el) {
      el.setAttribute("aria-hidden", el.classList.contains("chrome-" + mode) ? "false" : "true");
    });
  }

  function charsOf(value) {
    return Array.from(value).filter(function (c) { return /\S/.test(c); }).slice(0, 16).map(shownChar);
  }
  function tileNodes() {
    return Array.prototype.filter.call(tilesEl.querySelectorAll(".tile-move"), function (el) {
      return !el.dataset.ghost;
    });
  }
  function currentChars() {
    return tileNodes().map(function (el) { return el.dataset.ch; });
  }
  function birthTile(inner, index) {
    var tilt = TILTS[index % TILTS.length];
    springTo(inner, { scale: 1, rotation: tilt }, { scale: reduce ? 1 : 0.35, rotation: tilt - 18 });
  }
  function addTile(ch, index) {
    var first = tileNodes().map(function (el) {
      return { el: el, r: el.getBoundingClientRect() };
    });
    var move = document.createElement("span");
    move.className = "tile-move";
    move.dataset.ch = ch;
    var tile = document.createElement("span");
    tile.className = "tile";
    tile.style.background = TILE_COLORS[index % TILE_COLORS.length];
    tile.innerHTML = '<span class="ch">' + escapeHtml(ch) + "</span>" + faceHTML("happy");
    move.appendChild(tile);
    tilesEl.appendChild(move);
    first.forEach(function (item) {
      var nr = item.el.getBoundingClientRect();
      var dx = item.r.left - nr.left;
      var dy = item.r.top - nr.top;
      if (reduce || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) return;
      gsap.fromTo(item.el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.26, ease: "power2.out" });
    });
    birthTile(tile, index);
  }
  function removeTile(move) {
    var first = tileNodes().map(function (el) {
      return { el: el, r: el.getBoundingClientRect() };
    });
    var rect = move.getBoundingClientRect();
    var parent = tilesEl.getBoundingClientRect();
    move.remove();
    first.forEach(function (item) {
      if (!item.el.isConnected) return;
      var nr = item.el.getBoundingClientRect();
      var dx = item.r.left - nr.left;
      var dy = item.r.top - nr.top;
      if (reduce || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) return;
      gsap.fromTo(item.el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.26, ease: "power2.out" });
    });
    if (reduce) return;
    move.dataset.ghost = "1";
    move.style.position = "absolute";
    move.style.left = (rect.left - parent.left) + "px";
    move.style.top = (rect.top - parent.top) + "px";
    tilesEl.appendChild(move);
    gsap.to(move, { scale: 0.4, opacity: 0, duration: 0.2, onComplete: function () { move.remove(); } });
  }
  function syncTiles(value, staggerMs) {
    var token = ++tileToken;
    var chars = charsOf(value);
    var have = currentChars();
    var i = 0;
    while (i < have.length && i < chars.length && have[i] === chars[i]) i++;
    var nodes = tileNodes();
    for (var j = nodes.length - 1; j >= i; j--) {
      if (nodes[j].style.position === "absolute") nodes[j].remove();
      else removeTile(nodes[j]);
    }
    var expected = value;
    chars.slice(i).forEach(function (ch, k) {
      var delay = (staggerMs || 0) * k;
      setTimeout(function () {
        if (token !== tileToken) return;
        if (nameInput.value !== expected && staggerMs) return;
        addTile(ch, i + k);
      }, delay);
    });
  }
  function exitTiles() {
    Array.prototype.forEach.call(tilesEl.children, function (move) {
      gsap.to(move, { y: -78, scale: 0.7, opacity: 0, duration: dur(350) / 1000, ease: "power2.out" });
    });
  }
  function resetTiles(staggerMs) {
    gsap.killTweensOf(tilesEl.querySelectorAll(".tile-move, .tile"));
    tilesEl.innerHTML = "";
    tileToken++;
    syncTiles(nameInput.value, staggerMs || 0);
  }

  function awakeCount() {
    return ["gigi", "olo", "pip", "quinn", "dex"].filter(function (id) { return state.awake[id]; }).length;
  }
  function setCount(n) {
    if (awakeNum.textContent === String(n)) return;
    awakeNum.textContent = String(n);
    if (!reduce) gsap.fromTo(awakeNum, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" });
  }
  function syncRow(id) {
    var row = document.querySelector('.row[data-id="' + id + '"]');
    if (!row) return;
    var on = !!state.awake[id];
    row.classList.toggle("is-on", on);
    row.setAttribute("aria-pressed", on ? "true" : "false");
    var sub = row.querySelector(".row-sub");
    sub.textContent = NAMES[id] + (on ? " is awake" : " is napping");
    var glyph = row.querySelector(".glyph");
    glyph.dataset.mood = on ? "happy" : "sleep";
    paintGlyph(glyph);
  }
  function syncRows() {
    Object.keys(NAMES).forEach(syncRow);
    setCount(awakeCount());
  }
  function toggleRow(id) {
    if (id === "bo") {
      setAda("talk", "Bo sleeps until Premium.");
      return;
    }
    var on = !state.awake[id];
    state.awake[id] = on;
    syncRow(id);
    setCount(awakeCount());
    var glyph = document.querySelector('.row[data-id="' + id + '"] .glyph');
    var box = document.querySelector('.row[data-id="' + id + '"] .box');
    if (on) {
      springTo(glyph, { scale: 1 }, { scale: 0.78 });
      springTo(box, { scale: 1 }, { scale: 0.55 });
      setAda("talk", NAMES[id] + " is up!");
    } else {
      setAda("talk", NAMES[id] + " is napping.");
    }
  }

  function visibleCards() {
    return Array.prototype.filter.call(track.children, function (card) { return !card.hidden; });
  }
  function sizeCards() {
    var w = Math.round(carousel.clientWidth * 0.76);
    if (!w) return;
    visibleCards().forEach(function (card) {
      card.style.flex = "0 0 " + w + "px";
      card.style.width = w + "px";
    });
  }
  function syncCrew() {
    var quinn = track.querySelector('[data-crew="quinn"]');
    var dex = track.querySelector('[data-crew="dex"]');
    quinn.hidden = !state.awake.quinn;
    dex.hidden = !state.awake.dex;
    var cards = visibleCards();
    state.crewIndex = clamp(state.crewIndex, 0, Math.max(0, cards.length - 1));
    dots.innerHTML = "";
    cards.forEach(function (card, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show " + card.querySelector("strong").textContent);
      if (i === state.crewIndex) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () { animateCrew(i); });
      dots.appendChild(b);
    });
    sizeCards();
    layoutCrew(false);
  }
  function stepW() {
    var card = visibleCards()[0];
    if (!card) return 1;
    return card.getBoundingClientRect().width + 12;
  }
  function layoutCrew(animate) {
    var cards = visibleCards();
    if (!cards.length) return;
    var w = stepW();
    var pad = (carousel.clientWidth - cards[0].getBoundingClientRect().width) / 2;
    var x = pad - state.crewIndex * w + carX;
    if (animate && !reduce) {
      gsap.to(track, { x: x, duration: 0.34, ease: "power2.out" });
    } else {
      gsap.set(track, { x: x });
    }
    Array.prototype.forEach.call(dots.children, function (dot, i) {
      if (i === state.crewIndex) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    carousel.setAttribute("aria-label", "Crew, card " + (state.crewIndex + 1) + " of " + cards.length);
  }
  function animateCrew(index) {
    var cards = visibleCards();
    state.crewIndex = clamp(index, 0, cards.length - 1);
    carX = 0;
    layoutCrew(true);
  }
  function bindCarousel() {
    var startX = 0;
    var startT = 0;
    var lastX = 0;
    var vel = 0;
    carousel.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      carDrag = true;
      carMoved = false;
      startX = lastX = e.clientX;
      startT = performance.now();
      vel = 0;
      gsap.killTweensOf(track);
      carousel.setPointerCapture(e.pointerId);
    });
    carousel.addEventListener("pointermove", function (e) {
      if (!carDrag) return;
      var dx = e.clientX - lastX;
      if (Math.abs(e.clientX - startX) > 6) carMoved = true;
      var dt = Math.max(8, performance.now() - startT);
      vel = dx / dt;
      startT = performance.now();
      lastX = e.clientX;
      carX += dx;
      layoutCrew(false);
    });
    function end() {
      if (!carDrag) return;
      carDrag = false;
      var w = stepW();
      var projected = -state.crewIndex * w + carX + vel * 180;
      var idx = Math.round(-projected / w);
      carX = 0;
      animateCrew(idx);
    }
    carousel.addEventListener("pointerup", end);
    carousel.addEventListener("pointercancel", end);
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); animateCrew(state.crewIndex + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); animateCrew(state.crewIndex - 1); }
    });
    carousel.addEventListener("click", function (e) {
      if (carMoved) {
        e.preventDefault();
        e.stopPropagation();
        carMoved = false;
      }
    }, true);
  }

  function draftFor(variant, userText, name) {
    var custom = userText && userText !== STOCK;
    if (!custom) {
      if (variant === "warmer") {
        return {
          subject: "Logo files: a warmer note",
          body: "Hi Jordan,\n\nHope you are doing well. We are adding a final round of polish to the logo files and need two more days. You will have everything by Thursday, and I think you will love where they landed.\n\nReally appreciate your patience,\n" + name
        };
      }
      if (variant === "shorter") {
        return {
          subject: "Logo files",
          body: "Hi Jordan,\n\nLogo files need two more days of polish. You will have them Thursday.\n\nThanks,\n" + name
        };
      }
      return {
        subject: "Logo files: quick update",
        body: "Hi Jordan,\n\nQuick update on the logo files: we're adding a final round of polish and need two more days. You'll have everything by Thursday.\n\nThanks for your patience,\n" + name
      };
    }
    if (variant === "shorter") {
      return { subject: "Quick update", body: "Hi Jordan,\n\n" + userText + "\n\nThanks,\n" + name };
    }
    if (variant === "warmer") {
      return {
        subject: "A warmer note",
        body: "Hi Jordan,\n\nHope your week is going well. " + userText + "\n\nYou will have everything by Thursday.\n\nReally appreciate your patience,\n" + name
      };
    }
    return { subject: "Quick update", body: "Hi Jordan,\n\n" + userText + "\n\nThanks for your patience,\n" + name };
  }
  function renderDraft(d) {
    draftSubject.textContent = d.subject;
    draftBody.textContent = d.body;
    if (!reduce) gsap.fromTo(draftBody, { opacity: 0.25 }, { opacity: 1, duration: 0.25 });
  }
  function showTaskDone() {
    composer.hidden = true;
    thread.hidden = false;
    ububble.hidden = false;
    userLine.textContent = state.userText || STOCK;
    ticks.classList.add("is-read");
    gigiTyping.hidden = true;
    draft.hidden = false;
    draft.style.height = "auto";
    chips.hidden = false;
    renderDraft(draftFor(state.variant, state.userText, displayName()));
    doneBanner.hidden = false;
  }
  function resetTaskView() {
    composer.hidden = false;
    thread.hidden = true;
    ububble.hidden = true;
    ticks.classList.remove("is-read");
    gigiTyping.hidden = true;
    draft.hidden = true;
    chips.hidden = true;
    doneBanner.hidden = true;
    chips.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-on"); });
  }
  async function sendTask() {
    var token = run;
    state.taskPhase = "sending";
    state.userText = taskInput.value.trim() || STOCK;
    state.variant = "default";
    panels.task.setAttribute("aria-busy", "true");
    composer.hidden = true;
    thread.hidden = false;
    ububble.hidden = false;
    userLine.textContent = state.userText;
    ticks.classList.remove("is-read");
    springTo(ububble, { scale: 1, y: 0 }, { scale: 0.86, y: 10 });
    await wait(dur(320));
    if (token !== run) return;
    ticks.classList.add("is-read");
    await wait(dur(420));
    if (token !== run) return;
    gigiTyping.hidden = false;
    await wait(dur(700));
    if (token !== run) return;
    gigiTyping.hidden = true;
    draft.hidden = false;
    renderDraft(draftFor("default", state.userText, displayName()));
    if (reduce) draft.style.height = "auto";
    else {
      draft.style.height = "0px";
      var h = draft.scrollHeight;
      gsap.fromTo(draft, { height: 0, opacity: 0.5 }, {
        height: h, opacity: 1, duration: 0.45, ease: "power2.out",
        onComplete: function () { draft.style.height = "auto"; }
      });
    }
    await wait(dur(480));
    if (token !== run) return;
    chips.hidden = false;
    if (!reduce) gsap.fromTo(chips, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    await wait(dur(280));
    if (token !== run) return;
    doneBanner.hidden = false;
    if (!reduce) gsap.fromTo(doneBanner, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    panels.task.scrollTop = panels.task.scrollHeight;
    state.taskPhase = "done";
    panels.task.removeAttribute("aria-busy");
    live.textContent = "Your first task, done.";
  }
  function copyDraft() {
    var text = draftSubject.textContent + "\n\n" + draftBody.textContent;
    var chip = document.getElementById("copyChip");
    chip.textContent = "Copied";
    chip.classList.add("is-on");
    setTimeout(function () {
      if (!chip.isConnected) return;
      chip.textContent = "Copy";
      chip.classList.remove("is-on");
    }, 1200);
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (err) {}
    ta.remove();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  }

  function morphConnect(id) {
    var btn = document.querySelector('[data-connect="' + id + '"]');
    if (!btn) return;
    btn.classList.add("is-connected");
    btn.textContent = "✓ Connected";
    springTo(btn, { scale: 1 }, { scale: 0.86 });
  }
  function syncTools() {
    if (state.calendar) morphConnect("calendar");
    Object.keys(state.tools).forEach(function (id) {
      if (state.tools[id]) morphConnect(id);
    });
  }

  function openSheet(which) {
    sheetReturn = document.activeElement;
    dim.hidden = false;
    sheet.hidden = false;
    ["sheetCalendar", "sheetTrial", "sheetWelcome"].forEach(function (id) {
      document.getElementById(id).hidden = id !== which;
    });
    var heading = document.getElementById(which).querySelector("h3");
    if (heading) sheet.setAttribute("aria-label", heading.textContent);
    gsap.killTweensOf([dim, sheet]);
    if (reduce) {
      gsap.set(dim, { opacity: 1 });
      gsap.set(sheet, { y: 0 });
    } else {
      gsap.fromTo(dim, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(sheet, { y: "110%" }, { y: "0%", duration: 0.45, ease: "power2.out" });
    }
    var focusable = sheet.querySelector(".sheet-view:not([hidden]) button");
    if (focusable) focusable.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    dim.style.pointerEvents = "none";
    var finish = function () {
      sheet.hidden = true;
      dim.hidden = true;
      dim.style.pointerEvents = "";
      gsap.set(sheet, { clearProps: "transform" });
      if (sheetReturn && sheetReturn.focus) {
        try { sheetReturn.focus({ preventScroll: true }); } catch (err) { sheetReturn.focus(); }
      }
    };
    if (reduce) { finish(); return; }
    gsap.to(sheet, { y: "110%", duration: 0.38, ease: "power2.in", onComplete: finish });
    gsap.to(dim, { opacity: 0, duration: 0.32 });
  }
  function showToast(text) {
    toastText.textContent = text;
    toast.hidden = false;
    if (!reduce) gsap.fromTo(toast, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, dur(2400));
  }
  function hideToast() {
    if (toast.hidden) return;
    var done = function () { toast.hidden = true; };
    if (reduce) { done(); return; }
    gsap.to(toast, { y: 20, opacity: 0, duration: 0.25, onComplete: done });
  }
  async function allowAccess() {
    if (connecting) return;
    connecting = true;
    var allow = document.getElementById("allow");
    allow.disabled = true;
    allow.innerHTML = '<span class="pill-label"><i class="spinner"></i>Connecting</span>';
    await wait(dur(850));
    connecting = false;
    allow.disabled = false;
    allow.innerHTML = '<span class="pill-label">Allow access</span>';
    state.calendar = true;
    morphConnect("calendar");
    closeSheet();
    showToast("Calendar connected");
  }

  function updatePlanUI() {
    var yearly = state.plan === "yearly";
    document.getElementById("planYear").classList.toggle("is-on", yearly);
    document.getElementById("planMonth").classList.toggle("is-on", !yearly);
    document.getElementById("planYear").setAttribute("aria-pressed", yearly ? "true" : "false");
    document.getElementById("planMonth").setAttribute("aria-pressed", yearly ? "false" : "true");
    document.getElementById("day7").textContent = yearly
      ? "Premium starts at ₹2,499 a year"
      : "Premium starts at ₹299 a month";
    document.getElementById("trialPlan").textContent = yearly ? "Premium, yearly" : "Premium, monthly";
    document.getElementById("trialAfter").textContent = yearly ? "₹2,499 / yr" : "₹299 / mo";
  }
  function spawnPremium(token) {
    premiumRow.innerHTML = "";
    var width = premiumRow.clientWidth || 320;
    var tileW = 42;
    var gap = 6;
    var total = tileW * 7 + gap * 6;
    var start = Math.max(0, (width - total) / 2);
    PREMIUM.forEach(function (item, i) {
      var move = document.createElement("span");
      move.className = "tile-move";
      move.style.position = "absolute";
      move.style.left = (start + i * (tileW + gap)) + "px";
      var arc = Math.pow((i - 3) / 3, 2) * 16;
      move.style.top = (6 + arc) + "px";
      var tile = document.createElement("span");
      tile.className = "tile";
      tile.style.width = tileW + "px";
      tile.style.height = tileW + "px";
      tile.style.background = item.color;
      tile.innerHTML = '<span class="ch">' + item.ch + "</span>" + faceHTML("happy");
      tile.querySelector(".ch").style.fontSize = "22px";
      tile.querySelector(".face").style.fontSize = "22px";
      move.appendChild(tile);
      premiumRow.appendChild(move);
      var tilt = TILTS[i % TILTS.length] * 0.6 + (i - 3) * 3;
      var delay = (i < 5 ? i * 80 : i === 5 ? 460 : 700);
      setTimeout(function () {
        if (token !== run) return;
        springTo(tile, { scale: 1, rotation: tilt }, { scale: reduce ? 1 : 0.3, rotation: tilt - 16 });
      }, dur(delay));
    });
    if (!reduce) {
      gsap.fromTo(freeBadge, { scale: 0.6, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: -2, duration: 0.35, delay: 0.28, ease: "back.out(1.8)" });
    }
  }
  function jumpRow() {
    document.querySelectorAll("#jumpRow .glyph").forEach(function (el, i) {
      springTo(el, { scale: 1, y: 0 }, { scale: 0.7, y: 12 });
      if (!reduce) el.style.transitionDelay = (i * 40) + "ms";
    });
  }

  function shedInstant() {
    if (kenTween) kenTween.kill();
    if (introTween) introTween.kill();
    state.framed = false;
    stage.classList.remove("is-framed");
    stage.classList.add("is-full");
    gsap.set(screen, { clearProps: "transform,boxShadow,borderRadius" });
    island.style.opacity = "0";
  }
  function punchIn() {
    if (!state.framed || state.step === "welcome") return;
    if (kenTween) kenTween.kill();
    var scale = Number(gsap.getProperty(screen, "scale")) || 0.85;
    gsap.to(island, { opacity: 0, duration: 0.35 });
    introTween = gsap.to(screen, {
      scale: 1,
      boxShadow: "0 0 0 0px rgba(0,0,0,0), 0 0 0 0px rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0)",
      borderRadius: fullRadius(),
      duration: 0.5,
      ease: "power2.inOut",
      overwrite: "auto",
      onComplete: function () {
        state.framed = false;
        stage.classList.remove("is-framed");
        stage.classList.add("is-full");
        gsap.set(screen, { clearProps: "transform,boxShadow,borderRadius" });
      }
    });
    void scale;
  }
  function restoreFrame() {
    if (introTween) introTween.kill();
    if (kenTween) kenTween.kill();
    state.framed = true;
    stage.classList.add("is-framed");
    stage.classList.remove("is-full");
    if (reduce) {
      gsap.set(screen, { clearProps: "transform,boxShadow,borderRadius" });
      island.style.opacity = "1";
      return;
    }
    gsap.fromTo(screen,
      { scale: 1, borderRadius: fullRadius(), boxShadow: "0 0 0 0 #000" },
      {
        scale: 0.85,
        borderRadius: 40,
        boxShadow: BEZEL,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: function () {
          gsap.set(screen, { scale: 0.85 });
        }
      }
    );
    gsap.to(island, { opacity: 1, duration: 0.3 });
  }
  function startKen() {
    if (reduce || !state.framed) return;
    kenTween = gsap.fromTo(screen, { scale: 0.78 }, { scale: 0.85, duration: 1.55, ease: "power1.out" });
  }

  function onEnter(step, token) {
    if (step === "name") {
      adaTypingThen(token, "Hi! First things first, what should we call you?", 380);
      resetTiles(nameInput.value.length > 1 ? 50 : 0);
      if (window.matchMedia("(pointer: fine)").matches) {
        nameInput.focus({ preventScroll: true });
      }
    } else if (step === "role") {
      adaTypingThen(token, roleLine(), 420);
      scroll = state.role;
      layoutWheel();
    } else if (step === "week") {
      setAda("type");
      syncRows();
      if (!reduce) {
        panels.week.classList.remove("is-entering");
        void panels.week.offsetWidth;
        panels.week.classList.add("is-entering");
        setTimeout(function () { if (token === run) ink(pill); }, 160);
      }
    } else if (step === "crew") {
      adaTypingThen(token, "Here's your crew. Swipe to meet everyone.", 380);
      state.crewIndex = 0;
      syncCrew();
    } else if (step === "task") {
      adaTypingThen(token, "Go on, give Gigi a quick one. No account needed.", 420);
      if (state.taskPhase === "done") showTaskDone();
      else resetTaskView();
    } else if (step === "tools") {
      adaTypingThen(token, "Plug us into your tools. We only read until you say so.", 420);
      syncTools();
    } else if (step === "nudge") {
      setAda("type");
      document.getElementById("nudgeLine").textContent =
        "Morning, " + displayName() + "! 3 meetings today. I held 45 minutes after lunch for the logo review.";
    } else if (step === "paywall") {
      hideAda();
      updatePlanUI();
      requestAnimationFrame(function () { if (token === run) spawnPremium(token); });
    } else if (step === "allset") {
      hideAda();
      document.getElementById("allsetTitle").textContent = "You're all set, " + displayName() + "!";
      burst({ n: 96, y: 0.34 });
      if (!reduce) {
        gsap.fromTo("#starters .starter", { opacity: 0, y: 10, filter: "blur(8px)" }, {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.48, stagger: 0.1, delay: 0.12, ease: "power2.out"
        });
        gsap.fromTo("#cast .glyph", { y: 16, scale: 0.8 }, { y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" });
        setTimeout(function () { if (token === run) ink(pill); }, 200);
      }
    } else if (step === "welcome") {
      hideAda();
    }
    var labels = {
      welcome: "Welcome",
      name: "What's your name?",
      role: "What kind of work do you do?",
      week: "What eats up your week?",
      crew: "Say hi to your crew",
      task: "Your first task",
      tools: "Connect your tools",
      nudge: "Morning nudge",
      paywall: "Unlock the whole crew",
      allset: "You're all set"
    };
    if (step !== "role") live.textContent = labels[step] || step;
  }

  function go(next, dir) {
    if (!panels[next] || next === state.step) return;
    var prev = state.step;
    var token = ++run;
    clearTimeout(settleTimer);
    if (prev === "task" && state.taskPhase === "sending") state.taskPhase = "edit";
    state.step = next;
    screen.dataset.step = next;
    applyChrome(next);
    var forward = dir >= 0;
    var out = panels[prev];
    var inc = panels[next];
    if (next === "welcome") {
      if (!state.framed) restoreFrame();
      hideAda();
    } else if (next === "paywall" || next === "allset") hideAda();
    updateDock(next);
    gsap.killTweensOf([out, inc]);
    inc.hidden = false;
    onEnter(next, token);
    var ms = dur(420);
    lock(ms + 30);
    if (reduce) {
      out.hidden = true;
      gsap.set(inc, { opacity: 1, y: 0, scale: 1 });
      gsap.set(out, { clearProps: "opacity,transform,filter" });
      return;
    }
    gsap.fromTo(inc, { opacity: 0, y: forward ? 18 : -14, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: ms / 1000, ease: "power2.out" });
    gsap.to(out, {
      opacity: 0,
      y: forward ? -16 : 12,
      scale: 0.96,
      duration: ms / 1000,
      ease: "power2.out",
      onComplete: function () {
        if (state.step !== prev) {
          out.hidden = true;
          gsap.set(out, { clearProps: "opacity,transform,filter" });
        }
      }
    });
  }

  function meet() {
    if (isBusy()) return;
    lock(reduce ? 160 : 520);
    go("name", 1);
    if (reduce) { shedInstant(); return; }
    setTimeout(function () {
      if (state.step === "name" && state.framed) punchIn();
    }, 420);
  }
  function autotype() {
    var token = ++autoToken;
    var myRun = run;
    autotyping = true;
    var target = "Ritu";
    nameInput.value = "";
    prevLen = 0;
    syncTiles("", 0);
    updateNamePill(false);
    (async function () {
      for (var i = 0; i < target.length; i++) {
        await wait(dur(260));
        if (token !== autoToken || myRun !== run) { autotyping = false; return; }
        nameInput.value = target.slice(0, i + 1);
        prevLen = nameInput.value.length;
        syncTiles(nameInput.value, 0);
        updateNamePill(i === 0);
      }
      autotyping = false;
    })();
  }
  function leaveName() {
    state.name = nameInput.value.trim();
    exitTiles();
    go("role", 1);
  }
  function enableNudges() {
    state.nudges = true;
    bell.classList.add("is-ringing", "is-on");
    go("paywall", 1);
  }
  function skipNudges() {
    go("paywall", 1);
  }
  function finish() {
    showToast("The crew is with you.");
  }
  function skipToEnd() {
    if (state.step === "allset") return;
    if (!sheet.hidden) closeSheet();
    if (!state.name) state.name = nameInput.value.trim() || "Ritu";
    if (state.framed) shedInstant();
    go("allset", 1);
  }
  function back() {
    if (!sheet.hidden) { closeSheet(); return; }
    var i = ORDER.indexOf(state.step);
    if (i <= 0) return;
    go(ORDER[i - 1], -1);
  }

  function confirmTrial() {
    document.getElementById("sheetTrial").hidden = true;
    document.getElementById("sheetWelcome").hidden = false;
    var view = document.getElementById("sheetWelcome");
    if (!reduce) gsap.fromTo(view, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    state.awake.bo = true;
    jumpRow();
    burst({ n: 72, y: 0.62, x: 0.5 });
    document.getElementById("letsGo").focus();
  }

  function onPill() {
    if (isBusy() && state.step !== "task") return;
    var s = state.step;
    if (s === "welcome") return meet();
    if (s === "name") {
      if (!nameInput.value.trim()) return autotype();
      return leaveName();
    }
    if (s === "role") return go("week", 1);
    if (s === "week") return go("crew", 1);
    if (s === "crew") return go("task", 1);
    if (s === "task") {
      if (state.taskPhase === "edit") return sendTask();
      if (state.taskPhase === "done") return go("tools", 1);
      return;
    }
    if (s === "tools") return go("nudge", 1);
    if (s === "nudge") return enableNudges();
    if (s === "paywall") return openSheet("sheetTrial");
    if (s === "allset") return finish();
  }

  function bind() {
    screen.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest("button");
      if (!btn || btn.disabled || !screen.contains(btn)) return;
      ink(btn, e);
    });
    screen.addEventListener("keydown", function (e) {
      if (e.repeat) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      var btn = e.target.closest("button");
      if (!btn || btn.disabled) return;
      ink(btn);
    });
    pill.addEventListener("click", onPill);
    quiet.addEventListener("click", function () {
      if (isBusy()) return;
      if (state.step === "tools") go("nudge", 1);
      else if (state.step === "nudge") skipNudges();
    });
    document.getElementById("back").addEventListener("click", function () { if (!isBusy()) back(); });
    document.getElementById("skip").addEventListener("click", function () { if (!isBusy()) skipToEnd(); });
    document.getElementById("payClose").addEventListener("click", function () { if (!isBusy()) go("nudge", -1); });
    document.getElementById("login").addEventListener("click", function () {
      hello.textContent = "Meet the crew first.";
    });
    document.getElementById("restore").addEventListener("click", function () {
      showToast("Nothing to restore on this device.");
    });
    nameInput.addEventListener("input", function () {
      autoToken++;
      autotyping = false;
      var pasted = Math.abs(nameInput.value.length - prevLen) > 1;
      prevLen = nameInput.value.length;
      syncTiles(nameInput.value, pasted ? 260 : 0);
      updateNamePill(true);
    });
    nameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); onPill(); }
    });
    document.getElementById("rows").addEventListener("click", function (e) {
      var row = e.target.closest(".row");
      if (!row) return;
      toggleRow(row.dataset.id);
    });
    document.querySelectorAll("[data-connect]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.dataset.connect;
        if (id === "email") return;
        if (id === "calendar") {
          if (state.calendar) return;
          setAda("talk", "Plug us into your tools. We only read until you say so.");
          openSheet("sheetCalendar");
          return;
        }
        state.tools[id] = true;
        morphConnect(id);
        setAda("talk", "Connected. We'll only read until you say so.");
      });
    });
    document.getElementById("allow").addEventListener("click", allowAccess);
    document.getElementById("sheetX").addEventListener("click", closeSheet);
    sheet.querySelectorAll("[data-close-sheet]").forEach(function (btn) {
      btn.addEventListener("click", closeSheet);
    });
    dim.addEventListener("click", closeSheet);
    document.getElementById("toastX").addEventListener("click", hideToast);
    document.getElementById("trialGo").addEventListener("click", confirmTrial);
    document.getElementById("letsGo").addEventListener("click", function () {
      sheet.hidden = true;
      dim.hidden = true;
      gsap.set(sheet, { clearProps: "transform" });
      go("allset", 1);
    });
    document.getElementById("planYear").addEventListener("click", function () { state.plan = "yearly"; updatePlanUI(); });
    document.getElementById("planMonth").addEventListener("click", function () { state.plan = "monthly"; updatePlanUI(); });
    document.getElementById("remind").addEventListener("click", function (e) {
      var sw = e.currentTarget;
      state.remind = !state.remind;
      sw.classList.toggle("is-on", state.remind);
      sw.setAttribute("aria-checked", state.remind ? "true" : "false");
    });
    bell.addEventListener("click", function () {
      bell.classList.add("is-ringing");
      setTimeout(function () { bell.classList.add("is-on"); }, dur(180));
    });
    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-chip]");
      if (!btn || state.taskPhase !== "done") return;
      var kind = btn.dataset.chip;
      if (kind === "copy") { copyDraft(); return; }
      state.variant = kind;
      chips.querySelectorAll("[data-chip]").forEach(function (b) { b.classList.remove("is-on"); });
      btn.classList.add("is-on");
      renderDraft(draftFor(kind, state.userText, displayName()));
    });
    taskInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (state.taskPhase === "edit") sendTask();
      }
    });
    document.getElementById("starters").addEventListener("click", function (e) {
      var btn = e.target.closest(".starter");
      if (!btn) return;
      btn.classList.add("is-sent");
      showToast("Sent to " + btn.dataset.who + ".");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!sheet.hidden) {
        e.preventDefault();
        closeSheet();
      }
    });
    sheet.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || sheet.hidden) return;
      var list = Array.prototype.filter.call(
        sheet.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])"),
        function (el) { return !el.disabled && el.offsetParent; }
      );
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener("resize", function () {
      if (state.step === "crew") layoutCrew(false);
    });
  }

  function helloCycle() {
    if (reduce) return;
    gsap.fromTo(hello, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, delay: 0.35, ease: "power2.out" });
    setTimeout(function () {
      if (state.step !== "welcome") return;
      gsap.to(hello, {
        opacity: 0, duration: 0.2, onComplete: function () {
          if (hello.textContent.indexOf("Meet the crew") === 0) return;
          hello.textContent = "Need a hand?";
          gsap.to(hello, { opacity: 1, duration: 0.25 });
        }
      });
    }, 1700);
  }
  function blink() {
    setInterval(function () {
      if (reduce || document.hidden) return;
      document.querySelectorAll('.glyph[data-who="ada"]').forEach(function (el) {
        el.classList.add("is-blink");
        setTimeout(function () { el.classList.remove("is-blink"); }, 120);
      });
    }, 3400);
  }

  paintAll();
  buildWheel();
  bindWheel();
  bindCarousel();
  bind();
  applyChrome("welcome");
  updateDock("welcome");
  hideAda();
  syncRows();
  startKen();
  helloCycle();
  blink();
  if (reduce) document.querySelectorAll(".floater").forEach(function (el) { el.style.animation = "none"; });
})();

/* Original studies for this page. Timings follow microinteractions.dev; the source is not copied. */
(function () {
  "use strict";

  var EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  var gestures = [];

  function motionOn() {
    return document.documentElement.getAttribute("data-motion") === "on";
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function boot(name, fn) {
    try { fn(); }
    catch (err) { console.error(name, err); }
  }

  (function syncMotion() {
    var q = location.search || "";
    var locked = /(?:^|[?&])reduce=1(?:&|$)/.test(q) || /(?:^|[?&])motion=1(?:&|$)/.test(q);
    try {
      if (!/(?:^|[?&])motion=1(?:&|$)/.test(q) && sessionStorage.getItem("mi-reduce") === "1") locked = true;
    } catch (e) {}
    if (locked || !window.matchMedia) return;
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.addEventListener) {
      mq.addEventListener("change", function () {
        document.documentElement.setAttribute("data-motion", mq.matches ? "reduce" : "on");
      });
    }
  })();

  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (motionOn()) return;
      document.getAnimations().forEach(function (anim) {
        try { anim.finish(); } catch (e) { try { anim.cancel(); } catch (e2) {} }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    for (var i = 0; i < gestures.length; i++) {
      if (gestures[i]()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
  }, true);

  boot("jump", initJump);
  boot("swap", initSwap);
  boot("hold", initHold);
  boot("morph", initMorph);
  boot("pluck", initPluck);
  boot("goo", initGoo);
  boot("edge", initEdge);
  boot("pick", initPick);
  boot("split", initSplit);
  boot("tabs", initTabs);
  boot("worm", initWorm);
  boot("order", initOrder);
  boot("faq", initFaq);
  boot("rail", initRail);

  function initJump() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".jump a"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
    if (!sections.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var current = sections[0];
      sections.forEach(function (sec) {
        if (sec.getBoundingClientRect().top <= 140) current = sec;
      });
      links.forEach(function (a) {
        if (a.getAttribute("href") === "#" + current.id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function initSwap() {
    var btn = document.getElementById("swap-btn");
    var live = document.getElementById("swap-live");
    if (!btn || !live) return;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    btn.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      btn.classList.add("is-hot");
    });
    btn.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      btn.classList.remove("is-hot");
    });
    btn.addEventListener("click", function () {
      if (!fine.matches && !btn.classList.contains("is-hot")) {
        btn.classList.toggle("is-swapped");
        live.textContent = btn.classList.contains("is-swapped") ? "Showing: Keep this copy" : "Showing: Save draft";
        return;
      }
      live.textContent = "Draft saved";
    });
  }

  function initHold() {
    var btn = document.getElementById("hold-btn");
    var live = document.getElementById("hold-live");
    var reset = document.getElementById("hold-reset");
    if (!btn || !reset) return;
    var HOLD = 1200;
    var p = 0;
    var mode = "idle";
    var raf = 0;
    var start = 0;
    var pointerId = null;
    var keyHolding = false;

    function render() { btn.style.setProperty("--p", String(p)); }
    function stop() { cancelAnimationFrame(raf); }

    function confirm() {
      mode = "done";
      p = 1;
      render();
      btn.classList.add("is-done");
      if (motionOn()) btn.classList.add("is-settling");
      btn.setAttribute("aria-label", "Archived");
      if (live) live.textContent = "Archived";
      reset.hidden = false;
      pointerId = null;
      keyHolding = false;
    }

    function frame(now) {
      if (mode !== "holding") return;
      p = Math.min(1, (now - start) / HOLD);
      render();
      if (p >= 1) confirm();
      else raf = requestAnimationFrame(frame);
    }

    function begin() {
      if (mode === "done") return;
      stop();
      btn.classList.remove("is-settling");
      p = 0;
      render();
      mode = "holding";
      start = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function retract() {
      if (mode !== "holding") return;
      stop();
      var from = p;
      if (!motionOn() || from <= 0) {
        p = 0;
        render();
        mode = "idle";
        return;
      }
      mode = "retracting";
      var t0 = performance.now();
      function step(now) {
        if (mode !== "retracting") return;
        var t = Math.min(1, (now - t0) / 180);
        p = from * (1 - (1 - Math.pow(1 - t, 3)));
        render();
        if (t < 1) raf = requestAnimationFrame(step);
        else mode = "idle";
      }
      raf = requestAnimationFrame(step);
    }

    gestures.push(function () {
      if (mode !== "holding" && mode !== "retracting") return false;
      keyHolding = false;
      pointerId = null;
      if (mode === "holding") retract();
      else {
        stop();
        p = 0;
        render();
        mode = "idle";
      }
      return true;
    });

    btn.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || mode === "done") return;
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      pointerId = e.pointerId;
      begin();
    });
    btn.addEventListener("pointerup", function (e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (mode === "holding") retract();
    });
    btn.addEventListener("pointercancel", function () {
      pointerId = null;
      if (mode === "holding") retract();
    });
    btn.addEventListener("keydown", function (e) {
      if ((e.key === " " || e.key === "Enter") && !e.repeat && mode !== "done") {
        e.preventDefault();
        keyHolding = true;
        begin();
      }
    });
    btn.addEventListener("keyup", function (e) {
      if ((e.key === " " || e.key === "Enter") && keyHolding) {
        keyHolding = false;
        if (mode === "holding") retract();
      }
    });
    btn.addEventListener("blur", function () {
      keyHolding = false;
      if (mode === "holding") retract();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && mode === "holding") retract();
    });
    window.addEventListener("blur", function () {
      if (mode === "holding") retract();
    });
    reset.addEventListener("click", function () {
      stop();
      p = 0;
      render();
      mode = "idle";
      btn.classList.remove("is-done", "is-settling");
      btn.setAttribute("aria-label", "Archive ledger. Hold to confirm.");
      reset.hidden = true;
      if (live) live.textContent = "Ready to archive";
      btn.focus();
    });
    render();
  }

  function initMorph() {
    var slides = [
      ["North quay", "A lamp at the end of the pier."],
      ["Salt market", "Crates stacked two deep."],
      ["Night ferry", "The ramp is down for ten minutes."]
    ];
    var title = document.getElementById("morph-title");
    var note = document.getElementById("morph-note");
    var prev = document.getElementById("morph-prev");
    var next = document.getElementById("morph-next");
    if (!title || !prev || !next) return;
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      title.textContent = slides[i][0];
      note.textContent = slides[i][1];
    }
    [prev, next].forEach(function (btn) {
      btn.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "touch") return;
        btn.classList.add("is-hot");
      });
      btn.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "touch") return;
        btn.classList.remove("is-hot");
      });
    });
    prev.addEventListener("click", function () { show(i - 1); });
    next.addEventListener("click", function () { show(i + 1); });
  }

  function initPluck() {
    var root = document.getElementById("pluck");
    if (!root) return;
    var NS = "http://www.w3.org/2000/svg";
    root.classList.add("is-ready");
    Array.prototype.forEach.call(root.querySelectorAll(".pluck-link"), function (link) {
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("aria-hidden", "true");
      var group = document.createElementNS(NS, "g");
      var path = document.createElementNS(NS, "path");
      group.appendChild(path);
      svg.appendChild(group);
      link.appendChild(svg);
      var origin = 0;
      var ringing = null;

      function layout() {
        var w = Math.max(1, link.clientWidth);
        var amp = Math.max(2, Math.min(5, w / 18));
        var mid = 6;
        svg.setAttribute("viewBox", "0 0 " + w + " 16");
        path.setAttribute("d", "M0 " + mid + " Q" + (w / 2) + " " + (mid + amp) + " " + w + " " + mid);
        group.style.transformOrigin = (w / 2) + "px " + mid + "px";
        group.style.transformBox = "view-box";
        return w;
      }

      function play() {
        var w = layout();
        if (!motionOn()) {
          group.style.transform = "scaleY(0.001)";
          return;
        }
        var ms = Math.max(400, Math.min(1200, w * 13));
        var frames = [];
        var zeta = 0.2;
        var wd = 2.4 * Math.PI * 2;
        var alpha = zeta * wd / Math.sqrt(1 - zeta * zeta);
        var steps = 48;
        for (var i = 0; i <= steps; i++) {
          var u = i / steps;
          var y = Math.exp(-alpha * u) * Math.cos(wd * u);
          frames.push({ transform: "scaleY(" + y.toFixed(4) + ")", offset: u });
        }
        frames[frames.length - 1].transform = "scaleY(0.001)";
        if (ringing) ringing.cancel();
        ringing = group.animate(frames, { duration: ms, easing: "linear", fill: "forwards" });
      }

      function localX(clientX) {
        var rect = link.getBoundingClientRect();
        return clamp(clientX - rect.left, 0, rect.width);
      }

      function openFrom(x) {
        origin = x;
        var w = layout();
        link.classList.add("is-open");
        link.classList.remove("is-flat");
        svg.style.transition = "none";
        svg.style.clipPath = "inset(0px " + Math.max(0, w - x) + "px 0px " + x + "px)";
        svg.getBoundingClientRect();
        svg.style.transition = motionOn() ? "clip-path 140ms " + EASE : "none";
        svg.style.clipPath = "inset(0px 0px 0px 0px)";
        play();
      }

      function closeTo() {
        var w = Math.max(1, link.clientWidth);
        svg.style.transition = motionOn() ? "clip-path 110ms " + EASE : "none";
        svg.style.clipPath = "inset(0px " + Math.max(0, w - origin) + "px 0px " + origin + "px)";
        link.classList.remove("is-open");
      }

      function showFlat() {
        if (ringing) ringing.cancel();
        layout();
        group.style.transform = "scaleY(0.001)";
        svg.style.transition = "none";
        svg.style.clipPath = "inset(0px 0px 0px 0px)";
        link.classList.add("is-flat");
        link.classList.remove("is-open");
      }

      function hide() {
        if (ringing) ringing.cancel();
        svg.style.transition = "none";
        svg.style.clipPath = "inset(0px 50% 0px 50%)";
        link.classList.remove("is-flat", "is-open");
      }

      link.addEventListener("pointerenter", function (e) {
        if (e.pointerType === "touch" || link.matches(":focus-visible")) return;
        openFrom(localX(e.clientX));
      });
      link.addEventListener("pointerleave", function (e) {
        if (e.pointerType === "touch" || link.matches(":focus-visible")) return;
        closeTo();
      });
      link.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "touch") return;
        openFrom(localX(e.clientX));
      });
      link.addEventListener("focus", function () {
        requestAnimationFrame(function () {
          if (link.matches(":focus-visible")) showFlat();
        });
      });
      link.addEventListener("blur", hide);
      layout();
      svg.style.clipPath = "inset(0px 50% 0px 50%)";
    });
  }

  function initGoo() {
    var root = document.getElementById("goo");
    if (!root) return;
    var NS = "http://www.w3.org/2000/svg";
    var svg = root.querySelector(".goo-svg");
    var layer = document.getElementById("goo-dots");
    var note = document.getElementById("goo-note");
    var live = document.getElementById("goo-live");
    var notes = {
      desk: "The desk holds it until evening.",
      courier: "A courier takes it at noon.",
      locker: "The locker is on the east wall."
    };
    var inputs = Array.prototype.slice.call(root.querySelectorAll("input"));
    var rings = Array.prototype.slice.call(root.querySelectorAll(".goo-ring"));
    var circles = [];
    var i;
    for (i = 0; i < 8; i++) {
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", "#1c1c22");
      layer.appendChild(dot);
      circles.push(dot);
    }
    var head = { x: 0, y: 0 };
    var tail = { x: 0, y: 0 };
    var raf = 0;
    var running = false;
    var fromPointer = false;

    function selected() {
      for (var n = 0; n < inputs.length; n++) if (inputs[n].checked) return n;
      return 0;
    }

    function centerOf(index) {
      var w = Math.max(1, root.clientWidth);
      var h = Math.max(1, root.clientHeight);
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      var box = svg.getBoundingClientRect();
      var ring = rings[index].getBoundingClientRect();
      return {
        x: ring.left - box.left + ring.width / 2,
        y: ring.top - box.top + ring.height / 2
      };
    }

    function paint(hPos, tPos, stretch) {
      for (var n = 0; n < circles.length; n++) {
        var u = n / (circles.length - 1);
        circles[n].setAttribute("cx", String(hPos.x + (tPos.x - hPos.x) * u));
        circles[n].setAttribute("cy", String(hPos.y + (tPos.y - hPos.y) * u));
        circles[n].setAttribute("r", String(5 * (1 - u * stretch * 0.7)));
      }
      head = hPos;
      tail = tPos;
    }

    function place(index) {
      cancelAnimationFrame(raf);
      running = false;
      var c = centerOf(index);
      paint(c, c, 0);
    }

    function pour(index) {
      var fromH = { x: head.x, y: head.y };
      var fromT = { x: tail.x, y: tail.y };
      var to = centerOf(index);
      var useOut = running;
      var maxDist = Math.max(8, Math.hypot(to.x - fromH.x, to.y - fromH.y));
      var t0 = performance.now();
      running = true;
      cancelAnimationFrame(raf);
      function step(now) {
        var elapsed = now - t0;
        var headP = Math.min(1, elapsed / 300);
        var tailP = Math.min(1, elapsed / 340);
        var ease = useOut ? function (t) { return 1 - Math.pow(1 - t, 3); } : function (t) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        var hPos = {
          x: fromH.x + (to.x - fromH.x) * ease(headP),
          y: fromH.y + (to.y - fromH.y) * ease(headP)
        };
        var tPos = {
          x: fromT.x + (to.x - fromT.x) * ease(tailP),
          y: fromT.y + (to.y - fromT.y) * ease(tailP)
        };
        paint(hPos, tPos, Math.min(1, Math.hypot(hPos.x - tPos.x, hPos.y - tPos.y) / maxDist));
        if (headP < 1 || tailP < 1) raf = requestAnimationFrame(step);
        else running = false;
      }
      raf = requestAnimationFrame(step);
    }

    function writeNote(announce) {
      var input = inputs[selected()];
      if (!input || !note) return;
      note.textContent = notes[input.value] || "";
      if (announce && live) {
        var label = input.parentElement.querySelector("span:last-child");
        live.textContent = label ? label.textContent : input.value;
      }
    }

    root.addEventListener("pointerdown", function () { fromPointer = true; });
    root.addEventListener("keydown", function (e) {
      if (e.key.indexOf("Arrow") === 0) fromPointer = false;
    });
    root.addEventListener("change", function () {
      var index = selected();
      if (!motionOn() || !fromPointer) place(index);
      else pour(index);
      fromPointer = false;
      writeNote(true);
    });
    window.addEventListener("resize", function () {
      if (!running) place(selected());
    });
    root.classList.add("is-ready");
    place(selected());
    writeNote(false);
  }

  function initEdge() {
    var field = document.getElementById("edge");
    var input = document.getElementById("edge-input");
    var num = document.getElementById("edge-num");
    if (!field || !input || !num) return;
    function update() {
      var min = Number(input.min || 0);
      var max = Number(input.max || 100);
      var span = max - min || 1;
      field.style.setProperty("--t", String((input.valueAsNumber - min) / span));
      num.textContent = input.value;
      input.setAttribute("aria-valuetext", input.value + " percent");
    }
    input.addEventListener("input", update);
    update();
  }

  function initPick() {
    var root = document.getElementById("pick");
    var body = document.getElementById("pick-body");
    var all = document.getElementById("pick-all");
    var band = document.getElementById("pick-band");
    var countEl = document.getElementById("pick-count");
    var live = document.getElementById("pick-live");
    var scroller = document.getElementById("pick-scroll");
    if (!root || !body || !all || !band) return;
    var rows = Array.prototype.map.call(body.querySelectorAll("tr"), function (tr) {
      return { tr: tr, input: tr.querySelector("input") };
    });
    var snapshot = null;
    var anchor = 0;
    var direction = true;
    var dragging = false;
    var handledClick = false;
    var shiftRun = null;
    var lastIndex = 0;
    var announceTimer = 0;

    function read() {
      return rows.map(function (row) { return row.input.checked; });
    }

    function paint(silent) {
      var on = read();
      var n = 0;
      rows.forEach(function (row, i) {
        if (on[i]) n += 1;
        var prev = i > 0 && on[i - 1];
        var next = i < on.length - 1 && on[i + 1];
        row.tr.classList.toggle("is-on", on[i]);
        row.tr.classList.toggle("is-top", on[i] && !prev);
        row.tr.classList.toggle("is-bot", on[i] && !next);
      });
      countEl.textContent = (n === 0 ? "None" : String(n)) + " of " + rows.length;
      all.checked = n === rows.length && rows.length > 0;
      all.indeterminate = n > 0 && n < rows.length;
      if (silent || !live) return;
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        live.textContent = n === 0 ? "None selected" : n + " selected";
      }, 250);
    }

    function setBox(i, value) {
      if (rows[i].input.checked === value) return;
      rows[i].input.checked = value;
      rows[i].input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function placeBand(a, b, show, clearing) {
      if (!show) {
        band.style.opacity = "0";
        return;
      }
      var box = scroller.getBoundingClientRect();
      var top = rows[a].tr.getBoundingClientRect().top - box.top + scroller.scrollTop + 6;
      var bottom = rows[b].tr.getBoundingClientRect().bottom - box.top + scroller.scrollTop - 6;
      band.style.transform = "translateY(" + top + "px)";
      band.style.height = Math.max(8, bottom - top) + "px";
      band.style.opacity = "1";
      root.classList.toggle("is-clear", !!clearing);
    }

    function applyRange(current, snap, dir, showBand) {
      var a = Math.min(anchor, current);
      var b = Math.max(anchor, current);
      rows.forEach(function (row, i) {
        setBox(i, i >= a && i <= b ? dir : snap[i]);
      });
      paint(false);
      placeBand(a, b, showBand && b > a, !dir);
    }

    function indexFromY(y) {
      var found = 0;
      rows.forEach(function (row, i) {
        if (y >= row.tr.getBoundingClientRect().top) found = i;
      });
      return found;
    }

    function endDrag(cancel) {
      if (!dragging) return false;
      dragging = false;
      document.body.style.userSelect = "";
      if (cancel && snapshot) {
        rows.forEach(function (row, i) { setBox(i, snapshot[i]); });
        paint(false);
      }
      band.style.opacity = "0";
      snapshot = null;
      return true;
    }

    gestures.push(function () { return endDrag(true); });
    window.addEventListener("blur", function () { endDrag(true); });

    scroller.addEventListener("pointerdown", function (e) {
      var cell = e.target.closest && e.target.closest("td.pick-cell");
      if (!cell || !body.contains(cell)) return;
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey) return;
      var tr = cell.parentElement;
      var i = rows.findIndex(function (row) { return row.tr === tr; });
      if (i < 0) return;
      e.preventDefault();
      handledClick = true;
      rows[i].input.focus({ preventScroll: true });
      if (e.shiftKey) {
        var snap = shiftRun ? shiftRun.snapshot.slice() : read();
        var base = shiftRun ? shiftRun.anchor : lastIndex;
        anchor = base;
        direction = !rows[i].input.checked;
        applyRange(i, snap, direction, false);
        lastIndex = i;
        shiftRun = null;
        return;
      }
      snapshot = read();
      anchor = i;
      direction = !snapshot[i];
      dragging = true;
      shiftRun = null;
      document.body.style.userSelect = "none";
      setBox(i, direction);
      paint(false);
      placeBand(i, i, false, !direction);
      try { cell.setPointerCapture(e.pointerId); } catch (err) {}
      lastIndex = i;
    });

    scroller.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      applyRange(indexFromY(e.clientY), snapshot, direction, true);
    });
    scroller.addEventListener("pointerup", function () { endDrag(false); });
    scroller.addEventListener("pointercancel", function () { endDrag(true); });
    scroller.addEventListener("click", function (e) {
      if (!handledClick) return;
      e.preventDefault();
      e.stopPropagation();
      handledClick = false;
    }, true);

    body.addEventListener("click", function (e) {
      var th = e.target.closest && e.target.closest("th[scope='row']");
      if (!th || e.ctrlKey || e.metaKey || e.altKey) return;
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel) !== "") return;
      var i = rows.findIndex(function (row) { return row.tr === th.parentElement; });
      if (i < 0) return;
      e.preventDefault();
      if (e.shiftKey) {
        anchor = lastIndex;
        direction = !rows[i].input.checked;
        applyRange(i, read(), direction, false);
      } else {
        setBox(i, !rows[i].input.checked);
        paint(false);
        shiftRun = null;
      }
      lastIndex = i;
    });

    rows.forEach(function (row, i) {
      row.input.addEventListener("keydown", function (e) {
        if (e.altKey || e.metaKey || e.ctrlKey) return;
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
          if (e.key !== "Shift") shiftRun = null;
          return;
        }
        e.preventDefault();
        var next = e.key === "ArrowDown" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
        if (e.shiftKey) {
          if (!shiftRun) shiftRun = { anchor: i, snapshot: read(), dir: row.input.checked };
          anchor = shiftRun.anchor;
          direction = shiftRun.dir;
          applyRange(next, shiftRun.snapshot, shiftRun.dir, false);
        } else {
          shiftRun = null;
        }
        rows[next].input.focus();
      });
      row.input.addEventListener("change", function () {
        shiftRun = null;
        if (!dragging) paint(false);
      });
    });

    all.addEventListener("click", function () {
      var value = all.checked;
      rows.forEach(function (row, i) { setBox(i, value); });
      paint(false);
      shiftRun = null;
    });

    paint(true);
  }

  function initSplit() {
    var root = document.getElementById("split");
    var side = document.getElementById("split-side");
    var handle = document.getElementById("split-handle");
    var readout = document.getElementById("split-readout");
    if (!root || !handle || !side) return;
    var grip = handle.querySelector(".grip");
    var MIN = 120;
    var MAX = 320;
    var MAIN = 140;
    var lastOpen = 160;
    var screen = 160;
    var dragging = false;
    var startX = 0;
    var startW = 0;
    var moved = false;
    var raf = 0;
    var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) root.classList.add("is-coarse");

    function limit() {
      return Math.max(0, root.clientWidth - MAIN);
    }

    function fit(px) {
      if (px <= 0) return 0;
      var max = limit();
      if (max < 80) return 0;
      return Math.round(clamp(px, Math.min(MIN, max), Math.min(MAX, max)));
    }

    function render(px) {
      screen = px;
      root.style.setProperty("--side", px + "px");
      root.classList.toggle("is-collapsed", px === 0);
      side.inert = px === 0;
      handle.setAttribute("aria-valuenow", String(px));
      handle.setAttribute("aria-valuetext", px === 0 ? "Collapsed" : px + " pixels");
      if (readout) readout.textContent = px === 0 ? "Collapsed" : px + " px";
    }

    function tween(to) {
      cancelAnimationFrame(raf);
      var from = screen;
      if (!motionOn() || from === to) {
        render(to);
        return;
      }
      var t0 = performance.now();
      function step(now) {
        var t = Math.min(1, (now - t0) / 240);
        var e = 1 - Math.pow(1 - t, 3);
        render(Math.round(from + (to - from) * e));
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }

    function dragWidth(dx) {
      var proposed = Math.round(startW + dx);
      if (proposed < 60) return 0;
      var max = Math.min(MAX, limit());
      if (max < 80) return 0;
      return Math.round(clamp(proposed, MIN, max));
    }

    function moveGrip(e) {
      if (!grip || coarse) return;
      var rect = handle.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var y = clamp(e.clientY - rect.top, 8, Math.max(8, rect.height - 8));
      grip.style.top = (Math.round(y * dpr) / dpr) + "px";
    }

    function finish(commit) {
      if (!dragging) return false;
      dragging = false;
      if (grip) grip.classList.remove("is-down");
      document.body.style.userSelect = "";
      if (!commit) tween(startW);
      else if (screen > 0) lastOpen = screen;
      return true;
    }

    gestures.push(function () { return finish(false); });
    window.addEventListener("blur", function () { finish(false); });

    handle.addEventListener("pointerenter", function (e) {
      if (coarse || e.pointerType === "touch") return;
      moveGrip(e);
      if (grip) grip.classList.add("is-in");
    });
    handle.addEventListener("pointerleave", function () {
      if (dragging || coarse) return;
      if (grip) grip.classList.remove("is-in", "is-down");
    });
    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || dragging) return;
      e.preventDefault();
      dragging = true;
      moved = false;
      startX = e.clientX;
      startW = screen;
      if (grip) grip.classList.add("is-in", "is-down");
      document.body.style.userSelect = "none";
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    });
    handle.addEventListener("pointermove", function (e) {
    if (dragging) {
      if (!coarse && e.pointerType !== "touch") moveGrip(e);
      if (Math.abs(e.clientX - startX) > 2) moved = true;
        var next = dragWidth(e.clientX - startX);
        if ((next === 0 && screen !== 0) || (screen === 0 && next > 0)) tween(next);
        else {
          cancelAnimationFrame(raf);
          render(next);
        }
        return;
      }
      if (!coarse && e.pointerType !== "touch") moveGrip(e);
    });
    handle.addEventListener("pointerup", function () {
      var outside = !handle.matches(":hover");
      finish(true);
      if (outside && !coarse && grip) grip.classList.remove("is-in");
    });
    handle.addEventListener("pointercancel", function () { finish(false); });
    handle.addEventListener("dblclick", function () {
      if (moved) return;
      lastOpen = 160;
      tween(fit(160));
    });
    handle.addEventListener("focus", function () {
      if (grip) {
        grip.classList.add("is-in");
        grip.style.top = "50%";
      }
    });
    handle.addEventListener("blur", function () {
      if (!dragging && !coarse && grip) grip.classList.remove("is-in");
    });
    handle.addEventListener("keydown", function (e) {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      var max = Math.min(MAX, limit());
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        var step = (e.shiftKey ? 48 : 12) * (e.key === "ArrowLeft" ? -1 : 1);
        var base = screen === 0 ? MIN : screen;
        var next = clamp(base + step, MIN, Math.max(MIN, max));
        if (max < 80) next = 0;
        lastOpen = next || lastOpen;
        render(next);
      } else if (e.key === "Home") {
        e.preventDefault();
        render(0);
      } else if (e.key === "End") {
        e.preventDefault();
        lastOpen = Math.max(MIN, max);
        render(fit(lastOpen));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (screen === 0) render(fit(lastOpen));
        else render(0);
      }
    });
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (dragging) return;
        render(screen === 0 ? 0 : fit(lastOpen));
      }).observe(root);
    }
    render(fit(160));
  }

  function initTabs() {
    var root = document.getElementById("tabs");
    if (!root) return;
    var list = root.querySelector(".tablist");
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
    var line = document.getElementById("tab-line");
    function select(tab, animate) {
      tabs.forEach(function (item) {
        var on = item === tab;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(item.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      var x = tab.offsetLeft;
      var w = tab.offsetWidth;
      line.style.width = "100px";
      line.classList.toggle("is-animated", !!(animate && motionOn()));
      line.style.transform = "translateX(" + x + "px) scaleX(" + (w / 100) + ")";
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, true); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[Math.min(tabs.length - 1, i + 1)];
        else if (e.key === "ArrowLeft") next = tabs[Math.max(0, i - 1)];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        else return;
        if (next === tab) return;
        e.preventDefault();
        next.focus();
        select(next, false);
      });
    });
    select(tabs[0], false);
    window.addEventListener("resize", function () {
      var current = tabs.filter(function (tab) { return tab.getAttribute("aria-selected") === "true"; })[0];
      if (current) select(current, false);
    });
  }

  function initWorm() {
    var view = document.getElementById("worm-view");
    var track = document.getElementById("worm-track");
    var strip = document.getElementById("worm-strip");
    var count = document.getElementById("worm-count");
    var live = document.getElementById("worm-live");
    if (!view || !track || !strip) return;
    var ring = strip.querySelector(".worm-ring");
    var worm = strip.querySelector(".worm-body");
    var buttons = Array.prototype.slice.call(strip.querySelectorAll("[role='tab']"));
    var names = ["Dawn", "Noon", "Dusk", "Night"];
    var pos = 0;
    var mode = "idle";
    var goal = 0;
    var tweenFrom = 0;
    var tweenTo = 0;
    var tweenStart = 0;
    var tweenDur = 0;
    var raf = 0;
    var last = 0;
    var dragging = false;
    var moved = false;
    var downX = 0;
    var downY = 0;
    var downPos = 0;
    var announceTimer = 0;

    function smooth(t) { return t * t * (3 - 2 * t); }
    function gap() {
      var a = buttons[0].offsetLeft + buttons[0].offsetWidth / 2;
      var b = buttons[1].offsetLeft + buttons[1].offsetWidth / 2;
      return b - a > 1 ? b - a : 24;
    }
    function xAt(indexPos) {
      var origin = buttons[0].offsetLeft + buttons[0].offsetWidth / 2;
      return origin + indexPos * gap();
    }
    function indexFromX(clientX) {
      var rect = strip.getBoundingClientRect();
      var origin = buttons[0].offsetLeft + buttons[0].offsetWidth / 2;
      return clamp((clientX - rect.left - origin) / gap(), 0, buttons.length - 1);
    }
    function render() {
      var n = buttons.length;
      var p = clamp(pos, 0, n - 1);
      var i = Math.min(n - 1, Math.floor(p + 0.0001));
      var f = i === n - 1 ? 0 : p - i;
      var half = 6 / gap();
      var lead;
      var trail;
      if (f < 0.5) {
        var k = smooth(f / 0.5);
        trail = i - half;
        lead = i + half + k;
      } else {
        var k2 = smooth((f - 0.5) / 0.5);
        lead = i + 1 + half;
        trail = i - half + k2;
      }
      var left = xAt(trail);
      var right = xAt(lead);
      worm.style.left = left + "px";
      worm.style.width = Math.max(0, right - left) + "px";
      track.style.transform = "translateX(" + (-p * view.clientWidth) + "px)";
      var current = clamp(Math.round(p), 0, n - 1);
      buttons.forEach(function (btn, index) {
        btn.setAttribute("aria-selected", index === current ? "true" : "false");
        btn.tabIndex = index === current ? 0 : -1;
      });
      count.textContent = (current + 1) + " of " + n;
    }
    function announce() {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        var i = clamp(Math.round(pos), 0, names.length - 1);
        if (live) live.textContent = names[i];
        if (strip.contains(document.activeElement) && document.activeElement !== buttons[i]) buttons[i].focus();
      }, 250);
    }
    function loop(now) {
      if (mode === "catch") {
        var dt = Math.min(40, now - last || 16);
        var k = motionOn() ? 1 - Math.exp(-dt / 80) : 1;
        pos += (goal - pos) * k;
        if (!dragging && Math.abs(goal - pos) < 0.001) {
          pos = goal;
          mode = "idle";
        }
      } else if (mode === "tween") {
        var t = tweenDur <= 0 ? 1 : (now - tweenStart) / tweenDur;
        if (!motionOn() || t >= 1) {
          pos = tweenTo;
          mode = "idle";
        } else {
          var e = 1 - Math.pow(1 - t, 3);
          pos = tweenFrom + (tweenTo - tweenFrom) * e;
        }
      }
      last = now;
      render();
      if (mode !== "idle") raf = requestAnimationFrame(loop);
      else announce();
    }
    function wake() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function glide(index, dur) {
      tweenFrom = pos;
      tweenTo = index;
      tweenStart = performance.now();
      tweenDur = motionOn() ? dur : 0;
      mode = "tween";
      wake();
    }
    function moveRing(clientX) {
      var nearest = clamp(Math.round(indexFromX(clientX)), 0, buttons.length - 1);
      ring.style.left = (buttons[nearest].offsetLeft + buttons[nearest].offsetWidth / 2) + "px";
    }

    strip.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      downPos = pos;
      try { strip.setPointerCapture(e.pointerId); } catch (err) {}
    });
    strip.addEventListener("pointermove", function (e) {
      moveRing(e.clientX);
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) < 4) return;
      moved = true;
      strip.classList.add("is-drag");
      goal = indexFromX(e.clientX);
      mode = "catch";
      wake();
    });
    function release(e) {
      if (!dragging) return;
      dragging = false;
      strip.classList.remove("is-drag");
      var nearest = clamp(Math.round(indexFromX(e.clientX)), 0, buttons.length - 1);
      if (!moved) {
        var extra = Math.max(0, Math.abs(nearest - Math.round(downPos)) - 1);
        glide(nearest, 280 + extra * 40);
      } else glide(nearest, 180);
    }
    strip.addEventListener("pointerup", release);
    strip.addEventListener("pointercancel", function () {
      dragging = false;
      strip.classList.remove("is-drag");
      mode = "idle";
      render();
    });
    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function (e) {
        if (e.detail !== 0) return;
        pos = i;
        mode = "idle";
        render();
        announce();
      });
      btn.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = Math.min(buttons.length - 1, i + 1);
        else if (e.key === "ArrowLeft") next = Math.max(0, i - 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = buttons.length - 1;
        else return;
        e.preventDefault();
        pos = next;
        mode = "idle";
        render();
        buttons[next].focus();
        announce();
      });
    });
    render();
    ring.style.left = (buttons[0].offsetLeft + buttons[0].offsetWidth / 2) + "px";
  }

  function initOrder() {
    var wrap = document.getElementById("order-wrap");
    var list = document.getElementById("order");
    var line = document.getElementById("order-line");
    var live = document.getElementById("order-live");
    if (!wrap || !list || !line) return;
    var items = function () { return Array.prototype.slice.call(list.children); };
    var lifted = null;
    var keyboard = false;
    var homeNodes = null;
    var homeIndex = 0;
    var pointerId = null;
    var grabX = 0;
    var grabY = 0;
    var startX = 0;
    var startY = 0;
    var moved = false;
    var gap = 0;

    function labelOf(li) { return li.querySelector("button").textContent.trim(); }
    function say(text) { if (live) live.textContent = text; }

    function clearNudge(settle) {
      items().forEach(function (li) {
        if (li === lifted) return;
        li.style.transition = settle && motionOn() ? "transform 250ms " + EASE : "none";
        li.style.transform = "";
      });
    }

    function nudge(nextGap) {
      gap = nextGap;
      var sibs = items().filter(function (li) { return li !== lifted; });
      sibs.forEach(function (li, i) {
        var steps = i < gap ? gap - 1 - i : i - gap;
        if (steps < 0) steps = 0;
        var mag = motionOn() && !keyboard ? 8 * Math.pow(0.7, steps) : 0;
        var sign = i < gap ? -1 : 1;
        li.style.transition = motionOn() && !keyboard
          ? "transform 250ms " + EASE + " " + (steps * 24) + "ms"
          : "none";
        li.style.transform = mag ? "translateY(" + (sign * mag) + "px)" : "";
      });
      var y;
      if (!sibs.length) y = 0;
      else if (gap >= sibs.length) y = sibs[sibs.length - 1].offsetTop + sibs[sibs.length - 1].offsetHeight - 1;
      else y = sibs[gap].offsetTop;
      line.style.transform = "translateY(" + y + "px)";
      line.classList.add("is-on");
    }

    function gapFromY(y) {
      var sibs = items().filter(function (li) { return li !== lifted; });
      for (var i = 0; i < sibs.length; i++) {
        var rect = sibs[i].getBoundingClientRect();
        if (y < rect.top + rect.height / 2) return i;
      }
      return sibs.length;
    }

    function restoreHome() {
      if (!homeNodes) return;
      homeNodes.forEach(function (node) { list.appendChild(node); });
    }

    function dropPointer(cancel) {
      if (!lifted || keyboard) return false;
      var li = lifted;
      var rect = li.getBoundingClientRect();
      clearNudge(true);
      line.classList.remove("is-on");
      if (cancel) restoreHome();
      else {
        var sibs = items().filter(function (node) { return node !== li; });
        if (gap >= sibs.length) list.appendChild(li);
        else list.insertBefore(li, sibs[gap]);
      }
      var last = li.getBoundingClientRect();
      li.style.position = "";
      li.style.left = "";
      li.style.top = "";
      li.style.width = "";
      li.style.zIndex = "";
      li.style.margin = "";
      li.classList.remove("is-lifted");
      var landed = li.getBoundingClientRect();
      var dx = rect.left - landed.left;
      var dy = rect.top - landed.top;
      if (motionOn()) {
        li.style.transform = "translate(" + dx + "px," + dy + "px)";
        li.getBoundingClientRect();
        li.style.transition = "transform 250ms " + EASE;
        li.style.transform = "";
      }
      var index = items().indexOf(li);
      say((cancel ? "Canceled. " : "Dropped ") + labelOf(li) + " at position " + (index + 1) + " of " + items().length + ".");
      lifted = null;
      pointerId = null;
      homeNodes = null;
      return true;
    }

    function dropKeyboard() {
      if (!keyboard || !lifted) return false;
      var li = lifted;
      li.classList.remove("is-held");
      var index = items().indexOf(li);
      say("Dropped " + labelOf(li) + " at position " + (index + 1) + " of " + items().length + ".");
      lifted = null;
      keyboard = false;
      homeNodes = null;
      return true;
    }

    function cancelAny() {
      if (keyboard) {
        restoreHome();
        if (lifted) {
          lifted.classList.remove("is-held");
          var btn = lifted.querySelector("button");
          say("Canceled. " + labelOf(lifted) + " is back at position " + (homeIndex + 1) + ".");
          lifted = null;
          keyboard = false;
          homeNodes = null;
          if (btn) btn.focus();
        }
        return true;
      }
      if (lifted) return dropPointer(true);
      return false;
    }

    gestures.push(cancelAny);

    function liftPointer(li, e) {
      var rect = li.getBoundingClientRect();
      homeNodes = items();
      homeIndex = homeNodes.indexOf(li);
      lifted = li;
      keyboard = false;
      grabX = e.clientX - rect.left;
      grabY = e.clientY - rect.top;
      li.style.width = rect.width + "px";
      li.style.position = "fixed";
      li.style.left = rect.left + "px";
      li.style.top = rect.top + "px";
      li.style.zIndex = "30";
      li.style.margin = "0";
      li.classList.add("is-lifted");
      gap = homeIndex;
      nudge(gap);
    }

    list.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest && e.target.closest("button");
      if (!btn || e.button !== 0 || keyboard) return;
      var li = btn.closest("li");
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      moved = false;
      lifted = li;
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    });
    list.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pointerId || keyboard) return;
      if (!moved) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < 4) return;
        moved = true;
        liftPointer(lifted, e);
      }
      lifted.style.left = (e.clientX - grabX) + "px";
      lifted.style.top = (e.clientY - grabY) + "px";
      var next = gapFromY(e.clientY);
      if (next !== gap) nudge(next);
    });
    function endPointer(e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (!moved) {
        lifted = null;
        return;
      }
      dropPointer(false);
    }
    list.addEventListener("pointerup", endPointer);
    list.addEventListener("pointercancel", function (e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (moved) dropPointer(true);
      else lifted = null;
    });
    list.addEventListener("keydown", function (e) {
      var btn = e.target.closest && e.target.closest("button");
      if (!btn) return;
      var li = btn.closest("li");
      if (e.key === " " || e.key === "Enter") {
        if (e.repeat) return;
        e.preventDefault();
        if (keyboard) {
          dropKeyboard();
          return;
        }
        if (pointerId !== null) return;
        keyboard = true;
        lifted = li;
        homeNodes = items();
        homeIndex = homeNodes.indexOf(li);
        li.classList.add("is-held");
        say("Picked up " + labelOf(li) + ". Position " + (homeIndex + 1) + " of " + homeNodes.length + ". Use the arrow keys to move, Space to drop, Escape to cancel.");
      } else if (keyboard && lifted === li && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
        e.preventDefault();
        var nodes = items();
        var i = nodes.indexOf(li);
        var j = i;
        if (e.key === "ArrowDown") j = Math.min(nodes.length - 1, i + 1);
        else if (e.key === "ArrowUp") j = Math.max(0, i - 1);
        else if (e.key === "Home") j = 0;
        else j = nodes.length - 1;
        if (j === i) return;
        li.style.transition = "none";
        if (j < i) list.insertBefore(li, nodes[j]);
        else list.insertBefore(li, nodes[j].nextSibling);
        btn.focus({ preventScroll: true });
        say("Moved to position " + (j + 1) + " of " + nodes.length + ".");
      }
    });
    list.addEventListener("focusout", function () {
      if (!keyboard) return;
      requestAnimationFrame(function () {
        if (!keyboard) return;
        if (list.contains(document.activeElement)) return;
        dropKeyboard();
      });
    });
  }

  function initFaq() {
    var faq = document.getElementById("faq");
    if (!faq) return;
    var panel = faq.querySelector(".faq-panel");
    var items = Array.prototype.map.call(faq.querySelectorAll(".faq-item"), function (el) {
      return {
        el: el,
        button: el.querySelector("button"),
        answer: el.querySelector(".faq-a"),
        body: el.querySelector(".faq-body")
      };
    });
    var open = -1;
    var running = null;
    var reserve = 0;
    var EASE_IO = "cubic-bezier(0.45, 0, 0.2, 1)";

    function contentHeight(item) { return item.body.scrollHeight; }

    function measureReserve() {
      reserve = 0;
      items.forEach(function (item, i) {
        var total = 0;
        items.forEach(function (other, j) {
          total += other.button.offsetHeight;
          if (j === i) total += contentHeight(other);
        });
        if (total > reserve) reserve = total;
      });
    }

    function commitRunning() {
      if (!running) return;
      items.forEach(function (item) {
        item.answer.style.height = item.answer.getBoundingClientRect().height + "px";
      });
      var box = faq.getBoundingClientRect();
      var panelBox = panel.getBoundingClientRect();
      panel.style.top = (panelBox.top - box.top) + "px";
      panel.style.height = panelBox.height + "px";
      running.cancel();
      running = null;
    }

    function animateCopy(from, to, animate) {
      var down = to > from;
      items.forEach(function (item, i) {
        if (i !== from && i !== to) return;
        if (!animate || !motionOn()) return;
        if (i === from && from !== -1) {
          item.body.animate([
            { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
            { opacity: 0, transform: "translateY(" + (down ? 6 : -6) + "px)", filter: "blur(3px)" }
          ], { duration: 140, easing: EASE, fill: "forwards" });
        }
        if (i === to && to !== -1) {
          item.body.animate([
            { opacity: 0, transform: "translateY(" + (down ? -6 : 6) + "px)", filter: "blur(3px)" },
            { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }
          ], { duration: 210, delay: 90, easing: EASE, fill: "forwards" });
        }
      });
    }

    function go(index) {
      if (index === open) index = -1;
      var interrupt = !!running;
      commitRunning();
      var startHeights = items.map(function (item) { return item.answer.getBoundingClientRect().height; });
      var box = faq.getBoundingClientRect();
      var panelBox = panel.getBoundingClientRect();
      var startTop = panelBox.top - box.top;
      var startH = panelBox.height;
      var prev = open;
      open = index;
      items.forEach(function (item, i) {
        var on = i === index;
        item.button.setAttribute("aria-expanded", on ? "true" : "false");
      });
      faq.style.minHeight = index >= 0 ? reserve + "px" : "";
      var targets = items.map(function (item, i) { return i === index ? contentHeight(item) : 0; });
      items.forEach(function (item, i) { item.answer.style.height = targets[i] + "px"; });
      var endTop = index >= 0 ? items[index].el.offsetTop : startTop;
      var endH = index >= 0 ? items[index].el.offsetHeight : 0;
      items.forEach(function (item, i) { item.answer.style.height = startHeights[i] + "px"; });
      panel.style.opacity = "1";
      animateCopy(prev, index, true);
      var dur = motionOn() ? 300 : 0;
      var easing = interrupt ? EASE : EASE_IO;
      function finish() {
        items.forEach(function (item, i) { item.answer.style.height = targets[i] + "px"; });
        panel.style.top = endTop + "px";
        panel.style.height = endH + "px";
        panel.style.opacity = index >= 0 ? "1" : "0";
      }
      if (!dur) {
        finish();
        return;
      }
      var anims = items.map(function (item, i) {
        return item.answer.animate(
          [{ height: startHeights[i] + "px" }, { height: targets[i] + "px" }],
          { duration: dur, easing: easing, fill: "forwards" }
        );
      });
      anims.push(panel.animate(
        [{ top: startTop + "px", height: startH + "px" }, { top: endTop + "px", height: endH + "px" }],
        { duration: dur, easing: easing, fill: "forwards" }
      ));
      running = {
        cancel: function () { anims.forEach(function (anim) { anim.cancel(); }); }
      };
      anims[anims.length - 1].onfinish = function () {
        running = null;
        finish();
        anims.forEach(function (anim) { anim.cancel(); });
        finish();
      };
    }

    items.forEach(function (item, i) {
      item.answer.style.height = "0px";
      item.button.addEventListener("click", function () { go(i); });
    });
    faq.addEventListener("keydown", function (e) {
      var buttons = items.map(function (item) { return item.button; });
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === "ArrowDown") next = Math.min(buttons.length - 1, i + 1);
      else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = buttons.length - 1;
      else return;
      if (next === i) return;
      e.preventDefault();
      buttons[next].focus();
    });
    measureReserve();
    panel.style.opacity = "0";
    window.addEventListener("resize", function () {
      measureReserve();
      if (open < 0) {
        faq.style.minHeight = "";
        return;
      }
      faq.style.minHeight = reserve + "px";
      items[open].answer.style.height = contentHeight(items[open]) + "px";
      panel.style.top = items[open].el.offsetTop + "px";
      panel.style.height = items[open].el.offsetHeight + "px";
    });
  }

  function initRail() {
    var demo = document.getElementById("rail-demo");
    var nav = document.getElementById("rail");
    var card = document.getElementById("rail-card");
    var scroller = document.getElementById("rail-scroll");
    if (!demo || !nav || !card || !scroller) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var names = ["The quay", "The lamp", "The ledger", "The ramp", "The locker", "The night boat"];
    var blurbs = [
      "Where the night boat ties up.",
      "The green lamp at the north end.",
      "Names in the right-hand column.",
      "Down for ten minutes at each crossing.",
      "Brass tags on the east wall.",
      "Leaves the quay at 21:40."
    ];
    var current = 0;
    var lit = -1;
    var cardIndex = -1;
    var cardOpen = false;
    var openTimer = 0;
    var closeTimer = 0;
    var lastClose = -1000;
    var inside = false;
    var pointer = "mouse";
    var lockUntil = 0;

    function setTicks(pos, animate) {
      links.forEach(function (a, i) {
        var tick = a.querySelector(".tick");
        if (!animate || !motionOn()) tick.style.transition = "none";
        else tick.style.transition = "";
        var scale = 1 / 3;
        if (pos === null) scale = i === current ? 2 / 3 : 1 / 3;
        else {
          var d = Math.abs(i - pos);
          var w = (1 + Math.cos(Math.PI * Math.min(d / 3, 1))) / 2;
          scale = 1 / 3 + (2 / 3) * w;
        }
        tick.style.transform = "scaleX(" + scale.toFixed(4) + ")";
      });
    }

    function fillCard(index, animate) {
      var goingDown = cardIndex !== -1 && index >= cardIndex;
      var previous = card.querySelector(".rail-copy");
      if (cardIndex !== index) {
        var neu = document.createElement("div");
        neu.className = "rail-copy";
        var title = document.createElement("p");
        title.className = "rail-kicker";
        title.textContent = names[index];
        var blurb = document.createElement("p");
        blurb.textContent = blurbs[index];
        neu.appendChild(title);
        neu.appendChild(blurb);
        card.appendChild(neu);
        if (previous && animate && motionOn() && cardOpen) {
          var dir = goingDown ? 1 : -1;
          previous.animate([
            { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
            { opacity: 0, transform: "translateY(" + (4 * dir) + "px)", filter: "blur(3px)" }
          ], { duration: 120, easing: EASE, fill: "forwards" }).onfinish = function () { previous.remove(); };
          neu.animate([
            { opacity: 0, transform: "translateY(" + (-4 * dir) + "px)", filter: "blur(3px)" },
            { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }
          ], { duration: 180, easing: EASE });
        } else if (previous) previous.remove();
        cardIndex = index;
      }
      var demoBox = demo.getBoundingClientRect();
      var linkBox = links[index].getBoundingClientRect();
      var y = linkBox.top + linkBox.height / 2 - demoBox.top - card.offsetHeight / 2;
      y = clamp(y, 8, Math.max(8, demo.clientHeight - card.offsetHeight - 8));
      card.style.transition = animate && motionOn()
        ? "transform 200ms " + EASE + ", opacity 180ms " + EASE
        : "none";
      card.style.transform = "translateY(" + y + "px)";
    }

    function showCard(index, animate) {
      card.classList.add("is-open");
      card.style.opacity = "1";
      cardOpen = true;
      fillCard(index, animate);
      lit = index;
    }

    function hideCard(immediate) {
      cardOpen = false;
      lit = -1;
      card.style.transition = immediate || !motionOn() ? "none" : "opacity 120ms " + EASE;
      card.style.opacity = "0";
      card.classList.remove("is-open");
      lastClose = performance.now();
      setTicks(null, !immediate);
    }

    function queueOpen(index) {
      clearTimeout(closeTimer);
      if (cardOpen) {
        showCard(index, true);
        return;
      }
      if (openTimer) return;
      var delay = performance.now() - lastClose < 400 ? 0 : 80;
      openTimer = setTimeout(function () {
        openTimer = 0;
        if (!inside) return;
        showCard(lit >= 0 ? lit : index, false);
      }, motionOn() ? delay : 0);
    }

    nav.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      inside = true;
    });
    nav.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      inside = true;
      var rowH = links[0].getBoundingClientRect().height || 24;
      var y = e.clientY - links[0].getBoundingClientRect().top;
      setTicks(y / rowH - 0.5, true);
      lit = clamp(Math.floor(y / rowH), 0, links.length - 1);
      queueOpen(lit);
    });
    function leave(e) {
      if (e.relatedTarget && (nav.contains(e.relatedTarget) || card.contains(e.relatedTarget))) return;
      inside = false;
      clearTimeout(openTimer);
      openTimer = 0;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        if (!inside) hideCard(false);
      }, 120);
    }
    nav.addEventListener("pointerleave", leave);
    card.addEventListener("pointerenter", function () {
      inside = true;
      clearTimeout(closeTimer);
    });
    card.addEventListener("pointerleave", leave);

    function follow(index) {
      var section = sections[index];
      if (!section) return;
      var top = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      lockUntil = performance.now() + (motionOn() ? 500 : 0);
      scroller.scrollTo({ top: Math.max(0, top), behavior: motionOn() ? "smooth" : "auto" });
      setCurrent(index);
      section.focus({ preventScroll: true });
    }

    links.forEach(function (link, i) {
      link.addEventListener("pointerdown", function (e) { pointer = e.pointerType || "mouse"; });
      link.addEventListener("focus", function () {
        requestAnimationFrame(function () {
          if (!link.matches(":focus-visible")) return;
          inside = true;
          clearTimeout(closeTimer);
          setTicks(i, false);
          showCard(i, false);
        });
      });
      link.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown") next = Math.min(links.length - 1, i + 1);
        else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = links.length - 1;
        else return;
        e.preventDefault();
        links[next].focus();
      });
      link.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
        if (pointer === "touch" && (!cardOpen || cardIndex !== i)) {
          e.preventDefault();
          inside = true;
          setTicks(i, motionOn());
          showCard(i, false);
          return;
        }
        e.preventDefault();
        follow(i);
      });
    });
    card.addEventListener("click", function () {
      if (cardIndex >= 0) follow(cardIndex);
    });

    function setCurrent(index) {
      current = index;
      links.forEach(function (link, i) {
        if (i === index) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      if (!inside && !cardOpen) setTicks(null, false);
    }

    function onScroll() {
      if (performance.now() < lockUntil) return;
      var edge = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.3;
      var found = 0;
      sections.forEach(function (section, i) {
        if (section && section.getBoundingClientRect().top <= edge + 1) found = i;
      });
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) found = sections.length - 1;
      setCurrent(found);
    }

    scroller.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cardOpen) hideCard(true);
    });
    setCurrent(0);
    setTicks(null, false);
  }
})();

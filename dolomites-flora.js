(function () {
  "use strict";

  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";

  var elevStops = [
    { id: "summit", m: 1400 },
    { id: "pale", m: 1400 },
    { id: "transect", m: 1420 },
    { id: "montane", m: 1480 },
    { id: "elev-montane-mid", m: 1600 },
    { id: "elev-montane-note", m: 1740 },
    { id: "subalpine", m: 1900 },
    { id: "elev-sub-prose", m: 2080 },
    { id: "alpine", m: 2300 },
    { id: "elev-alpine-note", m: 2480 },
    { id: "nival", m: 2680 },
    { id: "elev-nival-prose", m: 2880 },
    { id: "index", m: 3100 }
  ];

  var sectionLinks = [
    { id: "pale", link: "transect" },
    { id: "transect", link: "transect" },
    { id: "montane", link: "montane" },
    { id: "subalpine", link: "subalpine" },
    { id: "alpine", link: "alpine" },
    { id: "nival", link: "nival" },
    { id: "index", link: "index" }
  ];

  var bandNames = {
    montane: "Montane",
    subalpine: "Subalpine",
    alpine: "Alpine",
    nival: "Nival"
  };

  var nav = document.getElementById("essay-nav");
  var statusEl = document.getElementById("elev-status");
  var chart = document.getElementById("elev-chart");
  var chartTitle = document.getElementById("chart-title");
  var panels = document.getElementById("band-panels");
  var hero = document.getElementById("summit");
  var art = document.querySelector(".hero-frame");
  var theme = document.querySelector('meta[name="theme-color"]');
  var links = document.querySelectorAll(".essay-links a");
  var fadeToken = 0;

  function siteH() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue("--site-header-h");
    var n = parseFloat(raw);
    return isNaN(n) ? 56 : n;
  }

  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function bandFor(m) {
    if (m < 1800) return "Montane";
    if (m < 2200) return "Subalpine";
    if (m < 2600) return "Alpine";
    return "Nival";
  }

  function formatM(m) {
    return m.toLocaleString("en-US");
  }

  function updateScroll() {
    var line = window.scrollY + siteH() + (nav ? nav.offsetHeight : 0);
    var pts = [];
    for (var i = 0; i < elevStops.length; i++) {
      var el = document.getElementById(elevStops[i].id);
      if (!el) continue;
      pts.push({ y: docTop(el), m: elevStops[i].m });
    }
    var meters = 1400;
    if (pts.length) {
      if (line <= pts[0].y) meters = pts[0].m;
      else if (line >= pts[pts.length - 1].y) meters = pts[pts.length - 1].m;
      else {
        var prev = pts[0];
        var next = pts[pts.length - 1];
        for (var j = 0; j < pts.length - 1; j++) {
          if (pts[j].y <= line && pts[j + 1].y >= line) {
            prev = pts[j];
            next = pts[j + 1];
            break;
          }
        }
        var span = next.y - prev.y;
        var t = span <= 0 ? 0 : (line - prev.y) / span;
        meters = Math.round(prev.m + (next.m - prev.m) * t);
      }
    }
    if (statusEl) statusEl.textContent = formatM(meters) + " m, " + bandFor(meters);

    var current = "";
    for (var s = 0; s < sectionLinks.length; s++) {
      var sec = document.getElementById(sectionLinks[s].id);
      if (sec && docTop(sec) <= line + 12) current = sectionLinks[s].link;
    }
    for (var k = 0; k < links.length; k++) {
      var on = links[k].getAttribute("data-link") === current && current !== "";
      if (on) links[k].setAttribute("aria-current", "true");
      else links[k].removeAttribute("aria-current");
    }

    if (nav) {
      var solid = window.scrollY > 8;
      var nival = document.getElementById("nival");
      var nivalOn = nival ? nival.getBoundingClientRect().top <= siteH() + nav.offsetHeight + 1 : false;
      nav.classList.toggle("is-solid", solid || nivalOn);
      nav.classList.toggle("is-nival", nivalOn);
      if (theme) theme.setAttribute("content", nivalOn ? "#101614" : "#f4f6f4");
    }

    if (art && hero && !reduce) {
      var top = hero.getBoundingClientRect().top;
      var shift = Math.max(-32, Math.min(16, top * -0.05));
      art.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
    } else if (art) {
      art.style.transform = "";
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateScroll();
    });
  }

  function bindRadios(root, onPick) {
    if (!root) return;
    var buttons = root.querySelectorAll("button");
    function pick(btn) {
      for (var i = 0; i < buttons.length; i++) {
        var on = buttons[i] === btn;
        buttons[i].setAttribute("aria-checked", on ? "true" : "false");
        buttons[i].tabIndex = on ? 0 : -1;
      }
      onPick(btn.getAttribute("data-band"));
    }
    for (var i = 0; i < buttons.length; i++) {
      (function (btn, index) {
        btn.addEventListener("click", function () { pick(btn); });
        btn.addEventListener("keydown", function (e) {
          var dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          var next = buttons[(index + dir + buttons.length) % buttons.length];
          next.focus();
          pick(next);
        });
      })(buttons[i], i);
    }
  }

  function applyBand(id) {
    if (!panels) return;
    var items = panels.querySelectorAll(".panel");
    for (var i = 0; i < items.length; i++) {
      items[i].hidden = items[i].getAttribute("data-for") !== id;
    }
    if (chart) chart.setAttribute("data-band", id);
    if (chartTitle) {
      chartTitle.textContent = "Elevation profile from 1,400 to 3,100 meters. " + (bandNames[id] || "Montane") + " band selected.";
    }
  }

  function selectBand(id) {
    if (reduce || !panels) {
      applyBand(id);
      return;
    }
    fadeToken += 1;
    var token = fadeToken;
    panels.classList.add("is-fading");
    window.setTimeout(function () {
      if (token !== fadeToken) return;
      applyBand(id);
      panels.classList.remove("is-fading");
    }, 140);
  }

  function applyFilter(band) {
    var rows = document.querySelectorAll("#specimens tbody tr");
    var n = 0;
    var lo = Infinity;
    var hi = -Infinity;
    for (var i = 0; i < rows.length; i++) {
      var show = band === "all" || rows[i].getAttribute("data-band") === band;
      rows[i].hidden = !show;
      if (!show) continue;
      n += 1;
      lo = Math.min(lo, +rows[i].getAttribute("data-lo"));
      hi = Math.max(hi, +rows[i].getAttribute("data-hi"));
    }
    var count = document.getElementById("spec-count");
    if (count && n > 0) {
      var word = n === 1 ? "specimen" : "specimens";
      count.textContent = "Showing " + n + " " + word + " across " + formatM(lo) + " to " + formatM(hi) + " m";
    }
  }

  bindRadios(document.getElementById("band-seg"), selectBand);
  bindRadios(document.getElementById("spec-seg"), applyFilter);

  var summitLinks = document.querySelectorAll('a[href="#summit"]');
  for (var i = 0; i < summitLinks.length; i++) {
    summitLinks[i].addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", "#summit");
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScroll();
})();

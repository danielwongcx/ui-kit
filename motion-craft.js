/* Motion craft. Ease on the hero (never spring). Spring curve only on the navbar indicator. */
(function () {
  "use strict";

  var reduce = document.documentElement.getAttribute("data-motion") === "reduce";
  var STEP = 0.05;

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function setPressed(btn, playingNow) {
    if (!btn) return;
    if (reduce) {
      btn.disabled = true;
      btn.textContent = "Held";
      btn.setAttribute("aria-pressed", "true");
      return;
    }
    btn.disabled = false;
    btn.textContent = playingNow ? "Pause" : "Play";
    btn.setAttribute("aria-pressed", playingNow ? "true" : "false");
  }

  /* ---------- Hierarchy ---------- */

  var heroCard = document.getElementById("hero-card");
  var heroTitle = document.getElementById("hero-title");
  var heroSub = document.getElementById("hero-sub");
  var heroPanel = document.getElementById("hero-panel");
  var heroStage = document.getElementById("hero-stage");
  var heroPlayBtn = document.querySelector('[data-study="hierarchy"][data-act="play"]');
  var heroReplayBtn = document.querySelector('[data-study="hierarchy"][data-act="replay"]');
  var heroPlaying = false;
  var heroRun = 0;
  var lastChar = null;
  var heroArmed = true;

  function holdHeroButtons() {
    if (!reduce) return;
    setPressed(heroPlayBtn, false);
    if (heroReplayBtn) {
      heroReplayBtn.disabled = true;
      heroReplayBtn.textContent = "Held";
    }
  }

  function setHeroPlay(playingNow) {
    heroPlaying = playingNow;
    if (reduce) {
      holdHeroButtons();
      return;
    }
    if (heroReplayBtn) {
      heroReplayBtn.disabled = false;
      heroReplayBtn.textContent = "Replay";
    }
    setPressed(heroPlayBtn, playingNow);
  }

  /* Last character begins at (slots - 1) * 0.05 and runs 0.4s.
     Subtitle starts 0.1s before that character finishes.
     Panel keeps the old 0.2s gap after the subtitle (0.55 - 0.35). */
  var CHAR_DUR = 0.4;
  var PANEL_DUR = 0.6;
  var OVERLAP = 0.1;
  var PANEL_GAP = 0.2;
  var subDelay = 0;
  var panelDelay = 0;

  function sec(n) {
    return (Math.round(n * 1000) / 1000).toFixed(2).replace(/0$/, "").replace(/(\.\d)0$/, "$1") + "s";
  }

  function splitTitle() {
    if (!heroTitle || heroTitle.getAttribute("data-split") === "true") return;
    var text = heroTitle.textContent.replace(/\s+/g, " ").trim();
    heroTitle.setAttribute("aria-label", text);
    heroTitle.textContent = "";
    var index = 0;
    text.split(" ").forEach(function (word, wi, words) {
      var wrap = document.createElement("span");
      wrap.className = "word";
      wrap.setAttribute("aria-hidden", "true");
      for (var c = 0; c < word.length; c++) {
        var span = document.createElement("span");
        span.className = "char";
        span.textContent = word[c];
        span.style.animationDelay = (index * STEP) + "s";
        wrap.appendChild(span);
        index += 1;
      }
      heroTitle.appendChild(wrap);
      if (wi < words.length - 1) {
        heroTitle.appendChild(document.createTextNode(" "));
        index += 1;
      }
    });
    heroTitle.setAttribute("data-split", "true");
    var chars = heroTitle.querySelectorAll(".char");
    lastChar = chars[chars.length - 1] || null;
    var lastStart = Math.max(0, index - 1) * STEP;
    subDelay = lastStart + CHAR_DUR - OVERLAP;
    panelDelay = subDelay + PANEL_GAP;
    if (heroCard) {
      heroCard.style.setProperty("--sub-delay", subDelay + "s");
      heroCard.style.setProperty("--panel-delay", panelDelay + "s");
    }
    var time = document.getElementById("hero-time");
    if (time) {
      time.textContent = "0.4s ease · 0.05s per character · subtitle " + sec(subDelay) + " · panel " + sec(panelDelay) + " / " + sec(PANEL_DUR);
    }
  }

  function onHeroEnd(e) {
    if (e.target !== heroPanel || e.animationName !== "hero-os") return;
    var id = Number(heroTitle.getAttribute("data-run") || "0");
    if (id !== heroRun) return;
    if (heroCard.classList.contains("is-paused")) return;
    setHeroPlay(false);
  }

  function restartHero() {
    if (reduce || !heroCard) return;
    heroRun += 1;
    heroTitle.setAttribute("data-run", String(heroRun));
    heroCard.classList.remove("is-paused");
    qsa(".char", heroTitle).forEach(function (el) { el.classList.remove("in"); });
    heroSub.classList.remove("in");
    heroPanel.classList.remove("in");
    void heroCard.offsetWidth;
    qsa(".char", heroTitle).forEach(function (el) { el.classList.add("in"); });
    heroSub.classList.add("in");
    heroPanel.classList.add("in");
    setHeroPlay(true);
  }

  function pauseHero() {
    heroCard.classList.add("is-paused");
    setHeroPlay(false);
  }

  function resumeHero() {
    heroCard.classList.remove("is-paused");
    setHeroPlay(true);
  }

  splitTitle();
  if (heroCard) heroCard.addEventListener("animationend", onHeroEnd);
  holdHeroButtons();

  if (!reduce && heroStage && "IntersectionObserver" in window) {
    var heroIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= 0.5) {
          if (!heroArmed) return;
          heroArmed = false;
          restartHero();
        } else if (entry.intersectionRatio < 0.15) {
          heroArmed = true;
        }
      });
    }, { threshold: [0, 0.15, 0.5] });
    heroIO.observe(heroCard);
  }

  /* ---------- Font reel ---------- */

  var reel = document.getElementById("reel");
  var slides = reel ? qsa(".slide", reel) : [];
  var reelLive = document.getElementById("reel-live");
  var reelPrev = document.querySelector('[data-study="pairs"][data-act="prev"]');
  var reelNext = document.querySelector('[data-study="pairs"][data-act="next"]');
  var reelScrollTimer = 0;

  function reelIndex() {
    var h = reel.clientHeight || 1;
    return Math.max(0, Math.min(slides.length - 1, Math.round(reel.scrollTop / h)));
  }

  function syncReelButtons() {
    var i = reelIndex();
    if (reelPrev) reelPrev.disabled = i <= 0;
    if (reelNext) reelNext.disabled = i >= slides.length - 1;
  }

  function announceReel(i) {
    if (!reelLive) return;
    var label = slides[i] && slides[i].getAttribute("aria-label");
    reelLive.textContent = label || "";
  }

  function goReel(index, behavior) {
    if (!reel) return;
    var i = Math.max(0, Math.min(slides.length - 1, index));
    var motion = behavior || (reduce ? "auto" : "smooth");
    reel.scrollTo({ top: i * reel.clientHeight, behavior: motion });
    syncReelButtons();
    announceReel(i);
  }

  function replayReel() {
    if (!reel) return;
    if (!reduce) {
      slides.forEach(function (slide) { slide.classList.remove("is-in"); });
    }
    reel.classList.add("reel-live");
    reel.scrollTo({ top: 0, behavior: "auto" });
    syncReelButtons();
    announceReel(0);
    if (reduce) return;
    window.requestAnimationFrame(function () {
      void reel.offsetWidth;
      if (slides[0]) slides[0].classList.add("is-in");
    });
  }

  if (reel && "IntersectionObserver" in window) {
    var reelIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (reduce) {
          entry.target.classList.add("is-in");
          return;
        }
        entry.target.classList.toggle("is-in", entry.isIntersecting);
      });
    }, { root: reel, threshold: 0.6 });
    slides.forEach(function (slide) { reelIO.observe(slide); });
    var reelPageIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reel.classList.add("reel-live");
      });
    }, { threshold: 0.35 });
    reelPageIO.observe(reel);
  } else {
    slides.forEach(function (slide) { slide.classList.add("is-in"); });
    if (reel) reel.classList.add("reel-live");
  }

  if (reel) {
    reel.addEventListener("keydown", function (e) {
      var i = reelIndex();
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goReel(i + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goReel(i - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goReel(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goReel(slides.length - 1);
      }
    });
    reel.addEventListener("scroll", function () {
      window.clearTimeout(reelScrollTimer);
      reelScrollTimer = window.setTimeout(syncReelButtons, 80);
    }, { passive: true });
    reel.addEventListener("scrollend", function () {
      syncReelButtons();
      announceReel(reelIndex());
    });
    syncReelButtons();
  }

  /* ---------- Navbar ---------- */

  var navbar = document.getElementById("nav-demo");
  var navScroll = document.querySelector(".nav-scroll");
  var navLinks = document.getElementById("nav-links");
  var indicator = document.getElementById("indicator");
  var navItems = navLinks ? qsa(".nav-item", navLinks) : [];
  var navPlayBtn = document.querySelector('[data-study="navbar"][data-act="play"]');
  var navReplayBtn = document.querySelector('[data-study="navbar"][data-act="replay"]');
  var committed = navItems[0] || null;
  var shown = committed;
  var demoWanted = !reduce;
  var demoTimer = 0;
  var navInView = false;

  function place(instant) {
    if (!indicator || !shown || !navLinks) return;
    if (instant) indicator.style.transition = "none";
    indicator.style.width = shown.offsetWidth + "px";
    indicator.style.transform = "translateX(" + shown.offsetLeft + "px)";
    if (instant) {
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
  }

  function commit(el, instant) {
    if (!el) return;
    navItems.forEach(function (item) { item.removeAttribute("aria-current"); });
    el.setAttribute("aria-current", "true");
    committed = el;
    shown = el;
    place(instant);
  }

  function preview(el) {
    shown = el;
    place(false);
  }

  function setNavPlay(playingNow) {
    setPressed(navPlayBtn, playingNow);
    if (!navReplayBtn) return;
    if (reduce) {
      navReplayBtn.disabled = true;
      navReplayBtn.textContent = "Held";
      return;
    }
    navReplayBtn.disabled = false;
    navReplayBtn.textContent = "Replay";
  }

  function tickOff() {
    window.clearInterval(demoTimer);
    demoTimer = 0;
    setNavPlay(false);
  }

  function stepDemo() {
    if (!navItems.length || !committed) return;
    var i = navItems.indexOf(committed);
    commit(navItems[(i + 1) % navItems.length], false);
  }

  function tickOn() {
    if (reduce || !demoWanted || !navInView || demoTimer) return;
    demoTimer = window.setInterval(stepDemo, 1200);
    setNavPlay(true);
  }

  function userStopDemo() {
    demoWanted = false;
    tickOff();
  }

  commit(committed, true);
  setNavPlay(false);
  if (reduce) setNavPlay(false);

  if (navLinks) {
    navItems.forEach(function (item, index) {
      item.addEventListener("mouseenter", function () {
        userStopDemo();
        preview(item);
      });
      item.addEventListener("focus", function () {
        userStopDemo();
        preview(item);
      });
      item.addEventListener("click", function () {
        userStopDemo();
        commit(item, false);
      });
      item.addEventListener("keydown", function (e) {
        var dest = null;
        if (e.key === "ArrowRight") dest = navItems[(index + 1) % navItems.length];
        else if (e.key === "ArrowLeft") dest = navItems[(index - 1 + navItems.length) % navItems.length];
        else if (e.key === "Home") dest = navItems[0];
        else if (e.key === "End") dest = navItems[navItems.length - 1];
        else return;
        e.preventDefault();
        userStopDemo();
        commit(dest, false);
        dest.focus();
      });
    });

    navLinks.addEventListener("mouseleave", function () {
      shown = committed;
      place(false);
    });

    navLinks.addEventListener("focusout", function (e) {
      if (!navLinks.contains(e.relatedTarget)) {
        shown = committed;
        place(false);
      }
    });
  }

  if (navbar) {
    navbar.addEventListener("pointerenter", function () {
      userStopDemo();
    });
  }

  function syncNavFade() {
    if (!navScroll) return;
    var more = navScroll.scrollLeft + navScroll.clientWidth < navScroll.scrollWidth - 2;
    var less = navScroll.scrollLeft > 2;
    navScroll.classList.toggle("fade-right", more);
    navScroll.classList.toggle("fade-left", less);
  }

  if (navScroll) {
    navScroll.addEventListener("scroll", syncNavFade, { passive: true });
    syncNavFade();
  }

  if (typeof ResizeObserver !== "undefined" && navLinks) {
    var navRO = new ResizeObserver(function () {
      place(true);
      syncNavFade();
    });
    navRO.observe(navLinks);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      place(true);
      syncNavFade();
    });
  }

  if (!reduce && navbar && "IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navInView = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        if (navInView) tickOn();
        else {
          window.clearInterval(demoTimer);
          demoTimer = 0;
          setNavPlay(false);
        }
      });
    }, { threshold: [0, 0.4] });
    navIO.observe(navbar);
  }

  /* ---------- Jump ---------- */

  var jumpLinks = qsa(".jump a");
  if (jumpLinks.length && "IntersectionObserver" in window) {
    var jumpIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        jumpLinks.forEach(function (link) {
          if (link.getAttribute("href") === id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    qsa(".study").forEach(function (study) { jumpIO.observe(study); });
  }

  /* ---------- Controls ---------- */

  qsa("[data-study]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var study = btn.getAttribute("data-study");
      var act = btn.getAttribute("data-act");
      if (study === "hierarchy") {
        if (reduce) return;
        if (act === "replay") {
          restartHero();
          return;
        }
        if (act === "play") {
          if (heroCard.classList.contains("is-paused")) resumeHero();
          else if (heroPlaying) pauseHero();
          else restartHero();
        }
        return;
      }
      if (study === "pairs") {
        var i = reelIndex();
        if (act === "prev") goReel(i - 1);
        else if (act === "next") goReel(i + 1);
        else if (act === "replay") replayReel();
        return;
      }
      if (study === "navbar") {
        if (reduce) return;
        if (act === "replay") {
          demoWanted = true;
          commit(navItems[0], false);
          window.clearInterval(demoTimer);
          demoTimer = 0;
          tickOn();
          return;
        }
        if (act === "play") {
          if (demoTimer) userStopDemo();
          else {
            demoWanted = true;
            tickOn();
          }
        }
      }
    });
  });
})();

/* Frontend handbook: TOC, scrubbers, and kinetic recipes. Compare toggles are CSS. */
(function () {
  'use strict';

  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return reduceMq.matches; }

  var toggle = document.getElementById('toc-toggle');
  var toc = document.getElementById('toc');
  var currentEl = document.getElementById('toc-current');
  var parts = Array.prototype.slice.call(document.querySelectorAll('.part'));

  function mark(id) {
    if (!toc) return;
    toc.querySelectorAll('a').forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    var part = document.getElementById(id);
    if (part && currentEl) {
      currentEl.textContent = part.getAttribute('data-title') || '';
    }
  }

  function currentByScroll() {
    if (!parts.length) return;
    var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 56)
      + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toc-h')) || 0)
      + 24;
    var best = parts[0];
    parts.forEach(function (part) {
      if (part.getBoundingClientRect().top - line <= 8) best = part;
    });
    mark(best.id);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      currentByScroll();
    });
  }, { passive: true });
  currentByScroll();

  if (toc && toggle) {
    toc.addEventListener('click', function (e) {
      if (e.target.closest('a')) toggle.checked = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggle.checked = false;
    });
    document.addEventListener('click', function (e) {
      if (!toggle.checked) return;
      if (e.target.closest('.toc') || e.target.closest('.toc-bar') || e.target === toggle) return;
      toggle.checked = false;
    });
  }

  function clampSize(minRem, vw, maxRem, viewport) {
    var min = minRem * 16;
    var max = maxRem * 16;
    var pref = (vw / 100) * viewport;
    return Math.round(Math.min(max, Math.max(min, pref)) * 10) / 10;
  }

  var TIERS = [
    ['Caption', 0.875, 1.5, 1],
    ['Body', 1, 2, 1.125],
    ['Subhead', 1.25, 3, 1.75],
    ['Section', 1.5, 4, 2.5],
    ['Hero', 2.25, 6, 4.5]
  ];

  function paintTiers(px) {
    var list = document.getElementById('tier-read');
    if (!list) return;
    list.innerHTML = '';
    TIERS.forEach(function (tier) {
      var row = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = tier[0];
      dd.textContent = clampSize(tier[1], tier[2], tier[3], px) + 'px';
      row.appendChild(dt);
      row.appendChild(dd);
      list.appendChild(row);
    });
  }

  function bindFrames() {
    document.querySelectorAll('[data-frame-range]').forEach(function (input) {
      var frame = document.getElementById(input.getAttribute('data-frame-range'));
      var host = frame && (frame.closest('.frame-view') || frame.parentElement);
      var out = document.getElementById(input.getAttribute('data-frame-out') || '');
      if (!frame || !host) return;
      function apply() {
        var cs = getComputedStyle(host);
        var pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        var max = Math.max(160, Math.floor(host.clientWidth - pad));
        input.max = String(max);
        var v = Math.max(160, Math.min(Number(input.value) || max, max));
        if (Number(input.value) !== v) input.value = String(v);
        frame.style.width = v + 'px';
        if (out) out.textContent = Math.round(v) + 'px';
      }
      input.addEventListener('input', apply);
      window.addEventListener('resize', apply);
      apply();
    });
  }
  bindFrames();

  var fluidRange = document.getElementById('fluid-range');
  var fluidOut = document.getElementById('fluid-out');
  var fluidHero = document.querySelector('.fluid-frame__hero');
  var fluidBody = document.querySelector('.fluid-frame__body');
  function paintFluid() {
    if (!fluidRange) return;
    var w = Number(fluidRange.value);
    if (fluidOut) fluidOut.textContent = w + 'px';
    paintTiers(w);
    if (fluidHero) fluidHero.style.fontSize = clampSize(2.25, 6, 4.5, w) + 'px';
    if (fluidBody) fluidBody.style.fontSize = clampSize(1, 2, 1.125, w) + 'px';
  }
  if (fluidRange) {
    fluidRange.addEventListener('input', paintFluid);
    paintFluid();
  }

  var winPx = document.getElementById('win-px');
  var winFont = document.getElementById('win-font');
  var winSample = document.getElementById('win-sample');
  function paintWindow() {
    if (winPx) winPx.textContent = window.innerWidth + 'px';
    if (winFont && winSample) {
      winFont.textContent = Math.round(parseFloat(getComputedStyle(winSample).fontSize)) + 'px';
    }
  }
  paintWindow();
  window.addEventListener('resize', paintWindow);

  function runEase(btn) {
    var track = btn.querySelector('.ease__track');
    var dot = track && track.querySelector('i');
    if (!dot) return;
    var name = btn.getAttribute('data-ease');
    var dist = Math.max(0, track.clientWidth - dot.offsetWidth - 6);
    var timing = getComputedStyle(document.documentElement).getPropertyValue('--ease-' + name).trim() || 'ease';
    dot.getAnimations().forEach(function (anim) { anim.cancel(); });
    if (reduced()) {
      dot.style.transform = 'translate3d(' + dist + 'px, 0, 0)';
      return;
    }
    dot.style.transform = '';
    dot.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(' + dist + 'px, 0, 0)' }
    ], { duration: 650, easing: timing, fill: 'forwards' });
  }

  document.querySelectorAll('.ease').forEach(function (btn) {
    btn.addEventListener('click', function () { runEase(btn); });
  });
  var easeAll = document.getElementById('ease-all');
  if (easeAll) {
    easeAll.addEventListener('click', function () {
      document.querySelectorAll('.ease').forEach(runEase);
    });
  }

  document.querySelectorAll('[data-drawer]').forEach(function (root) {
    var btn = root.querySelector('[data-drawer-toggle]');
    var panel = root.querySelector('[data-drawer-panel]');
    var scrim = root.querySelector('[data-drawer-scrim]');
    function set(open) {
      root.classList.toggle('is-open', open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (btn) {
      btn.addEventListener('click', function () {
        set(!root.classList.contains('is-open'));
      });
    }
    if (scrim) scrim.addEventListener('click', function () { set(false); });
    root.querySelectorAll('[data-nav]').forEach(function (item) {
      item.addEventListener('click', function () {
        root.querySelectorAll('[data-nav]').forEach(function (other) {
          other.classList.toggle('is-on', other === item);
        });
        if (panel && getComputedStyle(panel).position === 'absolute') set(false);
      });
    });
    root._closeDrawer = function () { set(false); };
  });

  var trap = document.getElementById('r4-trap');
  var r4 = document.getElementById('r4');
  if (trap && r4) {
    trap.addEventListener('change', function () {
      r4.classList.toggle('is-trap', trap.checked);
    });
  }

  function placeGhost(nav, el) {
    var ghost = nav.querySelector('.magnet__ghost');
    if (!ghost || !el) return;
    ghost.style.opacity = '1';
    ghost.style.transform = 'translate3d(' + el.offsetLeft + 'px,' + el.offsetTop + 'px,0)';
    ghost.style.width = el.offsetWidth + 'px';
    ghost.style.height = el.offsetHeight + 'px';
  }

  document.querySelectorAll('[data-magnet]').forEach(function (nav) {
    var tabs = Array.prototype.slice.call(nav.querySelectorAll('[data-tab]'));
    var current = tabs[0];
    function select(el) {
      current = el;
      tabs.forEach(function (tab) {
        if (tab === el) tab.setAttribute('aria-current', 'true');
        else tab.removeAttribute('aria-current');
      });
      placeGhost(nav, el);
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('mouseenter', function () { placeGhost(nav, tab); });
      tab.addEventListener('focus', function () { placeGhost(nav, tab); });
      tab.addEventListener('click', function () { select(tab); });
    });
    nav.addEventListener('mouseleave', function () { placeGhost(nav, current); });
    nav.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      select(next);
    });
    select(current);
    window.addEventListener('resize', function () { placeGhost(nav, current); });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { placeGhost(nav, current); }).observe(nav);
    }
  });

  var fab = document.getElementById('fab');
  var fabBtn = document.getElementById('fab-trigger');
  var fabStatus = document.getElementById('fab-status');
  function setFab(open) {
    if (!fab || !fabBtn) return;
    fab.classList.toggle('is-active', open);
    fabBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    fabBtn.setAttribute('aria-label', open ? 'Close actions' : 'Expand actions');
    if (fabStatus) {
      if (open) fabStatus.textContent = 'Choose an action';
      else if (fabStatus.textContent === 'Choose an action') fabStatus.textContent = 'Actions closed';
    }
  }
  if (fabBtn) {
    fabBtn.addEventListener('click', function () {
      setFab(!fab.classList.contains('is-active'));
    });
  }
  document.querySelectorAll('.fab__child').forEach(function (child) {
    child.addEventListener('click', function () {
      if (fabStatus) fabStatus.textContent = child.getAttribute('data-label') || 'Action';
      setFab(false);
    });
  });

  document.querySelectorAll('.shine').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.remove('is-sweep');
      void btn.offsetWidth;
      btn.classList.add('is-sweep');
      window.setTimeout(function () { btn.classList.remove('is-sweep'); }, 800);
    });
  });

  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cls = btn.getAttribute('data-toggle');
      var on = btn.classList.toggle(cls);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  function bumpCount(root) {
    var badge = root.querySelector('[data-fly-count]');
    if (!badge) return 0;
    var n = (parseInt(badge.textContent, 10) || 0) + 1;
    badge.textContent = String(n);
    return n;
  }

  function bounce(el) {
    if (!el || reduced()) return;
    el.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' }
    ], { duration: 250, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  }

  document.querySelectorAll('[data-fly]').forEach(function (root) {
    var source = root.querySelector('[data-fly-source]');
    var target = root.querySelector('[data-fly-target]');
    var button = root.querySelector('[data-fly-btn]');
    var status = root.querySelector('[data-fly-status]');
    if (!source || !target || !button) return;
    var when = root.getAttribute('data-fly-when') || 'finish';
    button.addEventListener('click', function () {
      var start = source.getBoundingClientRect();
      var dest = target.getBoundingClientRect();
      if (start.width < 2 || dest.width < 2) return;
      if (when === 'start') {
        var early = bumpCount(root);
        if (status) status.textContent = 'Counter moved to ' + early + ' before the throw landed';
      }
      var clone = source.cloneNode(true);
      clone.removeAttribute('id');
      Object.assign(clone.style, {
        position: 'fixed',
        top: start.top + 'px',
        left: start.left + 'px',
        width: start.width + 'px',
        height: start.height + 'px',
        margin: '0',
        zIndex: '9999',
        pointerEvents: 'none',
        borderRadius: getComputedStyle(source).borderRadius
      });
      document.body.appendChild(clone);
      var dx = (dest.left + dest.width / 2) - (start.left + start.width / 2);
      var dy = (dest.top + dest.height / 2) - (start.top + start.height / 2);
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        clone.remove();
        if (when !== 'start') {
          var n = bumpCount(root);
          if (status) status.textContent = n + ' in the cart';
        }
        bounce(target);
      }
      if (reduced()) {
        done();
        return;
      }
      var flight = clone.animate([
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
        { transform: 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale(0.15)', opacity: 0.25 }
      ], {
        duration: 700,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        fill: 'forwards'
      });
      flight.onfinish = done;
    });
  });

  var destruct = document.getElementById('destruct');
  if (destruct) {
    var sku = destruct.querySelector('[data-destruct-source]');
    var basket = destruct.querySelector('[data-destruct-target]');
    var go = destruct.querySelector('[data-destruct-go]');
    var reset = destruct.querySelector('[data-destruct-reset]');
    var thrown = false;
    go.addEventListener('click', function () {
      if (thrown) return;
      var start = sku.getBoundingClientRect();
      var dest = basket.getBoundingClientRect();
      if (start.width < 2 || dest.width < 2) return;
      thrown = true;
      Object.assign(sku.style, {
        position: 'fixed',
        left: start.left + 'px',
        top: start.top + 'px',
        width: start.width + 'px',
        height: start.height + 'px',
        margin: '0',
        zIndex: '9999'
      });
      var anim = sku.animate([
        { left: start.left + 'px', top: start.top + 'px' },
        { left: dest.left + 'px', top: dest.top + 'px' }
      ], {
        duration: reduced() ? 0 : 700,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        fill: 'forwards'
      });
      anim.onfinish = function () {
        sku.classList.add('is-gone');
      };
    });
    reset.addEventListener('click', function () {
      thrown = false;
      sku.getAnimations().forEach(function (anim) { anim.cancel(); });
      sku.classList.remove('is-gone');
      sku.removeAttribute('style');
    });
  }

  var PLAY = [7, 5, 7, 5, 17, 12, 7, 19, 17, 12, 17, 12, 17, 12, 17, 12];
  var PAUSE = [6, 5, 10, 5, 10, 19, 6, 19, 14, 5, 18, 5, 18, 19, 14, 19];

  function pathD(n) {
    function sub(o) {
      return 'M' + n[o] + ' ' + n[o + 1]
        + 'L' + n[o + 2] + ' ' + n[o + 3]
        + 'L' + n[o + 4] + ' ' + n[o + 5]
        + 'L' + n[o + 6] + ' ' + n[o + 7] + 'Z';
    }
    return sub(0) + sub(8);
  }

  function unitBezier(x1, y1, x2, y2) {
    function A(a, b) { return 1 - 3 * b + 3 * a; }
    function B(a, b) { return 3 * b - 6 * a; }
    function C(a) { return 3 * a; }
    function calc(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 6; i++) {
        var s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-4) break;
        t -= (calc(t, x1, x2) - x) / s;
        t = Math.max(0, Math.min(1, t));
      }
      return calc(t, y1, y2);
    };
  }
  var morphEase = unitBezier(0.25, 0.1, 0.25, 1);

  document.querySelectorAll('[data-morph]').forEach(function (btn) {
    var path = document.getElementById(btn.getAttribute('data-morph'));
    var shake = btn.parentElement.querySelector('[data-shake]');
    if (!path) return;
    var current = PLAY.slice();
    var paused = false;
    path.setAttribute('d', pathD(current));
    btn.addEventListener('click', function () {
      paused = !paused;
      btn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      var from = current.slice();
      var to = paused ? PAUSE : PLAY;
      var t0 = performance.now();
      var dur = reduced() ? 0 : 300;
      function frame(now) {
        var t = dur === 0 ? 1 : Math.min(1, (now - t0) / dur);
        var e = morphEase(t);
        for (var i = 0; i < to.length; i++) current[i] = from[i] + (to[i] - from[i]) * e;
        path.setAttribute('d', pathD(current));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      if (shake && !reduced()) {
        shake.classList.remove('is-rejected');
        void shake.offsetWidth;
        shake.classList.add('is-rejected');
      }
    });
  });

  var snapBtn = document.getElementById('snap-btn');
  var snapPath = document.getElementById('snap-path');
  if (snapBtn && snapPath) {
    var snapPlay = 'M8,5.14V19.14L19,12.14L8,5.14Z';
    var snapPause = 'M6,19h4V5H6v14Zm8-14v14h4V5h-4Z';
    var snapOn = false;
    snapBtn.addEventListener('click', function () {
      snapOn = !snapOn;
      snapPath.setAttribute('d', snapOn ? snapPause : snapPlay);
      snapBtn.setAttribute('aria-pressed', snapOn ? 'true' : 'false');
    });
  }

  var stepRange = document.getElementById('step-range');
  var stepOut = document.getElementById('step-out');
  var stepBefore = document.getElementById('step-before');
  var stepAfter = document.getElementById('step-after');
  var stepBeforePx = document.getElementById('step-before-px');
  var stepAfterPx = document.getElementById('step-after-px');
  var lastStep = null;
  function steppedSize(w) {
    if (w < 640) return 16;
    if (w < 768) return 20;
    if (w < 1024) return 32;
    return 48;
  }
  function paintStep() {
    if (!stepRange) return;
    var w = Number(stepRange.value);
    if (stepOut) stepOut.textContent = w + 'px';
    var stepped = steppedSize(w);
    var fluid = clampSize(1.5, 4, 3, w);
    if (stepBefore) {
      stepBefore.style.fontSize = stepped + 'px';
      if (lastStep !== null && lastStep !== stepped) {
        stepBefore.classList.remove('is-snap');
        void stepBefore.offsetWidth;
        stepBefore.classList.add('is-snap');
        window.setTimeout(function () { stepBefore.classList.remove('is-snap'); }, 350);
      }
      lastStep = stepped;
    }
    if (stepAfter) stepAfter.style.fontSize = fluid + 'px';
    if (stepBeforePx) stepBeforePx.textContent = stepped + 'px · jumps at 640, 768, 1024';
    if (stepAfterPx) stepAfterPx.textContent = fluid + 'px · clamp(1.5rem, 4vw, 3rem)';
  }
  if (stepRange) {
    stepRange.addEventListener('input', paintStep);
    paintStep();
  }

  var thrashBtn = document.getElementById('thrash-run');
  function runThrash() {
    document.querySelectorAll('[data-thrash]').forEach(function (box) {
      box.getAnimations().forEach(function (anim) { anim.cancel(); });
      var track = box.parentElement;
      var dist = Math.max(0, track.clientWidth - box.offsetWidth - 16);
      var mode = box.getAttribute('data-thrash');
      if (reduced()) {
        if (mode === 'left') box.style.left = (8 + dist) + 'px';
        else box.style.transform = 'translate3d(' + dist + 'px,0,0)';
        return;
      }
      if (mode === 'left') {
        box.style.transform = '';
        box.animate([
          { left: '8px' },
          { left: (8 + dist) + 'px' }
        ], { duration: 900, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' });
      } else {
        box.style.left = '8px';
        box.animate([
          { transform: 'translate3d(0,0,0)' },
          { transform: 'translate3d(' + dist + 'px,0,0)' }
        ], { duration: 900, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' });
      }
    });
  }
  if (thrashBtn) thrashBtn.addEventListener('click', runThrash);

  var form = document.getElementById('cred-form');
  if (form) {
    var formStatus = document.getElementById('form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formStatus) formStatus.textContent = 'Changes saved';
    });
    var cancel = document.getElementById('form-cancel');
    if (cancel) {
      cancel.addEventListener('click', function () {
        form.reset();
        if (formStatus) formStatus.textContent = '';
      });
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-drawer]').forEach(function (root) {
      if (root._closeDrawer) root._closeDrawer();
    });
    setFab(false);
  });

  if (reduced()) {
    document.querySelectorAll('svg').forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }
})();

/* Refactor UI handbook: TOC state, sliders, checklist. Compare toggles are CSS. */
(function () {
  'use strict';

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
      currentEl.textContent = part.getAttribute('data-title') || part.querySelector('h2').textContent;
    }
  }

  function currentByScroll() {
    if (!parts.length) return;
    var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 56) + 24;
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

  document.querySelectorAll('input[data-prop]').forEach(function (input) {
    var target = document.getElementById(input.getAttribute('data-target'));
    var out = input.parentElement && input.parentElement.querySelector('output');
    function apply() {
      if (target) target.style.setProperty(input.getAttribute('data-prop'), input.value);
      if (out) out.textContent = input.value + (input.getAttribute('data-suffix') || '');
    }
    input.addEventListener('input', apply);
    apply();
  });

  var hsl = document.getElementById('hsl-demo');
  if (hsl) {
    var h = hsl.querySelector('[data-hsl="h"]');
    var s = hsl.querySelector('[data-hsl="s"]');
    var l = hsl.querySelector('[data-hsl="l"]');
    var swatch = hsl.querySelector('.hsl__swatch');
    var read = hsl.querySelector('.hsl__read');
    function hex(hv, sv, lv) {
      sv /= 100;
      lv /= 100;
      var a = sv * Math.min(lv, 1 - lv);
      function f(n) {
        var k = (n + hv / 30) % 12;
        var c = lv - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, '0');
      }
      return '#' + f(0) + f(8) + f(4);
    }
    function paint() {
      var hv = Number(h.value);
      var sv = Number(s.value);
      var lv = Number(l.value);
      var color = 'hsl(' + hv + ' ' + sv + '% ' + lv + '%)';
      swatch.style.background = color;
      read.innerHTML = color + ' <span>' + hex(hv, sv, lv) + '</span>';
    }
    [h, s, l].forEach(function (el) { el.addEventListener('input', paint); });
    paint();
  }

  var storeKey = 'refactor-ui-habits';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; } catch (e) { saved = {}; }
  document.querySelectorAll('[data-habit]').forEach(function (box) {
    var id = box.getAttribute('data-habit');
    box.checked = !!saved[id];
    box.addEventListener('change', function () {
      saved[id] = box.checked;
      try { localStorage.setItem(storeKey, JSON.stringify(saved)); } catch (err) {}
    });
  });
})();

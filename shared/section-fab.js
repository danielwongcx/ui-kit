/**
 * Collapsible .sec sections + floating speed-dial FAB.
 * SECTION_LINKS is chosen from data-page (gallery vs taste).
 * Register new sections in the matching map (id must match section id).
 */
(function () {
  'use strict';

  var GALLERY_SECTION_LINKS = [
    { id: 'digits', label: 'Digits' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'cards', label: 'Cards' },
    { id: 'palettes', label: 'Palettes' },
    { id: 'select', label: 'Select' },
    { id: 'glow-border', label: 'Glow border' },
    { id: 'folder', label: 'Folder' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'hierarchy', label: 'Hierarchy' },
    { id: 'color-combos', label: 'Color combos' }
  ];

  var TASTE_SECTION_LINKS = [
    { id: 'motion', label: 'Motion' },
    { id: 'app', label: 'App' },
    { id: 'buttons', label: 'Buttons+' },
    { id: 'states', label: 'States' },
    { id: 'forms', label: 'Forms' },
    { id: 'cards', label: 'Cards+' },
    { id: 'palettes', label: 'Palettes' },
    { id: 'digest-strip', label: 'Digest' }
  ];

  function sectionLinksForPage() {
    var page = document.body && document.body.getAttribute('data-page');
    if (page === 'taste') return TASTE_SECTION_LINKS;
    return GALLERY_SECTION_LINKS;
  }

  var SECTION_LINKS = sectionLinksForPage();

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  function wrapSectionBodies() {
    var secs = document.querySelectorAll('.sec');
    secs.forEach(function (sec) {
      if (Array.prototype.some.call(sec.children, function (el) { return el.classList && el.classList.contains('sec-body'); })) return;
      var head = Array.prototype.filter.call(sec.children, function (el) { return el.classList && el.classList.contains('sec-head'); })[0];
      if (!head) return;

      var body = document.createElement('div');
      body.className = 'sec-body';
      var inner = document.createElement('div');
      inner.className = 'sec-body__inner';

      var node = head.nextSibling;
      while (node) {
        var next = node.nextSibling;
        inner.appendChild(node);
        node = next;
      }
      body.appendChild(inner);
      sec.appendChild(body);

      if (!head.querySelector('.sec-toggle')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sec-toggle';
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-label', 'Collapse section');
        btn.innerHTML = '<span class="sec-toggle__icon" aria-hidden="true"></span>';
        /* place immediately after h2 so title + chevron share a row */
        var h2 = head.querySelector('h2');
        if (h2 && h2.nextSibling) head.insertBefore(btn, h2.nextSibling);
        else if (h2) head.appendChild(btn);
        else head.insertBefore(btn, head.firstChild);

        btn.addEventListener('click', function () {
          var collapsed = sec.classList.toggle('is-collapsed');
          btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          btn.setAttribute('aria-label', collapsed ? 'Expand section' : 'Collapse section');
        });
      }

      /* default expanded */
      sec.classList.remove('is-collapsed');
    });
  }

  function expandSection(sec) {
    if (!sec) return;
    sec.classList.remove('is-collapsed');
    var btn = sec.querySelector('.sec-toggle');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Collapse section');
    }
  }

  function flashSection(sec) {
    if (!sec) return;
    sec.classList.remove('sec-flash');
    /* reflow to restart animation */
    void sec.offsetWidth;
    sec.classList.add('sec-flash');
    window.setTimeout(function () {
      sec.classList.remove('sec-flash');
    }, 950);
  }

  function goToSection(id, closeDial) {
    var sec = document.getElementById(id);
    if (!sec) return;
    expandSection(sec);
    if (typeof closeDial === 'function') closeDial();
    var behavior = reduceMotion ? 'auto' : 'smooth';
    try {
      sec.scrollIntoView({ behavior: behavior, block: 'start' });
    } catch (e) {
      sec.scrollIntoView(true);
    }
    flashSection(sec);
  }

  function buildFab() {
    if (document.querySelector('.sec-fab')) return;

    var wrap = document.createElement('div');
    wrap.className = 'sec-fab-wrap';

    var fab = document.createElement('div');
    fab.className = 'sec-fab';
    fab.setAttribute('role', 'navigation');
    fab.setAttribute('aria-label', 'Jump to sections');

    var dial = document.createElement('div');
    dial.className = 'sec-fab__dial';
    dial.setAttribute('role', 'menu');

    SECTION_LINKS.forEach(function (item) {
      if (!document.getElementById(item.id)) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sec-fab__item';
      b.setAttribute('role', 'menuitem');
      b.textContent = item.label;
      b.addEventListener('click', function () {
        goToSection(item.id, function () { setOpen(false); });
      });
      dial.appendChild(b);
    });

    var primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'sec-fab__primary';
    primary.setAttribute('aria-expanded', 'false');
    primary.setAttribute('aria-label', 'Sections');
    primary.innerHTML =
      '<span class="sec-fab__grid" aria-hidden="true">' +
      '<span></span><span></span><span></span><span></span>' +
      '</span>';

    fab.appendChild(dial);
    fab.appendChild(primary);

    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'sec-fab__backdrop';
    backdrop.setAttribute('aria-label', 'Close sections menu');
    backdrop.tabIndex = -1;

    var open = false;
    function setOpen(next) {
      open = !!next;
      fab.classList.toggle('is-open', open);
      wrap.classList.toggle('is-open', open);
      primary.setAttribute('aria-expanded', open ? 'true' : 'false');
      primary.setAttribute('aria-label', open ? 'Close sections' : 'Sections');
    }

    primary.addEventListener('click', function () {
      setOpen(!open);
    });
    backdrop.addEventListener('click', function () {
      setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        primary.focus();
      }
    });

    wrap.appendChild(fab);
    wrap.appendChild(backdrop);
    document.body.appendChild(wrap);
  }

  /* Also make in-page lib-nav section links expand + flash */
  function wireLibNav() {
    document.querySelectorAll('.lib-links a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = (a.getAttribute('href') || '').slice(1);
        if (!id) return;
        var sec = document.getElementById(id);
        if (!sec || !sec.classList.contains('sec')) return;
        e.preventDefault();
        goToSection(id);
        try {
          history.replaceState(null, '', '#' + id);
        } catch (err) {}
      });
    });
  }

  function init() {
    wrapSectionBodies();
    buildFab();
    wireLibNav();

    /* If landed with hash, expand that section */
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash) {
      var target = document.getElementById(hash);
      if (target && target.classList.contains('sec')) {
        expandSection(target);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Shared site header for ui-kit pages.
 * Page links live ONLY here — register new pages in PAGE_LINKS.
 */
(function () {
  'use strict';

  var PAGE_LINKS = [
    { id: 'gallery', label: 'Gallery', href: 'index.html' },
    { id: 'digest', label: 'Digest', href: 'digest.html' },
    { id: 'taste', label: 'Taste', href: 'taste.html' },
    { id: 'learn-piano-101', label: 'Piano', href: 'learn-piano-101.html' },
    { id: 'ascii-sharks', label: 'ASCII', href: 'ascii-sharks.html' },
    { id: 'ferry', label: 'Ferry', href: 'ferry.html' },
    { id: 'mtr', label: 'MTR', href: 'mtr.html' },
    { id: 'one-prompt', label: 'One prompt', href: 'one-prompt.html' },
    { id: 'folder', label: 'Folder', href: 'folder.html' }
  ];

  function activePageId() {
    var fromBody = document.body && document.body.getAttribute('data-page');
    if (fromBody) return fromBody;
    var path = (location.pathname || '').replace(/\\/g, '/');
    var file = path.split('/').pop() || 'index.html';
    if (!file || file === '') file = 'index.html';
    if (file === 'ui-combo.html' || file === 'index.html' || file === '/') return 'gallery';
    for (var i = 0; i < PAGE_LINKS.length; i++) {
      if (PAGE_LINKS[i].href === file) return PAGE_LINKS[i].id;
    }
    return '';
  }

  function buildHeader() {
    var active = activePageId();
    var header = document.createElement('header');
    header.className = 'site-header';
    header.setAttribute('role', 'banner');

    var brand = document.createElement('a');
    brand.className = 'site-header__brand';
    brand.href = 'index.html';
    brand.textContent = 'ui-kit';
    header.appendChild(brand);

    var nav = document.createElement('nav');
    nav.className = 'site-header__nav';
    nav.setAttribute('aria-label', 'Site pages');

    var panel = document.createElement('div');
    panel.className = 'site-header__panel';
    panel.id = 'site-header-panel';
    panel.hidden = true;

    var panelNav = document.createElement('nav');
    panelNav.className = 'site-header__panel-nav';
    panelNav.setAttribute('aria-label', 'Site pages');

    PAGE_LINKS.forEach(function (item) {
      function makeLink() {
        var a = document.createElement('a');
        a.className = 'site-header__link' + (item.id === active ? ' is-active' : '');
        a.href = item.href;
        a.textContent = item.label;
        if (item.id === active) a.setAttribute('aria-current', 'page');
        return a;
      }
      nav.appendChild(makeLink());
      panelNav.appendChild(makeLink());
    });

    panel.appendChild(panelNav);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'site-header__toggle';
    toggle.setAttribute('aria-label', 'Open site menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-header-panel');
    toggle.innerHTML = '<span class="site-header__burger" aria-hidden="true"></span>';

    header.appendChild(nav);
    header.appendChild(toggle);
    header.appendChild(panel);

    var open = false;
    var lastFocus = null;

    function setOpen(next) {
      open = !!next;
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close site menu' : 'Open site menu');
      panel.hidden = !open;
      if (open) {
        lastFocus = document.activeElement;
        var first = panel.querySelector('a');
        if (first) first.focus();
      } else if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(!open);
    });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      var focusables = panel.querySelectorAll('a, button');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!open) return;
      if (!header.contains(e.target)) setOpen(false);
    });

    return header;
  }

  function mount() {
    var existing = document.querySelector('.site-header');
    if (existing) return;
    var header = buildHeader();
    var root = document.getElementById('site-header-root');
    if (root) {
      root.appendChild(header);
    } else if (document.body.firstChild) {
      document.body.insertBefore(header, document.body.firstChild);
    } else {
      document.body.appendChild(header);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

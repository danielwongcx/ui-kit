/**
 * Shared site header for ui-kit pages.
 * Page links live ONLY here — register new pages in PAGE_LINKS.
 *
 * Each entry is a page { id, label, href } or a category
 * { id, label, children: [page, ...] }. A page is listed once.
 */
(function () {
  'use strict';

  var PAGE_LINKS = [
    { id: 'gallery', label: 'Gallery', href: 'index.html' },
    { id: 'digest', label: 'Digest', href: 'digest.html' },
    { id: 'taste', label: 'Taste', href: 'taste.html' },
    { id: 'refactor-ui', label: 'Refactor UI', href: 'refactor-ui.html' },
    { id: 'learn-piano-101', label: 'Piano', href: 'learn-piano-101.html' },
    { id: 'ascii-sharks', label: 'ASCII', href: 'ascii-sharks.html' },
    { id: 'ferry', label: 'Ferry', href: 'ferry.html' },
    { id: 'mtr', label: 'MTR', href: 'mtr.html' },
    {
      id: 'explainer',
      label: 'Explainer',
      children: [
        { id: 'one-prompt', label: 'One prompt', href: 'one-prompt.html' },
        { id: 'motion-studio', label: 'Motion studio', href: 'motion-studio.html' }
      ]
    }
  ];

  function eachPage(fn) {
    PAGE_LINKS.forEach(function (item) {
      if (item.children) item.children.forEach(fn);
      else fn(item);
    });
  }

  function activePageId() {
    var fromBody = document.body && document.body.getAttribute('data-page');
    if (fromBody) return fromBody;
    var path = (location.pathname || '').replace(/\\/g, '/');
    var file = path.split('/').pop() || 'index.html';
    if (!file || file === '') file = 'index.html';
    if (file === 'ui-combo.html' || file === 'index.html' || file === '/') return 'gallery';
    var found = '';
    eachPage(function (item) {
      if (item.href === file) found = item.id;
    });
    return found;
  }

  function categoryHas(item, active) {
    if (!item.children) return false;
    for (var i = 0; i < item.children.length; i++) {
      if (item.children[i].id === active) return true;
    }
    return false;
  }

  function makeLink(item, active) {
    var a = document.createElement('a');
    var on = item.id === active;
    a.className = 'site-header__link' + (on ? ' is-active' : '');
    a.href = item.href;
    a.textContent = item.label;
    if (on) a.setAttribute('aria-current', 'page');
    return a;
  }

  function finePointer() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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

    var menus = [];

    function closeMenus(except) {
      menus.forEach(function (menu) {
        if (menu !== except) menu.forceClose(false);
      });
    }

    PAGE_LINKS.forEach(function (item) {
      if (item.children) {
        menus.push(buildMenu(item, active, closeMenus));
        nav.appendChild(menus[menus.length - 1].root);
        panelNav.appendChild(buildGroup(item, active));
      } else {
        nav.appendChild(makeLink(item, active));
        panelNav.appendChild(makeLink(item, active));
      }
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
        var first = panel.querySelector('a, button');
        if (first) first.focus();
      } else if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(!open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var closedOne = false;
        menus.forEach(function (menu) {
          if (!menu.isOpen()) return;
          var visible = menu.root.offsetParent !== null;
          if (!visible) {
            menu.forceClose(false);
            return;
          }
          var back = menu.root.contains(document.activeElement);
          menu.forceClose(back);
          closedOne = true;
        });
        if (closedOne) {
          e.preventDefault();
          return;
        }
        if (!open) return;
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (!open || e.key !== 'Tab') return;
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
      menus.forEach(function (menu) {
        if (!menu.root.contains(e.target)) menu.forceClose(false);
      });
      if (!open) return;
      if (!header.contains(e.target)) setOpen(false);
    });

    return header;
  }

  function buildGroup(item, active) {
    var on = categoryHas(item, active);
    var group = document.createElement('div');
    group.className = 'site-header__group' + (on ? ' is-active' : '');
    if (on) group.setAttribute('aria-current', 'true');

    var label = document.createElement('p');
    label.className = 'site-header__group-label' + (on ? ' is-active' : '');
    label.id = 'site-header-group-' + item.id;
    label.textContent = item.label;

    var links = document.createElement('div');
    links.className = 'site-header__group-links';
    links.setAttribute('role', 'group');
    links.setAttribute('aria-labelledby', label.id);

    item.children.forEach(function (child) {
      links.appendChild(makeLink(child, active));
    });

    group.appendChild(label);
    group.appendChild(links);
    return group;
  }

  function buildMenu(item, active, closeMenus) {
    var on = categoryHas(item, active);
    var root = document.createElement('div');
    root.className = 'site-header__menu';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-header__link site-header__menu-btn' + (on ? ' is-active' : '');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'site-header-menu-' + item.id);
    if (on) btn.setAttribute('aria-current', 'true');

    var label = document.createElement('span');
    label.textContent = item.label;
    var caret = document.createElement('span');
    caret.className = 'site-header__caret';
    caret.setAttribute('aria-hidden', 'true');
    btn.appendChild(label);
    btn.appendChild(caret);

    var fly = document.createElement('div');
    fly.className = 'site-header__flyout';
    fly.id = 'site-header-menu-' + item.id;
    fly.hidden = true;

    var card = document.createElement('div');
    card.className = 'site-header__flyout-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', item.label);
    item.children.forEach(function (child) {
      card.appendChild(makeLink(child, active));
    });
    fly.appendChild(card);

    root.appendChild(btn);
    root.appendChild(fly);

    var api = {
      root: root,
      pinned: false,
      hovering: false,
      suppress: false,
      closeTimer: 0
    };

    function focusInFlyout() {
      return fly.contains(document.activeElement);
    }

    function setExpanded(next) {
      var open = !!next;
      root.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      fly.hidden = !open;
    }

    function sync() {
      setExpanded(api.pinned || (api.hovering && !api.suppress && finePointer()) || focusInFlyout());
    }

    api.isOpen = function () {
      return btn.getAttribute('aria-expanded') === 'true';
    };

    api.forceClose = function (focusBtn) {
      api.pinned = false;
      api.hovering = false;
      api.suppress = true;
      if (api.closeTimer) {
        clearTimeout(api.closeTimer);
        api.closeTimer = 0;
      }
      setExpanded(false);
      if (focusBtn) btn.focus();
    };

    btn.addEventListener('click', function () {
      closeMenus(api);
      if (api.pinned) {
        api.forceClose(false);
        return;
      }
      api.suppress = false;
      api.pinned = true;
      setExpanded(true);
    });

    root.addEventListener('pointerenter', function () {
      if (!finePointer()) return;
      api.hovering = true;
      api.suppress = false;
      if (api.closeTimer) {
        clearTimeout(api.closeTimer);
        api.closeTimer = 0;
      }
      closeMenus(api);
      sync();
    });

    root.addEventListener('pointerleave', function () {
      api.hovering = false;
      api.suppress = false;
      if (api.closeTimer) clearTimeout(api.closeTimer);
      api.closeTimer = setTimeout(function () {
        api.closeTimer = 0;
        if (!api.hovering) sync();
      }, 140);
    });

    btn.addEventListener('keydown', function (e) {
      var links = card.querySelectorAll('a');
      if (!links.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        closeMenus(api);
        api.suppress = false;
        api.pinned = true;
        setExpanded(true);
        (e.key === 'ArrowDown' ? links[0] : links[links.length - 1]).focus();
      } else if (e.key === 'Escape' && api.isOpen()) {
        e.preventDefault();
        e.stopPropagation();
        api.forceClose(false);
      }
    });

    card.addEventListener('keydown', function (e) {
      var links = Array.prototype.slice.call(card.querySelectorAll('a'));
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && links.length) {
        e.preventDefault();
        links[(i + 1) % links.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i <= 0) btn.focus();
        else links[i - 1].focus();
      } else if (e.key === 'Home' && links.length) {
        e.preventDefault();
        links[0].focus();
      } else if (e.key === 'End' && links.length) {
        e.preventDefault();
        links[links.length - 1].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        api.forceClose(true);
      }
    });

    root.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!root.contains(document.activeElement)) {
          api.pinned = false;
          sync();
        }
      }, 0);
    });

    return api;
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

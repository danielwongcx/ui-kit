/**
 * EN / 中文 for fix-life.html.
 * Copy lives in fix-life.i18n.json (same-origin). Default is English.
 * The choice is stored in localStorage under fix-life-lang.
 * A ?lang=en or ?lang=zh visit overrides the stored choice for that load.
 */
(function () {
  'use strict';

  var KEY = 'fix-life-lang';
  var TITLE_EN = 'Fix your life · ui-kit';
  var dict = null;
  var lang = document.documentElement.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';

  function textFor(id) {
    var unit = dict[id];
    if (!unit) return '';
    return lang === 'zh' ? unit.zh : unit.en;
  }

  function splitPass(text) {
    var i = text.indexOf(' ');
    if (i === -1) return [text, ''];
    return [text.slice(0, i), text.slice(i + 1)];
  }

  function termOf(text) {
    var body = String(text).replace(/^\d+/, '');
    var match = body.match(/^(.+?)[.。]/);
    return match ? match[1] : body;
  }

  function clearAfter(node) {
    while (node.nextSibling) node.parentNode.removeChild(node.nextSibling);
  }

  function applyPass(el, text) {
    var parts = splitPass(text);
    var bold = el.querySelector('b');
    var span = el.querySelector('span');
    if (!bold || !span) {
      el.textContent = text;
      return;
    }
    bold.textContent = parts[0];
    span.textContent = parts[1];
  }

  function applySteer(el, text) {
    var body = text.replace(/^\d+/, '');
    var match = body.match(/^(.+?[.。])(\s*)([\s\S]*)$/);
    var num = el.querySelector('.lnum');
    var holder = num ? num.nextElementSibling : null;
    var bold = holder && holder.querySelector('b');
    if (!holder || !bold || !match) {
      if (holder) holder.textContent = body;
      return;
    }
    bold.textContent = match[1];
    clearAfter(bold);
    if (match[3]) holder.appendChild(document.createTextNode(match[2] + match[3]));
  }

  function applyClock(el, text) {
    var match = String(text).match(/^(\d{1,2}:\d{2})(\s*)([\s\S]*)$/);
    var bold = el.querySelector('b');
    var span = el.querySelector('span');
    if (!match || !span) {
      el.textContent = text;
      return;
    }
    if (bold) bold.textContent = match[1];
    span.textContent = match[2] + match[3];
  }

  function applyIconPrefix(el, text) {
    var rest = String(text).replace(/^↺\s*/, '');
    var icon = el.querySelector('i');
    if (!icon) {
      el.textContent = text;
      return;
    }
    clearAfter(icon);
    el.appendChild(document.createTextNode(' ' + rest));
  }

  function applyAfterIcon(el, text) {
    var label = el.querySelector('span');
    if (!label) {
      el.textContent = text;
      return;
    }
    label.textContent = text;
  }

  function applyByline(el, text) {
    var prefix = 'Dan Koe (@thedankoe) · ';
    var post = el.querySelector('a[href*="/status/"]');
    if (!post || text.indexOf(prefix) !== 0) return;
    post.textContent = text.slice(prefix.length);
  }

  function renderFooter(el, text) {
    var specs = [
      {
        token: 'How to fix your entire life in 1 day',
        href: 'https://x.com/thedankoe/status/2010751592346030461'
      },
      {
        token: '@thedankoe',
        href: 'https://x.com/thedankoe'
      },
      {
        token: 'Human 3.0',
        href: 'https://letters.thedankoe.com/p/human-30-a-map-to-reach-the-top-1',
        last: true
      }
    ];
    var ranges = [];
    specs.forEach(function (spec) {
      var at = spec.last ? text.lastIndexOf(spec.token) : text.indexOf(spec.token);
      if (at === -1) return;
      ranges.push({ start: at, end: at + spec.token.length, href: spec.href });
    });
    ranges.sort(function (a, b) { return a.start - b.start; });
    while (el.firstChild) el.removeChild(el.firstChild);
    var cursor = 0;
    ranges.forEach(function (range) {
      if (range.start < cursor) return;
      if (range.start > cursor) {
        el.appendChild(document.createTextNode(text.slice(cursor, range.start)));
      }
      var link = document.createElement('a');
      link.href = range.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = text.slice(range.start, range.end);
      el.appendChild(link);
      cursor = range.end;
    });
    if (cursor < text.length) {
      el.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function applyOne(el) {
    var id = el.getAttribute('data-i18n');
    if (!id || !dict[id]) return;
    var text = textFor(id);
    var mode = el.getAttribute('data-i18n-mode') || 'text';
    if (mode === 'pass') applyPass(el, text);
    else if (mode === 'steer') applySteer(el, text);
    else if (mode === 'clock') applyClock(el, text);
    else if (mode === 'icon-prefix') applyIconPrefix(el, text);
    else if (mode === 'after-icon') applyAfterIcon(el, text);
    else if (mode === 'byline') applyByline(el, text);
    else if (mode === 'footer') renderFooter(el, text);
    else el.textContent = text;
  }

  function applyHeader() {
    if (!dict || !dict['meta-page-label']) return;
    var label = textFor('meta-page-label');
    var links = document.querySelectorAll('a.site-header__link');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (/(^|\/)fix-life\.html$/.test(href)) links[i].textContent = label;
    }
  }

  function applyAimLabel() {
    if (!dict['want-th-029']) return;
    var label = textFor('want-th-029');
    var cells = document.querySelectorAll('#want td[data-label]');
    for (var i = 0; i < cells.length; i++) cells[i].setAttribute('data-label', label);
  }

  function applyTerms() {
    var nodes = document.querySelectorAll('[data-i18n-term]');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute('data-i18n-term');
      if (dict[id]) nodes[i].textContent = termOf(textFor(id));
    }
    var passes = document.querySelectorAll('[data-i18n-pass]');
    for (var j = 0; j < passes.length; j++) {
      var pid = passes[j].getAttribute('data-i18n-pass');
      if (dict[pid]) passes[j].textContent = splitPass(textFor(pid))[0];
    }
  }

  function paintSwitch() {
    var buttons = document.querySelectorAll('.lang-switch [data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-set-lang') === lang;
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function apply() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) applyOne(nodes[i]);
    applyTerms();
    applyAimLabel();
    applyHeader();
    paintSwitch();
    document.title = lang === 'zh' && dict['meta-title'] ? dict['meta-title'].zh : TITLE_EN;
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant-HK' : 'en';
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.removeAttribute('data-i18n-wait');
    document.dispatchEvent(new CustomEvent('fix-life-lang', { detail: { lang: lang } }));
  }

  function setLang(next, persist) {
    lang = next === 'zh' ? 'zh' : 'en';
    if (persist) {
      try { localStorage.setItem(KEY, lang); } catch (e) {}
    }
    if (dict) apply();
  }

  window.fixLifeT = function (id) {
    if (!dict || !dict[id]) return '';
    return lang === 'zh' ? dict[id].zh : dict[id].en;
  };

  window.fixLifeLang = function () { return lang; };

  var buttons = document.querySelectorAll('.lang-switch [data-set-lang]');
  for (var b = 0; b < buttons.length; b++) {
    buttons[b].addEventListener('click', function () {
      setLang(this.getAttribute('data-set-lang'), true);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (dict) applyHeader();
  });

  fetch('fix-life.i18n.json?v=1', { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('i18n ' + res.status);
      return res.json();
    })
    .then(function (data) {
      dict = {};
      var units = data.units || [];
      for (var i = 0; i < units.length; i++) dict[units[i].id] = units[i];
      apply();
    })
    .catch(function () {
      document.documentElement.removeAttribute('data-i18n-wait');
    });

  /* If the dictionary never arrives, still show the English page. */
  setTimeout(function () {
    document.documentElement.removeAttribute('data-i18n-wait');
  }, 4000);
})();

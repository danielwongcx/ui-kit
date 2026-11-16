/* Motion hierarchy. Good fades everything at once. Great staggers blur, slide, scale, then content. */
(function () {
  'use strict';

  function reduced() {
    return document.documentElement.getAttribute('data-motion') === 'reduce';
  }

  var jobs = new Set();
  var rafId = 0;
  function pump(now) {
    jobs.forEach(function (job) { job(now); });
    rafId = jobs.size ? requestAnimationFrame(pump) : 0;
  }
  function addJob(job) {
    jobs.add(job);
    if (!rafId) rafId = requestAnimationFrame(pump);
    return function () { jobs.delete(job); };
  }

  var home = document.getElementById('home-body');
  var tabs = document.getElementById('tabbar');
  var veil = document.getElementById('veil');
  var detail = document.getElementById('detail');
  var hero = document.getElementById('hero');
  var sheet = document.getElementById('sheet');
  var controls = Array.prototype.slice.call(document.querySelectorAll('.ctrl'));
  var nowEl = document.getElementById('now');
  var steps = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  var mode = 'great';
  var open = false;
  var gen = 0;
  var timers = [];

  function say(text) {
    if (nowEl) nowEl.textContent = text;
  }

  function lit(names) {
    steps.forEach(function (step) {
      step.classList.toggle('is-on', names.indexOf(step.getAttribute('data-step')) !== -1);
    });
  }

  function later(ms, fn) {
    var token = gen;
    var id = setTimeout(function () {
      if (token !== gen) return;
      fn();
    }, ms);
    timers.push(id);
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function stopAnims() {
    document.querySelectorAll('.device, .device *').forEach(function (el) {
      if (el.getAnimations) el.getAnimations().forEach(function (anim) { anim.cancel(); });
    });
    jobs.forEach(function (job) { jobs.delete(job); });
  }

  function cancel() {
    gen += 1;
    clearTimers();
    stopAnims();
  }

  function setStyles(el, styles) {
    Object.keys(styles).forEach(function (key) { el.style[key] = styles[key]; });
  }

  function applyClosed() {
    stopAnims();
    open = false;
    setStyles(veil, { opacity: '0', backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' });
    setStyles(home, { opacity: '1', filter: 'none' });
    setStyles(tabs, { transform: 'translateY(0)', opacity: '1' });
    setStyles(hero, { opacity: '0', transform: 'scale(0.92)' });
    controls.forEach(function (el) {
      setStyles(el, { opacity: '0', transform: 'translateY(10px)' });
    });
    setStyles(sheet, { opacity: '0', transform: 'translateY(40px)' });
    detail.classList.remove('is-open');
    detail.style.opacity = '1';
    lit([]);
  }

  function applyOpen() {
    stopAnims();
    open = true;
    detail.classList.add('is-open');
    detail.style.opacity = '1';
    setStyles(hero, { opacity: '1', transform: 'scale(1)' });
    controls.forEach(function (el) {
      setStyles(el, { opacity: '1', transform: 'translateY(0px)' });
    });
    setStyles(sheet, { opacity: '1', transform: 'translateY(0px)' });
    if (mode === 'good') {
      setStyles(home, { opacity: '0', filter: 'none' });
      setStyles(tabs, { transform: 'translateY(0)', opacity: '0' });
      setStyles(veil, { opacity: '0', backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' });
      lit([]);
      say('Everything fades in together.');
    } else {
      setStyles(home, { opacity: '1', filter: 'none' });
      setStyles(tabs, { transform: 'translateY(100%)', opacity: '1' });
      setStyles(veil, { opacity: '1', backdropFilter: 'blur(20px)', webkitBackdropFilter: 'blur(20px)' });
      lit(['blur', 'slide', 'scale', 'fade']);
      say('Fade & slide in — what can I do next');
    }
  }

  function fade(el, from, to, ms, rate, extra) {
    if (reduced() || rate === 0) {
      setStyles(el, Object.assign({ opacity: String(to) }, extra || {}));
      return;
    }
    var frames = [
      Object.assign({ opacity: from }, extra && extra.from),
      Object.assign({ opacity: to }, extra && extra.to)
    ];
    if (!extra) {
      frames = [{ opacity: from }, { opacity: to }];
    }
    var anim = el.animate(frames, { duration: ms / rate, easing: extra && extra.easing || 'ease-out', fill: 'forwards' });
    anim.onfinish = function () {
      if (extra && extra.to) setStyles(el, extra.to);
      el.style.opacity = String(to);
      anim.cancel();
    };
  }

  function springScale(el, from, to, rate) {
    if (reduced() || rate === 0) {
      el.style.transform = 'scale(' + to + ')';
      el.style.opacity = '1';
      return;
    }
    var x = from;
    var v = 0;
    var stiffness = 300;
    var damping = 25;
    var last = performance.now();
    el.style.transform = 'scale(' + from + ')';
    var stop = addJob(function (now) {
      var dt = Math.min(0.04, (now - last) / 1000) * rate;
      last = now;
      var h = dt / 4 || 0;
      var settled = false;
      for (var i = 0; i < 4; i++) {
        var a = (-stiffness * (x - to) - damping * v);
        v += a * h;
        x += v * h;
        settled = Math.abs(x - to) < 0.0015 && Math.abs(v) < 0.02;
      }
      el.style.transform = 'scale(' + x + ')';
      if (settled) {
        el.style.transform = 'scale(' + to + ')';
        stop();
      }
    });
  }

  function openGood(rate) {
    applyClosed();
    open = true;
    detail.classList.add('is-open');
    setStyles(hero, { opacity: '1', transform: 'scale(1)' });
    controls.forEach(function (el) { setStyles(el, { opacity: '1', transform: 'translateY(0px)' }); });
    setStyles(sheet, { opacity: '1', transform: 'translateY(0px)' });
    setStyles(veil, { opacity: '0', backdropFilter: 'blur(0px)' });
    lit([]);
    say('Everything fades in together.');
    if (reduced() || rate === 0) {
      setStyles(home, { opacity: '0' });
      setStyles(tabs, { opacity: '0' });
      detail.style.opacity = '1';
      return;
    }
    home.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280 / rate, fill: 'forwards' });
    tabs.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280 / rate, fill: 'forwards' });
    detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280 / rate, fill: 'forwards' });
  }

  function openGreat(rate) {
    applyClosed();
    open = true;
    detail.classList.add('is-open');
    detail.style.opacity = '1';
    var wait = function (ms) { return reduced() || rate === 0 ? 0 : ms / rate; };
    lit(['blur']);
    say('Blur — where am I leaving');
    if (reduced() || rate === 0) {
      applyOpen();
      return;
    }
    veil.animate([
      { opacity: 0, backdropFilter: 'blur(0px)' },
      { opacity: 1, backdropFilter: 'blur(20px)' }
    ], { duration: 300 / rate, easing: 'ease-out', fill: 'forwards' });
    later(wait(80), function () {
      lit(['blur', 'slide']);
      say('Slide out — clear the stage');
      tabs.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(100%)' }
      ], { duration: 250 / rate, easing: 'ease-in', fill: 'forwards' });
    });
    later(wait(160), function () {
      lit(['blur', 'slide', 'scale']);
      say('Scale & fade — what is important now');
      hero.style.opacity = '0';
      fade(hero, 0, 1, 280, rate);
      springScale(hero, 0.92, 1, rate);
    });
    later(wait(240), function () {
      lit(['blur', 'slide', 'scale', 'fade']);
      say('Fade & slide in — what can I do next');
      controls.forEach(function (el, index) {
        later(wait(index * 60), function () {
          el.animate([
            { opacity: 0, transform: 'translateY(10px)' },
            { opacity: 1, transform: 'translateY(0px)' }
          ], { duration: 220 / rate, easing: 'ease-out', fill: 'forwards' });
        });
      });
      later(wait(150), function () {
        sheet.animate([
          { opacity: 0, transform: 'translateY(40px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ], { duration: 200 / rate, easing: 'ease-out', fill: 'forwards' });
      });
    });
    later(wait(1100), function () {
      applyOpen();
    });
  }

  function closeGood(rate) {
    if (reduced() || rate === 0) {
      applyClosed();
      say('Tap the card.');
      return;
    }
    home.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 / rate, fill: 'forwards' });
    tabs.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 / rate, fill: 'forwards' });
    var anim = detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240 / rate, fill: 'forwards' });
    anim.onfinish = function () {
      applyClosed();
      say('Tap the card.');
    };
  }

  function closeGreat(rate) {
    if (reduced() || rate === 0) {
      applyClosed();
      say('Tap the card.');
      return;
    }
    applyOpen();
    var wait = function (ms) { return ms / rate; };
    lit(['fade']);
    say('Fade & slide in — leaving the detail');
    sheet.animate([
      { opacity: 1, transform: 'translateY(0px)' },
      { opacity: 0, transform: 'translateY(40px)' }
    ], { duration: 200 / rate, easing: 'ease-in', fill: 'forwards' });
    later(wait(80), function () {
      lit(['scale']);
      controls.forEach(function (el, index) {
        later(wait((controls.length - 1 - index) * 40), function () {
          el.animate([
            { opacity: 1, transform: 'translateY(0px)' },
            { opacity: 0, transform: 'translateY(10px)' }
          ], { duration: 180 / rate, easing: 'ease-in', fill: 'forwards' });
        });
      });
    });
    later(wait(160), function () {
      lit(['slide']);
      say('Scale & fade — the card steps back');
      fade(hero, 1, 0, 220, rate);
      springScale(hero, 1, 0.92, rate);
    });
    later(wait(240), function () {
      lit(['blur']);
      say('Slide out — the tab bar returns');
      tabs.animate([
        { transform: 'translateY(100%)' },
        { transform: 'translateY(0)' }
      ], { duration: 250 / rate, easing: 'ease-out', fill: 'forwards' });
    });
    later(wait(320), function () {
      lit([]);
      say('Blur — back on the home list');
      veil.animate([
        { opacity: 1, backdropFilter: 'blur(20px)' },
        { opacity: 0, backdropFilter: 'blur(0px)' }
      ], { duration: 300 / rate, easing: 'ease-out', fill: 'forwards' });
    });
    later(wait(320 + 300), function () {
      applyClosed();
      say('Tap the card.');
    });
  }

  function play(nextMode, rate) {
    mode = nextMode || mode;
    syncModes();
    cancel();
    if (open) applyClosed();
    if (mode === 'good') openGood(rate);
    else openGreat(rate);
  }

  function shut(rate) {
    if (!open && !detail.classList.contains('is-open')) return;
    cancel();
    if (mode === 'good') closeGood(rate);
    else closeGreat(rate);
  }

  function syncModes() {
    document.querySelectorAll('[data-mode]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-mode') === mode ? 'true' : 'false');
    });
  }

  document.querySelectorAll('[data-mode]').forEach(function (button) {
    button.addEventListener('click', function () {
      mode = button.getAttribute('data-mode');
      syncModes();
      if (detail.classList.contains('is-open')) {
        cancel();
        applyClosed();
        say(mode === 'good' ? 'Good UI fades everything at once.' : 'Great UI staggers with purpose.');
      }
    });
  });

  document.getElementById('open-card').addEventListener('click', function () {
    if (detail.classList.contains('is-open')) return;
    play(mode, reduced() ? 0 : 1);
  });

  document.getElementById('close-detail').addEventListener('click', function () {
    shut(reduced() ? 0 : 1);
  });

  document.getElementById('play').addEventListener('click', function () {
    play(mode, reduced() ? 0 : 1);
  });

  document.getElementById('slow').addEventListener('click', function () {
    mode = 'great';
    syncModes();
    play('great', reduced() ? 0 : 0.3);
  });

  syncModes();
  applyClosed();
  say('Tap the card.');
})();

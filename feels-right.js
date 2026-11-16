/* Feels right — A/B rounds. Springs are integrated here; there is no motion library. */
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

  function wait(ms, speed) {
    var scale = speed || 1;
    if (reduced() || scale === 0) return Promise.resolve();
    return new Promise(function (resolve) {
      setTimeout(resolve, ms / scale);
    });
  }

  function springStep(x, v, target, dt, stiffness, damping) {
    var a = (-stiffness * (x - target) - damping * v);
    v += a * dt;
    x += v * dt;
    return {
      x: x,
      v: v,
      settled: Math.abs(x - target) < 0.002 && Math.abs(v) < 0.02
    };
  }

  var playGen = 0;
  function cancelPlays() { playGen += 1; }

  var live = document.getElementById('live');
  var rounds = Array.prototype.slice.call(document.querySelectorAll('.round'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var current = '1';

  function show(id) {
    cancelPlays();
    current = id;
    rounds.forEach(function (round) {
      round.classList.toggle('is-on', round.getAttribute('data-round') === id);
    });
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-tab') === id;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
    if (id === '5') requestAnimationFrame(function () { placeAllTabs(false); });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.disabled) return;
      show(tab.getAttribute('data-tab'));
    });
  });

  var rail = document.querySelector('.scroller');
  if (rail) {
    rail.addEventListener('keydown', function (event) {
      var keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (keys.indexOf(event.key) === -1) return;
      var enabled = tabs.filter(function (tab) { return !tab.disabled; });
      var index = enabled.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = enabled.length - 1;
      else if (event.key === 'ArrowRight') index = (index + 1) % enabled.length;
      else index = (index - 1 + enabled.length) % enabled.length;
      enabled[index].focus();
      show(enabled[index].getAttribute('data-tab'));
    });
  }

  function mark(round) {
    var winner = round.getAttribute('data-winner');
    round.querySelectorAll('.card').forEach(function (card) {
      var side = card.getAttribute('data-side');
      card.classList.toggle('is-win', side === winner);
      card.classList.toggle('is-lose', side !== winner);
    });
  }

  document.querySelectorAll('[data-reveal]').forEach(function (button) {
    button.addEventListener('click', function () {
      var round = button.closest('.round');
      var result = round.querySelector('.result');
      result.hidden = false;
      round.setAttribute('data-revealed', 'true');
      mark(round);
      var next = round.querySelector('[data-next]');
      if (next) next.hidden = false;
      if (round.getAttribute('data-round') === '6') {
        var keyTab = document.querySelector('[data-tab="key"]');
        if (keyTab) keyTab.disabled = false;
      }
      var winner = round.querySelector('.winner');
      var principle = round.querySelector('.principle');
      if (live) {
        live.textContent = winner.textContent + '. ' + principle.textContent + '. ' + round.querySelector('.why').textContent;
      }
      winner.focus();
    });
  });

  document.querySelectorAll('[data-next]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.getAttribute('data-next');
      if (id === 'key') {
        var keyTab = document.querySelector('[data-tab="key"]');
        if (keyTab) keyTab.disabled = false;
      }
      show(id);
    });
  });

  /* —— Toggle —— */
  function bindSwitch(button, mode) {
    var knob = button.querySelector('.knob');
    var state = { x: 0, v: 0, sx: 1, sv: 0, on: false };
    var stopJob = null;
    var token = 0;

    function render() {
      var travel = Math.max(0, button.clientWidth - knob.offsetWidth - 8);
      knob.style.transform = 'translateX(' + (state.x * travel) + 'px) scaleX(' + state.sx + ')';
      button.classList.toggle('is-mid', state.x >= 0.5);
      button.setAttribute('aria-pressed', state.on ? 'true' : 'false');
    }

    function stop() {
      if (stopJob) stopJob();
      stopJob = null;
    }

    function snap(on) {
      stop();
      token += 1;
      state.on = !!on;
      state.x = state.on ? 1 : 0;
      state.v = 0;
      state.sx = 1;
      state.sv = 0;
      render();
    }

    function runSpring(speed) {
      stop();
      var my = ++token;
      if (reduced() || speed === 0) {
        state.x = state.on ? 1 : 0;
        state.v = 0;
        state.sx = 1;
        state.sv = 0;
        render();
        return Promise.resolve();
      }
      var target = state.on ? 1 : 0;
      if (mode === 'b') {
        state.sx = 1.2;
        state.sv = -4;
      } else {
        state.sx = 1;
        state.sv = 0;
      }
      var last = performance.now();
      return new Promise(function (resolve) {
        stopJob = addJob(function (now) {
          if (my !== token) { stop(); resolve('cancel'); return; }
          var dt = Math.min(0.04, (now - last) / 1000) * speed;
          last = now;
          var h = dt / 4 || 0;
          var settledX = false;
          var settledS = mode !== 'b';
          var i;
          for (i = 0; i < 4; i++) {
            var px = springStep(state.x, state.v, target, h, 500, 15);
            state.x = px.x;
            state.v = px.v;
            settledX = px.settled;
            if (mode === 'b') {
              var ps = springStep(state.sx, state.sv, 1, h, 500, 15);
              state.sx = ps.x;
              state.sv = ps.v;
              settledS = ps.settled;
            }
          }
          render();
          if (settledX && settledS) {
            stop();
            resolve('done');
          }
        });
      });
    }

    function runLinear(speed) {
      stop();
      var my = ++token;
      var from = state.x;
      var to = state.on ? 1 : 0;
      state.sx = 1;
      state.sv = 0;
      if (reduced() || speed === 0) {
        state.x = to;
        state.v = 0;
        render();
        return Promise.resolve();
      }
      var t0 = performance.now();
      var dur = 220 / speed;
      return new Promise(function (resolve) {
        stopJob = addJob(function (now) {
          if (my !== token) { stop(); resolve('cancel'); return; }
          var p = Math.min(1, (now - t0) / dur);
          state.x = from + (to - from) * p;
          state.v = 0;
          render();
          if (p >= 1) {
            stop();
            resolve('done');
          }
        });
      });
    }

    function commit(on, speed) {
      state.on = !!on;
      if (mode === 'a') return runLinear(speed);
      return runSpring(speed);
    }

    var startX = 0;
    var startPos = 0;
    var moved = 0;
    var dragging = false;

    button.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      dragging = true;
      startX = event.clientX;
      startPos = state.x;
      moved = 0;
      stop();
      token += 1;
      if (mode === 'b' && !reduced()) {
        state.sx = 1.2;
        state.sv = 0;
        render();
      }
    });

    button.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      moved = Math.abs(event.clientX - startX);
      var travel = Math.max(1, button.clientWidth - knob.offsetWidth - 8);
      var next = startPos + (event.clientX - startX) / travel;
      state.x = Math.min(1, Math.max(0, next));
      state.v = 0;
      render();
    });

    function endPointer(event) {
      if (!dragging) return;
      dragging = false;
      var flip = moved < 8 ? !state.on : state.x >= 0.5;
      commit(flip, 1);
    }

    button.addEventListener('pointerup', endPointer);
    button.addEventListener('pointercancel', endPointer);
    button.addEventListener('keydown', function (event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (mode === 'b' && !reduced()) {
        state.sx = 1.2;
        state.sv = -4;
      }
      commit(!state.on, 1);
    });

    button._toggle = {
      snap: snap,
      stretch: function () {
        stop();
        token += 1;
        state.sx = 1.2;
        state.sv = 0;
        render();
      },
      commit: commit
    };
    render();
    requestAnimationFrame(render);
  }

  document.querySelectorAll('.switch').forEach(function (button) {
    bindSwitch(button, button.getAttribute('data-mode'));
  });

  /* —— Like —— */
  function burst(button, speed) {
    var fill = button.querySelector('.fill');
    button.classList.add('is-on');
    button.setAttribute('aria-pressed', 'true');
    if (reduced() || speed === 0) return Promise.resolve();
    fill.getAnimations().forEach(function (anim) { anim.cancel(); });
    var pop = fill.animate([
      { transform: 'scale(0)' },
      { transform: 'scale(1.2)', offset: 0.45 },
      { transform: 'scale(1)' }
    ], { duration: 450 / speed, easing: 'ease-out', fill: 'forwards' });
    button.querySelectorAll('.burst').forEach(function (dot, index) {
      var angle = (Math.PI * 2 * index) / 8;
      var dist = 36;
      dot.animate([
        { transform: 'translate(0px, 0px) scale(0.7)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(angle) * dist) + 'px, ' + (Math.sin(angle) * dist) + 'px) scale(0.25)', opacity: 0 }
      ], { duration: 520 / speed, easing: 'ease-out', fill: 'forwards' });
    });
    return pop.finished.catch(function () {});
  }

  function unlike(button) {
    button.classList.remove('is-on');
    button.setAttribute('aria-pressed', 'false');
    var fill = button.querySelector('.fill');
    fill.getAnimations().forEach(function (anim) { anim.cancel(); });
    fill.style.transform = 'scale(0)';
  }

  document.querySelectorAll('.heart').forEach(function (button) {
    var mode = button.getAttribute('data-mode');
    button.addEventListener('click', function () {
      var on = button.classList.contains('is-on');
      if (on) {
        unlike(button);
        return;
      }
      if (mode === 'b' || reduced()) {
        button.classList.add('is-on');
        button.setAttribute('aria-pressed', 'true');
        return;
      }
      burst(button, 1);
    });
  });

  /* —— Menu —— */
  function scaleTo(el, from, to, speed) {
    if (reduced() || speed === 0) {
      el.style.transform = 'scale(' + to + ')';
      return Promise.resolve();
    }
    var anim = el.animate(
      [{ transform: 'scale(' + from + ')' }, { transform: 'scale(' + to + ')' }],
      { duration: 280 / speed, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)', fill: 'forwards' }
    );
    return anim.finished.then(function () {
      el.style.transform = 'scale(' + to + ')';
      anim.cancel();
    }).catch(function () {});
  }

  function fadeTo(el, from, to, ms, speed) {
    if (reduced() || speed === 0) {
      el.style.opacity = String(to);
      return Promise.resolve();
    }
    var anim = el.animate(
      [{ opacity: from }, { opacity: to }],
      { duration: ms / speed, easing: 'linear', fill: 'forwards' }
    );
    return anim.finished.then(function () {
      el.style.opacity = String(to);
      anim.cancel();
    }).catch(function () {});
  }

  function setMenu(menu, open, speed) {
    var fab = menu.parentElement.querySelector('.fab');
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    var grow = menu.classList.contains('menu-a');
    menu.classList.remove('is-shut');
    menu.inert = false;
    var done;
    if (grow) {
      var current = open ? 0 : 1;
      done = scaleTo(menu, current, open ? 1 : 0, speed);
    } else {
      done = fadeTo(menu, open ? 0 : 1, open ? 1 : 0, 220, speed);
    }
    return done.then(function () {
      if (!open) {
        menu.classList.add('is-shut');
        menu.inert = true;
      }
    });
  }

  document.querySelectorAll('.fab').forEach(function (fab) {
    var menu = fab.parentElement.querySelector('.menu');
    fab.addEventListener('click', function () {
      var open = fab.getAttribute('aria-expanded') === 'true';
      setMenu(menu, !open, 1);
    });
  });

  /* —— Password —— */
  function rejectPassword(field, shake, speed) {
    var input = field.querySelector('input');
    var note = field.querySelector('.badnote');
    input.classList.add('is-bad');
    input.setAttribute('aria-invalid', 'true');
    note.hidden = false;
    if (!shake || reduced() || speed === 0) return Promise.resolve();
    var anim = input.animate([
      { transform: 'translateX(0px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0px)' }
    ], { duration: 400 / speed, easing: 'linear' });
    return anim.finished.catch(function () {});
  }

  document.querySelectorAll('.field').forEach(function (field) {
    var shake = field.getAttribute('data-mode') === 'b';
    field.querySelector('.submit').addEventListener('click', function () {
      rejectPassword(field, shake, 1);
    });
  });

  /* —— Tabs —— */
  function tabBox(bar, button) {
    var barBox = bar.getBoundingClientRect();
    var box = button.getBoundingClientRect();
    return { left: box.left - barBox.left, width: box.width };
  }

  function setPill(pill, box) {
    pill.style.left = box.left + 'px';
    pill.style.width = box.width + 'px';
  }

  function selectTab(bar, index, animate, speed) {
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('.tab'));
    var pill = bar.querySelector('.tab-pill');
    var button = buttons[index];
    if (!button) return Promise.resolve();
    buttons.forEach(function (tab, i) {
      tab.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    bar.dataset.index = String(index);
    var box = tabBox(bar, button);
    var rate = speed == null ? 1 : speed;
    if (bar.getAttribute('data-mode') === 'b') {
      if (!animate || reduced() || rate === 0) {
        setPill(pill, box);
        pill.style.opacity = '1';
        return Promise.resolve();
      }
      return fadeTo(pill, 1, 0, 120, rate).then(function () {
        setPill(pill, box);
        return fadeTo(pill, 0, 1, 160, rate);
      });
    }
    var fromL = parseFloat(pill.style.left);
    var fromW = parseFloat(pill.style.width);
    if (!animate || reduced() || rate === 0 || isNaN(fromL)) {
      setPill(pill, box);
      return Promise.resolve();
    }
    var dur = 320 / rate;
    var t0 = performance.now();
    bar._token = (bar._token || 0) + 1;
    var my = bar._token;
    return new Promise(function (resolve) {
      var stop = addJob(function (now) {
        if (bar._token !== my) { stop(); resolve('cancel'); return; }
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        pill.style.left = (fromL + (box.left - fromL) * e) + 'px';
        pill.style.width = (fromW + (box.width - fromW) * e) + 'px';
        if (p >= 1) {
          stop();
          resolve('done');
        }
      });
    });
  }

  function placeAllTabs(animate) {
    document.querySelectorAll('.tabbar').forEach(function (bar) {
      var index = Number(bar.dataset.index || '0');
      selectTab(bar, index, animate, 0);
    });
  }

  document.querySelectorAll('.tabbar').forEach(function (bar) {
    bar.dataset.index = '0';
    bar.addEventListener('click', function (event) {
      var button = event.target.closest('.tab');
      if (!button) return;
      var buttons = Array.prototype.slice.call(bar.querySelectorAll('.tab'));
      selectTab(bar, buttons.indexOf(button), true, 1);
    });
  });

  /* —— Delete —— */
  var NOTES = ['Monday', 'Draft', 'Receipt', 'Later'];

  function renderList(list) {
    list.innerHTML = '';
    NOTES.forEach(function (name) {
      var row = document.createElement('div');
      row.className = 'row';
      row.dataset.name = name;
      var label = document.createElement('span');
      label.textContent = name;
      row.appendChild(label);
      if (name === 'Draft') {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'x';
        button.textContent = '×';
        button.setAttribute('aria-label', 'Delete Draft');
        button.addEventListener('click', function () {
          removeRow(row, list.getAttribute('data-mode'), 1);
        });
        row.appendChild(button);
      }
      list.appendChild(row);
    });
  }

  function removeRow(row, mode, speed) {
    if (!row || !row.parentNode || row.dataset.leaving === '1') return Promise.resolve();
    if (mode === 'a' || reduced() || speed === 0) {
      row.remove();
      return Promise.resolve();
    }
    row.dataset.leaving = '1';
    var dur = 320 / speed;
    var height = row.offsetHeight;
    row.style.boxSizing = 'border-box';
    row.style.height = height + 'px';
    row.style.overflow = 'hidden';
    row.offsetHeight;
    row.style.transition = 'height ' + dur + 'ms ease, margin ' + dur + 'ms ease, padding ' + dur + 'ms ease, opacity ' + dur + 'ms ease';
    requestAnimationFrame(function () {
      row.style.height = '0px';
      row.style.marginBottom = '0px';
      row.style.paddingTop = '0px';
      row.style.paddingBottom = '0px';
      row.style.opacity = '0';
    });
    return new Promise(function (resolve) {
      var settled = false;
      function finish() {
        if (settled) return;
        settled = true;
        if (row.parentNode) row.remove();
        resolve();
      }
      row.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, dur + 80);
    });
  }

  document.querySelectorAll('.list').forEach(function (list) {
    renderList(list);
    var reset = list.parentElement.querySelector('.reset');
    if (reset) reset.addEventListener('click', function () { renderList(list); });
  });

  /* —— Slow-mo replays of the winner —— */
  var replays = {
    '1': function (speed) {
      var button = document.querySelector('#r1 .switch[data-mode="b"]');
      var api = button._toggle;
      api.snap(false);
      return wait(120, speed).then(function () {
        api.stretch();
        return wait(180, speed);
      }).then(function () {
        return api.commit(true, speed);
      });
    },
    '2': function (speed) {
      var button = document.querySelector('#r2 .heart[data-mode="a"]');
      unlike(button);
      return wait(80, speed).then(function () { return burst(button, speed); });
    },
    '3': function (speed) {
      var menu = document.querySelector('#r3 .menu-a');
      return setMenu(menu, false, 0).then(function () {
        return wait(100, speed);
      }).then(function () {
        return setMenu(menu, true, speed);
      });
    },
    '4': function (speed) {
      var field = document.querySelector('#r4 .field[data-mode="b"]');
      var input = field.querySelector('input');
      input.classList.remove('is-bad');
      input.removeAttribute('aria-invalid');
      field.querySelector('.badnote').hidden = true;
      return wait(120, speed).then(function () {
        return rejectPassword(field, true, speed);
      });
    },
    '5': function (speed) {
      var bar = document.querySelector('#r5 .tabbar[data-mode="a"]');
      return selectTab(bar, 0, false, 0).then(function () {
        return wait(180, speed);
      }).then(function () {
        return selectTab(bar, 1, true, speed);
      }).then(function () {
        return wait(140, speed);
      }).then(function () {
        return selectTab(bar, 2, true, speed);
      });
    },
    '6': function (speed) {
      var list = document.querySelector('#r6 .list[data-mode="b"]');
      renderList(list);
      return wait(160, speed).then(function () {
        var row = list.querySelector('[data-name="Draft"]');
        return removeRow(row, 'b', speed);
      });
    }
  };

  document.querySelectorAll('[data-replay]').forEach(function (button) {
    button.addEventListener('click', function () {
      var id = button.getAttribute('data-replay');
      var gen = ++playGen;
      var speed = reduced() ? 0 : 0.3;
      var principle = button.getAttribute('data-principle') || '';
      if (live) live.textContent = 'Replaying ' + principle + (speed ? ' at 0.3×.' : '.');
      Promise.resolve(replays[id](speed)).then(function () {
        if (gen !== playGen) return;
      });
    });
  });

  window.addEventListener('resize', function () {
    if (current === '5') placeAllTabs(false);
  });

  show('1');
})();

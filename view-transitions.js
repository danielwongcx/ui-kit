/* Driftwood interactions. Same-document transitions go through start(). */
(function () {
  'use strict';

  var CITIES = {
    lisbon: 'Lisbon',
    kyoto: 'Kyoto',
    oaxaca: 'Oaxaca',
    tromso: 'Tromso',
    hanoi: 'Hanoi'
  };

  function motionOff() {
    return document.documentElement.getAttribute('data-motion') === 'reduce' ||
      typeof document.startViewTransition !== 'function';
  }

  var vtLock = false;

  function start(update, opts) {
    opts = opts || {};
    if (motionOff()) {
      update();
      return Promise.resolve('instant');
    }
    if (vtLock) return Promise.resolve('locked');
    vtLock = true;
    if (opts.theme) document.documentElement.classList.add('vt-theme');
    var vt;
    try {
      vt = document.startViewTransition(update);
    } catch (err) {
      vtLock = false;
      document.documentElement.classList.remove('vt-theme');
      update();
      return Promise.resolve(err && err.name ? err.name : 'error');
    }
    if (vt.ready) vt.ready.catch(function () {});
    if (vt.updateCallbackDone) vt.updateCallbackDone.catch(function () {});
    return vt.finished.catch(function () {}).then(function () {
      vtLock = false;
      document.documentElement.classList.remove('vt-theme');
      return 'done';
    });
  }

  function syncThemeButtons() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    });
  }

  document.addEventListener('pointermove', function (e) {
    document.documentElement.style.setProperty('--x', e.clientX + 'px');
    document.documentElement.style.setProperty('--y', e.clientY + 'px');
  }, { passive: true });

  function pointFrom(event, el) {
    if (event && event.detail !== 0 && (event.clientX || event.clientY)) {
      return { x: event.clientX, y: event.clientY };
    }
    var rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      var point = pointFrom(event, btn);
      document.documentElement.style.setProperty('--x', point.x + 'px');
      document.documentElement.style.setProperty('--y', point.y + 'px');
      var nextLight = document.documentElement.getAttribute('data-theme') !== 'light';
      start(function () {
        if (nextLight) document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
        try {
          localStorage.setItem('driftwood-theme', nextLight ? 'light' : 'dark');
        } catch (err) {}
        syncThemeButtons();
      }, { theme: true });
    });
  });
  syncThemeButtons();

  var rail = document.querySelector('.rail');

  function currentStep() {
    return document.documentElement.getAttribute('data-step') || 'p01';
  }

  function syncTabs() {
    if (!rail) return;
    var id = currentStep();
    rail.querySelectorAll('[role="tab"]').forEach(function (tab) {
      var on = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
  }

  function resetGuide() {
    var stage = document.getElementById('guide-stage');
    if (!stage) return;
    stage.removeAttribute('data-open');
    var page = stage.querySelector('.page');
    if (page) page.classList.remove('is-open');
    stage.querySelectorAll('.is-hero').forEach(function (el) {
      el.classList.remove('is-hero');
    });
  }

  function showStep(id) {
    if (!/^p0[1-7]$/.test(id)) return;
    resetGuide();
    document.documentElement.setAttribute('data-step', id);
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    syncTabs();
    if (id === 'p02') requestAnimationFrame(measureMorph);
  }

  if (rail) {
    syncTabs();
    rail.addEventListener('click', function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (!tab || !rail.contains(tab)) return;
      showStep(tab.getAttribute('aria-controls'));
    });
    rail.addEventListener('keydown', function (event) {
      var keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (keys.indexOf(event.key) === -1) return;
      var tabs = Array.prototype.slice.call(rail.querySelectorAll('[role="tab"]'));
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else index = (index - 1 + tabs.length) % tabs.length;
      tabs[index].focus();
      showStep(tabs[index].getAttribute('aria-controls'));
    });
    window.addEventListener('hashchange', function () {
      var id = (location.hash || '').replace(/^#/, '');
      if (/^p0[1-7]$/.test(id) && id !== currentStep()) showStep(id);
    });
    document.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showStep(btn.getAttribute('data-goto'));
        var tab = rail.querySelector('[aria-controls="' + btn.getAttribute('data-goto') + '"]');
        if (tab) tab.focus();
      });
    });
  }

  var stage = document.getElementById('guide-stage');
  if (stage) {
    stage.querySelectorAll('.grid .card').forEach(function (card) {
      card.addEventListener('click', function () {
        openGuide(card.getAttribute('data-city'), card);
      });
    });
    var back = document.getElementById('guide-back');
    if (back) back.addEventListener('click', closeGuide);
  }

  function focusCity(city) {
    var head = stage && stage.querySelector('.city-' + city + ' h3');
    if (head) head.focus();
  }

  function openGuide(city, card) {
    if (!stage || !CITIES[city] || stage.getAttribute('data-open')) return;
    var page = stage.querySelector('.page');
    if (motionOff()) {
      stage.setAttribute('data-open', city);
      page.classList.add('is-open');
      focusCity(city);
      return;
    }
    stage.querySelectorAll('.is-hero').forEach(function (el) {
      el.classList.remove('is-hero');
    });
    card.classList.add('is-hero');
    start(function () {
      card.classList.remove('is-hero');
      stage.setAttribute('data-open', city);
      page.classList.add('is-open');
    }).then(function (result) {
      if (result === 'locked') {
        card.classList.remove('is-hero');
        return;
      }
      focusCity(city);
    });
  }

  function closeGuide() {
    if (!stage) return;
    var city = stage.getAttribute('data-open');
    if (!city) return;
    var card = stage.querySelector('.grid .card[data-city="' + city + '"]');
    var page = stage.querySelector('.page');
    if (motionOff()) {
      stage.removeAttribute('data-open');
      page.classList.remove('is-open');
      if (card) card.focus();
      return;
    }
    start(function () {
      stage.removeAttribute('data-open');
      page.classList.remove('is-open');
      if (card) card.classList.add('is-hero');
    }).then(function (result) {
      if (result === 'locked' || !card) return;
      card.classList.remove('is-hero');
      card.focus();
    });
  }

  var morph = document.getElementById('morph');
  var morphGo = document.getElementById('morph-go');
  var morphEq = document.getElementById('morph-eq');
  var oldM = { width: 353, top: 137, radius: 18 };
  var newM = { width: 100, top: 15, radius: 0 };

  function readBox(el) {
    var style = getComputedStyle(el);
    return {
      width: Math.round(el.getBoundingClientRect().width),
      top: Math.round(el.offsetTop),
      radius: Math.round(parseFloat(style.borderTopLeftRadius) || 0)
    };
  }

  function fmt(kind, value) {
    return kind + ' ' + value + 'px';
  }

  function paintSide(side, metrics) {
    var root = document.querySelector('[data-side="' + side + '"]');
    if (!root) return;
    root.querySelector('[data-k="width"]').textContent = fmt('width', metrics.width);
    root.querySelector('[data-k="top"]').textContent = fmt('top', metrics.top);
    root.querySelector('[data-k="radius"]').textContent = fmt('radius', metrics.radius);
  }

  function paintEq() {
    if (!morphEq) return;
    morphEq.innerHTML =
      'width: ' + oldM.width + 'px → ' + newM.width + 'px<br>' +
      'top: ' + oldM.top + 'px → ' + newM.top + 'px<br>' +
      'radius: ' + oldM.radius + 'px → ' + newM.radius + 'px';
  }

  function paintMorphText(metrics) {
    if (!morph) return;
    morph.querySelector('[data-k="width"]').textContent = fmt('width', metrics.width);
    morph.querySelector('[data-k="top"]').textContent = fmt('top', metrics.top);
    morph.querySelector('[data-k="radius"]').textContent = fmt('radius', metrics.radius);
  }

  function measureMorph() {
    if (!morph || currentStep() !== 'p02') return;
    var wasNext = morph.classList.contains('is-next');
    if (wasNext) morph.classList.remove('is-next');
    var big = readBox(morph);
    morph.classList.add('is-next');
    var small = readBox(morph);
    morph.classList.toggle('is-next', wasNext);
    if (big.width > 20) oldM = big;
    if (small.width > 20) newM = small;
    paintSide('old', oldM);
    paintSide('new', newM);
    paintEq();
    paintMorphText(wasNext ? newM : oldM);
  }

  if (morph && morphGo) {
    if (currentStep() === 'p02') requestAnimationFrame(measureMorph);
    window.addEventListener('resize', function () {
      if (currentStep() === 'p02') measureMorph();
    });
    morphGo.addEventListener('click', function () {
      var toNext = !morph.classList.contains('is-next');
      start(function () {
        morph.classList.toggle('is-next', toNext);
        paintMorphText(toNext ? newM : oldM);
        morphGo.textContent = toNext ? 'Morph back' : 'Morph snapshots';
        morphGo.setAttribute('aria-pressed', toNext ? 'true' : 'false');
      });
    });
  }

  document.querySelectorAll('[data-trips]').forEach(initTrips);

  function initTrips(root) {
    var list = root.querySelector('[data-list]');
    if (!list) return;
    var status = root.querySelector('[data-status]');
    var state = { sort: 'city', winter: false };

    function say(text) {
      if (status) status.textContent = text;
    }

    function apply(animate) {
      var items = Array.prototype.slice.call(list.children);
      items.sort(function (a, b) {
        if (state.sort === 'month') {
          return Number(a.getAttribute('data-month')) - Number(b.getAttribute('data-month')) ||
            a.getAttribute('data-city').localeCompare(b.getAttribute('data-city'));
        }
        return a.getAttribute('data-city').localeCompare(b.getAttribute('data-city'));
      });
      var update = function () {
        items.forEach(function (li) {
          var show = !state.winter || li.getAttribute('data-season') === 'winter';
          li.hidden = !show;
          list.appendChild(li);
        });
      };
      if (animate) start(update);
      else update();
      root.querySelectorAll('[data-sort]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-sort') === state.sort ? 'true' : 'false');
      });
      root.querySelectorAll('[data-filter]').forEach(function (btn) {
        var on = (btn.getAttribute('data-filter') === 'winter') === state.winter;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    apply(false);

    root.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.sort = btn.getAttribute('data-sort');
        apply(true);
      });
    });
    root.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.winter = btn.getAttribute('data-filter') === 'winter';
        apply(true);
      });
    });

    var dup = root.querySelector('[data-dup]');
    if (dup) {
      dup.addEventListener('click', function () {
        var visible = Array.prototype.filter.call(list.children, function (li) {
          return !li.hidden;
        });
        if (visible.length < 2) {
          say('Show at least two rows, then try the duplicate again.');
          return;
        }
        var first = visible[0];
        var second = visible[1];
        var nameA = first.style.viewTransitionName;
        var nameB = second.style.viewTransitionName;
        second.style.viewTransitionName = nameA;
        start(function () {
          list.insertBefore(second, first);
        }).then(function () {
          second.style.viewTransitionName = nameB;
          say('Duplicate name = skipped. Both rows used ' + nameA + ', so that name did not track. City or Month sorts the list again.');
        });
      });
    }

    var twice = root.querySelector('[data-twice]');
    if (twice) {
      twice.addEventListener('click', function () {
        if (typeof document.startViewTransition !== 'function') {
          say('This browser has no startViewTransition. The list still changes; the swap is instant.');
          return;
        }
        if (motionOff()) {
          say('Reduced motion skips the transition, so a second call is not started.');
          return;
        }
        document.documentElement.classList.add('vt-hold');
        var firstCall;
        try {
          firstCall = document.startViewTransition(function () {
            document.documentElement.classList.toggle('vt-tick');
          });
        } catch (err) {
          document.documentElement.classList.remove('vt-hold');
          say(err.name + '. A second startViewTransition, while one is running, throws.');
          return;
        }
        if (firstCall.ready) firstCall.ready.catch(function () {});
        var finishedName = '';
        firstCall.finished.catch(function (err) {
          finishedName = err && err.name ? err.name : 'error';
        });
        window.setTimeout(function () {
          var second = '';
          var next;
          try {
            next = document.startViewTransition(function () {
              document.documentElement.classList.toggle('vt-tick');
            });
          } catch (err) {
            second = err.name;
          }
          if (next) {
            if (next.ready) next.ready.catch(function () {});
            if (next.updateCallbackDone) next.updateCallbackDone.catch(function () {});
            next.finished.catch(function () {}).then(function () {
              document.documentElement.classList.remove('vt-hold');
            });
          } else {
            document.documentElement.classList.remove('vt-hold');
          }
          window.setTimeout(function () {
            if (second) {
              say(second + '. A second startViewTransition, while one is running, throws.');
            } else if (finishedName) {
              say(finishedName + '. The new call skips the transition already running. Older browsers throw InvalidStateError.');
            } else {
              say('This browser replaces the running transition. Older browsers throw InvalidStateError. A duplicate name is still skipped.');
            }
          }, 40);
        }, 60);
      });
    }
  }

  var shareBtn = document.querySelector('[data-share]');
  var shareDialog = document.querySelector('.share-dialog');
  if (shareBtn && shareDialog) {
    var copyBtn = shareDialog.querySelector('.copy-link');
    var closeBtn = shareDialog.querySelector('.share-close');
    var copyTimer = 0;

    function shareTarget() {
      if (document.body.getAttribute('data-screen') === 'place') return location.href;
      return new URL('view-transitions-lisbon.html', location.href).href;
    }

    function openShare() {
      if (shareDialog.open) return;
      if (motionOff()) {
        shareDialog.showModal();
        return;
      }
      shareBtn.style.viewTransitionName = 'origin';
      start(function () {
        shareBtn.style.viewTransitionName = 'none';
        shareDialog.style.viewTransitionName = 'origin';
        shareDialog.showModal();
      }).then(function (result) {
        if (result === 'locked') shareBtn.style.viewTransitionName = 'none';
      });
    }

    function closeShare() {
      if (!shareDialog.open) return;
      var finish = function () {
        shareBtn.style.viewTransitionName = 'none';
        shareBtn.focus();
      };
      if (motionOff()) {
        shareDialog.close();
        finish();
        return;
      }
      start(function () {
        shareDialog.close();
        shareDialog.style.viewTransitionName = 'none';
        shareBtn.style.viewTransitionName = 'origin';
      }).then(function (result) {
        if (result === 'locked') return;
        finish();
      });
    }

    shareBtn.addEventListener('click', openShare);
    if (closeBtn) closeBtn.addEventListener('click', closeShare);
    shareDialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeShare();
    });
    shareDialog.addEventListener('click', function (event) {
      if (event.target === shareDialog) closeShare();
    });
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = shareTarget();
        var done = function () {
          copyBtn.textContent = 'Copied';
          window.clearTimeout(copyTimer);
          copyTimer = window.setTimeout(function () {
            copyBtn.textContent = 'Copy link';
          }, 1600);
        };
        var fallback = function () {
          var input = document.createElement('textarea');
          input.value = text;
          input.setAttribute('readonly', '');
          input.style.position = 'fixed';
          input.style.left = '-999px';
          document.body.appendChild(input);
          input.select();
          try { document.execCommand('copy'); } catch (err) {}
          input.remove();
          done();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else {
          fallback();
        }
      });
    }
  }

  if (document.body.getAttribute('data-screen') === 'place') {
    var city = document.documentElement.getAttribute('data-city') || 'lisbon';
    if (CITIES[city]) document.title = CITIES[city] + ' · Driftwood';
  }
})();

/* Original interactions for the Transitions playground. */
(function () {
  "use strict";

  function motionOn() {
    return document.documentElement.getAttribute("data-motion") !== "reduce";
  }

  function $(id) {
    return document.getElementById(id);
  }

  function reflow(el) {
    return el.offsetWidth;
  }

  function initFilters() {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".filters button"));
    var studies = Array.prototype.slice.call(document.querySelectorAll(".study"));
    var live = $("filter-live");
    if (!chips.length) return;

    function select(name, chip) {
      studies.forEach(function (study) {
        var groups = (study.getAttribute("data-group") || "").split(/\s+/);
        study.hidden = !(name === "all" || groups.indexOf(name) !== -1);
      });
      chips.forEach(function (item) {
        var on = item === chip;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
      });
      if (live) {
        var shown = studies.filter(function (study) { return !study.hidden; }).length;
        live.textContent = "Showing " + shown + " studies";
      }
    }

    chips.forEach(function (chip, index) {
      chip.addEventListener("click", function () {
        select(chip.getAttribute("data-filter"), chip);
      });
      chip.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight") next = chips[(index + 1) % chips.length];
        else if (event.key === "ArrowLeft") next = chips[(index - 1 + chips.length) % chips.length];
        else if (event.key === "Home") next = chips[0];
        else if (event.key === "End") next = chips[chips.length - 1];
        if (!next) return;
        event.preventDefault();
        next.focus();
        select(next.getAttribute("data-filter"), next);
      });
    });
  }

  function initResize() {
    var note = $("note");
    var button = $("note-btn");
    if (!note || !button) return;
    button.addEventListener("click", function () {
      var big = note.classList.toggle("is-big");
      button.textContent = big ? "Shrink" : "Grow";
    });
  }

  function paintDigits(host, value, previous, animate, kind) {
    host.textContent = "";
    host.setAttribute("aria-label", value);
    var dir = 1;
    if (kind === "subtle" && previous) {
      var prevNum = Number(String(previous).replace(/,/g, ""));
      var nextNum = Number(String(value).replace(/,/g, ""));
      dir = nextNum >= prevNum ? 1 : -1;
    }
    var chars = String(value).split("");
    var prevChars = previous ? String(previous).split("") : chars;
    chars.forEach(function (ch, index) {
      var slot = document.createElement("span");
      slot.className = "slot";
      slot.style.setProperty("--dir", String(dir));
      if (ch === "." || ch === ",") slot.style.minWidth = "0.45ch";
      else slot.style.minWidth = "1ch";
      var changed = animate && motionOn() && prevChars[index] !== ch;
      if (!changed) {
        var still = document.createElement("span");
        still.className = "face";
        still.textContent = ch;
        slot.appendChild(still);
      } else {
        var oldFace = document.createElement("span");
        oldFace.className = "face is-out";
        oldFace.textContent = prevChars[index] || "";
        var newFace = document.createElement("span");
        newFace.className = "face is-in";
        newFace.textContent = ch;
        var delay = kind === "subtle" ? 0 : 50 + index * 40;
        var outDelay = kind === "subtle" ? 0 : index * 40;
        oldFace.style.animationDelay = outDelay + "ms";
        newFace.style.animationDelay = delay + "ms";
        slot.appendChild(oldFace);
        slot.appendChild(newFace);
      }
      host.appendChild(slot);
    });
  }

  function initNumber() {
    var host = $("num-digits");
    var button = $("num-next");
    if (!host || !button) return;
    var values = ["24.80", "31.40", "18.05", "42.16"];
    var index = 0;
    var busy = false;
    paintDigits(host, values[0], null, false, "pop");
    button.addEventListener("click", function () {
      if (busy) return;
      var previous = values[index];
      index = (index + 1) % values.length;
      var next = values[index];
      busy = true;
      button.disabled = true;
      paintDigits(host, next, previous, true, "pop");
      window.setTimeout(function () {
        paintDigits(host, next, null, false, "pop");
        busy = false;
        button.disabled = false;
      }, motionOn() ? 600 + 50 + next.length * 40 + 40 : 0);
    });
  }

  function initBadge() {
    var badge = $("badge");
    var button = $("bell");
    if (!badge || !button) return;
    button.addEventListener("click", function () {
      var open = badge.getAttribute("data-open") !== "true";
      if (open) {
        badge.removeAttribute("data-open");
        reflow(badge);
      }
      badge.setAttribute("data-open", open ? "true" : "false");
      button.setAttribute("aria-pressed", open ? "true" : "false");
    });
  }

  function swapText(host, lineClass, text, gap) {
    var current = host.querySelector("." + lineClass);
    if (!current) return;
    if (!motionOn()) {
      current.textContent = text;
      return;
    }
    current.classList.add("is-exit");
    var next = document.createElement("span");
    next.className = lineClass + (host.classList.contains("think") ? " shimmer" : "") + " is-prep";
    next.textContent = text;
    host.appendChild(next);
    reflow(next);
    window.setTimeout(function () {
      next.classList.remove("is-prep");
    }, gap);
    window.setTimeout(function () {
      if (current.parentNode) current.remove();
    }, 150 + gap);
  }

  function initSwap() {
    var host = $("swap");
    var button = $("swap-btn");
    if (!host || !button) return;
    var lines = ["Saving the note", "Note saved", "Ready to share"];
    var index = 0;
    button.addEventListener("click", function () {
      index = (index + 1) % lines.length;
      swapText(host, "swap-line", lines[index], 0);
    });
  }

  function initMenu() {
    var menu = $("menu");
    var button = $("menu-btn");
    var panel = $("menu-panel");
    if (!menu || !button || !panel) return;

    function close() {
      if (!menu.classList.contains("is-open")) return;
      menu.classList.add("is-closing");
      menu.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      panel.setAttribute("inert", "");
      window.setTimeout(function () { menu.classList.remove("is-closing"); }, motionOn() ? 150 : 0);
    }

    function open() {
      menu.classList.remove("is-closing");
      menu.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      panel.removeAttribute("inert");
    }

    button.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) close();
      else open();
    });
    panel.addEventListener("click", function (event) {
      if (event.target.closest("button")) close();
    });
    panel.addEventListener("keydown", function (event) {
      var items = Array.prototype.slice.call(panel.querySelectorAll("button"));
      var current = items.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(current + 1) % items.length].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(current - 1 + items.length) % items.length].focus();
      }
    });
    return { close: close, root: menu, button: button };
  }

  function initModal() {
    var scrim = $("scrim");
    var dialog = $("dialog");
    var openBtn = $("modal-open");
    var closeBtn = $("modal-close");
    if (!scrim || !dialog || !openBtn || !closeBtn) return;

    function open() {
      scrim.classList.add("is-open");
      dialog.removeAttribute("inert");
      closeBtn.focus();
    }

    function close() {
      if (!scrim.classList.contains("is-open")) return;
      scrim.classList.remove("is-open");
      dialog.setAttribute("inert", "");
      openBtn.focus();
    }

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    scrim.addEventListener("click", function (event) {
      if (event.target === scrim) close();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      event.preventDefault();
      closeBtn.focus();
    });
    return { close: close, isOpen: function () { return scrim.classList.contains("is-open"); } };
  }

  function initPanel() {
    var frame = $("panel");
    var button = $("panel-btn");
    if (!frame || !button) return;
    button.addEventListener("click", function () {
      var open = frame.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? "Hide" : "Details";
    });
  }

  function initPages() {
    var view = $("pager");
    var back = $("page-back");
    var forward = $("page-forward");
    if (!view || !back || !forward) return;
    var pages = Array.prototype.slice.call(view.querySelectorAll(".sheet-page"));
    var index = 0;
    var busy = false;

    function sync() {
      pages.forEach(function (page, i) {
        var on = i === index;
        page.classList.toggle("is-current", on);
        page.classList.remove("from-right", "from-left", "to-left", "to-right", "is-show");
        if (on) {
          page.removeAttribute("aria-hidden");
          page.removeAttribute("inert");
        } else {
          page.setAttribute("aria-hidden", "true");
          page.setAttribute("inert", "");
        }
      });
      back.disabled = index === 0;
      forward.disabled = index === pages.length - 1;
    }

    function go(dir) {
      var next = index + dir;
      if (busy || next < 0 || next >= pages.length) return;
      var current = pages[index];
      var upcoming = pages[next];
      if (!motionOn()) {
        index = next;
        sync();
        return;
      }
      busy = true;
      upcoming.classList.add(dir > 0 ? "from-right" : "from-left");
      reflow(upcoming);
      upcoming.classList.add("is-current", "is-show");
      current.classList.add(dir > 0 ? "to-left" : "to-right");
      window.setTimeout(function () {
        index = next;
        busy = false;
        sync();
      }, 260);
    }

    back.addEventListener("click", function () { go(-1); });
    forward.addEventListener("click", function () { go(1); });
    sync();
  }

  function initIcon() {
    var button = $("icon-swap");
    if (!button) return;
    button.addEventListener("click", function () {
      var on = button.classList.toggle("is-on");
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.setAttribute("aria-label", on ? "Close menu" : "Open menu");
    });
  }

  function initSuccess() {
    var button = $("success");
    var mark = $("success-mark");
    if (!button || !mark) return;
    var shown = false;
    var busy = false;
    button.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      shown = !shown;
      mark.classList.remove("is-in", "is-out");
      reflow(mark);
      mark.classList.add(shown ? "is-in" : "is-out");
      button.setAttribute("aria-pressed", shown ? "true" : "false");
      button.lastElementChild.textContent = shown ? "Clear" : "Mark done";
      window.setTimeout(function () { busy = false; }, motionOn() ? 520 : 0);
      if (!motionOn() && shown) {
        mark.style.opacity = "1";
        mark.style.filter = "none";
        var tick = mark.querySelector(".tick");
        if (tick) tick.style.strokeDashoffset = "0";
      }
      if (!motionOn() && !shown) {
        mark.style.opacity = "0";
        mark.style.filter = "blur(4px)";
      }
    });
  }

  function initAvatars() {
    var group = $("avatars");
    if (!group) return;
    var nodes = Array.prototype.slice.call(group.querySelectorAll(".avatar"));

    function lift(index) {
      if (!motionOn()) return;
      group.classList.remove("is-return");
      nodes.forEach(function (el, i) {
        var fall = Math.pow(0.45, Math.abs(i - index));
        el.style.transform = "translateY(" + (-4 * fall) + "px) scale(" + (1 + 0.05 * fall) + ")";
        el.style.zIndex = i === index ? "5" : String(i);
      });
    }

    function drop() {
      group.classList.add("is-return");
      nodes.forEach(function (el, i) {
        el.style.transform = "";
        el.style.zIndex = String(i);
      });
    }

    nodes.forEach(function (el, index) {
      el.addEventListener("pointerenter", function () { lift(index); });
      el.addEventListener("focus", function () { lift(index); });
    });
    group.addEventListener("pointerleave", drop);
    group.addEventListener("focusout", function (event) {
      if (!group.contains(event.relatedTarget)) drop();
    });
  }

  function initShake() {
    var field = $("shake-field");
    var input = $("shake-input");
    var err = $("shake-err");
    var button = $("shake-btn");
    if (!field || !input || !err || !button) return;
    var timer = 0;

    function clear() {
      field.classList.remove("is-error");
      err.textContent = "";
    }

    button.addEventListener("click", function () {
      var value = input.value.trim();
      var ok = value.indexOf("@") !== -1 && value.indexOf(".") !== -1;
      if (ok) {
        clear();
        err.textContent = "Looks right.";
        return;
      }
      window.clearTimeout(timer);
      field.classList.remove("is-error");
      reflow(field);
      field.classList.add("is-error");
      err.textContent = "Use a full desk address.";
      timer = window.setTimeout(clear, 3000);
    });
    input.addEventListener("input", function () {
      if (field.classList.contains("is-error")) clear();
    });
  }

  function initClear() {
    var input = $("clear-input");
    var button = $("clear-btn");
    var reset = $("clear-reset");
    var wrap = $("clear-wrap");
    var ph = $("clear-ph");
    if (!input || !button || !wrap || !ph) return;
    var stock = "How should the note open?";

    function mirror(text, incoming) {
      var layer = document.createElement("div");
      layer.className = "fly";
      layer.setAttribute("aria-hidden", "true");
      text.split(/\s+/).forEach(function (word, index) {
        if (!word) return;
        var span = document.createElement("span");
        span.textContent = word;
        span.style.animationDelay = (index * 50) + "ms";
        if (incoming) {
          span.style.animationName = "ph-in";
          span.style.animationDuration = "400ms";
        }
        layer.appendChild(span);
      });
      wrap.appendChild(layer);
      window.setTimeout(function () { layer.remove(); }, motionOn() ? 1000 : 0);
      return layer;
    }

    button.addEventListener("click", function () {
      var value = input.value.trim();
      if (!value) return;
      if (motionOn()) mirror(value, false);
      input.value = "";
      input.classList.add("has-mirror");
      ph.classList.remove("is-in");
      reflow(ph);
      ph.classList.add("is-in");
      window.setTimeout(function () { input.classList.remove("has-mirror"); }, motionOn() ? 400 : 0);
    });

    if (reset) {
      reset.addEventListener("click", function () {
        input.value = stock;
        input.classList.remove("has-mirror");
        ph.classList.remove("is-in");
      });
    }
  }

  function initSkeleton() {
    var skel = $("skel");
    var real = $("person");
    var button = $("skel-btn");
    if (!skel || !real || !button) return;

    function play() {
      real.hidden = true;
      real.classList.remove("is-in");
      skel.hidden = false;
      skel.classList.remove("is-pulse");
      reflow(skel);
      if (motionOn()) skel.classList.add("is-pulse");
      window.setTimeout(function () {
        skel.hidden = true;
        real.hidden = false;
        if (motionOn()) {
          reflow(real);
          real.classList.add("is-in");
        } else {
          real.classList.add("is-in");
          real.style.opacity = "1";
          real.style.filter = "none";
        }
      }, motionOn() ? 1000 : 0);
    }

    button.addEventListener("click", play);
    if (!motionOn()) {
      skel.hidden = true;
      real.hidden = false;
      real.style.opacity = "1";
      real.style.filter = "none";
    }
  }

  function initReveal() {
    var box = $("rise");
    var button = $("rise-btn");
    if (!box || !button) return;
    function play() {
      box.classList.remove("is-play");
      reflow(box);
      box.classList.add("is-play");
      if (!motionOn()) {
        box.querySelectorAll("p").forEach(function (line) {
          line.style.opacity = "1";
          line.style.transform = "none";
          line.style.filter = "none";
        });
      }
    }
    button.addEventListener("click", play);
  }

  function initTabs() {
    var list = $("tabs");
    var pill = $("tab-pill");
    var copy = $("tab-copy");
    if (!list || !pill || !copy) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
    var lines = {
      day: "Tuesday desk",
      week: "Six quiet mornings",
      month: "The April ledger"
    };

    function move() {
      var current = list.querySelector("[aria-selected='true']");
      if (!current) return;
      pill.style.width = current.offsetWidth + "px";
      pill.style.transform = "translateX(" + current.offsetLeft + "px)";
    }

    function select(tab) {
      tabs.forEach(function (item) {
        var on = item === tab;
        item.setAttribute("aria-selected", on ? "true" : "false");
        item.tabIndex = on ? 0 : -1;
      });
      copy.textContent = lines[tab.getAttribute("data-tab")] || "";
      move();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        else if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        else if (event.key === "Home") next = tabs[0];
        else if (event.key === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        event.preventDefault();
        select(next);
        next.focus();
      });
    });
    move();
    window.addEventListener("resize", move);
  }

  function initShimmer() {
    var line = $("shimmer");
    var button = $("shimmer-btn");
    if (!line || !button) return;
    button.addEventListener("click", function () {
      line.style.animation = "none";
      reflow(line);
      line.style.animation = "";
    });
  }

  function initTooltip() {
    var root = $("tips");
    var tip = $("tip");
    if (!root || !tip) return;
    var buttons = Array.prototype.slice.call(root.querySelectorAll("button"));
    var showTimer = 0;
    var hideTimer = 0;
    var current = null;

    function place(button, moving) {
      window.clearTimeout(hideTimer);
      tip.hidden = false;
      tip.textContent = button.getAttribute("data-tip") || "";
      var previous = tip.style.width;
      tip.style.width = "auto";
      var width = tip.offsetWidth;
      var top = -(tip.offsetHeight + 8);
      var left = button.offsetLeft + (button.offsetWidth - width) / 2;
      if (moving && previous) {
        tip.style.width = previous;
        reflow(tip);
      }
      tip.style.width = width + "px";
      tip.style.left = Math.max(0, left) + "px";
      tip.style.top = top + "px";
      tip.classList.add("is-on");
      tip.setAttribute("aria-hidden", "false");
      current = button;
    }

    function show(button) {
      var moving = tip.classList.contains("is-on");
      window.clearTimeout(showTimer);
      if (moving || !motionOn()) place(button, moving);
      else showTimer = window.setTimeout(function () { place(button, false); }, 80);
    }

    function hide() {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () {
        tip.classList.remove("is-on");
        current = null;
        window.setTimeout(function () {
          if (!tip.classList.contains("is-on")) {
            tip.hidden = true;
            tip.setAttribute("aria-hidden", "true");
          }
        }, motionOn() ? 50 : 0);
      }, 40);
    }

    buttons.forEach(function (button) {
      button.addEventListener("pointerenter", function () { show(button); });
      button.addEventListener("focus", function () { show(button); });
      button.addEventListener("pointerleave", hide);
      button.addEventListener("blur", hide);
      button.addEventListener("click", function () {
        if (current === button && tip.classList.contains("is-on")) hide();
        else show(button);
      });
    });

    return { hide: function () { tip.classList.remove("is-on"); tip.hidden = true; } };
  }

  function initTilt() {
    var tilt = $("tilt");
    var card = $("tilt-card");
    if (!tilt || !card) return;

    function set(event) {
      if (!motionOn()) return;
      var rect = tilt.getBoundingClientRect();
      var px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      var py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      tilt.classList.add("is-hot");
      card.style.setProperty("--ry", ((px - 0.5) * 40).toFixed(2) + "deg");
      card.style.setProperty("--rx", ((0.5 - py) * 40).toFixed(2) + "deg");
      card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
    }

    function reset() {
      tilt.classList.remove("is-hot");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    }

    tilt.addEventListener("pointermove", set);
    tilt.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse") {
        try { tilt.setPointerCapture(event.pointerId); } catch (err) { /* already captured */ }
      }
      set(event);
    });
    tilt.addEventListener("pointerup", function (event) {
      if (event.pointerType !== "mouse") reset();
    });
    tilt.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse") reset();
    });
    tilt.addEventListener("pointercancel", reset);
  }

  function initMorph() {
    var morph = $("morph");
    var hit = $("morph-hit");
    var panel = $("morph-menu");
    if (!morph || !hit || !panel) return;

    function close() {
      if (morph.getAttribute("data-open") !== "true") return;
      morph.classList.add("is-closing");
      morph.setAttribute("data-open", "false");
      hit.setAttribute("aria-expanded", "false");
      hit.setAttribute("aria-label", "Add");
      panel.setAttribute("inert", "");
      window.setTimeout(function () { morph.classList.remove("is-closing"); }, motionOn() ? 700 : 0);
    }

    function open() {
      morph.classList.remove("is-closing");
      morph.setAttribute("data-open", "true");
      hit.setAttribute("aria-expanded", "true");
      hit.setAttribute("aria-label", "Close add menu");
      panel.removeAttribute("inert");
    }

    hit.addEventListener("click", function () {
      if (morph.getAttribute("data-open") === "true") close();
      else open();
    });
    panel.addEventListener("click", function (event) {
      if (event.target.closest("button")) close();
    });
    return { close: close, root: morph, isOpen: function () { return morph.getAttribute("data-open") === "true"; } };
  }

  function initAccordion() {
    var root = $("acc");
    if (!root) return;
    var items = Array.prototype.slice.call(root.querySelectorAll(".acc-item"));
    items.forEach(function (item) {
      var button = item.querySelector("button");
      button.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        items.forEach(function (other) {
          other.classList.remove("is-open");
          other.querySelector("button").setAttribute("aria-expanded", "false");
        });
        if (!open) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function initToast() {
    var toast = $("toast");
    var button = $("toast-btn");
    if (!toast || !button) return;
    var timer = 0;

    function close() {
      toast.classList.remove("is-on");
    }

    button.addEventListener("click", function () {
      window.clearTimeout(timer);
      if (toast.classList.contains("is-on")) {
        close();
        return;
      }
      toast.classList.add("is-on");
      if (motionOn()) timer = window.setTimeout(close, 1600);
    });
  }

  function initLike() {
    var button = $("like");
    var count = $("like-count");
    if (!button || !count) return;
    var liked = false;
    button.addEventListener("click", function () {
      liked = !liked;
      button.classList.toggle("is-on", liked);
      button.setAttribute("aria-pressed", liked ? "true" : "false");
      count.textContent = liked ? "25" : "24";
      if (!liked || !motionOn()) return;
      button.classList.remove("is-pop");
      reflow(button);
      button.classList.add("is-pop");
      for (var i = 0; i < 8; i++) {
        (function (index) {
          var spark = document.createElement("span");
          spark.className = "spark";
          var rad = (Math.PI * 2 * index) / 8;
          spark.style.setProperty("--sx", (Math.cos(rad) * 20).toFixed(1) + "px");
          spark.style.setProperty("--sy", (Math.sin(rad) * 20).toFixed(1) + "px");
          button.appendChild(spark);
          spark.addEventListener("animationend", function () { spark.remove(); });
        })(i);
      }
    });
  }

  function initLearn() {
    var button = $("learn");
    if (!button) return;
    button.addEventListener("click", function () {
      var on = button.classList.toggle("is-on");
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function initCheckbox() {
    var button = $("check");
    if (!button) return;
    button.addEventListener("click", function () {
      var on = button.getAttribute("aria-checked") !== "true";
      button.setAttribute("aria-checked", on ? "true" : "false");
      button.classList.toggle("is-off", !on);
    });
  }

  function paintReel(host, value, rolling) {
    host.textContent = "";
    host.setAttribute("aria-label", String(value));
    String(value).padStart(3, "0").split("").forEach(function (ch) {
      var n = Number(ch);
      var col = document.createElement("span");
      col.className = "col" + (rolling ? " is-rolling" : "");
      [-1, 0, 1].forEach(function (offset) {
        var face = document.createElement("span");
        face.className = "face " + (offset < 0 ? "prev" : offset > 0 ? "next" : "cur");
        face.textContent = String((n + offset + 10) % 10);
        col.appendChild(face);
      });
      host.appendChild(col);
    });
  }

  function initReel() {
    var host = $("reel");
    var button = $("reel-btn");
    if (!host || !button) return;
    var values = [100, 178, 246];
    var index = 0;
    var busy = false;
    paintReel(host, values[0], false);

    function rollTo(from, to) {
      var fromDigits = String(from).padStart(3, "0").split("").map(Number);
      var toDigits = String(to).padStart(3, "0").split("").map(Number);
      var cols = host.querySelectorAll(".col");
      var pending = cols.length;

      function done() {
        pending -= 1;
        if (pending > 0) return;
        paintReel(host, to, false);
        host.querySelectorAll(".col").forEach(function (col) { col.classList.add("is-land"); });
        window.setTimeout(function () {
          busy = false;
          button.disabled = false;
          host.classList.remove("is-antic");
        }, motionOn() ? 740 : 0);
      }

      cols.forEach(function (col, i) {
        var start = fromDigits[i];
        var end = toDigits[i];
        var steps = (end - start + 10) % 10;
        var delay = motionOn() ? i * 90 : 0;
        window.setTimeout(function () {
          var step = 0;
          function tick() {
            var n = (start + step) % 10;
            var last = step === steps;
            col.classList.toggle("is-rolling", !last);
            col.querySelector(".prev").textContent = String((n + 9) % 10);
            col.querySelector(".cur").textContent = String(n);
            col.querySelector(".next").textContent = String((n + 1) % 10);
            if (last) {
              col.classList.add("is-land");
              done();
              return;
            }
            step += 1;
            window.setTimeout(tick, motionOn() ? 130 : 0);
          }
          tick();
        }, delay);
      });
    }

    button.addEventListener("click", function () {
      if (busy) return;
      var from = values[index];
      index = (index + 1) % values.length;
      var to = values[index];
      busy = true;
      button.disabled = true;
      if (!motionOn()) {
        paintReel(host, to, false);
        busy = false;
        button.disabled = false;
        return;
      }
      host.classList.add("is-antic");
      window.setTimeout(function () {
        host.classList.remove("is-antic");
        rollTo(from, to);
      }, 100);
    });
  }

  function initSubtle() {
    var host = $("subtle");
    var button = $("subtle-btn");
    if (!host || !button) return;
    var values = [1284, 1309, 1276, 1310];
    var index = 0;
    var busy = false;

    function label(n) { return n.toLocaleString("en-US"); }

    paintDigits(host, label(values[0]), null, false, "subtle");
    button.addEventListener("click", function () {
      if (busy) return;
      var previous = label(values[index]);
      index = (index + 1) % values.length;
      var next = label(values[index]);
      busy = true;
      button.disabled = true;
      paintDigits(host, next, previous, true, "subtle");
      window.setTimeout(function () {
        paintDigits(host, next, null, false, "subtle");
        busy = false;
        button.disabled = false;
      }, motionOn() ? 500 : 0);
    });
  }

  function initSwitch() {
    var button = $("switch");
    if (!button) return;
    button.addEventListener("click", function () {
      var on = button.getAttribute("aria-checked") !== "true";
      button.classList.remove("is-going-on", "is-going-off");
      reflow(button);
      if (motionOn()) button.classList.add(on ? "is-going-on" : "is-going-off");
      button.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function initThinking() {
    var host = $("think");
    var button = $("think-btn");
    if (!host) return;
    var lines = ["Reading the brief", "Checking the type", "Writing the line"];
    var index = 0;
    var timer = 0;

    function advance() {
      index = (index + 1) % lines.length;
      swapText(host, "think-line", lines[index], motionOn() ? 50 : 0);
    }

    function loop() {
      window.clearTimeout(timer);
      if (!motionOn()) return;
      timer = window.setTimeout(function () {
        advance();
        loop();
      }, 2000);
    }

    if (button) {
      button.addEventListener("click", function () {
        advance();
        loop();
      });
    }
    loop();
  }

  function initReason() {
    var track = $("reason-track");
    var button = $("reason-btn");
    if (!track) return;
    var lines = [
      "Type sits above the line.",
      "Space stays on the ladder.",
      "Ink for the button.",
      "Bone for the page.",
      "A hairline, then a lift.",
      "Motion waits for the action.",
      "The next line comes later.",
      "File the note, then rest."
    ];
    var offset = 0;
    var timer = 0;
    var resetting = false;

    function render() {
      track.textContent = "";
      lines.concat(lines).forEach(function (line) {
        var p = document.createElement("p");
        p.textContent = line;
        track.appendChild(p);
      });
    }

    function step() {
      if (resetting) return;
      offset += 1;
      track.style.transition = motionOn() ? "" : "none";
      track.style.transform = "translateY(" + (-offset * 3) + "rem)";
      if (offset >= lines.length) {
        resetting = true;
        window.setTimeout(function () {
          track.style.transition = "none";
          offset = 0;
          track.style.transform = "none";
          reflow(track);
          track.style.transition = "";
          resetting = false;
        }, motionOn() ? 500 : 0);
      }
    }

    function loop() {
      window.clearTimeout(timer);
      if (!motionOn()) return;
      timer = window.setTimeout(function () {
        step();
        loop();
      }, 840 + 500);
    }

    render();
    if (button) {
      button.addEventListener("click", function () {
        step();
        loop();
      });
    }
    loop();
  }

  function initStream() {
    var host = $("stream");
    var button = $("stream-btn");
    if (!host) return;
    var sentence = "The margin stays on the ladder so the note can breathe.";

    function play() {
      host.classList.remove("is-play");
      host.textContent = "";
      sentence.split(" ").forEach(function (word, index) {
        var span = document.createElement("span");
        span.textContent = word;
        span.style.animationDelay = (index * 60) + "ms";
        host.appendChild(span);
      });
      reflow(host);
      host.classList.add("is-play");
      if (!motionOn()) {
        host.querySelectorAll("span").forEach(function (span) {
          span.style.opacity = "1";
          span.style.filter = "none";
          span.style.transform = "none";
        });
      }
    }

    play();
    if (button) button.addEventListener("click", play);
  }

  function initMatrix() {
    var grid = $("matrix");
    var pats = $("pats");
    if (!grid || !pats) return;
    var buttons = Array.prototype.slice.call(pats.querySelectorAll("button"));
    var dots = [];
    for (var i = 0; i < 16; i++) {
      var dot = document.createElement("span");
      dot.className = "dot";
      grid.appendChild(dot);
      dots.push(dot);
    }

    var delays = {
      scan: function (index) { return (index % 4) * 300; },
      twinkle: function (index) {
        var table = [0, 720, 180, 960, 420, 80, 600, 300, 900, 240, 1080, 480, 160, 840, 540, 120];
        return table[index];
      },
      orbit: function (index) {
        var order = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4];
        var at = order.indexOf(index);
        return at === -1 ? 600 : at * 100;
      },
      pulse: function (index) {
        var row = Math.floor(index / 4);
        var col = index % 4;
        return (Math.abs(row - 1.5) + Math.abs(col - 1.5)) * 180;
      }
    };

    function apply(name) {
      dots.forEach(function (dot, index) {
        var delay = delays[name](index);
        dot.style.setProperty("--d", delay + "ms");
        var lit = name === "scan" ? index % 4 === 0 : delay === 0;
        dot.classList.toggle("is-lit", lit);
      });
      buttons.forEach(function (button) {
        var on = button.getAttribute("data-pattern") === name;
        button.setAttribute("aria-checked", on ? "true" : "false");
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        apply(button.getAttribute("data-pattern"));
      });
    });
    apply("scan");
  }

  function initBanners() {
    var stack = $("stack");
    var button = $("banner-btn");
    if (!stack || !button) return;
    var notes = ["Note filed", "Shared with Mara", "Archived quietly", "Margin checked"];
    var items = [];
    var cursor = 0;
    var spread = false;

    function layout() {
      var count = items.length;
      items.forEach(function (el, index) {
        var depth = count - 1 - index;
        var y;
        var scale;
        var opacity;
        var blur;
        if (depth > 2) {
          y = -36;
          scale = 0.82;
          opacity = 0;
          blur = 2;
        } else if (spread) {
          y = -((el.offsetHeight || 44) + 8) * depth;
          scale = 1;
          opacity = 1;
          blur = 0;
        } else {
          y = -12 * depth;
          scale = 1 - 0.06 * depth;
          opacity = 1 - 0.4 * depth;
          blur = depth === 0 ? 0 : depth;
        }
        el.style.zIndex = String(20 - depth);
        el.style.transform = "translateY(" + y + "px) scale(" + scale + ")";
        el.style.opacity = String(Math.max(0, opacity));
        el.style.filter = "blur(" + blur + "px)";
      });
    }

    function add(animate) {
      var el = document.createElement("div");
      el.className = "banner";
      el.textContent = notes[cursor % notes.length];
      cursor += 1;
      stack.appendChild(el);
      items.push(el);
      if (animate && motionOn()) {
        el.style.transition = "none";
        el.style.transform = "translateY(3.75rem) scale(0.97)";
        el.style.opacity = "0";
        el.style.filter = "blur(2px)";
        reflow(el);
        el.style.transition = "";
      }
      layout();
      window.setTimeout(function () {
        while (items.length > 3) {
          var old = items.shift();
          if (old.parentNode) old.remove();
        }
        layout();
      }, motionOn() ? 260 : 0);
    }

    stack.addEventListener("pointerenter", function () { spread = true; layout(); });
    stack.addEventListener("pointerleave", function () { spread = false; layout(); });
    stack.addEventListener("focusin", function () { spread = true; layout(); });
    stack.addEventListener("focusout", function (event) {
      if (!stack.contains(event.relatedTarget)) {
        spread = false;
        layout();
      }
    });
    button.addEventListener("click", function () { add(true); });
    add(false);
  }

  var menuApi = initMenu();
  var modalApi = initModal();
  var morphApi = initMorph();
  var tipApi = initTooltip();

  document.addEventListener("pointerdown", function (event) {
    if (menuApi && menuApi.root.classList.contains("is-open") && !menuApi.root.contains(event.target)) {
      menuApi.close();
    }
    if (morphApi && morphApi.isOpen() && !morphApi.root.contains(event.target)) morphApi.close();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (modalApi && modalApi.isOpen()) {
      modalApi.close();
      return;
    }
    if (menuApi && menuApi.root.classList.contains("is-open")) {
      menuApi.close();
      menuApi.button.focus();
      return;
    }
    if (morphApi && morphApi.isOpen()) {
      morphApi.close();
      return;
    }
    if (tipApi) tipApi.hide();
  });

  initFilters();
  initResize();
  initNumber();
  initBadge();
  initSwap();
  initPanel();
  initPages();
  initIcon();
  initSuccess();
  initAvatars();
  initShake();
  initClear();
  initSkeleton();
  initReveal();
  initTabs();
  initShimmer();
  initTilt();
  initAccordion();
  initToast();
  initLike();
  initLearn();
  initCheckbox();
  initReel();
  initSubtle();
  initSwitch();
  initThinking();
  initReason();
  initStream();
  initMatrix();
  initBanners();
})();

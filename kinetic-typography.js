/* Motion prompt gallery. Effects are vendored under vendor/motion-prompt/ (MIT, Shohei Ohtaki). */
(function () {
  "use strict";

  var STILL = 0.35;
  var PACK_LABEL = {
    motion: "Motion",
    camera: "Camera",
    ui: "UI",
    lp: "LP",
    photo: "Photo",
    motion2: "Motion 2",
    lp2: "LP 2",
    camera2: "Camera 2"
  };

  var packChips = document.getElementById("pack-chips");
  var catChips = document.getElementById("cat-chips");
  var catFilter = document.getElementById("cat-filter");
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  var status = document.getElementById("status");

  var params = new URLSearchParams(location.search);
  var forceReduce = params.get("reduce") === "1";
  var forceMotion = params.get("motion") === "1";
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");

  var state = { pack: "all", cat: "all" };
  var packById = Object.create(null);
  var cards = [];
  var active = [];
  var ready = false;
  var reduce = false;
  var rafId = 0;
  var origin = performance.now();
  var countLive = false;
  var io = null;

  function computeReduce() {
    if (forceMotion) return false;
    if (forceReduce) return true;
    return !!(mq && mq.matches);
  }

  function showStatus(message) {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  }

  function hashKey() {
    var raw = location.hash ? location.hash.slice(1) : "";
    if (!raw) return "";
    try {
      raw = decodeURIComponent(raw);
    } catch (err) {}
    raw = raw.trim();
    if (/^\d{1,3}$/.test(raw)) {
      while (raw.length < 3) raw = "0" + raw;
    }
    return raw;
  }

  function findCard(key) {
    if (!key) return null;
    var i;
    for (i = 0; i < cards.length; i++) {
      if (cards[i].id === key || cards[i].slug === key) return cards[i];
    }
    return null;
  }

  function hashedCard() {
    return findCard(hashKey());
  }

  function cardMatches(card) {
    if (state.pack !== "all" && card.pack !== state.pack) return false;
    if (state.cat !== "all" && card.category !== state.cat) return false;
    return true;
  }

  function clearHash() {
    if (!location.hash) return;
    history.replaceState(null, "", location.pathname + location.search);
  }

  function forgetHashIfHidden() {
    var card = hashedCard();
    if (!card) return;
    if (!cardMatches(card)) clearHash();
  }

  function paintSelection(container, value) {
    var nodes = container.querySelectorAll('[role="radio"]');
    var i;
    for (i = 0; i < nodes.length; i++) {
      var on = nodes[i].dataset.value === value;
      nodes[i].setAttribute("aria-checked", on ? "true" : "false");
      nodes[i].tabIndex = on ? 0 : -1;
    }
  }

  function addRadio(container, value, label, checked, title) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.setAttribute("role", "radio");
    button.dataset.value = value;
    button.textContent = label;
    if (title && title !== label) button.title = title;
    button.setAttribute("aria-checked", checked ? "true" : "false");
    button.tabIndex = checked ? 0 : -1;
    button.addEventListener("click", function () {
      if (container === packChips) setPack(value);
      else setCat(value);
    });
    container.appendChild(button);
  }

  function bindArrows(container, onChoose) {
    container.addEventListener("keydown", function (event) {
      var key = event.key;
      if (
        key !== "ArrowRight" &&
        key !== "ArrowLeft" &&
        key !== "ArrowDown" &&
        key !== "ArrowUp" &&
        key !== "Home" &&
        key !== "End"
      ) {
        return;
      }
      var radios = Array.prototype.slice.call(container.querySelectorAll('[role="radio"]'));
      if (!radios.length) return;
      var index = radios.indexOf(document.activeElement);
      if (index < 0) {
        index = 0;
        radios.forEach(function (radio, i) {
          if (radio.getAttribute("aria-checked") === "true") index = i;
        });
      }
      if (key === "Home") index = 0;
      else if (key === "End") index = radios.length - 1;
      else if (key === "ArrowRight" || key === "ArrowDown") index = (index + 1) % radios.length;
      else index = (index - 1 + radios.length) % radios.length;
      event.preventDefault();
      radios[index].focus();
      onChoose(radios[index].dataset.value);
    });
  }

  function renderFilters() {
    paintSelection(packChips, state.pack);
    while (catChips.firstChild) catChips.removeChild(catChips.firstChild);
    if (state.pack === "all") {
      catFilter.hidden = true;
      return;
    }
    var pack = packById[state.pack];
    catFilter.hidden = false;
    addRadio(catChips, "all", "All", state.cat === "all");
    if (pack && pack.categories) {
      pack.categories.forEach(function (cat) {
        addRadio(catChips, cat.slug, cat.en, state.cat === cat.slug);
      });
    }
  }

  function countText(n) {
    var noun = n === 1 ? "effect" : "effects";
    if (state.pack === "all") return n + " " + noun;
    var pack = packById[state.pack];
    var packName = PACK_LABEL[state.pack] || (pack && pack.title) || state.pack;
    if (state.cat === "all") return n + " " + noun + " in " + packName;
    var catName = state.cat;
    if (pack && pack.categories) {
      pack.categories.forEach(function (cat) {
        if (cat.slug === state.cat) catName = cat.en;
      });
    }
    return n + " " + noun + " · " + catName;
  }

  function renderGrid() {
    var shown = 0;
    var target = hashedCard();
    var i;
    for (i = 0; i < cards.length; i++) {
      var card = cards[i];
      var show = cardMatches(card);
      card.el.hidden = !show;
      if (show) shown += 1;
      else deactivate(card);
      card.el.classList.toggle("is-target", !!(target && card === target && show));
    }
    count.hidden = false;
    count.textContent = countText(shown);
    if (!countLive) {
      countLive = true;
      requestAnimationFrame(function () {
        count.setAttribute("aria-live", "polite");
      });
    }
    if (!io) {
      for (i = 0; i < cards.length; i++) {
        if (!cards[i].el.hidden) activate(cards[i]);
      }
      return;
    }
    for (i = 0; i < cards.length; i++) {
      io.unobserve(cards[i].el);
      if (!cards[i].el.hidden) io.observe(cards[i].el);
    }
  }

  function setPack(id) {
    if (state.pack === id && state.cat === "all") {
      paintSelection(packChips, id);
      return;
    }
    state.pack = id;
    state.cat = "all";
    forgetHashIfHidden();
    renderFilters();
    renderGrid();
  }

  function setCat(id) {
    if (state.cat === id) {
      paintSelection(catChips, id);
      return;
    }
    state.cat = id;
    forgetHashIfHidden();
    paintSelection(catChips, id);
    renderGrid();
  }

  function scrollToCard(card) {
    requestAnimationFrame(function () {
      card.el.scrollIntoView({ block: "center", inline: "nearest" });
      if (card.el.tabIndex < 0) card.el.tabIndex = -1;
      try {
        card.el.focus({ preventScroll: true });
      } catch (err) {
        card.el.focus();
      }
    });
  }

  function openHash(scroll) {
    if (!ready) return;
    var card = hashedCard();
    if (card && !cardMatches(card)) {
      state.pack = card.pack;
      state.cat = "all";
    }
    renderFilters();
    renderGrid();
    if (scroll && card && cardMatches(card)) scrollToCard(card);
  }

  function resetContext(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 1;
    ctx.imageSmoothingEnabled = true;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  function ensureSize(card) {
    var canvas = card.canvas;
    if (canvas.width !== card.width || canvas.height !== card.height) {
      canvas.width = card.width;
      canvas.height = card.height;
      card.ctx = canvas.getContext("2d");
    } else if (!card.ctx) {
      card.ctx = canvas.getContext("2d");
    }
  }

  function deactivate(card) {
    card.visible = false;
    var index = active.indexOf(card);
    if (index >= 0) active.splice(index, 1);
  }

  function draw(card, u) {
    ensureSize(card);
    var ctx = card.ctx;
    if (!ctx) return;
    var t = u % card.cycle;
    if (t < 0) t += card.cycle;
    resetContext(ctx);
    ctx.clearRect(0, 0, card.width, card.height);
    try {
      ctx.save();
      card.cell(ctx, card.width, card.height, t);
      ctx.restore();
      card.el.dataset.state = reduce ? "still" : "live";
      if (card.el.dataset.error) delete card.el.dataset.error;
    } catch (err) {
      try { ctx.restore(); } catch (ignore) {}
      card.failed = true;
      deactivate(card);
      resetContext(ctx);
      ctx.fillStyle = "#1c1c22";
      ctx.fillRect(0, 0, card.width, card.height);
      card.el.dataset.state = "error";
      card.el.dataset.error = String(err && err.message ? err.message : err);
    }
  }

  function phase(card, now) {
    if (reduce) return card.cycle * STILL;
    var t = ((now - origin) / 1000) % card.cycle;
    if (t < 0) t += card.cycle;
    return t;
  }

  function tick(now) {
    if (reduce || document.hidden || active.length === 0) {
      rafId = 0;
      return;
    }
    var list = active.slice();
    var i;
    for (i = 0; i < list.length; i++) {
      var card = list[i];
      if (!card.visible || card.failed || card.el.hidden) continue;
      draw(card, phase(card, now));
    }
    if (active.length === 0 || reduce || document.hidden) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function ensureLoop() {
    if (rafId || reduce || document.hidden || active.length === 0) return;
    rafId = requestAnimationFrame(tick);
  }

  function activate(card) {
    if (card.el.hidden || card.failed) return;
    card.visible = true;
    if (reduce) {
      draw(card, card.cycle * STILL);
      return;
    }
    if (active.indexOf(card) < 0) active.push(card);
    ensureLoop();
  }

  function syncReduce(next) {
    if (next === reduce) return;
    reduce = next;
    if (reduce) document.documentElement.setAttribute("data-motion", "reduce");
    else document.documentElement.removeAttribute("data-motion");
    if (reduce) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      active.length = 0;
      cards.forEach(function (card) {
        if (card.visible && !card.failed && !card.el.hidden) draw(card, card.cycle * STILL);
      });
      return;
    }
    cards.forEach(function (card) {
      if (card.visible && !card.failed && !card.el.hidden && active.indexOf(card) < 0) {
        active.push(card);
      }
    });
    ensureLoop();
  }

  function buildCard(item) {
    var n = parseInt(item.id, 10);
    var index = (n - 1) % 24;
    var pack = window.MotionPrompt.packs[item.pack];
    var cell = pack && pack.cells ? pack.cells[index] : null;
    var card = {
      id: item.id,
      slug: item.slug,
      pack: item.pack,
      category: item.category,
      name: item.name,
      meaning: item.meaning,
      width: item.width,
      height: item.height,
      cycle: item.cycle,
      cell: cell,
      canvas: null,
      ctx: null,
      el: null,
      visible: false,
      failed: !cell
    };

    var article = document.createElement("article");
    article.className = "card";
    article.id = item.id;
    article.dataset.slug = item.slug;
    article.dataset.pack = item.pack;
    article.dataset.category = item.category;
    article.tabIndex = -1;
    card.el = article;
    article._card = card;

    var stage = document.createElement("div");
    stage.className = "card__stage";
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.aspectRatio = item.width + " / " + item.height;
    stage.appendChild(canvas);
    card.canvas = canvas;

    var body = document.createElement("div");
    body.className = "card__body";
    var h2 = document.createElement("h2");
    h2.className = "card__name";
    h2.id = "name-" + item.id;
    var link = document.createElement("a");
    link.href = "#" + item.id;
    var idSpan = document.createElement("span");
    idSpan.className = "card__id";
    idSpan.textContent = "#" + item.id;
    link.appendChild(idSpan);
    link.appendChild(document.createTextNode(" " + item.name));
    h2.appendChild(link);
    var meaning = document.createElement("p");
    meaning.className = "card__meaning";
    meaning.id = "meaning-" + item.id;
    meaning.textContent = item.meaning;
    body.appendChild(h2);
    body.appendChild(meaning);
    article.setAttribute("aria-labelledby", h2.id);
    article.setAttribute("aria-describedby", meaning.id);
    article.appendChild(stage);
    article.appendChild(body);

    if (!cell) {
      article.dataset.state = "error";
      article.dataset.error = "Missing cell";
    }
    return card;
  }

  function placeholderCell(ctx, w, h) {
    ctx.fillStyle = "#1c1c22";
    ctx.fillRect(0, 0, w, h);
  }

  async function prepareFonts() {
    var packs = window.MotionPrompt.packs;
    var base = new URL("vendor/motion-prompt/", document.baseURI).href;
    var ids = Object.keys(packs);
    var i;
    for (i = 0; i < ids.length; i++) {
      var pack = packs[ids[i]];
      if (!pack.fonts || !pack.fonts.length) continue;
      try {
        await window.MotionPrompt.loadFonts(pack, base);
      } catch (err) {
        console.warn("Motion prompt fonts failed for " + ids[i], err);
      }
    }
  }

  function boot(catalog) {
    var packs = (catalog.packs || []).slice().sort(function (a, b) {
      return a.order - b.order;
    });
    packs.forEach(function (pack) {
      packById[pack.pack] = pack;
    });

    addRadio(packChips, "all", "All", true);
    packs.forEach(function (pack) {
      addRadio(
        packChips,
        pack.pack,
        PACK_LABEL[pack.pack] || pack.title,
        false,
        pack.title
      );
    });
    bindArrows(packChips, setPack);
    bindArrows(catChips, setCat);

    var frag = document.createDocumentFragment();
    (catalog.elements || []).forEach(function (item) {
      var card = buildCard(item);
      if (!card.cell) card.cell = placeholderCell;
      cards.push(card);
      frag.appendChild(card.el);
    });
    grid.appendChild(frag);

    if (Object.keys(window.MotionPrompt.packs).length < 8 || cards.length !== 192) {
      showStatus(
        "Loaded " + cards.length + " effects from " +
        Object.keys(window.MotionPrompt.packs).length + " packs."
      );
    }

    grid.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a") : null;
      if (!link || !grid.contains(link)) return;
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      if (href === location.hash) {
        event.preventDefault();
        openHash(true);
      }
    });

    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var card = entry.target._card;
            if (!card) return;
            if (entry.isIntersecting && !entry.target.hidden) activate(card);
            else deactivate(card);
          });
        },
        { root: null, rootMargin: "240px 0px", threshold: 0 }
      );
    }

    reduce = computeReduce();
    if (reduce) document.documentElement.setAttribute("data-motion", "reduce");
    else document.documentElement.removeAttribute("data-motion");

    ready = true;
    openHash(location.hash ? true : false);

    window.addEventListener("hashchange", function () {
      openHash(true);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        return;
      }
      if (reduce) {
        cards.forEach(function (card) {
          if (card.visible && !card.failed && !card.el.hidden) draw(card, card.cycle * STILL);
        });
        return;
      }
      ensureLoop();
    });
    if (mq) {
      var onMq = function () {
        if (forceReduce || forceMotion) return;
        syncReduce(!!mq.matches);
      };
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    }
    window.addEventListener("pageshow", function () {
      if (reduce) return;
      ensureLoop();
    });
  }

  async function start() {
    if (!packChips || !grid || !window.MotionPrompt) {
      showStatus("Motion prompt runtime did not load.");
      return;
    }
    var catalogPromise = fetch("vendor/motion-prompt/catalog-slim.json").then(function (res) {
      if (!res.ok) throw new Error("Catalog failed to load.");
      return res.json();
    });
    try {
      await prepareFonts();
      boot(await catalogPromise);
    } catch (err) {
      showStatus(err && err.message ? err.message : "Effects failed to load.");
    }
  }

  start();
})();

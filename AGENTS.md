# AGENTS.md — ui-kit

Rules for AI agents editing this repository.

## What this is

Multi-page **static** UI kit published on GitHub Pages from the `main` branch root:

- Gallery: https://danielwongcx.github.io/ui-kit/ (`index.html`, mirrored by `ui-combo.html`) — Digits · Buttons · Cards · Nested radius · Palettes · Select · Glow border · Folder · Spacing · Hierarchy · Color combos; keep index unchanged when adding other pages. `index.html` and `ui-combo.html` stay byte-identical, including Color combos. Hierarchy (`#hierarchy`) owns visual rank, including the harbour ladder. Spacing links there and stays on the scale.
- Digest: https://danielwongcx.github.io/ui-kit/digest.html
- Taste: https://danielwongcx.github.io/ui-kit/taste.html (`taste.html`) — motion / app-data / buttons+ / states / forms / cards+ patterns from taste-skill study
- Refactor UI: https://danielwongcx.github.io/ui-kit/refactor-ui.html (`refactor-ui.html`) — Explainer. Interactive handbook of the Refactoring UI framework: nine parts, short original lessons, and live before/after demos. Inspired by Adam Wathan and Steve Schoger; not the book.
- `DESIGN.md` (repo root) is the agent rulebook for those principles and is downloadable from the Refactor UI page.
- Learn Piano 101: https://danielwongcx.github.io/ui-kit/learn-piano-101.html (`learn-piano-101.html`) — full-viewport beginner piano film; click starts the visual GSAP timeline. GSAP and the motion runtime live in `vendor/` (no CDN, no soundtrack).
- ASCII: https://danielwongcx.github.io/ui-kit/ascii-sharks.html (`ascii-sharks.html`) — full-viewport scenes. A corner control switches **Sharks** (stackedlol ocean), **Train** (ASCII Magic viaduct steam train, halftone dots on black), and **HRTD** (original “made with 💕 by HRTD” line). Only the active scene runs. The last scene is stored in `localStorage` (`ascii-scene`); `?scene=sharks`, `?scene=train`, or `?scene=hrtd` overrides it for that visit. `?scene=ferry` and `?scene=mtr` redirect to their own pages. Sharks keep the Light / Dark palette (`ascii-sharks-theme`, `?theme=light`). The theme control hides on Train and HRTD. Engines: `vendor/ascii-sharks/ocean.js` (port of [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)), `vendor/ascii-magic/` ([ascii-magic-art](https://github.com/kailashsr38/ascii-magic-art) v1.0.2, MIT; no CDN), and `vendor/ascii-hrtd/made.js`. Optional `?sharks=thresher,hammerhead,mako,nurse`.
- Ferry: https://danielwongcx.github.io/ui-kit/ferry.html (`ferry.html`) — one full-viewport page. Original night harbour crossing on the same 192×108 halftone-dots grid and 15fps stage as the viaduct train (`vendor/ascii-ferry/harbour.js`). The vessel is Star Ferry Celestial Star: red hull, green promenade, cream cabin. Night only, no theme toggle.
- MTR: https://danielwongcx.github.io/ui-kit/mtr.html (`mtr.html`) — one full-viewport page. Original night metro on that same stage (`vendor/ascii-mtr/metro.js`): a KCR first-generation EMU, yellow cab and silver body with a thin red stripe, crosses an elevated guideway above the harbour. Night only, no theme toggle.
- Transition: https://danielwongcx.github.io/ui-kit/transition.html (`transition.html`) — interactive gallery of the 32 free transitions.dev motion recipes. Light chrome (`#fdfdfd`, white cards, Inter), inline CSS/JS, no build step.
- One prompt: https://danielwongcx.github.io/ui-kit/one-prompt.html (`one-prompt.html`) — Explainer. Plain-language page on seeco’s (@seeconvm) X article about viral “one-prompt” Opus motion videos. Spring-timed hero, a prompt-vs-setup chart, an eight-piece studio diagram, and the piece / without it / fix table. Numbers are the article’s. No build step.
- Motion studio: https://danielwongcx.github.io/ui-kit/motion-studio.html (`motion-studio.html`) — Explainer. Plain-language page on Movez’s (@0xMovez) X article, a 12-step course for turning a one-line motion prompt into a studio. Light seek(t) hero, a prompt-vs-harness chart, a four-part step diagram, and a without-it / fix table. Numbers are the article’s. No build step.
- UI aesthetic: https://danielwongcx.github.io/ui-kit/ui-aesthetic.html (`ui-aesthetic.html`) — Explainer. Plain-language page on Xian’s (@Xian0063) X article, eight working principles and five AI design skills, with the article’s 15 images. Numbers and install commands are the article’s. No build step.
- Fix your life: https://danielwongcx.github.io/ui-kit/fix-life.html (`fix-life.html`) — Explainer. Plain-language page on Dan Koe’s (@thedankoe) X article about changing identity in a day: first-order change, the identity loop, nine mind stages, a cybernetic steer, the flip, a one-day protocol, and a six-ring game. No build step.
- Design with AI: https://danielwongcx.github.io/ui-kit/design-with-ai.html (`design-with-ai.html`) — Explainer. Plain-language page on Matt Dailey’s (@reactiverobot) two X articles about de-slopping AI design: a constraint loop, six craft moves on one surface, and a six-step loop for features that cross many screens. No build step.
- Grok Bot reel: https://danielwongcx.github.io/ui-kit/grok-bot-showreel.html (`grok-bot-showreel.html`) — Explainer. Full-viewport 15s motion showreel for Grok Bot, desktop assistant: cold open, identity spark, wordmark, six easings, morph, Truchet, depth, kinetic type, and fin. One GSAP master timeline (`vendor/gsap.min.js`). `prefers-reduced-motion` holds the fin plate. No build step.
- Dub promo: https://danielwongcx.github.io/ui-kit/dub-promo-showreel.html (`dub-promo-showreel.html`) — Explainer. Full-viewport 15s looping motion study of a Dub short-link promo: long URL, short pill, live clicks, analytics, partners, feature slides, and a fin CTA. One GSAP master timeline (`vendor/gsap.min.js`). `prefers-reduced-motion` holds the fin plate. No build step.
- Wave grid: https://danielwongcx.github.io/ui-kit/wave-card-grid.html (`wave-card-grid.html`) — Explainer. Responsive SaaS card grid that fades, rises, and scales in as a staggered wave. Delay follows the diagonal (row + column), the row, or the column. Replay restarts the wave. `prefers-reduced-motion` shows every card at rest. GSAP (`vendor/gsap.min.js`). No build step.
- Kinetic type: https://danielwongcx.github.io/ui-kit/kinetic-typography.html (`kinetic-typography.html`) — Explainer. Words move the way they mean: STRETCH, BOUNCE, SPIN, and SLAM, ported from Shohei Ohtaki’s motion prompt #008 (MIT). Canvas cycle is 4.7s on the kit navy stage. Replay restarts from the start. `prefers-reduced-motion` holds SLAM at rest. No build step.

No build step. Plain HTML / CSS / JS.

## Shared site header (REQUIRED on every page)

Every HTML page **MUST**:

1. Load `shared/site-header.css` in `<head>`
2. Set `<body data-page="…">` to the page id (`gallery`, `digest`, `taste`, or a new id you register)
3. Load `shared/site-header.js` with `defer` before `</body>`

Page links live **ONLY** in `shared/site-header.js` → `PAGE_LINKS`.

`PAGE_LINKS` is the top-level nav, in order. Each item is either a page `{ id, label, href }` or a category `{ id, label, children }`. Children use the same page shape. A page is listed once: top-level **or** under a category, never both.

Top-level pages: Gallery, Digest, Taste, Piano, ASCII, Ferry, MTR, Transition.

**Explainer** (desktop dropdown, mobile group):

- One prompt → `one-prompt.html`
- Motion studio → `motion-studio.html`
- UI aesthetic → `ui-aesthetic.html`
- Refactor UI → `refactor-ui.html`
- Fix your life → `fix-life.html`
- Design with AI → `design-with-ai.html`
- Grok Bot reel → `grok-bot-showreel.html`
- Dub promo → `dub-promo-showreel.html`
- Wave grid → `wave-card-grid.html`
- Kinetic type → `kinetic-typography.html`

When you add a new page:

1. Create the HTML file
2. Append a top-level item, or append a child to the category it belongs to (relative hrefs only: `name.html`)
3. Wire the shared CSS/JS + `data-page` as above
4. If `site-header.js` or `site-header.css` changed, bump the `?v=` query on every page that loads them

Category behavior, owned by the shared header:

- Desktop: the category is a button (`aria-expanded`, `aria-controls`). Click, hover on a fine pointer, or Arrow Down / Arrow Up opens the links. Escape closes and returns focus to the button. Arrow keys, Home, and End move inside the list. The current page sets `aria-current="page"` on the child and `aria-current="true"` plus `.is-active` on the category button.
- Mobile panel: the category is a label with its child links listed under it. The label and the current child both take the active style.
- Do not list One prompt (or any explainer) again as a top-level link.

**Never** invent a one-off top nav, hardcode `https://danielwongcx.github.io/ui-kit/…` for internal page links, or duplicate header markup in each file. The JS injects the sticky header.

## Section FAB (gallery + taste)

`shared/section-fab.css` + `shared/section-fab.js` load on the gallery (`index.html` / `ui-combo.html`) and Taste (`taste.html`).

- Sections use `.sec` with a stable `id`
- Bodies are wrapped in `.sec-body` (script does this); chevron toggles collapse
- Floating speed-dial picks `GALLERY_SECTION_LINKS` or `TASTE_SECTION_LINKS` from `data-page`

When you add a section on either page:

1. Use `<section class="sec" id="your-id">` with a `.sec-head`
2. Register it in the matching map inside `section-fab.js`
3. Keep demos self-contained; do not break digit / glow-button / palette scripts on the gallery

In-page `.lib-nav` is for **section anchors only**. Cross-page links belong in the site header.

## Identical gallery copies

`index.html` and `ui-combo.html` are byte-identical, including Color combos (`#color-combos`). After gallery edits, copy `index.html` over `ui-combo.html`.

## UI copy

Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.

## Bug fixes

Fix a bug at its cause, reasoning from first principles and established best practice. Do not patch over the symptom.

## Do not

- Remove Digits / Buttons / Cards demos when adding themes
- Retheme those demos via page-shell palettes (palettes change `--page` / `--brand` shell only)
- Push secrets, add a bundler, or leave the shared header off a new page

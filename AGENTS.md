# AGENTS.md — ui-kit

Rules for AI agents editing this repository.

## What this is

Multi-page **static** UI kit published on GitHub Pages from the `main` branch root:

- Gallery: https://danielwongcx.github.io/ui-kit/ (`index.html`, mirrored by `ui-combo.html`) — Digits · Buttons · Cards · Palettes · Select · Glow border kit; keep index unchanged when adding other pages
- Digest: https://danielwongcx.github.io/ui-kit/digest.html
- Taste: https://danielwongcx.github.io/ui-kit/taste.html (`taste.html`) — motion / app-data / buttons+ / states / forms / cards+ patterns from taste-skill study
- Learn Piano 101: https://danielwongcx.github.io/ui-kit/learn-piano-101.html (`learn-piano-101.html`) — full-viewport beginner piano film; click starts the visual GSAP timeline. GSAP and the motion runtime live in `vendor/` (no CDN, no soundtrack).
- ASCII: https://danielwongcx.github.io/ui-kit/ascii-sharks.html (`ascii-sharks.html`) — full-viewport scenes. A corner control switches **Sharks** (stackedlol ocean), **Train** (ASCII Magic viaduct steam train, halftone dots on black), and **HRTD** (original “made with 💕 by HRTD” line). Only the active scene runs. The last scene is stored in `localStorage` (`ascii-scene`); `?scene=sharks`, `?scene=train`, or `?scene=hrtd` overrides it for that visit. `?scene=ferry` and `?scene=mtr` redirect to their own pages. Sharks keep the Light / Dark palette (`ascii-sharks-theme`, `?theme=light`). The theme control hides on Train and HRTD. Engines: `vendor/ascii-sharks/ocean.js` (port of [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)), `vendor/ascii-magic/` ([ascii-magic-art](https://github.com/kailashsr38/ascii-magic-art) v1.0.2, MIT; no CDN), and `vendor/ascii-hrtd/made.js`. Optional `?sharks=thresher,hammerhead,mako,nurse`.
- Ferry: https://danielwongcx.github.io/ui-kit/ferry.html (`ferry.html`) — one full-viewport page. Original night harbour crossing on the same 192×108 halftone-dots grid and 15fps stage as the viaduct train (`vendor/ascii-ferry/harbour.js`). Night only, no theme toggle.
- MTR: https://danielwongcx.github.io/ui-kit/mtr.html (`mtr.html`) — one full-viewport page. Original night metro on that same stage (`vendor/ascii-mtr/metro.js`): a silver train with a red stripe crosses an elevated guideway above the harbour. Night only, no theme toggle.

No build step. Plain HTML / CSS / JS.

## Shared site header (REQUIRED on every page)

Every HTML page **MUST**:

1. Load `shared/site-header.css` in `<head>`
2. Set `<body data-page="…">` to the page id (`gallery`, `digest`, `taste`, or a new id you register)
3. Load `shared/site-header.js` with `defer` before `</body>`

Page links live **ONLY** in `shared/site-header.js` → `PAGE_LINKS`.

When you add a new page:

1. Create the HTML file
2. Append `{ id, label, href }` to `PAGE_LINKS` (relative hrefs only: `name.html`)
3. Wire the shared CSS/JS + `data-page` as above

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

`index.html` and `ui-combo.html` **must stay byte-identical**. After editing one, copy to the other.

## Do not

- Remove Digits / Buttons / Cards demos when adding themes
- Retheme those demos via page-shell palettes (palettes change `--page` / `--brand` shell only)
- Push secrets, add a bundler, or leave the shared header off a new page

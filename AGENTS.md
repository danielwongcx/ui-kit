# AGENTS.md — ui-kit

Rules for AI agents editing this repository.

## What this is

Multi-page **static** UI kit published on GitHub Pages from the `main` branch root:

- Gallery: https://danielwongcx.github.io/ui-kit/ (`index.html`, mirrored by `ui-combo.html`)
- Digest: https://danielwongcx.github.io/ui-kit/digest.html

No build step. Plain HTML / CSS / JS.

## Shared site header (REQUIRED on every page)

Every HTML page **MUST**:

1. Load `shared/site-header.css` in `<head>`
2. Set `<body data-page="…">` to the page id (`gallery`, `digest`, or a new id you register)
3. Load `shared/site-header.js` with `defer` before `</body>`

Page links live **ONLY** in `shared/site-header.js` → `PAGE_LINKS`.

When you add a new page:

1. Create the HTML file
2. Append `{ id, label, href }` to `PAGE_LINKS` (relative hrefs only: `name.html`)
3. Wire the shared CSS/JS + `data-page` as above

**Never** invent a one-off top nav, hardcode `https://danielwongcx.github.io/ui-kit/…` for internal page links, or duplicate header markup in each file. The JS injects the sticky header.

## Gallery section FAB (gallery page only)

`shared/section-fab.css` + `shared/section-fab.js` load **only** on the gallery (`index.html` / `ui-combo.html`).

- Sections use `.sec` with a stable `id` (`#digits`, `#buttons`, `#cards`, `#palettes`, …)
- Bodies are wrapped in `.sec-body` (script does this); chevron toggles collapse
- Floating speed-dial lists sections from `SECTION_LINKS` inside `section-fab.js`

When you add a gallery section:

1. Use `<section class="sec" id="your-id">` with a `.sec-head`
2. Register it in `SECTION_LINKS`
3. Keep demos self-contained; do not break digit / glow-button / palette scripts

In-page `.lib-nav` on the gallery is for **section anchors only**. Cross-page links belong in the site header.

## Identical gallery copies

`index.html` and `ui-combo.html` **must stay byte-identical**. After editing one, copy to the other.

## Do not

- Remove Digits / Buttons / Cards demos when adding themes
- Retheme those demos via page-shell palettes (palettes change `--page` / `--brand` shell only)
- Push secrets, add a bundler, or leave the shared header off a new page

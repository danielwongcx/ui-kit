# ui-kit

Static component gallery and digest catalog for Daniel Wong — served from GitHub Pages (`main` root).

## Pages

| Page | URL |
|------|-----|
| Gallery | https://danielwongcx.github.io/ui-kit/ |
| Digest | https://danielwongcx.github.io/ui-kit/digest.html |

Local mirrors: `index.html` (identical twin: `ui-combo.html`) and `digest.html`.

## Shared chrome

- **Site header** (`shared/site-header.css` + `shared/site-header.js`) — sticky, mobile hamburger, page links (Gallery · Digest). Every page must load it; see `AGENTS.md`.
- **Section FAB** (`shared/section-fab.*`) — gallery only. Collapsible sections + floating speed-dial to Digits / Buttons / Cards / Palettes.

## Agents

Read **[AGENTS.md](./AGENTS.md)** before adding or editing pages. Page links are registered only in `PAGE_LINKS`; do not invent a one-off nav.

## Notes

- No build / no CDN. Palettes switch the page shell background only; demo colours stay hard-coded.
- `index.html` ≡ `ui-combo.html` (keep them in sync).

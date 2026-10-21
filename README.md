# ui-kit

Static component gallery and digest catalog for Daniel Wong — served from GitHub Pages (`main` root).

## Pages

| Page | URL |
|------|-----|
| Gallery | https://danielwongcx.github.io/ui-kit/ |
| Digest | https://danielwongcx.github.io/ui-kit/digest.html |
| Taste | https://danielwongcx.github.io/ui-kit/taste.html |
| Learn Piano 101 | https://danielwongcx.github.io/ui-kit/learn-piano-101.html |
| ASCII | https://danielwongcx.github.io/ui-kit/ascii-sharks.html |

Local mirrors: `index.html` (identical twin: `ui-combo.html`), `digest.html`, `taste.html`, `learn-piano-101.html`, and `ascii-sharks.html`.

Gallery sections: Digits, Buttons, Cards, Palettes, and Select (native `appearance: base-select`). Palettes holds ten page-shell themes plus twenty reference colour pairings (name, four swatches, mood; click a swatch to copy the hex — pairings do not recolour the page). Index stays the original gallery.

Taste sections: Motion, App/Data, Buttons+, States, Forms, Cards+, Taste palettes, anti-slop digest strip.

## Shared chrome

- **Site header** (`shared/site-header.css` + `shared/site-header.js`) — sticky, mobile hamburger, page links (Gallery · Digest · Taste · Piano · ASCII). Every page must load it; see `AGENTS.md`.
- **Section FAB** (`shared/section-fab.*`) — gallery + taste. Collapsible sections + floating speed-dial (page-specific section map).

## Agents

Read **[AGENTS.md](./AGENTS.md)** before adding or editing pages. Page links are registered only in `PAGE_LINKS`; do not invent a one-off nav.

## Notes

- No build / no CDN. The ten page-shell palettes switch the page background only; demo colours stay hard-coded. The twenty colour pairings under Palettes are reference swatches and do not change the shell.
- `index.html` ≡ `ui-combo.html` (keep them in sync).
- ASCII (`ascii-sharks.html`) switches between four scenes. **Sharks** is a static port of [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks). `?sharks=thresher,hammerhead,mako,nurse` picks species (first is largest). With no query, four classic sharks swim. Dark is the default ocean; Light is a separate paper-and-ink palette (`?theme=light`). **Train** is [Viaduct Steam Train](https://www.ascii-magic.com/ascii/viaduct-steam-train) from [ascii-magic-art](https://github.com/kailashsr38/ascii-magic-art) v1.0.2 (MIT), played with the piece’s default halftone-dots look. **Ferry** is an original night harbour crossing (`vendor/ascii-ferry/harbour.js`). **HRTD** is an original line, made with 💕 by HRTD (`vendor/ascii-hrtd/made.js`). `?scene=sharks`, `?scene=train`, `?scene=ferry`, or `?scene=hrtd` selects a scene; the corner control remembers the last choice in `localStorage` (`ascii-scene`). Only the active scene runs. Light / Dark stays on Sharks.

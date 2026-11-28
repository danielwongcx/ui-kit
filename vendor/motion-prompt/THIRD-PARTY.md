# Motion Prompt

Vendored from [showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt).
Gallery: https://showheyohtaki.github.io/motion-prompt/

Copyright (c) 2026 Shohei Ohtaki. MIT License. The full text is in `LICENSE` in this directory.

These files are the upstream runtime, packs, and slim catalog. The page plays them; it does not reimplement the effects.

Catalog version `1.e0c91c6ecb` (264 effects).

- `runtime.js` — `MotionPrompt` registry. `pack(id, factory)` stores `{ width, height, cycle, cells, fonts }`. `loadFonts(pack, baseUrl)` loads any declared web fonts.
- `pack-motion.js` — effects 001–024
- `pack-camera.js` — effects 025–048
- `pack-ui.js` — effects 049–072
- `pack-lp.js` — effects 073–096
- `pack-photo.js` — effects 097–120
- `pack-motion2.js` — effects 121–144
- `pack-lp2.js` — effects 145–168
- `pack-camera2.js` — effects 169–192
- `pack-artstyle.js` — effects 193–216. Draws the WebP files in `img/` next to this script.
- `pack-diagram.js` — effects 217–240
- `pack-lp3.js` — effects 241–264
- `img/` — art-style reference and style images, MIT, from upstream `packs/artstyle/img`.
- `catalog-slim.json` — id, pack, name, meaning, slug, category, width, height, and cycle for all 264 effects. English strings only.
- `codes.json` — official English code text for each effect (upstream `api/v1/en/e/{id}.txt`), including the MIT copyright line. Copy reads this file. The page does not fetch motion-prompt at runtime.

Each pack registers 24 pure functions, `cells[i](ctx, width, height, u)`, with `u` in seconds in `[0, cycle)`. Element `001` is pack `motion` cell 0. Element `025` is pack `camera` cell 0. Element `193` is pack `artstyle` cell 0.

The eight packs through `camera2`, and the English catalog fields for effects 001–192, match upstream at this catalog version. Upstream’s extra languages are not stored here. The page stays in English.

## Fonts

Every pack in this snapshot returns `fonts: []`. `kinetic-typography.html` still calls `MotionPrompt.loadFonts(pack, baseUrl)` for any pack that lists fonts. None do, so no font files are fetched or shipped with this vendor directory. Canvas text uses the system stacks written inside each pack (Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans JP, Yu Gothic, Helvetica Neue, Avenir Next, SF Pro, and `system-ui`). The art-style pack draws vendored images instead of web fonts.

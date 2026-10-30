# Motion Prompt

Vendored from [showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt).
Gallery: https://showheyohtaki.github.io/motion-prompt/

Copyright (c) 2026 Shohei Ohtaki. MIT License. The full text is in `LICENSE` in this directory.

These files are the upstream runtime, packs, and slim catalog. The page plays them; it does not reimplement the effects.

- `runtime.js` — `MotionPrompt` registry. `pack(id, factory)` stores `{ width, height, cycle, cells, fonts }`. `loadFonts(pack, baseUrl)` loads any declared web fonts.
- `pack-motion.js` — effects 001–024
- `pack-camera.js` — effects 025–048
- `pack-ui.js` — effects 049–072
- `pack-lp.js` — effects 073–096
- `pack-photo.js` — effects 097–120
- `pack-motion2.js` — effects 121–144
- `pack-lp2.js` — effects 145–168
- `pack-camera2.js` — effects 169–192
- `catalog-slim.json` — id, pack, name, meaning, slug, category, width, height, and cycle for all 192 effects

Each pack registers 24 pure functions, `cells[i](ctx, width, height, u)`, with `u` in seconds in `[0, cycle)`. Element `001` is pack `motion` cell 0. Element `025` is pack `camera` cell 0.

## Fonts

Every pack in this snapshot returns `fonts: []`. `kinetic-typography.html` still calls `MotionPrompt.loadFonts(pack, baseUrl)` for any pack that lists fonts. None do, so no font files are fetched or shipped with this vendor directory. Canvas text uses the system stacks written inside each pack (Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans JP, Yu Gothic, Helvetica Neue, Avenir Next, SF Pro, and `system-ui`).

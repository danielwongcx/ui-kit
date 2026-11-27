# AGENTS.md — ui-kit

Rules for AI agents editing this repository.

## What this is

Multi-page **static** UI kit published on GitHub Pages from the `main` branch root:

- Gallery: https://danielwongcx.github.io/ui-kit/ (`index.html`, mirrored by `ui-combo.html`) — Digits · Buttons · Cards · Nested radius · Palettes · Off-white (`#off-white`, nine tinted page surfaces, click a hex to copy) · Brand ≠ Primary (`#brand-primary`, brand color is not the product primary) · Select · Glow border · Folder · Spacing · Hierarchy · Color combos · Transition keywords (`#transition-keywords`, awe0 page-transition and text-motion terms) · Background keywords (`#background-keywords`, awe0 background-effect terms) · Nudging notifications (`#nudging-notifications`, Android-style stack nudge, pure CSS `:has()`) · Prompting UI (`#prompting-ui`, icon size equals line-height, and better-button prompts) · Design tokens (`#design-tokens`, primitive → semantic token study) · iPhone polish (`#iphone-polish`, six ON/OFF polish rules with exact px) · iOS habits (`#ios-habits`, ten ON/OFF interaction habits: skeleton loaders, optimistic UI, tabular numbers, squircle corners, swipe to dismiss, shared-element transition, one-time-code, undo, balanced line breaks, blur placeholders) · Premium composer (`#premium-composer`, four layers and five states: focus ring, in-place upload pills, `field-sizing: content`, sticky toolbar, one send/stop node) · Interface as world (`#app-as-world`, eight fictional app studies of huashu-design 3.4: interface is the world, signature object, time has a shape, one semantic palette, content is the lead, AI lands on the object, roles carry state, accessibility sets the form); keep index unchanged when adding other pages. `index.html` and `ui-combo.html` stay byte-identical, including Color combos. Hierarchy (`#hierarchy`) owns visual rank, including the harbour ladder. Spacing links there and stays on the scale.
- Digest: https://danielwongcx.github.io/ui-kit/digest.html
- Taste: https://danielwongcx.github.io/ui-kit/taste.html (`taste.html`) — motion / app-data / buttons+ / states / forms / cards+ patterns from taste-skill study
- Refactor UI: https://danielwongcx.github.io/ui-kit/refactor-ui.html (`refactor-ui.html`) — Guides. Interactive handbook of the Refactoring UI framework: nine parts, short original lessons, and live before/after demos. Inspired by Adam Wathan and Steve Schoger; not the book.
- Frontend: https://danielwongcx.github.io/ui-kit/frontend.html (`frontend.html`) — Guides. Interactive handbook of the frontend design/spacing/motion engine with live before/after and kinetic demos. `FRONTEND.md` is the source guide and is downloadable from the page.
- Motion vocab: https://danielwongcx.github.io/ui-kit/motion-vocab.html (`motion-vocab.html`) — Guides. awe0’s motion prompt lexicon: nine casual phrases mapped to Count Up, Marquee, Typewriter, Stagger, Hover Lift, Morph, Easing, Ripple, and Flip Card, each with a live demo. The stock bar copies the English prompt. `prefers-reduced-motion` and `?reduce=1` hold demos at rest. No build step.
- `DESIGN.md` (repo root) is the agent rulebook for those principles and is downloadable from the Refactor UI page.
- Learn Piano 101: https://danielwongcx.github.io/ui-kit/learn-piano-101.html (`learn-piano-101.html`) — full-viewport beginner piano film; click starts the visual GSAP timeline. GSAP and the motion runtime live in `vendor/` (no CDN, no soundtrack).
- ASCII: https://danielwongcx.github.io/ui-kit/ascii-sharks.html (`ascii-sharks.html`) — full-viewport scenes. A corner control switches **Sharks** (stackedlol ocean), **Train** (ASCII Magic viaduct steam train, halftone dots on black), and **HRTD** (original “made with 💕 by HRTD” line). Only the active scene runs. The last scene is stored in `localStorage` (`ascii-scene`); `?scene=sharks`, `?scene=train`, or `?scene=hrtd` overrides it for that visit. `?scene=ferry` and `?scene=mtr` redirect to their own pages. Sharks keep the Light / Dark palette (`ascii-sharks-theme`, `?theme=light`). The theme control hides on Train and HRTD. Engines: `vendor/ascii-sharks/ocean.js` (port of [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)), `vendor/ascii-magic/` ([ascii-magic-art](https://github.com/kailashsr38/ascii-magic-art) v1.0.2, MIT; no CDN), and `vendor/ascii-hrtd/made.js`. Optional `?sharks=thresher,hammerhead,mako,nurse`.
- Ferry: https://danielwongcx.github.io/ui-kit/ferry.html (`ferry.html`) — one full-viewport page. Original night harbour crossing on the same 192×108 halftone-dots grid and 15fps stage as the viaduct train (`vendor/ascii-ferry/harbour.js`). The vessel is Star Ferry Celestial Star: red hull, green promenade, cream cabin. Night only, no theme toggle.
- MTR: https://danielwongcx.github.io/ui-kit/mtr.html (`mtr.html`) — one full-viewport page. Original night metro on that same stage (`vendor/ascii-mtr/metro.js`): a KCR first-generation EMU, yellow cab and silver body with a thin red stripe, crosses an elevated guideway above the harbour. Night only, no theme toggle.
- Transition: https://danielwongcx.github.io/ui-kit/transition.html (`transition.html`) — interactive gallery of the 35 free transitions.dev motion recipes by Jakub Antalik, including number subtle change, to-do reorder, and magnetic slider. Light chrome (`#fdfdfd`, white cards, Inter), inline CSS/JS, a Copy control on each card, no build step.
- View Transitions: https://danielwongcx.github.io/ui-kit/view-transitions.html (`view-transitions.html`) — Motion playground. Driftwood, a dark travel-guide study of the CSS View Transitions API: card to page, snapshot morph, per-row names, theme wipe, share modal, and real multi-page loads (`view-transitions-lisbon.html`, `view-transitions-trips.html`). `prefers-reduced-motion` and `?reduce=1` skip the animation. No build step.
- Feels right: https://danielwongcx.github.io/ui-kit/feels-right.html (`feels-right.html`) — Motion playground. Six A/B micro-interaction rounds: spring switch, like burst, menu origin, password shake, sliding tab pill, and a delete that does not jump. `prefers-reduced-motion` and `?reduce=1` keep the quiz and skip the motion. No build step.
- Motion hierarchy: https://danielwongcx.github.io/ui-kit/motion-hierarchy.html (`motion-hierarchy.html`) — Motion playground. A fictional bank card opens as Good UI (one fade) or Great UI (blur, tab bar out, card scale, then staggered controls and transactions). `prefers-reduced-motion` and `?reduce=1` open the detail immediately. No build step.
- Atelier: https://danielwongcx.github.io/ui-kit/atelier.html (`atelier.html`) — interaction study in the locked Motion Atelier style: warm bone, dusty pastels, five bands, specimen grid. `atelier/DESIGN.md` is that style’s bible and is the file the page downloads. The repo-root `DESIGN.md` stays the Refactor UI rulebook.
- Gemini Sparkles: https://danielwongcx.github.io/ui-kit/gemini-sparkles.html (`gemini-sparkles.html`) — one full-viewport page. A single div draws three parallax sparkle layers with CSS radial gradients and a slow `background-position` loop, plus a soft blue glow. Night stage, no build step.
- Loading: https://danielwongcx.github.io/ui-kit/loading-icons.html (`loading-icons.html`) — Motion playground. Study of the 36 monochrome loaders in Ramin Nasibov’s film “still loading”: Bars, Squares, Orbit, Progress, Type, Objects. CSS and inline SVG on a dark stage. `prefers-reduced-motion` and `?reduce=1` hold a static pose. No build step.
- Collapsing header: https://danielwongcx.github.io/ui-kit/collapsing-header.html (`collapsing-header.html`) — Motion playground. A sticky inbox bar inside a demo scroller collapses on a named scroll timeline (`--page`, `animation: collapse linear both`, `animation-range: 0 6.25rem`). No scroll listeners. `@supports not (animation-timeline: scroll())` keeps the expanded bar. `prefers-reduced-motion` and `?reduce=1` snap the two heights. No build step.
- Microinteractions: https://danielwongcx.github.io/ui-kit/microinteractions.html (`microinteractions.html`) — Motion playground. Thirteen original vanilla studies after Juan Di Nella’s microinteractions.dev (MIT): text swap, hold to confirm, chevron morph, plucked underline, gooey radio, edge-aware tooltip, drag to select, resize handle, tab indicator, worm dots, drag to reorder, FAQ panel, and tick rail. Each study shows its timing. `prefers-reduced-motion` and `?reduce=1` keep the information and drop the travel; `?motion=1` brings motion back unless `?reduce=1` is also set. No build step.
- Moving UI: https://danielwongcx.github.io/ui-kit/moving-ui.html (`moving-ui.html`) — Motion playground. Six live studies from one montage: a day-to-night capsule diorama with a glass lens, a printing hours receipt under a shifting sky, a dithered comet past a headline, a five-channel mixer, morphing profile cards, and a guestbook of colored spines. Pointer, drag, and keyboard drive the interactions. `prefers-reduced-motion` and `?reduce=1` hold the cycles, skip the morph and the comet, and show a static pose. `?motion=1` restores motion unless `?reduce=1` is also set. No build step.
- Transitions: https://danielwongcx.github.io/ui-kit/transitions.html (`transitions.html`) — Motion playground. Thirty-three original studies of the free public motions from transitions.dev (Jakub Antalik): resize, number pop-in, badge, text swap, menu, modal, panel, page slide, icon swap, success check, avatar falloff, error shake, clear dissolve, skeleton reveal, text reveal, sliding tabs, shimmer, tooltip, 3D tilt, menu morph, accordion, toast, like, learn-more, checkbox, spinning counter, subtle number, toggle, thinking states, reasoning stream, streaming text, matrix loader, and banner stack. Each card is interactive and shows its timing. `prefers-reduced-motion` and `?reduce=1` hold the motion; `?motion=1` brings it back unless `?reduce=1` is also set. Separate from `transition.html`, which keeps the recipe gallery. No build step.
- Mesh gradients: https://danielwongcx.github.io/ui-kit/mesh-gradients.html (`mesh-gradients.html`) — Motion playground. Four original studies after @x6sense: a 5s lavender field morph ({acream motion}), three editorial posters whose meshes drift for 14s, a 27s iridescent glass form, and a 15s squircle tile row. `prefers-reduced-motion` and `?reduce=1` hold the last pose; `?motion=1` plays unless `?reduce=1` is also set. No build step.
- Motion craft: https://danielwongcx.github.io/ui-kit/motion-craft.html (`motion-craft.html`) — Motion playground. Three craft studies: a rule-of-three hero whose title blurs in per character, then the subtitle, then a product panel; a scroll-snap font-pairing reel; and a glassy pill navbar with a sliding indicator. `prefers-reduced-motion` and `?reduce=1` hold the stagger and the navbar demo; `?motion=1` plays unless `?reduce=1` is also set. No build step.
- Dolomites Flora: https://danielwongcx.github.io/ui-kit/dolomites-flora.html (`dolomites-flora.html`) — Motion playground. Long-form field essay on alpine wildflowers of the Dolomites: sticky elevation nav, montane through nival bands, original botanical plates, and a filterable specimen index. `prefers-reduced-motion` and `?reduce=1` hold motion; `?motion=1` plays unless `?reduce=1` is also set. No build step.
- Magazine layout: https://danielwongcx.github.io/ui-kit/magazine-layout.html (`magazine-layout.html`) — Motion playground. A resizable editorial wireframe with device presets, a width slider, a drag handle, and a live `magazine.css` panel for the active `grid-template-areas`. Study after David Mráz. `prefers-reduced-motion` and `?reduce=1` skip the region glide; `?motion=1` brings it back unless `?reduce=1` is also set. No build step.
- Style rules: https://danielwongcx.github.io/ui-kit/style-rules.html (`style-rules.html`) — Motion playground. Before/after study of a fictional API monitor, Relay: same product and prompt, agent-default indigo against locked type, palette, spacing, and components. Study after Orange AI’s StyleSeed comparison. `prefers-reduced-motion` and `?reduce=1` skip the view crossfade; `?motion=1` plays unless `?reduce=1` is also set. No build step.
- One prompt: https://danielwongcx.github.io/ui-kit/one-prompt.html (`one-prompt.html`) — Guides. Plain-language page on seeco’s (@seeconvm) X article about viral “one-prompt” Opus motion videos. Spring-timed hero, a prompt-vs-setup chart, an eight-piece studio diagram, and the piece / without it / fix table. Numbers are the article’s. No build step.
- Motion studio: https://danielwongcx.github.io/ui-kit/motion-studio.html (`motion-studio.html`) — Guides. Plain-language page on Movez’s (@0xMovez) X article, a 12-step course for turning a one-line motion prompt into a studio. Light seek(t) hero, a prompt-vs-harness chart, a four-part step diagram, and a without-it / fix table. Numbers are the article’s. No build step.
- UI aesthetic: https://danielwongcx.github.io/ui-kit/ui-aesthetic.html (`ui-aesthetic.html`) — Guides. Plain-language page on Xian’s (@Xian0063) X article, eight working principles and five AI design skills, with the article’s 15 images. Numbers and install commands are the article’s. No build step.
- Fix your life: https://danielwongcx.github.io/ui-kit/fix-life.html (`fix-life.html`) — Guides. Plain-language page on Dan Koe’s (@thedankoe) X article about changing identity in a day: first-order change, the identity loop, nine mind stages, a cybernetic steer, the flip, a one-day protocol, and a six-ring game. No build step.
- Design with AI: https://danielwongcx.github.io/ui-kit/design-with-ai.html (`design-with-ai.html`) — Guides. Plain-language page on Matt Dailey’s (@reactiverobot) two X articles about de-slopping AI design: a constraint loop, six craft moves on one surface, and a six-step loop for features that cross many screens. No build step.
- Grok Bot reel: https://danielwongcx.github.io/ui-kit/grok-bot-showreel.html (`grok-bot-showreel.html`) — Motion. Full-viewport 15s motion showreel for Grok Bot, desktop assistant: cold open, identity spark, wordmark, six easings, morph, Truchet, depth, kinetic type, and fin. One GSAP master timeline (`vendor/gsap.min.js`). `prefers-reduced-motion` holds the fin plate. No build step.
- Dub promo: https://danielwongcx.github.io/ui-kit/dub-promo-showreel.html (`dub-promo-showreel.html`) — Motion. Full-viewport 15s looping motion study of a Dub short-link promo: long URL, short pill, live clicks, analytics, partners, feature slides, and a fin CTA. One GSAP master timeline (`vendor/gsap.min.js`). `prefers-reduced-motion` holds the fin plate. No build step.
- Wave grid: https://danielwongcx.github.io/ui-kit/wave-card-grid.html (`wave-card-grid.html`) — Motion. Responsive SaaS card grid that fades, rises, and scales in as a staggered wave. Delay follows the diagonal (row + column), the row, or the column. Replay restarts the wave. `prefers-reduced-motion` shows every card at rest. GSAP (`vendor/gsap.min.js`). No build step.
- Motion prompt: https://danielwongcx.github.io/ui-kit/kinetic-typography.html (`kinetic-typography.html`) — Motion. All 192 effects from Shohei Ohtaki’s Motion Prompt gallery (MIT), vendored in `vendor/motion-prompt/` (runtime, eight packs, `catalog-slim.json`, LICENSE). Pack chips filter the looping canvas cards. `#008` and `#kinetic-typography` scroll to kinetic typography. `prefers-reduced-motion` and `?reduce=1` hold every card at `u = cycle * 0.35`. Packs declare no web fonts. No build step.
- HK middle spend: https://danielwongcx.github.io/ui-kit/hk-middle-household-income-spend.html (`hk-middle-household-income-spend.html`) — Motion. Full-viewport ~16s data film on what “middle” Hong Kong households earn and spend. Censtatd proxy: median monthly income Q4 2025 (HK$30,000 all domestic; HK$40,000 economically active) and 2024/25 household expenditure (average HK$32,472; median HK$26,000). No official middle-class line. Motion Prompt effects #183, #007, #002, #005, #144, #004, #027, #071, #006, and #187, with beat cuts #017, #018, #137, #020, and #044, and a #080 highlighter on the landed figures (`vendor/motion-prompt/`). English and written Cantonese subtitles sit on every beat. Seek with `?t=`. `prefers-reduced-motion` and `?reduce=1` show static cards with those lines. No build step.
- Mebius charts: https://danielwongcx.github.io/ui-kit/mebius-free-charts.html (`mebius-free-charts.html`) — Guides. Gallery of the 62 free Mebius finance chart cards, redrawn in HTML, CSS, and SVG from each chart’s sample data. Sticky search and type filters. `prefers-reduced-motion` holds entrance motion. No build step.
- Design sites: https://danielwongcx.github.io/ui-kit/design-sites.html (`design-sites.html`) — Guides. 106 curated design-reference sites in nine categories, plus four use practices. microinteractions.dev sits in Frontend & interaction. Five Frontend & interaction entries (Snapblocks, Scroll Shaders, audiocn, Animata, Scrolltide) are React or prompt references. `#design-sites`. No build step.
- Dashboards: https://danielwongcx.github.io/ui-kit/dashboards.html (`dashboards.html`) — Guides. Two separate interactive product studies: a catalog overview with an assistant Fix-all sequence, and Settle invoices with aging, filters, and agent progress. Studies after Divan Raj and Daniel / Axion, not official products. `prefers-reduced-motion` and `?reduce=1` hold motion on the final state. No build step.
- Chart cards: https://danielwongcx.github.io/ui-kit/chart-cards.html (`chart-cards.html`) — Guides. Before / after study of a dashboard chart card: hierarchy, comparison, a two-series line, time ranges, and point selection. Not an official product. `prefers-reduced-motion` and `?reduce=1` skip the draw-in. No build step.
- Premium feel: https://danielwongcx.github.io/ui-kit/premium-feel.html (`premium-feel.html`) — Guides. Why premium apps feel smooth: six physics studies (button spring, pull resistance, rolling digits, drag lift, ease-out expand, drawn check). Each card opens a 1/4-speed breakdown with a graph, a With / Without comparison, and a prompt and code you can copy. `prefers-reduced-motion` and `?reduce=1` hold the motion. No build step.
- Agent system: https://danielwongcx.github.io/ui-kit/agent-design-system.html (`agent-design-system.html`) — Guides. rico’s (@_heyrico) five-layer design system an agent can follow: primitives, semantic tokens, components, blocks, and rules plus a review-screen skill. `prefers-reduced-motion` and `?reduce=1` hold motion. No build step.
- Underlay DS: https://danielwongcx.github.io/ui-kit/underlay-design-system.html (`underlay-design-system.html`) — Guides. Marcel’s (@marcelkargul) Underlay design system: violet foundations, theme, semantic tokens, elevation and state, an Inter type scale with Trim, and four rules. `prefers-reduced-motion` and `?reduce=1` hold motion. No build step.
- Onboarding: https://danielwongcx.github.io/ui-kit/onboarding.html (`onboarding.html`) — Motion. Playable motion study of a Letterly-style onboarding: pinned chrome, ink ripples, spring-born letter tiles, a curved role wheel, checklist wake, peek carousel, draft expansion, permission sheet, nudge-to-paywall crossfade, and two confetti bursts. `prefers-reduced-motion` and `?reduce=1` skip springs, punch-in, Ken Burns, and confetti. No build step.
- Prompt Spec: https://danielwongcx.github.io/ui-kit/prompt-spec.html (`prompt-spec.html`) — Guides. Reference page for copying a rules block and a system prompt that lock spacing, radius, type, and color, then name five interruptible real-UI motion primitives. Not a motion demo. No build step.
- Atelier Orb: https://danielwongcx.github.io/ui-kit/atelier-orb.html (`atelier-orb.html`) — Motion. Identity and motion study of a Canvas 2D orb: 120 Fibonacci dots, Static / Thinking / Working / Resting / Stuck, Dark and Light, six palettes plus a custom color, and a Neon toggle. `prefers-reduced-motion` freezes the orbit, snaps the morph, and stops the neon pulse. Look persists in `localStorage` (`atelier-orb-look`). Separate from the Motion Atelier page. No build step.

No build step. Plain HTML / CSS / JS.

## Shared site header (REQUIRED on every page)

Every HTML page **MUST**:

1. Load `shared/site-header.css` in `<head>`
2. Set `<body data-page="…">` to the page id (`gallery`, `digest`, `taste`, or a new id you register)
3. Load `shared/site-header.js` with `defer` before `</body>`

Page links live **ONLY** in `shared/site-header.js` → `PAGE_LINKS`.

`PAGE_LINKS` is the top-level nav, in order. Each item is either a page `{ id, label, href }` or a category `{ id, label, children }`. Children use `{ id, label, href, group? }`. A page is listed once: top-level **or** under a category, never both.

Top-level, in order: Gallery, Taste, Digest, Guides, Motion, Stages.

**Guides** (desktop two-column flyout, mobile group). `group` splits the children:

Handbooks:

- Refactor UI → `refactor-ui.html`
- Frontend → `frontend.html`
- Prompt Spec → `prompt-spec.html`
- Design with AI → `design-with-ai.html`
- UI aesthetic → `ui-aesthetic.html`
- Agent system → `agent-design-system.html`
- Underlay DS → `underlay-design-system.html`
- Premium feel → `premium-feel.html`
- Motion vocab → `motion-vocab.html`

Notes:

- One prompt → `one-prompt.html`
- Motion studio → `motion-studio.html`
- Fix your life → `fix-life.html`
- Mebius charts → `mebius-free-charts.html`
- Design sites → `design-sites.html`
- Dashboards → `dashboards.html`
- Chart cards → `chart-cards.html`

**Motion** (desktop two-column flyout, mobile group):

Playgrounds:

- Motion prompt → `kinetic-typography.html`
- Wave grid → `wave-card-grid.html`
- Transition → `transition.html`
- View Transitions → `view-transitions.html`
- Feels right → `feels-right.html`
- Motion hierarchy → `motion-hierarchy.html`
- Atelier → `atelier.html`
- Atelier Orb → `atelier-orb.html`
- Sparkles → `gemini-sparkles.html`
- Loading → `loading-icons.html`
- Collapsing header → `collapsing-header.html`
- Microinteractions → `microinteractions.html`
- Moving UI → `moving-ui.html`
- Transitions → `transitions.html`
- Mesh gradients → `mesh-gradients.html`
- Motion craft → `motion-craft.html`
- Dolomites Flora → `dolomites-flora.html`
- Magazine layout → `magazine-layout.html`
- Style rules → `style-rules.html`

Films:

- Onboarding → `onboarding.html`
- Grok Bot reel → `grok-bot-showreel.html`
- Dub promo → `dub-promo-showreel.html`
- Piano → `learn-piano-101.html`
- HK middle spend → `hk-middle-household-income-spend.html`

**Stages** (desktop dropdown, mobile group):

- ASCII → `ascii-sharks.html`
- Ferry → `ferry.html`
- MTR → `mtr.html`

When you add a new page:

1. Create the HTML file
2. Append a top-level item, or append a child to the category it belongs to (relative hrefs only: `name.html`). Set `group` when that category uses labeled columns.
3. Wire the shared CSS/JS + `data-page` as above
4. If `site-header.js` or `site-header.css` changed, bump the `?v=` query on every page that loads them

Category behavior, owned by the shared header:

- Desktop: the category is a button (`aria-expanded`, `aria-controls`). Click, hover on a fine pointer, or Arrow Down / Arrow Up opens the links. Escape closes and returns focus to the button. Arrow keys, Home, and End move inside the list. The current page sets `aria-current="page"` on the child and `aria-current="true"` plus `.is-active` on the category button. A category with more than 8 children that set `group` opens a two-column flyout with those group labels, not one long scrolling list.
- Mobile panel: the category is a label with its child links listed under it, and the same group labels when the flyout uses them. The category label and the current child both take the active style.
- Do not list a Guides, Motion, or Stages page again as a top-level link.

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

## CSS units

New CSS follows this hierarchy. Do not mass-convert existing studies that teach named pixel values (for example iPhone polish).

1. Text, spacing, and text-tied icons → `rem`. Assume a 16px root; do not set `html { font-size: 16px }`. Spacing stays on the 4px ladder as `0.25rem` steps: `0.25 0.5 0.75 1 1.5 2 3 4 6 8`. `line-height` is unitless, or `rem` when it must match an icon box. Icon size equals line-height; icon-to-label gap is `0.5rem`.
2. Layout structure → `%`, `fr`, flex, grid, plus `max-width` in `rem`. Do not use a raw `px` width on a layout container (`width: 560px` → `width: 100%; max-width: 35rem`).
3. `clamp()` only when type or width must track the viewport.
4. Full-bleed height → `100dvh`. Never bare `100vw` for width; use `100%` or a checked `100dvw`.
5. Hairlines, borders, shadows, and small radii → `px`. Pill or growing radii → `rem` or `%`. Breakpoints and canvas/SVG strokes may stay in `px`.
6. Do not use nested `em` for `font-size`. `em` is only for padding that should scale with the local font-size.

Do not use a 100px cutoff as a ban. Small chrome (avatars, icon buttons) is not a layout container.

## UI copy

Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.

## Bug fixes

Fix a bug at its cause, reasoning from first principles and established best practice. Do not patch over the symptom.

## Do not

- Remove Digits / Buttons / Cards demos when adding themes
- Retheme those demos via page-shell palettes (palettes change `--page` / `--brand` shell only)
- Push secrets, add a bundler, or leave the shared header off a new page

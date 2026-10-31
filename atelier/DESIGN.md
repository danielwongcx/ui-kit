# Motion Atelier

Warm bone museum. A quiet interaction study: dusty pastels, almost no shadow, type that can breathe.

暖骨色博物館。少陰影、多留白，觸到先知係咩感覺。

Use this when a screen should feel like a specimen room. The live study is `atelier.html`. This file is the Atelier style only. The repository root `DESIGN.md` is the Refactor UI rulebook. Do not merge them.

## Color

| Token | Hex | Role |
| --- | --- | --- |
| `--bg` | `#f7f6f2` | Page. Warm bone. |
| `--ink` | `#282828` | Text, logo, icons. |
| `--mute` | `#8a8780` | Quiet pigment for captions and placeholders. |
| `--quiet` | `#6f6c66` | Small type that has to be read. Same family as `--mute`, dark enough for 4.5:1 on `--bg`. |
| `--stage` | `#eeeee6` | Hero stage field. |
| `--sage` | `#b9c7a6` | Dusty green. Marks, ribbons, one active chip. |
| `--sage-soft` | `#c8d3b5` | Larger sage fields. |
| `--clay` | `#bf7655` | The one warm accent. Once in a view. |
| `--sand` | `#ebe0da` | Specimen stage. |
| `--sand-deep` | `#e8e0d0` | Second sand. Same family. |
| `--lavender` | `#e6e3ec` | Specimen stage. |
| `--slate` | `#a2b1b6` | Cool dusty note. Wash it before it becomes a field. |
| `--line` | `rgba(40, 40, 40, 0.12)` | Hairline. The edge, when space is not enough. |

Body copy on `--bg` stays at `--ink` or `#5c5852` (about 6.5:1). Do not set a paragraph in `--mute`. On a pastel stage, index marks use `#4a4742` so they still clear the sage field.

No neon. No hue-shifting gradients. A flat shape can be a single token.

## Type

- Display, logo, section titles: **Noto Serif JP**, or another editorial mincho. Weight 500–600.
- UI, body, controls: **Inter** or **Noto Sans JP**. Weight 400–500.
- Body: **16px** minimum. Line height about 1.65.
- Titles in the grid: 18px, weight 500.
- Meta (milliseconds, counts, kickers): 12px, tracked, color `--quiet`.
- English kickers: uppercase, letter-spacing about 0.14em.

Do not set interface text below weight 400. Do not add a second display face.

## Space

Only this scale: **4, 8, 12, 16, 24, 32, 48, 64, 96, 128**.

Related items sit closer than the group they belong to. Start with the larger step and remove one if the group falls apart.

Content width: **1120–1200px**.

## Radius

`inner = outer − padding`. If that is under **4px**, use **4**.

- Outer shells (hero stage, specimen stage): **16px**.
- A shell with 12px of padding gets an inner plate of **4px**.
- Boxes on the same level share one radius. Every stage is 16. Every pill in a row is the same pill.
- Circles are circles. An arch can take a large radius because it is a shape, not a second shell.
- Reject the puffy stack: outer, middle, and inner all at 16.

## Layout

Five bands.

1. **Header.** Logo left. A quiet center label. One soft pill on the right.
2. **Hero.** Two columns. Left: kicker, large title, one short paragraph, one text link. Right: a stage with a few flat shapes.
3. **Toolbar.** Section title, then search and one pill row: Everything, Interaction, Feedback, Layout.
4. **Grid.** Three columns. One column on a narrow screen. Each card is a pastel stage, then category, title, one line, a millisecond, and a bookmark.
5. **Footer.** One thin close.

Card anatomy, top to bottom:

1. Stage. Pastel, radius 16, one simple mark.
2. Category and duration on one row. Both meta.
3. Title.
4. One line, and a bookmark.

## Motion

Short, and only on the thing that changed. The study uses **160ms**, **200ms**, and **250ms**. Ease out. No bounce, no parallax, no shadow that grows on hover.

`prefers-reduced-motion: reduce` shows the settled state. Controls still change.

## Do

- Leave more space than you think.
- Keep clay as the single accent. Sage, sand, and lavender do the rest.
- Let the stage be the color. The page stays bone.
- Write one line under a title, then stop.
- Separate cards with space and a different pastel.
- Use a hairline when a control needs an edge.

## Don't

- Neon, a pure `#fff` page, or pure `#000` text.
- Gradients that change hue. Glass, noise, glow.
- Drop shadows as a way to make a card.
- Dense product chrome: sidebars, stat strips, badges on badges.
- The same radius on every nested layer.
- A second pill competing with the one in the header.
- Grey body text on a colored stage. If the stage is sage, the words are ink, or they are not there.

## Starter

```css
:root {
  --bg: #f7f6f2;
  --ink: #282828;
  --mute: #8a8780;
  --quiet: #6f6c66;
  --stage: #eeeee6;
  --sage: #b9c7a6;
  --sage-soft: #c8d3b5;
  --clay: #bf7655;
  --sand: #ebe0da;
  --sand-deep: #e8e0d0;
  --lavender: #e6e3ec;
  --slate: #a2b1b6;
  --line: rgba(40, 40, 40, 0.12);
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;
  --s-9: 96px;
  --s-10: 128px;
  --r-outer: 16px;
  --r-pad: 12px;
  --r-inner: 4px; /* max(4px, var(--r-outer) - var(--r-pad)) */
  --serif: "Noto Serif JP", "Yu Mincho", Palatino, serif;
  --sans: Inter, "Noto Sans JP", system-ui, sans-serif;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.65;
}
```

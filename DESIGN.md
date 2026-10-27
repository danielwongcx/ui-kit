# DESIGN.md

Principles for building and reviewing product UI. Inspired by [Refactoring UI](https://refactoringui.com/) by Adam Wathan and Steve Schoger. A study companion for people and agents — not the book, and not a substitute for reading it.

Use this when creating a screen, cleaning up UI that looks unfinished, reviewing a design, or filling gaps in tokens (type, space, color, elevation, radius). Ignore it for work with no visual surface.

## How an AI should use this

Run this before any visual decision. The failure modes it prevents are fighting a system the project already has, and inventing values the project cannot reuse.

1. **Detect tokens first.** Name the stack, any token source (CSS variables, a theme file, a component library), and whether dark mode exists. An existing system wins. Translate these rules into that vocabulary. Do not install a styling framework, replace tokens, or borrow a palette because a sample used one.
2. **Apply invariants.** Rules marked **Invariant** do not bend for taste. If a project convention conflicts with one, say so and keep the convention until a person chooses otherwise.
3. **Propose scales only for gaps.** Resolve a number in this order: a token already in the project; a token you define in this session from the project's own hues and record by name; a fallback listed here, and say that you fell back. If none of the three yields a value, stop. The missing token is the finding. Do not invent a one-off pixel or hex.
4. **Build in order.** Feature, then grayscale rank, then spacing and type from the scale, then line length, then color, then depth, then polish and the empty state. Color before hierarchy is how screens get decorated and stay unclear.
5. **Audit with before → after.** On a review, do not restyle. For each finding give the location, the rule id, what is true now, the change, and why the later state meets the rule. Sweep in this order, because an earlier lens changes what the next one means:

   hierarchy → layout and spacing → text → color → depth → images → finishing touches

   Unreadable type and collapsed hierarchy come first. Off-scale values, ambiguous groups, grey-on-color, and unranked actions come next. Missing polish comes last. One rule per change. If the screen already meets the rule, say so and leave it.
6. **Leave a trace.** Before markup, write the rank (primary / secondary / tertiary content, and the single primary action) and the token names the layout will use. A later pass should be able to see that the rank was chosen.

Fallback numbers below are one valid set, not a requirement. They apply only at step 3c.

- Spacing: `4 8 12 16 24 32 48 64 96 128`
- Type: `12 14 16 18 20 24 30 36 48 64`
- Text roles: dark / muted / faint. Three, not a new grey per label.
- Actions: one solid primary, at most two secondary, the rest tertiary.
- Elevation: three to five steps. Two-layer shadows when the system has no shadow tokens.
- Contrast floor: 4.5:1 for body text, 3:1 for large text and meaningful graphics.

## Invariants

Highest-cost rules. Each is restated, with its id, under the part it belongs to.

1. **Hierarchy is the job.** Rank is the design. Equal weight reads as noise. `H1`
2. **Emphasize by de-emphasizing.** Quiet what competes before you make the subject louder. `H2`
3. **Every value comes from a system.** Size, space, color, shadow, radius, border width, opacity. No hand-tuned one-offs. Neighboring steps sit far enough apart to be obvious (about 25% or more). `S8`
4. **Start with too much whitespace, then remove it.** `L1`
5. **Space between groups is larger than space inside a group.** `L7`
6. **Size is not the only lever.** Two weight bands — 400/500 and 600/700 — and three text colors carry most UI rank. Do not set interface text below 400. `H3`
7. **No grey text on a colored background.** Lower the contrast on the same hue. `H4`
8. **Semantics lose to hierarchy.** One primary action. Destructive color follows focus, not the word "delete". `H8`
9. **Pick elements by meaning, style them by rank.** A heading level is an outline decision, not a font size. `H6`
10. **Light comes from above.** `D1`
11. **Body lines run 45–75 characters** (about 20–35em). Leading grows with line length and shrinks as type gets larger. `T3` `T5`
12. **Never let color be the only signal.** `C7`

## 1. Starting from Scratch

Draw the feature, in broad strokes, and stop when it can ship. Personality and a closed set of choices belong here, before any palette work.

- **S1.** Design the feature first: the fields and the one action someone came for. Navigation, logo, and footer wait until that feature has a shape.
- **S2.** Stay low fidelity while the structure is still moving. Boxes, weight, and space are enough. Icons, shadows, and a typeface finish a decision; they do not find one.
- **S3.** Work in grayscale until rank is obvious with no hue. If the order disappears when you remove color, the hierarchy is not done.
- **S4.** Keep cycles short. Build the smallest useful version. Do not invent every edge case on a static mock before anything ships.
- **S5.** Leave off anything you cannot implement in this cycle. A control that does nothing, including "coming soon" chrome, teaches people the product is unfinished.
- **S6.** Choose a personality on purpose, then hold it: type family, color, corner radius, and the voice of labels and buttons. Match the audience. Do not clone a competitor's skin.
- **S7.** One radius language per surface. Sharp reads formal, a small radius reads neutral, a large radius reads playful. Do not mix square and fully round on the same card.
- **S8. Invariant.** Predefine the scales you will reuse: type size and weight, line-height, color stops, space, widths, shadows, radius, border width, opacity. Choose by elimination among neighbors. If two steps look the same, drop one. When you make the same micro-decision twice, promote it into the system.

## 2. Hierarchy is Everything

Rank what should be seen first. Weight and color do more of that work than raw size.

- **H1. Invariant.** Not everything is equal. Primary, secondary, and tertiary must be obvious without reading the copy. A wall of equal weight is the usual reason a screen "looks undesigned."
- **H2. Invariant.** To make one thing pop, soften its competitors. A lighter color and a normal weight on the rest beats another loud treatment on the subject.
- **H3. Invariant.** Do not build rank from a huge title and a tiny subtitle. Use two weight bands (regular 400/500, emphasis 600/700) and three text colors (dark, muted, faint). Interface text stays at 400 or heavier. Avoid pure black on pure white when a softer dark reads more comfortably.
- **H4. Invariant.** Do not put grey text on a colored fill. The goal is lower contrast, not greyness. Stay on the background's hue and adjust lightness and saturation until the line is quiet and still readable. White at low opacity is the same mistake.
- **H5.** Labels are a last resort. An email, a price, or a phone number often explains itself. When a label is required, fold it into the value ("3 bedrooms") or set it quieter than the value.
- **H6. Invariant.** Document outline and visual rank are separate. Choose `h1`–`h3` for structure. Style section titles as the label they actually are — often small — instead of inheriting a browser heading size.
- **H7.** Balance area against contrast. A heavy icon in full ink outweighs the word beside it: soften the icon. A hairline border disappears: thicken it slightly before you darken it.
- **H8. Invariant.** Actions form a pyramid: one solid primary, a quieter secondary (outline or soft fill), tertiary as text. A destructive action is red when that action is the point of the screen, as on a confirm step. It is not the page primary just because the verb is delete.

## 3. Layout and Spacing

Start looser than the finished screen. Pull every gap from one scale.

- **L1. Invariant.** Begin with too much whitespace, then tighten until the group holds together. Space added until something "stops looking bad" always stops too early.
- **L2.** Dense UI is a deliberate choice for a dense job, such as a data-heavy dashboard. It is not the default for a form or a marketing card.
- **L3.** Use a non-linear spacing scale (the fallback above is one). Linear 4-pixel fiddling produces values nobody can tell apart. Reject any padding, margin, or gap that is not on the scale.
- **L4.** Do not fill the viewport because it is there. Give a form or a card the width it needs and leave the rest empty. When a small UI feels lost on a huge canvas, design it nearer a phone width (around 400px) and let the extra space stay empty.
- **L5.** A grid is a tool, not a master. Sidebars and narrow cards want a fixed width or a max-width. Let the main column flex. Use a column grid when the content is actually a grid.
- **L6.** Type size and spacing do not have to scale together. `em` padding that grows with the font balloons when a heading grows, and it will not track across breakpoints. Set type from the type scale and space from the spacing scale, and retune each at a breakpoint.
- **L7. Invariant.** The gap between groups is larger than the gap inside a group. Equal gaps make unrelated lines look like one list.

## 4. Designing Text

A short type scale, a comfortable measure, and alignment that follows how the line is read.

- **T1.** Hand-pick a type scale and ignore the sizes between steps. Set size in `px` or `rem` from that list. Nested `em` sizes drift off the scale.
- **T2.** UI text wants a face with several weights and a comfortable body size. A condensed, display, or mono face can label a chart. It should not carry paragraphs. Stay at 400 or heavier.
- **T3. Invariant.** Keep body lines in the 45–75 character range (about 20–35em). Cap the paragraph even when the card or column beside it is wider.
- **T4.** Align mixed sizes in one row to the baseline, not the vertical center. A small currency mark should sit on the same line as the price.
- **T5. Invariant.** Line-height follows the line. Long, smaller text needs more air (toward 1.5, and toward 2 when the measure is wide). Large headlines can sit near 1. One leading for both makes the title float and the paragraph feel tight.
- **T6.** Not every link needs a loud link color. A primary link can be the body color at a heavier weight. Ancillary links can appear on hover. Save a distinct link treatment for actions that are actually links.
- **T7.** Left-align anything long enough to wrap. Center a short title if you want; do not center a paragraph. In a table, text stays left and numbers sit right so the digits line up. If you justify, hyphenate.
- **T8.** Tighten letter-spacing on a large headline set in a body face. Open it on a short all-caps label. The same tracking on both stretches the title and cramps the label.

## 5. Working with Color

Build ramps you can name. Add color after hierarchy already works in grey.

- **C1.** Reason in hue, saturation, and lightness. A hex changes all three at once, so "a lighter brand color" becomes a guess.
- **C2.** You need more colors than a five-swatch generator. Plan a run of greys (about eight to ten), a run of the brand (about five to ten), and small ramps for success, warning, and danger. Most of the UI is the grey ramp.
- **C3.** Name the stops before you assign them. Buttons, badges, hovers, and text come from that ramp. Do not mint a new hex for a hover, and do not lighten or darken ad hoc — near-duplicate shades are how ramps rot.
- **C4.** As lightness moves away from the middle (around 50%), raise saturation so tints do not go chalky and shades do not go muddy. If you rotate hue while building the ramp, keep the turn small (about 20–30°): toward warmer or cooler accents to lighten, toward the primary ink hues to darken. Eyeballed stops drift; generate the ramp, then check it.
- **C5.** Greys may lean cool or warm. Pick one temperature and use it on the whole ramp so neutrals belong to the product.
- **C6.** Meet contrast without painting every surface in the darkest stop. 4.5:1 for normal text, 3:1 for large text. When white type forces an overly dark fill, flip the pair: dark text on a light tint of the same hue, and keep the solid color for the control that needs it.
- **C7. Invariant.** Do not rely on color alone. Pair a status hue with a word, icon, or other non-color mark so it still reads in grey and for people who do not see that hue difference.
- **C8.** Color is late. If rank, spacing, and type are not settled in grey, a palette will not fix the screen.

## 6. Creating Depth

Light comes from above. A shadow means elevation. Flat UI can still be layered.

- **D1. Invariant.** Simulate a light above the page. A raised control gets a lighter top edge and a shadow underneath. An inset gets a shadow along the top and a lighter bottom edge. A highlight along the bottom reads as light from under the desk.
- **D2.** Keep a short elevation scale, about five steps, and use it for meaning. Tight and small for buttons, a step up for cards, more for menus and popovers, widest for modals. One dramatic shadow on every surface makes nothing feel closer.
- **D3.** Prefer a two-part shadow: a tight, darker contact shadow plus a larger, softer ambient one. As elevation rises, let the tight shadow fade. A single blur stuck to the card looks like a filter, not a lift.
- **D4.** Flat UI still needs layers. Separate with a lighter surface on a darker page, or a solid offset shadow. Same-white on same-white needs something else to exist; a surface shift does that job without a blur.
- **D5.** Overlap creates depth. An avatar or card pulled across a region boundary reads as two layers. Edges that only touch read as stacked boxes.
- **D6.** Skip photo-real lighting and oversized shadows. Depth should explain which layer is nearer, not perform.

## 7. Working with Images

Photos, icons, and uploads are layout. Their size and contrast are part of the design.

- **I1.** Use images you would ship. A clear subject and a simple background. Do not plan to "replace the placeholder later" with a phone snapshot.
- **I2.** Text on a photo needs contrast you control: a scrim, a band, a reduced-contrast or colorized image, or a soft shadow on the type. White type on the bright part of a photo fails as soon as the crop changes. Low-opacity white on a busy image is not a strategy.
- **I3.** Everything has an intended size. Do not blow up a 16px icon, and do not shrink a dense screenshot until it is dust. Redraw a simple icon for the size you show. Crop a screenshot to the part someone should read.
- **I4.** User uploads will be the wrong aspect ratio. Give each image a fixed frame, cover the frame, and add a faint inner shadow so a white photo does not bleed into a white card.

## 8. Finishing Touches

Polish the pieces people actually meet: defaults, empty screens, and the borders you can delete.

- **F1.** Restyle the defaults people see constantly — bullets, quotes, checks — so they belong to the product. Leave rare controls alone.
- **F2.** Add color with an accent edge, not a full brand fill. A thick side border on a note, alert, or highlighted row carries the hue without repainting the row.
- **F3.** A flat grey panel reads as a placeholder. A quiet tint, a low-contrast texture, or a shift in the page color gives the region a material. Keep that contrast low so content stays in front.
- **F4.** Design the empty state as part of the feature: one sentence and the action that fills the screen. Hide tabs, filters, and other chrome that do nothing until content exists.
- **F5.** Prefer space, a background shift, or a soft shadow over a border. Add a border only when those are not enough. A box around every row is a cage.
- **F6.** Challenge the stock shape. If a choice has a time and a price, show both on a selectable card instead of a column of labels. Combine what a person compares.

## 9. Leveling Up

Taste is a stack of reviewed decisions. Keep a short loop.

- **U1.** On any screen you admire, find a decision you would not have made — an inverted field, a control inside another control, two treatments in one line. The unintuitive choice is the technique.
- **U2.** Rebuild an interface you like by eye, in grayscale, without inspecting its styles. The gap between your copy and the original is the lesson: tighter headline leading, tracked small caps, a layered shadow.
- **U3.** Change one rule at a time and cite its id. "Make it nicer" is not a review. When the main action will not pop, quiet a neighbor. When a spacing value is off the scale, it does not ship.

## Anti-patterns

Check these before calling a screen done. Each maps to a rule above.

- [ ] Shell, logo, or nav designed before any feature. `S1`
- [ ] Icons, shadows, or a typeface chosen before rank and layout. `S2` `S3`
- [ ] Color applied while hierarchy still fails in grey. `S3` `C8`
- [ ] "Coming soon" or other controls you will not ship. `S5`
- [ ] Mixed square and pill shapes, or two voices, on one surface. `S6` `S7`
- [ ] A value that is not on a scale (a one-pixel nudge, a fresh hex). `S8`
- [ ] Everything the same weight, or rank done only with huge vs tiny type. `H1` `H3`
- [ ] The hero made louder instead of its neighbors made quieter. `H2`
- [ ] Grey, or faded white, on a colored or photographic background. `H4` `I2`
- [ ] A label:value grid where the values already explain themselves. `H5`
- [ ] Heading tags forcing oversized section labels. `H6`
- [ ] A red delete as the primary button of a screen whose job is something else. `H8`
- [ ] Cramped default spacing, or a form stretched across a wide monitor. `L1` `L4`
- [ ] Equal gaps that glue separate groups into one list. `L7`
- [ ] Body lines far outside 45–75 characters, or a centered paragraph. `T3` `T7`
- [ ] Link styling on every clickable string. `T6`
- [ ] A five-color palette standing in for ramps, or status shown by hue alone. `C2` `C7`
- [ ] A shadow with no elevation meaning, or the same huge shadow on every layer. `D2` `D6`
- [ ] An icon or screenshot scaled off its intended size. `I3`
- [ ] An empty screen with no action, or a border on every region. `F4` `F5`

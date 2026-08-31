# Visual language — decide HOW to show it, before choosing a component

## Why this document exists

Every scene of the Itaewon video (V10) was built the same way: a
background-removed cutout floating on pale grid paper. That was not a style
decision — it was the only technique the pipeline described concretely, so
everything got forced through it. Content that isn't a physical object (a
place, a date range, a spatial layout, a mood) came out as a small object
stranded in white space. Measured afterwards, the worst scenes filled
**3.8%–11.2%** of the usable frame, and 8 of 17 scenes carried no image at all.

The viewer's verdict was blunt: boring, and the illustrations don't explain
anything.

So there is a step BEFORE picking a component: decide which treatment the
content actually calls for. `visualLanguage` records that choice; its share is
informational, not a style quota. Repetition is judged on rendered output by
review and `sheet_vision.py`, not inferred from implementation labels.

Make that choice in production-compatible bespoke previs JSX with the real locked
asset, then judge OPEN/KEY actual pixels on the whole-video contact sheet. The
contact sheet is where treatment is judged after contact with real assets. Do not
choose a diagram merely because it is easier to code than an available
meaning-bearing photograph or context asset; that is the V17 failure pattern.

## The languages

| If the narration is about… | visualLanguage | Build it with |
|---|---|---|
| A specific object or person | `cutout` | `EditorialHero` / `EditorialSupport` (`shared.jsx`); settled by default |
| A place, a location, a district | `map` | `MapGraphic` (`MapGraphic.jsx`) — real MapLibre map |
| A relationship, legal structure, layout, size, distance, density | `diagram` | Use only when it explains more clearly than imagery; `DiagramCanvas` + relevant primitives |
| A sequence of events in time | `timeline` | `Timeline` (`visualLanguage.jsx`) |
| Cause → effect, a mechanism | `flow` | `FlowArrow`, `FlowDiagramScene` |
| A number, a trend | `data` | `StatCounter`, `AnimatedLineChart` |
| Atmosphere, setting, a moment | `background-photo` | `BackgroundPhoto` — full-bleed |
| Two things set against each other | `split` | `SplitCompareScene` |
| Someone's words | `quote` | `SpeechBubbleQuote`, `QuoteBubbleScene` |
| A document, a record, an archive | `document` | `DocumentEvidence` (`visualLanguage.jsx`) — authentic raster source, timed crop/focus/highlight regions |
| A detail inside a wider image | `annotated` | `AnnotatedPhoto` — leader lines + labels |
| A screen, a broadcast, a phone | `mockup` | `DeviceMockup` |
| Nothing useful to show (rare, intentional) | `text-only` | `PunchPhrase` alone; no percentage quota |

## Rules the gates enforce

- **No visual language, diagram, icon, code-drawn share, block share, layer
  count or text-only share is a blocking style quota.**
- **A scene declaring a language must actually contain it.** Declaring `map`
  and then rendering only a pin on blank paper is the exact V10 defect, and
  `plan_gate.py` now fails it.
- **Illustrations must fill ≥12% of the usable band** (`check_overlap.py`).
  This technical floor catches a missing/tiny planned illustration, not a
  demand for ink. Legitimate full-bleed/minimal scenes are judged from the
  master frame; never add decoration to raise a density number.
- **The visual mass must stay near the centre of the band**, not drift to an
  edge (`check_overlap.py`'s balance check). Filling the frame and centring
  it are different problems; a top-heavy scene passes coverage and still
  reads as broken.
- **Every `visualEvent` must be backed by a real beat** in the plan — an asset
  entering or leaving, or the punch revealing. Pacing cannot be satisfied by
  declaring more events.

## Layer only when the second layer adds meaning

A timeline over a relevant document/photo may clarify both time and context.
That does not create a two-layer requirement: one authentic judgment page,
photo or contextual frame can be the strongest composition. Empty space is not
automatically a defect.

Combinations that work:

- `background-photo` + `PunchPhrase onDark` — atmosphere with a claim on top
- `background-photo` + `diagram` — a drawing anchored in the real place
- `map` + `annotated` — where it is, then what to look at within it
- `cutout` + `background-photo` — the subject stops floating
- `timeline` + `background-photo` — chronology with a mood

Every line must encode information: a relationship, cause, timeline, route,
measurement, or legal-element connection. Do not add decorative orange paths,
black filler lines, arbitrary underlines/scribbles/X marks, grids or unexplained
connectors.

## Choosing honestly

The failure this is meant to prevent isn't "picked the wrong template" — it's
picking the template first and reverse-engineering a justification. Write
`visualTransformation` (the relationship the viewer must SEE form) before
`visualLanguage`, and `visualLanguage` before `template`. If a scene's
`visualTransformation` is empty, the scene will be background + text no matter
which component gets used.

One more thing a gate cannot check: whether the image is *specific*. A
cocktail glass for "quán bar ở Itaewon" and a stack of passports for "người
nước ngoài" both passed every mechanical check and both read as stock filler,
because they illustrate the category rather than the place. When the subject
is culturally or geographically specific, the prompt has to be too.

First decide the document's editorial intent. **Context/authority** (title,
precedent, issuing body) may use the full source or a truthful crop and does not
require exact regions. **Cited evidence** should normally declare optional
`evidenceRegions: [{anchorPhrase, region:[x,y,w,h]}]` on the document asset.
`beat_sync.py evidence-regions` derives each local start frame from the existing
aligned narration; the mapping duplicates no timing. Pass its returned regions
to `DocumentEvidence`, which preserves the raster, dims surrounding material,
highlights exact evidence, and moves when narration reaches another clause. It
does not choose evidence, rewrite source text, or force every document into the
same composition.
The region identifies the claim location, not a crop boundary. Safe presentation
margin belongs to the primitive. `allowCrop` may bleed the surrounding page; it
may never guillotine the cited evidence region.

Rendered variety is judged from the scene-summary sheet, not from apparently
different `visualLanguage` labels. Do not relabel scenes or add media/layout/
transition quotas to make a number look varied.

# Primitives — what already exists, including Remotion's own

Read this before writing a component. A recurring waste in this project has
been building from scratch on top of tooling that was already installed and
never touched: at the time of the V10 review only **3 of 12** available
`@remotion/*` packages were imported anywhere, and of the 12 installed
`remotion-dev` skills only `remotion-markup` had ever been consulted.

## Project primitives

### `src/scenes/shared.jsx` — the core kit

| Component | Use |
|---|---|
| `SceneBackground` | Paper backdrop; `variant`: `grid` / `chart` / `card` / `spotlight` |
| `BottomBar` | The always-present orange bar. Render OUTSIDE `CameraGroup` |
| `CameraGroup` | Per-scene zoom / pan / `shake` beats |
| `Hero` / `Support` | Cutouts; entrance `variant`, `idle` motion, `visibleFor` exit |
| `PunchPhrase` | The one headline per scene. **`onDark`** for photo backgrounds |
| `SpeechBubble` / `SpeechBubbleQuote` | Dialogue and pull-quotes |
| `StatCounter` | One number ticking up |
| `AnimatedLineChart` | A value across several points |
| `NewspaperSpotlight` | Document with highlighter stroke |
| `DocumentStamp` | Ink stamp with spring landing |
| `VoxMapPin` | Pin badge — **only over a real map**, see `MapGraphic` |
| `FlowArrow` | Self-drawing cause→effect arrow |
| `ImpactFlash`, `Shimmer`, `TensionString` | Punctuation effects |
| `Captions` | Word-synced captions, mounted once at master level |
| `SAFE_ZONE` | Placement exclusion band; mirrored in `check_overlap.py` |

### `src/scenes/visualLanguage.jsx` — beyond the cutout

| Component | Use |
|---|---|
| `BackgroundPhoto` | Full-bleed photo, tinted to palette. The fastest cure for an empty frame |
| `DiagramCanvas` | SVG container in a 1080×1300 space for drawn reconstructions |
| `DrawnPath` | Progressive stroke reveal |
| `DimensionLine` | Measurement line with end ticks and a label ("3,2m") |
| `DensityGrid` | Dots filling a box — for "N people per m²" claims |
| `SlopeIndicator` | Incline with a direction arrow |
| `Timeline` | Chronological markers landing in sequence |
| `AnnotatedPhoto` | Photo + leader lines + labels pointing at details |
| `DeviceMockup` | Phone / TV frame around an image. **Draws the device itself** — never source a photo of a phone |
| `ForceArrow` | A push that meets something and rebounds. Shows why a force *failed*, which a photo of someone pushing cannot |
| `MemorialDots` | One mark per person, counted up. Not `DensityGrid` — that answers "how packed", this answers "how many" |
| `ChainBreak` | A sequence that draws itself, then one link snaps. **Vertical by default** — a horizontal row is a thin strip on a 9:16 frame |
| `StreetElevation` | A row of labelled shopfronts. Illustrates *density*, where a single cocktail glass illustrates only the category |
| `DrawnText` | A label that arrives on its beat. **Always use this, never a bare `<text>`** — a bare one is painted from frame 0, which put 67 V11 labels on screen before their beat. Pass `plate` when it sits over a photo or cutout |

`DiagramCanvas` coordinates are **screen pixels within the canvas**: its
viewBox tracks the `height` you pass. Draw across the full width and height
you asked for — content sized for a smaller box floats in the middle of a
bigger one.

### `src/scenes/iconVocabulary.jsx` — the symbol vocabulary

Fifteen drawn symbols on `@remotion/shapes` + `@remotion/paths`, all taking
the same `x, y, size, delay, color, accent` props and all drawn
progressively like the rest of the diagram language. See them:

```bash
npx remotion still IconVocabularySheet input/icon_vocabulary.png --scale=0.5
```

`IconBan` · `IconCheck` · `IconClock` · `IconCrowd` · `IconDensity` ·
`IconDoc` · `IconFall` · `IconMoney` · `IconPerson` · `IconPhone` ·
`IconPin` · `IconQuestion` · `IconRise` · `IconScale` · `IconWarning`

**This one is enforced, not suggested.** `icon_gate.py` parses the `VOX_ICONS`
registry out of the file itself and fails a scene whose drawn label spells out
a concept an icon already draws, and a finished video that carries symbols in
under a fifth of its scenes. Adding an icon means adding **both** the
`export const` and the registry entry — either one alone is a failure, so the
list above cannot drift out of date.

`IconScale` tilts toward the heavier side and `IconDensity` takes a real
`fill` ratio: pass the actual values, so the drawing carries the claim instead
of a caption repeating it.

### `src/scenes/MapGraphic.jsx` — real maps

MapLibre GL, no API key, no account. Static camera by default (a live
per-frame camera shimmers on raster tiles — see the technique doc). Pass
`areaKm2` to draw a real footprint circle.

Render maps with `--gl=angle`.

**Cache the tiles before rendering** — do not ship a video whose map depends
on a live fetch:

```bash
py -3 .claude/skills/vox-collage-video/scripts/cache_map_tiles.py \
  --center 126.9945,37.5345 --zoom 14 --zoom 15 --radius 3
```

then `style={LOCAL_RASTER_STYLE}`. Cache one zoom above the one you set
(device pixel ratio) — the script pulls every ancestor level itself.

A map that fails to tile renders **successfully**, with a hole in it, because
`MapGraphic` releases its `delayRender` handle on a deadline rather than
hanging. Check the still, and check the render log for 404s.

### `src/blocks/` — PARKED. Build bespoke; a block is the exception.

Five blocks extracted from the V10 scenes the viewer kept. They work, and they
are **not** the default route into a scene. Measured coverage on plans:

| | |
|---|---|
| V10 — the video they were extracted FROM | 54% (overfit, not a result) |
| **V11 — part 2 of that same story** | **25%** |
| V13 — a different subject | 25% |

On any video the blocks have not already seen — including a direct sequel with
the same assets and style — three scenes in four have no block that fits. So
the library is a small convenience, not a scaffold, and the build step must not
open with "check the library".

That framing is what killed `SceneTemplates.jsx`, and it contradicts this
skill's own first rule: *meaning first, component second.*

**Use one only when a scene's `narrativeFunction × visualLanguage` already
lands in a block's `fits` AND its `whenNotToUse` does not describe your scene.**
Then declare `"block": "..."` in the plan. Declaring nothing means bespoke, and
that is the normal case — `block_gate.py` does not ask.

`ChannelOutro` is the one worth reaching for by default: every video ends the
same way, so it is reusable by construction rather than by evidence.

Blocks hold **no absolute frames** — entrances arrive through `beats` from
`beat_sync.py`, so one block fits a 90-frame scene and a 152-frame one.

Monotony is now measured, not constrained: `sheet_vision.py` reads the rendered
contact sheet and reports the largest look-alike group (V10 23–38%, V11 54–67%,
matching the viewer's own "liked" / "exhausting"). That is a better instrument
than a plan-time quota derived from one video — the derived constants failed to
transfer twice (`mood` on V10/S22, `place` on V13/S1).

### `src/scenes/SceneTemplates.jsx` — DEAD, do not use

Seven composed arrangements (`CollageScene`, `SplitCompareScene`,
`StatCalloutScene`, `NewspaperSpotlightScene`, `QuoteBubbleScene`,
`FlowDiagramScene`, `MapLocationScene`). Used by V3–V9; used by **zero** scenes of
V10–V13. They are one scene in seven arrangements — same `zoom 1→1.0x`, same
`rise/grow/dropSpin`, same `idle="sway"`, same `visibleFor={durationInFrames}`
— and they are named after layouts, which forces the pick to be made on
layout instead of on meaning. Superseded by `src/blocks/`, which is itself parked - see above.

`MapLocationScene` renders a pin with no map. Prefer `MapGraphic`.

## Remotion packages — installed and available

| Package | Status | Use for |
|---|---|---|
| `@remotion/transitions` | in use | Scene transitions |
| `@remotion/sfx` | in use | One-shot sounds (URL constants, **not** an `<Audio>` component) |
| `@remotion/google-fonts` | in use | Be Vietnam Pro |
| `@remotion/shapes` | in use by `iconVocabulary.jsx` | Ready-made geometry for diagrams |
| `@remotion/paths` | in use by `iconVocabulary.jsx` | Exact path length for draw-on effects |
| `@remotion/noise` | installed, unused | Organic jitter, texture |
| `@remotion/lottie` | installed, unused | Vector icon animation |
| `@remotion/media` | installed | Video/audio primitives |
| `maplibre-gl` + `@turf/turf` | added for `MapGraphic` | Maps, routes, geo maths |
| `@remotion/effects` | approved to add | Canvas/WebGL effects (blur etc.) |
| `@remotion/three` | approved to add | 3D — heavy, use selectively |

## Remotion skills — installed under `.agents/skills/`

`remotion-markup` is the general reference (transitions, sequencing, audio,
captions, fonts, images, effects, 3d, lottie, light-leaks, text-highlights,
audio-visualization, video-editing, silence-detection).

`remotion-maps` covers static maps, MapLibre, Mapbox, MapTiler and CesiumJS.
Also installed: `remotion-best-practices`, `remotion-captions`,
`remotion-render`, `remotion-studio`, `remotion-multimedia`,
`remotion-interactivity`, `remotion-docs`.

## Verify docs against the installed package

Two real mismatches have already cost debugging time:

- `remotion-markup/sfx.md` shows `import { Audio } from "@remotion/sfx"`. The
  package exports **URL strings only**; use Remotion's own `<Audio>`.
- `remotion-maps/.../maplibre/TECHNIQUE.md` shows
  `import maplibregl from 'maplibre-gl'`. **v6 has no default export** — use
  `import { Map as MapLibreMap } from "maplibre-gl"`. The default import fails
  at runtime with *"Cannot read properties of undefined (reading 'Map')"*.
- The same doc's `tile.openstreetmap.org` tile URL is **blocked** for this
  use: it returns a "403 Access blocked" notice image under HTTP 200. See
  `lessons.md`.

"Official" does not mean "matches the version installed here". Check
`node_modules` before trusting an example.

## Before adding a component

1. Does something here already do it?
2. Does a Remotion package do it? (check the table above)
3. Only then write it — and add it to this file.

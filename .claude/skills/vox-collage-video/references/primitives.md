# Primitives — what already exists, including Remotion's own

Read this before writing a component. A recurring waste in this project has
been building from scratch on top of tooling that was already installed and
never touched: at the time of the V10 review only **3 of 12** available
`@remotion/*` packages were imported anywhere, and of the 12 installed
`remotion-dev` skills only `remotion-markup` had ever been consulted.

## Project primitives

### `src/videos/V<N>/shared.jsx` — per-video shared primitives

New scenes are bespoke under `src/videos/V<N>/scenes/`. Reuse a primitive only
when it expresses the intended relationship; no primitive name is required by a
gate. Direct Remotion JSX and `staticFile("V<N>/assets/<file>")` are first-class.

| Component | Use |
|---|---|
| `SceneBackground` | Paper backdrop; `variant`: `grid` / `chart` / `card` / `spotlight` |
| `BottomBar` | The always-present orange bar. Render OUTSIDE `CameraGroup` |
| `CameraGroup` | Stable unless a semantic event calls for zoom / pan / `shake` |
| `EditorialHero` / `EditorialSupport` | Default cutouts for new scenes: entrance → settle → hold; continuous `idle` is explicit opt-in |
| `Hero` / `Support` | Legacy/low-level cutouts retaining historical sway behavior; existing shipped scenes or intentional explicit use only |
| `PunchPhrase` | The one headline per scene. **`onDark`** for photo backgrounds |
| `SpeechBubble` / `SpeechBubbleQuote` | Dialogue and pull-quotes |
| `StatCounter` | One number ticking up |
| `AnimatedLineChart` | A value across several points |
| `NewspaperSpotlight` | Legacy/simple document card with one highlighter stroke; not the default evidence path |
| `DocumentStamp` | Ink stamp with spring landing |
| `VoxMapPin` | Pin badge — **only over a real map**, see `MapGraphic` |
| `FlowArrow` | Self-drawing cause→effect arrow |
| `ImpactFlash`, `Shimmer`, `TensionString` | Punctuation effects |
| `Captions` | Word-synced captions, mounted once at master level |
| `SAFE_ZONE` | Placement exclusion band; mirrored in `check_overlap.py` |

### Historical shared visual primitives — copy deliberately, do not depend on a template

| Component | Use |
|---|---|
| `BackgroundPhoto` | Full-bleed photo, tinted to palette; `drift=0` by default |
| `DocumentEvidence` | Authentic raster evidence with timed focus and safe-fit margin; cited regions remain visible by default; intentional crop requires `allowCrop` |
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

For a document that is **cited evidence**, an asset may optionally declare:

```json
"evidenceRegions": [
  {"anchorPhrase": "verbatim narration phrase", "region": [0.08, 0.18, 0.84, 0.12]}
]
```

Coordinates are normalized to the authentic source raster. Do not put timing in
this mapping: `beat_sync.py evidence-regions <plan>` resolves each phrase through
the existing aligned transcript and returns scene-local `regions` for
`DocumentEvidence`. A document used only as context/authority remains valid
without `evidenceRegions`. Never retype source text as a substitute.
`evidenceRegion` describes where the claim is located, not the exact crop boundary.
The rendering primitive owns deterministic presentation margin around it.

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

**Icons are optional.** A video using zero icons is valid. `icon_gate.py` parses
the `VOX_ICONS` registry and, when a scene actually renders an icon, checks that
the component is registered/exported/imported. Adding an icon means adding both
the `export const` and registry entry so the capability cannot drift.

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

### Bespoke is the canonical path

There is no active block registry or scene-template layer. Do not recreate one.
Compose semantic intent directly in production source, render OPEN/KEY actual
pixels, and let human contact-sheet approval decide art direction. Monotony is
judged from rendered output, not constrained by media, layer, or component quotas.

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

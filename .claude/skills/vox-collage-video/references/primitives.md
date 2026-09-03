# Active primitive surface

Fresh production may use only these canonical files, Remotion/normal external package
libraries, direct JSX, and generated per-video `timing.js`; arbitrary per-video visual
or helper modules are not allowed:

| File | Responsibility |
|---|---|
| `src/primitives/DocumentEvidence.jsx` | Authentic raster/document presentation, source-context-preserving full page or truthful claim-region focus with primitive-owned safe margin; never fake retyped evidence |
| `src/primitives/MapGraphic.jsx` | Approved `materialId`, real map plate/data with route and annotations |
| `src/primitives/DataChart.jsx` | Approved `materialId`, bar/line/pie from real numeric data; no variety-only charts |
| `src/primitives/Captions.jsx` | Existing word-synced caption presentation |
| `src/primitives/media.jsx` | Image/video plates, crop, mask, scrim, vignette, optional promoted pan/push/zoom/crossfade |
| `src/primitives/Reveal.jsx` | Explicit opt-in PROMOTE reveal; static when `enabled=false` |
| `src/primitives/RelationDiagram.jsx` | Minimal relationship representation requiring an approved `materialId`; the current PLAN owns the matching `diagramJustification` |
| `src/primitives/LayoutSafety.jsx` | Browser-rendered text/content geometry safety for arbitrary JSX |

There is no default timeline primitive. Chronology should normally be backed by a
document, photo, map or justified data treatment.

Historical shared files under `src/scenes/` remain for V3–V17 compatibility only.
Do not copy their generic cards, nodes, arrows, people/money/phone/vehicle icons,
tags/pills, chains, flowchart boards, decorative strokes or fake interfaces into
fresh production. Component names are not gate requirements.
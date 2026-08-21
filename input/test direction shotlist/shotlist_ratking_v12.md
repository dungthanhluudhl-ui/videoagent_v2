# Vox Shotlist Director — VRATKING12

- Approval/timing contract: Portable v1.1
- Visual asset strategy: Portable v1.2
- Timing source: `USER_TIMESTAMPED_CANONICAL_SCRIPT`
- FPS: 30
- State: `READY_FOR_APPROVAL`
- Generation count: 9

> JSON scene plan là nguồn sự thật duy nhất. Mốc narration chỉ đến từ cue timestamp do người dùng cung cấp. `editorial-relative` là timing hình ảnh, không phải timestamp narration.

## S1 — 0.000s → 4.500s / frame 0 → 135

**Narrative function:** hook
**Viewer question:** Why are some scientific phenomena so difficult to explain?
**Visual transformation:** Three concrete science-mystery images coexist in one editorial montage; the viewer moves from recognizable natural evidence to the unresolved question rather than staring at a generic museum room.
**Contrast with previous:** Opening establishes the series premise before supernatural ambiguity enters.
**Comprehension:** moderate · **Density:** med
**Visual language:** background-photo + annotated
**Primary visual anchor:** `image` · assets: ['UnexplainedScienceMontage']
**Anchor rationale:** The hook needs several concrete scientific curiosities immediately; a specific montage gives the viewer real visual material instead of a generic archive.

### Narration cues

- `C1` 0.000s → 3.000s — Như tiêu đề thì hôm nay chúng ta sẽ nói về những cái hiện tượng khoa học
- `C2` 3.000s → 4.500s — khá là khó giải thích

### Editorial rationale / Why this visual?

Use a specific montage of several strange-but-scientific phenomena rather than a generic museum archive. The narration is broad, so visual richness should come from multiple concrete examples while annotations only guide attention.

### Forbidden / Do not do

- Do not replace the planned relationship with a small centered cutout plus a sentence-length label.
- Do not use ghosts, occult symbols, or horror imagery that implies the phenomena are paranormal facts.

### Textual storyboard

Open on a full-frame montage with three clearly different scientific curiosities. A slow push reveals them left-to-right while subtle orange brackets briefly select each one. On C2, the montage holds and the short punch “KHÓ GIẢI THÍCH?” lands without replacing the imagery.

### Layout & layers

**Layout:** Full-frame archive provides texture; selected specimen cluster sits center-right, annotations grow from upper-left toward center, punch stays upper-left, lower caption band clear.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** medium-wide documentary frame
- **move:** slow push-in
- **startScale:** 1.00
- **endScale:** 1.06
- **pan:** subtle pan toward selected specimens
- **shake:** none
- **focusTarget:** selected unexplained specimen cluster

### Assets / generations

- **UnexplainedScienceMontage** · `AI_GENERATE_BACKGROUND` · role `background` · priority `critical` · source `AI_FIRST` · truth `generic-illustration` · generation `G01` · describes: ['C1', 'C2'] · purpose: Provides several concrete scientific curiosities at once so the opening feels specific and visually rich rather than category-level stock.
  - specificity: subject=unexplained scientific phenomena · context=opening montage of hard-to-explain science · generic rejected=generic museum room or generic laboratory
  - subjectPrompt: `a coherent vertical documentary editorial montage showing three distinct unexplained-science subjects in one realistic composition: a perfectly circular ice disk rotating in a cold river, a luminous ball-lightning-like orb over a storm field observed from a safe distance, and an unusual biological specimen under laboratory glass, intriguing scientific mystery, factual visual tone, not horror, no occult symbols, no readable text`

### Motion / transition

- Hero entrance: rise
- Suggested SFX: soft whoosh
- Transition: clean cut into split interpretation — The next scene reuses the same evidence but changes its interpretation, so a clean cut preserves continuity.

### Timed sub-beats

- `narration-cue` `C1.start` · local 0.000s / F0 · absolute 0.000s / F0 — C1 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.600s / F48 · absolute 1.600s / F48 — Unresolved annotation brackets and question markers begin accumulating around the selected specimens
- `narration-cue` `C2.start` · local 3.000s / F90 · absolute 3.000s / F90 — C2 narration cue begins; advance the scene state tied to this phrase

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S2 — 4.500s → 10.200s / frame 135 → 306

**Narrative function:** paradox
**Viewer question:** Does “supernatural-sounding” automatically mean unscientific?
**Visual transformation:** A supernatural-looking luminous phenomenon remains physically real while a scientific observation setup becomes more prominent; the eerie appearance is visually separated from the claim that science has abandoned it.
**Contrast with previous:** Moves from general difficulty to the central paradox: mysterious does not equal anti-science.
**Comprehension:** moderate · **Density:** med
**Visual language:** split + annotated
**Primary visual anchor:** `image` · assets: ['ObservedLuminousPhenomenon']
**Anchor rationale:** A fresh phenomenon image lets the paradox play on concrete evidence instead of simply recoloring the previous scene.

### Narration cues

- `C3` 4.500s → 7.000s — và một số cái thậm chí nghe còn hơi bị siêu nhiên.
- `C4` 7.000s → 10.200s — Nhưng mà không hẳn là phi khoa học, mà kiểu khoa học cũng kiểu không biết giải thích thế nào ấy.

### Editorial rationale / Why this visual?

Use a second, completely different image anchor: an eerie-looking luminous event under scientific observation. The split/strike graphics explain the distinction, but the image remains the dominant thing the viewer looks at.

### Forbidden / Do not do

- Do not replace the planned relationship with a small centered cutout plus a sentence-length label.
- Do not resolve the mystery with a fake scientific explanation; the visual must preserve uncertainty.

### Textual storyboard

Cut to a new full-frame atmospheric phenomenon. The left side briefly leans eerie while the right side emphasizes measurement equipment. At C4, a strike rejects the idea that mysterious appearance equals anti-science; the same image remains visible under a clean “UNRESOLVED” treatment.

### Layout & layers

**Layout:** Diagonal split spans the full frame; supernatural reading occupies left third, scientific unresolved treatment occupies right two-thirds, strike crosses only the false interpretation, captions remain below.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** wide split editorial frame
- **move:** mostly static with slight lateral emphasis
- **startScale:** 1.03
- **endScale:** 1.03
- **pan:** left-to-right emphasis as scientific interpretation wins
- **shake:** none
- **focusTarget:** boundary between false supernatural reading and unresolved science

### Assets / generations

- **ObservedLuminousPhenomenon** · `AI_GENERATE_BACKGROUND` · role `background` · priority `critical` · source `AI_FIRST` · truth `generic-illustration` · generation `G02` · describes: ['C3', 'C4'] · purpose: Creates a new specific opening image: an eerie-looking natural luminous event being observed with scientific instruments, so “supernatural-sounding” and “scientifically unresolved” can coexist in one shot.
  - specificity: subject=scientifically observed luminous natural phenomenon · context=supernatural-looking but science-observed phenomenon · generic rejected=reuse of the same museum image or occult imagery
  - subjectPrompt: `a realistic nighttime field observation of a strange luminous atmospheric orb hovering above wet ground after a storm, compact scientific sensor equipment and measurement tripods visible at a safe distance, eerie appearance but credible scientific-documentary framing, no ghosts, no occult symbols, no readable text`

### Motion / transition

- Hero entrance: strike
- Suggested SFX: light strike hit
- Transition: zoom-through into title reset — The paradox resolves into a short launch beat; a fast zoom-through creates a purposeful rhythm break.

### Timed sub-beats

- `narration-cue` `C3.start` · local 0.000s / F0 · absolute 4.500s / F135 — C3 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.200s / F36 · absolute 5.700s / F171 — The supernatural-looking interpretation gains visual emphasis before the scientific counter-reading arrives
- `narration-cue` `C4.start` · local 2.500s / F75 · absolute 7.000s / F210 — C4 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 3.900s / F117 · absolute 8.400s / F252 — The false paranormal implication is struck out while the scientific side remains marked unresolved

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S3 — 10.200s → 11.800s / frame 306 → 354

**Narrative function:** transition
**Viewer question:** Are we ready to move from setup into the first case?
**Visual transformation:** The intro collage snaps away into a clean title beat, converting setup into forward motion without introducing new factual content.
**Contrast with previous:** Hard rhythmic reset after the premise; intentionally simpler than the previous explanation.
**Comprehension:** simple · **Density:** low
**Visual language:** text-only
**Primary visual anchor:** `text` · assets: []
**Anchor rationale:** This 1.6-second cue is purely a rhythmic launch and intentionally does not introduce factual imagery.

### Narration cues

- `C5` 10.200s → 11.800s — Ok, bắt đầu thôi!

### Editorial rationale / Why this visual?

Use a deliberately simple text-only reset because the cue contains no new factual claim and functions purely as a launch beat. Adding stock imagery here would create filler and weaken the contrast before the first concrete case.

### Forbidden / Do not do

- Do not add decorative stock images; this cue is intentionally a short transition beat.

### Textual storyboard

The split scene snaps shut on the cue boundary. The paper grid rushes forward, all evidence clears, and one oversized “BẮT ĐẦU” punch hits center for a brief reset. No new factual visual is introduced; the beat exists only to launch the first case and leave the caption area unobstructed.

### Layout & layers

**Layout:** One centered punch dominates the safe middle band on a clean graph-paper background; no secondary visual mass competes with it.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** medium graphic title frame
- **move:** fast zoom-through then settle
- **startScale:** 0.94
- **endScale:** 1.00
- **pan:** none
- **shake:** light impact only
- **focusTarget:** BẮT ĐẦU punch

### Assets / generations

- (code-drawn/no sourced asset)

### Motion / transition

- Hero entrance: punch
- Suggested SFX: short impact
- Transition: hard cut to archival evidence — The title beat should release directly into the first factual case without decorative delay.

### Timed sub-beats

- `narration-cue` `C5.start` · local 0.000s / F0 · absolute 10.200s / F306 — C5 narration cue begins; advance the scene state tied to this phrase

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S4 — 11.800s → 14.000s / frame 354 → 420

**Narrative function:** definition
**Viewer question:** What is the first phenomenon called?
**Visual transformation:** A full Rat King reconstruction is revealed as the first concrete case; the viewer sees the tangled animal cluster itself before any explanatory graphics arrive.
**Contrast with previous:** Introduces the first concrete case immediately after the title reset.
**Comprehension:** moderate · **Density:** low
**Visual language:** document + cutout, annotated
**Primary visual anchor:** `image` · assets: ['RatKingHeroReconstruction']
**Anchor rationale:** The narration names Rat King, so the viewer must immediately see a Rat King rather than wait for manual archival sourcing or a later diagram.

### Narration cues

- `C6` 11.800s → 14.000s — Đầu tiên là Vua chuột hay là Rat King.

### Editorial rationale / Why this visual?

Use an AI illustrative reconstruction as the default primary visual because Rat King is the named subject and must be visible immediately. Treat it explicitly as reconstruction, not archival evidence; authentic reference can still be added later if easy to source.

### Forbidden / Do not do

- Do not make Rat King the one central subject that has no generation prompt.
- Do not present the AI reconstruction as an authentic archival photograph or museum record.

### Textual storyboard

A large reconstructed Rat King cutout peels into the center as an evidence-card edge and orange spotlight frame appear behind it. The full cluster remains dominant; the RAT KING identifier lands beside the knot, not over it. A slow push emphasizes the central entanglement.

### Layout & layers

**Layout:** Archival specimen image occupies the central evidence card; identifier sits upper-left of the card, spotlight/annotation hugs the tangled center, lower caption band remains untouched.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** medium archival evidence frame
- **move:** slow push toward specimen center
- **startScale:** 1.00
- **endScale:** 1.08
- **pan:** tiny pan to tangled mass
- **shake:** none
- **focusTarget:** tangled center of real specimen

### Assets / generations

- **RatKingHeroReconstruction** · `AI_GENERATE_CUTOUT` · role `hero` · priority `critical` · source `AI_FIRST` · truth `illustrative-reconstruction` · generation `G05` · describes: ['C6'] · purpose: Directly visualizes the named central subject so the workflow does not depend on manually finding archival imagery before the viewer can understand what a Rat King looks like.
  - specificity: subject=Rat King · context=introduction of the first named phenomenon · generic rejected=generic normal rat, generic museum specimen room, or text-only title
  - subjectPrompt: `a scientifically plausible illustrative reconstruction of a Rat King: six realistic black rats arranged in a compact radial cluster, bodies intact and anatomically credible, their long natural tails visibly tangled together into one dense central knot, full group completely visible from a slightly elevated three-quarter angle, documentary zoological photography, no gore, no fantasy mutations`

### Motion / transition

- Hero entrance: peel
- Suggested SFX: paper peel
- Transition: clean cut to animal reference — The evidence card introduces the case, then the next scene shifts to the animal context.

### Timed sub-beats

- `narration-cue` `C6.start` · local 0.000s / F0 · absolute 11.800s / F354 — C6 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.000s / F30 · absolute 12.800s / F384 — Spotlight tightens onto the tangled center and the RAT KING identifier settles beside the specimen

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S5 — 14.000s → 18.000s / frame 420 → 540

**Narrative function:** evidence
**Viewer question:** What kind of rats are associated with this rare phenomenon?
**Visual transformation:** One full-body black rat becomes a concrete visual reference while a rarity indicator and species-focused annotation narrow the phenomenon from “rats in general” to the described black-rat context.
**Contrast with previous:** Moves from naming the phenomenon to identifying the animal context and rarity.
**Comprehension:** moderate · **Density:** med
**Visual language:** cutout + annotated
**Primary visual anchor:** `image` · assets: ['BlackRatHero']
**Anchor rationale:** A dedicated high-resolution black-rat hero makes the species cue immediately readable and avoids using a small board crop as the dominant image.

### Narration cues

- `C7` 14.000s → 18.000s — Đây là một hiện tượng khá là hiếm gặp ở chuột, đặc biệt là ở chuột đen hay còn gọi là chuột Tàu.

### Editorial rationale / Why this visual?

Generate the black rat as its own hero rather than packing it into a four-cell board. Rarity and labels remain secondary overlays; the animal itself is the focal visual.

### Forbidden / Do not do

- Do not replace the planned relationship with a small centered cutout plus a sentence-length label.
- Do not show a generic mouse or cartoon rodent; keep a realistic full-body black rat with tail visible.

### Textual storyboard

A large black-rat hero rises on the right against the collage grid while a small thumbnail of the previous Rat King reconstruction recedes behind it. A restrained rarity indicator and BLACK RAT label settle on the left; the hero remains crisp and dominant.

### Layout & layers

**Layout:** Hero black-rat cutout occupies right half at large scale; rarity indicator and two short labels balance the left; tiny specimen thumbnail can sit deep background as continuity.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** medium close editorial cutout frame
- **move:** gentle push-in
- **startScale:** 1.00
- **endScale:** 1.05
- **pan:** slight pan right toward rat body
- **shake:** none
- **focusTarget:** full-body black rat and visible tail

### Assets / generations

- **BlackRatHero** · `AI_GENERATE_CUTOUT` · role `hero` · priority `major` · source `AI_FIRST` · truth `documentary-reference` · generation `G06` · describes: ['C7'] · purpose: Provides a dedicated high-resolution black-rat hero for the rarity/species cue, independent from mechanism support assets.
  - specificity: subject=black rat · context=black-rat species context before Rat King mechanism · generic rejected=generic mouse, cartoon rodent, or low-resolution board crop
  - subjectPrompt: `a single full-body black rat in clean side profile, alert natural posture, realistic black fur and anatomy, long tail fully visible with clear separation from the body, documentary wildlife photography`

### Motion / transition

- Hero entrance: rise
- Suggested SFX: soft thud
- Transition: comedic whip into false branch — The narration immediately moves into a joke, so a sharper transition supports the tonal change.

### Timed sub-beats

- `narration-cue` `C7.start` · local 0.000s / F0 · absolute 14.000s / F420 — C7 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.500s / F45 · absolute 15.500s / F465 — Rarity indicator settles low while the black-rat cutout remains the dominant reference

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S6 — 18.000s → 21.500s / frame 540 → 645

**Narrative function:** reversal
**Viewer question:** What is Rat King NOT?
**Visual transformation:** A clearly fictional martial-arts-rat gag image appears, then is crossed out quickly so the joke works through imagery before the video returns to the real mechanism.
**Contrast with previous:** Comic reversal interrupts the factual explanation and resets attention before the mechanism scene.
**Comprehension:** simple · **Density:** med
**Visual language:** mockup + cutout, split
**Primary visual anchor:** `image` · assets: ['MartialArtsRatGag']
**Anchor rationale:** The comedy beat should be driven by a fresh image, while generic turtle silhouettes and the strike only support the joke.

### Narration cues

- `C8` 18.000s → 21.500s — Và không, đây không phải là một con chuột đột biến xong rồi đi dạy võ cho bốn con rùa.

### Editorial rationale / Why this visual?

Use a new comedic rat hero for the false definition, not cheap reuse of the previous species image. The four turtle silhouettes remain generic code-drawn support so the frame stays image-led without reproducing branded characters.

### Forbidden / Do not do

- Do not reproduce recognizable copyrighted turtle characters, logos, costumes, or exact franchise designs.
- Do not let the joke occupy the frame after the cue ends.

### Textual storyboard

A new photoreal upright rat hero wobble-drops into an absurd martial-arts pose. Four tiny generic turtle-shell silhouettes pop beside it for the punchline. A thick orange strike wipes across the entire false branch and the gag collapses immediately before the mechanism scene.

### Layout & layers

**Layout:** False-fantasy branch grows from left to center while the reused rat remains the anchor; four generic shell silhouettes form a compact support cluster; orange strike spans the branch without covering captions.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** wide comedic mockup frame
- **move:** quick punch-in then recoil
- **startScale:** 1.00
- **endScale:** 1.08
- **pan:** brief pan into false branch then back
- **shake:** subtle impact shake on strike
- **focusTarget:** crossed-out mutant fantasy branch

### Assets / generations

- **MartialArtsRatGag** · `AI_GENERATE_CUTOUT` · role `hero` · priority `major` · source `AI_FIRST` · truth `generic-illustration` · generation `G07` · describes: ['C8'] · purpose: Makes the joke visually immediate with a new comedic hero image instead of reusing the factual black-rat hero and relying mainly on vector silhouettes.
  - specificity: subject=fictional martial-arts rat gag · context=comedic false definition of Rat King · generic rejected=reuse of the previous ordinary rat with mostly vector decorations
  - subjectPrompt: `a photoreal black rat standing upright in an exaggerated but harmless martial-arts instructor pose, front paws raised as if demonstrating a stance, clearly comedic and fictional, no clothing, no weapons, realistic fur and anatomy, full body visible`
- **GenericTurtleShellCluster** · `CODE_DRAWN` · role `None` · priority `None` · source `None` · truth `None` · generation `—` · describes: ['C8'] · purpose: Adds four generic turtle-shell silhouettes only as a secondary joke support layer; the generated rat image remains the primary visual.
  - graphicsRole: `support` · overlay: —

### Motion / transition

- Hero entrance: wobble-drop
- Suggested SFX: comic pop + strike hit
- Transition: snap back to explanatory diagram — The joke must collapse quickly so the mechanism arrives with renewed clarity.

### Timed sub-beats

- `narration-cue` `C8.start` · local 0.000s / F0 · absolute 18.000s / F540 — C8 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.400s / F42 · absolute 19.400s / F582 — Generic turtle-shell silhouettes pop into the false fantasy branch
- `editorial-relative` · local 2.500s / F75 · absolute 20.500s / F615 — Orange strike rejects the entire fantasy branch and returns focus to the ordinary rat

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S7 — 21.500s → 27.800s / frame 645 → 834

**Narrative function:** mechanism
**Viewer question:** How does a Rat King physically form?
**Visual transformation:** The viewer watches two photographic reconstruction states: separate crossing tails first, then a visibly tightened central knot. Graphics trace/highlight the existing tails instead of drawing replacement anatomy.
**Contrast with previous:** Returns from the joke to the core physical mechanism, requiring the viewer to watch the entanglement form.
**Comprehension:** complex · **Density:** high
**Visual language:** diagram + background-photo, annotated
**Primary visual anchor:** `image` · assets: ['RatTailsCrossingState', 'RatKingTightKnotState']
**Anchor rationale:** Two image states let the viewer see real-looking rats and tails before/after entanglement; graphics only clarify the state change.

### Narration cues

- `C9` 21.500s → 24.000s — Vua chuột là khi mà nhiều con chuột bị mắc đuôi vào nhau,
- `C10` 24.000s → 27.800s — và đuôi của chúng nó thì xoắn lại thành một cái cục đến mức mà cả đám gần như là không thể tách ra,

### Editorial rationale / Why this visual?

Keep the mechanism meaning-first but make it image-led: generate pre-knot and tight-knot reconstruction states, then use restrained overlays to highlight the existing tails. This avoids the v1.1 error of giving rats complete tails and drawing a second set of vector tails.

### Forbidden / Do not do

- Do not replace the planned relationship with a small centered cutout plus a sentence-length label.
- Do not begin with the knot already complete; the viewer must watch separate tails converge and twist.

### Textual storyboard

Begin on the top-down crossing-tail state. Small orange markers identify two crossing points without replacing anatomy. At C10, transition to the tight-knot state; the central knot receives a glow/outline and short tension arrows point outward toward the rats. The camera pushes toward the knot as separation becomes visibly harder.

### Layout & layers

**Layout:** Three generated rat cutouts plus the reused reference form a radial ring around the center; tail paths converge into the middle; punch sits above the knot, not over rat faces.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** top-down-ish diagram-centric wide frame
- **move:** controlled push-in as knot tightens
- **startScale:** 0.98
- **endScale:** 1.08
- **pan:** none
- **shake:** subtle tension tremble near final knot
- **focusTarget:** central tail knot and converging paths

### Assets / generations

- **RatTailsCrossingState** · `AI_GENERATE_BACKGROUND` · role `evidence` · priority `critical` · source `AI_FIRST` · truth `illustrative-reconstruction` · generation `G03` · describes: ['C9'] · purpose: Shows the mechanism before the knot: several rats arranged radially with natural tails crossing but still visibly separate.
  - specificity: subject=Rat King formation · context=pre-knot mechanism state · generic rejected=isolated rat cutouts plus newly drawn fake tails
  - subjectPrompt: `a top-down documentary-style illustrative reconstruction of four realistic black rats arranged radially on a neutral scientific observation surface, their natural tails crossing and overlapping near the center but still visibly separate and not yet knotted, all bodies fully visible, no gore, no text`
- **RatKingTightKnotState** · `AI_GENERATE_BACKGROUND` · role `evidence` · priority `critical` · source `AI_FIRST` · truth `illustrative-reconstruction` · generation `G04` · describes: ['C10'] · purpose: Shows the same mechanism after tightening: natural tails form one compact central knot while bodies pull outward.
  - specificity: subject=Rat King formation · context=tight-knot mechanism state · generic rejected=vector-only knot or duplicated artificial tails
  - subjectPrompt: `a top-down documentary-style illustrative reconstruction of four realistic black rats arranged radially on a neutral scientific observation surface, their natural tails visibly tightened together into one compact central knot, bodies pulled slightly outward by tension, all anatomy credible, no gore, no text`
- **TailKnotHighlight** · `CODE_DRAWN` · role `None` · priority `None` · source `None` · truth `None` · generation `—` · describes: ['C9', 'C10'] · purpose: Explains the changing relationship by highlighting existing crossing points and the final knot without drawing duplicate tails.
  - graphicsRole: `support` · overlay: {'mode': 'highlight', 'targetAsset': 'RatKingTightKnotState', 'conflictAvoidance': 'Highlight the visible natural tails and central knot with markers/arrows only; never draw replacement or duplicate tail anatomy.'}

### Motion / transition

- Hero entrance: unfold
- Suggested SFX: subtle tension creak
- Transition: match cut on central knot — The finished knot is the shared visual anchor for the consequence/scale scene, so the transition should preserve its screen position.

### Timed sub-beats

- `narration-cue` `C9.start` · local 0.000s / F0 · absolute 21.500s / F645 — C9 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 1.200s / F36 · absolute 22.700s / F681 — Separate orange tail paths extend from each rat toward the center
- `narration-cue` `C10.start` · local 2.500s / F75 · absolute 24.000s / F720 — C10 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 4.100s / F123 · absolute 25.600s / F768 — The paths braid tighter into one central knot and the surrounding rats show outward tension

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

## S8 — 27.800s → 32.500s / frame 834 → 975

**Narrative function:** evidence
**Viewer question:** What does the knot do to movement, and how large can a Rat King become?
**Visual transformation:** A small Rat King cluster appears immobilized first, then a much larger Rat King reconstruction replaces it as the camera pulls back; count/density graphics quantify the “few to dozens” increase without becoming the only visual.
**Contrast with previous:** Converts the mechanism into consequence and quantity, ending this segment on a concrete scale increase.
**Comprehension:** complex · **Density:** high
**Visual language:** data + cutout, annotated
**Primary visual anchor:** `image` · assets: ['RatKingFewCluster', 'RatKingLargeCluster']
**Anchor rationale:** The consequence and scale should be felt through actual Rat King cluster images; data graphics only quantify what the images already make visible.

### Narration cues

- `C11` 27.800s → 29.500s — và cũng không thể di chuyển bình thường.
- `C12` 29.500s → 32.500s — Và một Vua chuột có thể bao gồm từ vài con cho tới vài chục con.

### Editorial rationale / Why this visual?

Use small and large Rat King reconstruction images as the main visual, then layer a restrained count progression. This keeps the original “count must be felt” rule without reducing the entire scene to generic vector rat markers.

### Forbidden / Do not do

- Do not replace the planned relationship with a small centered cutout plus a sentence-length label.
- Do not communicate “few to dozens” as text alone; the count field must visibly accumulate.

### Textual storyboard

Carry the tight knot into a small five-rat cluster image. On C11, short movement arrows attempt to pull outward and snap back. On C12, the camera pulls back and the image changes to a much larger Rat King cluster; a compact 5 → 12 → 20+ indicator and density brackets appear around it. End on the large image, not on an abstract marker field.

### Layout & layers

**Layout:** Central knot remains fixed around mid-frame; rat markers expand in concentric/offset groups around it while the camera pulls back; count labels stay peripheral and captions stay clear.

- L0 SceneBackground / paper-grid system
- L1 contextual photo or evidence layer
- L2 mechanism / diagram / support structure
- L3 hero/support focal visuals
- L4 punch phrase and short annotations
- L5 impact/highlight effects
- MASTER narration captions

### Camera

- **framing:** diagram/data wide frame
- **move:** pull-back to reveal scale
- **startScale:** 1.08
- **endScale:** 0.92
- **pan:** none
- **shake:** none
- **focusTarget:** fixed knot first, then expanding rat-count field

### Assets / generations

- **RatKingFewCluster** · `AI_GENERATE_CUTOUT` · role `hero` · priority `critical` · source `AI_FIRST` · truth `illustrative-reconstruction` · generation `G08` · describes: ['C11', 'C12'] · purpose: Provides a small image-led Rat King state so immobility and the low end of group size are tangible.
  - specificity: subject=Rat King · context=small immobilized cluster / few animals · generic rejected=generic rat markers or text-only FEW
  - subjectPrompt: `a compact illustrative reconstruction of a small Rat King made of five realistic black rats, bodies arranged around a clearly visible central tail knot, full group fully visible from elevated three-quarter view, documentary zoological photography, no gore`
- **RatKingLargeCluster** · `AI_GENERATE_CUTOUT` · role `hero` · priority `critical` · source `AI_FIRST` · truth `illustrative-reconstruction` · generation `G09` · describes: ['C12'] · purpose: Provides a visibly larger Rat King state so the scale increase toward dozens is carried by imagery before data overlays quantify it.
  - specificity: subject=Rat King · context=large cluster approaching dozens · generic rejected=generic vector rat silhouettes as the sole scale cue
  - subjectPrompt: `a large illustrative reconstruction of a Rat King made of many realistic black rats, roughly eighteen animals forming a broad dense cluster around a tangled central tail mass, group fully visible from elevated three-quarter view, documentary zoological photography, no gore, clear overall silhouette`
- **RatKingScaleOverlay** · `CODE_DRAWN` · role `None` · priority `None` · source `None` · truth `None` · generation `—` · describes: ['C11', 'C12'] · purpose: Adds restrained movement constraint arrows and a 5 to 20+ count progression around the real-looking cluster images.
  - graphicsRole: `support` · overlay: —

### Motion / transition

- Hero entrance: grow
- Suggested SFX: low thud pulses
- Transition: none — This is the end of the provided segment, so hold the dense final state rather than force an outgoing transition.

### Timed sub-beats

- `narration-cue` `C11.start` · local 0.000s / F0 · absolute 27.800s / F834 — C11 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 0.800s / F24 · absolute 28.600s / F858 — Rat bodies attempt opposing movement and snap back toward the fixed knot
- `narration-cue` `C12.start` · local 1.700s / F51 · absolute 29.500s / F885 — C12 narration cue begins; advance the scene state tied to this phrase
- `editorial-relative` · local 3.200s / F96 · absolute 31.000s / F930 — Rat markers rapidly accumulate from a few to a dense several-dozen field as camera pulls back

### Handoff

**Editor intent:** Preserve the scene’s stated visual transformation and cue-anchored timing while adapting exact geometry to real asset dimensions and Remotion implementation constraints.

**Must preserve:**
- canonical cue timing and order
- visualTransformation
- primary visualLanguage
- forbidden shortcuts
- narrative-purpose assets and code-drawn mechanism
- primary image/visual anchor and graphics role

**Implementation freedom:**
- exact x/y/scale and crop
- spacing and typography tuning
- spring/interpolation constants
- unlocked transition micro-details

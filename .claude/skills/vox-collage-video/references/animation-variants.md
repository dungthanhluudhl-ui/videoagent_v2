# Entrance animation variants

Choose an entrance that serves the event or meaning. The normal sequence is
**entrance → settle → hold**. New scenes use `EditorialHero` and
`EditorialSupport`, which settle by default; do not keep an element moving
merely to avoid a static frame.

All examples assume `frame` is local to the scene (subtract the scene's
start frame first) and use `spring`/`interpolate` from `remotion`.

## rise
Slides up from below its final position while fading in, slight overshoot.
```jsx
const y = spring({ frame, fps, from: 120, to: 0, config: { damping: 14 } });
const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
```
SFX: `whoosh`.

## grow
Scales up from ~0.6x to 1x with a springy overshoot past 1.0.
```jsx
const scale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
```
SFX: `thud` (lands with weight) or `pop` for a lighter subject.

## punch
Snaps in at nearly full size almost instantly (2-3 frames), then a sharp
squash/stretch settle. Reads as aggressive/urgent.
```jsx
const t = spring({ frame, fps, config: { damping: 7, stiffness: 300 } });
const scaleX = 1 + (1 - t) * -0.15;
const scaleY = 1 + (1 - t) * 0.15;
```
SFX: `pop` or `coin` for a stat/number landing.

## flip
Rotates in on the Y axis (`rotateY`, with `transformPerspective`) from 90deg
to 0. Good for a "reveal" or a quoted/dialogue beat.
```jsx
const rotateY = interpolate(frame, [0, 14], [90, 0], { extrapolateRight: "clamp" });
```
SFX: `swipe`.

## shatter
Cutout enters as 4-6 pre-split fragments (crop the source PNG into pieces,
or fake it with clip-path rectangles) that fly in from different directions
and snap together on impact. Heaviest/most dramatic — good for an ending
or a "breaking point" beat.
SFX: `shatter`.

## peel
Enters like a sticker being peeled and pressed down: starts rotated/lifted
at a corner with a faint shadow gap underneath, settles flat with a quick
bounce.
```jsx
const rotate = interpolate(frame, [0, 16], [-8, 0], { extrapolateRight: "clamp" });
const liftY = interpolate(frame, [0, 16], [-30, 0], { extrapolateRight: "clamp" });
```
SFX: `paper`.

## unfold
Starts scaled to near-zero on one axis only (`scaleY` from 0.1 to 1, like
unfolding a paper flap) then the other axis catches up half a beat later.
SFX: `boing`.

## spiral
Combines a rotation (720deg -> 0) with a scale-up, easing out hard so most
of the spin resolves in the first third of the entrance.
```jsx
const rotate = interpolate(frame, [0, 20], [720, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
const scale = interpolate(frame, [0, 20], [0.3, 1], { extrapolateRight: "clamp" });
```
SFX: `boing` or `whoosh`.

## wobble-drop
Drops in from above with gravity (`interpolate` on a quadratic curve, not
linear), lands, and wobbles side to side a couple times before settling.
SFX: `thud` on landing.

## zoom-through
Starts huge (2.5x+) and slightly blurred, rapidly scales down past 1x with
a touch of overshoot, like the camera is pushing through it. Pairs well as
a hard cut into a new scene.
SFX: `whoosh`.

## strike
For an object with real striking weight (a gavel) — not a generic pop-in.
Swings in from a raised rotation and snaps to rest fast, with a tiny
overshoot recoil right at landing. Pair with a radial impact-flash at the
landing point and a brief camera `shake` timed to the same frame — this
combo (motion + flash + shake, all on the same frame) is what sells it as
an actual hit rather than three unrelated effects.
```jsx
const rotate = interpolate(frame, [0, 9], [-42, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.55, 0, 1, 0.45) });
const scale = interpolate(frame, [8, 9, 13], [1, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
```
SFX: a hard click/thud exactly on the landing frame, not frame 0.

## Continuous motion (exceptional opt-in)
Use continuous motion only when it communicates an ongoing state: nervousness,
hanging/suspended movement, vibration, instability, or another specific event.
Pass `idle` explicitly to an editorial wrapper:
- `sway` — gentle rotation, `sin(frame/22) * 3deg`.
- `tremble` — faster, smaller, less-smooth jitter (nervous energy):
  `sin(frame/4)*1.1 + sin(frame/2.3)*0.6`, degrees.
- `bob` — slow vertical drift instead of rotation (fits a hanging/flag-
  like prop): `sin(frame/18) * 6`, px.

If several justified moving elements share a frame, offset their phase. Keep
amplitude small. `Hero`/`Support` retain their old sway default only for legacy
composition compatibility; they are not the default construction path.

## Camera movement (exceptional opt-in)

The normal camera is stable; `BackgroundPhoto` defaults to `drift=0`. Do not
replace idle cutout wobble with a universal slow zoom. Camera movement belongs
to a semantic event—context → detail, evidence focus, reveal, authority takeover,
or spatial displacement. Existing shipped scenes may retain explicit motion.

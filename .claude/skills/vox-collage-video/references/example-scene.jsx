// Copy this file to src/<VideoName>.jsx, rename the component and the two
// exported constants, and replace SEGMENTS with the real content from the
// shot-list.
//
// Canvas is 1080x1920 @ 30fps (9:16) — this project's default. Only change
// it if the user asked for 16:9.
//
// This template was checked frame-by-frame against 40 consecutive frames
// of the actual reference video (not just a handful of stills), so the
// structural claims in these comments are evidence-based:
//
//   - The grid+grain background is IDENTICAL in tone/pattern across every
//     scene — that's what keeps hard cuts from reading as "new slide"
//     instead of "new shot in the same film." It is NOT literally the same
//     mounted React node throughout the whole video (each scene still owns
//     its own background layer) — what matters is the constants (colors,
//     grid cell size, grain image) never change between scenes, so a cut
//     never shows a visibly different background.
//   - Within a scene, background + hero + supports usually move together
//     as ONE unit under a slow continuous zoom (Ken Burns) — not just the
//     foreground zooming over a frozen background. Some scenes hold
//     perfectly still instead (e.g. a scene that's mostly about elements
//     accumulating rather than camera movement) — zoom is per-scene, not
//     mandatory every time.
//   - Elements accumulate progressively ON one persistent shot (a second
//     portrait appears next to the first one already on screen; a second
//     stat chip appears after the first is already sitting there) rather
//     than each scene showing everything at once from frame 0.
//   - Cuts between distinct scenes are mostly hard cuts (no wipe/dissolve
//     preset) — real Vox-style videos DO cut, that's normal, it's not
//     supposed to be one unbroken unedited shot. One observed exception:
//     an outgoing element can shrink/fade while the incoming one is
//     already appearing (a brief overlap), not a strict instant swap.
//   - There is NO persistent top-left "tag chip" in this specific
//     reference — drop that idea if you inherited it from a different Vox
//     sub-style. The only ALWAYS-present orange element is the thin bar
//     anchoring the bottom of frame. Orange elsewhere is contextual: a
//     stat-chip's icon square, a cutout's drop shadow, a keyword inside a
//     speech bubble.
//   - Full-color graphics (a 3D flag-map illustration, an icon) and small
//     supporting props (safety gear, a tank) stay full color; hero/person
//     real photos get desaturated to plain grayscale — NO halftone
//     dot-screen pattern. That was tried and explicitly rejected on this
//     project; don't reintroduce it without asking first, even if a
//     frame-by-frame check of the reference source suggests it's
//     technically present there — this is a standing product decision.
//   - Direct-quote dialogue gets a comic-style speech bubble (cream fill,
//     black outline, bold text, orange keyword), not a plain caption.

import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["vietnamese", "latin"],
});

export const EXAMPLE_CANVAS = { width: 1080, height: 1920, fps: 30 };
export const EXAMPLE_TOTAL_FRAMES = 360; // = last segment's `end`

const BG = "#E7E3D9";
const GRID_LINE = "rgba(20,20,20,0.07)";
const ORANGE = "#FF6A1A";
const INK = "#141414";
const BUBBLE_CREAM = "#F5F0E4";

// ---------------------------------------------------------------------------
// Segment data. One entry per scene. `start`/`end` are frames (30fps).
// `punch.appearAt` / dialogue `at` / statChip `at` are LOCAL to the scene:
// round(word.start * fps) - start, from the Whisper transcript.
// `zoom` is optional: { from: 1, to: 1.08 } scales background+foreground
// together over the scene's duration. Omit for a static hold.
// Never reuse the same `hero.variant` on two consecutive scenes.
// ---------------------------------------------------------------------------
const SEGMENTS = [
  {
    start: 0,
    end: 180,
    zoom: { from: 1, to: 1.06 },
    hero: { src: "el_hero_1.png", width: 760, x: "50%", y: 420, variant: "rise" },
    supports: [
      { src: "el_support_1a.png", width: 300, x: 60, y: 300, delay: 26, phase: 0 },
      { src: "el_support_1b.png", width: 260, x: 740, y: 1420, delay: 48, phase: 30 },
    ],
    punch: { text: "MỘT CÂU NHẤN", appearAt: 60, top: 110 }, // empty grid space above the hero
    sfx: [
      { name: "whoosh", frame: 0, volume: 0.4 },
      { name: "click", frame: 6, volume: 0.35 },
    ],
  },
  {
    start: 180,
    end: 360,
    // no zoom — static hold while a dialogue beat lands
    hero: { src: "el_hero_2.png", width: 780, x: "50%", y: 460, variant: "grow" },
    supports: [],
    dialogue: [
      { text: "MỘT CÂU THOẠI?", highlight: "THOẠI", side: "left", x: 80, y: 220, at: 20 },
      { text: "ĐÚNG VẬY!", highlight: "ĐÚNG", side: "right", x: 620, y: 260, at: 46 },
    ],
    sfx: [{ name: "thud", frame: 0, volume: 0.45 }],
  },
];

// ---------------------------------------------------------------------------
// Background: pale grid + static grain texture, identical constants every
// scene. `public/grain.png` is a pre-baked static noise tile (generated
// once, not recomputed per frame — the reference's grain doesn't move).
// ---------------------------------------------------------------------------
const SceneBackground = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="grid" width={54} height={54} patternUnits="userSpaceOnUse">
          <path d="M 54 0 L 0 0 0 54" fill="none" stroke={GRID_LINE} strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${staticFile("grain.png")})`,
        backgroundSize: "512px 512px",
        backgroundRepeat: "repeat",
        opacity: 0.18,
        mixBlendMode: "multiply",
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Bold black headline / pull-quote text — the ONE timed punch-phrase per
// scene, not a word-by-word caption bar.
//
// `top` is REQUIRED per-scene (no hardcoded default) — you must look at
// where that scene's hero/supports actually sit and pick empty grid
// space, the way the reference keeps headline text off the photo
// entirely. A fixed y that happens to land on the hero reads as
// illegible — this was caught by rendering a real frame and looking at
// it, not something to assume away.
// ---------------------------------------------------------------------------
const PunchPhrase = ({ text, top, frame, appearAt }) => {
  if (frame < appearAt) return null;
  const local = frame - appearAt;
  const t = spring({ frame: local, fps: 30, config: { damping: 10, stiffness: 140 } });
  const scale = interpolate(t, [0, 1], [0.7, 1]);
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute", left: 56, right: 56, top,
        transform: `scale(${scale})`, transformOrigin: "left top", opacity,
        fontFamily, fontWeight: 900, fontSize: 74, lineHeight: 1.05, color: INK,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icon + big number + label, e.g. "$74 / PER BARREL". Orange icon square.
// ---------------------------------------------------------------------------
const StatChip = ({ icon, value, label, x, y, at, frame }) => {
  if (frame < at) return null;
  const local = frame - at;
  const t = spring({ frame: local, fps: 30, config: { damping: 11, stiffness: 160 } });
  const scale = interpolate(t, [0, 1], [0.5, 1]);
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "left center", opacity, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily, fontWeight: 900, fontSize: 52, color: INK, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: INK, letterSpacing: 1 }}>{label}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comic-style speech bubble for direct-quote dialogue beats. `highlight`
// substring renders in orange within the bubble text.
// ---------------------------------------------------------------------------
const SpeechBubble = ({ text, highlight, side, x, y, at, frame }) => {
  if (frame < at) return null;
  const local = frame - at;
  const t = spring({ frame: local, fps: 30, config: { damping: 9, stiffness: 200 } });
  const scale = interpolate(t, [0, 1], [0.4, 1]);
  const opacity = interpolate(local, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  const parts = highlight ? text.split(highlight) : [text];
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, maxWidth: 380,
        transform: `scale(${scale})`, transformOrigin: side === "left" ? "left bottom" : "right bottom", opacity,
        backgroundColor: BUBBLE_CREAM, border: `3px solid ${INK}`, borderRadius: 22,
        padding: "18px 22px", fontFamily, fontWeight: 700, fontSize: 30, color: INK, lineHeight: 1.15,
      }}
    >
      {parts.length > 1 ? (
        <>
          {parts[0]}
          <span style={{ color: ORANGE }}>{highlight}</span>
          {parts[1]}
        </>
      ) : (
        text
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Entrance variants — starter set. Read animation-variants.md for the full
// palette (shatter/peel/unfold/spiral/wobble-drop/zoom-through) before
// defaulting back to these four on any video with more than 4 scenes.
// ---------------------------------------------------------------------------
const ENTRANCE = {
  rise: (frame, fps) => {
    const t = spring({ frame, fps, config: { damping: 14 } });
    return { transform: `translateY(${interpolate(t, [0, 1], [140, 0])}px)`, opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }) };
  },
  grow: (frame, fps) => {
    const t = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
    return { transform: `scale(${interpolate(t, [0, 1], [0.5, 1])})`, opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) };
  },
  punch: (frame, fps) => {
    const t = spring({ frame, fps, config: { damping: 7, stiffness: 300 } });
    const sx = 1 + (1 - t) * -0.15;
    const sy = 1 + (1 - t) * 0.15;
    return { transform: `scale(${sx}, ${sy})`, opacity: interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" }) };
  },
  flip: (frame, fps) => {
    const r = interpolate(frame, [0, 14], [90, 0], { extrapolateRight: "clamp" });
    return { transform: `perspective(900px) rotateY(${r}deg)`, opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }) };
  },
};

const idleWiggle = (frame, entranceFrames, phase) => {
  if (frame < entranceFrames) return 0;
  return Math.sin((frame - entranceFrames + phase) / 22) * 3;
};

const Cutout = ({ src, width, x, y, variant, frame, fps, phase = 0 }) => {
  const entrance = (ENTRANCE[variant] || ENTRANCE.rise)(frame, fps);
  const idleDeg = idleWiggle(frame, 16, phase);
  const left = typeof x === "string" ? x : `${x}px`;
  const marginLeft = x === "50%" ? -width / 2 : 0;
  return (
    <div style={{ position: "absolute", left, top: y, width, marginLeft, ...entrance }}>
      <div style={{ transform: `rotate(${idleDeg}deg)` }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  );
};

const SupportElement = ({ src, width, x, y, delay, phase, frame, fps }) => {
  const local = frame - delay;
  if (local < 0) return null;
  const t = spring({ frame: local, fps, config: { damping: 12 } });
  const scale = interpolate(t, [0, 1], [0.4, 1]);
  const opacity = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const idleDeg = idleWiggle(local, 10, phase);
  return (
    <div style={{ position: "absolute", left: x, top: y, width, transform: `scale(${scale})`, opacity }}>
      <div style={{ transform: `rotate(${idleDeg}deg)` }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SFX — place each at the actual beat it belongs to, not bunched at frame
// 0. Keep volumes 0.3-0.55.
// ---------------------------------------------------------------------------
const Sfx = ({ name, frame, volume = 0.4 }) => (
  <Sequence from={frame}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

const Scene = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomScale = segment.zoom
    ? interpolate(frame, [0, segment.end - segment.start], [segment.zoom.from, segment.zoom.to], { extrapolateRight: "clamp" })
    : 1;

  return (
    <AbsoluteFill>
      {/* Background + hero + supports move together under one camera —
          matches the reference's "one continuous shot per scene" feel. */}
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoomScale})`, transformOrigin: "50% 50%" }}>
        <SceneBackground />
        <Cutout {...segment.hero} frame={frame} fps={fps} />
        {segment.supports.map((s, i) => (
          <SupportElement key={i} {...s} frame={frame} fps={fps} />
        ))}
      </div>

      {/* Bottom orange bar — the one always-present orange element,
          outside the zoom group so it stays pinned to the true frame edge. */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 26, backgroundColor: ORANGE }} />

      {/* Text/UI overlays sit outside the zoom group too. */}
      {segment.punch && <PunchPhrase text={segment.punch.text} appearAt={segment.punch.appearAt} top={segment.punch.top} frame={frame} />}
      {(segment.dialogue || []).map((d, i) => (
        <SpeechBubble key={i} {...d} frame={frame} />
      ))}
      {(segment.statChips || []).map((s, i) => (
        <StatChip key={i} {...s} frame={frame} />
      ))}

      {(segment.sfx || []).map((s, i) => (
        <Sfx key={i} {...s} />
      ))}
    </AbsoluteFill>
  );
};

export const ExampleVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Audio src={staticFile("audio.wav")} />
      {SEGMENTS.map((seg, i) => (
        <Sequence key={i} from={seg.start} durationInFrames={seg.end - seg.start}>
          <Scene segment={seg} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

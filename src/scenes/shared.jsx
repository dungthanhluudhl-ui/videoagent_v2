import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Interactive,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import * as sfx from "@remotion/sfx";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { CAPTION_LINES } from "../captionData";

export const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
  subsets: ["vietnamese", "latin"],
});

export const BG = "#E7E3D9";
export const GRID_LINE = "rgba(20,20,20,0.32)";
export const ORANGE = "#FF6A1A";
export const INK = "#141414";
export const BUBBLE_CREAM = "#F5F0E4";

// Excluded placement band for Hero/Support/PunchPhrase/etc, in px from each
// edge of the 1080x1920 canvas - top reserves space for a social app's
// profile/follow UI, bottom matches Captions' already-established safe
// zone (bottom: 440, "~1/3 from bottom for TikTok/Reels/Shorts UI").
// Consumed by check_overlap.py's --safe-zone flag (see SKILL.md step 6);
// keep both in sync if this ever changes.
export const SAFE_ZONE = { top: 160, bottom: 460, left: 40, right: 40 };

// Background: pale grid + static grain by default. Lives INSIDE the
// CameraGroup zoom wrapper (it should scale together with the hero, per
// the reference). `variant` swaps the backdrop TREATMENT per scene so
// adjacent scenes don't all read as the identical frame - "grid" (default,
// unchanged from before this prop existed) for a standard collage scene,
// "chart" replaces the fine grid with bold ruled horizontal lines + left-
// edge tick marks suited to a data/trend scene, "card" drops the grid for
// a solid paper tone suited to a headline/quote scene, "spotlight" adds a
// dark radial vignette suited to a warning/consequence beat. Pick
// deliberately per scene (SKILL.md step 2b) - don't leave every scene on
// the default. The fine-grid variant's line opacity (0.32) was tuned to be
// clearly visible up close - a first "chart" pass at 0.14 opacity FAINT
// lines rendered essentially invisible in an actual still (caught by
// rendering and cropping one, not by eye on the code) - bold lines here
// intentionally match that same visible-up-close bar, not a token nod.
export const SceneBackground = ({ variant = "grid" }) => (
  <AbsoluteFill name="Background" style={{ backgroundColor: variant === "card" ? BUBBLE_CREAM : BG }}>
    {variant === "grid" && (
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="grid" width={84} height={84} patternUnits="userSpaceOnUse">
            <path d="M 84 0 L 0 0 0 84" fill="none" stroke={GRID_LINE} strokeWidth={1.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    )}
    {variant === "chart" && (
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
          <g key={i}>
            <line x1="0" y1={`${f * 100}%`} x2="100%" y2={`${f * 100}%`} stroke={INK} strokeWidth={1.5} opacity={0.16} />
            <line x1="0" y1={`${f * 100}%`} x2="24" y2={`${f * 100}%`} stroke={ORANGE} strokeWidth={4} opacity={0.55} />
          </g>
        ))}
        <line x1="24" y1="0" x2="24" y2="100%" stroke={ORANGE} strokeWidth={3} opacity={0.4} />
      </svg>
    )}
    {variant === "spotlight" && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgba(20,20,20,0) 35%, rgba(20,20,20,0.28) 100%)",
        }}
      />
    )}
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

// The one always-present orange element. Render OUTSIDE CameraGroup (a
// sibling, not a child) so it stays pinned to the true frame edge instead
// of being scaled/pushed out of frame by the zoom.
export const BottomBar = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 26, backgroundColor: ORANGE }} />
);

// Wraps background + foreground together under one continuous camera move
// per scene (zoom and/or pan), matching the reference's "one continuous
// shot" feel. `shake` adds a brief decaying jitter at a specific frame
// (e.g. a gavel strike landing, or a beat's word-anchored entrance) —
// {at, len, mag}, OR an array of those for several punctuation points in
// one scene (e.g. one small jolt per beat_sync.py anchor) — overlapping
// windows sum their offsets rather than one replacing another.
export const CameraGroup = ({ zoom, pan, shake, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const scale = zoom
    ? interpolate(frame, [0, durationInFrames], [zoom.from, zoom.to], { extrapolateRight: "clamp" })
    : 1;
  const panX = pan ? interpolate(frame, [0, durationInFrames], [pan.from.x, pan.to.x], { extrapolateRight: "clamp" }) : 0;
  const panY = pan ? interpolate(frame, [0, durationInFrames], [pan.from.y, pan.to.y], { extrapolateRight: "clamp" }) : 0;
  let shakeX = 0;
  let shakeY = 0;
  const shakes = shake ? (Array.isArray(shake) ? shake : [shake]) : [];
  for (const s of shakes) {
    const t = frame - s.at;
    if (t >= 0 && t < s.len) {
      const decay = 1 - t / s.len;
      shakeX += Math.sin(t * 3.2) * s.mag * decay;
      shakeY += Math.cos(t * 2.6) * s.mag * decay;
    }
  }
  return (
    <div style={{ position: "absolute", inset: 0, scale, translate: `${panX + shakeX}px ${panY + shakeY}px`, transformOrigin: "50% 50%" }}>
      {children}
    </div>
  );
};

// Secondary "alive" motion while an element holds on screen — separate
// from the entrance. `sway` is the default gentle rotation; `tremble` is a
// faster, smaller, less-smooth jitter (anxious energy); `bob` is a slow
// vertical drift (for flag/hanging-style props) instead of rotation.
const idleMotion = (frame, phase, mode) => {
  switch (mode) {
    case "tremble":
      return { rot: Math.sin((frame + phase) / 4) * 1.1 + Math.sin((frame + phase) / 2.3) * 0.6, ty: 0 };
    case "bob":
      return { rot: 0, ty: Math.sin((frame + phase) / 18) * 6 };
    default:
      return { rot: Math.sin((frame + phase) / 22) * 3, ty: 0 };
  }
};

// Hero cutout. Mount this inside a <Sequence from={entranceFrame}> so
// `useCurrentFrame()` here is already local to its own entrance.
// `visibleFor` (in local frames) triggers a fade+shrink exit starting
// `exitLen` frames before it — pass the scene's own *_DURATION constant so
// the hero settles out cleanly before the cut instead of vanishing.
export const Hero = ({ name, src, width, x, y, variant = "rise", phase = 0, idle = "sway", visibleFor, exitLen = 12 }) => {
  const frame = useCurrentFrame();
  const { rot: idleRot, ty: idleTy } = idleMotion(Math.max(0, frame - 16), phase, idle);
  const left = typeof x === "string" ? x : `${x}px`;
  // Center element horizontally around x coordinate whenever x is specified as percentage or x === "50%"
  const marginLeft = (typeof x === "string" && x.endsWith("%")) || x === "50%" ? -width / 2 : 0;

  let ty = 0;
  let sc = 1;
  let rot = 0;
  let op = 1;

  switch (variant) {
    case "rise":
      ty = interpolate(frame, [0, 16], [140, 0], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 14 }) });
      op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "grow":
      sc = interpolate(frame, [0, 16], [0.5, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 10, stiffness: 120 }), output: "perceptual-scale" });
      op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "punch":
      sc = interpolate(frame, [0, 10], [0.4, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 7, stiffness: 300 }), output: "perceptual-scale" });
      op = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "flip":
      rot = interpolate(frame, [0, 16], [90, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
      op = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "dropSpin":
      ty = interpolate(frame, [0, 18], [-260, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
      rot = interpolate(frame, [0, 18], [-16, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
      op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
      break;
    case "strike":
      // Swung down from a raised angle and snaps to rest — a real "hit",
      // not a generic pop-in. Pair with <ImpactFlash> + CameraGroup
      // `shake` timed to the same landing frame (STRIKE_LANDING_FRAME).
      rot = interpolate(frame, [0, 9], [-42, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.55, 0, 1, 0.45) });
      sc = interpolate(frame, [8, 9, 13], [1, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad), output: "perceptual-scale" });
      op = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
      break;
    default:
      break;
  }

  if (visibleFor) {
    const exitOp = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 1, 1) });
    const exitSc = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0.88], { extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale" });
    op *= exitOp;
    sc *= exitSc;
  }

  return (
    <Interactive.Div
      name={name}
      style={{ position: "absolute", left, top: y, width, marginLeft, opacity: op, scale: sc, translate: `0px ${ty + idleTy}px`, rotate: `${rot}deg` }}
    >
      <div style={{ rotate: `${idleRot}deg` }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </Interactive.Div>
  );
};

// Support cutout — same idea as Hero but a simpler pop-in, meant to be
// mounted inside its own <Sequence from={delay}>.
export const Support = ({ name, src, width, x, y, phase = 0, idle = "sway", visibleFor, exitLen = 10 }) => {
  const frame = useCurrentFrame();
  const { rot: idleRot, ty: idleTy } = idleMotion(Math.max(0, frame - 10), phase, idle);
  const left = typeof x === "string" ? x : `${x}px`;
  // Same percentage-centering fix as Hero (see SKILL.md's "got wrong" list)
  // — Support never had it, just never got exercised with a "%" x so far.
  const marginLeft = (typeof x === "string" && x.endsWith("%")) || x === "50%" ? -width / 2 : 0;
  let sc = interpolate(frame, [0, 14], [0.4, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 12 }), output: "perceptual-scale" });
  let op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  if (visibleFor) {
    const exitOp = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 1, 1) });
    const exitSc = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0.88], { extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale" });
    op *= exitOp;
    sc *= exitSc;
  }

  return (
    <Interactive.Div name={name} style={{ position: "absolute", left, top: y, width, marginLeft, scale: sc, opacity: op, translate: `0px ${idleTy}px` }}>
      <div style={{ rotate: `${idleRot}deg` }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </Interactive.Div>
  );
};

// A horizontal string that sags loosely at first and pulls taut (with a
// vibrating "twang" once `vibrateFrom` is reached) as more weight attaches
// to it over time - built to render a specific `visualTransformation`
// LITERALLY (V6Scene4's "căng như dây đàn" - taut as a guitar string) with
// real accumulation, instead of illustrating a causal-chain scene the same
// way as every other scene (icons popping into the same two fixed corner
// slots, one replacing the last). `landedAt` is the ascending list of
// frames at which each attached item lands - the string measurably tightens
// at each one instead of on a generic timer.
export const TensionString = ({ x1 = 100, x2 = 980, y = 1250, landedAt = [], vibrateFrom, color = ORANGE }) => {
  const frame = useCurrentFrame();
  const n = landedAt.length || 1;
  const startSag = 110;
  const endSag = 8;
  const keyframes = [landedAt[0] !== undefined ? landedAt[0] - 20 : 0, ...landedAt];
  const sagLevels = keyframes.map((_, i) => startSag - (i / n) * (startSag - endSag));
  let sag = interpolate(frame, keyframes, sagLevels, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (vibrateFrom !== undefined && frame >= vibrateFrom) {
    const amt = interpolate(frame, [vibrateFrom, vibrateFrom + 40], [1, 0.3], { extrapolateRight: "clamp" });
    sag += Math.sin(frame * 3.4) * 6 * amt;
  }
  const midX = (x1 + x2) / 2;
  const d = `M ${x1},${y} Q ${midX},${y + sag} ${x2},${y}`;
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width="100%" height="100%">
      <path d={d} fill="none" stroke={color} strokeWidth={5} opacity={0.75} strokeLinecap="round" />
      <circle cx={x1} cy={y} r={7} fill={color} opacity={0.75} />
      <circle cx={x2} cy={y} r={7} fill={color} opacity={0.75} />
    </svg>
  );
};

// A brief radial orange flash — punctuation for an impact moment (a gavel
// strike, a hard landing). Mount as a sibling positioned at the impact
// point, in a <Sequence from={impactFrame}> (or pass `delay` directly).
export const ImpactFlash = ({ x, y, delay = 0, size = 130 }) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  if (local < 0 || local > 16) return null;
  const op = interpolate(local, [0, 3, 16], [0, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sc = interpolate(local, [0, 16], [0.3, 2.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad), output: "perceptual-scale" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ORANGE}, rgba(255,106,26,0) 70%)`,
        opacity: op,
        scale: sc,
        pointerEvents: "none",
      }}
    />
  );
};

// A curved orange arrow that draws itself on, connecting two elements to
// visualize a cause-and-effect chain (e.g. verdict -> deal -> consequence).
// `d` is a plain SVG path; `length` should be a generous overestimate of
// the path's real length (dash-offset reveal is forgiving of that).
export const FlowArrow = ({ d, delay = 0, length = 700, drawFrames = 22 }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const markerId = `flowArrowHead-${delay}`;
  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width="100%" height="100%">
      <defs>
        <marker id={markerId} markerWidth={10} markerHeight={10} refX={6} refY={5} orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill={ORANGE} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={ORANGE}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        markerEnd={progress > 0.05 ? `url(#${markerId})` : undefined}
      />
    </svg>
  );
};

// A single light-sweep across an element's own silhouette (uses the
// element's own PNG alpha as a CSS mask, so the shine only shows over
// real content, not its transparent bounding box). Mount as a sibling
// directly on top of the matching <Support>, same width/x/y.
export const Shimmer = ({ src, width, x, y, delay = 0 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 22], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mask = `url(${staticFile(src)})`;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        aspectRatio: "auto",
        height: "auto",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          display: "block",
          visibility: "hidden",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          background: `linear-gradient(75deg, transparent ${t - 18}%, rgba(255,255,255,0.85) ${t}%, transparent ${t + 18}%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// Bold black headline / pull-quote — the ONE timed punch-phrase per scene.
// Bold black headline / pull-quote — the ONE timed punch-phrase per scene.
// Mount inside <Sequence from={appearAt}>. `top` must be chosen per-scene
// to land on empty grid space, not over the hero. `stagger` reveals it
// word-by-word (kinetic typography) instead of the whole block popping in
// at once. Supports explicit `lines` array or `\n` to prevent orphan words on new lines.
// `onDark` flips the headline to light type with a soft shadow, for scenes
// built on a BackgroundPhoto instead of pale paper. Without it the default
// INK (#141414) headline is invisible against a darkened photo - caught by
// rendering a still of the first BackgroundPhoto demo and finding the
// headline had effectively vanished into the crowd behind it.
export const PunchPhrase = ({ text, lines, top = 120, stagger = false, fontSize = 70, lineHeight = 1.22, onDark = false }) => {
  const frame = useCurrentFrame();
  const rawLines = lines || (typeof text === "string" ? text.split("\n") : [text]);
  const inkColor = onDark ? "#F7F4EC" : INK;
  const textShadow = onDark ? "0 3px 18px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)" : undefined;

  // Smart line-breaker: if any line > 15 chars, balance into multi-lines
  let finalLines = [];
  rawLines.forEach((l) => {
    if (l && l.length > 15) {
      const words = l.split(" ");
      if (words.length >= 3) {
        const mid = Math.ceil(words.length / 2);
        finalLines.push(words.slice(0, mid).join(" "));
        finalLines.push(words.slice(mid).join(" "));
      } else {
        finalLines.push(l);
      }
    } else if (l) {
      finalLines.push(l);
    }
  });

  // Dynamically auto-scale fontSize if any line is long so it fits within 920px width
  const maxCharCount = Math.max(...finalLines.map((l) => l.length), 1);
  const effectiveFontSize = maxCharCount > 12 ? Math.min(fontSize, Math.floor(920 / (maxCharCount * 0.62))) : fontSize;

  if (!stagger) {
    return (
      <Interactive.Div
        name="PunchPhrase"
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top,
          transformOrigin: "left top",
          scale: interpolate(frame, [0, 10], [0.7, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 10, stiffness: 140 }), output: "perceptual-scale" }),
          opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily,
          fontWeight: 900,
          fontSize: effectiveFontSize,
          lineHeight,
          color: inkColor,
          textShadow,
        }}
      >
        {finalLines.map((lineStr, lineIdx) => (
          <div key={lineIdx} style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{lineStr}</div>
        ))}
      </Interactive.Div>
    );
  }

  let globalWordIndex = 0;
  return (
    <Interactive.Div
      name="PunchPhrase"
      style={{ position: "absolute", left: 56, right: 56, top, fontFamily, fontWeight: 900, fontSize: effectiveFontSize, lineHeight, color: inkColor, textShadow }}
    >
      {finalLines.map((lineStr, lineIdx) => {
        const lineWords = lineStr.split(" ");
        return (
          <div key={lineIdx} style={{ display: "flex", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
            {lineWords.map((w, wIdx) => {
              const currentIdx = globalWordIndex++;
              const lf = frame - currentIdx * 4;
              const op = interpolate(lf, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const ty = interpolate(lf, [0, 9], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 12 }) });
              return (
                <span key={wIdx} style={{ display: "inline-block", opacity: op, translate: `0px ${ty}px`, marginRight: "0.28em" }}>
                  {w}
                </span>
              );
            })}
          </div>
        );
      })}
    </Interactive.Div>
  );
};

// Comic-style speech bubble for direct-quote dialogue. `highlight`
// substring renders in orange within the bubble text. `stagger` reveals
// the text word-by-word instead of the whole bubble text at once.
export const SpeechBubble = ({ text, highlight, side, x, y, stagger = false }) => {
  const frame = useCurrentFrame();
  const parts = highlight ? text.split(highlight) : [text];

  const bubbleStyle = {
    position: "absolute",
    left: x,
    top: y,
    maxWidth: 620,
    transformOrigin: side === "left" ? "left bottom" : "right bottom",
    scale: interpolate(frame, [0, 8], [0.4, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 9, stiffness: 200 }), output: "perceptual-scale" }),
    opacity: interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" }),
    backgroundColor: BUBBLE_CREAM,
    border: `3px solid ${INK}`,
    borderRadius: 22,
    padding: "18px 22px",
    fontFamily,
    fontWeight: 700,
    fontSize: 44,
    color: INK,
    lineHeight: 1.15,
  };

  if (!stagger) {
    return (
      <Interactive.Div name="SpeechBubble" style={bubbleStyle}>
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span style={{ color: ORANGE }}>{highlight}</span>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </Interactive.Div>
    );
  }

  const words = text.split(" ");
  return (
    <Interactive.Div name="SpeechBubble" style={bubbleStyle}>
      {words.map((w, i) => {
        const lf = frame - 6 - i * 5;
        const op = interpolate(lf, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const ty = interpolate(lf, [0, 7], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 11 }) });
        const isHighlight = highlight && w.replace(/[?.,!]/g, "") === highlight;
        return (
          <span key={i} style={{ display: "inline-block", opacity: op, translate: `0px ${ty}px`, marginRight: "0.3em", color: isHighlight ? ORANGE : INK }}>
            {w}
          </span>
        );
      })}
    </Interactive.Div>
  );
};

// Official-hosted SFX URLs (from the @remotion/sfx package — it exports
// plain URL string constants, NOT an <Audio> component, despite what the
// remotion-dev/skills `sfx.md` example shows; verified against the
// installed package's actual dist output). Play them with remotion's own
// <Audio>. Mount inside <Sequence from={frame}>.
export const SFX_URL = {
  whoosh: sfx.whoosh,
  whip: sfx.whip,
  pageTurn: sfx.pageTurn,
  switchClick: sfx.uiSwitch,
  mouseClick: sfx.mouseClick,
  shutterModern: sfx.shutterModern,
  shutterOld: sfx.shutterOld,
  ding: sfx.ding,
};

export const Sfx = ({ name, volume = 0.4 }) => <Audio src={SFX_URL[name]} volume={volume} />;

// Burned-in word-synced captions, matched to the Whisper timestamps (see
// captionData.js). Mount ONCE at the master-composition level, as a
// sibling AFTER the TransitionSeries — using absolute frame numbers
// (not scene-local), so it keeps reading correctly straight through
// scene cuts/transitions instead of fading or resetting with them.
// Set to bottom: 440 (safe zone ~1/3 from bottom for TikTok/Reels/Shorts UI).
export const Captions = () => {
  const frame = useCurrentFrame();
  const line = CAPTION_LINES.find((l) => frame >= l[0].startFrame - 2 && frame <= l[l.length - 1].endFrame + 5);
  if (!line) return null;
  const op = interpolate(frame, [line[0].startFrame - 2, line[0].startFrame + 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 440, display: "flex", justifyContent: "center", opacity: op, zIndex: 100 }}>
      <div
        style={{
          background: "rgba(10,10,10,0.8)",
          borderRadius: 14,
          padding: "12px 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.32em",
          maxWidth: "100%",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        }}
      >
        {line.map((w, i) => {
          const isActive = frame >= w.startFrame && frame <= w.endFrame + 2;
          const isPast = frame > w.endFrame + 2;
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 700,
                fontSize: 40,
                lineHeight: 1.25,
                color: isActive ? ORANGE : "#FFFFFF",
                opacity: isPast ? 0.6 : 1,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Large animated stat counter (e.g. 0 -> 18.000 or 0 -> 100.000.000) with glowing badge
export const StatCounter = ({
  fromValue = 0,
  toValue = 18000,
  prefix = "",
  suffix = "",
  label = "",
  top = 120,
  delay = 0,
  duration = 30,
  fontSize = 80,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const currentRaw = interpolate(local, [0, duration], [fromValue, toValue], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const currentFormatted = Math.round(currentRaw).toLocaleString("vi-VN");
  const scale = interpolate(local, [0, 10], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10, stiffness: 140 }),
    output: "perceptual-scale",
  });
  const opacity = interpolate(local, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="StatCounter"
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        scale,
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: INK,
          color: BG,
          borderRadius: 16,
          padding: "10px 26px",
          fontFamily,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.1,
          boxShadow: `0 8px 24px ${ORANGE}66`,
          border: `3px solid ${ORANGE}`,
        }}
      >
        <span style={{ color: ORANGE }}>{prefix}</span>
        {currentFormatted}
        <span style={{ color: ORANGE }}>{suffix}</span>
      </div>
      {label && (
        <div
          style={{
            fontFamily,
            fontWeight: 700,
            fontSize: 34,
            color: INK,
            marginTop: 8,
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </div>
      )}
    </Interactive.Div>
  );
};

// Progressively-drawn trend line chart (axis + polyline reveal via
// strokeDashoffset, same draw-on technique FlowArrow already uses) with an
// end-value badge landing once the line finishes drawing. Distinct from
// StatCounter: that ticks ONE number up, this shows a curve/trend across
// several points - use when the narration describes a value climbing,
// falling, or being compared across steps (e.g. lãi suất escalating),
// not as a default for every scene.
export const AnimatedLineChart = ({
  values,
  labels,
  x = 80,
  y = 400,
  width = 640,
  height = 280,
  delay = 0,
  drawFrames = 40,
  color = ORANGE,
  endPrefix = "",
  endSuffix = "",
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const progress = interpolate(local, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - ((v - min) / span) * height,
  ]);
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`).join(" ");
  const pathLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const [px0, py0] = points[i - 1];
    return acc + Math.hypot(p[0] - px0, p[1] - py0);
  }, 0);

  const badgeOpacity = interpolate(progress, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeScale = interpolate(progress, [0.85, 1], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 9, stiffness: 200 }),
    output: "perceptual-scale",
  });
  const lastPoint = points[points.length - 1];

  return (
    <div style={{ position: "absolute", left: x, top: y, width, height }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <line x1={0} y1={height} x2={width} y2={height} stroke={INK} strokeWidth={2} opacity={0.3} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
        />
        {labels &&
          labels.map((l, i) => (
            <text
              key={i}
              x={points[i][0]}
              y={height + 28}
              fontFamily={fontFamily}
              fontWeight={700}
              fontSize={22}
              fill={INK}
              textAnchor="middle"
              opacity={0.6}
            >
              {l}
            </text>
          ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: lastPoint[0],
          top: lastPoint[1],
          translate: "-50% -140%",
          opacity: badgeOpacity,
          scale: badgeScale,
          backgroundColor: INK,
          color: BG,
          borderRadius: 12,
          padding: "6px 16px",
          fontFamily,
          fontWeight: 900,
          fontSize: 36,
          whiteSpace: "nowrap",
          border: `3px solid ${color}`,
          boxShadow: `0 6px 18px ${color}55`,
        }}
      >
        {endPrefix}
        {values[values.length - 1].toLocaleString("vi-VN")}
        {endSuffix}
      </div>
    </div>
  );
};

// Newspaper / Document spotlight cutout with animated orange highlighter stroke overlay
export const NewspaperSpotlight = ({
  src,
  width = 680,
  x = "50%",
  y = 350,
  delay = 10,
  rot = -3,
  highlightBox = { x: "15%", y: "42%", w: "70%", h: "12%" },
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const progress = interpolate(local, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const left = typeof x === "string" ? x : `${x}px`;
  const marginLeft = (typeof x === "string" && x.endsWith("%")) || x === "50%" ? -width / 2 : 0;

  return (
    <Interactive.Div
      name="NewspaperSpotlight"
      style={{
        position: "absolute",
        left,
        top: y,
        width,
        marginLeft,
        boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#F9F6F0",
        border: `2px solid rgba(20,20,20,0.15)`,
        rotate: `${rot}deg`,
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />

      {/* Animated Orange Highlighter Stroke */}
      <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        width="100%"
        height="100%"
      >
        <rect
          x={highlightBox.x}
          y={highlightBox.y}
          width={`calc(${highlightBox.w} * ${progress})`}
          height={highlightBox.h}
          fill={ORANGE}
          opacity={0.48}
          rx={4}
          style={{ mixBlendMode: "multiply" }}
        />
      </svg>
    </Interactive.Div>
  );
};

// Vintage Cream Quote Dialogue Card with word-by-word stagger & orange highlight
export const SpeechBubbleQuote = ({
  text = "Liệu nghề luật sư có giàu như đồn?",
  highlight = "giàu",
  top = 150,
  delay = 10,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const local = Math.max(0, frame - delay);
  const scale = interpolate(local, [0, 10], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10, stiffness: 140 }),
    output: "perceptual-scale",
  });
  const opacity = interpolate(local, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Interactive.Div
      name="SpeechBubbleQuote"
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top,
        backgroundColor: BUBBLE_CREAM,
        border: `3px solid ${INK}`,
        borderRadius: 20,
        padding: "20px 32px",
        boxShadow: `0 10px 30px rgba(0,0,0,0.18)`,
        scale,
        opacity,
      }}
    >
      <div style={{ fontFamily, fontWeight: 900, fontSize: 44, lineHeight: 1.3, color: INK }}>
        {words.map((w, i) => {
          const lf = local - 4 - i * 4;
          const wOp = interpolate(lf, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const wTy = interpolate(lf, [0, 7], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 11 }) });
          const isHL = highlight && w.toLowerCase().includes(highlight.toLowerCase());
          return (
            <span key={i} style={{ display: "inline-block", opacity: wOp, translate: `0px ${wTy}px`, marginRight: "0.28em", color: isHL ? ORANGE : INK }}>
              {w}
            </span>
          );
        })}
      </div>
    </Interactive.Div>
  );
};

// Vintage Ink Stamp (e.g. "ĐÃ THẨM ĐỊNH" / "CONFIDENTIAL") with spring slam landing
export const DocumentStamp = ({
  text = "ĐÃ THẨM ĐỊNH",
  color = "#D9381E",
  x = "65%",
  y = 380,
  delay = 15,
  rot = -12,
  size = 42,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const scale = interpolate(local, [0, 6, 12], [2.2, 0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    output: "perceptual-scale",
  });
  const opacity = interpolate(local, [0, 4], [0, 0.92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const left = typeof x === "string" ? x : `${x}px`;

  return (
    <Interactive.Div
      name="DocumentStamp"
      style={{
        position: "absolute",
        left,
        top: y,
        marginLeft: -140,
        scale,
        opacity,
        rotate: `${rot}deg`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          border: `5px solid ${color}`,
          borderRadius: 14,
          padding: "8px 24px",
          color,
          fontFamily,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backgroundColor: `${color}18`,
          boxShadow: `0 0 20px ${color}35`,
        }}
      >
        {text}
      </div>
    </Interactive.Div>
  );
};

// Minimalist Geographic Location Pin with Pulsing Radar Ripple
export const VoxMapPin = ({
  locationName = "VIỆT NAM",
  x = "50%",
  y = 500,
  delay = 10,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const scale = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 10, stiffness: 160 }),
    output: "perceptual-scale",
  });
  const rippleSc = interpolate(local % 30, [0, 30], [1, 2.6], { extrapolateRight: "clamp" });
  const rippleOp = interpolate(local % 30, [0, 30], [0.85, 0], { extrapolateRight: "clamp" });

  const left = typeof x === "string" ? x : `${x}px`;
  const marginLeft = (typeof x === "string" && x.endsWith("%")) || x === "50%" ? 0 : 0;

  return (
    <Interactive.Div
      name="VoxMapPin"
      style={{
        position: "absolute",
        left,
        top: y,
        marginLeft,
        scale,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        translate: "-50% -100%",
      }}
    >
      {/* Location Badge */}
      <div
        style={{
          backgroundColor: INK,
          color: ORANGE,
          fontFamily,
          fontWeight: 900,
          fontSize: 30,
          padding: "8px 22px",
          borderRadius: 24,
          border: `3px solid ${ORANGE}`,
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        📍 {locationName}
      </div>
      {/* Pin Needle Dot & Radar Ripple */}
      <div style={{ position: "relative", marginTop: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 28, height: 28, borderRadius: "50%", border: `3px solid ${ORANGE}`, scale: rippleSc, opacity: rippleOp }} />
        <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: ORANGE, boxShadow: `0 0 14px ${ORANGE}` }} />
      </div>
    </Interactive.Div>
  );
};

export { Sequence };

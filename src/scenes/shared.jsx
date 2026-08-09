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

// Background: pale grid + static grain, identical every scene. Lives
// INSIDE the CameraGroup zoom wrapper (it should scale together with the
// hero, per the reference).
export const SceneBackground = () => (
  <AbsoluteFill name="Background" style={{ backgroundColor: BG }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="grid" width={84} height={84} patternUnits="userSpaceOnUse">
          <path d="M 84 0 L 0 0 0 84" fill="none" stroke={GRID_LINE} strokeWidth={1.5} />
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

// The one always-present orange element. Render OUTSIDE CameraGroup (a
// sibling, not a child) so it stays pinned to the true frame edge instead
// of being scaled/pushed out of frame by the zoom.
export const BottomBar = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 26, backgroundColor: ORANGE }} />
);

// Wraps background + foreground together under one continuous camera move
// per scene (zoom and/or pan), matching the reference's "one continuous
// shot" feel. `shake` adds a brief decaying jitter at a specific frame
// (e.g. a gavel strike landing) — {at, len, mag}.
export const CameraGroup = ({ zoom, pan, shake, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const scale = zoom
    ? interpolate(frame, [0, durationInFrames], [zoom.from, zoom.to], { extrapolateRight: "clamp" })
    : 1;
  const panX = pan ? interpolate(frame, [0, durationInFrames], [pan.from.x, pan.to.x], { extrapolateRight: "clamp" }) : 0;
  const panY = pan ? interpolate(frame, [0, durationInFrames], [pan.from.y, pan.to.y], { extrapolateRight: "clamp" }) : 0;
  let shakeX = 0;
  let shakeY = 0;
  if (shake) {
    const t = frame - shake.at;
    if (t >= 0 && t < shake.len) {
      const decay = 1 - t / shake.len;
      shakeX = Math.sin(t * 3.2) * shake.mag * decay;
      shakeY = Math.cos(t * 2.6) * shake.mag * decay;
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
  const marginLeft = x === "50%" ? -width / 2 : 0;

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
  let sc = interpolate(frame, [0, 14], [0.4, 1], { extrapolateRight: "clamp", easing: Easing.spring({ damping: 12 }), output: "perceptual-scale" });
  let op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  if (visibleFor) {
    const exitOp = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 1, 1) });
    const exitSc = interpolate(frame, [visibleFor - exitLen, visibleFor], [1, 0.88], { extrapolateLeft: "clamp", extrapolateRight: "clamp", output: "perceptual-scale" });
    op *= exitOp;
    sc *= exitSc;
  }

  return (
    <Interactive.Div name={name} style={{ position: "absolute", left: x, top: y, width, scale: sc, opacity: op, translate: `0px ${idleTy}px` }}>
      <div style={{ rotate: `${idleRot}deg` }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
    </Interactive.Div>
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
// Mount inside <Sequence from={appearAt}>. `top` must be chosen per-scene
// to land on empty grid space, not over the hero. `stagger` reveals it
// word-by-word (kinetic typography) instead of the whole block popping in
// at once. Supports explicit `lines` array or `\n` to prevent orphan words on new lines.
export const PunchPhrase = ({ text, lines, top = 120, stagger = false, fontSize = 70, lineHeight = 1.22 }) => {
  const frame = useCurrentFrame();
  const phraseLines = lines || (typeof text === "string" ? text.split("\n") : [text]);

  let finalLines = phraseLines;
  if (!lines && phraseLines.length === 1 && typeof text === "string") {
    const words = text.split(" ");
    if (words.length >= 4) {
      const mid = Math.ceil(words.length / 2);
      finalLines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
    }
  }

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
          fontSize,
          lineHeight,
          color: INK,
        }}
      >
        {finalLines.map((lineStr, lineIdx) => (
          <div key={lineIdx}>{lineStr}</div>
        ))}
      </Interactive.Div>
    );
  }

  let globalWordIndex = 0;
  return (
    <Interactive.Div
      name="PunchPhrase"
      style={{ position: "absolute", left: 56, right: 56, top, fontFamily, fontWeight: 900, fontSize, lineHeight, color: INK }}
    >
      {finalLines.map((lineStr, lineIdx) => {
        const lineWords = lineStr.split(" ");
        return (
          <div key={lineIdx} style={{ display: "block" }}>
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

export { Sequence };

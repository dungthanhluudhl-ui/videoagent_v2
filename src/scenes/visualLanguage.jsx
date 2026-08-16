/**
 * Visual-language primitives beyond the cutout collage.
 *
 * Why this file exists: every scene of V10 was built as "a background-removed
 * cutout floating on pale grid paper", because that was the only visual
 * language the pipeline actually described how to build. Content that isn't a
 * concrete object - a place, a date range, a physical layout, a mood - got
 * forced through the same mould and came out as a small object stranded in
 * white space. Measured after the fact: the worst scenes filled 3.8%-11.2% of
 * the usable frame.
 *
 * These primitives give the other languages a real implementation, so
 * `visualLanguage` in the scene plan is a genuine choice rather than a label
 * on one technique. They deliberately reuse the established palette
 * (BG / INK / ORANGE / grain) so a video can mix languages scene to scene
 * without looking like two different videos.
 *
 * See references/visual-language.md for which language fits which content.
 */

import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fitText, measureText } from "@remotion/layout-utils";
import { BG, INK, ORANGE, fontFamily } from "./shared";

/** Width of one character, in ems, for Be Vietnam Pro at the weights used
 *  here. Deliberately duplicated in `scripts/text_gate.py` as CHAR_EM - the
 *  gate reconstructs these boxes from source it cannot execute, so the two
 *  constants have to be kept equal by hand. Change one, change both. */
export const DRAWN_CHAR_EM = 0.5;

/** The only two type sizes a shared primitive may draw text at.
 *
 *  Scene files are checked label by label by `text_gate.py`; the primitives
 *  are not, because the gate reads scene sources and these components live one
 *  file away. That gap is exactly where "chữ quá nhỏ" survived: 44px labels in
 *  the scenes sat next to 26px and 32px labels baked into the components
 *  drawing beside them, and nothing compared the two. Sizes are named here so
 *  the gate can assert that no primitive hardcodes a number at all - a rule a
 *  script can check, instead of a convention that drifts.
 *
 *  LABEL_SIZE must equal MIN_FONT_SIZE in text_gate.py. */
export const LABEL_SIZE = 44;
/** For a line that qualifies a label above it and is never read on its own. */
export const SUBLABEL_SIZE = 36;

/* ========================================================================
 * BackgroundPhoto - full-bleed photographic backdrop
 * ======================================================================== */

/**
 * A photo that fills the whole 1080x1920 frame, tinted into the video's
 * grayscale+orange palette and darkened enough that white text stays legible
 * on top.
 *
 * This is the highest-leverage fix for "the frame is empty": a scene that
 * would otherwise be a headline on blank paper becomes a headline over a real
 * place. Unlike a cutout it needs no background removal at all, which also
 * sidesteps the whole class of rembg failures (busy scenes, architecture,
 * flat-lay documents) that produced the broken temple roof and ghosted
 * clothes rack in V10.
 *
 * `focus` pans the crop within the frame so a tall subject isn't beheaded by
 * `object-fit: cover`; `drift` is a slow Ken Burns push, kept subtle because
 * the camera is usually already moving via CameraGroup.
 */
export const BackgroundPhoto = ({
  src,
  durationInFrames,
  tint = 0.42,
  grayscale = 0.85,
  focus = "50% 50%",
  drift = 0.06,
  from = 0,
  fadeIn = 18,
  // "ink" washes the photo DARK (rgba(18,16,14,tint)) so pale headlines read
  // over it. That is wrong for a source that is already dark and busy: on
  // V10/S25 an aged calligraphy document under tint=0.66 came out near-black
  // and swallowed the orange timeline drawn on top of it - raising `tint`
  // there made it worse, not lighter, because tint is opacity of BLACK.
  // "paper" washes toward the project's paper colour instead, turning a photo
  // into a texture that dark ink can still be drawn on.
  wash = "ink",
}) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  const scale = 1 + drift * interpolate(local, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(local, [0, fadeIn], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill name="BackgroundPhoto" style={{ opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: focus,
          scale,
          filter: `grayscale(${grayscale}) contrast(1.12)`,
        }}
      />
      {/* Palette tie-in: a warm ink wash rather than plain black, so a photo
          scene still reads as the same video as the paper-grid scenes. */}
      <AbsoluteFill
        style={{
          backgroundColor:
            wash === "paper" ? `rgba(231,227,217,${tint})` : `rgba(18,16,14,${tint})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            wash === "paper"
              ? "radial-gradient(circle at 50% 42%, rgba(231,227,217,0) 45%, rgba(231,227,217,0.55) 100%)"
              : "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("grain.png")})`,
          backgroundSize: "512px 512px",
          opacity: 0.16,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

/* ========================================================================
 * DiagramCanvas - drawn reconstruction (the "vẽ lại hiện trường" language)
 * ======================================================================== */

const DIAGRAM_VIEWBOX = { w: 1080, h: 1300 };

/**
 * Container for a hand-drawn explanatory diagram. Children are plain SVG in a
 * 1080x1300 coordinate space matching the usable band of the canvas.
 *
 * This is the language a photo genuinely cannot do: when narration says an
 * alley narrowed to 3.2m on a slope and the crowd reached 16 people per
 * square metre, no stock or generated image shows that - a drawing does, and
 * it is what a professional explainer would reach for.
 */
export const DiagramCanvas = ({ children, y = 160, height = DIAGRAM_VIEWBOX.h }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: "100%", height }}>
    <svg
      width="100%"
      height="100%"
      // The viewBox height TRACKS the container height so one SVG unit is
      // always one screen pixel, whatever `height` the caller passes.
      //
      // It used to be pinned at 1300 regardless. Passing `height={760}` then
      // squeezed the full 1080x1300 space into a 1080x760 box, and the default
      // `preserveAspectRatio` letterboxed it: the drawing rendered at 58% size,
      // centred, with the frame empty around it. Which is precisely the "small
      // object floating in white space, everything shoved to the top" defect
      // this whole file exists to eliminate - reintroduced by the container
      // rather than by the drawing. A parameter has to mean what the caller
      // assumes it means, or it becomes a trap.
      viewBox={`0 0 ${DIAGRAM_VIEWBOX.w} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      {children}
    </svg>
  </div>
);

/** Progressive stroke reveal - the shared "drawn by hand, in time with the
 *  narration" motion. `length` may overestimate; dash-offset is forgiving. */
export const DrawnPath = ({
  d,
  delay = 0,
  drawFrames = 26,
  length = 2600,
  stroke = INK,
  strokeWidth = 5,
  dashed = false,
  fill = "none",
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fill === "none" ? 0 : progress * 0.9}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "14 12" : length}
      strokeDashoffset={dashed ? 0 : length * (1 - progress)}
      opacity={dashed ? progress * opacity : opacity}
    />
  );
};

/**
 * An architectural dimension line with end ticks and a measurement label
 * ("3,2m"). Turns a vague "it was narrow" into a number the viewer can see.
 */
export const DimensionLine = ({
  x1, y1, x2, y2,
  label,
  delay = 0,
  color = ORANGE,
  offset = 26,
  // 44, not 34. The old default was under the project's own 44px readability
  // floor, and it anchored every author who touched it: across two videos the
  // explicit sizes came out 36, 38, 40, 42 - climbing toward the floor and
  // never reaching it. Four of the eight dimension labels ever drawn are
  // under-size, which is a broken default, not four careless authors.
  // No scene changes: every existing use passes fontSize explicitly.
  fontSize = 44,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const labelOpacity = interpolate(frame, [delay + 12, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * offset;   // perpendicular, for the end ticks
  const ny = (dx / len) * offset;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const drawnX = x1 + dx * progress;
  const drawnY = y1 + dy * progress;

  return (
    <g>
      <line x1={x1 - nx / 2} y1={y1 - ny / 2} x2={x1 + nx / 2} y2={y1 + ny / 2}
            stroke={color} strokeWidth={4} opacity={progress} />
      <line x1={x2 - nx / 2} y1={y2 - ny / 2} x2={x2 + nx / 2} y2={y2 + ny / 2}
            stroke={color} strokeWidth={4} opacity={progress} />
      <line x1={x1} y1={y1} x2={drawnX} y2={drawnY}
            stroke={color} strokeWidth={4} strokeLinecap="round" />
      {label && (
        <g opacity={labelOpacity}>
          <rect x={midX - label.length * fontSize * 0.32 - 14} y={midY - fontSize * 0.85}
                width={label.length * fontSize * 0.64 + 28} height={fontSize * 1.5}
                rx={8} fill={INK} />
          <text x={midX} y={midY + fontSize * 0.36} textAnchor="middle"
                fontFamily={fontFamily} fontWeight={900} fontSize={fontSize} fill={color}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * A grid of dots representing people per unit area, filling up over time.
 * Built for density claims ("16 người trên mét vuông") where a number alone
 * doesn't land but seeing the space choke does.
 */
export const DensityGrid = ({
  x, y, width, height,
  cols = 8, rows = 6,
  fillCount,
  delay = 0,
  fillFrames = 40,
  dotColor = INK,
  fullColor = ORANGE,
}) => {
  const frame = useCurrentFrame();
  const total = cols * rows;
  const target = Math.min(fillCount ?? total, total);
  const shown = Math.round(
    interpolate(frame, [delay, delay + fillFrames], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
  );
  const stepX = width / cols;
  const stepY = height / rows;
  const radius = Math.min(stepX, stepY) * 0.28;
  const crowded = target / total > 0.7;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={10}
            fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
      {Array.from({ length: total }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const on = i < shown;
        return (
          <circle
            key={i}
            cx={x + stepX * (col + 0.5)}
            cy={y + stepY * (row + 0.5)}
            r={radius}
            fill={on ? (crowded ? fullColor : dotColor) : "none"}
            stroke={on ? "none" : INK}
            strokeWidth={2}
            opacity={on ? 1 : 0.18}
          />
        );
      })}
    </g>
  );
};

/** A slope/incline indicator with a direction arrow - for terrain claims
 *  ("lối đi dốc từ Bắc xuống Nam"). */
export const SlopeIndicator = ({
  x1, y1, x2, y2, label, delay = 0, color = ORANGE,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const cx = x1 + (x2 - x1) * p;
  const cy = y1 + (y2 - y1) * p;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={INK} strokeWidth={4} opacity={0.28} strokeDasharray="10 10" />
      <line x1={x1} y1={y1} x2={cx} y2={cy}
            stroke={color} strokeWidth={7} strokeLinecap="round" />
      <g transform={`translate(${cx} ${cy}) rotate(${angle})`} opacity={p}>
        <path d="M0,0 L-26,-13 L-26,13 Z" fill={color} />
      </g>
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 22} textAnchor="middle"
              fontFamily={fontFamily} fontWeight={900} fontSize={LABEL_SIZE}
              fill={INK} opacity={p}>
          {label}
        </text>
      )}
    </g>
  );
};

/* ========================================================================
 * Timeline - chronological markers
 * ======================================================================== */

/**
 * A horizontal timeline whose markers land one at a time, each on the frame
 * its date is actually spoken.
 *
 * The gap this fills: a narrative/history video constantly says "in the 16th
 * century... by the 20th century... today", and the pipeline had no way to
 * show a sequence AS a sequence. Every such line became another cutout.
 */
export const Timeline = ({
  events,              // [{ label, sub, delay }]
  y = 760,
  x = 90,
  width = 900,
  color = ORANGE,
  inset = 120,         // keeps first/last labels on canvas - see below
}) => {
  const frame = useCurrentFrame();
  const last = events.length - 1 || 1;
  // Markers are inset from the rail's ends because their labels are CENTERED
  // on the marker: putting the first marker at x=90 pushed "Nhật chiếm đóng"
  // off the left edge (it rendered as "hật chiếm đóng") and clipped "Lê Thái
  // Viện" on the right. Caught by looking at a rendered still, not by code
  // review - the geometry looks perfectly reasonable in source.
  const railX = x;
  const railW = width;
  const firstX = railX + inset;
  const spanW = Math.max(1, railW - inset * 2);
  const lineProgress = interpolate(
    frame,
    [events[0]?.delay ?? 0, (events[events.length - 1]?.delay ?? 0) + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{ overflow: "visible" }}>
        <line x1={railX} y1={y} x2={railX + railW} y2={y} stroke={INK} strokeWidth={4} opacity={0.2} />
        <line x1={railX} y1={y} x2={railX + railW * lineProgress} y2={y}
              stroke={color} strokeWidth={6} strokeLinecap="round" />
        {events.map((ev, i) => {
          const cx = firstX + (spanW * i) / last;
          const appear = interpolate(frame, [ev.delay, ev.delay + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 11, stiffness: 160 }),
          });
          const up = i % 2 === 0;                       // alternate to avoid label collisions
          const labelY = up ? y - 54 : y + 92;
          return (
            <g key={i} opacity={appear}>
              <circle cx={cx} cy={y} r={14 * appear} fill={color} stroke={BG} strokeWidth={4} />
              <line x1={cx} y1={y} x2={cx} y2={up ? y - 30 : y + 30}
                    stroke={color} strokeWidth={3} opacity={0.8} />
              <text x={cx} y={labelY} textAnchor="middle" fontFamily={fontFamily}
                    fontWeight={900} fontSize={LABEL_SIZE} fill={INK}>
                {ev.label}
              </text>
              {ev.sub && (
                <text x={cx} y={labelY + (up ? -56 : 54)} textAnchor="middle"
                      fontFamily={fontFamily} fontWeight={700} fontSize={SUBLABEL_SIZE}
                      fill={INK} opacity={0.65}>
                  {ev.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ========================================================================
 * AnnotatedPhoto - point at the detail that matters
 * ======================================================================== */

/**
 * A photo with leader lines and labels pointing at specific details.
 *
 * The editorial value: instead of showing a street and hoping the viewer
 * notices the thing being described, it says "this, here" - which is exactly
 * what "audio nói đến đâu có minh họa đến đó" asks for when the subject is a
 * detail inside a wider image rather than a whole object.
 *
 * Annotation coordinates are percentages of the photo box, so they survive a
 * change of photo size.
 */
export const AnnotatedPhoto = ({
  src,
  x = 60, y = 300, width = 960, height = 900,
  annotations = [],    // [{ atX:'62%', atY:'40%', label, side:'left'|'right', delay }]
  delay = 0,
  grayscale = 0.8,
}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ position: "absolute", left: x, top: y, width, height, opacity: reveal }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 10,
                    border: `3px solid ${INK}`, boxShadow: "0 16px 44px rgba(0,0,0,0.25)" }}>
        <Img src={staticFile(src)}
             style={{ width: "100%", height: "100%", objectFit: "cover",
                      filter: `grayscale(${grayscale}) contrast(1.1)` }} />
      </div>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {annotations.map((a, i) => {
          const px = (parseFloat(a.atX) / 100) * width;
          const py = (parseFloat(a.atY) / 100) * height;
          const left = a.side === "left";
          const textW = (a.label?.length || 0) * 19 + 28;
          // Labels must stay INSIDE the canvas, not just outside the photo.
          // The first version ran leader lines to -40 / width+40 and hung the
          // label past that, so both labels rendered half off-screen. The
          // photo box's own position on the canvas is what constrains this,
          // hence the x offset in the maths.
          const railOut = 34;
          const endX = left
            ? Math.max(-x + 12 + textW, px - railOut)
            : Math.min(1080 - x - 12 - textW, px + railOut);
          const p = interpolate(frame, [a.delay ?? delay, (a.delay ?? delay) + 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          const curX = px + (endX - px) * p;
          return (
            <g key={i} opacity={p}>
              <circle cx={px} cy={py} r={12} fill={ORANGE} stroke={BG} strokeWidth={3} />
              <circle cx={px} cy={py} r={12 + 16 * (1 - p)} fill="none"
                      stroke={ORANGE} strokeWidth={3} opacity={1 - p} />
              <line x1={px} y1={py} x2={curX} y2={py} stroke={ORANGE} strokeWidth={4} />
              {p > 0.85 && (
                <g>
                  <rect x={left ? endX - textW : endX} y={py - 26}
                        width={textW} height={52} rx={10} fill={INK} />
                  <text x={left ? endX - textW / 2 : endX + textW / 2} y={py + 10}
                        textAnchor="middle" fontFamily={fontFamily} fontWeight={800}
                        fontSize={LABEL_SIZE} fill={BG}>
                    {a.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ========================================================================
 * DeviceMockup - a screen inside a device frame
 * ======================================================================== */

/** Wraps an image in a phone/TV frame. Standardises what V10 did ad hoc by
 *  generating a phone-shaped photo, which cannot be re-composed later. */
export const DeviceMockup = ({
  src,
  children,
  kind = "phone",
  x = "50%", y = 380, width = 420,
  delay = 0,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [delay, delay + 14], [0.72, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring({ damping: 12, stiffness: 150 }),
    output: "perceptual-scale",
  });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isPhone = kind === "phone";
  const height = width * (isPhone ? 2.05 : 0.62);
  const left = typeof x === "string" ? x : `${x}px`;
  const marginLeft = typeof x === "string" && x.endsWith("%") ? -width / 2 : 0;

  return (
    <div style={{ position: "absolute", left, top: y, width, marginLeft, scale, opacity }}>
      <div
        style={{
          width, height,
          borderRadius: isPhone ? width * 0.11 : 14,
          background: "#0E0E10",
          padding: isPhone ? width * 0.032 : width * 0.02,
          boxShadow: glow
            ? `0 18px 50px rgba(0,0,0,0.34), 0 0 40px ${ORANGE}30`
            : "0 18px 50px rgba(0,0,0,0.34)",
          border: `2px solid ${INK}`,
        }}
      >
        {/* `src` is optional: the device frame is drawn in code, so a scene
            that only needs the device (a subscribe prompt, a blank handset)
            must not be forced to source a photograph of one. Passing
            undefined used to reach staticFile() and kill the render with
            "undefined was passed to staticFile()" - which is also what pushed
            an earlier pass into sourcing a phone photo that rembg then
            destroyed. Children render over the screen either way. */}
        <div style={{ width: "100%", height: "100%", overflow: "hidden",
                      borderRadius: isPhone ? width * 0.08 : 8,
                      background: src ? "#000" : "#15130F",
                      position: "relative" }}>
          {src ? (
            <Img src={staticFile(src)}
                 style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
          {children}
        </div>
      </div>
      {!isPhone && (
        <div style={{ width: width * 0.22, height: 16, margin: "0 auto",
                      background: INK, borderRadius: "0 0 6px 6px" }} />
      )}
    </div>
  );
};

/* ========================================================================
 * ForceArrow - a push that does NOT get through
 * ======================================================================== */

/**
 * An arrow that drives toward a target, meets it, and rebounds.
 *
 * Built for the hardest claim in the Itaewon script: rescuers pulled as hard
 * as they could and still could not extract anyone. A cut-out of a hand shows
 * *that someone pulled*; only a force that visibly bounces off shows *why it
 * failed*. That distinction is the difference between an illustration and an
 * explanation, and it is the whole reason the diagram language exists.
 *
 * The rebound is the point, so it is not subtle: the arrow travels in, stalls
 * against the wall, snaps back further than it came, then settles short.
 */
export const ForceArrow = ({
  x, y, length = 300, thickness = 16,
  delay = 0,
  travelFrames = 18,
  label,
  color = ORANGE,
  direction = 1, // 1 = pointing right, -1 = pointing left
}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  // in -> hard stop -> overshoot back -> settle
  const push = interpolate(
    t,
    [0, travelFrames, travelFrames + 5, travelFrames + 14, travelFrames + 26],
    [-length * 0.55, 0, 0, -length * 0.42, -length * 0.3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.3, 0, 0.3, 1),
    }
  );
  const appear = interpolate(t, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const impact = interpolate(t, [travelFrames, travelFrames + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tip = x + direction * (length + push);
  const tail = tip - direction * length;
  const head = thickness * 2.1;

  return (
    <g opacity={appear}>
      <line
        x1={tail}
        y1={y}
        x2={tip - direction * head * 0.7}
        y2={y}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      <path
        d={`M ${tip} ${y} L ${tip - direction * head} ${y - head * 0.62} L ${tip - direction * head} ${y + head * 0.62} Z`}
        fill={color}
      />
      {/* impact burst at the point of failure */}
      {[-1, -0.45, 0.45, 1].map((k, i) => (
        <line
          key={i}
          x1={tip + direction * 6}
          y1={y + k * 10}
          x2={tip + direction * (20 + 26 * impact)}
          y2={y + k * (26 + 30 * impact)}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={impact * 0.9}
        />
      ))}
      {label ? (
        <text
          x={tail + direction * length * 0.45}
          y={y - thickness - 18}
          textAnchor="middle"
          fill={INK}
          style={{ fontFamily, fontSize: LABEL_SIZE, fontWeight: 800 }}
          opacity={appear}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/* ========================================================================
 * MemorialDots - one mark per person, counted
 * ======================================================================== */

/**
 * `count` dots landing in sequence with a running tally.
 *
 * DensityGrid answers "how packed was it"; this answers "how many people".
 * They look similar and mean different things, so keep them apart: a death
 * toll drawn as a density grid reads as a statistic about space, not people.
 *
 * Dots land in a deliberate, even rhythm rather than all at once - the count
 * is the content, and a viewer who cannot see it accumulate has only been
 * shown a number they could have read in the caption.
 */
export const MemorialDots = ({
  x, y, width,
  count = 158,
  perRow = 20,
  delay = 0,
  fillFrames = 60,
  color = INK,
  lastColor = ORANGE,
}) => {
  const frame = useCurrentFrame();
  const shown = Math.round(
    interpolate(frame, [delay, delay + fillFrames], [0, count], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
  );
  const step = width / perRow;
  const radius = step * 0.26;
  const rows = Math.ceil(count / perRow);

  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        if (i >= shown) return null;
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        return (
          <circle
            key={i}
            cx={x + step * (col + 0.5)}
            cy={y + step * (row + 0.5)}
            r={radius}
            fill={i === shown - 1 ? lastColor : color}
            opacity={i === shown - 1 ? 1 : 0.82}
          />
        );
      })}
      <text
        x={x + width / 2}
        y={y + step * rows + 74}
        textAnchor="middle"
        fill={INK}
        style={{ fontFamily, fontSize: 66, fontWeight: 900 }}
      >
        {shown}
      </text>
    </g>
  );
};

/* ========================================================================
 * ChainBreak - a sequence that was supposed to hold, and didn't
 * ======================================================================== */

/**
 * A row of links drawing themselves left to right, then one of them snapping.
 *
 * For "it was entirely preventable": the chain IS the prevention, so the
 * viewer has to watch it exist before watching it fail. Drawing all the links
 * and then breaking one says something a chain drawn already-broken cannot.
 *
 * `breakAt` is the 0-based index of the link that fails.
 */
export const ChainBreak = ({
  x, y, width, height,
  links = 5,
  breakAt = 3,
  labels = [],
  delay = 0,
  drawFrames = 10,
  breakDelay = 60,
  color = INK,
  breakColor = ORANGE,
  vertical = true,
}) => {
  const frame = useCurrentFrame();
  // Vertical by default. A row of four links across a 1080x1920 frame renders
  // as a thin horizontal strip with the top and bottom thirds empty - the
  // exact "everything crammed into one band" composition this project keeps
  // being told off for. Stacking down the frame uses the shape the canvas
  // actually is.
  const span = vertical ? (height ?? 900) : width;
  const step = span / links;
  const r = Math.min(step * 0.36, vertical ? 128 : 112);

  const snap = interpolate(
    frame,
    [delay + breakDelay, delay + breakDelay + 12],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2)),
    }
  );

  return (
    <g>
      {Array.from({ length: links }, (_, i) => {
        const appear = interpolate(
          frame,
          [delay + i * drawFrames, delay + i * drawFrames + drawFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const broken = i === breakAt;
        const cx = vertical ? x : x + step * (i + 0.5);
        const cy = vertical ? y + step * (i + 0.5) : y;
        // the failing link splits apart and drops
        const shift = broken ? snap * step * 0.12 : 0;
        const rx = vertical ? r * 0.74 : r;
        const ry = vertical ? r : r * 0.74;
        return (
          <g key={i} opacity={appear}>
            <ellipse
              cx={cx + (vertical ? shift : -shift)}
              cy={cy + (vertical ? snap * (broken ? 20 : 0) : (broken ? snap * 34 : 0))}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={broken && snap > 0.1 ? breakColor : color}
              strokeWidth={14}
              strokeDasharray={broken && snap > 0.1 ? `${r * 1.5} ${r * 1.1}` : "none"}
              transform={broken ? `rotate(${snap * -14} ${cx} ${cy})` : undefined}
            />
            {i < links - 1 ? (
              vertical ? (
                <line
                  x1={cx} y1={cy + ry * 0.86}
                  x2={cx} y2={cy + step - ry * 0.86}
                  stroke={color} strokeWidth={12} strokeLinecap="round"
                  opacity={i === breakAt || i + 1 === breakAt ? 1 - snap : 1}
                />
              ) : (
                <line
                  x1={cx + rx * 0.86} y1={cy}
                  x2={cx + step - rx * 0.86} y2={cy}
                  stroke={color} strokeWidth={12} strokeLinecap="round"
                  opacity={i === breakAt || i + 1 === breakAt ? 1 - snap : 1}
                />
              )
            ) : null}
            {labels[i] ? (
              <text
                x={vertical ? x + rx + 96 : cx}
                y={vertical ? cy + 14 : cy + ry + 52}
                textAnchor={vertical ? "start" : "middle"}
                fill={broken && snap > 0.1 ? breakColor : INK}
                style={{ fontFamily, fontSize: LABEL_SIZE, fontWeight: 800 }}
                opacity={0.92}
              >
                {labels[i]}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/* ========================================================================
 * StreetElevation - a row of shopfronts, drawn and labelled
 * ======================================================================== */

/**
 * A drawn street elevation: N shopfronts side by side, each labelled.
 *
 * This replaces the V10 defect the viewer called out by name - "bars and
 * fashion shops" illustrated with one cocktail glass and a rack of clothes.
 * A cocktail glass illustrates the CATEGORY; a row of shopfronts packed wall
 * to wall illustrates the DENSITY, which is what the narration actually
 * claims. Same words, completely different evidence.
 */
export const StreetElevation = ({
  x, y, width, height = 300,
  shops = [],
  delay = 0,
  stagger = 7,
  color = INK,
  accent = ORANGE,
}) => {
  const frame = useCurrentFrame();
  const n = shops.length || 1;
  const step = width / n;

  return (
    <g>
      <line
        x1={x - 14}
        y1={y + height}
        x2={x + width + 14}
        y2={y + height}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {shops.map((shop, i) => {
        const t = interpolate(
          frame,
          [delay + i * stagger, delay + i * stagger + 14],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }
        );
        const sx = x + step * i + 4;
        const sw = step - 8;
        // Near-equal heights on purpose. The first version varied them from
        // 0.62 to 1.0 of the band, and at full frame size a row of unequal
        // rectangles standing on a baseline reads as a BAR CHART - the exact
        // misreading a viewer reported on V10/S18 and, earlier, on S4. Real
        // shopfronts on one street are roughly the same height; what varies
        // is the signage. So: height varies by 12%, and the shop reads as a
        // shop because of the sign band, the upper windows and the doorway,
        // not because of how tall its rectangle is.
        const sh = height * (0.88 + 0.12 * ((i % 3) / 2)) * t;
        const top = y + height - sh;
        const highlighted = shop.accent;
        const signTop = top + sh * 0.1;
        const signH = sh * 0.17;
        const floorY = signTop + signH;         // where the upper storey ends
        const doorH = sh * 0.34;
        return (
          <g key={i} opacity={t}>
            <rect
              x={sx}
              y={top}
              width={sw}
              height={sh}
              rx={4}
              fill={highlighted ? accent : "none"}
              fillOpacity={highlighted ? 0.14 : 0}
              stroke={highlighted ? accent : color}
              strokeWidth={4}
            />
            {/* sign band across the facade - the thing that actually tells a
                viewer "this is a shopfront" */}
            <rect
              x={sx + 6}
              y={signTop}
              width={sw - 12}
              height={signH}
              fill={highlighted ? accent : color}
              fillOpacity={highlighted ? 0.5 : 0.16}
              stroke={highlighted ? accent : color}
              strokeWidth={3}
            />
            {/* upper-storey windows */}
            {[0.16, 0.44, 0.72].map((f, w) => (
              <rect
                key={w}
                x={sx + sw * f}
                y={floorY + sh * 0.09}
                width={sw * 0.16}
                height={sh * 0.16}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                opacity={0.55}
              />
            ))}
            {/* awning over the entrance */}
            <path
              d={`M ${sx + 4} ${y + height - doorH - sh * 0.06}
                  L ${sx + sw - 4} ${y + height - doorH - sh * 0.06}
                  L ${sx + sw - 14} ${y + height - doorH - sh * 0.16}
                  L ${sx + 14} ${y + height - doorH - sh * 0.16} Z`}
              fill={highlighted ? accent : color}
              fillOpacity={highlighted ? 0.32 : 0.12}
              stroke={highlighted ? accent : color}
              strokeWidth={2.5}
            />
            {/* doorway, standing on the street line */}
            <rect
              x={sx + sw * 0.33}
              y={y + height - doorH}
              width={sw * 0.34}
              height={doorH}
              fill={color}
              fillOpacity={0.1}
              stroke={color}
              strokeWidth={3}
              opacity={0.85}
            />
            {shop.label ? (
              <text
                x={sx + sw / 2}
                y={signTop + signH * 0.74}
                textAnchor="middle"
                fill={INK}
                // The sign band is only `step` wide. A fixed 26px overflowed
                // "THỜI TRANG" past its own shopfront at 7 shops across 1000px.
                style={{
                  fontFamily,
                  fontSize: Math.min(SUBLABEL_SIZE, (sw - 12) / (shop.label.length * 0.56)),
                  fontWeight: 800,
                }}
              >
                {shop.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/**
 * DrawnText - an SVG label that arrives on a beat.
 *
 * The gap this closes was invisible in code review and obvious the moment a
 * frame was rendered: every drawing primitive here takes a `delay` and
 * animates in, but a bare <text> inside DiagramCanvas has no timing at all -
 * it is simply painted from frame 0. So a scene whose plan said "the label
 * arrives at frame 150" showed that label from the very first frame, and the
 * declared visual beats collapsed into one. Checked across V11: 67 labels in
 * 24 scenes, all of them early.
 *
 * Same props as <text>, plus `delay` and `rise`.
 */
export const DrawnText = ({
  delay = 0,
  rise = 14,
  // A solid slab behind the glyphs. Pass it whenever the label sits over a
  // BackgroundPhoto or over a cutout: ink text on grid paper is legible, and
  // the identical ink text over a dark doorway is a smudge. The viewer
  // reported exactly this - "chữ bị chìm khi phân cảnh có ảnh nền" - and no
  // gate could ever see it, because the text is present, correctly placed and
  // the right colour. It is only invisible.
  plate = false,
  platePad = 14,
  plateColor = BG,
  plateRadius = 8,
  // Hard ceiling on how wide this label may draw. When the text measures
  // wider, the font shrinks until it fits instead of running out of its box.
  // This is the "tràn chữ" defect solved at the source: a caller declares the
  // space it owns, and the label is guaranteed to stay inside it.
  maxWidth = null,
  // Declares that a stroke is SUPPOSED to cross this label - a rule struck
  // through a regulation that no longer applies, a name crossed out. Without
  // it the collision check has to choose between missing every real
  // "đường vẽ đè chữ" and failing every deliberate strike-through. It names
  // the intent instead of switching the check off: an unstruck label in the
  // same scene still fails. Draws nothing itself.
  struck = false,
  children,
  style,
  ...rest
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  const opacity = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dy = interpolate(local, [0, 14], [rise, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Real measurement, not an em estimate.
  //
  // Both this plate and text_gate.py used to model a label as
  // `len(text) * fontSize * 0.50`. That number is wrong for the text this
  // project actually draws: Vietnamese uppercase at weight 800-900 runs far
  // wider than half an em, so every reconstructed box was narrower than the
  // glyphs on screen. A plate sized that way leaves the ends of the word
  // uncovered, and - worse - the gate cleared collisions that were really
  // happening. measureText reads the font that is already loaded, so the
  // number is the number.
  const requested = Number(style?.fontSize ?? rest.fontSize ?? 34);
  const weight = Number(style?.fontWeight ?? rest.fontWeight ?? 700);
  const str = String(children ?? "");
  const natural = measureText({ text: str, fontFamily, fontSize: requested, fontWeight: weight }).width;
  const size =
    maxWidth && natural > maxWidth
      ? fitText({ text: str, withinWidth: maxWidth, fontFamily, fontWeight: weight }).fontSize
      : requested;
  const label = (
    <text {...rest} opacity={(rest.opacity ?? 1) * opacity}
          style={size === requested ? style : { ...style, fontSize: size }}>
      {children}
    </text>
  );
  if (!plate) {
    return <g transform={`translate(0 ${dy})`}>{label}</g>;
  }

  const w = measureText({ text: str, fontFamily, fontSize: size, fontWeight: weight }).width;
  const anchor = rest.textAnchor || "start";
  const left = anchor === "middle" ? rest.x - w / 2 : anchor === "end" ? rest.x - w : rest.x;
  return (
    <g transform={`translate(0 ${dy})`} opacity={opacity}>
      <rect x={left - platePad} y={rest.y - size * 0.78 - platePad * 0.5}
            width={w + platePad * 2} height={size + platePad}
            rx={plateRadius} fill={plateColor} opacity={0.92} />
      {label}
    </g>
  );
};

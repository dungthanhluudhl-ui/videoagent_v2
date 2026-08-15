/**
 * A drawn symbol vocabulary, built on @remotion/shapes and @remotion/paths.
 *
 * WHY THIS FILE EXISTS
 *
 * V11 shipped 265 drawn words across 24 scenes. V10, which the viewer liked,
 * carried 31 across 26. That 8.5x is the whole difference in how tiring the
 * two videos are to watch, and it happened because a label is the cheapest
 * thing to author: when a scene needs "the crowd reached 16 people per square
 * metre", typing that sentence takes seconds and drawing it takes thought.
 *
 * But the caption bar is ALREADY running the narration word-by-word along the
 * bottom of every frame, and the voice is already saying it. A drawn sentence
 * is therefore the third copy of one message, competing with the other two for
 * the same reading attention - while the picture that would have carried it
 * instantly never got drawn.
 *
 * A symbol does not compete. It is read in one glance, at the same time as the
 * caption, in a different channel. So this file exists to make the drawn form
 * the cheap option: `<IconDensity x={540} y={200} delay={48} />` should take
 * less effort than composing a sentence, or nobody will use it under time
 * pressure.
 *
 * ENFORCEMENT - read this before adding or renaming anything
 *
 * `VOX_ICONS` below is not documentation. `scripts/icon_gate.py` parses THIS
 * FILE at gate time and uses it three ways:
 *
 *   1. Any drawn label containing one of an icon's `triggers`, in a scene that
 *      renders no icon, fails the gate - and the failure names the icon to use
 *      instead. This is what stops a future session from writing the sentence
 *      and forgetting the vocabulary exists.
 *   2. A video must actually reach a floor of icon usage before it can ship.
 *   3. A registry entry with no matching `export const`, or an exported
 *      `Icon*` missing from the registry, is itself a failure - so the map and
 *      the territory cannot drift apart. Adding an icon means adding both.
 *
 * The registry is parsed with a strict shape (`means` then `triggers`, plain
 * double-quoted strings). Keep to it; the gate reports a parse failure rather
 * than silently reading nothing, but there is no reason to make it work.
 *
 * CHOOSING TRIGGERS. They fire against short drawn labels, so they must be
 * concept-bearing: "mật độ" and "đám đông", never "người" or "tại" on their
 * own. A trigger that matches half the language would make the gate a nuisance
 * to work around instead of a rule to follow, and a gate people route around
 * is worse than no gate.
 *
 * Every icon is drawn progressively via <DrawnPath>, matching the hand-drawn
 * motion of the rest of the diagram language, with the dash length measured by
 * `getLength` rather than guessed. They live inside a <DiagramCanvas>, in its
 * 1080-wide coordinate space, and are positioned by their CENTRE so an icon
 * can be dropped at the same coordinates a label would have used.
 */

import React from "react";
import { getLength, translatePath } from "@remotion/paths";
import { makeCircle, makeRect, makeTriangle } from "@remotion/shapes";
import { INK, ORANGE } from "./shared";
import { DrawnPath } from "./visualLanguage";

/* ========================================================================
 * The registry the gate reads. Keep entries alphabetical by key.
 * ======================================================================== */

export const VOX_ICONS = {
  IconBan: {
    means: "bị cấm, bị chặn, không được phép",
    triggers: ["bị cấm", "cấm ", "không được phép", "bị chặn", "vô hiệu"],
  },
  IconCheck: {
    means: "đạt, hợp lệ, đã hoàn thành",
    triggers: ["hợp lệ", "đạt yêu cầu", "hoàn thành", "đã duyệt"],
  },
  IconClock: {
    means: "một mốc giờ cụ thể, hoặc thời gian trôi",
    triggers: ["giờ", "phút", "mốc thời gian", "thời điểm"],
  },
  IconCrowd: {
    means: "một đám đông, nhiều người cùng một chỗ",
    triggers: ["đám đông", "dòng người", "biển người", "hàng nghìn người"],
  },
  IconDensity: {
    means: "số người trên một đơn vị diện tích",
    triggers: ["mật độ", "người/m", "chen chúc", "chật kín", "quá tải"],
  },
  IconDoc: {
    means: "văn bản, hồ sơ, quy định, báo cáo",
    triggers: ["hồ sơ", "văn bản", "quy định", "báo cáo", "giấy tờ", "biên bản"],
  },
  IconFall: {
    means: "một đại lượng giảm xuống",
    triggers: ["giảm", "sụt", "tụt", "lao dốc", "rơi xuống"],
  },
  IconMoney: {
    means: "tiền, chi phí, giá trị",
    triggers: ["chi phí", "số tiền", "giá trị", "lãi suất", "ngân sách"],
  },
  IconPerson: {
    means: "một người đơn lẻ - nhân chứng, nạn nhân, chính người xem",
    triggers: ["một người", "nhân chứng", "cá nhân", "từng người"],
  },
  IconPhone: {
    means: "một cuộc gọi, một đường dây",
    triggers: ["cuộc gọi", "tổng đài", "đường dây", "báo cảnh sát", "gọi cứu"],
  },
  IconPin: {
    means: "một địa điểm cụ thể trên bản đồ",
    triggers: ["địa điểm", "vị trí", "toạ độ", "tọa độ"],
  },
  IconQuestion: {
    means: "câu hỏi trung tâm của phân cảnh",
    triggers: ["tại sao", "vì sao", "câu hỏi", "điều gì"],
  },
  IconRise: {
    means: "một đại lượng tăng lên",
    triggers: ["tăng", "vọt lên", "leo thang", "gấp đôi", "gấp ba"],
  },
  IconScale: {
    means: "hai thứ được đặt lên bàn cân, so sánh",
    triggers: ["so sánh", "đối lập", "cân bằng", "đánh đổi", "trái ngược"],
  },
  IconWarning: {
    means: "cảnh báo, rủi ro, dấu hiệu nguy hiểm",
    triggers: ["cảnh báo", "nguy hiểm", "rủi ro", "báo động", "nguy cơ"],
  },
};

/* ========================================================================
 * Shared plumbing
 * ======================================================================== */

/** Place a @remotion/shapes path with its own box CENTRED on (cx, cy). */
const centred = (shape, cx, cy) =>
  translatePath(shape.path, cx - shape.width / 2, cy - shape.height / 2);

/**
 * One stroke of an icon. Wraps DrawnPath purely to measure the dash length
 * instead of guessing it: DrawnPath's `length` prop documents itself as "may
 * overestimate", which is fine for a freehand wall but visibly wrong on a
 * circle - an overestimate leaves the stroke still growing after the beat it
 * was cut to.
 */
const Stroke = ({ d, delay = 0, drawFrames = 14, ...rest }) => (
  <DrawnPath d={d} delay={delay} drawFrames={drawFrames} length={getLength(d)} {...rest} />
);

/**
 * Every icon takes the same five props, so swapping one for another is a
 * one-word edit and nothing has to be re-measured.
 *
 *   x, y   centre, in DiagramCanvas coordinates
 *   size   overall width AND height of the icon's box
 *   delay  frame the drawing starts (the beat it belongs to)
 *   color  main stroke; `accent` is the one part allowed to be orange
 */
const defaults = { size: 120, delay: 0, color: INK, accent: ORANGE };

/** The little standing figure that IconPerson and IconCrowd are both made of. */
const figure = (cx, cy, s) => {
  const head = centred(makeCircle({ radius: s * 0.15 }), cx, cy - s * 0.3);
  const body =
    `M ${cx} ${cy - s * 0.12} L ${cx} ${cy + s * 0.16} ` +
    `M ${cx - s * 0.2} ${cy + s * 0.46} L ${cx} ${cy + s * 0.16} ` +
    `L ${cx + s * 0.2} ${cy + s * 0.46}`;
  return { head, body };
};

/* ========================================================================
 * The icons
 * ======================================================================== */

/** A clock face with hands that are anchored at the centre BY CONSTRUCTION.
 *  V11's S18 drew a face at y=40 and hands at y=190, so the hands hung off the
 *  dial - the failure mode you get when geometry is retyped per scene instead
 *  of being computed once here. */
export const IconClock = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
  hourAngle = -60, minuteAngle = 30,
}) => {
  const r = size * 0.42;
  const hand = (deg, len) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `M ${x} ${y} L ${x + Math.cos(rad) * len} ${y + Math.sin(rad) * len}`;
  };
  return (
    <g>
      <Stroke d={centred(makeCircle({ radius: r }), x, y)} delay={delay}
              drawFrames={16} stroke={color} strokeWidth={6} />
      <Stroke d={hand(hourAngle, r * 0.52)} delay={delay + 10} drawFrames={8}
              stroke={color} strokeWidth={7} />
      <Stroke d={hand(minuteAngle, r * 0.78)} delay={delay + 14} drawFrames={8}
              stroke={accent} strokeWidth={7} />
    </g>
  );
};

/** Triangle + bang. The one icon that may be orange throughout - a warning
 *  that reads as ink is a warning nobody sees. */
export const IconWarning = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.accent, accent = defaults.accent,
}) => {
  const tri = makeTriangle({ length: size * 0.92, direction: "up" });
  return (
    <g>
      <Stroke d={centred(tri, x, y)} delay={delay} drawFrames={16}
              stroke={color} strokeWidth={7} />
      <Stroke d={`M ${x} ${y - size * 0.1} L ${x} ${y + size * 0.14}`}
              delay={delay + 10} drawFrames={6} stroke={accent} strokeWidth={8} />
      <Stroke d={centred(makeCircle({ radius: size * 0.035 }), x, y + size * 0.27)}
              delay={delay + 14} drawFrames={5} stroke={accent} strokeWidth={6}
              fill={accent} />
    </g>
  );
};

/** A bounded square filling with dots: people per square metre, seen rather
 *  than stated. `fill` is 0..1 of the box - pass the real ratio. */
export const IconDensity = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
  fill = 0.85, cols = 6, rows = 6,
}) => {
  const box = makeRect({ width: size, height: size });
  const step = size / cols;
  const dots = [];
  const target = Math.round(cols * rows * Math.min(Math.max(fill, 0), 1));
  for (let i = 0; i < cols * rows; i += 1) {
    const cx = x - size / 2 + step * ((i % cols) + 0.5);
    const cy = y - size / 2 + (size / rows) * (Math.floor(i / cols) + 0.5);
    dots.push(
      <Stroke key={i} d={centred(makeCircle({ radius: step * 0.2 }), cx, cy)}
              delay={delay + 8 + Math.floor((i / (cols * rows)) * 22)} drawFrames={4}
              stroke={i < target ? accent : color} strokeWidth={3}
              fill={i < target ? accent : "none"} opacity={i < target ? 1 : 0.28} />,
    );
  }
  return (
    <g>
      <Stroke d={centred(box, x, y)} delay={delay} drawFrames={14}
              stroke={color} strokeWidth={5} />
      {dots}
    </g>
  );
};

/** Three figures at slightly different sizes - a crowd, not a queue. */
export const IconCrowd = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => {
  const people = [
    { cx: x - size * 0.3, cy: y + size * 0.04, s: size * 0.72, c: color },
    { cx: x, cy: y, s: size * 0.9, c: accent },
    { cx: x + size * 0.32, cy: y + size * 0.06, s: size * 0.68, c: color },
  ];
  return (
    <g>
      {people.map((p, i) => {
        const f = figure(p.cx, p.cy, p.s);
        return (
          <g key={i}>
            <Stroke d={f.head} delay={delay + i * 5} drawFrames={8}
                    stroke={p.c} strokeWidth={5} />
            <Stroke d={f.body} delay={delay + i * 5 + 4} drawFrames={10}
                    stroke={p.c} strokeWidth={5} />
          </g>
        );
      })}
    </g>
  );
};

/** A single figure - one person, a witness, a victim, "you". */
export const IconPerson = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color,
}) => {
  const f = figure(x, y, size);
  return (
    <g>
      <Stroke d={f.head} delay={delay} drawFrames={8} stroke={color} strokeWidth={6} />
      <Stroke d={f.body} delay={delay + 5} drawFrames={12} stroke={color} strokeWidth={6} />
    </g>
  );
};

const trendIcon = (up) => ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => {
  const h = size * 0.42;
  // The shaft starts at `y + sign*h` and ends at `y - sign*h`, so `up` must be
  // the POSITIVE sign to start low and finish high. It was written the other
  // way round and the two icons rendered as each other's opposite - caught by
  // rendering the sheet, which is the entire reason the sheet is a composition
  // and not a comment.
  const sign = up ? 1 : -1;
  const tip = { x: x + size * 0.44, y: y + sign * -h };
  const shaft =
    `M ${x - size * 0.44} ${y + sign * h} L ${x - size * 0.1} ${y + sign * (h * 0.1)} ` +
    `L ${x + size * 0.12} ${y + sign * (h * 0.35)} L ${tip.x} ${tip.y}`;
  const headPath = up
    ? `M ${tip.x - size * 0.2} ${tip.y} L ${tip.x} ${tip.y} L ${tip.x} ${tip.y + size * 0.2}`
    : `M ${tip.x - size * 0.2} ${tip.y} L ${tip.x} ${tip.y} L ${tip.x} ${tip.y - size * 0.2}`;
  return (
    <g>
      <Stroke d={shaft} delay={delay} drawFrames={16} stroke={accent} strokeWidth={8} />
      <Stroke d={headPath} delay={delay + 12} drawFrames={7} stroke={accent} strokeWidth={8} />
      <Stroke d={`M ${x - size * 0.5} ${y + size * 0.5} L ${x + size * 0.5} ${y + size * 0.5}`}
              delay={delay + 4} drawFrames={10} stroke={color} strokeWidth={4} opacity={0.5} />
    </g>
  );
};

/** A rising line with an arrowhead, over a baseline. */
export const IconRise = trendIcon(true);
/** The same line falling - drawn from the same generator so the two read as a
 *  pair when a video uses both. */
export const IconFall = trendIcon(false);

/** Circle with a slash: forbidden, blocked, refused. */
export const IconBan = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.accent,
}) => {
  const r = size * 0.42;
  const k = r * 0.707;
  return (
    <g>
      <Stroke d={centred(makeCircle({ radius: r }), x, y)} delay={delay}
              drawFrames={16} stroke={color} strokeWidth={8} />
      <Stroke d={`M ${x - k} ${y - k} L ${x + k} ${y + k}`} delay={delay + 12}
              drawFrames={8} stroke={color} strokeWidth={8} />
    </g>
  );
};

/** A tick inside a circle. */
export const IconCheck = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => (
  <g>
    <Stroke d={centred(makeCircle({ radius: size * 0.42 }), x, y)} delay={delay}
            drawFrames={16} stroke={color} strokeWidth={5} />
    <Stroke d={`M ${x - size * 0.2} ${y} L ${x - size * 0.05} ${y + size * 0.16} ` +
               `L ${x + size * 0.22} ${y - size * 0.18}`}
            delay={delay + 10} drawFrames={9} stroke={accent} strokeWidth={8} />
  </g>
);

/** A banknote with a coin overlapping it. */
export const IconMoney = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => (
  <g>
    <Stroke d={centred(makeRect({ width: size, height: size * 0.6 }), x - size * 0.06, y)}
            delay={delay} drawFrames={16} stroke={color} strokeWidth={5} />
    <Stroke d={centred(makeCircle({ radius: size * 0.17 }), x - size * 0.06, y)}
            delay={delay + 8} drawFrames={10} stroke={color} strokeWidth={4} />
    <Stroke d={centred(makeCircle({ radius: size * 0.24 }), x + size * 0.38, y + size * 0.22)}
            delay={delay + 14} drawFrames={10} stroke={accent} strokeWidth={6} />
  </g>
);

/** A page with a folded corner and rules of text. */
export const IconDoc = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => {
  const w = size * 0.72;
  const h = size;
  const l = x - w / 2;
  const t = y - h / 2;
  const fold = size * 0.22;
  const page =
    `M ${l} ${t} L ${l + w - fold} ${t} L ${l + w} ${t + fold} ` +
    `L ${l + w} ${t + h} L ${l} ${t + h} Z`;
  return (
    <g>
      <Stroke d={page} delay={delay} drawFrames={18} stroke={color} strokeWidth={5} />
      <Stroke d={`M ${l + w - fold} ${t} L ${l + w - fold} ${t + fold} L ${l + w} ${t + fold}`}
              delay={delay + 12} drawFrames={7} stroke={color} strokeWidth={4} />
      {[0.45, 0.6, 0.75].map((f, i) => (
        <Stroke key={i} d={`M ${l + w * 0.16} ${t + h * f} L ${l + w * 0.84} ${t + h * f}`}
                delay={delay + 16 + i * 4} drawFrames={6}
                stroke={i === 0 ? accent : color} strokeWidth={4} opacity={i === 0 ? 1 : 0.6} />
      ))}
    </g>
  );
};

/** A handset with signal arcs coming off it.
 *  The first attempt drew a freehand handset outline plus a `makePie` wedge;
 *  rendered, it read as an unidentifiable squiggle next to a triangle. A
 *  device body with two clean arcs survives being 110px tall, which is the
 *  only size that matters here. */
export const IconPhone = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => {
  const bx = x - size * 0.16;
  const body = makeRect({ width: size * 0.5, height: size * 0.86, cornerRadius: size * 0.1 });
  const arc = (r) =>
    `M ${x + size * 0.22} ${y - r} A ${r} ${r} 0 0 1 ${x + size * 0.22} ${y + r}`;
  return (
    <g>
      <Stroke d={centred(body, bx, y)} delay={delay} drawFrames={16}
              stroke={color} strokeWidth={6} />
      <Stroke d={`M ${bx - size * 0.1} ${y - size * 0.31} L ${bx + size * 0.1} ${y - size * 0.31}`}
              delay={delay + 12} drawFrames={5} stroke={color} strokeWidth={5} />
      <Stroke d={centred(makeCircle({ radius: size * 0.05 }), bx, y + size * 0.28)}
              delay={delay + 14} drawFrames={5} stroke={color} strokeWidth={4} />
      <Stroke d={arc(size * 0.2)} delay={delay + 16} drawFrames={7}
              stroke={accent} strokeWidth={6} />
      <Stroke d={arc(size * 0.36)} delay={delay + 21} drawFrames={8}
              stroke={accent} strokeWidth={6} opacity={0.75} />
    </g>
  );
};

/** A map pin. The diagram-space sibling of VoxMapPin, which mounts over a real
 *  map at master level - same symbol, so a video can move between a drawn plan
 *  and a real map without the vocabulary changing under the viewer. */
export const IconPin = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.accent,
}) => {
  const r = size * 0.28;
  const tipY = y + size * 0.5;
  const cy = y - size * 0.08;
  const body =
    `M ${x} ${tipY} L ${x - r * 0.92} ${cy + r * 0.38} ` +
    `A ${r} ${r} 0 1 1 ${x + r * 0.92} ${cy + r * 0.38} Z`;
  return (
    <g>
      <Stroke d={body} delay={delay} drawFrames={16} stroke={color} strokeWidth={7} />
      <Stroke d={centred(makeCircle({ radius: r * 0.34 }), x, cy)} delay={delay + 12}
              drawFrames={6} stroke={color} strokeWidth={5} fill={color} />
    </g>
  );
};

/** A question mark in a circle - the scene's `viewerQuestion`, made visible. */
export const IconQuestion = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
}) => {
  const s = size * 0.24;
  const hook =
    `M ${x - s * 0.9} ${y - s * 0.55} Q ${x - s * 0.9} ${y - s * 1.6} ${x} ${y - s * 1.6} ` +
    `Q ${x + s * 1.05} ${y - s * 1.6} ${x + s * 0.95} ${y - s * 0.5} ` +
    `Q ${x + s * 0.85} ${y + s * 0.2} ${x} ${y + s * 0.5}`;
  return (
    <g>
      <Stroke d={centred(makeCircle({ radius: size * 0.44 }), x, y)} delay={delay}
              drawFrames={16} stroke={color} strokeWidth={5} />
      <Stroke d={hook} delay={delay + 10} drawFrames={12} stroke={accent} strokeWidth={8} />
      <Stroke d={centred(makeCircle({ radius: s * 0.16 }), x, y + s * 1.15)}
              delay={delay + 20} drawFrames={5} stroke={accent} strokeWidth={6} fill={accent} />
    </g>
  );
};

/** A balance beam that TILTS toward whichever side is heavier - so "these two
 *  are not equal" is carried by the drawing, not by a caption saying so.
 *  `tilt` is -1..1; negative leans left. */
export const IconScale = ({
  x, y, size = defaults.size, delay = defaults.delay,
  color = defaults.color, accent = defaults.accent,
  tilt = 0.35,
}) => {
  const half = size * 0.46;
  const drop = half * Math.max(Math.min(tilt, 1), -1) * 0.34;
  const lx = x - half;
  const rx = x + half;
  const ly = y - drop;
  const ry = y + drop;
  // A pan is a shallow bowl, not a dash. Drawn as a flat segment it read as a
  // stray tick mark and the whole icon stopped being a balance.
  const pan = (px, py) => {
    const w = size * 0.17;
    const top = py + size * 0.17;
    return `M ${px - w} ${top} Q ${px} ${top + size * 0.16} ${px + w} ${top}`;
  };
  const base = makeTriangle({ length: size * 0.3, direction: "up" });
  return (
    <g>
      <Stroke d={`M ${x} ${y - size * 0.12} L ${x} ${y + size * 0.34}`} delay={delay}
              drawFrames={10} stroke={color} strokeWidth={6} />
      <Stroke d={`M ${lx} ${ly} L ${rx} ${ry}`} delay={delay + 6} drawFrames={12}
              stroke={color} strokeWidth={6} />
      <Stroke d={`M ${lx} ${ly} L ${lx} ${ly + size * 0.17}`} delay={delay + 14}
              drawFrames={5} stroke={color} strokeWidth={4} />
      <Stroke d={`M ${rx} ${ry} L ${rx} ${ry + size * 0.17}`} delay={delay + 14}
              drawFrames={5} stroke={color} strokeWidth={4} />
      <Stroke d={pan(lx, ly)} delay={delay + 18} drawFrames={7}
              stroke={tilt < 0 ? accent : color} strokeWidth={6} />
      <Stroke d={pan(rx, ry)} delay={delay + 18} drawFrames={7}
              stroke={tilt > 0 ? accent : color} strokeWidth={6} />
      <Stroke d={centred(base, x, y + size * 0.42)} delay={delay + 22} drawFrames={7}
              stroke={color} strokeWidth={5} />
    </g>
  );
};

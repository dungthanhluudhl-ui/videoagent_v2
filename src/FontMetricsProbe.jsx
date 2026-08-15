/**
 * FontMetricsProbe - measures the real font, once, so Python can stop guessing.
 *
 * Every gate that reasons about where a label sits has to reconstruct the
 * label's box from source it cannot execute. Until now it did that with one
 * constant: `len(text) * fontSize * 0.50`. That constant is not close for the
 * text this project draws - bold Vietnamese uppercase runs well past half an
 * em - so every reconstructed box was too narrow, and the gate cleared
 * collisions and overflows that were plainly visible in the render. Guessing
 * the width is the reason "chữ đè lên nhau / tràn ô" survived a green gate.
 *
 * This composition renders nothing anyone looks at. It measures one advance
 * width per character per weight with the same `measureText` the components
 * use, and prints the table to the browser console, where
 * `scripts/measure_font.py` picks it up and writes
 * `.claude/skills/vox-collage-video/data/font_metrics.json`.
 *
 * Run it again only when the font or its weights change:
 *     py -3 .claude/skills/vox-collage-video/scripts/measure_font.py
 */

import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { measureText } from "@remotion/layout-utils";
import { fontFamily } from "./scenes/shared";

/** Weights the project actually draws with. */
const WEIGHTS = [400, 700, 800, 900];

/** Every code point the pipeline can put on screen: ASCII, Latin-1, the six
 *  Vietnamese-only letter pairs, and the tone-mark block 1EA0-1EF9. Listed as
 *  ranges rather than a hand-typed string so a missing character is
 *  impossible rather than merely unlikely. */
const RANGES = [
  [0x20, 0x7e],
  [0xc0, 0xff],
  [0x102, 0x103], [0x110, 0x111], [0x128, 0x129],
  [0x168, 0x169], [0x1a0, 0x1a1], [0x1af, 0x1b0],
  [0x1ea0, 0x1ef9],
];

const charset = () => {
  const out = [];
  for (const [lo, hi] of RANGES) {
    for (let c = lo; c <= hi; c += 1) out.push(String.fromCodePoint(c));
  }
  return out;
};

const REF_SIZE = 100;   // measure at 100px; a width scales linearly with size

export const FontMetricsProbe = () => {
  const [handle] = useState(() => delayRender("measuring font"));
  const [done, setDone] = useState(false);

  useEffect(() => {
    const chars = charset();
    const table = {};
    for (const weight of WEIGHTS) {
      const row = {};
      for (const ch of chars) {
        // Measured against a reference string: measuring a lone character
        // loses the side bearings the character has in a word, and a space
        // measured alone can come back as 0 in some engines.
        const w =
          measureText({ text: `M${ch}M`, fontFamily, fontSize: REF_SIZE, fontWeight: weight }).width -
          measureText({ text: "MM", fontFamily, fontSize: REF_SIZE, fontWeight: weight }).width;
        row[ch] = Math.round(w * 100) / 100;
      }
      table[weight] = row;
    }
    // The font's own line box, in ems. This is the number that decides
    // whether a stacked Vietnamese diacritic survives: set `lineHeight` below
    // it and the browser crops the top of the glyph, which is how "CHỖ THẮT"
    // shipped as "CHÔ THÂT". Anything reading this table should treat it as
    // the floor for lineHeight, not as a suggestion.
    const capProbe = measureText({ text: "H", fontFamily, fontSize: REF_SIZE, fontWeight: 900 });
    const accentProbe = measureText({ text: "Ỗ", fontFamily, fontSize: REF_SIZE, fontWeight: 900 });
    // eslint-disable-next-line no-console
    console.log(
      "FONT_METRICS_JSON " +
        JSON.stringify({
          fontFamily,
          refSize: REF_SIZE,
          lineBoxEm: capProbe.height / REF_SIZE,
          lineBoxAccentEm: accentProbe.height / REF_SIZE,
          advances: table,
        }),
    );
    setDone(true);
    continueRender(handle);
  }, [handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#E7E3D9", fontFamily, fontSize: 60, padding: 60 }}>
      {done ? "font measured" : "measuring"}
    </AbsoluteFill>
  );
};

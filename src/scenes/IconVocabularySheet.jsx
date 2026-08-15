/**
 * A rendered index of the whole symbol vocabulary.
 *
 * `icon_gate.py` tells a session an icon EXISTS. This tells it what the icon
 * LOOKS like, without reading 400 lines of path maths - render one still and
 * the choice between IconScale and IconRise takes a glance:
 *
 *   npx remotion still IconVocabularySheet input/icon_vocabulary.png --scale=0.5
 *
 * It is driven by VOX_ICONS and resolved through the module namespace, so a
 * new icon appears here the moment it is registered. There is no list to
 * update, and therefore no list to forget.
 */

import { AbsoluteFill } from "remotion";
import { BG, INK, ORANGE, fontFamily } from "./shared";
import { DiagramCanvas, DrawnText } from "./visualLanguage";
import * as vocab from "./iconVocabulary";

const COLS = 3;
const CELL_W = 1080 / COLS;
const CELL_H = 300;

export const ICON_SHEET_DURATION = 90;

export const IconVocabularySheet = () => {
  const names = Object.keys(vocab.VOX_ICONS);
  const rows = Math.ceil(names.length / COLS);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily }}>
      <DiagramCanvas y={80} height={rows * CELL_H + 40}>
        {names.map((name, i) => {
          const Icon = vocab[name];
          const cx = CELL_W * (i % COLS) + CELL_W / 2;
          const cy = CELL_H * Math.floor(i / COLS) + CELL_H / 2 - 20;
          return (
            <g key={name}>
              {Icon ? <Icon x={cx} y={cy} size={110} delay={4 + i * 2} /> : null}
              {/* Plated on purpose: this doubles as the only rendered proof
                  that DrawnText's `plate` still works after an edit. */}
              <DrawnText x={cx} y={cy + 108} textAnchor="middle" fontFamily={fontFamily}
                         fontWeight={800} fill={Icon ? INK : ORANGE}
                         style={{ fontSize: 26 }} delay={10 + i * 2} plate>
                {Icon ? name : `${name} (MISSING)`}
              </DrawnText>
            </g>
          );
        })}
      </DiagramCanvas>
    </AbsoluteFill>
  );
};

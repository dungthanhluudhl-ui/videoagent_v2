/**
 * S4 - Con hẻm đó nhỏ đến mức nào?
 *
 * mặt cắt con hẻm được vẽ ra với bề rộng thật 3,2m so với chiều cao người
 *
 * comprehensionLoad: complex - 135 frames (4.5s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DimensionLine, DrawnPath, SlopeIndicator } from "./visualLanguage";

export const V10SCENE4_DURATION = 135;

export const V10Scene4 = () => (
  <AbsoluteFill name="V10Scene4">
      <SceneBackground variant="grid" />
      <DiagramCanvas y={300} height={900}>
        {/* hatched walls - masonry, not bars */}
        {[{ x: 40, w: 150 }, { x: 890, w: 150 }].map((wall) => (
          <g key={wall.x}>
            <rect x={wall.x} y={70} width={wall.w} height={600} fill="#1A1A1A" opacity={0.1} />
            <rect x={wall.x} y={70} width={wall.w} height={600} fill="none"
                  stroke="#1A1A1A" strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
              <line key={k} x1={wall.x} y1={130 + k * 74} x2={wall.x + wall.w} y2={90 + k * 74}
                    stroke="#1A1A1A" strokeWidth={2} opacity={0.45} />
            ))}
          </g>
        ))}
        {/* the crowd fills the gap edge to edge - overlapping, no daylight */}
        {[218, 288, 358, 428, 498, 568, 638, 708, 778, 848].map((cx, i) => (
          <g key={cx} opacity={0.92}>
            <circle cx={cx} cy={392 + (i % 3) * 10} r={36} fill="#1A1A1A" />
            <rect x={cx - 42} y={436 + (i % 3) * 10} width={84} height={234} rx={30}
                  fill="#1A1A1A" />
          </g>
        ))}
        <DrawnPath d="M 40 670 L 1040 670" delay={16} drawFrames={14} length={1000}
                   strokeWidth={6} />
        <DimensionLine x1={190} y1={730} x2={890} y2={730} label="3,2 MÉT"
                       delay={34} fontSize={46} />
        <SlopeIndicator x1={210} y1={846} x2={870} y2={812} label="DỐC LÊN" delay={64} />
      </DiagramCanvas>
      <Sequence from={38} layout="none">
        <PunchPhrase lines={["3,2 MÉT"]} top={200} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);

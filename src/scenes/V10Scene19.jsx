/**
 * S19 - Ai sống ở đây?
 *
 * các biển hiệu nhiều thứ tiếng trên cùng một mặt phố được chỉ ra từng cái
 *
 * comprehensionLoad: moderate - 90 frames (3.0s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas } from "./visualLanguage";

export const V10SCENE19_DURATION = 90;

export const V10Scene19 = () => (
  <AbsoluteFill name="V10Scene19">
      <BackgroundPhoto name="Bg-Signage" src="el10_signage.png"
                       durationInFrames={90} tint={0.5} focus="50% 40%" drift={0.06} />
      <DiagramCanvas y={660} height={560}>
        {[
          { x: 190, label: "한국어" },
          { x: 430, label: "ENGLISH" },
          { x: 670, label: "العربية" },
          { x: 900, label: "РУССКИЙ" },
        ].map((it, i) => (
          <g key={it.label}>
            <line x1={it.x} y1={40} x2={it.x} y2={150 + i * 34} stroke="#E8621A"
                  strokeWidth={4} opacity={0.9} />
            <circle cx={it.x} cy={40} r={9} fill="#E8621A" />
            <text x={it.x} y={196 + i * 34} textAnchor="middle" fill="#F7F4EC"
                  style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
              {it.label}
            </text>
          </g>
        ))}
      </DiagramCanvas>
      <Sequence from={28} layout="none">
        <PunchPhrase lines={["NHIỀU QUỐC TỊCH"]} top={230} onDark fontSize={58} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);

/**
 * S15 - Itaewon là một con phố phải không?
 *
 * Biển tên một con phố bị gạch đi, thay bằng đơn vị hành chính thật
 *
 * comprehensionLoad: moderate - 101 frames (3.37s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: biển 520px giữa khung giấy trơn, dưới trống hoàn toàn
 * (review10.json S15/composed = fail). Biển nay 700px, dấu gạch chéo phủ trọn
 * biển, và câu trả lời đúng - phường/quận - lấp dải đáy thay vì bỏ trắng.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V10SCENE15_DURATION = 101;

export const V10Scene15 = () => (
  <AbsoluteFill name="V10Scene15">
      <SceneBackground variant="grid" />
      <Sequence from={0} layout="none">
        <Support name="Sup-StreetSign" src="el10_street_sign.png" width={700} x="50%" y={320}
                 visibleFor={100} />
      </Sequence>
      <DiagramCanvas y={320} height={720}>
        <DrawnPath d="M 180 40 L 900 660" delay={46} drawFrames={12} length={950}
                   stroke="#E8621A" strokeWidth={18} />
        <DrawnPath d="M 900 40 L 180 660" delay={54} drawFrames={12} length={950}
                   stroke="#E8621A" strokeWidth={18} />
      </DiagramCanvas>
      {/* câu trả lời đúng chỉ được phép hiện SAU khi biển phố bị gạch */}
      <Sequence from={46} layout="none">
        <DiagramCanvas y={1080} height={200}>
          <DrawnPath d="M 120 20 L 960 20" delay={0} drawFrames={10} length={840}
                     strokeWidth={5} opacity={0.4} />
          <text x={540} y={100} textAnchor="middle" fill="#1A1A1A"
                style={{ fontFamily: "Be Vietnam Pro", fontSize: 46, fontWeight: 800 }}>
            PHƯỜNG ITAEWON
          </text>
          <text x={540} y={162} textAnchor="middle" fill="#E8621A"
                style={{ fontFamily: "Be Vietnam Pro", fontSize: 38, fontWeight: 800 }}>
            QUẬN YONGSAN
          </text>
        </DiagramCanvas>
      </Sequence>
      <Sequence from={40} layout="none">
        <PunchPhrase lines={["KHÔNG PHẢI", "MỘT CON PHỐ"]} top={180} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);

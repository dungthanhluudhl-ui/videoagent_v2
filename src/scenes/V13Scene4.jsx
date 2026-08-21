/**
 * S4 - Vua chuột là con gì?
 *
 * cả cụm Vua chuột hiện nguyên hình trên thẻ hồ sơ, rồi một đường chỉ cam
 * kéo từ chữ tới đúng cục đuôi ở giữa.
 *
 * comprehensionLoad: moderate - 90 frames (3.0s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Ảnh này là DỰNG LẠI có chủ đích (shotlist: illustrative-reconstruction),
 * nên thẻ hồ sơ ở đây là thẻ trưng bày, không phải khung ảnh tư liệu - không
 * đóng dấu, không ghi niên đại, để không ngụ ý đây là ảnh chụp thật.
 *
 * Nhãn nằm ở 1104..1160, tức DƯỚI đáy ảnh hero (1012): text_gate chặn nhãn
 * đè lên ảnh, và ở đây cũng không có chỗ nào trong lòng ảnh mà chữ không
 * rơi vào lưng chuột.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, fontFamily } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V13SCENE4_DURATION = 90;

const ORANGE = "#FF6A1A";
const INK = "#141414";

export const V13Scene4 = () => (
  <AbsoluteFill name="V13Scene4">
    <SceneBackground variant="card" />

    <CameraGroup zoom={{ from: 1.0, to: 1.08 }} durationInFrames={V13SCENE4_DURATION}>
      <DiagramCanvas y={0} height={1920}>
        <rect x={60} y={560} width={960} height={640} rx={16}
              fill="#F5F0E4" stroke={INK} strokeWidth={4} opacity={0.96} />
        <rect x={60} y={560} width={960} height={14} fill={ORANGE} opacity={0.9} />
      </DiagramCanvas>

      <Sequence from={0} layout="none">
        <Hero name="Hero-RatKing" src="el13_ratking_hero.png"
              width={900} x={90} y={620} variant="flip" idle="sway"
              visibleFor={V13SCENE4_DURATION} />
      </Sequence>

      <Sequence from={30} layout="none">
        <DiagramCanvas y={0} height={1920}>
          <circle cx={540} cy={820} r={16} fill="none" stroke={ORANGE} strokeWidth={7} />
          <DrawnPath d="M 540 838 Q 560 1010 640 1086" delay={4} drawFrames={14} length={300}
                     stroke={ORANGE} strokeWidth={6} />
          <DrawnText delay={16} x={604} y={1148} fill={INK}
                     style={{ fontFamily, fontSize: 48, fontWeight: 900, letterSpacing: 1 }}>
            NÚT ĐUÔI
          </DrawnText>
        </DiagramCanvas>
      </Sequence>
    </CameraGroup>

    <Sequence from={30} layout="none">
      <PunchPhrase lines={["VUA CHUỘT", "RAT KING"]} top={250} fontSize={80} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

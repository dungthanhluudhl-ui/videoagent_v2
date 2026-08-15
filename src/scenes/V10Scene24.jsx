/**
 * S24 - Ký ức đau thương nào?
 *
 * cái tên thơ mộng chìm xuống dưới một lớp tối của chiến tranh
 *
 * comprehensionLoad: simple - 86 frames (2.9s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: bản đầu chỉ có ảnh giấy cháy phủ tint 0.5 -> gần như đen đặc,
 * và "cái tên chìm xuống" chỉ nằm trong mô tả chứ không hề diễn ra trên màn
 * hình. Nay tint hạ còn 0.3 để thấy được thớ giấy cháy, cái tên 梨泰院 hiện
 * ngay từ đầu, rồi lớp tối dâng lên nuốt nó - đúng chuyển biến đã khai trong
 * plan, và lấp kín khung thay vì để nửa dưới đen trơn.
 */

import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas } from "./visualLanguage";

export const V10SCENE24_DURATION = 86;

/** Lớp tối dâng từ đáy khung lên, nuốt dần cái tên. */
const InkSink = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        background:
          `linear-gradient(to top, rgba(10,9,8,0.96) 0%, rgba(10,9,8,0.92) ${28 * rise}%, ` +
          `rgba(10,9,8,0.0) ${Math.max(30, 78 * rise)}%)`,
        opacity: rise,
      }}
    />
  );
};

export const V10Scene24 = () => (
  <AbsoluteFill name="V10Scene24">
      <BackgroundPhoto name="Bg-War" src="el10_war_texture.png"
                       durationInFrames={86} tint={0.3} focus="50% 50%" drift={0.05} />
      <DiagramCanvas y={360} height={560}>
        <text x={540} y={210} textAnchor="middle" fill="#E7E3D9"
              opacity={0.92}
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 150, fontWeight: 900 }}>
          梨泰院
        </text>
        <text x={540} y={310} textAnchor="middle" fill="#E7E3D9"
              opacity={0.6}
              style={{ fontFamily: "Be Vietnam Pro", fontSize: 48, fontWeight: 700 }}>
          &quot;vườn lê&quot;
        </text>
      </DiagramCanvas>
      <Sequence from={34} layout="none">
        <InkSink />
      </Sequence>
      <Sequence from={38} layout="none">
        <PunchPhrase lines={["KÝ ỨC", "CHIẾN TRANH"]} top={1080} onDark />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);

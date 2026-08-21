/**
 * S7 - Cái nút đuôi đó hình thành bằng cách nào?
 *
 * cùng một góc chụp từ trên xuống, bốn cái đuôi đang bắt chéo nhau còn rời
 * ra đổi thành một cục thắt chặt ở chính giữa, rồi bốn mũi tên kéo ra bốn
 * phía mà cục thắt không nhúc nhích.
 *
 * comprehensionLoad: complex - 197 frames (6.57s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * Đây là cảnh cơ chế, nên nó phải có HAI thời điểm chứ không phải một trạng
 * thái cuối: chéo (0-81) rồi thắt (81-197). Cắt thẳng vào ảnh nút thắt là
 * đánh mất đúng cái người xem cần thấy hình thành.
 *
 * drift={0} ở CẢ HAI ảnh là bắt buộc: dấu cam vẽ theo toạ độ tĩnh, mà
 * BackgroundPhoto mặc định phóng ảnh 6% trong lúc chạy - dấu sẽ trôi khỏi
 * cái đuôi nó đang chỉ. Chuyển động camera dồn hết vào CameraGroup, nơi
 * ảnh và dấu cùng bị phóng như nhau.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";

export const V13SCENE7_DURATION = 197;

const ORANGE = "#FF6A1A";

/** Mũi tên kéo ra xa nút thắt: thân + hai gạch đầu mũi. */
const PullArrow = ({ x1, y1, x2, y2, delay }) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 30;
  const a1 = ang + Math.PI * 0.82;
  const a2 = ang - Math.PI * 0.82;
  return (
    <>
      <DrawnPath d={`M ${x1} ${y1} L ${x2} ${y2}`} delay={delay} drawFrames={10}
                 length={220} stroke={ORANGE} strokeWidth={10} />
      <DrawnPath
        d={`M ${x2 + Math.cos(a1) * h} ${y2 + Math.sin(a1) * h} L ${x2} ${y2} L ${x2 + Math.cos(a2) * h} ${y2 + Math.sin(a2) * h}`}
        delay={delay + 6} drawFrames={6} length={80} stroke={ORANGE} strokeWidth={10} />
    </>
  );
};

export const V13Scene7 = () => (
  <AbsoluteFill name="V13Scene7">
    <SceneBackground variant="photo" />

    <CameraGroup
      zoom={{ from: 0.98, to: 1.08 }}
      shake={{ at: 150, len: 18, mag: 6 }}
      durationInFrames={V13SCENE7_DURATION}
    >
      <Sequence from={0} durationInFrames={81} layout="none">
        <BackgroundPhoto
          name="Bg-Crossing"
          src="el13_tails_crossing.png"
          durationInFrames={81}
          wash="ink"
          tint={0.26}
          grayscale={0.6}
          drift={0}
          fadeIn={10}
        />
      </Sequence>

      <Sequence from={81} layout="none">
        <BackgroundPhoto
          name="Bg-Knot"
          src="el13_tails_knot.png"
          durationInFrames={116}
          wash="ink"
          tint={0.26}
          grayscale={0.6}
          drift={0}
          fadeIn={10}
        />
      </Sequence>

      {/* trạng thái CHÉO: đánh dấu hai chỗ đuôi bắt chéo, không vẽ đè đuôi */}
      <Sequence from={12} durationInFrames={69} layout="none">
        <DiagramCanvas y={0} height={1920}>
          <circle cx={486} cy={940} r={34} fill="none" stroke={ORANGE} strokeWidth={7} />
          <circle cx={560} cy={1026} r={34} fill="none" stroke={ORANGE} strokeWidth={7} />
        </DiagramCanvas>
      </Sequence>

      {/* trạng thái THẮT: một vòng ôm lấy cục thắt, rồi bốn lực kéo ra */}
      <Sequence from={81} layout="none">
        <DiagramCanvas y={0} height={1920}>
          <circle cx={518} cy={931} r={92} fill="none" stroke={ORANGE} strokeWidth={9} opacity={0.95} />
          <circle cx={518} cy={931} r={126} fill="none" stroke={ORANGE} strokeWidth={4} opacity={0.45} />
          <PullArrow x1={438} y1={856} x2={302} y2={720} delay={57} />
          <PullArrow x1={598} y1={856} x2={734} y2={720} delay={61} />
          <PullArrow x1={438} y1={1006} x2={302} y2={1142} delay={65} />
          <PullArrow x1={598} y1={1006} x2={734} y2={1142} delay={69} />
        </DiagramCanvas>
      </Sequence>
    </CameraGroup>

    <Sequence from={138} layout="none">
      <PunchPhrase lines={["MỘT NÚT THẮT", "KHÔNG THỂ GỠ"]} top={250} fontSize={74} onDark />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

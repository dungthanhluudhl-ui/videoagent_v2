/**
 * S1 - Vì sao triều đình lại dựng riêng một khu ở đúng chỗ này?
 *
 * khung cảnh cung đình lùi ra sau thành nền, bản đồ thật tiến lên, rồi một
 * vòng khoanh siết lại đúng mảnh đất được cấp
 *
 * comprehensionLoad: moderate - 102 frames (3.4s)
 * Generated from input/scene_plan12.json; check with build_gate.py.
 *
 * V11 mở cùng đoạn lời này bằng `document` (cuộn chiếu chỉ). Ở đây cố ý đổi
 * sang `map`: câu thoại có hai chữ "tại đây", và một toạ độ thật trả lời được
 * chữ đó, còn một tờ giấy thì không.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapPanel } from "./MapGraphic";

export const V12SCENE1_DURATION = 102;

export const V12Scene1 = () => (
  <AbsoluteFill name="V12Scene1">
    {/* wash="paper" chứ không phải "ink": ảnh nguồn vốn đã tối (chùa lúc
        hoàng hôn), đẩy tint mực lên chỉ làm nó tối thêm - đã trả giá ở V10/S25 */}
    <BackgroundPhoto
      name="Bg-Court"
      src="el10_temple_dusk.png"
      durationInFrames={102}
      wash="paper"
      // 0.55 cộng với 18 khung fade-in làm nửa giây đầu của cảnh gần như
      // trắng trơn - đúng cái "khung hình trống" đã bị phàn nàn. 0.36 giữ
      // được mặt giấy cho tiêu đề mực mà ảnh vẫn có mặt ngay từ đầu.
      tint={0.36}
      grayscale={0.8}
      focus="50% 38%"
      drift={0.05}
    />

    <Sequence from={34} layout="none">
      <PunchPhrase
        lines={["MỘT KHU RIÊNG", "GIỮA KINH THÀNH"]}
        top={200}
        left={90}
        right={90}
        fontSize={62}
      />
    </Sequence>

    <Sequence from={34} layout="none">
      <MapPanel
        x={60}
        y={700}
        width={960}
        height={560}
        center={[126.9945, 37.5345]}
        zoom={15}
        style={LOCAL_RASTER_STYLE}
        label="KHU TẠM CƯ"
        sublabel="đất triều đình cấp"
        delay={0}
        pinDelay={14}
        tint={0.05}
      />
    </Sequence>

    {/* vòng khoanh nét đứt siết vào đúng mảnh đất - đây là thứ biến bản đồ
        thành một CÂU KHẲNG ĐỊNH ("chỗ này"), thay vì chỉ là một tấm nền đẹp */}
    <Sequence from={34} layout="none">
      <DiagramCanvas y={700} height={560}>
        <DrawnPath
          d="M 540 90 A 190 190 0 1 1 539 90"
          delay={16}
          drawFrames={24}
          length={1195}
          stroke="#C2410C"
          strokeWidth={9}
          dashed
        />
      </DiagramCanvas>
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

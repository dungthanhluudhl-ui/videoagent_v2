/**
 * S1 - Ai đã lập ra nơi này, và để làm gì?
 *
 * tờ chiếu chỉ cổ mở ra, vị trí khu tạm cư sáng lên trên bản đồ bên dưới
 *
 * comprehensionLoad: moderate - 102 frames (3.4s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Mở phần 2 bằng tài liệu, không phải hiện trường như phần 1: nền là mặt giấy
 * cũ (wash="paper" chứ không phải "ink" - tint là độ đục của MÀU MỰC, đẩy lên
 * chỉ làm tối thêm, đã trả giá ở V10/S25), cuộn chiếu chỉ vẽ bằng code, rồi
 * bản đồ chỉ đúng chỗ ở dải dưới.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapPanel } from "./MapGraphic";

export const V11SCENE1_DURATION = 102;

export const V11Scene1 = () => (
  <AbsoluteFill name="V11Scene1">
    <BackgroundPhoto
      name="Bg-Decree"
      src="el10_historical_doc.png"
      durationInFrames={102}
      wash="paper"
      tint={0.5}
      grayscale={0.7}
      focus="50% 35%"
      drift={0.05}
    />

    {/* cuộn chiếu chỉ: hai thanh trục kéo ngang ra, mặt giấy mở giữa chúng */}
    <DiagramCanvas y={280} height={360}>
      <DrawnPath
        d="M 90 24 L 990 24"
        delay={0}
        drawFrames={14}
        length={900}
        strokeWidth={14}
      />
      <DrawnPath
        d="M 90 336 L 990 336"
        delay={6}
        drawFrames={14}
        length={900}
        strokeWidth={14}
      />
      <DrawnPath
        d="M 96 24 L 96 336"
        delay={12}
        drawFrames={8}
        length={320}
        strokeWidth={4}
      />
      <DrawnPath
        d="M 984 24 L 984 336"
        delay={12}
        drawFrames={8}
        length={320}
        strokeWidth={4}
      />
      {/* ấn triện - dấu hiệu duy nhất cho biết đây là văn bản của triều đình */}
      <g opacity={0.9}>
        <DrawnPath
          d="M 880 250 L 950 250 L 950 320 L 880 320 Z"
          delay={20}
          drawFrames={12}
          length={280}
          stroke="#C2410C"
          strokeWidth={7}
        />
        <DrawnPath
          d="M 896 268 L 934 268 M 896 286 L 934 286 M 896 304 L 934 304"
          delay={26}
          drawFrames={10}
          length={120}
          stroke="#C2410C"
          strokeWidth={5}
        />
      </g>
    </DiagramCanvas>

    <Sequence from={34} layout="none">
      {/* Inside the scroll, not across it. The scroll's own left rod is at
          x=96 and the headline defaulted to x=56, so the first two letters of
          every line sat on top of the rod - which is the "chữ lệch và đè
          khung" the first viewer reported. left/right inset the headline into
          the paper the scene actually drew for it. */}
      <PunchPhrase
        lines={["TRIỀU ĐÌNH", "LẬP KHU TẠM CƯ"]}
        top={352}
        left={140}
        right={140}
        fontSize={64}
      />
    </Sequence>

    <Sequence from={64} layout="none">
      <MapPanel
        x={60}
        y={676}
        width={960}
        height={560}
        center={[126.9945, 37.5345]}
        zoom={15}
        style={LOCAL_RASTER_STYLE}
        label="KHU TẠM CƯ"
        sublabel="bên đường vào kinh thành"
        delay={0}
        pinDelay={10}
        tint={0.04}
      />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

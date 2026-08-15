/**
 * S25 - Chuyện xảy ra từ khi nào và ở đâu?
 *
 * Trục thời gian chạy ngược về cuối thế kỷ 16, rồi chính vùng 1,37 km2 bị phủ
 * lớp chiếm đóng
 *
 * comprehensionLoad: complex - 152 frames (5.07s)
 * Generated from input/scene_plan10.json; check with build_gate.py.
 *
 * Bố cục v2: trục thời gian mảnh trên nền giấy trơn, dải dưới trống cho tới
 * khi bản đồ vào ở frame 111 (review10.json S25/composed = fail). Xếp chồng
 * hai ngôn ngữ theo visual-language.md: nền là ảnh văn bản cổ, trên đó là trục
 * thời gian, và mái cổng Hàn Quốc lấp dải dưới trong lúc chờ bản đồ.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { BackgroundPhoto, Timeline } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V10SCENE25_DURATION = 152;

export const V10Scene25 = () => (
  <AbsoluteFill name="V10Scene25">
      {/* wash="paper": tint là độ đục của lớp phủ, không phải độ sáng. Bản
          đầu dùng wash mực tối 0.66 trên một văn bản vốn đã tối -> trục thời
          gian cam vẽ đè lên gần như mất hút. */}
      <BackgroundPhoto src="el10_historical_doc.png" durationInFrames={152}
                       wash="paper" tint={0.76} grayscale={1} drift={0.04} fadeIn={14} />
      <Timeline
        y={470} x={60} width={960} inset={140}
        events={[
          { label: "TK 16", sub: "Nhật Bản xâm lược", delay: 6 },
          { label: "2022", sub: "Hôm nay", delay: 46 },
        ]}
      />
      <Sequence from={40} layout="none">
        <Support name="Sup-Gate" src="el10_historical_figure.png" width={760} x={160} y={790}
                 visibleFor={71} />
      </Sequence>
      <Sequence from={111} layout="none">
        <MapGraphic center={[126.9945, 37.5345]} zoom={14} style={LOCAL_RASTER_STYLE}
                    label="BỊ CHIẾM ĐÓNG" sublabel="Cuối thế kỷ 16" areaKm2={1.37}
                    delay={0} pinDelay={8} tint={0.3} />
      </Sequence>
      <Sequence from={6} layout="none">
        <PunchPhrase lines={["THẾ KỶ 16"]} top={190} />
      </Sequence>
      <BottomBar />
  </AbsoluteFill>
);

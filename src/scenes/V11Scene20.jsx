/**
 * S20 - Họ kéo đến đây để đi đâu?
 *
 * bản đồ hiện phố ẩm thực ở phía Bắc và đo ra đúng 302m
 *
 * comprehensionLoad: complex - 178 frames (5.9s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Tile đã cache sẵn ở zoom 17-18 quanh Itaewon (cache_map_tiles.py): ở vĩ độ
 * này zoom 16 chỉ cho ~1,9 m/pixel, đoạn phố 302m dài vỏn vẹn 160px trên khung
 * 1080 - phóng quá zoom sẽ ra bản đồ nhoè.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { DiagramCanvas, DimensionLine, DrawnPath } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V11SCENE20_DURATION = 178;

export const V11Scene20 = () => (
  <AbsoluteFill name="V11Scene20">
    <MapGraphic center={[126.9932, 37.5356]} zoom={17} style={LOCAL_RASTER_STYLE}
                label="PHỐ ẨM THỰC THẾ GIỚI" sublabel="đầu phía Bắc"
                delay={0} pinDelay={16} tint={0.2} />

    {/* thước đo dựng dọc theo đoạn phố, rồi mới chốt con số */}
    <DiagramCanvas y={700} height={550}>
      <DrawnPath d="M 120 60 L 960 60" delay={106} drawFrames={22} length={840}
                 stroke="#C2410C" strokeWidth={8} />
      <DrawnPath d="M 120 34 L 120 86 M 960 34 L 960 86" delay={124} drawFrames={8}
                 length={104} stroke="#C2410C" strokeWidth={8} />
      <text x={540} y={132} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
        toàn bộ chiều dài phố ẩm thực
      </text>
      <DimensionLine x1={120} y1={230} x2={960} y2={230} label="302m" delay={154}
                     offset={0} fontSize={56} />
    </DiagramCanvas>

    <Sequence from={154} layout="none">
      <PunchPhrase lines={["302 MÉT"]} top={196} fontSize={76} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

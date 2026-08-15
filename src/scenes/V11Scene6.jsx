/**
 * S6 - Rồi thế kỷ 20 mang gì đến đây?
 *
 * trục thời gian nhảy 400 năm, rồi vùng căn cứ Yongsan hiện ra áp sát Itaewon
 *
 * comprehensionLoad: complex - 218 frames (7.3s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Ba tầng xếp dọc, không chồng lên nhau: trục thời gian (330-510), bản đồ căn
 * cứ (560-940), cổng gác (960-1202). Bản đồ dùng MapPanel vì ghim của
 * MapGraphic neo ở tâm KHUNG HÌNH - cắt bằng overflow:hidden sẽ đẩy ghim ra
 * ngoài vùng nhìn thấy.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, Timeline, DrawnText } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapPanel } from "./MapGraphic";

export const V11SCENE6_DURATION = 218;

export const V11Scene6 = () => (
  <AbsoluteFill name="V11Scene6">
    <SceneBackground variant="chart" />

    <Timeline
      y={500}
      x={70}
      width={940}
      events={[
        { label: "THẾ KỶ 16", sub: "khu tạm cư", delay: 0 },
        { label: "CHIẾN TRANH", sub: "Triều Tiên", delay: 26 },
        { label: "THẾ KỶ 20", sub: "căn cứ Mỹ", delay: 52 },
      ]}
    />

    <Sequence from={97} layout="none">
      <PunchPhrase lines={["CĂN CỨ MỸ", "NGAY SÁT BÊN"]} top={168} fontSize={56} />
      <MapPanel x={60} y={690} width={960} height={300}
                center={[126.9800, 37.5335]} zoom={14} style={LOCAL_RASTER_STYLE}
                label="CĂN CỨ YONGSAN" sublabel="sát cạnh Itaewon"
                delay={0} pinDelay={14} tint={0.16} />
    </Sequence>

    <Sequence from={134} layout="none">
      <Support name="Sup-Base" src="el11_us_base_gate.png" width={430} x={90} y={1010}
               visibleFor={84} idle="bob" />
    </Sequence>

    {/* Tấm nền của dải thời gian. Ở cỡ chữ đọc được, mốc quay xuống mang
        thêm hai dòng cao 90px: nhãn cũ chạm đúng mép dưới tấm nền (y=580) và
        dòng phụ rơi hẳn ra ngoài, xuống thẳng chỗ bản đồ. Tấm nền cao lên
        350->670, bản đồ lùi xuống 700 và thấp bớt để không đè ảnh cổng gác. */}
    <DiagramCanvas y={340} height={340}>
      <DrawnPath d="M 70 10 L 1010 10 L 1010 330 L 70 330 Z" delay={0} drawFrames={18}
                 length={2520} strokeWidth={5} fill="rgba(26,26,26,0.19)" />
    </DiagramCanvas>

    <DiagramCanvas y={940} height={310}>
      <DrawnPath d="M 540 150 L 900 150 M 866 130 L 900 150 L 866 170"
                 delay={150} drawFrames={12} length={430} stroke="#C2410C" strokeWidth={8} />
      <DrawnText delay={150} x={730} y={86} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        SÁT VÁCH
      </DrawnText>
      <DrawnText delay={158} x={730} y={198} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 800 }}>
        ITAEWON
      </DrawnText>
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);

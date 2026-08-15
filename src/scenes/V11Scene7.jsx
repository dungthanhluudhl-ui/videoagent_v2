/**
 * S7 - Sự có mặt đó kéo theo cái gì?
 *
 * chuỗi nhân quả chạy từ căn cứ quân sự sang dịch vụ giải trí rồi thành khu phố Tây
 *
 * comprehensionLoad: complex - 155 frames (5.2s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";
import { IconCrowd } from "./iconVocabulary";

export const V11SCENE7_DURATION = 155;

const Node = ({ y, label, delay }) => (
  <g>
    <DrawnPath d={`M 70 ${y} L 640 ${y} L 640 ${y + 96} L 70 ${y + 96} Z`}
               delay={delay} drawFrames={14} length={1330} stroke="#F2EFE7" strokeWidth={6} />
    <DrawnText delay={delay + 6} x={355} y={y + 64} textAnchor="middle" fill="#F2EFE7"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
      {label}
    </DrawnText>
  </g>
);

export const V11Scene7 = () => (
  <AbsoluteFill name="V11Scene7">
    <BackgroundPhoto name="Bg-Neon" src="el10_neon_night.png" durationInFrames={155}
                     tint={0.55} focus="50% 45%" drift={0.08} />

    <DiagramCanvas y={330} height={470}>
      <Node y={10} label="CĂN CỨ QUÂN SỰ" delay={36} />
      <DrawnPath d="M 355 106 L 355 160 M 335 140 L 355 160 L 375 140"
                 delay={50} drawFrames={8} length={90} stroke="#C2410C" strokeWidth={7} />
      <Node y={166} label="DỊCH VỤ GIẢI TRÍ" delay={54} />
      <DrawnPath d="M 355 262 L 355 316 M 335 296 L 355 316 L 375 296"
                 delay={68} drawFrames={8} length={90} stroke="#C2410C" strokeWidth={7} />
      <Node y={322} label="HỘP ĐÊM" delay={72} />
    </DiagramCanvas>

    <Sequence from={36} layout="none">
      <Support name="Sup-Bar" src="el10_bar_neon.png" width={300} x={660} y={800}
               visibleFor={119} />
    </Sequence>

    <Sequence from={104} layout="none">
      <PunchPhrase lines={["KHU PHỐ TÂY"]} top={180} fontSize={70} onDark />
    </Sequence>

    <DiagramCanvas y={800} height={450}>
      <DrawnPath d="M 355 20 L 355 120 M 335 100 L 355 120 L 375 100"
                 delay={104} drawFrames={10} length={140} stroke="#C2410C" strokeWidth={8} />
      {/* Khung nới từ 70..600 ra 50..620: ở cỡ chữ đọc được nhãn rộng 520px,
          khung cũ chỉ rộng 530px nên chữ chạm hai vách. Nới khung, không thu
          chữ - chữ là thứ người xem phải đọc được. */}
      <DrawnPath d="M 50 140 L 620 140 L 620 250 L 50 250 Z" delay={112} drawFrames={14}
                 length={1380} stroke="#C2410C" strokeWidth={7} />
      <DrawnText delay={112} x={335} y={210} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        SÔI ĐỘNG BẬC NHẤT
      </DrawnText>
      {/* "người nước ngoài đổ về" - lời thoại đã nói câu này rồi, viết lại là
          bắt đọc lần thứ hai. Mũi tên phía trên đã mang nghĩa "đổ về"; chỉ còn
          thiếu "người", và một ký hiệu nói điều đó nhanh hơn bốn chữ. */}
      <IconCrowd x={335} y={318} size={124} delay={122} color="#F2EFE7" accent="#C2410C" />
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);

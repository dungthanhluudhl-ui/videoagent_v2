/**
 * S10 - Quốc tế nhất, vậy trông nó ra sao?
 *
 * hộ chiếu nhiều nước xoè ra rồi bị nửa khung ngôi làng đẩy lấn sang
 *
 * comprehensionLoad: moderate - 131 frames (4.4s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE10_DURATION = 131;

export const V11Scene10 = () => (
  <AbsoluteFill name="V11Scene10">
    <SceneBackground variant="card" />

    <Sequence from={0} layout="none">
      <Hero name="Hero-Passports" src="el10_passport_flags.png" width={720} x={60} y={330}
            variant="flip" visibleFor={131} />
    </Sequence>

    <DiagramCanvas y={300} height={950}>
      {/* nhãn nửa trái: kỳ vọng */}
      {/* Cột trái đã kín: hero chiếm y 330-967, dãy nhà vẽ tay 956-1080. Nhãn
          này không có chỗ nào để né ra, và nó vốn là chú thích CHO chính bức
          ảnh hộ chiếu - nên nó nằm trên ảnh, có nền để đọc được, và khai báo
          overlayOn để nói rõ đây là chủ ý chứ không phải va chạm bỏ sót. */}
      <DrawnText delay={0} x={70} y={40} fill="#1A1A1A" overlayOn="Hero-Passports" plate
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>
        QUỐC TẾ NHẤT
      </DrawnText>
      <DrawnPath d="M 70 60 L 620 60" delay={8} drawFrames={12} length={550}
                 stroke="#C2410C" strokeWidth={6} />

      {/* vạch chia hai nửa, kẻ xuống khi nửa kia sắp xuất hiện */}
      <DrawnPath d="M 770 20 L 770 900" delay={100} drawFrames={20} length={880}
                 strokeWidth={5} dashed />
      <DrawnPath d="M 90 300 L 700 300 L 700 560 L 90 560 Z" delay={20} drawFrames={18}
                 length={1740} strokeWidth={5} fill="rgba(194,65,12,0.16)" />

      <DrawnText delay={100} x={900} y={410} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 32, fontWeight: 900 }}>
        NHƯNG
      </DrawnText>

      {/* dải nhà thấp vẽ tay ở nửa dưới bên trái - "trông như một ngôi làng" */}
      <DrawnPath d="M 70 780 L 700 780" delay={104} drawFrames={16} length={630}
                 strokeWidth={6} />
      <DrawnPath d="M 110 780 L 110 700 L 210 656 L 310 700 L 310 780 Z" delay={108}
                 drawFrames={14} length={460} strokeWidth={5} fill="rgba(26,26,26,0.19)" />
      <DrawnPath d="M 340 780 L 340 716 L 430 678 L 520 716 L 520 780 Z" delay={114}
                 drawFrames={14} length={440} strokeWidth={5} fill="rgba(26,26,26,0.19)" />
      <DrawnPath d="M 550 780 L 550 724 L 630 690 L 710 724 L 710 780 Z" delay={120}
                 drawFrames={14} length={420} strokeWidth={5} fill="rgba(26,26,26,0.19)" />
      <DrawnText delay={124} x={390} y={848} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
        nhà thấp, ngõ nhỏ
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={0} layout="none">
      <Support name="Sup-Village" src="el10_commerce_day.png" width={230} x={810} y={740}
               visibleFor={131} />
    </Sequence>

    <Sequence from={86} layout="none">
      <PunchPhrase lines={["LÀNG TRONG PHỐ"]} top={186} fontSize={66} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

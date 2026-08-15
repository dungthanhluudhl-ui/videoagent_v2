/**
 * S24 - Con hẻm đó lớn cỡ nào, và kích thước đó gây ra chuyện gì?
 *
 * mặt bằng con hẻm được vẽ ra, đo chiều dài 41-45m, rồi chỗ thắt 3,2m siết lại
 * và hai dòng người từ hai đầu đâm vào nhau
 *
 * comprehensionLoad: complex - 286 frames (9.5s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Cảnh chốt và cũng là cảnh dài nhất video: bốn tầng vẽ, mỗi tầng một nhịp
 * (97 / 141 / 211 / 260). Kích thước tĩnh phải biến thành cái bẫy động ngay
 * trong cùng một khung - đó là toàn bộ lý do đoạn này tồn tại.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import {
  BackgroundPhoto, DiagramCanvas, DimensionLine, DrawnPath, ForceArrow, DrawnText } from "./visualLanguage";

export const V11SCENE24_DURATION = 286;

export const V11Scene24 = () => (
  <AbsoluteFill name="V11Scene24">
    <BackgroundPhoto name="Bg-AlleyNight" src="el10_alley_night.png" durationInFrames={286}
                     tint={0.6} focus="50% 55%" drift={0.05} />

    <Sequence from={211} layout="none">
      <PunchPhrase lines={["3,2M CHỖ THẮT", "HAI DÒNG ĐÂM NHAU"]} top={158} fontSize={58} onDark />
    </Sequence>

    {/* tầng 1 (97) - mặt bằng con hẻm và chiều dài của nó */}
    <DiagramCanvas y={352} height={300}>
      <DrawnPath d="M 90 60 L 990 60" delay={97} drawFrames={22} length={900}
                 stroke="#F2EFE7" strokeWidth={8} />
      <DrawnPath d="M 90 220 L 990 220" delay={103} drawFrames={22} length={900}
                 stroke="#F2EFE7" strokeWidth={8} />
      <DimensionLine x1={90} y1={150} x2={990} y2={150} label="41-45m" delay={118}
                     offset={0} fontSize={48} />
    </DiagramCanvas>

    {/* tầng 2 (141) - chỗ thắt nút, đo ngang */}
    <DiagramCanvas y={664} height={240}>
      <DrawnPath d="M 430 20 L 430 200" delay={141} drawFrames={12} length={180}
                 stroke="#F2EFE7" strokeWidth={8} />
      <DrawnPath d="M 650 20 L 650 200" delay={147} drawFrames={12} length={180}
                 stroke="#F2EFE7" strokeWidth={8} />
      <DimensionLine x1={430} y1={110} x2={650} y2={110} label="3,2m" delay={162}
                     offset={0} fontSize={44} />
      <DrawnText delay={147} x={200} y={120} textAnchor="middle" fill="#F2EFE7"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 800 }}>
        chỗ thắt nút
      </DrawnText>
    </DiagramCanvas>

    {/* tầng 3 (211) - hai vách bóp lại thành cái phễu.
        Nhãn trước đây nằm ngay trong họng phễu: hai nét cam 9px sượt qua chân
        chữ, cách đúng 4px - đủ để hình render ra thành đường kẻ đè chữ. Phễu
        kéo lên trên (kết thúc ở y=180), nhãn hạ xuống dưới hẳn phễu. */}
    <DiagramCanvas y={880} height={280}>
      <DrawnPath d="M 70 10 L 430 80 L 430 110 L 70 180" delay={211} drawFrames={18}
                 length={860} stroke="#C2410C" strokeWidth={9} />
      <DrawnPath d="M 1010 10 L 650 80 L 650 110 L 1010 180" delay={217} drawFrames={18}
                 length={860} stroke="#C2410C" strokeWidth={9} />
      <DrawnText delay={217} x={540} y={250} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        PHỄU THẮT NGHẸT
      </DrawnText>
    </DiagramCanvas>

    {/* tầng 4 (260) - hai dòng người đi ngược chiều đâm vào chỗ thắt */}
    <DiagramCanvas y={1090} height={200}>
      <ForceArrow x={70} y={70} length={380} delay={260} label="LÊN BẮC"
                  thickness={26} travelFrames={14} />
      <ForceArrow x={1010} y={150} length={380} delay={266} label="XUỐNG NAM"
                  thickness={26} travelFrames={14} direction={-1} />
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);

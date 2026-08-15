/**
 * S21 - Vậy họ vào từ đâu?
 *
 * sơ đồ Bắc - Nam dựng lên: đích đến ở đầu Bắc, ga tàu và bến xe ở đầu Nam
 *
 * comprehensionLoad: complex - 224 frames (7.5s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Đây là nghịch lý hình học của cả câu chuyện: nơi người ta MUỐN tới và nơi
 * người ta BUỘC phải xuống nằm ở hai đầu đối nhau. Phải thấy trục Bắc-Nam thì
 * mọi thứ sau đó mới có nghĩa, nên nó được vẽ trước khi ảnh ga tàu xuất hiện.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE21_DURATION = 224;

export const V11Scene21 = () => (
  <AbsoluteFill name="V11Scene21">
    <SceneBackground variant="chart" />

    <DiagramCanvas y={300} height={640}>
      {/* trục dọc Bắc - Nam */}
      <DrawnPath d="M 540 40 L 540 560" delay={0} drawFrames={26} length={520} strokeWidth={8} />
      <DrawnPath d="M 540 40 L 510 96 M 540 40 L 570 96" delay={22} drawFrames={8}
                 length={130} stroke="#C2410C" strokeWidth={8} />
      <DrawnText delay={22} x={600} y={64} fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        BẮC
      </DrawnText>
      <DrawnText delay={22} x={600} y={596} fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        NAM
      </DrawnText>

      {/* đầu Bắc: đích đến */}
      {/* Ô cao 100px chứa hai dòng 34px và 28px - vừa đủ khi chữ nhỏ đến mức
          không đọc được. Ở cỡ đọc được, hai dòng chồng lên nhau và lên cả đáy
          ô. Ô cao lên 128px, hai dòng giãn ra. */}
      <DrawnPath d="M 80 96 L 470 96 L 470 224 L 80 224 Z" delay={30} drawFrames={16}
                 length={1036} stroke="#C2410C" strokeWidth={7} />
      <DrawnText delay={30} x={275} y={150} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        PHỐ ẨM THỰC
      </DrawnText>
      <DrawnText delay={38} x={275} y={206} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 700 }}>
        họ muốn tới đây
      </DrawnText>

      {/* đầu Nam: lối vào */}
      <DrawnPath d="M 610 396 L 1000 396 L 1000 524 L 610 524 Z" delay={60} drawFrames={16}
                 length={1036} strokeWidth={7} />
      {/* "GA TÀU · BẾN XE" ở cỡ đọc được rộng 440px, tràn khỏi ô 390px. Ảnh
          cửa ga ngay bên dưới đã nói phần "bến xe" là thừa. */}
      <DrawnText delay={60} x={805} y={450} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        GA TÀU
      </DrawnText>
      <DrawnText delay={68} x={805} y={506} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 700 }}>
        họ xuống ở đây
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={85} layout="none">
      <Support name="Sup-Station" src="el11_subway_entrance.png" width={400} x={80} y={960}
               visibleFor={139} idle="bob" />
    </Sequence>

    {/* khoảng cách giữa hai đầu, ghi rõ để nối sang S22 */}
    <DiagramCanvas y={940} height={310}>
      <DrawnPath d="M 540 240 L 540 60 M 516 96 L 540 60 L 564 96" delay={130}
                 drawFrames={14} length={230} stroke="#C2410C" strokeWidth={9} />
      <DrawnText delay={130} x={790} y={140} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        PHẢI ĐI LÊN
      </DrawnText>
      <DrawnText delay={138} x={790} y={196} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 700 }}>
        NAM → BẮC
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={115} layout="none">
      <PunchPhrase lines={["ĐÍCH Ở BẮC", "GA Ở NAM"]} top={176} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

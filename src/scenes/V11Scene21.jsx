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
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 900 }}>
        BẮC
      </DrawnText>
      <DrawnText delay={22} x={600} y={556} fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 40, fontWeight: 900 }}>
        NAM
      </DrawnText>

      {/* đầu Bắc: đích đến */}
      <DrawnPath d="M 80 100 L 470 100 L 470 200 L 80 200 Z" delay={30} drawFrames={16}
                 length={980} stroke="#C2410C" strokeWidth={7} />
      <DrawnText delay={30} x={275} y={148} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900 }}>
        PHỐ ẨM THỰC
      </DrawnText>
      <DrawnText delay={38} x={275} y={186} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 28, fontWeight: 700 }}>
        họ muốn tới đây
      </DrawnText>

      {/* đầu Nam: lối vào */}
      <DrawnPath d="M 610 400 L 1000 400 L 1000 500 L 610 500 Z" delay={60} drawFrames={16}
                 length={980} strokeWidth={7} />
      <DrawnText delay={60} x={805} y={448} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 900 }}>
        GA TÀU · BẾN XE
      </DrawnText>
      <DrawnText delay={68} x={805} y={486} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 28, fontWeight: 700 }}>
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
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 36, fontWeight: 900 }}>
        PHẢI ĐI LÊN
      </DrawnText>
      <DrawnText delay={138} x={790} y={196} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 30, fontWeight: 700 }}>
        NAM → BẮC
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={115} layout="none">
      <PunchPhrase lines={["ĐÍCH Ở BẮC", "GA Ở NAM"]} top={176} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

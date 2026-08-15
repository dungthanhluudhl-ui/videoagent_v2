/**
 * S3 - Dân thời đó gọi nơi này là gì?
 *
 * ba chữ Dị Thái Viện được viết ra rồi đóng khung như một tấm biển
 *
 * comprehensionLoad: moderate - 102 frames (3.4s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Ba âm tiết dựng thành ba tấm biển riêng rồi mới ghép lại: cái tên là thứ
 * cảnh này giải thích, nên nó phải được VIẾT RA trước mắt người xem chứ không
 * chỉ nằm trong câu punch.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V11SCENE3_DURATION = 102;

const Plaque = ({ x, text, delay }) => (
  <g>
    <DrawnPath d={`M ${x} 40 L ${x + 280} 40 L ${x + 280} 250 L ${x} 250 Z`}
               delay={delay} drawFrames={14} length={980} strokeWidth={7} />
    <DrawnPath d={`M ${x + 18} 58 L ${x + 262} 58 L ${x + 262} 232 L ${x + 18} 232 Z`}
               delay={delay + 6} drawFrames={12} length={840} strokeWidth={3} opacity={0.45} />
    <DrawnText delay={delay + 8} x={x + 140} y={168} textAnchor="middle" fill="#1A1A1A"
          style={{ fontFamily: "Be Vietnam Pro", fontSize: 74, fontWeight: 900 }}>
      {text}
    </DrawnText>
  </g>
);

export const V11Scene3 = () => (
  <AbsoluteFill name="V11Scene3">
    <SceneBackground variant="spotlight" />

    <DiagramCanvas y={300} height={380}>
      <Plaque x={60} text="DỊ" delay={0} />
      <Plaque x={400} text="THÁI" delay={10} />
      <Plaque x={740} text="VIỆN" delay={20} />
      {/* thanh treo nối ba tấm lại thành MỘT tấm biển */}
      <DrawnPath d="M 60 300 L 1020 300" delay={34} drawFrames={16} length={960}
                 stroke="#C2410C" strokeWidth={8} />
    </DiagramCanvas>

    <Sequence from={0} layout="none">
      <Support name="Sup-Paper" src="el10_archive_paper.png" width={480} x={240} y={870}
               visibleFor={102} idle="bob" />
    </Sequence>

    {/* cột niên đại bên phải, cân lại khối giấy lệch trái */}
    <DiagramCanvas y={860} height={390}>
      <DrawnPath d="M 890 20 L 890 330" delay={40} drawFrames={18} length={320} strokeWidth={6} />
      <DrawnText delay={40} x={950} y={120} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
        DÂN
      </DrawnText>
      <DrawnText delay={46} x={950} y={172} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 34, fontWeight: 800 }}>
        GỌI
      </DrawnText>
      <DrawnText delay={52} x={950} y={236} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 30, fontWeight: 900 }}>
        THẾ KỶ
      </DrawnText>
      <DrawnText delay={58} x={950} y={282} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        16
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={57} layout="none">
      <PunchPhrase lines={["DỊ THÁI VIỆN"]} top={704} fontSize={72} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

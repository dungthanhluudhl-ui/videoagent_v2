/**
 * S22 - Từ ga lên phố ẩm thực đi bằng đường nào?
 *
 * dòng người từ đầu Nam bị dồn vào những con hẻm ngang nhỏ
 *
 * comprehensionLoad: complex - 125 frames (4.2s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Chữ "buộc phải" là bản lề của cả đoạn: không phải người ta chọn đi hẻm, mà
 * địa hình không chừa đường nào khác - nên các lối khác phải bị gạch đi ngay
 * trên hình, không chỉ nói bằng lời.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText, ForceArrow } from "./visualLanguage";

export const V11SCENE22_DURATION = 125;

export const V11Scene22 = () => (
  <AbsoluteFill name="V11Scene22">
    <SceneBackground variant="grid" />

    {/* hai trục đường lớn, các con hẻm ngang nối giữa chúng */}
    <DiagramCanvas y={392} height={520}>
      <DrawnPath d="M 70 60 L 1010 60" delay={0} drawFrames={20} length={940}
                 stroke="#C2410C" strokeWidth={9} />
      <DrawnText delay={0} x={70} y={38} fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        PHỐ ẨM THỰC (BẮC)
      </DrawnText>
      <DrawnPath d="M 70 440 L 1010 440" delay={6} drawFrames={20} length={940}
                 strokeWidth={9} />
      <DrawnText delay={6} x={70} y={492} fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        ĐƯỜNG ITAEWON (NAM)
      </DrawnText>
      {[180, 400, 620, 840].map((x, i) => (
        <DrawnPath key={x} d={`M ${x} 440 L ${x} 60`} delay={20 + i * 6} drawFrames={12}
                   length={380} strokeWidth={5} />
      ))}
      {/* Nhãn này nằm giữa lưới bốn con hẻm dọc, nên bốn nét dọc chạy xuyên
          qua chữ. `plate` cắt nền cho chữ đứng, đúng cách một bản đồ thật đặt
          tên đường lên trên lưới đường. */}
      <DrawnText delay={30} x={540} y={266} textAnchor="middle" fill="#1A1A1A" plate
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 800 }}>
        CHỈ CÓ HẺM NHỎ
      </DrawnText>
    </DiagramCanvas>

    {/* dòng người bị dồn vào hẻm */}
    <DiagramCanvas y={860} height={390}>
      <DrawnPath d="M 70 200 L 1010 200" delay={23} drawFrames={18} length={940}
                 strokeWidth={5} dashed />
      <ForceArrow x={90} y={120} length={340} delay={23} label="TỪ GA TÀU"
                  thickness={22} travelFrames={16} />
      <DrawnPath d="M 560 60 L 560 300 M 620 60 L 620 300" delay={44} drawFrames={14}
                 length={240} strokeWidth={7} />
      <DrawnText delay={44} x={590} y={356} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        HẺM NGANG
      </DrawnText>
      <ForceArrow x={660} y={180} length={320} delay={60} label="" thickness={22}
                  travelFrames={16} />
      <DrawnPath d="M 760 60 L 980 60 M 760 60 L 980 60" delay={72} drawFrames={10}
                 length={220} strokeWidth={5} opacity={0.4} />
      <DrawnPath d="M 780 40 L 960 96 M 960 40 L 780 96" delay={78} drawFrames={10}
                 length={220} stroke="#C2410C" strokeWidth={7} />
      <DrawnText delay={78} x={860} y={140} textAnchor="middle" fill="#1A1A1A" opacity={0.65}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 700 }}>
        không lối khác
      </DrawnText>
    </DiagramCanvas>

    <Sequence from={52} layout="none">
      <PunchPhrase lines={["BUỘC QUA HẺM NGANG"]} top={188} fontSize={62} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

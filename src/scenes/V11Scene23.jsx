/**
 * S23 - Con hẻm xảy ra chuyện nằm ở đâu?
 *
 * bản đồ phóng vào đúng con hẻm, đầu Nam của nó chạm ngay lối ra số 1
 *
 * comprehensionLoad: complex - 148 frames (4.9s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Zoom 18 - mức cache sâu nhất - vì đây là lần duy nhất cả video cần thấy MỘT
 * con hẻm chứ không phải một khu phố. Biển "lối ra số 1" để trống trong ảnh
 * nguồn, chữ số do code viết đè lên: model sinh chữ Hàn/Anh sẽ ra ký tự sai.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, Support } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";
import { IconCrowd } from "./iconVocabulary";
import { LOCAL_RASTER_STYLE, MapGraphic } from "./MapGraphic";

export const V11SCENE23_DURATION = 148;

export const V11Scene23 = () => (
  <AbsoluteFill name="V11Scene23">
    <MapGraphic center={[126.9944, 37.5343]} zoom={16} style={LOCAL_RASTER_STYLE}
                label="CON HẺM" sublabel="đầu phía Nam"
                delay={0} pinDelay={18} tint={0.22} />

    <Sequence from={59} layout="none">
      <PunchPhrase lines={["SÁT LỐI RA SỐ 1"]} top={196} fontSize={68} />
      <Support name="Sup-Exit1" src="el11_subway_exit1.png" width={380} x={620} y={860}
               visibleFor={89} idle="bob" />
    </Sequence>

    {/* số hiệu lối ra viết đè lên tấm biển để trống của ảnh nguồn */}
    <DiagramCanvas y={940} height={310}>
      <DrawnPath d="M 120 120 L 560 120 M 526 96 L 560 120 L 526 144" delay={70}
                 drawFrames={14} length={480} stroke="#C2410C" strokeWidth={9} />
      <DrawnText delay={70} x={330} y={74} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 900 }}>
        ĐẦU NAM CỦA HẺM
      </DrawnText>
      <DrawnPath d="M 856 30 L 916 30 L 916 118 L 856 118 Z" delay={86} drawFrames={12}
                 length={300} stroke="#C2410C" strokeWidth={6} />
      <DrawnText delay={86} overlayOn="Sup-Exit1" x={886} y={98} textAnchor="middle" fill="#C2410C"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 54, fontWeight: 900 }}>
        1
      </DrawnText>
      {/* "người từ ga đổ thẳng vào" - lời thoại đang nói đúng câu này. Ký hiệu
          đám đông đặt ngay đầu lối ra nói cùng một điều, không tốn lượt đọc. */}
      <IconCrowd x={330} y={196} size={110} delay={94} />
    </DiagramCanvas>

    <BottomBar />
  </AbsoluteFill>
);

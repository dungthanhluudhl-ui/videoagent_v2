/**
 * S18 - Đến mấy giờ thì bắt đầu nguy hiểm?
 *
 * đồng hồ chỉ 8 giờ tối, mặt cắt lối đi hẹp lại và các mũi tên bắt đầu chèn nhau
 *
 * comprehensionLoad: complex - 152 frames (5.1s)
 * Generated from input/scene_plan11.json; check with build_gate.py.
 *
 * Lần đầu THỜI GIAN và KHÔNG GIAN đứng chung một khung: mốc giờ ở trên, mặt
 * cắt lối đi ở dưới - đó là điều kiện để phần sau nói về cái phễu.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground } from "./shared";
import { DiagramCanvas, DrawnPath, DrawnText, ForceArrow } from "./visualLanguage";
import { IconClock, IconDensity } from "./iconVocabulary";

export const V11SCENE18_DURATION = 152;

export const V11Scene18 = () => (
  <AbsoluteFill name="V11Scene18">
    <SceneBackground variant="chart" />

    {/* mặt đồng hồ chỉ 20:00 */}
    <DiagramCanvas y={330} height={430}>
      {/* Mặt đồng hồ cũ có tâm ở y=40 nhưng hai kim lại vẽ từ y=190 - tức từ
          MÉP DƯỚI của vòng tròn, nên kim treo lơ lửng ngoài mặt đồng hồ. Đó là
          lỗi sinh ra khi hình học được gõ lại ở từng cảnh. IconClock tính kim
          từ chính tâm nó, nên lỗi này không thể lặp lại. */}
      {/* size 300 -> 240, y 150 -> 170: mặt đồng hồ cũ trải từ y=330 đến
          y=630 tuyệt đối, chồng lên cả chân câu punch (kết thúc ở 331) lẫn
          đầu dòng "20:00" (bắt đầu ở 608). Một ký hiệu chiếm chỗ như một bức
          ảnh nhỏ và phải được đo như một bức ảnh nhỏ. */}
      <IconClock x={540} y={170} size={240} delay={0} hourAngle={240} minuteAngle={0} />
      <DrawnText delay={32} x={540} y={352} textAnchor="middle" fill="#1A1A1A"
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 66, fontWeight: 900, letterSpacing: 6 }}>
        20:00
      </DrawnText>
      <DrawnText delay={40} x={540} y={414} textAnchor="middle" fill="#1A1A1A" opacity={0.7}
            style={{ fontFamily: "Be Vietnam Pro", fontSize: 44, fontWeight: 700 }}>
        trên các lối đi
      </DrawnText>
    </DiagramCanvas>

    {/* mặt cắt lối đi: hai vách khép lại, hai luồng người ép vào nhau */}
    <DiagramCanvas y={790} height={460}>
      <DrawnPath d="M 70 40 L 1010 40" delay={80} drawFrames={18} length={940} strokeWidth={8} />
      <DrawnPath d="M 70 300 L 1010 300" delay={86} drawFrames={18} length={940} strokeWidth={8} />
      <DrawnPath d="M 260 40 L 380 170 L 260 300 L 70 300 L 70 40 Z" delay={100} drawFrames={14}
                 length={900} strokeWidth={6} fill="rgba(26,26,26,0.19)" />
      <DrawnPath d="M 820 40 L 700 170 L 820 300 L 1010 300 L 1010 40 Z" delay={106} drawFrames={14}
                 length={900} strokeWidth={6} fill="rgba(26,26,26,0.19)" />
      <ForceArrow x={90} y={128} length={280} delay={112} label="" thickness={20}
                  travelFrames={14} />
      <ForceArrow x={990} y={212} length={280} delay={118} label="" thickness={20}
                  travelFrames={14} direction={-1} />
      {/* Hai mũi tên đã cho thấy LỰC ép từ hai phía; ô lưới cho thấy KẾT QUẢ -
          chỗ trống còn lại bao nhiêu. Chữ "chen chúc" chỉ khẳng định điều đó
          bằng lời, đúng lúc lời thoại cũng đang nói y như vậy. */}
      <IconDensity x={540} y={170} size={210} delay={118} fill={0.92} />
    </DiagramCanvas>

    <Sequence from={19} layout="none">
      <PunchPhrase lines={["8 GIỜ TỐI", "BẮT ĐẦU CHEN"]} top={170} fontSize={60} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

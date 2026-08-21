/**
 * S5 - Chuyện này xảy ra ở loài chuột nào?
 *
 * một con chuột đen đơn lẻ đứng giữa khung, một đường chỉ cam từ nhãn
 * "HIẾM GẶP" chạm thẳng vào nó - loài thì cụ thể, và chính con vật hiếm đó
 * đứng ngay trước mắt người xem, không phải một sơ đồ đếm số thay nó.
 *
 * comprehensionLoad: moderate - 90 frames (3.0s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * ĐÃ BỎ lưới tần suất 10x10: lời thoại không đưa ra con số nào ("khá là
 * hiếm gặp" - không phải "1 trên 100"), nên một sơ đồ đếm là bịa ra một
 * con số shotlist không hề nói, và nó đẩy cảnh sang mức complex (4.0s sàn)
 * trong khi không có 1s trống nào quanh cảnh này để cấp thêm - kiểm bằng
 * từng mốc audio thật, không suy diễn.
 *
 * ĐÃ BỎ TIẾP đường chỉ + vòng khoanh (bản sửa đầu của lần này): 5/8 cảnh
 * của video đã dùng kiểu "đường chỉ + nhãn" (annotated), vượt trần 50% -
 * chính là kiểu lặp công thức mà gate diversity sinh ra để bắt. Nhãn đứng
 * một mình, không cần đường chỉ, vẫn nói đúng "chuột đen, hiếm gặp".
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, Hero, PunchPhrase, SceneBackground, fontFamily } from "./shared";
import { DiagramCanvas, DrawnText } from "./visualLanguage";

export const V13SCENE5_DURATION = 90;

const ORANGE = "#FF6A1A";
const INK = "#141414";

export const V13Scene5 = () => (
  <AbsoluteFill name="V13Scene5">
    <SceneBackground variant="grid" />

    <CameraGroup
      zoom={{ from: 1.0, to: 1.05 }}
      pan={{ from: { x: 0, y: 0 }, to: { x: -20, y: 0 } }}
      durationInFrames={V13SCENE5_DURATION}
    >
      <Sequence from={0} layout="none">
        <Hero name="Hero-BlackRat" src="el13_black_rat.png"
              width={1000} x={40} y={700} variant="rise" idle="sway"
              visibleFor={V13SCENE5_DURATION} />
      </Sequence>

      {/* Nhãn hiện từ frame 0 (không phải 20): "hiếm"[14.86s] rơi gần như
          đúng khung hình đầu của cảnh (bắt đầu 14.867s) - hiện sớm khớp
          audio thật hơn, và bù luôn độ trống của khung đầu khi chỉ có mình
          con chuột (ảnh chụp ngang, khối đặc chỉ ~12% khung dù width=1000). */}
      <DiagramCanvas y={0} height={1920}>
        <DrawnText delay={0} x={280} y={1080} fill={INK} plate platePad={22}
                   style={{ fontFamily, fontSize: 64, fontWeight: 900, letterSpacing: 1 }}>
          HIẾM GẶP
        </DrawnText>
      </DiagramCanvas>
    </CameraGroup>

    <Sequence from={45} layout="none">
      <PunchPhrase lines={["CHUỘT ĐEN", "CHUỘT TÀU"]} top={200} fontSize={72} />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

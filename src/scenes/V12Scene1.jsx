/**
 * S1 - Vì sao triều đình lại dựng riêng một khu ở đúng chỗ này?
 *
 * khung cảnh cung đình lùi ra sau thành nền, bản đồ thật tiến lên, rồi một
 * vòng khoanh siết lại đúng mảnh đất được cấp
 *
 * comprehensionLoad: moderate - 102 frames (3.4s)
 * Generated from input/scene_plan12.json; check with build_gate.py.
 *
 * V11 mở cùng đoạn lời này bằng `document` (cuộn chiếu chỉ). Ở đây cố ý đổi
 * sang `map`: câu thoại có hai chữ "tại đây", và một toạ độ thật trả lời được
 * chữ đó, còn một tờ giấy thì không.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, fontFamily } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";
import { LOCAL_RASTER_STYLE, MapPanel } from "./MapGraphic";

export const V12SCENE1_DURATION = 102;

export const V12Scene1 = () => (
  <AbsoluteFill name="V12Scene1">
    {/* wash="paper" chứ không phải "ink": ảnh nguồn vốn đã tối (chùa lúc
        hoàng hôn), đẩy tint mực lên chỉ làm nó tối thêm - đã trả giá ở V10/S25 */}
    <BackgroundPhoto
      name="Bg-Court"
      src="el10_temple_dusk.png"
      durationInFrames={102}
      wash="paper"
      // 0.55 cộng với 18 khung fade-in làm nửa giây đầu của cảnh gần như
      // trắng trơn - đúng cái "khung hình trống" đã bị phàn nàn. 0.36 giữ
      // được mặt giấy cho tiêu đề mực mà ảnh vẫn có mặt ngay từ đầu.
      tint={0.36}
      grayscale={0.8}
      focus="50% 38%"
      drift={0.05}
    />

    <Sequence from={34} layout="none">
      <PunchPhrase
        lines={["MỘT KHU RIÊNG", "GIỮA KINH THÀNH"]}
        top={200}
        left={90}
        right={90}
        fontSize={62}
      />
    </Sequence>

    <Sequence from={34} layout="none">
      <MapPanel
        x={60}
        y={700}
        width={960}
        height={560}
        center={[126.9945, 37.5345]}
        // Đã thử z16 theo khuyến nghị ghi trong MapGraphic.jsx ("cách chữa
        // thật cho bản đồ nhạt là zoom, không phải chỉnh màu") và render ra
        // so sánh: ở khung crop ngang 960x560 này z16 PHẲNG HƠN - ít nét
        // đường, nhiều mảng nhà. Khuyến nghị đó đúng cho bản đồ full-bleed,
        // không đúng cho panel bị crop. Giữ z15.
        zoom={15}
        style={LOCAL_RASTER_STYLE}
        label="KHU TẠM CƯ"
        delay={0}
        pinDelay={14}
        tint={0.05}
      />
    </Sequence>

    {/* Ở đây từng là một vòng khoanh nét đứt đồng tâm với pin. Phải bỏ, và lý
        do là CẤU TRÚC chứ không phải chỉnh số: MapGraphic mọc chồng nhãn
        thẳng lên từ chân pin, chồng nhãn rộng 393px trong khi vòng chỉ có bán
        kính 190 - không tồn tại bán kính nào vừa ôm được pin vừa lách được
        chữ. Vòng cắt ngang chip "KHU TẠM CƯ" và người xem đầu tiên nhìn ra
        ngay. text_gate nay có luật riêng chặn đúng chuyện này.

        Thay bằng thanh tỉ lệ: nói được đúng cái ý mà vòng khoanh định nói -
        "khu này to cỡ nào" - mà lại nằm ở góc panel không ai tranh, và là số
        THẬT (zoom 15 ở vĩ độ 37,53 cho 3,789 m mỗi pixel, nên 500 m = 132px)
        chứ không phải một diện tích bịa ra. */}
    <Sequence from={34} layout="none">
      <DiagramCanvas y={700} height={560}>
        <DrawnPath d="M 110 496 L 242 496" delay={16} drawFrames={16}
                   length={132} stroke="#C2410C" strokeWidth={7} />
        <DrawnPath d="M 110 488 L 110 508 M 242 488 L 242 508" delay={24}
                   drawFrames={8} length={40} stroke="#C2410C" strokeWidth={6} />
        <DrawnText delay={28} x={176} y={436} textAnchor="middle" fill="#1A1A1A" plate
                   style={{ fontFamily, fontSize: 44, fontWeight: 800, letterSpacing: 1 }}>
          500 m
        </DrawnText>
      </DiagramCanvas>
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

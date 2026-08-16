/**
 * S3 - Dân thời ấy gọi nơi này là gì?
 *
 * cái tên bật ra từ miệng đám đông chứ không phải từ công văn - bong bóng
 * thoại nở lên phía trên một hàng người, rồi ba chữ rơi vào trong
 *
 * comprehensionLoad: moderate - 104 frames (3.5s)
 * Generated from input/scene_plan12.json; check with build_gate.py.
 *
 * V11 đóng khung cái tên như một tấm biển (`document`). Đổi sang `quote` vì
 * lời thoại nói rõ "NGƯỜI DÂN thời bấy giờ đã GỌI" - đây là tiếng truyền
 * miệng, không phải văn bản; bong bóng thoại nói đúng điều đó, tấm biển thì
 * nói ngược lại.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath } from "./visualLanguage";
import { IconCrowd } from "./iconVocabulary";

export const V12SCENE3_DURATION = 104;

export const V12Scene3 = () => (
  <AbsoluteFill name="V12Scene3">
    <BackgroundPhoto
      name="Bg-Village"
      src="el11_hillside_houses.png"
      durationInFrames={104}
      wash="ink"
      tint={0.46}
      grayscale={0.9}
      focus="50% 45%"
      drift={0.05}
    />

    <DiagramCanvas y={520} height={720}>
      {/* thân bong bóng + đuôi chỉ thẳng xuống hàng người bên dưới.
          Bong bóng tô MỰC chứ không tô kem: text_gate bắt đúng chỗ này - chữ
          mực trên ảnh nền là một vệt mờ, mà `onDark` lại lật chữ sang màu
          sáng, nên một bong bóng kem sẽ nuốt luôn chữ sáng. Nền tối + chữ
          sáng là cặp duy nhất đọc được ở đây. */}
      <DrawnPath
        d="M 150 34 L 930 34 Q 960 34 960 64 L 960 236 Q 960 266 930 266 L 580 266 L 532 330 L 520 266 L 150 266 Q 120 266 120 236 L 120 64 Q 120 34 150 34 Z"
        delay={0}
        drawFrames={26}
        length={2300}
        fill="rgba(18,18,18,0.90)"
        stroke="#C2410C"
        strokeWidth={7}
      />
      {/* ký hiệu thay cho câu chữ: caption đã chạy nguyên lời thoại ở dưới,
          viết thêm "NGƯỜI DÂN" là bắt người xem đọc hai lần */}
      {/* color PHẢI là màu sáng: IconCrowd vẽ 3 người, hai người ngoài dùng
          `color` mặc định là màu mực - trên ảnh nền tối chúng tàng hình, chỉ
          còn mỗi hình `accent` màu cam đứng lẻ như một vệt bẩn. Đây đúng là
          bệnh "chữ chìm vào nền" ở dạng ký hiệu, và text_gate không thấy được
          vì nó chỉ soi chữ. */}
      <IconCrowd x={540} y={548} size={250} color="#F7F4EC" accent="#F97316" delay={14} />
    </DiagramCanvas>

    <Sequence from={45} layout="none">
      <PunchPhrase lines={["DỊ THÁI VIỆN"]} top={600} left={150} right={150} fontSize={78} onDark />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

/**
 * S2 - Nghe như siêu nhiên thì có nghĩa là phản khoa học không?
 *
 * quả cầu sáng đứng yên tại chỗ trong khi cách đọc nó đổi phe: nhãn bên
 * trái bị MỘT nét ngang cam gạch bỏ, còn giá đo bên phải sáng lên - trên
 * NGUYÊN một tấm ảnh, không cắt khung.
 *
 * comprehensionLoad: moderate - 184 frames (6.13s)
 * Dựng từ input/scene_plan13.json; kiểm bằng build_gate.py.
 *
 * ĐÃ BỎ đường kẻ chéo đứt nét từng chia khung làm hai vùng: hình học của nó
 * không neo vào bất cứ ranh giới thật nào trong ảnh (không theo cạnh mây,
 * không theo đường chân trời), nên nó chỉ là một nét trang trí không ai
 * đọc ra ý nghĩa - phản hồi trực tiếp. Hai nhãn (SIÊU NHIÊN bị gạch / THIẾT
 * BỊ ĐO được chỉ tới) tự chúng đã nói rõ "hai cách đọc, một cái bị loại"
 * mà không cần một đường kẻ hình học đứng giữa để "chia" khung hộ chúng.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, SceneBackground, fontFamily } from "./shared";
import { BackgroundPhoto, DiagramCanvas, DrawnPath, DrawnText } from "./visualLanguage";

export const V13SCENE2_DURATION = 184;

const ORANGE = "#FF6A1A";
const INK = "#141414";

export const V13Scene2 = () => (
  <AbsoluteFill name="V13Scene2">
    <SceneBackground variant="spotlight" />

    <CameraGroup
      zoom={{ from: 1.03, to: 1.03 }}
      pan={{ from: { x: 18, y: 0 }, to: { x: -18, y: 0 } }}
      durationInFrames={V13SCENE2_DURATION}
    >
      <BackgroundPhoto
        name="Bg-Orb"
        src="el13_luminous_orb.png"
        durationInFrames={V13SCENE2_DURATION}
        wash="ink"
        tint={0.3}
        grayscale={0.55}
        focus="50% 45%"
        drift={0.03}
      />

      <DiagramCanvas y={0} height={1920}>
        {/* phe TRÁI: cách đọc siêu nhiên - sẽ bị gạch ở nhịp sau */}
        <DrawnText delay={16} x={110} y={706} fill={INK} plate struck
                   style={{ fontFamily, fontSize: 52, fontWeight: 900, letterSpacing: 1 }}>
          SIÊU NHIÊN
        </DrawnText>

        {/* phe PHẢI: giá đo thật đứng ở chân khung, chấm cam neo vào nó */}
        <circle cx={896} cy={1344} r={13} fill={ORANGE} stroke="#F7F4EC" strokeWidth={3} />
        <DrawnPath d="M 896 1344 L 896 1215" delay={22} drawFrames={12} length={140}
                   stroke={ORANGE} strokeWidth={5} />
        <DrawnText delay={30} x={636} y={1186} fill={INK} plate
                   style={{ fontFamily, fontSize: 46, fontWeight: 800, letterSpacing: 1 }}>
          THIẾT BỊ ĐO
        </DrawnText>

        {/* nhịp 2: MỘT nét ngang gạch bỏ - đúng khuôn mẫu đã dùng ở V11/S8,S9,S15.
            Bản trước dùng hai nét chéo bắt chéo thành X: cùng độ dày nhưng mỗi
            chữ bị cắt hai lần theo suốt chiều cao, và người xem đọc đúng ra đó
            là "che mất chữ" chứ không phải "gạch bỏ". Một nét ngang xuyên qua
            đúng dải x-height thì đầu và chân chữ vẫn còn, mắt vẫn đọc được chữ
            TRƯỚC KHI hiểu là nó bị bác bỏ. */}
        <DrawnPath d="M 92 687 L 470 687" delay={75} drawFrames={10} length={380}
                   stroke={ORANGE} strokeWidth={9} />
      </DiagramCanvas>
    </CameraGroup>

    <Sequence from={75} layout="none">
      <PunchPhrase lines={["CHƯA CÓ", "LỜI GIẢI"]} top={300} fontSize={82} onDark />
    </Sequence>

    <BottomBar />
  </AbsoluteFill>
);

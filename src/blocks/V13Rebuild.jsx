/**
 * V13Rebuild — dựng lại hai cảnh V13 bằng block trích từ V10.
 *
 * Đây là phép đo CHUYỂN GIAO GIỮA HAI VIDEO, khác hẳn BlockProbe.jsx: ở đó
 * block dựng lại chính những cảnh đã sinh ra nó, nên khớp là chuyện đương
 * nhiên. Ở đây block phải dựng nội dung của một video khác, một chủ đề khác,
 * một phong cách dựng khác — và đó mới là câu hỏi thật.
 *
 * KẾT QUẢ PHỦ, đo trước khi viết: trong 8 cảnh V13, chỉ 2 cảnh có cặp
 * narrativeFunction × visualLanguage nằm trong `fits` của kho:
 *
 *   S1  hook       × background-photo  -> PhotoClaim
 *   S4  definition × document          -> DocFocus
 *   S2  paradox    × split/annotated   -> không block nào
 *   S3  transition × text-only         -> không
 *   S5  evidence   × cutout            -> không
 *   S6  reversal   × mockup            -> không (ChannelOutro chỉ nhận conclusion)
 *   S7  mechanism  × diagram           -> không
 *   S8  evidence   × data              -> không
 *
 * 2/8 = 25%. Kho block hiện phủ V10 tốt (14/26 = 54%) và phủ V13 kém, vì V13
 * là phong cách CHÚ THÍCH — ảnh nền thật với dấu cam neo vào chi tiết trong
 * ảnh — mà kho chưa có block nào cho nó.
 */

import { PhotoClaim } from "./PhotoClaim";
import { DocFocus } from "./DocFocus";
import { DrawnPath, DrawnText } from "../scenes/visualLanguage";
import { IconQuestion } from "../scenes/iconVocabulary";
import { fontFamily } from "../scenes/shared";

const ORANGE = "#FF6A1A";
const INK = "#141414";
const ARM = 54;

/** Khung góc neo vào một vùng cụ thể của bức ảnh. Toạ độ là của ĐÚNG bức ảnh
 *  đó, nên nó sống ở lớp chú thích chứ không sống trong block. */
const Bracket = ({ box: [x1, y1, x2, y2], delay }) => (
  <>
    {[`M ${x1} ${y1 + ARM} L ${x1} ${y1} L ${x1 + ARM} ${y1}`,
      `M ${x2} ${y2 - ARM} L ${x2} ${y2} L ${x2 - ARM} ${y2}`].map((d, i) => (
      <DrawnPath key={d} d={d} delay={delay + i * 3} drawFrames={10} length={120}
                 stroke={ORANGE} strokeWidth={8} />
    ))}
  </>
);

// ---------------------------------------------------------------- S1
export const V13S1Block = () => (
  <PhotoClaim
    name="V13S1Block"
    durationInFrames={127}
    photo="el13_science_montage.png"
    focus="50% 50%"
    mood="still"
    tint={0.34}
    grayscale={0.7}
    beats={[48]}
    punch={["CÓ THẬT.", "CHƯA AI HIỂU."]}
    place="middle"
    fontSize={76}
    annotateFrom={48}
    annotate={
      <>
        <Bracket box={[660, 205, 900, 400]} delay={0} />
        <Bracket box={[150, 845, 915, 1110]} delay={8} />
        <Bracket box={[200, 1185, 880, 1400]} delay={16} />
        <IconQuestion x={960} y={980} size={110} delay={22} />
      </>
    }
  />
);
export const V13S1_BLOCK_DURATION = 127;

// ---------------------------------------------------------------- S4
export const V13S4Block = () => (
  <DocFocus
    name="V13S4Block"
    durationInFrames={90}
    backdrop="card"
    doc="el13_ratking_hero.png"
    docWidth={900}
    docY={620}
    variant="rise"
    beats={[30]}
    punch={["VUA CHUỘT", "RAT KING"]}
    place="top"
    fontSize={80}
    annotateFrom={30}
    annotate={
      <>
        <circle cx={540} cy={820} r={16} fill="none" stroke={ORANGE} strokeWidth={7} />
        <DrawnPath d="M 540 838 Q 560 1010 640 1086" delay={4} drawFrames={14}
                   length={300} stroke={ORANGE} strokeWidth={6} />
        <DrawnText delay={16} x={604} y={1148} fill={INK}
                   style={{ fontFamily, fontSize: 48, fontWeight: 900, letterSpacing: 1 }}>
          NÚT ĐUÔI
        </DrawnText>
      </>
    }
  />
);
export const V13S4_BLOCK_DURATION = 90;

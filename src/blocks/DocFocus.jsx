/**
 * DocFocus — một tài liệu/hiện vật đặt giữa khung, được chú ý vào.
 *
 * TRÍCH TỪ ĐÂU: hai cảnh V10 người xem giữ, ghi chú "dùng để giới thiệu về
 * kênh tương đối phù hợp" (S13) và "minh họa tốt" (S23):
 *
 *   S13 104f  nền spotlight  Hero w=880 y=330 variant punch  + khung ngắm 4 góc
 *             punch@77 top 1160
 *   S23 145f  nền card       Hero w=960 y=300 variant rise   + chú giải 2 dòng
 *             punch@104 top 190
 *
 * Lõi chung: nền giấy + MỘT hiện vật chiếm phần trên khung + punch. Thứ khác
 * nhau là CÁCH CHÚ Ý vào nó — S13 khép bốn góc lại quanh nó, S23 dịch nghĩa nó
 * ra bên dưới. Hai kiểu chú ý đó thành hai prop tuỳ chọn (`reticle`, `gloss`),
 * không thành hai block: cùng một việc kể chuyện.
 *
 * HAI THỨ ĐÃ SỬA SO VỚI GỐC — cảnh được khen vẫn có thể vi phạm luật:
 *
 * 1. asset_gate nay chặn `Doc-Trace` của S13: ảnh 524px đặt vào slot 880px =
 *    phóng 1,68x, mức cao NHẤT trong cả V10. Nên block không chôn width=880;
 *    mặc định là 920 và slot khai `minContentPx` để asset_gate chặn từ đầu.
 *    Cắt lại không cứu được, phải sinh lại trên board một ô riêng.
 * 2. S23 vẽ chú giải phụ ở 46px và text_gate đòi sàn 44px — đủ, nhưng sát
 *    quá. GLOSS_SUB đặt 46 và có kiểm ở dưới để không ai hạ xuống dưới sàn.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, Hero, PunchPhrase, SceneBackground } from "../scenes/shared";
import { DiagramCanvas, DrawnPath } from "../scenes/visualLanguage";
import { clampPunch } from "./PhotoClaim";

const ORANGE = "#E8621A";

/** Sàn chữ của text_gate. Chú giải nào rơi xuống dưới mức này là chữ không ai
 *  đọc được trên điện thoại — gate fail, và đúng ra là nên fail. */
export const TEXT_FLOOR = 44;

/** Hai chỗ đặt punch mà hai cảnh gốc dùng: trên đầu (190) hoặc sát đáy (1160).
 *  Không có `middle` — giữa khung là chỗ hiện vật đang nằm. */
export const DOC_PLACES = { top: 190, bottom: 1160 };

/** Khung ngắm bốn góc: bốn nét L khép lại quanh hiện vật, lệch nhau 6 frame
 *  nên nó đọc ra là "đang khép lại" chứ không phải một cái viền tĩnh. Toạ độ
 *  lấy nguyên từ S13 vì chúng bám vào mép DiagramCanvas, không bám vào ảnh. */
const RETICLE = [
  { d: "M 70 130 L 70 30 L 190 30", delay: 0 },
  { d: "M 890 30 L 1010 30 L 1010 130", delay: 6 },
  { d: "M 1010 690 L 1010 790 L 890 790", delay: 12 },
  { d: "M 190 790 L 70 790 L 70 690", delay: 18 },
];

export const DocFocus = ({
  durationInFrames,
  doc,                       // src ảnh tài liệu/hiện vật
  docWidth = 920,            // trung vị hai cảnh gốc (880, 960)
  docY = 315,
  docDelay = 0,
  variant = "rise",          // "rise" | "punch"
  backdrop = "card",         // "card" | "spotlight"
  reticle = false,           // khung ngắm bốn góc khép lại (kiểu S13)
  gloss,                     // { main, sub } - chú giải hai dòng (kiểu S23)
  glossDelay,
  punch,
  beats = [0],
  place = "top",
  fontSize,
  annotate,            // lớp chú thích neo vào chi tiết ảnh - xem ghi chú dưới
  annotateFrom = 0,
  name = "DocFocus",
}) => {
  const at = clampPunch(beats[0] ?? 0, durationInFrames);
  const top = DOC_PLACES[place] ?? DOC_PLACES.top;
  const gAt = glossDelay ?? docDelay;

  return (
    <AbsoluteFill name={name}>
      <SceneBackground variant={backdrop} />

      <Sequence from={docDelay} layout="none">
        <Hero
          name={`Doc-${name}`} src={doc} width={docWidth} x="50%" y={docY}
          variant={variant} idle={variant === "punch" ? "none" : undefined}
          visibleFor={durationInFrames - docDelay}
        />
      </Sequence>

      {reticle && (
        <DiagramCanvas y={300} height={840}>
          {RETICLE.map((r) => (
            <DrawnPath key={r.d} d={r.d} delay={docDelay + r.delay} drawFrames={8}
                       length={230} stroke={ORANGE} strokeWidth={9} />
          ))}
        </DiagramCanvas>
      )}

      {gloss && (
        <Sequence from={gAt} layout="none">
          <DiagramCanvas y={980} height={300}>
            <text x={540} y={110} textAnchor="middle" fill="#1A1A1A"
                  style={{ fontFamily: "Be Vietnam Pro", fontSize: 104, fontWeight: 900 }}>
              {gloss.main}
            </text>
            {gloss.sub && (
              <text x={540} y={200} textAnchor="middle" fill={ORANGE}
                    style={{ fontFamily: "Be Vietnam Pro",
                             fontSize: Math.max(TEXT_FLOOR + 2, gloss.subSize ?? 46),
                             fontWeight: 800 }}>
                {gloss.sub}
              </text>
            )}
          </DiagramCanvas>
        </Sequence>
      )}

      {/* SEAM có chủ đích, không phải cửa sau cho mọi thứ.
          Toạ độ của một dấu chú thích neo vào CHI TIẾT của đúng bức ảnh đó -
          quả cầu ở góc phải trên, cái đuôi bắt chéo ở giữa - nên nó không
          template hoá được, và cố template hoá nó là tự lừa mình. Block giữ
          phần giải được: nền, punch, hợp đồng nhịp. Phần còn lại vào đây.
          Cái KHÔNG được phép: dùng slot này để dựng một bố cục khác hẳn rồi
          gọi đó là dùng block. */}
      {annotate && (
        <Sequence from={annotateFrom} layout="none">
          <DiagramCanvas y={0} height={1920}>{annotate}</DiagramCanvas>
        </Sequence>
      )}

      {punch && punch.length > 0 && (
        <Sequence from={at} layout="none">
          <PunchPhrase lines={punch} top={top}
                       {...(fontSize === undefined ? {} : { fontSize })} />
        </Sequence>
      )}
      <BottomBar />
    </AbsoluteFill>
  );
};

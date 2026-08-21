/**
 * TimelineSpan — trục thời gian hai mốc + khoảng cách giữa chúng được gọi tên.
 *
 * TRÍCH TỪ ĐÂU: hai cảnh V10 người xem giữ với ghi chú "minh họa được mốc thời
 * gian và có hình ảnh trực quan" (S8) và "minh họa tốt" (S25):
 *
 *   S8  127f  nền giấy chart   Timeline y=480 x=60 w=960 inset=140  2 mốc
 *             + DimensionLine "8 NĂM" @82   + Support phà @82   punch@82
 *   S25 152f  nền ẢNH văn bản  Timeline y=470 x=60 w=960 inset=140  2 mốc
 *             + Support cổng @40 + MapGraphic @111              punch@6
 *
 * Lõi chung là trục thời gian với hình học y hệt nhau; thứ khác nhau là NỀN.
 * Nên `backdrop` là prop chứ không phải hai block riêng — cùng một việc kể
 * chuyện, hai chất liệu nền.
 *
 * `span` (DimensionLine gọi tên khoảng cách) là thứ làm block này khác một cái
 * Timeline trần: trục thời gian cho thấy HAI MỐC, còn người xem cần thấy
 * KHOẢNG GIỮA chúng. S8 vẽ nó ra ("8 NĂM"), S25 để narration nói. Có prop nên
 * dựng được cả hai kiểu.
 *
 * SỬA SO VỚI GỐC: S8 vẽ DimensionLine ở fontSize 42, và text_gate — siết sau
 * khi V10 ship — nay fail đúng dòng đó ("under the 44px floor"). Bản đầu của
 * block này chép nguyên 42 và như vậy là đóng băng một lỗi đã biết vào mọi
 * video sau. Đây chính xác là cái bẫy của việc đóng gói cảnh cũ: cảnh được
 * người xem khen vẫn có thể vi phạm luật ra đời sau nó.
 *
 * CẢNH BÁO đã đo: `Sup-Gate` của S25 (`el10_historical_figure.png`, 622px đặt
 * vào slot 760px = phóng 1,22x) là asset người xem báo lỗi bằng mắt, và
 * asset_gate.py nay chặn nó. Block này KHÔNG mang theo asset đó — slot `prop`
 * để trống, ảnh mới phải qua `--fit` và qua asset_gate trước khi được dùng.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "../scenes/shared";
import {
  BackgroundPhoto, DiagramCanvas, DimensionLine, Timeline,
} from "../scenes/visualLanguage";
import { clampPunch } from "./PhotoClaim";

/** Hình học trục: y/x/width/inset giống nhau ở cả hai cảnh gốc (y 470 vs 480).
 *  `inset=140` không phải số làm đẹp — nhãn của mốc được canh GIỮA con dấu,
 *  nên mốc đầu đặt sát mép trái sẽ đẩy nhãn ra ngoài khung và bị cắt cụt. */
const RAIL = { y: 475, x: 60, width: 960, inset: 140 };

export const TimelineSpan = ({
  durationInFrames,
  events,                    // [{ label, sub, delay }] - delay lấy từ beat_sync
  span,                      // { label: "8 NĂM", delay } - tuỳ chọn
  backdrop = "paper",        // "paper" | "photo"
  photo,                     // bắt buộc khi backdrop="photo"
  paperVariant = "chart",
  prop,                      // { src, width, x, y, delay, visibleFor } - tuỳ chọn
  punch,
  beats = [0],
  punchTop = 220,
  fontSize,
  name = "TimelineSpan",
}) => {
  const at = clampPunch(beats[0] ?? 0, durationInFrames);
  const onPhoto = backdrop === "photo";

  return (
    <AbsoluteFill name={name}>
      {onPhoto ? (
        /* wash="paper" chứ không phải "ink": tint là ĐỘ ĐỤC CỦA MÀU ĐEN, nên
           phủ mực lên một tài liệu vốn đã tối sẽ nuốt luôn trục cam vẽ đè lên
           — đúng lỗi đã xảy ra ở bản đầu của V10/S25. "paper" biến ảnh thành
           chất liệu nền mà mực đậm vẫn vẽ lên được. */
        <BackgroundPhoto
          name={`Bg-${name}`} src={photo} durationInFrames={durationInFrames}
          wash="paper" tint={0.76} grayscale={1} drift={0.04} fadeIn={14}
        />
      ) : (
        <SceneBackground variant={paperVariant} />
      )}

      <Timeline events={events} y={RAIL.y} x={RAIL.x}
                width={RAIL.width} inset={RAIL.inset} />

      {span && (
        <DiagramCanvas y={760} height={520}>
          <DimensionLine x1={160} y1={30} x2={920} y2={30}
                         label={span.label} delay={span.delay ?? 0} fontSize={44} />
        </DiagramCanvas>
      )}

      {prop && (
        <Sequence from={prop.delay ?? 0} layout="none">
          <Support
            name={`Sup-${name}`} src={prop.src}
            width={prop.width ?? 900} x={prop.x ?? 90} y={prop.y ?? 850}
            visibleFor={prop.visibleFor ?? (durationInFrames - (prop.delay ?? 0))}
          />
        </Sequence>
      )}

      {punch && punch.length > 0 && (
        <Sequence from={at} layout="none">
          <PunchPhrase lines={punch} top={punchTop}
                       {...(onPhoto ? { onDark: true } : {})}
                       {...(fontSize === undefined ? {} : { fontSize })} />
        </Sequence>
      )}
      <BottomBar />
    </AbsoluteFill>
  );
};

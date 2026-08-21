/**
 * ChannelOutro — khung kết: điện thoại + nút theo dõi + cú chạm thích.
 *
 * TRÍCH TỪ ĐÂU: V10/S14, và đây là block DUY NHẤT không thoả quy tắc "≥2 cảnh
 * mới đóng gói". Nó vào kho vì một lý do khác hẳn, không phải vì được nới:
 *
 *   S14 mới dùng 1 lần, nhưng nó tái dùng THEO CẤU TẠO chứ không theo bằng
 *   chứng — mọi video của kênh đều kết bằng lời kêu gọi theo dõi, và nội dung
 *   gần như không đổi giữa các video. Các block khác phải chứng minh hình học
 *   của chúng chuyển được sang nội dung khác; block này không có "nội dung
 *   khác" để chuyển sang. Đó là ngoại lệ có căn cứ, và nó chỉ áp cho đúng loại
 *   cảnh này — đừng dùng lập luận này để đóng gói một cảnh minh hoạ 1 lần dùng.
 *
 * LỖI ĐÃ SỬA SO VỚI GỐC — hai cái, đều do text_gate siết sau khi V10 ship:
 *
 * 1. CHỮ IN HAI LẦN. S14 vừa đặt PunchPhrase "THEO DÕI" ở đầu khung, vừa vẽ
 *    "THEO DÕI" lần nữa trong cái nút trên điện thoại. Cùng hai chữ, hai chỗ,
 *    trong khi thanh phụ đề bên dưới đang chạy đúng hai chữ đó lần thứ ba.
 *    Đây đúng là thứ 2b-1 của SKILL.md tồn tại để chặn. Nên ở block này punch
 *    MẶC ĐỊNH LÀ KHÔNG CÓ: cái nút đã nói rồi. Muốn có headline thì nó phải
 *    nói điều khác — `punch` sẽ ném lỗi nếu lặp lại chữ trên nút.
 * 2. CHỮ NÚT 42px. Dưới sàn 44px của text_gate ("15px in the hand"). Nút ở
 *    đây vẽ tối thiểu 46px và không nhận giá trị nhỏ hơn sàn.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase, SceneBackground, Support } from "../scenes/shared";
import { DeviceMockup, DiagramCanvas } from "../scenes/visualLanguage";

const ORANGE = "#E8621A";
const PAPER = "#F7F4EC";
export const TEXT_FLOOR = 44;

const norm = (s) => String(s || "").trim().toUpperCase();

export const ChannelOutro = ({
  durationInFrames,
  cta = "THEO DÕI",
  ctaSize = 46,              // >= TEXT_FLOOR, xem lỗi 2 ở trên
  burst,                     // { src, width, x, y, delay } - cú chạm thích
  punch,                     // TUỲ CHỌN, và phải nói điều KHÁC với nút
  punchTop = 200,
  punchFrom = 1,
  phoneWidth = 600,
  phoneY = 400,
  name = "ChannelOutro",
}) => {
  if (punch && punch.some((l) => norm(l) === norm(cta))) {
    throw new Error(
      `ChannelOutro: punch lặp lại đúng chữ trên nút ("${cta}"). Cùng hai chữ ` +
      `hiện hai chỗ trong khi phụ đề đang đọc chúng lần thứ ba - đây là lỗi ` +
      `V10/S14 đã mắc. Bỏ punch đi, hoặc cho nó nói điều khác.`);
  }
  const size = Math.max(TEXT_FLOOR + 2, ctaSize);

  return (
    <AbsoluteFill name={name}>
      <SceneBackground variant="card" />
      <DeviceMockup kind="phone" x="50%" y={phoneY} width={phoneWidth} delay={1} />

      {/* Nút theo dõi vẽ ĐÈ lên màn hình điện thoại, không phải ảnh chụp một
          cái nút: DeviceMockup tự vẽ khung máy, nên đi tìm ảnh chụp điện thoại
          là việc primitives.md đã dặn đừng làm. */}
      <DiagramCanvas y={520} height={640}>
        <rect x={392} y={150} width={296} height={92} rx={46} fill={ORANGE} opacity={0.95} />
        <text x={540} y={214} textAnchor="middle" fill={PAPER}
              style={{ fontFamily: "Be Vietnam Pro", fontSize: size, fontWeight: 900 }}>
          {cta}
        </text>
      </DiagramCanvas>

      {burst && (
        <Sequence from={burst.delay ?? 24} layout="none">
          <Support
            name={`Sup-${name}`} src={burst.src}
            width={burst.width ?? 250} x={burst.x ?? 720} y={burst.y ?? 900}
            visibleFor={durationInFrames - (burst.delay ?? 24)}
          />
        </Sequence>
      )}

      {punch && punch.length > 0 && (
        <Sequence from={punchFrom} layout="none">
          <PunchPhrase lines={punch} top={punchTop} fontSize={58} />
        </Sequence>
      )}
      <BottomBar />
    </AbsoluteFill>
  );
};

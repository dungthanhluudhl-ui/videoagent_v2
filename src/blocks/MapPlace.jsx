/**
 * MapPlace — bản đồ thật + ghim địa điểm + một lời khẳng định.
 *
 * TRÍCH TỪ ĐÂU: ba cảnh V10 người xem giữ, ghi chú "bản đồ trực quan, có điểm
 * neo" / "minh họa tốt cho địa điểm". Ba cảnh trùng khít về cấu trúc:
 *
 *   S2  134f  zoom 13  tint .14  pinDelay 20  punch@65  top 210   giữ 69f
 *   S12  97f  zoom 15  tint .16  pinDelay 16  punch@44  top 240   giữ 53f
 *   S16 138f  zoom 14  tint .15  pinDelay 14  punch@35  top 1240  giữ 103f
 *
 * Đây là nhóm đồng nhất nhất trong cả V10 — ba cảnh, ba lần cùng một khung,
 * chỉ đổi mức zoom và chỗ đặt chữ. Mọi hằng số dưới đây là trung vị của ba.
 *
 * Cả ba đều giữ punch trên sàn 48f, nên block này không phải sửa gì của bản
 * gốc — khác PhotoClaim, nơi hai trong năm cảnh hạt giống vi phạm sàn.
 *
 * KHÔNG dùng `MapLocationScene` trong SceneTemplates.jsx: nó vẽ một cái ghim
 * trên giấy trắng, không có bản đồ nào bên dưới — đúng khuyết tật mà
 * visual-language.md gọi tên và plan_gate.py đang chặn.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, PunchPhrase } from "../scenes/shared";
import { LOCAL_RASTER_STYLE, MapGraphic } from "../scenes/MapGraphic";
import { MIN_PUNCH_HOLD, clampPunch } from "./PhotoClaim";

/** Hai chỗ đặt chữ mà ba cảnh gốc dùng: trên đầu (210, 240) hoặc sát đáy
 *  (1240). KHÔNG có lựa chọn `middle` — giữa khung là chỗ bản đồ và cái ghim
 *  đang ở, đặt chữ vào đó là che mất chính thứ cảnh này tồn tại để cho xem. */
export const MAP_PLACES = { top: 225, bottom: 1240 };

/** Bản đồ được wash rất nhạt (.14–.16) so với ảnh chụp (.50): nền bản đồ vốn
 *  đã sáng và thưa, chữ mực đen đọc thẳng trên đó. Đây cũng là lý do
 *  PunchPhrase ở block này KHÔNG dùng `onDark`, ngược với PhotoClaim. */
export const MAP_TINT = 0.15;

export const MapPlace = ({
  durationInFrames,
  center,                 // [lng, lat]
  zoom = 14,
  label,                  // tên ghim trên bản đồ
  sublabel,
  areaKm2,                // vẽ vòng diện tích thật khi có
  punch,
  beats = [0],
  place = "top",
  pinDelay = 16,
  tint = MAP_TINT,
  fontSize,
  name = "MapPlace",
}) => {
  const at = clampPunch(beats[0] ?? 0, durationInFrames);
  const top = MAP_PLACES[place] ?? MAP_PLACES.top;

  return (
    <AbsoluteFill name={name}>
      {/* style={LOCAL_RASTER_STYLE} là bắt buộc, không phải mặc định tiện tay:
          một bản đồ lấy tile qua mạng vẫn render THÀNH CÔNG với một lỗ thủng
          khi tile hỏng, vì MapGraphic nhả delayRender theo hạn giờ. Tile phải
          được cache trước bằng cache_map_tiles.py. */}
      <MapGraphic
        center={center}
        zoom={zoom}
        style={LOCAL_RASTER_STYLE}
        label={label}
        sublabel={sublabel}
        delay={0}
        pinDelay={pinDelay}
        tint={tint}
        {...(areaKm2 === undefined ? {} : { areaKm2 })}
      />
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

export { MIN_PUNCH_HOLD };

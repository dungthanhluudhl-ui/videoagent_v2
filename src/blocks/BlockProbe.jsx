/**
 * BlockProbe — dựng lại đúng năm cảnh hạt giống bằng block, để so với bản gốc.
 *
 * Đây là phép NGHIỆM THU của block, không phải demo. Tiêu chí đã thống nhất:
 * một pattern chỉ được nhận vào kho khi nó dựng lại được ≥2 cảnh khác hẳn nhau
 * về nội dung, cả hai qua hết gate, và người xem gật khi nhìn still.
 *
 * Mỗi probe chỉ truyền những prop mà block thực sự nhận. Không truyền `tint`,
 * không truyền `drift`, không truyền `top` — nếu phải truyền thì block đã
 * không đóng gói được gì, và phép thử này phải lộ ra điều đó chứ không được
 * che đi bằng cách chép lại số gốc.
 */

import { PhotoClaim } from "./PhotoClaim";

// S1 — hẻm đêm, ngày tháng đóng dấu lên. Gốc: punch@62, top 620, fontSize 92.
export const ProbeS1 = () => (
  <PhotoClaim
    name="ProbeS1"
    durationInFrames={124}
    photo="el10_alley_night.png"
    focus="50% 60%"
    mood="alive"
    beats={[62]}
    punch={["29.10.2022"]}
    place="middle"
    fontSize={92}
  />
);
export const PROBE_S1_DURATION = 124;

// S3 — đám đông chật cứng. Gốc: punch@5, top 230.
export const ProbeS3 = () => (
  <PhotoClaim
    name="ProbeS3"
    durationInFrames={90}
    photo="el10_crowd_night.png"
    focus="50% 45%"
    mood="alive"
    beats={[5]}
    punch={["THẢM HỌA", "DẪM ĐẠP"]}
    place="top"
  />
);
export const PROBE_S3_DURATION = 90;

// S6 — lễ tưởng niệm, khung hình lặng. Gốc: punch@27, top 1120, drift .05.
export const ProbeS6 = () => (
  <PhotoClaim
    name="ProbeS6"
    durationInFrames={90}
    photo="el10_street_vigil.png"
    focus="50% 62%"
    mood="still"
    beats={[27]}
    punch={["TỪNG NGƯỜI MỘT"]}
    place="bottom"
  />
);
export const PROBE_S6_DURATION = 90;

// S21 — neon về đêm. Gốc punch@82 chỉ giữ được 46f; block kẹp về 80 (giữ 48f).
export const ProbeS21 = () => (
  <PhotoClaim
    name="ProbeS21"
    durationInFrames={128}
    photo="el10_neon_night.png"
    focus="50% 50%"
    mood="alive"
    beats={[82]}
    punch={["CUỘC SỐNG", "VỀ ĐÊM"]}
    place="top"
  />
);
export const PROBE_S21_DURATION = 128;

// S26 — chùa cổ lúc hoàng hôn. Gốc punch@81 chỉ giữ 21f = 0,7s cho bốn chữ;
// block kẹp về 54 để giữ đủ 48f. Đây là cảnh mà block SỬA bản gốc, không chép.
export const ProbeS26 = () => (
  <PhotoClaim
    name="ProbeS26"
    durationInFrames={102}
    photo="el10_temple_dusk.png"
    focus="50% 55%"
    mood="still"
    beats={[81]}
    punch={["MỘT NGÔI", "CHÙA CỔ"]}
    place="middle"
  />
);
export const PROBE_S26_DURATION = 102;

// ===========================================================================
// MapPlace — S2 / S12 / S16. Ba cảnh trùng khít, block không phải sửa gì.
// ===========================================================================
import { MapPlace } from "./MapPlace";

const ITAEWON = [126.9945, 37.5345];

export const ProbeS2 = () => (
  <MapPlace name="ProbeS2" durationInFrames={134} center={ITAEWON} zoom={13}
            label="ITAEWON" sublabel="Seoul, Hàn Quốc" pinDelay={20}
            beats={[65]} punch={["ITAEWON", "SEOUL"]} place="top" />
);
export const PROBE_S2_DURATION = 134;

export const ProbeS12 = () => (
  <MapPlace name="ProbeS12" durationInFrames={97} center={ITAEWON} zoom={15}
            label="ITAEWON" sublabel="29.10.2022" pinDelay={16}
            beats={[44]} punch={["QUAY LẠI", "NGÀY HÔM ĐÓ"]} place="top" />
);
export const PROBE_S12_DURATION = 97;

export const ProbeS16 = () => (
  <MapPlace name="ProbeS16" durationInFrames={138} center={ITAEWON} zoom={14}
            label="ITAEWON" sublabel="Quận Yongsan · 1,37 km²" areaKm2={1.37}
            pinDelay={14} beats={[35]} punch={["1,37 KM²"]} place="bottom" />
);
export const PROBE_S16_DURATION = 138;

// ===========================================================================
// TimelineSpan — S8 (nền giấy + nhịp span) và S25 (nền ảnh).
// Slot `prop` của S25 để TRỐNG: asset gốc el10_historical_figure.png là cái
// người xem báo lỗi và asset_gate nay chặn (622px vào slot 760px = 1,22x).
// ===========================================================================
import { TimelineSpan } from "./TimelineSpan";

export const ProbeS8 = () => (
  <TimelineSpan
    name="ProbeS8" durationInFrames={127} backdrop="paper" paperVariant="chart"
    events={[{ label: "2014", sub: "Chìm phà Sewol", delay: 6 },
             { label: "2022", sub: "Thảm họa Itaewon", delay: 60 }]}
    span={{ label: "8 NĂM", delay: 82 }}
    prop={{ src: "el10_ferry.png", width: 900, x: 90, y: 850, delay: 82, visibleFor: 45 }}
    beats={[82]} punch={["2014 → 2022"]} />
);
export const PROBE_S8_DURATION = 127;

export const ProbeS25 = () => (
  <TimelineSpan
    name="ProbeS25" durationInFrames={152} backdrop="photo"
    photo="el10_historical_doc.png"
    events={[{ label: "TK 16", sub: "Nhật Bản xâm lược", delay: 6 },
             { label: "2022", sub: "Hôm nay", delay: 46 }]}
    beats={[6]} punch={["THẾ KỶ 16"]} punchTop={190} />
);
export const PROBE_S25_DURATION = 152;

// ===========================================================================
// PhotoClaim + slot prop — S22. Plan gọi nó là `split`, bản dựng KHÔNG chia
// đôi khung: nó là ảnh nền + một vật thể. Cảnh thứ sáu của PhotoClaim.
// ===========================================================================
export const ProbeS22 = () => (
  <PhotoClaim
    name="ProbeS22" durationInFrames={94} photo="el10_prosper.png"
    focus="50% 45%" mood="calm" place="top"
    prop={{ src: "el10_archive_paper.png", width: 540, x: 520, y: 620,
            delay: 62, visibleFor: 62 }}
    beats={[62]} punch={["PHỒN HOA", "& THĂNG TRẦM"]} />
);
export const PROBE_S22_DURATION = 94;

// ===========================================================================
// DocFocus — S13 (khung ngắm) và S23 (chú giải). Hai kiểu chú ý, một block.
// S13 giữ nguyên width 880 của gốc ĐỂ SO SÁNH, dù asset_gate chặn ảnh đó
// (524px vào slot 880px = 1,68x, mức cao nhất V10). Mặc định của block là 920
// kèm minContentPx, nên cảnh mới không lặp lại được lỗi này.
// ===========================================================================
import { DocFocus } from "./DocFocus";

export const ProbeS13 = () => (
  <DocFocus name="ProbeS13" durationInFrames={104} backdrop="spotlight"
            doc="el10_trace_stamp.png" docWidth={880} docY={330} variant="punch"
            reticle beats={[77]} punch={["DẤU VẾT", "CUỐI CÙNG"]} place="bottom" />
);
export const PROBE_S13_DURATION = 104;

export const ProbeS23 = () => (
  <DocFocus name="ProbeS23" durationInFrames={145} backdrop="card"
            doc="el10_pear_name.png" docWidth={960} docY={300} variant="rise"
            docDelay={62} gloss={{ main: "梨泰院", sub: "\u201Cvườn lê\u201D" }}
            beats={[104]} punch={["LÊ THÁI VIỆN"]} place="top" />
);
export const PROBE_S23_DURATION = 145;

// ===========================================================================
// ChannelOutro — S14. Bản gốc in "THEO DÕI" HAI LẦN (punch + nút) nên block
// bỏ punch đi: cái nút đã nói rồi, phụ đề đang đọc lần thứ ba.
// ===========================================================================
import { ChannelOutro } from "./ChannelOutro";

export const ProbeS14 = () => (
  <ChannelOutro name="ProbeS14" durationInFrames={130} cta="THEO DÕI"
                burst={{ src: "el10_like_burst.png", width: 250, x: 720, y: 900, delay: 24 }} />
);
export const PROBE_S14_DURATION = 130;

/**
 * PhotoClaim — ảnh nền toàn khung + một lời khẳng định đặt lên trên.
 *
 * TRÍCH TỪ ĐÂU: năm cảnh V10 mà người xem giữ lại và khen bằng CÙNG MỘT lý do
 * ("ấn tượng", "tạo được khoảng lặng, khoảng nghỉ"):
 *
 *   S1  124f  tint .50  focus 50% 60%  drift .090  punch@62  top 620  1 dòng
 *   S3   90f  tint .46  focus 50% 45%  drift .100  punch@ 5  top 230  2 dòng
 *   S6   90f  tint .55  focus 50% 62%  drift .050  punch@27  top 1120 1 dòng
 *   S21 128f  tint .36  focus 50% 50%  drift .110  punch@82  top 250  2 dòng
 *   S26 102f  tint .52  focus 50% 55%  drift .045  punch@81  top 640  2 dòng
 *   S22  94f  tint .42  focus 50% 45%  drift .070  punch@62  top 210  + vật thể
 *
 * S22 vào sau: plan gọi nó là `split` nhưng bản dựng không hề chia đôi khung —
 * nó là ảnh nền + một vật thể, tức chính block này với slot `prop`. Nhãn trong
 * plan không quyết định được cấu trúc; chỉ mã nguồn mới quyết định.
 *
 * Năm cảnh, một lý do, một cấu trúc — bằng chứng tái dùng mạnh nhất trong toàn
 * bộ dữ liệu V10–V13, và nó đến từ phán quyết của người xem chứ không từ suy
 * luận. Mọi hằng số dưới đây là TRUNG VỊ của năm cảnh đó, không phải số chọn.
 *
 * KHÔNG chứa frame tuyệt đối. Nhịp vào của punch đi qua `beats` — lấy từ
 * beat_sync.py, tức bám vào từ thật trong narration. Một template chôn sẵn
 * `from={62}` thì đúng với đúng một câu thoại và sai với mọi câu khác.
 */

import { AbsoluteFill, Sequence } from "remotion";
import { BottomBar, CameraGroup, PunchPhrase, Support } from "../scenes/shared";
import { BackgroundPhoto, DiagramCanvas } from "../scenes/visualLanguage";

/** Ba chỗ đặt chữ mà năm cảnh gốc thực sự dùng — trung vị từng cụm.
 *
 *  Đây là lý do `place` là một cái tên chứ không phải con số tự do: `top`
 *  trong năm cảnh gốc nhảy 230→1120, và nó KHÔNG phải nhiễu — nó là chữ né
 *  chủ thể trong ảnh. Để agent gõ một số bất kỳ là mời nó đặt chữ đè lên mặt
 *  người; ba lựa chọn có tên buộc nó phải nhìn ảnh rồi mới chọn. */
export const PLACES = { top: 240, middle: 630, bottom: 1120 };

/** Ảnh động thì trôi nhanh, ảnh tĩnh thì trôi chậm.
 *
 *  BẢN ĐẦU CHỈ CÓ HAI NẤC và chú thích ở đây khẳng định "không có giá trị nào
 *  rơi vào giữa" — đúng với năm cảnh hạt giống (.045 .050 | .090 .100 .110),
 *  và SAI ngay khi S22 vào: nó nằm đúng .070, giữa hai cụm. Phép đối chứng bắt
 *  được: ép S22 về nấc `alive` làm ảnh trôi lệch dần và 50% điểm ảnh khác bản
 *  gốc, dù màu gần như trùng (sáng 76 vs 83, bão hoà 11,9 vs 12,4) — tức lệch
 *  hình học, không phải lệch màu.
 *
 *  Ba nấc đặt tên theo thứ ĐANG ĐỘNG TRONG ẢNH, không theo con số, để người
 *  chọn phải nhìn ảnh: vật tĩnh/kiến trúc, đường phố thường, đám đông/neon. */
export const MOODS = { still: 0.048, calm: 0.07, alive: 0.1 };

/** Sàn đọc được: 48 frame = 1,6 giây, đúng quy tắc ≥1,6s/nhịp của SKILL.md.
 *
 *  Hai trong năm cảnh gốc vi phạm chính quy tắc này — S21 giữ 46f và S26 chỉ
 *  giữ 21f (0,7 giây cho bốn chữ "MỘT NGÔI CHÙA CỔ"). Người xem vẫn khen
 *  chúng, gần như chắc chắn vì thanh phụ đề đang chạy đúng những chữ đó bên
 *  dưới. Nhưng đóng gói nguyên trạng thì mọi video sau đều thừa kế cái lỗi
 *  đó, nên block kẹp lại: punch vào sớm hơn mốc từ khoá vẫn tốt hơn nhiều so
 *  với punch không kịp đọc. `block_gate` báo riêng khi phải kẹp, để người
 *  dựng biết mà sửa mốc neo hoặc điểm cắt cảnh. */
export const MIN_PUNCH_HOLD = 48;

export const clampPunch = (at, durationInFrames) =>
  Math.max(0, Math.min(at, durationInFrames - MIN_PUNCH_HOLD));

export const PhotoClaim = ({
  durationInFrames,
  photo,
  punch,
  beats = [0],
  place = "middle",
  mood = "alive",
  prop,                // { src, width, x, y, delay, visibleFor } - tuỳ chọn
  focus = "50% 50%",
  // Chốt ở .50 theo quyết định của người xem sau khi xem bản đối chứng S21
  // (gốc .36 so với .50): tối hơn nhưng chấp nhận được, và một số cố định
  // đáng giá hơn một số phải chỉnh tay từng ảnh. Đo trước đó cho thấy tint
  // KHÔNG suy được từ độ sáng ảnh (r = -0,21 trên 5 mẫu), nên không có công
  // thức nào thay thế được lựa chọn này. Vẫn để làm prop cho đúng MỘT ca đã
  // ghi trong BackgroundPhoto: nguồn vốn đã tối thì phải dùng wash="paper".
  tint = 0.5,
  wash = "ink",
  grayscale,
  fontSize,
  annotate,            // lớp chú thích neo vào chi tiết ảnh - xem ghi chú dưới
  annotateFrom = 0,
  name = "PhotoClaim",
}) => {
  const at = clampPunch(beats[0] ?? 0, durationInFrames);
  const top = PLACES[place] ?? PLACES.middle;
  const drift = MOODS[mood] ?? MOODS.alive;

  // Khi có lớp chú thích, chuyển động PHẢI dồn vào CameraGroup và ảnh phải
  // đứng yên. Đây không phải tinh chỉnh - nó là lỗi đã trả giá một lần và
  // được ghi thẳng trong header của V13Scene7:
  //
  //   "dấu cam vẽ theo toạ độ tĩnh, mà BackgroundPhoto mặc định phóng ảnh 6%
  //    trong lúc chạy - dấu sẽ trôi khỏi cái đuôi nó đang chỉ."
  //
  // Bản đầu của seam này bỏ qua đúng dòng đó: ảnh trôi theo `drift` còn dấu
  // ngoặc đứng im, nên ở frame 120 của bản dựng lại V13/S1 chúng đã tuột khỏi
  // quả cầu và đĩa băng mà chúng đang chỉ. Nhìn ảnh mới thấy; số đo lệch 60%
  // chỉ nói là "khác", không nói là "sai".
  const anchored = Boolean(annotate);
  const photoDrift = anchored ? 0 : drift;

  const stage = (
    <>
      <BackgroundPhoto
        name={`Bg-${name}`}
        src={photo}
        durationInFrames={durationInFrames}
        tint={tint}
        focus={focus}
        drift={photoDrift}
        wash={wash}
        {...(grayscale === undefined ? {} : { grayscale })}
      />
      {annotate && (
        <Sequence from={annotateFrom} layout="none">
          <DiagramCanvas y={0} height={1920}>{annotate}</DiagramCanvas>
        </Sequence>
      )}
    </>
  );

  return (
    <AbsoluteFill name={name}>
      {anchored ? (
        <CameraGroup zoom={{ from: 1, to: 1 + drift }} durationInFrames={durationInFrames}>
          {stage}
        </CameraGroup>
      ) : stage}
      {/* Slot phụ: một vật thể đặt lên ảnh nền. S22 chính là cấu hình này
          (ảnh phồn hoa + tờ lưu trữ), nên nó là cảnh thứ SÁU mà block dựng
          lại được, không phải một block riêng. Plan gọi S22 là `split` nhưng
          bản dựng của nó không hề chia đôi khung — nhãn trong plan không
          quyết định được cấu trúc, chỉ mã nguồn mới quyết định. */}
      {prop && (
        <Sequence from={prop.delay ?? 0} layout="none">
          <Support
            name={`Sup-${name}`} src={prop.src}
            width={prop.width ?? 540} x={prop.x ?? 520} y={prop.y ?? 620}
            visibleFor={prop.visibleFor ?? (durationInFrames - (prop.delay ?? 0))}
          />
        </Sequence>
      )}

      {punch && punch.length > 0 && (
        <Sequence from={at} layout="none">
          {/* onDark là bắt buộc ở đây, không phải tuỳ chọn: nền luôn là ảnh
              đã bị wash tối, và PunchPhrase mực đen trên đó là một vệt nhoè.
              Cả năm cảnh gốc đều dùng onDark. */}
          <PunchPhrase
            lines={punch}
            top={top}
            onDark
            {...(fontSize === undefined ? {} : { fontSize })}
          />
        </Sequence>
      )}
      <BottomBar />
    </AbsoluteFill>
  );
};

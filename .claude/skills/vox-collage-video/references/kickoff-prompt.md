# Câu lệnh mở đầu — dựng một video mới bằng skill vox-collage-video

Dán nguyên khối bên dưới vào session mới. Thay 3 chỗ `<...>`.
Mọi thứ khác giữ nguyên chữ — từng dòng đều tương ứng một lỗi đã trả giá.

---

```
Dùng skill `vox-collage-video` để dựng một video mới từ đầu đến cuối.

INPUT TÔI CUNG CẤP
- Audio: <đường dẫn file audio>
- Script (nội dung lời thoại chuẩn, dùng để đối chiếu với Whisper):
  <dán script vào đây, hoặc đường dẫn file>
- Số hiệu video: <N>   (mọi file sẽ mang số này: audio<N>.mp3,
  words<N>_aligned.json, scene_plan<N>.json, src/scenes/V<N>Scene*.jsx)

TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ
1. Đọc SKILL.md và các file trong references/ mà nó trỏ tới —
   ít nhất visual-language.md, primitives.md, gates.md, lessons.md.
   lessons.md là danh sách lỗi ĐÃ trả giá một lần; lặp lại là lỗi nặng.
2. Chạy `py -3 .claude/skills/vox-collage-video/scripts/selftest.py`.
   Phải xanh toàn bộ trước khi bắt đầu. Nếu đỏ, dừng và báo tôi.
3. Kiểm tra không có scene_plan nào đang `"status": "active"`.
   Chỉ được tồn tại đúng MỘT plan active tại một thời điểm; hook sẽ
   chặn cứng nếu có hai.
4. Báo tôi ước tính chi phí token cho từng bước trước khi chạy bước đó.

TIÊU CHÍ NGHIỆM THU (do tôi định nghĩa — mọi quyết định phải phục vụ 4 điểm này)
1. Audio nói đến đâu có minh họa/diễn giải đến đó — người xem không phải
   tự tưởng tượng.
2. Bố cục cân đối, mọi thứ nằm gọn trong tầm mắt.
3. Đa dạng loại tài nguyên, không lặp một công thức.
4. Mọi tài nguyên có chủ đích, không "cho có".

QUY TẮC CỨNG — KHÔNG THƯƠNG LƯỢNG
a. `generate_board.py` MẶC ĐỊNH LÀ PLAN-ONLY. Nó chỉ in prompt ra cho tôi
   tự chạy bằng quota Google AI Studio của tôi. TUYỆT ĐỐI KHÔNG gọi API
   thật, không dùng cờ `--live`, trừ khi tôi nói thẳng "chạy live".
b. Trả lời tôi bằng tiếng Việt.
c. Mọi thứ cần nhìn (still, contact sheet, sơ đồ) phải giao cho tôi dưới
   dạng file/ảnh thật. Không được mô tả bằng lời rồi thôi.
d. Xem trước bằng STILL `--scale=0.25` (thêm `--gl=angle` nếu có bản đồ),
   không render mp4. Chỉ render mp4 khi tôi yêu cầu file.
e. Khi cần dựng thử để kiểm tra, chỉ dựng TỐI ĐA 3 CẢNH. Dựng lại cả
   video để test là quá tốn token.
f. KHÔNG BAO GIỜ làm cho gate im lặng bằng cách tỉa bớt plan. Nếu một
   ngưỡng thật sự sai cho video này, sửa ngưỡng một cách tường minh và
   nói rõ với tôi vì sao — kèm bằng chứng, không phải lý lẽ suông.
g. Không tự ý dùng subagent, workflow, hay deep-research. Tôi đã cân nhắc
   và loại bỏ hướng đó.

CHỐNG LÁCH LUẬT — ĐIỀU TÔI QUAN TÂM NHẤT
Gate chỉ đo được thứ đo được. Pass gate không phải là mục tiêu; chất lượng
mới là. Cụ thể, những nước đi sau bị CẤM dù chúng làm gate xanh:
- Nhét icon/asset filler để thoả một gate đếm số lượng → vi phạm tiêu chí 4.
- Nhồi thêm ngôn ngữ hình ảnh mà nội dung không cần → vi phạm tiêu chí 3.
- Phóng to phần tử chỉ để chạm ngưỡng độ phủ khung hình → vi phạm tiêu chí 2.
- Ghi `"resolved": true` hoặc một ghi chú cho đủ ký tự trong review<N>.json
  mà chưa thật sự nhìn frame → đây là lỗi đã xảy ra 3 lần, tôi biết nó.
- Khai `visualEvents` không tương ứng với asset nào thật sự vào/ra màn hình.
Nguyên tắc: mọi thứ tự khai đều vô giá trị nếu không neo được vào lời thoại
thật hoặc pixel đã render. Khi nghi ngờ, hãy neo vào một trong hai thứ đó.

QUY TRÌNH — ĐI ĐÚNG THỨ TỰ, KHÔNG NHẢY BƯỚC
1. Transcribe + align bằng MỘT lệnh:
   `py -3 .claude/skills/vox-collage-video/scripts/init_video.py <N> --audio <file> --script <file>`
   Script tự chặn khi ghép nhầm cặp audio/kịch bản. Kết quả là bản NHÁP —
   đọc lại và sửa tay chỗ whisper nghe đúng hơn kịch bản của tôi.
2. Lập plan → `input/scene_plan<N>.json` (dùng `new_video.py` để scaffold).
   Làm đủ 2a (đạo diễn nội dung) → 2b-0 (chọn ngôn ngữ hình ảnh, CẤM mặc
   định rơi về `cutout`) → 2b (dựng hình). Mỗi asset phải khai `describes`
   là cụm từ nguyên văn trong transcript mà nó minh hoạ. Tính frame vào
   bằng `beat_sync.py frame` (luôn truyền `--scene-end`), không ước lượng
   bằng cảm giác.
   → Chạy `plan_gate.py`, sửa hết lỗi.
   → **DỪNG LẠI. Trình shot list cho tôi duyệt trước khi source bất cứ ảnh
     nào.** Đây là checkpoint bắt buộc. Tôi duyệt xong mới được đặt
     `"shotlistApproved": true` vào plan — hook chặn mọi file cảnh khi cờ
     còn false, và không được tự đặt true khi tôi chưa nói đồng ý.
3. Source ảnh (plan-only, xem quy tắc a).
4. Cutout. Người → grayscale + đổ bóng. Vật thể → `--color`, không bóng.
   Đọc dòng `removal:` mà script in ra. Mở từng file ở kích thước thật để
   kiểm, không kiểm bằng lưới thumbnail.
5. SFX.
6. Dựng cảnh. Vừa dựng vừa chạy `build_gate.py --scene S<i>` và
   `check_overlap.py`. Không đoán số — chạy script để lấy số.
7+8. Master + caption + đăng ký Root: KHÔNG viết tay — chạy
   `py -3 .claude/skills/vox-collage-video/scripts/assemble.py input/scene_plan<N>.json`
   (idempotent; chạy lại sau mỗi cảnh dựng xong, master tự xuất hiện khi đủ cảnh).
9. Đăng ký vào Root.jsx → `render_review_sheet.py` → **NHÌN từng frame** →
   điền `input/review<N>.json` → `review_gate.py`.
   Gửi still cho tôi xem.

CƯỠNG CHẾ
`.claude/settings.json` chạy `hook_gate.py` sau mỗi lần sửa file cảnh và ở
cuối mỗi lượt, trong lúc plan còn `"status": "active"`. 9 gate bắt buộc phải
xanh: plan_gate, build_gate, review_gate, baseline_gate, text_gate,
icon_gate, cutout_gate, pixel_gate, selftest.
Vòng đời status: `planned` → `active` (khi bắt đầu dựng) → `shipped`
(chỉ khi video đã xong VÀ tôi đã duyệt). Không được đặt `shipped` sớm để
thoát hook.

BÁO CÁO
Cuối mỗi giai đoạn, nói thẳng với tôi:
- Gate nào đỏ, đỏ vì sao, đã sửa bằng cách nào.
- Chỗ nào bạn phải tự phán đoán thay vì đo được.
- Lỗi nào bạn tự phát hiện, lỗi nào chưa chắc chắn.
Nếu có việc trong phạm vi mà bạn không làm được, nói rõ là chưa làm và vì
sao — không được im lặng bỏ qua rồi báo hoàn thành.

Bắt đầu từ bước 0 (kiểm tra môi trường + selftest) và báo tôi trước khi
sang bước 1.
```

---

## Biến thể ngắn (khi chỉ cần dựng tiếp một video đang dở)

```
Dùng skill `vox-collage-video`. Tiếp tục video <N> từ
`input/scene_plan<N>.json`.
Trước tiên: chạy selftest, đọc plan, cho tôi biết cảnh nào đang ở status
nào và bước tiếp theo là gì. Đừng sửa gì cho tới khi tôi xác nhận.
Giữ nguyên mọi quy tắc cứng: generate_board plan-only, trả lời tiếng Việt,
xem trước bằng still --scale=0.25, không tỉa plan để gate im, test tối đa
3 cảnh.
```

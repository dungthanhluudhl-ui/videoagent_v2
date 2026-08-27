# Nhìn bằng model rẻ — hiệu chuẩn

Ba script, một mục đích: **ảnh không vào context của agent chính**.

| script | soi cái gì |
|---|---|
| `vision_check.py` | khung hình đã render — chữ bị đè, chữ nhỏ, khung trống |
| `asset_vision.py` | nghĩa của asset — đúng vật không, minh hoạ đúng lời thoại không |
| `vision_regress.py` | bộ hồi quy có nhãn cho cả hai, nhãn nào cũng ghi nguồn sự thật |

Router: `http://localhost:20128/v1`. Model mặc định `ag/gemini-3.7-flash-low`
— bản `-high` cho **y hệt** kết quả trên toàn tập thử, không đáng trả thêm.
Ngày đo: 2026-08-22.

---

## Vì sao đáng làm — số từ log token thật

439 bức ảnh vào context qua bốn phiên dựng video, phân theo việc chúng phục vụ:

| | số tấm | tỉ lệ | ai lo |
|---|---|---|---|
| kiểm asset / cutout | 107 | 24% | `asset_vision.py` |
| still khung cảnh | ~105 | 24% | `vision_check.py` |
| người dùng dán thẳng | 78 | 18% | không đẩy đi đâu được |
| contact sheet | 49 | 11% | chưa |
| ảnh nguồn từ board | 20 | 5% | chưa |

Một bức ảnh **không** tốn 1.400 token một lần. Nó nằm lại trong context và bị
đọc lại ở **mọi lượt gọi sau**. Phiên V11: 236 ảnh (9,8 ảnh/cảnh) = **55%
cache_read = 384 USD trong một phiên 979 USD**.

---

## `vision_check.py` — quét 79 khung V10

V10 là video duy nhất có người xem chấm từng cảnh, nên là tập duy nhất có nhãn thật.

### Bốn lỗi người xem tự nêu tên

| cảnh | người xem nói | kết quả |
|---|---|---|
| S7 | "chữ tiêu đề bị đè bởi các chấm tròn" | `text_overlap` — *"Chữ 'THIỆT MẠNG' bị các chấm tròn đen đè lên"*. **ĐÚNG, mô tả chính xác** |
| S19 | "thiết kế xấu, chữ bị ẩn" | `text_tiny`. **ĐÚNG** |
| S20 | "quá đơn điệu, không minh họa tốt" | **KHÔNG tính — xem đính chính** |
| S25 | "cutout hình ngôi chùa bị lỗi" | sạch ở cả 5 khung. `asset_vision` bắt được — xem phần sau |

### Đính chính: S20 không phải ca thắng

Lần đo đầu tôi ghi S20 là thắng và kết luận *"model rẻ làm được cả phán xét
thẩm mỹ"*. **Sai.** Cờ `empty` đó rơi vào khung **f24** — 0,8 giây, lúc phần
tử còn đang bay vào. Sau khi thêm `SETTLE_FRAME = 45` (đúng), cờ ở khung sớm
bị chặn. Thử lại ở **f108** thì khung đã đủ đồ và model gọi là sạch — cũng đúng.

Không khung tĩnh nào biểu đạt được *"cả cảnh này nhàm chán"*. Đó là phán xét
về cả cảnh **theo thời gian**. Ca này đã bị loại khỏi bộ hồi quy, lý do ghi
trong `vision_labels.json`.

**Kết luận đúng vẫn là kết luận ban đầu: model rẻ không thay được câu "cảnh
này có đang minh hoạ gì cho lời thoại không".**

### Đối chiếu chéo với `text_gate` — hai cơ chế độc lập, cùng kết luận

`text_gate` đọc mã nguồn, không nhìn ảnh:

| cảnh | text_gate | vision_check |
|---|---|---|
| S15 | *"drawn stroke runs through the headline ở y 274..368"* | *"Nét gạch chéo cam đè lên chữ 'MỘT'"* |
| S18 | *"'QUÁN BAR · THỜI TRANG…' 34px, dưới sàn 44px"* | *"Chữ 'THỜI TRANG', 'NHÀ HÀNG' quá nhỏ"* |

### Thấy được thứ không gate nào thấy

- **S7** — chấm tròn đè chữ. `text_gate` mù vì chấm tròn là đồ hoạ component
  tự vẽ, không phải nhãn khai trong plan. Người xem bắt được, mọi gate cho qua.
- **S9** — *"hình cắt nhóm người đè lên chữ 2022"*.

### `text_gate` thấy, vision_check không

S5 (nhãn 5 chữ), S10 (nhãn 40px), S14 (42px). Cỡ chữ tuyệt đối là việc **đo**,
không cần đoán. **Hai thứ bổ sung nhau, chạy cả hai.**

### Dương tính giả: 2/79, đã vá

Cả hai là `empty` ở đúng frame 20 (S2, S8). Thêm `SETTLE_FRAME = 45`: trước mốc
đó không xét `empty` và `element_tiny`. Sau khi vá cả hai về sạch, S7 vẫn bị cờ.

---

## `asset_vision.py` — soi nghĩa, 49 asset qua 3 video

| video | gắn cờ |
|---|---|
| V10 | 1/21 — **S25 `Sup-Gate`: *"phần cột và chân cổng bị xoá nham nhở"*** |
| V11 | 1/19 — `Sup-Station`: *"lối vào ga tàu điện ngầm chứ không phải trạm xe buýt"* |
| V13 | 0/9 |

**S25 là ca quyết định**: đúng lỗi người xem báo, và là lỗi mà `vision_check`
trên still đã bỏ sót. Agent tự mở ảnh ra xem và xác nhận — các cột dưới mái bị
xoá nền ăn mất thành vệt loang.

### Hai lỗi lộ ra khi hiệu chuẩn, cả hai là lỗi của tôi chứ không phải model

**1. Encoder vứt kênh alpha.** Bản đầu của `encode()` chỉ gọi `convert("RGB")`.
Hàm đó bỏ alpha nhưng **giữ nguyên kênh màu bên dưới** — mà `process_cutout`
xoá nền bằng alpha chứ không ghi đè màu, nên dưới vùng trong suốt vẫn còn
nguyên phông xanh RGB (16,237,7).

Hậu quả đo được: gửi `el10_street_sign.png` đi thì **79% khung hình model nhận
được là màu xanh lá**. Nó báo "ảnh chưa tách nền, còn phông xanh" — và **báo
đúng với thứ nó nhìn thấy**. Ba asset bị kết oan; cả ba đo lại đều 0,0% xanh
trong vùng đục và 21–80% điểm trong suốt.

**2. Nền ghép chọn bằng thực nghiệm, không bằng gu.** Bản vá đầu dùng ô ca-rô
và nó **làm mất chính ca đúng ở S25**. Thử bốn nền trên 1 asset hỏng + 3 asset
sạch:

| nền | S25 (hỏng) | 3 asset sạch |
|---|---|---|
| ô ca-rô | **BỎ SÓT** (vệt loang xám lẫn vào ô xám) | đúng |
| trắng | bắt được | đúng |
| **magenta** | **bắt được, mô tả chính xác nhất** | đúng |
| đen | bắt được, nhưng dự án đầy ảnh tối → dễ đọc nhầm thành nội dung | đúng |

Chọn **magenta**: không vật thể nào trong bảng màu xám+cam có màu đó.

### Hai dương tính giả do thiếu ngữ cảnh — đã vá

Tên asset là **tên ô**, không phải mô tả nội dung:

- `Mock-TV` → model: *"ảnh là quầy bar gỗ, không phải mockup TV"*. Thật ra
  `el10_drama_still.png` là **khung phim phát bên trong** cái TV; `template`
  ghi rõ *"TV mockup playing a drama frame set in Itaewon"*.
- `Doc-Name` → model: *"ảnh là cành hoa, không phải tài liệu"*. Itaewon nghĩa
  là **"vườn lê"**, và `visualTransformation` ghi *"chữ Lê Thái Viện hiện ra
  cùng nhành lê"* — nhành lê chính là thứ phải có.

Vá: đưa `visualTransformation` + `template` vào lời nhắc, và nói thẳng rằng
asset có thể chỉ là **một phần** của cảnh. `Doc-Name` hết bị cờ. `Mock-TV` vẫn
bị cờ 3/3 lần và **đã bị loại khỏi bộ hồi quy** — phán quyết "đúng" ở đó đòi
phải *biết* rằng có một component sẽ bọc nó lại, thứ không nằm trong bức ảnh.
Gắn cờ nó là hành vi hợp lý, chỉ tốn một cái liếc mắt.

---

## `vision_regress.py` — 26 ca có nhãn

Kết quả ổn định qua nhiều lần chạy:

```
bắt đúng 6 | bỏ sót 1 | DƯƠNG TÍNH GIẢ 0 | đúng-sạch 19   -> 25/26
```

Ca bỏ sót: `V10Scene15_f60`. Đáng chú ý là **nó không ổn định** — trong đợt
quét 79 khung và hai lần chạy khác nó bắt được (`text_overlap` hoặc
`collision`), rồi ba lần liền sau đó thì không, dù `temperature = 0`.

**Hệ quả thiết kế, và đây là điều quan trọng nhất trong cả trang này:** cờ trả
về là *"chỗ này đáng nhìn"*, **không phải** *"chỗ này sai"*. Cùng một lỗi lúc
nó gọi `text_overlap`, lúc gọi `collision`. Dùng để **lọc**, không dùng để
phán quyết — và vì thế `hook_gate` chạy chúng ở **lớp tư vấn không chặn**,
không phải làm gate.

### Về việc "có nên viết thêm luật vào prompt"

Thí nghiệm cắt bỏ: bỏ toàn bộ khối `QUY TẮC QUAN TRỌNG` khỏi prompt của
`vision_check`, chạy lại trên 8 khung (1 lỗi thật + 7 cảnh người xem giữ):

| | bắt đúng | bỏ sót | dương tính giả |
|---|---|---|---|
| có luật | 1 | 0 | 0 |
| bỏ hết luật | 1 | 0 | 0 |

**Không lệch một ca nào.** Nói cho công bằng: không khung nào trong 8 khung đó
chạm vào hạng lỗi mà luật nhắm tới, nên đây là *chưa chứng minh được*, chưa
phải bác bỏ.

Nhưng kết luận thực hành thì rõ và nó đúng nguyên tắc của dự án — *luật không
có script kiểm thì sẽ trôi*: **đừng viết prompt dài hơn, hãy thêm nhãn vào
`vision_labels.json`.** Mọi thay đổi prompt/model/encoder phải chứng minh bằng
một lần chạy `vision_regress.py`, không bằng niềm tin.

---

## Chưa kiểm được — đừng ghi vào cột thắng

- **`mark_missed`** (dấu cam trôi khỏi vật) — **chưa có bằng chứng nào**. Đã
  dựng lại có chủ đích lỗi drift trong `PhotoClaim`, render cặp lỗi/đã-sửa ở
  frame 120 của `V13S1Block`, thử mù. Model gọi cả hai là sạch — nhưng nhìn lại
  thì hai khung khác nhau chủ yếu ở mức phóng ảnh, dấu ngoặc lệch không đủ rõ.
  **Ca thử yếu, không phải model kém.** Cần ai đó dựng ca thử tử tế hơn.
- **Contact sheet (11%) và ảnh board (5%)** — chưa đụng tới.

## Chi phí

79 khung ≈ 308k token model rẻ, ~2 phút với 8 luồng. 49 asset ≈ 200k token.
Cùng số ảnh đó vào context agent chính: **~180k token nằm vĩnh viễn**, đọc lại
ở mọi lượt gọi.

---

## `sheet_vision.py` — tiêu chí `varied`, hỏi về **quan hệ giữa các cảnh**

Đây là tiêu chí duy nhất trong bốn tiêu chí của người xem mà **không khung hình
nào trả lời được**, vì nó không nói về một cảnh. `block_gate` đếm tỉ lệ block
trên **plan**; 24 cảnh khai khác nhau trên giấy vẫn có thể trông giống hệt nhau
trên màn hình.

Đo trên hai video có phán quyết thật, trung vị của 3 lần chạy:

| video | người xem | nhóm lớn nhất | kết luận |
|---|---|---|---|
| **V10** | thích | 38%, 23% | **đa dạng, đạt** |
| **V11** | "mệt" | 67%, 58% | **LẶP LẠI** |

Hai lần chạy độc lập, cả hai video đều đúng. Ngưỡng `REPEAT_SHARE = 0.45` nằm
giữa hai dải đo được (V10 tối đa 38%, V11 tối thiểu 54%), **không** phải một
con số đẹp.

Không dùng con số này làm quota block/icon/diagram hay media. Đây là phép đo
trên bản dựng thật để chỉ reviewer tới dấu hiệu lặp, không phải yêu cầu cách dựng.

**N = 2. Hai video không phải một phép hiệu chuẩn.** Có video thứ ba có phán
quyết thì phải đo lại.

### Lần thứ hai một bản vá "cho chắc" phá mất kết quả đang chạy

Prompt đầu tiên (thô, ít luật) cho V11 = `repetitive: true, 14/24`. Tôi thêm
hai dòng nghe rất hợp lý — *"đừng gộp các cảnh chỉ giống nhau về màu sắc"* và
*"giống nhau nghĩa là cùng chỗ đặt chữ, cùng kiểu nền"* — và **tín hiệu biến
mất hoàn toàn trên cả hai video**: V11 thành `groups` rỗng, "các cảnh liên tục
biến đổi linh hoạt".

Cộng với lần ghép nền ô ca-rô làm mất dương tính S25, đây là **hai lần trong
một phiên**. Và nó **mâu thuẫn** với phép cắt bỏ làm trên `vision_check`, nơi
bỏ hết luật đi không đổi một ca nào.

Kết luận đúng không phải "luật luôn vô dụng" cũng không phải "luật luôn có ích"
mà là: **không đoán được**. Mọi chữ trong lời nhắc phải đi qua một lần chạy có
nhãn.

### Dao động, và cách xử lý

Cùng một bức ảnh V10 cho ra 38% rồi 0%. Vá bằng **trung vị của 3 lần chạy**
(`RUNS = 3`) — ba lần hết ~10k token của model rẻ, gần như không tốn gì. Đây là
vá nhắm đúng vào thứ đã đo được là bất ổn, không phải hạ ngưỡng cho qua.

---

## Chế độ `--board` — ô cắt từ bảng sinh ảnh

**Bộ kiểm của `asset_vision` KHÔNG dùng được cho board**, và đây là lỗi đã xảy
ra thật: chạy nó lên 4 ô cắt từ `_board_el11_child_pair.png` thì **cả bốn** bị
báo `background_left` — *"vẫn còn nguyên phông nền màu xanh lá"*. Đúng, và vô
nghĩa: ô board **chưa** được tách nền, phông xanh chính là thứ `process_cutout`
sẽ ăn vào để cắt. Hỏi "đã tách nền chưa" ở bước chưa tách nền là hỏi sai bước.

Nhưng cùng lần chạy đó nó bắt được một thứ thật: **watermark của công cụ sinh
ảnh** ở góc phải. Dự án có hẳn `scrub_watermark.py`, tức đây là lỗ đã từng thủng.

Nên board có bộ kiểm riêng (`BOARD_CHECKS`): watermark, chủ thể chạm mép ô, nền
không phẳng (khó tách), mờ nhoè, còn nhiều ô trong một ảnh, sai vật.

Chạy lại trên đúng 3 ô đó:

```
CO   panel_1.png    watermark,multiple_cells
     Ảnh gồm hai ô ghép lại và có logo ở góc dưới bên phải.
sach panel_2.png
sach panel_3.png
```

`panel_1` **chính là cả tấm board** — `crop-file` dò ra 3 panel trong khi chỉ
yêu cầu 2 và lưu cả tấm dưới tên panel_1. Cả hai cờ đều đúng, và nó bắt luôn
được cái lỗi dò panel mà docstring của `generate_board.py` đã cảnh báo.

Luồng đúng:

```bash
py -3 generate_board.py crop-file --board-file board.png --cell a=x --cell b=x --out-dir cells/
py -3 asset_vision.py --board --files "cells/*.png"
```

---

## Tổng kết: tiết kiệm bao nhiêu

Đo trên log token thật của 4 phiên dựng, phương pháp tích luỹ (mỗi lượt gọi,
phần `cache_read` thuộc về ảnh = tỉ lệ token ảnh đang nằm trong context):

| video | cảnh | ảnh | đẩy được | $ tổng | $ do ảnh | $ sau | giảm |
|---|---|---|---|---|---|---|---|
| V11 | 24 | 236 | 195 | 978,79 | 383,91 | 708,75 | **28%** |
| V10 (2 phiên) | 26 | 163 | 128 | 458,56 | 68,04 | 423,71 | 8% |
| V13 | 8 | 40 | 38 | 224,52 | 17,91 | 213,32 | 5% |
| **gộp** | | **439** | **361** | **1.661,87** | **469,86** | **1.345,78** | **19%** |

Giả định "sau": agent chỉ còn nhìn ảnh người dùng dán + **1 khung/cảnh** + các
mục bị gắn cờ.

Model rẻ tốn: **361 ảnh × ~4.000 = 1,44 triệu token ≈ 0,43 USD** (giá niêm yết
Gemini 3 Flash ~0,30 USD/triệu).

**Bỏ ra 0,43 USD để tiết kiệm 316 USD — tỉ lệ 735 lần.**

Tiết kiệm tỉ lệ thuận với việc trước đó nhìn nhiều đến đâu: V11 nhìn 9,8
ảnh/cảnh nên giảm 28%; V13 nhìn 5 ảnh/cảnh nên chỉ giảm 5%.

**Đây không phải đòn bẩy lớn nhất.** `cache_read` chiếm 71–80% chi phí; ảnh chỉ
là một phần của context. Phần còn lại là **số lượt gọi × kích thước context** —
V10 dùng 34 lượt/cảnh, V11 dùng 82 và đắt gấp 2,3 lần cho mỗi cảnh.

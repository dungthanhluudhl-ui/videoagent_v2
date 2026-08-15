# Checkpoint 1 — Storyboard 9:16

**Dự án:** Giá xăng & tỷ giá biến động – Bát phở buổi sáng bị “bào” tiền như thế nào?

- Thời lượng audio: `01:21.480`
- Khung hình: `1080x1920`, 30 fps; review `540x960`
- Âm thanh: narration `1.0`; không nhạc; không SFX
- Hướng triển khai: video ảnh/collage editorial; không dùng A-roll vì không có footage người dẫn
- Nguồn hình: chỉ 9 ảnh người dùng cung cấp; không tạo mới

## Nhịp cảnh

| Cảnh | Thời gian | Ý thoại | Chữ trên màn hình | Hình ảnh và bố cục | Chuyển động có mục đích |
|---|---:|---|---|---|---|
| S01 | 00:00.000–00:13.033 | Câu hỏi nghịch lý: xăng tăng thì phở tăng, xăng giảm thì phở đứng yên | `XĂNG GIẢM` / `SAO PHỞ KHÔNG GIẢM?` | Ảnh bát phở và biểu tượng kinh tế làm toàn cảnh; chữ lớn chiếm vùng trống phía trên, bát phở giữ vai trò neo thị giác | Zoom rất nhẹ vào bát phở; hai vế câu hỏi lần lượt lộ theo nhịp thoại |
| S02 | 00:13.033–00:22.212 | Bát phở chịu hai chuỗi hiệu ứng: USD và xăng dầu | `2 CHUỖI GỢN SÓNG` / `TỶ GIÁ USD` / `GIÁ XĂNG DẦU` | Tách bát phở, thùng dầu, USD và tiền Việt từ sheet nền xanh; bố cục dạng chuỗi nguyên nhân | Các lớp dịch vào theo hai hướng rồi hội tụ vào bát phở |
| S03 | 00:22.212–00:30.666 | USD và dầu thế giới đẩy chi phí vận tải | `USD ↑` / `DẦU THẾ GIỚI ↑` / `CHI PHÍ VẬN TẢI ↑` | Ảnh cao tốc buổi sớm làm nền; vòi xăng và xe tải tách từ sheet chuỗi cung ứng làm lớp tiền cảnh | Vạch đường kéo người xem về điểm tụ; ba nhãn tăng lần lượt nối thành một dòng nguyên nhân |
| S04 | 00:30.666–00:46.863 | Mắt xích đầu tiên: bánh phở, thịt bò, rau thơm phải đi xe tải về chợ | `MẮT XÍCH 01` / `CƯỚC VẬN CHUYỂN` | Xe tải, rau thơm, bánh phở, thịt bò từ sheet được dàn thành tuyến cung ứng dọc, phù hợp màn hình TikTok | Xe tải di chuyển dọc tuyến; từng nguyên liệu xuất hiện tại các “điểm giao” |
| S05 | 00:46.863–00:55.482 | Mắt xích thứ hai: điện, gas, mặt bằng, nhân công | `MẮT XÍCH 02` / `CHI PHÍ DUY TRÌ` | Bếp nấu làm nền; bình gas, công-tơ điện, sổ chi và ví tiền tách từ sheet hoạt động quán | Hơi bếp giữ chuyển động nền; bốn khoản chi lần lượt ép sát khung trung tâm |
| S06 | 00:55.482–01:03.632 | Vì sao xăng giảm nhưng phở không giảm; giới thiệu sticky prices | `TÍNH CỨNG CỦA GIÁ CẢ` / `STICKY PRICES` | Ảnh ổ khóa khóa bảng giá dùng toàn cảnh; vùng chữ nằm ở khoảng tối phía trên | Ổ khóa được nhấn bằng crop/scale chậm; tiêu đề hiện như một nhãn giải thích, không dùng hiệu ứng đóng dấu |
| S07 | 01:03.632–01:10.322 | Tiền nhà, nhân công không giảm; mặt bằng giá mới bị giữ lại | `CHI PHÍ KHÔNG GIẢM` / `MẶT BẰNG GIÁ MỚI` | Tách ổ khóa, bánh răng, bảng giá và con dấu từ sheet nền xanh lá; bố cục cơ chế khóa giá | Bánh răng quay rất chậm rồi dừng; ổ khóa chặn đường lùi của bảng giá |
| S08 | 01:10.322–01:21.480 | Lạm phát bào mòn túi tiền; câu hỏi kêu gọi bình luận | `LẠM PHÁT ÂM THẦM BÀO TÚI TIỀN` / `CHỖ BẠN, PHỞ BAO NHIÊU?` | Ảnh quán ăn Việt Nam làm nền kết; không gian thoáng, chữ kết luận đặt trong vùng sáng giữa khung | Camera trôi nhẹ vào chiếc bàn trống; câu hỏi CTA giữ yên đủ lâu để đọc |

## Quy tắc xuyên suốt

- Một ý thoại tương ứng một cảnh; ưu tiên hình ảnh giải thích thay vì chép lại toàn bộ lời thoại.
- Chỉ dùng một chuyển động chính và tối đa một chuyển động hỗ trợ mỗi cảnh; entry 24–33 frame, không bounce/overshoot.
- Chữ tiếng Việt ngắn, lớn, kiểm tra vùng an toàn TikTok; không đặt nội dung quan trọng sát đáy giao diện.
- Các ảnh nền xanh/xanh lá chỉ được tách lớp cục bộ bằng pipeline; không tạo lại và không thay bằng vector/CSS.
- Các ảnh toàn cảnh giữ nguyên nhận diện, chỉ crop/reframe và chuyển động camera nhẹ.

## Điểm cần người dùng khóa tại Checkpoint 1

1. Duyệt mốc thời gian, chữ trên màn hình và nhịp 8 cảnh.
2. Xác nhận thay toàn bộ chỉ dẫn A-roll trong script bằng ảnh/collage từ 9 ảnh đã cung cấp.
3. Xác nhận giữ narration-only: không nhạc, không SFX dù script gốc có ghi chú SFX.


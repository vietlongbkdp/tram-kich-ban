# 🎬 Trạm Kịch Bản v3.0 (Vercel) — chạy 100% MIỄN PHÍ bằng Google Gemini

Link sản phẩm → **kịch bản (3 phương án) + thông số kỹ thuật + ảnh sản phẩm** → xuất `project.json` cắm thẳng vào TikTok Shop Video Factory.

**Không tốn tiền:** dùng Google Gemini API qua Google AI Studio — gói free vĩnh viễn, không cần thẻ tín dụng, không trial hết hạn. Đủ dùng thoải mái cho vài chục sản phẩm/ngày.

```
public/index.html   ← giao diện
api/scrape.js        ← bóc trang sản phẩm phía server (giả lập header Chrome thật)
api/generate.js      ← gọi Gemini API (free) — tự tắt Google Search khi đã có dữ liệu để tiết kiệm hạn mức
api/img.js            ← proxy ảnh: hiện thumbnail + tải ảnh vượt chặn hotlink CDN
```

## Lấy API key MIỄN PHÍ (2 phút, không cần thẻ)

1. Vào **https://aistudio.google.com/apikey**
2. Đăng nhập bằng tài khoản Google (Gmail bình thường là được)
3. Bấm **Create API key** → chọn hoặc tạo 1 Google Cloud project (miễn phí) → copy key dạng `AIzaSy...`

Vậy là xong — không có bước nhập thẻ nào cả.

## Triển khai (10 phút)

1. Push repo này lên GitHub → Vercel → Add New Project → import.
2. Environment Variables: thêm `GEMINI_API_KEY` = key vừa lấy ở trên.
3. Deploy → mở domain là dùng được.

## Hạn mức free tier (tính đến giữa 2026)

| Model | Dùng khi nào | Hạn mức/ngày | Tốc độ |
|---|---|---|---|
| **Gemini 2.5 Flash-Lite** (chế độ ⚡ Nhanh) | Mặc định, phân tích nhanh | ~1.000-1.500 request | Nhanh nhất |
| **Gemini 2.5 Flash** (chế độ 💎 Chất lượng) | Sản phẩm phức tạp cần viết kỹ | Thấp hơn Flash-Lite chút | Chậm hơn 1 nhịp |
| **Google Search grounding** | Khi trang bị chặn / bấm "Chạy lại + search" | 5.000 lượt/**tháng** | — |

Với nhịp làm việc thực tế (vài đến vài chục sản phẩm/ngày), hạn mức này gần như không bao giờ chạm tới. Lỡ có chạm (429) thì tool tự báo và gợi ý chờ vài phút hoặc chuyển sang **chế độ ✍️ Nhập thủ công** (0 đồng, không cần mạng cũng chạy được phần lắp kịch bản).

**Lưu ý minh bạch:** trên free tier, Google có thể dùng nội dung anh gửi để cải thiện sản phẩm của họ (khác với API trả phí). Vì dữ liệu ở đây chỉ là thông tin sản phẩm công khai (không phải dữ liệu khách hàng/riêng tư), việc này không đáng ngại — nhưng anh nên biết trước.

## Chế độ dự phòng — không bao giờ "đứng máy"

- **Trang chặn bóc dữ liệu** → tool tự bật Google Search, vẫn ra kịch bản.
- **Hết hạn mức Gemini (rất hiếm)** → dùng nút **✍️ Nhập thủ công** ở tab Kịch bản: điền tên/giá/nỗi đau/ý chính → tool tự lắp hook + kịch bản ngay trên trình duyệt, 0 đồng, không gọi API nào cả.
- **Muốn giữ lại phân tích để làm sau** → nút **💾 Lưu nháp**, mở lại bằng ô **📂 Nháp đã lưu** trên header (lưu trong trình duyệt, tối đa 15 nháp).

## Quy trình chuẩn 1 sản phẩm (~2-3 phút)

Dán link → ⚡ → đọc 3 phương án, chọn 1 → sửa vài chữ cho giống giọng mình (bấm vào chữ để sửa trực tiếp) → ⬇ project.json → tải ảnh → chuyển sang Video Factory.

## Lưu ý về Shopee/TikTok Shop
Hai sàn render bằng JS + chống bot nhiều lớp, nên đèn bước 1 (bóc trang) đỏ là chuyện bình thường — tool vẫn ra kịch bản đầy đủ nhờ Google Search. Ảnh thì mở trang → chuột phải → Copy image address → dán vào ô "Thêm ảnh thủ công". Link chi tiết dạng `shopee.vn/...-i.SHOPID.ITEMID` bóc tốt hơn link rút gọn `vn.shp.ee/...`.


# Kế Hoạch Cải Thiện Mobile Upload Experience

## ✅ HOÀN THÀNH

| # | Vấn đề | Trạng thái |
|---|--------|-----------|
| 1 | "Video gần đây" thừa | ✅ Đã xóa grid placeholder |
| 2 | Tab "Video" bị khuất | ✅ Đã căn giữa tabs với scroll-snap |
| 3 | Phải đợi upload xong | ✅ Đã tạo hệ thống Background Upload như YouTube |

---

## Chi Tiết Thực Hiện

### 1. Xóa phần "Video gần đây" ✅
- File: `VideoGalleryPicker.tsx`
- Đã xóa toàn bộ grid 6 ô placeholder
- Giao diện gọn gàng, tập trung vào nút "Chọn video"

### 2. Căn giữa tabs loại nội dung ✅
- File: `MobileUploadFlow.tsx`
- Thêm `scroll-snap-x scroll-snap-mandatory` cho tabs
- Tăng gap và padding cho tabs hiển thị đầy đủ
- Thêm `pb-safe` cho iOS safe area

### 3. Background Upload System ✅
- Đã tạo `contexts/UploadContext.tsx`:
  - Global upload manager quản lý tất cả uploads
  - Support multipart upload cho file lớn
  - Tracking progress cho từng upload
  - Auto-notify khi hoàn tất

- Đã tạo `components/Upload/BackgroundUploadIndicator.tsx`:
  - Widget mini floating ở góc màn hình
  - Hiển thị thumbnail + progress bar + %
  - Có thể expand/collapse
  - Nút hủy upload
  - Auto-hide sau khi hoàn tất

- Đã update `MobileUploadFlow.tsx`:
  - Khi bấm "Tải lên" → Modal đóng ngay
  - Upload chạy ở background
  - User có thể tiếp tục dùng app

- Đã update `App.tsx`:
  - Thêm UploadProvider wrap toàn app
  - Thêm BackgroundUploadIndicator component

---

## Luồng Upload Mới (Giống YouTube)

```text
1. [Chọn video] → [Xác nhận] → [Nhập thông tin] → [Bấm Tải lên]
                                                      ↓
2. Modal đóng ngay → Toast "Đang tải lên..."
                                                      ↓
3. Background: Widget nhỏ hiển thị progress ở góc màn hình
                                                      ↓
4. Upload xong → Toast "Tải lên thành công! 🎉" → Link xem video
```

---

## Notes

- Background upload chỉ hoạt động khi app đang mở (web limitation)
- Nếu user refresh/đóng tab, upload sẽ bị hủy
- Có thể upload nhiều video cùng lúc
- Widget có thể thu gọn để không che nội dung

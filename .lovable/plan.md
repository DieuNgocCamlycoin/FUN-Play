
# Kế Hoạch Cải Thiện Mobile Upload Experience

## Vấn Đề Cần Giải Quyết

| # | Vấn đề | Mô tả |
|---|--------|-------|
| 1 | "Video gần đây" thừa | Grid 6 ô placeholder không có chức năng thực tế, không thể truy cập file system từ web |
| 2 | Tab "Video" bị khuất | Tab bị mất chữ bên trái, cần căn giữa đúng |
| 3 | Phải đợi upload xong | User không thể rời modal khi đang upload, muốn upload ngầm như YouTube |

---

## Giải Pháp

### 1. Xóa phần "Video gần đây" - Đơn giản hóa giao diện

**Lý do**: Web browser không thể truy cập trực tiếp file system của điện thoại vì bảo mật. Đây là giới hạn của web, chỉ native app (như YouTube app) mới có quyền này.

**Thay đổi**: Xóa toàn bộ grid placeholder và chỉ giữ lại khu vực chọn video chính.

### 2. Căn giữa tabs loại nội dung

**Thay đổi**: 
- Thêm `scroll-snap-x` để kéo ngang mượt
- Đảm bảo tab đầu tiên hiển thị đầy đủ (thêm padding left)
- Hoặc căn giữa hoàn toàn nếu đủ chỗ

### 3. Background Upload (Upload Ngầm)

**Tính năng mới như YouTube**:
- Khi bấm "Tải lên", upload bắt đầu ở background
- User có thể đóng modal và tiếp tục dùng app bình thường
- Hiển thị mini progress indicator ở góc màn hình
- Thông báo khi upload hoàn tất

---

## Files Sẽ Thay Đổi

| Action | File | Mô tả |
|--------|------|-------|
| EDIT | `VideoGalleryPicker.tsx` | Xóa grid "Video gần đây", đơn giản hóa giao diện |
| EDIT | `MobileUploadFlow.tsx` | Căn giữa tabs, tích hợp background upload |
| CREATE | `contexts/UploadContext.tsx` | Global upload manager để quản lý upload ngầm |
| CREATE | `components/Upload/BackgroundUploadIndicator.tsx` | Widget nhỏ hiển thị progress khi upload ngầm |
| EDIT | `App.tsx` | Thêm UploadProvider và BackgroundUploadIndicator |

---

## Chi Tiết Kỹ Thuật

### VideoGalleryPicker.tsx - Xóa phần thừa

```text
Thay đổi:
├── Xóa toàn bộ grid "Video gần đây" (line 142-165)
├── Giữ lại vùng upload chính với icon và nút "Chọn video"
└── Giao diện sạch, tập trung vào một hành động duy nhất
```

### MobileUploadFlow.tsx - Căn giữa tabs

```text
Thay đổi:
├── Thay overflow-x-auto bằng scroll-snap container
├── Thêm px-6 (padding) để tab đầu không bị cắt
└── Đảm bảo tất cả tabs hiển thị đầy đủ khi scroll
```

### Background Upload System

```text
UploadContext sẽ bao gồm:
├── uploads[] - Danh sách các upload đang chạy
├── addUpload(file, metadata) - Thêm upload mới vào queue
├── removeUpload(id) - Xóa khi hoàn tất
└── progress tracking cho từng upload

Flow mới:
1. User chọn video → nhập thông tin → bấm "Tải lên"
2. Modal đóng ngay lập tức
3. Upload chạy ở background
4. Mini indicator hiển thị progress (có thể ẩn/hiện)
5. Thông báo khi upload xong + link đến video
```

### BackgroundUploadIndicator - Widget mini

```text
Giao diện:
├── Floating pill ở góc trên hoặc dưới màn hình
├── Hiển thị: thumbnail nhỏ + progress bar + % 
├── Có thể tap để xem chi tiết hoặc hủy
├── Auto-hide sau khi upload xong (hiện toast thành công)
└── Không che mất nội dung chính của app
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Grid "Video gần đây" placeholder vô dụng | Giao diện sạch, một nút chọn video |
| Tab "Video" bị cắt chữ | Tabs hiển thị đầy đủ, có thể kéo ngang |
| Phải đợi modal đến khi upload xong | Upload ngầm, tự do dùng app |
| Stuck nếu mạng chậm | Có thể tiếp tục xem video/duyệt app |

---

## Luồng Upload Mới (Giống YouTube)

```text
1. [Chọn video] → [Xác nhận] → [Nhập thông tin] → [Bấm Tải lên]
                                                      ↓
2. Modal đóng ngay → User quay về trang chủ/kênh
                                                      ↓
3. Background: Video đang upload... (indicator nhỏ ở góc)
                                                      ↓
4. Upload xong → Toast "Tải lên thành công! 🎉" → Link xem video

* Nếu app bị đóng/refresh → Upload bị hủy (limitation của web)
* Native app (Capacitor) có thể support background task tốt hơn
```

---

## Notes

- Background upload chỉ hoạt động khi app đang mở (web limitation)
- Nếu user refresh/đóng tab, upload sẽ bị hủy
- Có thể mở rộng hỗ trợ multiple uploads cùng lúc
- Capacitor native app có thể implement background task thực sự trong tương lai

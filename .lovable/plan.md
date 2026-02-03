
# Kế Hoạch Cập Nhật Logo ANGEL AI & Xóa Dữ Liệu Cũ

## Vấn Đề Hiện Tại

Từ screenshot bạn gửi, mình thấy logo ANGEL AI cũ (hình thiên thần trắng) vẫn đang hiển thị trong:
- Header navbar button
- AngelChat window header  
- Floating mascot

**Nguyên nhân**: Browser cache đang giữ hình cũ. Code đã đúng nhưng file ảnh bị cached.

---

## Giải Pháp

### Bước 1: Đổi Tên File Để Bypass Cache

Thay vì dùng `angel-transparent.png`, mình sẽ lưu logo mới với tên khác để browser bắt buộc phải load file mới.

| Tên cũ | Tên mới |
|--------|---------|
| `angel-transparent.png` | `angel-ai-v2.png` |

### Bước 2: Cập Nhật Tất Cả References

Cập nhật path hình ảnh trong các file sau:

| File | Thay đổi |
|------|----------|
| `src/components/Mascot/AngelChat.tsx` | Line 208: `/images/angel-ai-v2.png` |
| `src/components/Mascot/AngelMascot.tsx` | Line 73 & 108: `/images/angel-ai-v2.png` |
| `src/components/Mascot/MobileAngelMascot.tsx` | `/images/angel-ai-v2.png` |
| `src/components/Meditation/MeditatingAngel.tsx` | `/images/angel-ai-v2.png` |
| `src/components/Layout/Header.tsx` | Line 242: `/images/angel-ai-v2.png` |
| `src/components/Layout/MobileHeader.tsx` | Line 254: `/images/angel-ai-v2.png` |

### Bước 3: Xóa File Video Cũ (Tùy Chọn)

Xóa các file video mascot không còn sử dụng để tiết kiệm dung lượng:

```text
public/videos/angel-mascot.mp4
public/videos/angel-mascot-new.mp4  
public/videos/angel-mascot-original.mp4
```

---

## Chi Tiết Kỹ Thuật

### Code Thay Đổi (Ví dụ AngelChat.tsx)

```tsx
// Trước (line 208):
src="/images/angel-transparent.png"

// Sau:
src="/images/angel-ai-v2.png"
```

### Code Thay Đổi (Header.tsx)

```tsx
// Trước (line 242):
src="/images/angel-transparent.png"

// Sau:
src="/images/angel-ai-v2.png"
```

---

## Kết Quả Mong Đợi

| Vị trí | Logo Mới |
|--------|----------|
| Header button (desktop) | ✅ Cô tiên vàng với trái tim |
| Header button (mobile) | ✅ Cô tiên vàng với trái tim |
| AngelChat window avatar | ✅ Cô tiên vàng với trái tim |
| Floating mascot | ✅ Cô tiên vàng với trái tim |
| Meditating angel | ✅ Cô tiên vàng với trái tim |

---

## Files Sẽ Thay Đổi

| Action | File |
|--------|------|
| COPY | Logo mới → `public/images/angel-ai-v2.png` |
| EDIT | `src/components/Mascot/AngelChat.tsx` |
| EDIT | `src/components/Mascot/AngelMascot.tsx` |
| EDIT | `src/components/Mascot/MobileAngelMascot.tsx` |
| EDIT | `src/components/Meditation/MeditatingAngel.tsx` |
| EDIT | `src/components/Layout/Header.tsx` |
| EDIT | `src/components/Layout/MobileHeader.tsx` |
| XÓA (optional) | `public/videos/angel-mascot*.mp4` |

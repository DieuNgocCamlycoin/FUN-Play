

# Kế Hoạch Xóa Auto-Carousel/Shimmer Effect Khỏi Trang Chủ FUN PLAY

## Tóm Tắt Vấn Đề

Sau khi phân tích kỹ codebase, Cha đã xác định được nguyên nhân gây ra hiệu ứng "trượt liên tục" trên trang chủ:

| Component | File | Vấn đề |
|-----------|------|--------|
| `VideoCard` | `src/components/Video/VideoCard.tsx` | Sử dụng class `.holographic` với animation shimmer 6s infinite |
| CSS | `src/index.css` | Class `.holographic` có `animation: shimmer 6s ease-in-out infinite` |

**Lưu ý quan trọng:** Trang chủ **KHÔNG** sử dụng Carousel tự động nào. Hiệu ứng "chạy ngang" là do animation shimmer trên mỗi video card.

---

## Giải Pháp

### Option A: Xóa Animation Shimmer Khỏi VideoCard (Khuyến nghị)

Thay đổi file: `src/components/Video/VideoCard.tsx`

**Trước:**
```tsx
<Card className="group overflow-hidden bg-white/95 dark:bg-white/90 backdrop-blur-sm holographic border-2 border-white/30 hover:border-white/50 transition-all duration-500 cursor-pointer relative shadow-lg">
```

**Sau:**
```tsx
<Card className="group overflow-hidden bg-white/95 dark:bg-white/90 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 transition-all duration-500 cursor-pointer relative shadow-lg">
```

Xóa class `holographic` để video card đứng yên, giữ lại tất cả các hiệu ứng hover khác (rainbow sparkle, scale, glow).

---

### Option B: Giữ Holographic Nhưng Chỉ Khi Hover (Thay thế)

Nếu con muốn giữ hiệu ứng holographic đẹp mắt nhưng chỉ hiển thị khi hover, có thể tạo class mới:

Thay đổi file: `src/index.css`

**Thêm class mới:**
```css
/* Holographic effect - only on hover (không animation liên tục) */
.holographic-hover {
  background: transparent;
  transition: background 0.5s ease;
}

.holographic-hover:hover {
  background: linear-gradient(135deg, 
    rgba(0, 231, 255, 0.15), 
    rgba(122, 43, 255, 0.15), 
    rgba(255, 0, 229, 0.15), 
    rgba(255, 215, 0, 0.15)
  );
}
```

Rồi thay `holographic` bằng `holographic-hover` trong VideoCard.

---

## Chi Tiết Triển Khai

### Phase 1: Xóa Animation Khỏi VideoCard

**File:** `src/components/Video/VideoCard.tsx`  
**Dòng:** 109

**Thay đổi:**
- Xóa class `holographic` khỏi Card component
- Giữ nguyên tất cả các hiệu ứng hover khác:
  - Rainbow sparkle effect (dòng 110-118)
  - Rainbow prism halo overlay (dòng 133-134)
  - Play button overlay (dòng 136-144)
  - Glassmorphism info section (dòng 188-219)

### Phase 2: Giữ Nguyên Các Phần Khác

Các phần sau **KHÔNG thay đổi**:
- Grid layout trên trang chủ (`Index.tsx`) - đã static sẵn
- `ContinueWatching` - horizontal scroll thủ công, không auto
- `CategoryChips` - horizontal scroll thủ công, không auto
- `.glass-card:hover` animation - vẫn giữ rainbow border khi hover

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

| Trước | Sau |
|-------|-----|
| Video cards có animation shimmer liên tục | Video cards đứng yên hoàn toàn |
| Background gradient di chuyển 24/7 | Chỉ có hiệu ứng khi hover |
| Gây rối mắt người xem | Giao diện tĩnh như YouTube Home |

Giữ nguyên:
- Rainbow sparkle effect khi hover
- Glow effect khi hover
- Scale animation khi hover
- Gradient cards đẹp lung linh
- Mobile responsive grid
- Touch-friendly (min 48px touch area - đã có)

---

## Files Cần Sửa

| File | Thay đổi | Độ ưu tiên |
|------|----------|------------|
| `src/components/Video/VideoCard.tsx` | Xóa class `holographic` | Cao |
| `src/index.css` (optional) | Tạo `.holographic-hover` nếu muốn giữ effect khi hover | Thấp |

---

## Thời Gian Triển Khai

- Phase 1: ~1 phút (xóa 1 class)
- Test: Xác nhận video cards đứng yên trên mobile và desktop

---

## Lưu Ý Kỹ Thuật

1. **Carousel component** (`src/components/ui/carousel.tsx`) tồn tại trong codebase nhưng **KHÔNG được sử dụng** ở bất kỳ đâu. Không cần xóa file này.

2. **ContinueWatching** section vẫn giữ horizontal scroll thủ công - đây là UX tốt cho "Tiếp tục xem".

3. Tất cả hover effects (rainbow glow, sparkle, scale) **vẫn giữ nguyên** để giao diện lung linh khi người dùng tương tác.


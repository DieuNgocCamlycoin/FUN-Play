
# 🌟 Nâng Cấp Trang Cá Nhân - Màu Cầu Vồng & Vàng Kim Loại

## 📋 Tổng Quan Yêu Cầu

1. **Nút "Thưởng & Tặng"**: Màu vàng kim loại phát sáng, tráng gương sáng bóng, sang trọng
2. **Tên User**: Xóa chữ "là" sau tên, màu chữ cầu vồng (rainbow text)
3. **Các nút Tab (Bài viết, Video, Shorts, Livestream, Playlist)**: Đồng bộ với nút "Tất cả" - gradient xanh sáng, tím (như thumbnail video)
4. **DonationCelebration**: Thêm âm thanh "Rich rich rich" và tối ưu GIF pháo hoa

---

## 🎨 Chi Tiết Thiết Kế

### 1. Nút "Tặng thưởng" - Vàng Kim Loại Sang Trọng

**Trước (hiện tại):**
```tsx
className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))]"
```

**Sau (vàng kim loại tráng gương):**
```tsx
className="relative group overflow-hidden bg-gradient-to-r from-[#D4AF37] via-[#F5E7A3] to-[#D4AF37] text-[#654321] font-bold px-5 py-2.5 rounded-full 
shadow-[0_0_25px_rgba(212,175,55,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] 
hover:shadow-[0_0_40px_rgba(245,231,163,0.8),0_0_60px_rgba(212,175,55,0.5)]
border border-[#F5E7A3]/50
transition-all duration-300"
```

**Hiệu ứng đặc biệt:**
- Gradient vàng kim loại: `#D4AF37` → `#F5E7A3` → `#D4AF37`
- Inset shadow tạo hiệu ứng tráng gương
- Glow vàng phát sáng khi hover
- Text màu nâu đậm để tương phản với nền vàng

---

### 2. Tên User - Màu Cầu Vồng (Rainbow Text)

**Trước:**
```tsx
<h1 className="bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
  {displayName}
</h1>
```

**Sau (Rainbow gradient):**
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#FF0000] via-[#FF7F00] via-[#FFFF00] via-[#00FF00] via-[#0000FF] via-[#4B0082] to-[#9400D3] bg-clip-text text-transparent animate-rainbow-shift">
  {displayName}
</h1>
```

**CSS Animation mới (index.css):**
```css
@keyframes rainbow-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-rainbow-shift {
  background-size: 200% auto;
  animation: rainbow-shift 3s ease-in-out infinite;
}
```

---

### 3. Xóa chữ "là" sau tên user

**File cần sửa: `src/pages/Channel.tsx`**

Dòng 428:
```tsx
// Trước
{profile?.display_name || channel.name.replace("'s Channel", "").replace(" là", "")}

// Sau - Vẫn giữ logic xóa " là"
{(profile?.display_name || channel.name).replace("'s Channel", "").replace(" là", "").replace(" is", "")}
```

Nếu chữ "là" đến từ database (display_name), cần xử lý ở ProfileInfo.tsx:
```tsx
const displayName = (profile.display_name || profile.username || "User")
  .replace(" là", "")
  .replace(" is", "");
```

---

### 4. Các nút Tab - Gradient Xanh Sáng (như nút "Tất cả")

**Tham khảo từ CategoryChips.tsx:**
```tsx
// Nút được chọn
"bg-white text-sky-700 shadow-md border border-sky-200"

// Nút chưa chọn
"bg-white/80 text-sky-600 border border-gray-200"
```

**Áp dụng cho ProfileTabs.tsx:**
```tsx
<TabsTrigger
  className={`${
    isActive
      ? "bg-gradient-to-r from-[#00E7FF] via-[#00BFFF] to-[#7A2BFF] text-white shadow-[0_4px_15px_rgba(0,231,255,0.4)]"
      : "bg-white/90 text-sky-600 hover:text-sky-700 hover:bg-white border border-sky-200/50"
  }`}
>
```

---

### 5. DonationCelebration - Thêm Âm Thanh "Rich Rich Rich"

**Bước 1: Copy file âm thanh vào public:**
```
user-uploads://Rich_2_prompt_3.mp3 → public/audio/rich-celebration.mp3
```

**Bước 2: Cập nhật DonationCelebration.tsx:**
```tsx
useEffect(() => {
  // Phát âm thanh "Rich rich rich"
  const audio = new Audio('/audio/rich-celebration.mp3');
  audio.volume = 0.7;
  audio.play().catch(console.error);
  
  // Trigger confetti...
}, []);
```

---

## 📁 Files Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/Profile/ProfileInfo.tsx` | Nút "Tặng thưởng" vàng kim loại + Tên user rainbow + Xóa " là" |
| `src/components/Profile/ProfileTabs.tsx` | Các nút tab gradient xanh sáng-tím |
| `src/components/Profile/DonationCelebration.tsx` | Thêm âm thanh "Rich rich rich" |
| `src/index.css` | Thêm animation rainbow-shift |
| `src/pages/Channel.tsx` | Xóa " là" trong display name |
| `public/audio/rich-celebration.mp3` | Copy file âm thanh (mới) |

---

## 🎯 Kết Quả Mong Đợi

**Nút "Tặng thưởng":**
- Vàng kim loại sáng bóng, tráng gương
- Phát sáng glow vàng khi hover
- Sang trọng như nút VIP

**Tên User:**
- Màu cầu vồng 7 sắc chuyển động
- Không còn chữ "là" sau tên

**Tabs:**
- Gradient xanh sáng → xanh → tím (như thumbnail video)
- Sáng sủa, không tối như hiện tại

**Celebration:**
- Pháo hoa confetti
- Âm thanh "Rich rich rich" vui nhộn
- GIF chúc mừng đẹp

---

## 🧪 Testing Checklist

- [ ] Tên user hiển thị màu cầu vồng chuyển động
- [ ] Không còn chữ "là" sau tên
- [ ] Nút "Tặng thưởng" vàng kim loại sang trọng
- [ ] Các tab sáng màu gradient xanh-tím
- [ ] Khi nhận donation, nghe âm thanh "Rich rich rich"
- [ ] Pháo hoa + GIF hiển thị đẹp

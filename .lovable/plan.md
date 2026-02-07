
# 🌟 Cập Nhật Nút "Thưởng & Tặng" Trên Header - Vàng Kim Loại

## 📋 Vấn Đề Hiện Tại

Nút "Thưởng & Tặng" trong `GlobalDonateButton.tsx` (hiển thị trên Header trang chủ) vẫn dùng style cũ:
```tsx
// Style cũ - amber/orange nhạt
className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 
           hover:from-amber-500/20 hover:to-orange-500/20 
           border border-amber-500/30"
```

## 🎯 Mục Tiêu

Đồng bộ style vàng kim loại sáng bóng giống như nút "Tặng thưởng" trong `ProfileInfo.tsx`:
- Gradient vàng dọc: `#FFEA00` → `#FFD700` → `#E5A800`
- Glow vàng sáng
- Hiệu ứng tráng gương
- Text nâu đậm để dễ đọc

---

## 📁 File Cần Chỉnh Sửa

| File | Thay đổi |
|------|----------|
| `src/components/Donate/GlobalDonateButton.tsx` | Cập nhật cả 2 variant (default + mobile) với style vàng kim loại |

---

## 🔧 Chi Tiết Code

### GlobalDonateButton.tsx

**Variant Default (Desktop - dòng 51-62):**

Trước:
```tsx
<Button
  variant="ghost"
  onClick={handleClick}
  className={`flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 
             hover:from-amber-500/20 hover:to-orange-500/20 
             border border-amber-500/30 rounded-full px-4 ${className}`}
>
  <Gift className="h-4 w-4 text-amber-500" />
  <span className="text-sm font-medium hidden md:inline">Thưởng & Tặng</span>
</Button>
```

Sau (vàng kim loại sáng bóng):
```tsx
<Button
  onClick={handleClick}
  className={`relative group overflow-hidden flex items-center gap-2 
             bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
             text-[#7C5800] font-bold rounded-full px-4 py-2
             shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] 
             hover:shadow-[0_0_25px_rgba(255,234,0,0.6),0_0_40px_rgba(255,215,0,0.3)] 
             border border-[#FFEA00]/60 
             transition-all duration-300 hover:scale-105 ${className}`}
>
  <Gift className="h-4 w-4" />
  <span className="text-sm font-bold hidden md:inline">Thưởng & Tặng</span>
  {/* Shimmer effect */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
</Button>
```

**Variant Mobile (dòng 34-41):**

Trước:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={handleClick}
  className="relative h-9 w-9 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30"
>
  <Gift className="h-5 w-5 text-amber-500" />
</Button>
```

Sau (vàng kim loại mini):
```tsx
<Button
  size="icon"
  onClick={handleClick}
  className="relative h-9 w-9 rounded-full overflow-hidden
             bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800]
             shadow-[0_0_12px_rgba(255,215,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)]
             hover:shadow-[0_0_20px_rgba(255,234,0,0.7)]
             border border-[#FFEA00]/50
             transition-all duration-300 hover:scale-110"
>
  <Gift className="h-5 w-5 text-[#7C5800]" />
</Button>
```

---

## 🎨 So Sánh Trước/Sau

| Thuộc tính | Trước | Sau |
|------------|-------|-----|
| Background | amber-500/10 (rất nhạt) | #FFEA00 → #FFD700 → #E5A800 (vàng sáng) |
| Text | Mặc định | #7C5800 (nâu đậm) |
| Border | amber-500/30 | #FFEA00/60 (vàng sáng) |
| Shadow | Không có | Glow vàng + inset trắng |
| Hover | Chỉ đổi màu nhẹ | Scale + glow mạnh + shimmer |

---

## 🎯 Kết Quả Mong Đợi

Nút "Thưởng & Tặng" trên Header sẽ:
- ✨ Vàng kim loại sáng bóng giống nút trong trang cá nhân
- 🔆 Phát sáng glow vàng
- 💫 Shimmer effect khi hover
- 📱 Cả desktop và mobile đều đồng bộ style

---

## 🧪 Testing

- [ ] Nút trên Header trang chủ hiển thị màu vàng kim loại
- [ ] Hover có glow + shimmer effect
- [ ] Mobile button cũng vàng kim loại
- [ ] Icon Gift màu nâu đậm để dễ nhìn

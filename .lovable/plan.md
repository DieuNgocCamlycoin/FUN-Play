
# Đồng bộ màu Filter Chips Bar theo nút WALLET trên Header

## Tổng quan

Tất cả các nút trên **Filter Chips Bar** sẽ được cập nhật để sử dụng cùng bảng màu Teal-Cyan-Blue holographic của nút **WALLET** trên Header Bar. Thay đổi áp dụng đồng bộ cho cả Desktop và Mobile (cùng 1 component).

## Màu nút WALLET hiện tại (tham chiếu)

Nút WALLET sử dụng gradient ngang 5 điểm:
```
#5EEAD4 (Teal nhạt) → #22D3EE (Cyan) → #06B6D4 (Cyan đậm) → #0EA5E9 (Sky) → #0284C7 (Blue)
```

## Thiết kế mới

### Chip được chọn (Selected State)
- **Nền**: Gradient Teal-Cyan-Blue giống hệt nút WALLET
- **Chữ**: Trắng đậm (`text-white font-semibold`)
- **Viền**: Không viền rõ (`border-transparent`)
- **Không glow** -- giữ sạch sẽ theo yêu cầu trước đó (`!shadow-none`)

### Chip mặc định (Default State)
- **Nền**: Nền trắng trong suốt (`bg-white/90`)
- **Chữ**: Màu Cyan đậm (`text-[#0284C7]`) -- lấy từ điểm cuối gradient WALLET
- **Viền**: Viền Cyan nhẹ (`border-[#22D3EE]/30`)
- **Hover**: Viền Cyan đậm hơn + chữ đậm hơn
- **Không glow** (`!shadow-none`)

## File cần chỉnh sửa

**File duy nhất:** `src/components/Layout/CategoryChips.tsx`

### Thay đổi chi tiết

1. **Chip được chọn (dòng 34):**
   - Hiện tại:
     ```
     bg-white text-sky-700 !shadow-none border border-sky-200
     hover:bg-white hover:!shadow-none
     ```
   - Thay thành:
     ```
     bg-[linear-gradient(90deg,#5EEAD4_0%,#22D3EE_35%,#06B6D4_50%,#0EA5E9_75%,#0284C7_100%)]
     text-white font-semibold border border-transparent
     !shadow-none hover:brightness-110 hover:!shadow-none
     ```

2. **Chip mặc định (dòng 35):**
   - Hiện tại:
     ```
     bg-white/80 text-sky-600 border border-gray-200
     !shadow-none hover:bg-white hover:text-sky-700 hover:!shadow-none
     ```
   - Thay thành:
     ```
     bg-white/90 text-[#0284C7] border border-[#22D3EE]/30
     !shadow-none hover:bg-white hover:text-[#0369A1]
     hover:border-[#22D3EE]/50 hover:!shadow-none
     ```

## Tóm tắt

| Hạng mục | Chi tiết |
|----------|----------|
| File cần sửa | 1 (`CategoryChips.tsx`) |
| File mới | 0 |
| Cơ sở dữ liệu | Không thay đổi |
| Độ phức tạp | Rất thấp -- chỉ thay đổi CSS classes |
| Đồng bộ Mobile | Tự động (component dùng chung) |

## Kết quả

- Chip được chọn sẽ có gradient Teal-Cyan-Blue **giống hệt** nút WALLET, chữ trắng nổi bật
- Chip mặc định có chữ xanh Cyan đậm với viền Cyan nhẹ, hài hòa với tông màu chung
- Không có hiệu ứng glow (đã xóa từ trước)
- Desktop và Mobile đồng bộ 100%

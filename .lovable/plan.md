

## Nâng cấp giao diện TransactionStats — Sắc nét & rõ ràng hơn

### Tham khảo

Dựa trên 2 hình ảnh, thiết kế mới cần:
- Card viền mỏng, nền sạch (không backdrop-blur mờ)
- Icon nhỏ gọn nằm cùng dòng với label
- Label ngắn gọn hơn: "Tổng giao", "Tổng giá trị", "Hôm nay", "Thành công", "Xử lý"
- Giá trị (value) to, đậm, nổi bật
- 5 card ngang hàng trên desktop, 2-3 cột trên mobile
- Bỏ hiệu ứng glass/blur, thay bằng card phẳng có border rõ ràng

### File cần sửa

**`src/components/Transactions/TransactionStats.tsx`** — duy nhất 1 file

### Chi tiết thay đổi

1. **Card style mới**: Bỏ `bg-card/50 backdrop-blur-sm border-border/50`, thay bằng `bg-background border border-border rounded-xl` — nền trắng/sạch, viền rõ ràng

2. **Layout icon + label trên cùng dòng**: Icon nhỏ (h-3.5 w-3.5) nằm bên trái label text, cùng một hàng ngang. Bỏ khối icon background lớn (p-2 rounded-lg)

3. **Rút gọn label**:
   - "Tổng giao dịch" -> "Tổng giao"
   - "Tổng giá trị" -> "Tổng giá trị" (giữ nguyên)
   - "Hôm nay" -> "Hôm nay" (giữ nguyên)
   - "Thành công" -> "Thành công" (giữ nguyên)
   - "Chờ xử lý" -> "Xử lý"

4. **Value nổi bật hơn**: Tăng cỡ chữ value lên `text-xl font-bold`, suffix (CAMLY) vẫn nhỏ `text-xs`

5. **Bố cục**: Giữ grid `grid-cols-2 md:grid-cols-5`, bỏ thuộc tính `wide` (col-span-2) cho "Tổng giá trị" vì không cần thiết với label rút gọn

6. **Giữ nguyên**: Tooltip hiển thị giá trị đầy đủ khi hover vào "Tổng giá trị", logic format số


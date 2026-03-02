

## Cải thiện giao diện TransactionSummaryWidget

Dựa trên screenshot tham khảo, widget hiện tại hơi rời rạc với nhiều hàng nút riêng lẻ. Sẽ tổ chức lại gọn gàng và khoa học hơn.

### Thay đổi chính

#### File: `src/components/Transactions/TransactionSummaryWidget.tsx`

1. **Direction tabs**: Chuyển sang dạng segmented control liền mạch với gradient background cho tab active, bo tròn đẹp hơn (thay vì 3 button rời)

2. **Token filter**: Giữ dạng chip/pill nhỏ gọn, nhưng thêm rounded-full và spacing đều hơn

3. **Time filter**: Chuyển sang segmented control tương tự direction tabs, gradient cho active state

4. **Stats cards**: Giảm padding, font size vừa phải hơn, thêm subtle gradient background thay vì border cứng

5. **Token breakdown**: Chuyển sang grid 2 cột gọn hơn, mỗi ô có visual indicator (thanh nhỏ hoặc dot màu)

6. **Tổng thể**: 
   - Bỏ emoji trong title, thay bằng icon
   - Giảm spacing giữa các section (space-y-3 xuống space-y-2.5)
   - Direction và Time filter dùng div với rounded-full border làm container, các option bên trong không có border riêng
   - Active state dùng gradient `bg-gradient-to-r from-cyan-400 to-fuchsia-400` (match screenshot)

### Kết quả mong đợi
- Giao diện gọn gàng, các nhóm filter được nhóm rõ ràng
- Active state nổi bật với gradient đẹp mắt
- Stats cards clean hơn, dễ đọc
- Tổng thể chuyên nghiệp và khoa học hơn


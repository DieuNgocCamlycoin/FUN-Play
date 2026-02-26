

## Vấn đề

Khi user bấm MINT NOW, hàm `submitAutoRequest` bắt lỗi nội bộ và trả về `null` thay vì throw error. Trong `handleMint`, chỉ có nhánh `if (result)` hiển thị toast thành công — nếu `result` là `null` (lỗi), **không có toast nào được hiển thị**. Nhánh `catch` không bao giờ chạy vì lỗi đã bị nuốt bên trong hook.

Ngoài ra, sau khi mint thành công, thông báo hiện tại quá ngắn gọn ("Đang chờ Admin duyệt") — user không biết phải làm gì tiếp.

## Kế hoạch sửa

### File: `src/components/FunMoney/MintableCard.tsx`

1. **Thêm nhánh `else` khi `result` là null** — hiển thị toast error rõ ràng với thông tin lỗi từ hook (`error` state từ `useAutoMintRequest`)
2. **Cải thiện toast thành công** — thêm mô tả chi tiết hơn về các bước tiếp theo (Admin sẽ duyệt, sau đó token được mint on-chain)
3. **Hiển thị toast kết quả sau chuyển mạng** — thêm thông báo "Đã chuyển mạng thành công, đang gửi yêu cầu mint..." để user biết quá trình đang tiếp tục
4. **Thêm trạng thái hiển thị trên nút** — khi đang gửi request sau chuyển mạng, nút hiện "Đang gửi yêu cầu..." thay vì im lặng

### File: `src/hooks/useFunMoneyMintRequest.ts`

5. **Export `error` state từ `useAutoMintRequest`** — đã có sẵn, chỉ cần sử dụng trong component

### Chi tiết thay đổi chính trong `MintableCard.tsx`

- Destructure thêm `error: mintError` từ `useAutoMintRequest()`
- Dòng 99-108: Thêm nhánh else hiển thị `toast.error` với `mintError` hoặc message mặc định
- Dòng 100-102: Nâng cấp toast thành công với `duration: 8000` và description chi tiết hơn: số FUN đã gửi, ID request, hướng dẫn bước tiếp theo
- Dòng 74-85: Sau khi switch chain thành công, thêm `toast.info('Đang gửi yêu cầu mint...')` trước khi tiếp tục flow


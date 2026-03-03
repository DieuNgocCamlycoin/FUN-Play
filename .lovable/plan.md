

## Vấn đề
User angelgiau có 610 FUN mintable nhưng MINT NOW bị chặn vì Light Score = 0 (epoch tháng 3 mới bắt đầu, mọi hoạt động đều từ trước 01/03).

## Giải pháp đề xuất

Có 2 hướng xử lý:

### Hướng 1: Cập nhật light_score thủ công cho user (nhanh, để test)
- Chạy SQL update `light_score = 60` cho angelgiau
- Ưu: test ngay được luồng MINT NOW → multisig 3-of-3
- Nhược: chỉ là workaround tạm

### Hướng 2: Sửa logic tính Light Score tích lũy (triệt để)
- Thay đổi hàm `calculate_user_light_score` để tính tích lũy toàn bộ hoạt động (không chỉ epoch hiện tại), hoặc áp dụng "carry-over" từ epoch trước
- Ưu: giải quyết gốc rễ cho tất cả user
- Nhược: cần cân nhắc kỹ vì thay đổi quy tắc kinh tế

### Đề xuất: Thực hiện cả hai
1. **Ngay bây giờ**: Update thủ công `light_score = 60` cho angelgiau để test luồng mint end-to-end
2. **Tiếp theo**: Xem xét sửa logic epoch nếu cần (cần xác nhận từ team)

### Thay đổi kỹ thuật
- Chạy migration: `UPDATE profiles SET light_score = 60, light_score_details = light_score_details || '{"final_score": 60, "level": "sprout"}'::jsonb WHERE username = 'angelgiau'`
- Không cần sửa code frontend


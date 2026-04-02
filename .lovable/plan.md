

## Thông báo dễ thương khi user chưa đủ điều kiện Mint FUN

### Vấn đề
Hiện tại khi user bấm MINT NOW mà không đủ điều kiện, hệ thống hiện toast khô khan kiểu: *"Chưa đủ điều kiện mint"* với lý do kỹ thuật như *"Light Score (3) phải >= 10"*. Cần thay bằng lời nhắn dễ thương, động viên user.

### Giải pháp

Thay đổi **2 file** để hiển thị thông báo thân thiện, dễ thương với emoji và lời động viên:

**1. `src/hooks/useLightActivity.ts`** — Thay các `mintBlockReason` khô khan bằng lời nhắn dễ thương:

| Điều kiện | Hiện tại | Mới |
|-----------|----------|-----|
| Chưa chấp nhận PPLP | "Bạn cần chấp nhận Hiến chương PPLP trước khi mint" | "🌱 Hãy chấp nhận Hiến chương PPLP trước nhé! Đây là bước đầu tiên trên hành trình ánh sáng của bạn ✨" |
| Đang có request chờ | "Bạn đã có request đang chờ duyệt" | "⏳ Yêu cầu trước của bạn đang được xử lý rồi nè! Chờ chút xíu nhé, Admin đang lo cho bạn 💛" |
| Light Score thấp | "Light Score (X) phải >= 10" | "🌟 Điểm Ánh Sáng của bạn đang là X/10. Hãy tiếp tục xem video, đăng bài và tương tác để tỏa sáng hơn nha! 💪" |
| Ít hoạt động | "Cần ít nhất 10 activities" | "🎯 Bạn cần thêm hoạt động nữa nè! Hãy xem video, like, bình luận và chia sẻ để đủ điều kiện mint nhé 🌈" |
| Tài khoản đáng ngờ | "Tài khoản bị đánh dấu đáng ngờ" | "🔒 Tài khoản cần được xác minh thêm. Hãy liên hệ Admin để được hỗ trợ nhé! 🙏" |
| FUN quá ít | "Số FUN có thể mint quá nhỏ (< 1 FUN)" | "💫 Bạn gần đạt rồi! Cần tích lũy thêm một chút hoạt động để đủ 1 FUN mint nhé, cố lên! 🚀" |
| Cooldown | "Cần đợi X giờ nữa..." | "⏰ Bạn vừa mint xong rồi nè! Nghỉ ngơi X giờ nữa rồi quay lại mint tiếp nhé, Angel chờ bạn! 🤗" |

**2. `src/components/FunMoney/MintableCard.tsx`** — Thay `toast.error` bằng `toast.info` với title dễ thương:
- Title: "💝 Chưa đến lúc mint nè!" thay vì "Chưa đủ điều kiện mint"
- Duration tăng lên 7000ms để user đọc kịp

### Phạm vi thay đổi
- `src/hooks/useLightActivity.ts` — 7 dòng `mintBlockReason`
- `src/components/FunMoney/MintableCard.tsx` — 1 block toast (dòng 74-79)


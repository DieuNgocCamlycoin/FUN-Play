

# Tích hợp MintRequestForm (4-Step PPLP) vào trang /fun-money

## Tổng quan

Thêm luồng 4 bước PPLP (Submit Action → Upload Proof → Validate → Mint) vào trang `/fun-money`, song song với luồng Auto-Mint hiện tại. Người dùng sẽ thấy cả 2 lựa chọn.

## Thay đổi

### 1. Sửa `src/pages/FunMoneyPage.tsx`
- Thêm tab thứ 4 `"pplp-mint"` vào TabsList (đổi grid từ 3 → 4 cột)
- Tab mới có label "PPLP Mint" với icon Sparkles
- Nội dung tab: render `MintRequestForm` component kèm hướng dẫn ngắn về 4 bước
- Import `MintRequestForm` từ `@/components/FunMoney`
- Khi mint thành công → chuyển sang tab `history` và refresh data

### 2. Sửa `src/components/FunMoney/MintRequestForm.tsx`
- Hiển thị `validation_digest` và `anti_whale_capped` trong kết quả mint (Step 4)
- Thêm badge "Anti-Whale Capped" nếu `mintResult.anti_whale_capped === true`
- Hiển thị digest rút gọn (16 ký tự đầu) với tooltip

### Kết quả
- Người dùng có 2 cách mint: Auto-Mint (từ hoạt động nền tảng) và PPLP Mint (submit hành động thiện nguyện với bằng chứng)
- Kết quả mint hiển thị đầy đủ validation_digest và trạng thái anti-whale


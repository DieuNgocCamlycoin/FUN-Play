

# Báo Cáo Kiểm Tra Số Liệu FUN Money

## Dữ liệu thực tế từ hệ thống

| Chỉ số | Giá trị |
|--------|---------|
| Tổng user (profiles) | **806** |
| User có reward transactions | **720** |
| Tổng reward transactions | **15,439** |
| User đã tạo mint request | **1** |
| Tổng mint requests | **1** (status: approved, chưa minted) |

## FUN Tiềm Năng theo Action

| Action | Số lượt | FUN Tiềm Năng |
|--------|---------|---------------|
| UPLOAD (×100) | 626 | 62,600 |
| COMMENT (×15) | 3,730 | 55,950 |
| LIKE (×5) | 8,034 | 40,170 |
| VIEW (×10) | 2,176 | 21,760 |
| SHARE (×20) | 25 | 500 |
| OTHER (×0) | 848 | 0 |
| **Tổng** | **15,439** | **180,980** |

## Giải thích chênh lệch

### 1. Tổng FUN Tiềm Năng: 190,710 vs 180,980

Chênh lệch **9,730 FUN**. Nguyên nhân: Có **848 reward transactions** thuộc nhóm "OTHER" mà RPC gán FUN = 0, nhưng thực tế bao gồm:

| Reward Type | Số lượt | FUN hiện tại |
|-------------|---------|-------------|
| SIGNUP | 728 | 0 (chưa có hệ số) |
| FIRST_UPLOAD | 99 | 0 (chưa có hệ số) |
| WALLET_CONNECT | 20 | 0 (chưa có hệ số) |
| BOUNTY | 1 | 0 (chưa có hệ số) |

Con số **190,710** có thể đến từ một phiên bản trước của RPC hoặc một cách tính khác gán hệ số cho SIGNUP/FIRST_UPLOAD. Ví dụ nếu SIGNUP = 10 FUN và FIRST_UPLOAD = 10 FUN thì: 180,980 + 7,280 + 990 = **189,250** -- gần với 190,710.

### 2. Chỉ 1 user đã mint, 1,010 FUN

Hoàn toàn chính xác. Chỉ có đúng 1 mint request trong hệ thống:
- **User**: `767ada5c-...` 
- **Amount**: 1,010.00 FUN
- **Status**: `approved` (chưa thực sự minted on-chain)
- **Ngày**: 2026-02-10

### 3. 720 user vs 806 profiles

- 806 tài khoản đã tạo profile
- 720 user có ít nhất 1 reward transaction (view/like/comment/upload...)
- 86 user đã đăng ký nhưng chưa thực hiện hành động nào được ghi nhận reward

## Đề xuất cải thiện

Nếu muốn FUN Tiềm Năng bao gồm cả SIGNUP, FIRST_UPLOAD, WALLET_CONNECT, BOUNTY, cần cập nhật RPC thêm hệ số cho các reward_type này. Ví dụ:

```text
SIGNUP      → 10 FUN
FIRST_UPLOAD → 10 FUN  
WALLET_CONNECT → 5 FUN
BOUNTY      → (theo reward_amount thực tế)
```

Hiện tại RPC chỉ tính 5 action chính (VIEW, LIKE, COMMENT, SHARE, UPLOAD) và bỏ qua các loại khác, dẫn đến con số thấp hơn thực tế nếu có hệ thống reward cho SIGNUP.


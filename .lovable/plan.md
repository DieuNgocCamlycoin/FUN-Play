

## Phân tích: Nguồn gốc số liệu trên bảng MintableCard

### Kết luận: Số liệu là **hỗn hợp không nhất quán**

Có **2 nguồn dữ liệu khác nhau** đang được trộn lẫn:

### 1. Activity Counts (nguồn: `reward_transactions` — toàn bộ hệ sinh thái CAMLY)

Hàm RPC `get_user_activity_summary` đếm từ bảng `reward_transactions` theo `reward_type`:
- `views` = COUNT WHERE reward_type = 'VIEW'
- `likes` = COUNT WHERE reward_type = 'LIKE'  
- `comments` = COUNT WHERE reward_type = 'COMMENT'
- `shares` = COUNT WHERE reward_type = 'SHARE'
- `uploads` = COUNT WHERE reward_type IN ('UPLOAD', 'SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD', 'FIRST_UPLOAD')

**Đây là số lượng hoạt động từ hệ thống thưởng CAMLY** (reward_transactions), KHÔNG phải đếm trực tiếp từ các bảng thực tế (videos, comments, likes, posts...).

### 2. FUN Reward Calculation (nguồn: `BASE_REWARDS.FUN_PLAY` — chỉ FUN_PLAY)

Hàm `calculateMintableFun` dùng `ACTIVITY_TO_ACTION` mapping:
```
views → WATCH_VIDEO (10 FUN/action)
likes → LIKE_VIDEO (5 FUN/action)  
comments → COMMENT (15 FUN/action)
shares → SHARE (20 FUN/action)
uploads → UPLOAD_VIDEO (100 FUN/action)
```

→ Nhân count × base reward × multipliers = `totalMultipliedReward` (18,637.88 FUN)

### 3. Already Minted (nguồn: `mint_requests` WHERE platform_id = 'FUN_PLAY')

Sau fix gần nhất, đã filter đúng `FUN_PLAY` = 3,530 FUN ✓

### Vấn đề chính

| Số liệu | Nguồn | Scope |
|----------|-------|-------|
| Activity counts | `reward_transactions` | **Toàn bộ CAMLY ecosystem** |
| FUN reward rates | `BASE_REWARDS.FUN_PLAY` | **Chỉ FUN_PLAY** |
| Already minted | `mint_requests` | **Chỉ FUN_PLAY** ✓ |

**→ Tổng FUN (18,637.88) = Số lượng hoạt động CAMLY × Giá FUN_PLAY** — đây là phép tính sai scope vì:
- Nếu user xem 1000 video trên CAMLY system → được đếm 1000 views → tính 1000 × 10 FUN = 10,000 FUN
- Nhưng thực tế FUN_PLAY chưa chắc tracking riêng các hoạt động này

### 2 hướng sửa

**Hướng A: Giữ nguyên scope hiện tại (khuyến nghị)**
- Activity counts từ `reward_transactions` đã là hoạt động thực tế của user trên FUN PLAY platform
- `reward_transactions` ghi nhận mọi hoạt động đã được verify trên platform → **đây chính là hoạt động FUN PLAY**
- Chỉ cần đảm bảo `ACTIVITY_TO_ACTION` mapping không bỏ sót action types (hiện thiếu `SIGNUP`, `WALLET_CONNECT`, `CREATE_POST`)

**Hướng B: Tách riêng nguồn dữ liệu**
- Tạo RPC mới đếm từ `pplp_events` WHERE source liên quan FUN_PLAY
- Phức tạp hơn và có thể không cần thiết

### Đề xuất sửa: Thêm action types bị thiếu

Hiện `ACTIVITY_TO_ACTION` chỉ map 5/8 action types trong `BASE_REWARDS.FUN_PLAY`:

```text
Đã có:  WATCH_VIDEO, LIKE_VIDEO, COMMENT, SHARE, UPLOAD_VIDEO
Thiếu:  SIGNUP (10 FUN), WALLET_CONNECT (5 FUN), CREATE_POST (30 FUN)
```

Tuy nhiên SIGNUP và WALLET_CONNECT là one-time actions, không nằm trong `reward_transactions` dưới dạng recurring. Chỉ **CREATE_POST** cần được thêm vì nó tương ứng với posts đang được đếm trong hệ thống.

### Thay đổi cụ thể

1. **`src/hooks/useLightActivity.ts`**: Thêm `posts` vào `ActivityCounts` interface và `ACTIVITY_TO_ACTION` mapping
2. **`get_user_activity_summary` RPC**: Đã có sẵn count cho posts (chưa được expose riêng nhưng có thể thêm qua `reward_type = 'POST'` hoặc đếm từ bảng `posts`)
3. **`src/components/FunMoney/MintableCard.tsx`**: Hiển thị thêm dòng CREATE_POST trong breakdown

### Kết luận

Số liệu hiện tại **về cơ bản là đúng cho FUN PLAY** vì `reward_transactions` chính là nguồn ghi nhận hoạt động trên platform. Phép tính Mintable = Tổng − Đã Mint đã nhất quán sau fix. Vấn đề còn lại là thiếu mapping cho `CREATE_POST` action.


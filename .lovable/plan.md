

# Tính Lại Toàn Bộ Phần Thưởng CAMLY & Chống Gian Lận

## Vấn Đề Phát Hiện

| Loại gian lận | Số lượng bản trùng | CAMLY bị tính sai |
|---------------|--------------------|--------------------|
| LIKE trùng lặp (like/unlike/like lại) | 10.677 bản | 53.382.000 CAMLY |
| VIEW trùng lặp (xem lại cùng video) | 189 bản | 1.728.500 CAMLY |
| COMMENT trùng lặp (bình luận cùng video) | 632 bản | 3.160.000 CAMLY |
| LIKE tính sai mức (5.000 thay vì 2.000) | ~16.154 bản | Chênh lệch ~48.462.000 CAMLY |
| **Tổng cộng** | **11.498 bản trùng** | **~106.732.500 CAMLY** |

### Tổng quan hệ thống hiện tại

| Chỉ tiêu | Giá trị |
|-----------|---------|
| Tổng người dùng có thưởng | 223 |
| Tổng thưởng toàn hệ thống | 179.881.000 CAMLY |
| Đã claim về ví (giữ nguyên) | 6.874.000 CAMLY |
| Chưa claim (cần tính lại) | 173.007.000 CAMLY |

---

## Công Thức Mới Được Áp Dụng

### Người xem (Viewer)
- Xem video (>=30% thời lượng): **5.000 CAMLY** - tối đa 10 lượt/ngày
- Thích video (1 lần/video): **2.000 CAMLY** - tối đa 20 lượt/ngày
- Bình luận (>=20 ký tự, 1 lần/video): **5.000 CAMLY** - tối đa 10 lượt/ngày
- Chia sẻ (1 lần/video): **5.000 CAMLY** - tối đa 10 lượt/ngày
- **Giới hạn viewer/ngày: 190.000 CAMLY**

### Người tạo nội dung (Creator)
- Video ngắn (<3 phút, >=3 lượt xem): **20.000 CAMLY** - tối đa 5 video/ngày
- Video dài (>=3 phút, >=3 lượt xem): **70.000 CAMLY** - tối đa 3 video/ngày
- **Giới hạn creator/ngày: 310.000 CAMLY**

### Thưởng một lần
- Đăng ký tài khoản: **50.000 CAMLY**
- Upload video đầu tiên: **500.000 CAMLY**

### Giới hạn cứng: **500.000 CAMLY/ngày/người**

---

## Kế Hoạch Thực Hiện (3 Bước)

### Bước 1: Database Migration — Dọn dẹp dữ liệu lịch sử

**1.1. Lưu bản sao dự phòng (snapshot)**
```sql
CREATE TABLE reward_snapshot_20260213 AS SELECT * FROM reward_transactions;
```

**1.2. Xóa tất cả giao dịch trùng lặp**

Với mỗi loại LIKE, VIEW, COMMENT — giữ lại bản đầu tiên (cũ nhất) cho mỗi cặp `(user_id, video_id)`, xóa tất cả bản còn lại:

```sql
DELETE FROM reward_transactions WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, video_id, reward_type
      ORDER BY created_at ASC
    ) as rn
    FROM reward_transactions
    WHERE reward_type IN ('LIKE','VIEW','COMMENT')
      AND video_id IS NOT NULL
  ) sub WHERE rn > 1
);
```

**1.3. Cập nhật mức thưởng theo công thức mới (chỉ phần chưa claim)**

```sql
-- LIKE: 5.000 -> 2.000
UPDATE reward_transactions
SET amount = 2000
WHERE reward_type = 'LIKE' AND claimed = false AND amount != 2000;

-- VIEW: chuẩn hóa về 5.000
UPDATE reward_transactions
SET amount = 5000
WHERE reward_type = 'VIEW' AND claimed = false AND amount != 5000;
```

**1.4. Mở rộng bảng `reward_actions` để theo dõi COMMENT**

```sql
ALTER TABLE reward_actions
  DROP CONSTRAINT reward_actions_action_type_check;
ALTER TABLE reward_actions
  ADD CONSTRAINT reward_actions_action_type_check
  CHECK (action_type IN ('VIEW', 'LIKE', 'SHARE', 'COMMENT'));
```

**1.5. Điền dữ liệu vào `reward_actions` từ lịch sử hợp lệ**

```sql
INSERT INTO reward_actions (user_id, video_id, action_type)
SELECT DISTINCT user_id, video_id, reward_type
FROM reward_transactions
WHERE reward_type IN ('LIKE','SHARE','VIEW','COMMENT')
  AND video_id IS NOT NULL
ON CONFLICT (user_id, video_id, action_type) DO NOTHING;
```

**1.6. Tính lại toàn bộ số dư người dùng**

```sql
SELECT sync_reward_totals();
```

---

### Bước 2: Cập Nhật Edge Function `award-camly`

**2.1. Sửa mức thưởng LIKE mặc định**

Dòng 12 trong `supabase/functions/award-camly/index.ts`:
```
LIKE: 5000  →  LIKE: 2000
```

**2.2. Mở rộng kiểm tra trùng lặp cho TẤT CẢ loại hành động**

Hiện tại (dòng 302-316) chỉ kiểm tra LIKE và SHARE. Cần mở rộng sang VIEW và COMMENT:

```typescript
// TRƯỚC: chỉ LIKE và SHARE
if ((type === "LIKE" || type === "SHARE") && videoId) {

// SAU: tất cả loại có videoId
if (["LIKE", "SHARE", "VIEW", "COMMENT"].includes(type) && videoId) {
```

**2.3. Thêm kiểm tra nội dung bình luận phía máy chủ**

Thay vì tin tưởng `commentLength` từ client, truy vấn nội dung thực từ cơ sở dữ liệu:

```typescript
if (type === "COMMENT" && videoId) {
  const { data: binhLuanMoiNhat } = await adminSupabase
    .from("comments")
    .select("content")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!binhLuanMoiNhat?.content ||
      binhLuanMoiNhat.content.trim().length < validation.MIN_COMMENT_LENGTH) {
    return new Response(JSON.stringify({
      success: false,
      reason: `Bình luận phải có ít nhất ${validation.MIN_COMMENT_LENGTH} ký tự`
    }), { status: 200, headers: {...corsHeaders, 'Content-Type': 'application/json'} });
  }
}
```

**2.4. Thêm giới hạn cứng 500.000 CAMLY/ngày/người**

Trước khi cộng thưởng (trước dòng 412), kiểm tra tổng thưởng hôm nay:

```typescript
const tổngHômNay =
  (limits?.view_rewards_earned || 0) +
  (limits?.like_rewards_earned || 0) +
  (limits?.share_rewards_earned || 0) +
  (limits?.comment_rewards_earned || 0) +
  (limits?.upload_rewards_earned || 0);

const GIỚI_HẠN_NGÀY = 500000;
if (tổngHômNay + amount > GIỚI_HẠN_NGÀY) {
  return new Response(JSON.stringify({
    success: false,
    reason: `Đã đạt giới hạn thưởng hàng ngày (${GIỚI_HẠN_NGÀY.toLocaleString()} CAMLY)`
  }), { status: 200, headers: {...corsHeaders, 'Content-Type': 'application/json'} });
}
```

**2.5. Mở rộng ghi `reward_actions` cho VIEW và COMMENT**

Dòng 444-451: mở rộng từ chỉ LIKE/SHARE sang tất cả loại có videoId:

```typescript
// TRƯỚC
if ((type === "LIKE" || type === "SHARE") && videoId) {

// SAU
if (["LIKE", "SHARE", "VIEW", "COMMENT"].includes(type) && videoId) {
```

---

### Bước 3: Cập Nhật Hằng Số Phía Client

Tệp `src/lib/enhancedRewards.ts` — sửa dòng 7:
```
LIKE: 2000  →  LIKE: 2000  (đã đúng, giữ nguyên)
```

Xác nhận: tệp client hiện tại đã có `LIKE: 2000`, không cần thay đổi.

---

## Tóm Tắt Các Biện Pháp Chống Gian Lận

| Loại gian lận | Biện pháp ngăn chặn |
|---------------|---------------------|
| Like/unlike/like lại để cày thưởng | Bảng `reward_actions` với UNIQUE constraint `(user_id, video_id, action_type)` — mỗi hành động chỉ được thưởng **1 lần duy nhất** cho mỗi video |
| Xem lặp lại cùng video | Kiểm tra `reward_actions` + cửa sổ chống trùng 60 giây qua `view_logs` |
| Bình luận ngắn/spam | Kiểm tra nội dung thực tế từ cơ sở dữ liệu (>=20 ký tự), không tin client |
| Bình luận trùng nội dung | Kiểm tra `content_hash` qua `comment_logs` |
| Cày quá nhiều thưởng/ngày | Giới hạn cứng **500.000 CAMLY/ngày/người** |
| Chia sẻ trùng lặp | Bảng `reward_actions` ngăn thưởng SHARE nhiều lần cho cùng video |

---

## Tác Động Dự Kiến

| Chỉ tiêu | Trước | Sau |
|-----------|-------|-----|
| Tổng chưa claim | 173.007.000 CAMLY | ~84.250.000 CAMLY |
| Giảm | | -88.757.000 CAMLY (-51,3%) |
| Đã claim (giữ nguyên) | 6.874.000 CAMLY | 6.874.000 CAMLY |

## Danh Sách Tệp Cần Thay Đổi

| Tệp | Nội dung thay đổi |
|------|-------------------|
| Database migration (SQL) | Lưu snapshot, xóa trùng lặp, cập nhật mức thưởng, mở rộng constraint, backfill `reward_actions`, chạy `sync_reward_totals()` |
| `supabase/functions/award-camly/index.ts` | Sửa LIKE 5000 thành 2000, mở rộng kiểm tra trùng lặp cho VIEW/COMMENT, thêm kiểm tra nội dung bình luận phía máy chủ, thêm giới hạn cứng 500K/ngày |


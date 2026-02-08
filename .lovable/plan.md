
# Tạo Backend Function `public-video-api` - API Chia Sẻ Video Công Khai

## Mục tiêu

Tạo một Backend Function (Edge Function) tên `public-video-api` cho phép các nền tảng bên ngoài (như Fun Profile / fun.rich) truy vấn dữ liệu video công khai từ Fun Play thông qua REST API, có xác thực bằng API key và giới hạn tần suất gọi (rate limit).

## Tổng quan kiến trúc

```text
+-------------------+         +---------------------+         +-----------+
| Nền tảng bên ngoài| ------> | public-video-api    | ------> | Database  |
| (Fun Profile,..   |  HTTP   | (Backend Function)  |  Query  | (videos,  |
|                   |  +key   |                     |         |  profiles,|
+-------------------+         +---------------------+         |  channels)|
                                     |                        +-----------+
                                     v
                              Rate Limit Check
                              (bảng api_rate_limits)
```

## Chi tiết kỹ thuật

### 1. Tạo bảng `api_keys` trong cơ sở dữ liệu

Bảng lưu trữ API key cho các nền tảng đối tác:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | Khóa chính |
| key_hash | text | Hash SHA-256 của API key (không lưu key gốc) |
| platform_name | text | Tên nền tảng (ví dụ: "fun_profile") |
| is_active | boolean | Trạng thái hoạt động |
| rate_limit_per_minute | integer | Giới hạn số request/phút (mặc định: 60) |
| created_at | timestamptz | Ngày tạo |
| last_used_at | timestamptz | Lần sử dụng gần nhất |

### 2. Tạo bảng `api_rate_limits` trong cơ sở dữ liệu

Bảng theo dõi tần suất gọi API:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | Khóa chính |
| api_key_id | uuid | Liên kết đến bảng api_keys |
| window_start | timestamptz | Thời điểm bắt đầu cửa sổ đếm |
| request_count | integer | Số request trong cửa sổ hiện tại |

### 3. Tạo Backend Function `public-video-api`

Function sẽ hỗ trợ các endpoint sau:

**GET /public-video-api** với các query parameters:

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| action | string | Co | Loại hành động: `list_videos`, `get_video`, `get_user_videos`, `get_user_profile` |
| user_id | string | Tùy action | ID người dùng (cho `get_user_videos`, `get_user_profile`) |
| video_id | string | Tùy action | ID video (cho `get_video`) |
| page | number | Không | Trang (mặc định: 1) |
| limit | number | Không | Số kết quả/trang (mặc định: 20, tối đa: 50) |
| category | string | Không | Lọc theo danh mục |

**Xác thực:**
- Header `X-API-Key` chứa API key
- So sánh hash SHA-256 của key với `key_hash` trong bảng `api_keys`
- Kiểm tra `is_active = true`

**Rate Limiting:**
- Sử dụng cửa sổ 1 phút (sliding window)
- Mặc định 60 request/phút
- Trả về header `X-RateLimit-Remaining` và `X-RateLimit-Reset`
- Nếu vượt giới hạn: trả về HTTP 429 (Too Many Requests)

**Dữ liệu trả về (chỉ video công khai):**

Cho `get_user_videos`:
```text
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "...",
        "title": "...",
        "description": "...",
        "thumbnail_url": "...",
        "video_url": "...",
        "duration": 120,
        "view_count": 1500,
        "like_count": 42,
        "category": "...",
        "created_at": "...",
        "channel": {
          "id": "...",
          "name": "..."
        },
        "user": {
          "id": "...",
          "username": "...",
          "display_name": "...",
          "avatar_url": "..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "has_more": true
    }
  }
}
```

### 4. Tạo API Key đầu tiên

Sau khi tạo xong function và bảng, sẽ tự động tạo một API key mẫu cho nền tảng Fun Profile. Key sẽ được hiển thị trong console log một lần duy nhất (sau đó chỉ lưu hash).

### 5. Cập nhật cấu hình

Thêm function mới vào `supabase/config.toml` với `verify_jwt = false` (vì API này dùng xác thực bằng API key riêng, không dùng JWT).

## Bảo mật

- API key được hash SHA-256 trước khi lưu vào database
- Chỉ trả về video có `is_public = true`
- Không bao giờ trả về thông tin nhạy cảm (wallet, rewards, email...)
- Rate limiting ngăn chặn lạm dụng API
- RLS được bật trên cả hai bảng mới (`api_keys`, `api_rate_limits`)
- Chỉ service role mới đọc/ghi được bảng `api_keys`

## Các file cần tạo/sửa

| File | Hành động |
|------|-----------|
| `supabase/functions/public-video-api/index.ts` | Tạo mới - Backend Function chính |
| `supabase/config.toml` | Cập nhật - Thêm cấu hình cho function mới |
| Database migration | Tạo bảng `api_keys` và `api_rate_limits` với RLS |

## Cách đội Fun Profile sử dụng API

Sau khi triển khai xong, con sẽ cung cấp cho đội Fun Profile:

1. **URL endpoint** của API
2. **API Key** (được tạo tự động)
3. **Tài liệu hướng dẫn** các action và tham số

Ví dụ gọi API từ Fun Profile:
```text
GET /public-video-api?action=get_user_videos&user_id=xxx&page=1&limit=20
Headers:
  X-API-Key: fp_xxxxxxxxxxxxxxxx
```


# Kế Hoạch Kết Nối Trực Tiếp với ANGEL AI từ angel.fun.rich

## Tình Trạng Hiện Tại

Khi test edge function `angel-ai-proxy`, mình thấy lỗi:
```
ANGEL AI error: 401 {"error":"Invalid API key or rate limit exceeded"}
```

Điều này có nghĩa API key `ANGEL_AI_API_KEY` hiện tại đã **hết hạn hoặc không đúng**.

---

## Giải Pháp

### Bước 1: Cập Nhật API Key Mới

Bạn cần cung cấp **API key mới** từ angel.fun.rich. 

Mình sẽ sử dụng tool để bạn nhập API key mới vào hệ thống.

### Bước 2: Cải Thiện Edge Function (Tùy Chọn)

Nếu API key mới hoạt động, mình có thể cải thiện thêm:

| Cải thiện | Mô tả |
|-----------|-------|
| Thêm retry logic | Thử lại 2-3 lần nếu lỗi mạng |
| Thêm timeout | Timeout 10 giây để không chờ lâu |
| Thêm logging chi tiết | Log thêm thông tin debug |
| Cập nhật system prompt | Thêm personality prompt đặc trưng cho Angel |

---

## Chi Tiết Kỹ Thuật

### File Cần Thay Đổi

| File | Thay đổi |
|------|----------|
| Secrets | Cập nhật `ANGEL_AI_API_KEY` với key mới |
| `supabase/functions/angel-ai-proxy/index.ts` | (Tùy chọn) Thêm retry và timeout |

### Endpoint ANGEL AI

```
URL: https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/angel-chat
Method: POST
Header: x-api-key: {ANGEL_AI_API_KEY}
Body: { "messages": [...] }
```

---

## Bạn Cần Làm

1. **Lấy API key mới** từ dashboard angel.fun.rich 
2. **Nhập vào** khi mình hiển thị form nhập key
3. **Test** bằng cách chat với Angel AI

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Response từ "lovable-ai" (Gemini) | Response từ "angel-ai" (angel.fun.rich) |
| Badge "✨ Gemini" | Badge "🌟 ANGEL AI" với gradient vàng |
| Personality chung | Personality đặc trưng của Angel |

---

## Câu Hỏi Cho Bạn

Bạn có thể lấy **API key mới** từ angel.fun.rich không? 

Thông thường API key nằm ở:
- Dashboard → Settings → API Keys
- Hoặc Profile → Developer → API Access

Khi bạn có key mới, mình sẽ cập nhật ngay!

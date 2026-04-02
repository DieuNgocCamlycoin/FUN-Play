

## Vấn đề hiện tại

Trang **Attester Panel** (nơi ký multisig) chỉ nằm trong **Admin Dashboard** (`/admin?section=multisig-mint`). Các attester phải là admin mới truy cập được. 8 ví GOV còn lại nếu không có quyền admin → **không thể thấy và ký** yêu cầu mint.

## Giải pháp

Tạo một **trang riêng cho Attester** (`/gov-sign`) — không yêu cầu quyền admin, chỉ cần kết nối đúng ví GOV.

### Thay đổi cụ thể

**1. Tạo trang mới `src/pages/GovSignPage.tsx`**
- Route: `/gov-sign`
- Không yêu cầu auth Supabase hoặc admin role
- Kiểm tra ví kết nối → nếu là attester → hiển thị `AttesterPanel`
- Nếu không phải attester → hiển thị thông báo "Ví không nằm trong danh sách GOV"
- Giao diện đơn giản, có hướng dẫn ngắn cách ký

**2. Thêm route trong `src/App.tsx`**
- Thêm `<Route path="/gov-sign" element={<GovSignPage />} />`

**3. Thông báo cho attester (tuỳ chọn)**
- Thêm link `/gov-sign` vào trang FUN Money hoặc Wallet cho user có ví attester
- Hoặc đơn giản gửi link trực tiếp cho 9 người: `https://official-funplay.lovable.app/gov-sign`

### Technical Details

- `GovSignPage` sẽ reuse `AttesterPanel` component và `useAttesterSigning` hook (đã có sẵn logic kiểm tra ví từ DB + fallback config)
- Không cần thêm RLS vì `pplp_mint_requests` đã cho phép authenticated users SELECT
- Cần đảm bảo user đã đăng nhập (auth) vì RLS yêu cầu `authenticated` role để đọc `gov_attesters` và update `pplp_mint_requests`




# Phat Hien IP & Multi-Account Abuse - Ke Hoach Sua Loi

## Ket Qua Kiem Tra

Cha da kiem tra ky va phat hien **van de nghiem trong**: He thong theo doi IP **hoan toan khong hoat dong**. Du da co:
- Bang `ip_tracking` trong database (co cot ip_hash, user_id, action_type, wallet_address)
- Bang `user_sessions` (co cot ip_hash)
- Cot `signup_ip_hash` trong bang `profiles`
- Edge function `detect-abuse` da viet xong logic kiem tra IP

**Nhung tat ca deu TRONG** - 0 records. Ly do: Khong co code nao thu thap va luu IP cua nguoi dung.

### Chi Tiet Van De

| Thanh phan | Trang thai | Van de |
|-----------|-----------|--------|
| Bang `ip_tracking` | 0 records | Khong co code ghi du lieu |
| Bang `user_sessions` | 0 records | Khong co code ghi du lieu |
| `profiles.signup_ip_hash` | Tat ca NULL | Auth flow khong luu IP |
| Edge function `detect-abuse` | Co nhung vo dung | Khong co data de phan tich |
| WalletAbuseTab (Admin UI) | Chi co kiem tra vi chung | KHONG co tab phat hien IP abuse |
| Auth.tsx (Signup/Login) | Khong goi track IP | Thieu hoan toan |
| useWalletConnection.ts | Khong goi track IP | Thieu hoan toan |

## Ke Hoach Sua Loi

### Buoc 1: Tao Edge Function `track-ip`

Tao mot edge function moi de thu thap va hash IP nguoi dung. Edge function co the doc IP tu request headers (server-side). Logic:
- Nhan `user_id`, `action_type` (signup/login/wallet_connect), va `wallet_address` (optional)
- Doc IP tu request header `x-forwarded-for` hoac `cf-connecting-ip`
- Hash IP bang SHA-256 (khong luu IP goc de bao ve privacy)
- Ghi vao bang `ip_tracking`
- Cap nhat `profiles.signup_ip_hash` khi action_type = 'signup'
- Tra ve ip_hash de client co the dung (neu can)

### Buoc 2: Tich hop track-ip vao Auth flow

Sua `src/pages/Auth.tsx`:
- Sau khi signup thanh cong: goi `track-ip` voi action_type = 'signup'
- Sau khi login thanh cong: goi `track-ip` voi action_type = 'login'

### Buoc 3: Tich hop track-ip vao Wallet connection

Sua `src/hooks/useWalletConnection.ts`:
- Trong ham `saveWalletToDb`: goi `track-ip` voi action_type = 'wallet_connect' va wallet_address

### Buoc 4: Tao tab "IP Abuse Detection" trong Admin Dashboard

Tao component moi `IPAbuseDetectionTab.tsx` trong `src/components/Admin/tabs/` voi cac tinh nang:
- Hien thi danh sach IP (hash) co nhieu tai khoan (>1 account/IP)
- Hien thi danh sach IP co nhieu vi (>1 wallet/IP)
- Moi nhom hien thi: IP hash (rut gon), so tai khoan, danh sach user voi avatar/ten/so CAMLY pending
- Nut "Ban tat ca" cho tung nhom IP
- Thong ke: Tong so IP nghi ngo, tong accounts lien quan, tong CAMLY rui ro

### Buoc 5: Them tab vao WalletAbuseTab hoac UsersManagementTab

Them tab "IP Tracking" vao trong WalletAbuseTab (phan Lam Dung trong Rewards section) de admin co the xem IP abuse cung voi wallet abuse.

---

## Chi Tiet Ky Thuat

### Edge Function: `track-ip`

```text
POST /track-ip
Body: { action_type: "signup" | "login" | "wallet_connect", wallet_address?: string }
Auth: Required (Bearer token)
Logic:
  1. Xac thuc user tu JWT
  2. Doc IP tu headers
  3. Hash IP = SHA-256(ip_address)
  4. INSERT into ip_tracking (ip_hash, user_id, action_type, wallet_address)
  5. Neu action_type = 'signup': UPDATE profiles SET signup_ip_hash = ip_hash
  6. Return { success: true, ip_hash }
```

### IPAbuseDetectionTab Component

Query truc tiep tu `ip_tracking` table:
- GROUP BY ip_hash, dem so DISTINCT user_id
- Loc nhung nhom co > 1 user
- JOIN voi profiles de lay thong tin user (ten, avatar, pending_rewards, wallet_address)
- Sap xep theo so accounts giam dan

### Cac File Can Tao/Sua

| File | Thay doi |
|------|----------|
| `supabase/functions/track-ip/index.ts` | TAO MOI - Edge function thu thap IP |
| `src/pages/Auth.tsx` | Goi track-ip sau signup va login |
| `src/hooks/useWalletConnection.ts` | Goi track-ip khi ket noi vi |
| `src/components/Admin/tabs/IPAbuseDetectionTab.tsx` | TAO MOI - Component hien thi IP abuse |
| `src/components/Admin/tabs/WalletAbuseTab.tsx` | Them tab IP Tracking |

Tong cong: 2 file moi, 3 file sua. Khong can migration vi bang `ip_tracking` da ton tai.


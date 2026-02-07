
# 🎁 Kế Hoạch Triển Khai Hệ Thống "THƯỞNG & TẶNG / REWARD & DONATE" Toàn Diện

## 📊 Phân Tích Hiện Trạng

### Đã có sẵn:
| Component | Trạng thái | Ghi chú |
|-----------|------------|---------|
| `DonateModal.tsx` | ✅ Hoàn thành | Đã đổi tên từ TipModal, hỗ trợ BSC on-chain |
| `donation.ts` | ✅ Hoàn thành | Hàm sendDonation() cho giao dịch BSC |
| `wallet_transactions` table | ✅ Có sẵn | Lưu giao dịch on-chain |
| `GlobalPaymentNotifications` | ✅ Có sẵn | Realtime thông báo khi nhận tiền |
| `RichNotification` | ✅ Có sẵn | Confetti celebration overlay |
| `useTopSponsors` hook | ✅ Có sẵn | Lấy top donors từ wallet_transactions |
| `SUPPORTED_TOKENS` config | ✅ Có sẵn | BNB, USDT, CAMLY, BTC |

### Cần bổ sung:
| Tính năng | Trạng thái | Mức độ ưu tiên |
|-----------|------------|----------------|
| Token FUN MONEY (nội bộ off-chain) | ❌ Chưa có | CAO |
| Bảng `donate_tokens` quản lý token | ❌ Chưa có | CAO |
| Bảng `internal_wallets` balance nội bộ | ❌ Chưa có | CAO |
| Bảng `donation_transactions` toàn diện | ❌ Chưa có | CAO |
| Nút "🎁 Thưởng & Tặng" trên Header | ❌ Chưa có | CAO |
| Nút "Tặng" trên mỗi POST | ❌ Chưa có | CAO |
| Ô lời nhắn (message) trong modal | ❌ Chưa có | TRUNG BÌNH |
| Chat tin nhắn liên kết giao dịch | ❌ Chưa có | TRUNG BÌNH |
| Receipt Page public share | ❌ Chưa có | TRUNG BÌNH |
| Celebration Receipt overlay (giữ lại) | ❌ Chưa có | CAO |
| Export CSV/XLSX báo cáo | ❌ Chưa có | THẤP |

---

## 🗄️ PHASE 1: DATABASE SCHEMA

### Bảng 1: `donate_tokens` - Quản lý Token

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| symbol | TEXT UNIQUE | FUNM, CAMLY, BNB, USDT |
| name | TEXT | Tên đầy đủ |
| chain | TEXT | 'internal' hoặc 'bsc' |
| contract_address | TEXT | NULL cho internal tokens |
| decimals | INTEGER | Số thập phân |
| is_enabled | BOOLEAN | Có thể sử dụng không |
| priority | INTEGER | Thứ tự ưu tiên (1=cao nhất) |
| icon_url | TEXT | URL icon |
| created_at | TIMESTAMPTZ | Thời gian tạo |

**Seed Data:**
- FUN MONEY (FUNM) - priority=1, chain='internal'
- CAMLY COIN (CAMLY) - priority=2, chain='bsc'
- BNB - priority=3, chain='bsc'
- USDT - priority=4, chain='bsc'

### Bảng 2: `internal_wallets` - Balance Nội Bộ

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID FK | Liên kết profiles |
| token_id | UUID FK | Liên kết donate_tokens |
| balance | NUMERIC | Số dư (CHECK >= 0) |
| updated_at | TIMESTAMPTZ | Cập nhật lần cuối |
| UNIQUE | | (user_id, token_id) |

### Bảng 3: `donation_transactions` - Giao Dịch Tặng

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMPTZ | Thời gian tạo |
| sender_id | UUID FK | Người tặng |
| receiver_id | UUID FK | Người nhận |
| token_id | UUID FK | Token sử dụng |
| amount | NUMERIC | Số tiền (CHECK > 0) |
| amount_usd | NUMERIC | Giá trị USD (nullable) |
| fee_amount | NUMERIC | Phí (default 0) |
| context_type | TEXT | 'global', 'post', 'video', 'comment' |
| context_id | UUID | ID của post/video nếu có |
| message | TEXT | Lời nhắn từ người tặng |
| receipt_public_id | TEXT UNIQUE | ID công khai để share |
| status | TEXT | 'pending', 'success', 'failed', 'refunded' |
| chain | TEXT | 'internal' hoặc 'bsc' |
| tx_hash | TEXT | Hash giao dịch BSC (nullable) |
| block_number | BIGINT | Block number BSC (nullable) |
| explorer_url | TEXT | Link BscScan (nullable) |
| metadata | JSONB | Dữ liệu bổ sung |

**Indexes:**
```sql
CREATE INDEX idx_donation_tx_sender ON donation_transactions(sender_id, created_at DESC);
CREATE INDEX idx_donation_tx_receiver ON donation_transactions(receiver_id, created_at DESC);
CREATE INDEX idx_donation_tx_status ON donation_transactions(status, created_at DESC);
CREATE INDEX idx_donation_tx_context ON donation_transactions(context_type, context_id);
CREATE INDEX idx_donation_tx_receipt ON donation_transactions(receipt_public_id);
```

### Bảng 4: `user_chats` & `chat_messages` - Tin Nhắn

| Column (user_chats) | Type | Description |
|---------------------|------|-------------|
| id | UUID | Primary key |
| user1_id | UUID FK | User 1 |
| user2_id | UUID FK | User 2 |
| created_at | TIMESTAMPTZ | Thời gian tạo |
| updated_at | TIMESTAMPTZ | Cập nhật lần cuối |
| UNIQUE | | (user1_id, user2_id) |

| Column (chat_messages) | Type | Description |
|------------------------|------|-------------|
| id | UUID | Primary key |
| chat_id | UUID FK | Liên kết user_chats |
| sender_id | UUID FK | Người gửi |
| message_type | TEXT | 'text', 'donation', 'system' |
| content | TEXT | Nội dung tin nhắn |
| donation_transaction_id | UUID FK | Liên kết donation_transactions |
| deep_link | TEXT | Link tới receipt |
| is_read | BOOLEAN | Đã đọc chưa |
| created_at | TIMESTAMPTZ | Thời gian gửi |

### RLS Policies

```sql
-- donation_transactions: sender/receiver có thể xem; public xem qua receipt_public_id
-- internal_wallets: chỉ chủ wallet và admin
-- chat_messages: chỉ 2 user trong chat
-- user_chats: chỉ 2 user tham gia
```

### Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_wallets;
```

---

## ⚡ PHASE 2: EDGE FUNCTIONS

### Edge Function 1: `create-donation`

**Input:**
```typescript
{
  receiver_id: string;          // UUID người nhận
  token_symbol: string;         // 'FUNM' | 'CAMLY' | 'BNB' | 'USDT'
  amount: number;               // Số tiền
  message?: string;             // Lời nhắn (optional)
  context_type: string;         // 'global' | 'post' | 'video'
  context_id?: string;          // post_id hoặc video_id
}
```

**Logic:**
1. **Validate:**
   - amount > 0
   - sender_id ≠ receiver_id (chặn tự tặng)
   - Token enabled
   - Receiver tồn tại

2. **Nếu chain = 'internal' (FUN MONEY):**
   - Kiểm tra internal_wallets.balance đủ
   - BEGIN TRANSACTION
   - Trừ balance sender
   - Cộng balance receiver
   - Tạo donation_transactions status='success'
   - COMMIT

3. **Nếu chain = 'bsc':**
   - Tạo record status='pending'
   - Return để client gửi tx qua MetaMask
   - Sau khi có tx_hash → gọi confirm-bsc-donation

4. **Tạo chat_messages:**
   - Tìm hoặc tạo user_chats giữa 2 user
   - Insert message type='donation'
   - content: "🎁 {sender} đã tặng {amount} {token}"
   - donation_transaction_id = transaction id
   - deep_link = /receipt/{receipt_public_id}

5. **Return:** transaction record + receipt_public_id

### Edge Function 2: `confirm-bsc-donation`

**Input:** { transaction_id, tx_hash }
**Logic:** 
- Update donation_transactions với tx_hash
- Set explorer_url = `https://bscscan.com/tx/${tx_hash}`
- Set status = 'success'

### Edge Function 3: `get-donation-receipt`

**Input:** { receipt_public_id }
**Output:** 
- Transaction details
- Sender profile (avatar, username, display_name)
- Receiver profile
- Context info (post/video title nếu có)

---

## 🎨 PHASE 3: UI COMPONENTS

### Component 1: `GlobalDonateButton` (Header)

**Vị trí:** Header.tsx và MobileHeader.tsx, cạnh các action buttons

**Design:**
```tsx
<Button 
  variant="ghost" 
  className="flex items-center gap-2 bg-gradient-to-r from-cosmic-cyan/20 to-cosmic-magenta/20 
             hover:from-cosmic-cyan/30 hover:to-cosmic-magenta/30 
             border border-cosmic-cyan/30 rounded-full px-4"
>
  <Gift className="h-4 w-4 text-cosmic-gold" />
  <span className="text-sm font-medium">Thưởng & Tặng</span>
</Button>
```

**Click → mở EnhancedDonateModal**

### Component 2: `EnhancedDonateModal` (Nâng cấp từ DonateModal)

**Cấu trúc 4 bước:**

| Bước | Nội dung |
|------|----------|
| 1. Người nhận | Search user / Recent / Suggested creators |
| 2. Token | Dropdown sorted by priority (FUNM mặc định) |
| 3. Số tiền | Input + Quick amounts (10, 50, 100, 500) |
| 4. Lời nhắn | Textarea optional (max 200 ký tự) |

**Features:**
- Hiển thị balance hiện có của token đã chọn
- Auto-detect: internal vs BSC flow
- Real-time validation
- Loading state khi xử lý

**Props mới:**
```typescript
interface EnhancedDonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pre-fill options
  defaultReceiverId?: string;
  defaultReceiverName?: string;
  contextType?: 'global' | 'post' | 'video';
  contextId?: string;
  // Callbacks
  onSuccess?: (transaction: DonationTransaction) => void;
}
```

### Component 3: `PostDonateButton`

**Vị trí:** PostDetail.tsx, cạnh Like/Comment/Share

**Design:**
```tsx
<Button 
  variant="ghost" 
  size="sm"
  className="flex items-center gap-1.5 text-cosmic-gold hover:bg-cosmic-gold/10"
>
  <Gift className="h-4 w-4" />
  <span>Tặng</span>
</Button>
```

**Click → mở EnhancedDonateModal với:**
- defaultReceiverId = post.user_id
- defaultReceiverName = post.profile.display_name
- contextType = 'post'
- contextId = post.id

### Component 4: `VideoDonateButton` (Cập nhật nút hiện tại)

**Vị trí:** Watch.tsx (đã có nút "Tặng")

**Thay đổi:**
- Đổi icon từ Coins → Gift
- Thay DonateModal → EnhancedDonateModal
- Thêm props contextType='video', contextId=video.id

### Component 5: `CelebrationReceiptOverlay` (QUAN TRỌNG)

**Trigger:** Sau khi donation thành công

**Design:**

```text
┌─────────────────────────────────────┐
│     🎉 CHÚC MỪNG! TẶNG THÀNH CÔNG   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  [Sender Avatar]              │  │
│  │  Người tặng: @sender_name     │  │
│  │                ↓              │  │
│  │  [Receiver Avatar]            │  │
│  │  Người nhận: @receiver_name   │  │
│  │                               │  │
│  │  💰 100 FUN MONEY             │  │
│  │  📝 "Cảm ơn video hay!"       │  │
│  │                               │  │
│  │  🕐 07/02/2026 14:30          │  │
│  │  📋 Receipt: #abc123          │  │
│  │                               │  │
│  │  [🔗 Xem BscScan] (nếu có)    │  │
│  │  [📋 Copy Link]               │  │
│  └───────────────────────────────┘  │
│                                     │
│           [ ✕ Đóng ]                │
└─────────────────────────────────────┘
```

**Behavior:**
- Confetti chạy 3-4 giây rồi DỪNG
- Receipt overlay GIỮ NGUYÊN cho tới khi user bấm "Đóng"
- Nút "Copy Link" → copy `/receipt/{receipt_public_id}`
- Sound effect celebration (dùng useClaimNotificationSound)

### Component 6: `ChatDonationCard`

**Vị trí:** Trong chat/inbox giữa 2 user (nếu có hệ thống chat)

**Design:**
```text
┌──────────────────────────────────┐
│ 🎁 Bạn đã tặng @receiver         │
│    100 FUN MONEY                 │
│    "Cảm ơn video hay!"           │
│                                  │
│    [Xem biên nhận →]             │
│                    14:30 ✓✓      │
└──────────────────────────────────┘
```

**Click "Xem biên nhận" → navigate to /receipt/{id}**

### Component 7: `ReceiptPage` (/receipt/:receiptPublicId)

**Route mới:** Thêm vào App.tsx

**Design:**
```text
┌─────────────────────────────────────────┐
│  FUN PLAY - BIÊN NHẬN TẶNG              │
│  ─────────────────────────────────────  │
│                                         │
│  [Sender Avatar]     →    [Receiver]    │
│  @sender_name             @receiver_name│
│                                         │
│  ─────────────────────────────────────  │
│  Token:     FUN MONEY (FUNM)            │
│  Số tiền:   100 FUNM                    │
│  USD:       ~$10.00                     │
│  ─────────────────────────────────────  │
│  Lời nhắn:                              │
│  "Cảm ơn video hay quá!"                │
│  ─────────────────────────────────────  │
│  Context:   Video "Hướng dẫn Web3"      │
│             [Xem video →]               │
│  ─────────────────────────────────────  │
│  Thời gian: 07/02/2026 14:30:45         │
│  TX Hash:   0x123...abc                 │
│             [Xem trên BscScan →]        │
│  ─────────────────────────────────────  │
│                                         │
│  [📋 Copy Link]  [📥 Tải ảnh]           │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Public access (không cần đăng nhập)
- Share được link
- Download as image (html2canvas)

---

## 📊 PHASE 4: LEADERBOARD & TOP SPONSORS

### Upgrade `useTopSponsors` Hook

**Thay đổi query source:**
- Cũ: `wallet_transactions`
- Mới: `donation_transactions` (kết hợp cả internal và on-chain)

**Query:**
```sql
SELECT 
  sender_id,
  SUM(amount) as total_donated,
  COUNT(*) as tx_count
FROM donation_transactions
WHERE status = 'success'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY sender_id
ORDER BY total_donated DESC
LIMIT 10
```

### Upgrade `TopSponsorsCard` Component

**Thêm filter:**
- 7 ngày / 30 ngày / Tất cả
- Token filter (All / FUNM / CAMLY / ...)

### Mới: `TopReceiversCard` Component

**Hiển thị:** Top users nhận được nhiều donation nhất

**Vị trí:** Bên cạnh TopSponsorsCard trong Sidebar/Leaderboard page

---

## 📈 PHASE 5: REPORTS & EXPORT

### Trang `DonationReports` (/admin/donation-reports)

**Filters:**
| Filter | Type |
|--------|------|
| Date range | Date picker |
| Token | Dropdown |
| Sender | User search |
| Receiver | User search |
| Context type | Dropdown |
| Status | Dropdown |
| Chain | Dropdown |

**Table columns:**
- created_at, id, sender, receiver, token, amount, amount_usd
- context_type, context_id, status, chain, tx_hash, message
- Actions: View receipt

**Export buttons:**
- Export CSV (papaparse)
- Export XLSX (xlsx library)

### Export Format

```csv
created_at,transaction_id,sender_username,receiver_username,token,amount,amount_usd,context_type,context_id,status,chain,tx_hash,message,receipt_link
2026-02-07 14:30:45,abc123,@sender,@receiver,FUNM,100,10.00,video,video_id,success,internal,,Cảm ơn!,https://play.fun.rich/receipt/abc123
```

---

## 🔔 PHASE 6: REALTIME & NOTIFICATIONS

### Supabase Realtime Subscriptions

**Trong GlobalPaymentNotifications.tsx:**
```typescript
// Subscribe to donation_transactions table
supabase
  .channel('global-donations')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'donation_transactions',
    filter: `receiver_id=eq.${user.id}`,
  }, handleNewDonation)
  .subscribe();
```

### Toast Notifications

**Người tặng:**
```
🎁 Tặng thành công!
Bạn đã tặng 100 FUNM cho @receiver
```

**Người nhận:**
```
💰 Bạn vừa nhận được quà!
@sender đã tặng bạn 100 FUNM
[Xem chi tiết]
```

### Browser Push Notification

```javascript
showLocalNotification('🎁 FUN Play - Bạn nhận được quà!', {
  body: `@sender đã tặng bạn ${amount} ${token}! 🎉`,
  icon: '/images/camly-coin.png',
  tag: 'donation-received',
  requireInteraction: true,
});
```

---

## 🛡️ PHASE 7: CHỐNG GIAN LẬN

### Rules

| Rule | Implementation |
|------|----------------|
| Chặn tự tặng | sender_id ≠ receiver_id trong Edge Function |
| Rate limit | Max 50 donations/day/user (lưu trong metadata) |
| Min amount | FUNM: 1, CAMLY: 0.001, BNB: 0.0001 |
| Cooldown | 30 giây giữa các giao dịch cùng receiver |

### Logging

```typescript
metadata: {
  ip_hash: hash(request.ip),
  user_agent: request.headers['user-agent'],
  timestamp_ms: Date.now(),
  light_score: user.light_score
}
```

---

## 📁 DANH SÁCH FILES

### Mới tạo:

| File | Mô tả |
|------|-------|
| `supabase/migrations/xxx_donation_system.sql` | Database schema |
| `supabase/functions/create-donation/index.ts` | Edge function xử lý donation |
| `supabase/functions/confirm-bsc-donation/index.ts` | Confirm giao dịch BSC |
| `supabase/functions/get-donation-receipt/index.ts` | Lấy chi tiết receipt |
| `src/components/Donate/GlobalDonateButton.tsx` | Nút global trên Header |
| `src/components/Donate/EnhancedDonateModal.tsx` | Modal donation nâng cấp |
| `src/components/Donate/CelebrationReceiptOverlay.tsx` | Overlay ăn mừng |
| `src/components/Donate/ReceiptCard.tsx` | Card biên nhận |
| `src/components/Donate/PostDonateButton.tsx` | Nút donate trên post |
| `src/components/Donate/UserSearchInput.tsx` | Search user component |
| `src/components/Chat/ChatDonationCard.tsx` | Card donation trong chat |
| `src/pages/Receipt.tsx` | Trang /receipt/:id |
| `src/pages/DonationReports.tsx` | Trang báo cáo admin |
| `src/hooks/useDonation.ts` | Hook xử lý donation |
| `src/hooks/useInternalWallet.ts` | Hook balance nội bộ |
| `src/hooks/useDonationReceipt.ts` | Hook lấy receipt |
| `src/lib/donationExport.ts` | Utility export CSV/XLSX |

### Cần sửa:

| File | Thay đổi |
|------|----------|
| `src/App.tsx` | Thêm route /receipt/:receiptPublicId |
| `src/components/Layout/Header.tsx` | Thêm GlobalDonateButton |
| `src/components/Layout/MobileHeader.tsx` | Thêm GlobalDonateButton |
| `src/pages/Watch.tsx` | Cập nhật nút Tặng dùng EnhancedDonateModal |
| `src/pages/PostDetail.tsx` | Thêm PostDonateButton |
| `src/hooks/useTopSponsors.ts` | Query từ donation_transactions |
| `src/config/tokens.ts` | Thêm FUNM token config |
| `src/components/Donate/DonateModal.tsx` | Deprecate, thay bằng EnhancedDonateModal |

---

## ⏱️ TIMELINE DỰ KIẾN

| Phase | Công việc | Thời gian |
|-------|-----------|-----------|
| 1 | Database Schema + Migrations + RLS | 2-3h |
| 2 | Edge Functions (create, confirm, get-receipt) | 3-4h |
| 3 | UI Components (Modal, Receipt, Buttons) | 4-5h |
| 4 | Leaderboard & Top Sponsors upgrade | 2h |
| 5 | Reports & Export | 2-3h |
| 6 | Realtime & Notifications | 1-2h |
| 7 | Testing & Polish animations | 2h |
| **Tổng** | | **~18-20h** |

---

## 🎨 DESIGN SYSTEM ALIGNMENT

Tất cả components tuân theo FUN PLAY Design System v1.0:

| Element | Style |
|---------|-------|
| Background | `bg-white/85 backdrop-blur-xl` (glassmorphism) |
| Gradient | `from-cosmic-cyan via-cosmic-magenta to-cosmic-gold` |
| Glow | `shadow-[0_0_20px_rgba(0,231,255,0.5)]` |
| Border | `border border-cosmic-cyan/30` |
| Animation | Framer Motion với spring physics |
| Typography | Inter font, gradient text cho highlights |
| Icons | Lucide React, màu cosmic-gold cho donation |

---

## ✅ THỨ TỰ TRIỂN KHAI

1. **Database** → Tạo tables + RLS + seed data
2. **Edge Functions** → create-donation, confirm-bsc-donation
3. **Config** → Thêm FUNM vào tokens.ts
4. **Hooks** → useDonation, useInternalWallet
5. **UI Core** → EnhancedDonateModal, CelebrationReceiptOverlay
6. **Buttons** → GlobalDonateButton, PostDonateButton
7. **Receipt** → ReceiptCard, ReceiptPage
8. **Integration** → Header, Watch.tsx, PostDetail.tsx
9. **Leaderboard** → Upgrade useTopSponsors
10. **Reports** → DonationReports page + Export
11. **Polish** → Animations, sounds, responsive

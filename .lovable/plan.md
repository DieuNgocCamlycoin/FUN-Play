

## Kiểm Tra Toàn Bộ Quy Trình Mint FUN Money — Đánh Giá End-to-End

Sau khi đọc toàn bộ mã nguồn liên quan, dưới đây là đánh giá chi tiết từng bước trong quy trình mint.

---

### Bước 1: Kết Nối Ví (User)

**Trạng thái: ✅ Đã sửa xong**

- `useFunMoneyWallet` giờ bridge từ `WalletContext` (wagmi/AppKit) — không còn phụ thuộc trực tiếp vào `window.ethereum` cho trạng thái kết nối.
- `MintableCard` hiển thị nút "Kết Nối Ví" → gọi `connect()` → mở AppKit modal chuẩn.
- Khi ví đã kết nối nhưng sai chain → hiện nút "Chuyển sang BSC Testnet" (chain 97).

**Vấn đề tiềm ẩn:**  
- `switchToBscTestnet()` vẫn dùng `window.ethereum` trực tiếp. Nếu user kết nối qua WalletConnect (không có `window.ethereum`), nút chuyển chain sẽ thất bại im lặng. Nên dùng `switchChain` từ wagmi thay thế.

---

### Bước 2: Bấm MINT NOW (User)

**Trạng thái: ✅ Logic đúng**

- `MintableCard.handleMint()` kiểm tra: `isWalletConnected`, `isCorrectChain`, `activity.canMint`
- Gọi `submitAutoRequest()` với dữ liệu từ `useLightActivity`
- Insert vào bảng `mint_requests` với `status: 'pending'`
- Cập nhật `last_fun_mint_at` trên profile

**Điều kiện canMint** (từ `useLightActivity`):
- Light Score ≥ 60
- Tổng activities ≥ 10
- Không có pending request
- Mintable FUN ≥ 1
- Cooldown 24h từ lần mint cuối
- Integrity score > 0

---

### Bước 3: Admin Duyệt & Mint On-Chain

**Trạng thái: ⚠️ Có 1 vấn đề cần sửa**

Quy trình admin trong `FunMoneyApprovalTab`:
1. Admin kết nối ví Attester (`0x02D5...9a0D`)
2. Chọn request → "Duyệt & Mint Ngay" 
3. `handleApproveAndMint()`: approve DB → `handleMint()` → validate → EIP-712 sign → `lockWithPPLP()` → save tx hash

**Vấn đề quan trọng ở `handleMint` (dòng 178-179):**
```typescript
const signer = await getSigner(); // ← Lấy signer từ window.ethereum
const provider = new BrowserProvider((window as any).ethereum); // ← Tạo thêm 1 provider nữa
```
Hàm `getSigner()` đã tạo provider từ `window.ethereum` rồi, nhưng dòng 179 lại tạo thêm một `BrowserProvider` mới **chỉ để truyền vào `validateBeforeMint`**. Điều này:
- Thừa (đã có provider trong `getSigner`)
- Sẽ crash nếu admin dùng WalletConnect (không có `window.ethereum`)

---

### Kế Hoạch Sửa

#### 1. Sửa `switchToBscTestnet` trong `useFunMoneyWallet.ts`
Dùng `switchChain` từ wagmi thay vì `window.ethereum` trực tiếp, đảm bảo hoạt động trên mọi loại ví (MetaMask, WalletConnect, Trust Wallet...).

#### 2. Sửa `handleMint` trong `FunMoneyApprovalTab.tsx`
Thay `new BrowserProvider((window as any).ethereum)` bằng provider lấy từ `getSigner()`. Cụ thể:
- `getSigner()` trả về signer, dùng `signer.provider` cho validation
- Hoặc refactor `useFunMoneyWallet` để expose `getProvider()` riêng

#### 3. Kiểm tra `getMyRequests` thiếu filter user_id
Trong `useFunMoneyMintRequest.ts` dòng 197-225, hàm `getMyRequests` **không filter theo user_id** — nó sẽ trả về tất cả mint requests trong hệ thống (nếu RLS không chặn). Cần thêm `.eq('user_id', user.id)` hoặc xác nhận RLS trên bảng `mint_requests` đã filter đúng.

---

### Chi Tiết Kỹ Thuật

**File 1: `src/hooks/useFunMoneyWallet.ts`**
- Import `useSwitchChain` từ wagmi
- Thay `switchToBscTestnet` từ `window.ethereum.request` sang `switchChain({ chainId: 97 })`
- Fallback `wallet_addEthereumChain` nếu chain chưa được thêm

**File 2: `src/components/Admin/tabs/FunMoneyApprovalTab.tsx`**  
- Dòng 177-179: Lấy provider từ signer thay vì tạo mới từ `window.ethereum`
```typescript
const signer = await getSigner();
const provider = signer.provider as BrowserProvider;
```

**File 3: `src/hooks/useFunMoneyMintRequest.ts`**
- Dòng 202-211: Thêm filter `.eq('user_id', user.id)` vào `getMyRequests`


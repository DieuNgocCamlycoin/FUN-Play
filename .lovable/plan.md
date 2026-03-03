

## Kế hoạch: Tích hợp Multisig 3-of-3 vào luồng Mint FUN Money chính

### Tình trạng hiện tại

Hệ thống có **2 luồng mint tách biệt**:

```text
Luồng 1 (đang dùng):
  User MINT NOW → mint_requests (DB) → Admin FunMoneyApprovalTab → mintFunMoney() [1 chữ ký] → on-chain

Luồng 2 (đã xây nhưng chưa kết nối):
  pplp_mint_requests (DB) → AttesterPanel [3 nhóm ký] → AdminMintPanel → lockWithPPLP [3 sigs] → on-chain
```

**Vấn đề**: Luồng 1 cho phép admin mint trực tiếp với 1 chữ ký, bỏ qua hoàn toàn cơ chế multisig 3-of-3.

### Mục tiêu

Khi admin duyệt request trong `FunMoneyApprovalTab`, thay vì mint trực tiếp, hệ thống sẽ **tạo record vào `pplp_mint_requests`** và chuyển sang luồng multisig 3-of-3.

### Luồng mới

```text
User MINT NOW → mint_requests (DB)
  → Admin duyệt (FunMoneyApprovalTab)
    → Tạo pplp_mint_requests [status: pending_sig]
      → 3 GOV Attesters ký (AttesterPanel): WILL + WISDOM + LOVE
        → Khi đủ 3/3 [status: signed]
          → Admin submit on-chain (AdminMintPanel) → lockWithPPLP [3 sigs]
```

### Thay đổi kỹ thuật

#### 1. Sửa `FunMoneyApprovalTab.tsx` — Thay `handleMint` bằng `handleRouteToMultisig`
- Khi admin bấm "Mint" hoặc "Approve & Mint", thay vì gọi `mintFunMoney()`, tạo record trong `pplp_mint_requests` với:
  - `recipient_address` = user wallet
  - `amount_wei` = calculated_amount_atomic
  - `action_type` = request.action_type
  - `status` = `pending_sig`
  - `multisig_required_groups` = ['will', 'wisdom', 'love']
  - `action_hash`, `evidence_hash`, `nonce` (lấy từ contract)
- Cập nhật `mint_requests.status` = `'approved'` và ghi note "Routed to multisig"
- Hiển thị toast: "Đã chuyển sang luồng Multisig 3/3. Chờ 3 nhóm GOV ký."

#### 2. Tạo helper `createMultisigRequest()` trong `src/lib/fun-money/pplp-multisig-helpers.ts`
- Hàm tiện ích để tạo record `pplp_mint_requests` từ dữ liệu `mint_requests`
- Đọc nonce on-chain cho recipient
- Tạo action_hash và evidence_hash

#### 3. Cập nhật UI `FunMoneyApprovalTab`
- Thay nút "Mint" bằng "Chuyển Multisig 3/3"
- Hiển thị trạng thái nếu request đã được route sang multisig (link đến tab MultisigMint)
- Ẩn nút mint trực tiếp hoàn toàn

#### 4. Cập nhật `MultisigMintTab` / `AttesterPanel`
- Không cần thay đổi logic — đã hoạt động đúng với `pplp_mint_requests`
- Chỉ cần đảm bảo realtime subscription hoạt động để attester thấy request mới ngay

#### 5. Liên kết 2 bảng
- Thêm cột `source_mint_request_id` vào `pplp_mint_requests` (optional, để truy vết nguồn gốc)
- Hoặc đơn giản hơn: ghi `mint_request_id` vào metadata/notes

### Không thay đổi
- Smart contract (giữ nguyên `attesterThreshold = 1`, nhưng app layer bắt buộc 3/3)
- `AdminMintPanel` + `useMintSubmit` (đã sẵn sàng submit 3 sigs)
- `AttesterPanel` + `useAttesterSigning` (đã sẵn sàng ký)

### Migration DB (nếu cần)
- Thêm cột `source_mint_request_id UUID REFERENCES mint_requests(id)` vào `pplp_mint_requests` để liên kết 2 bảng


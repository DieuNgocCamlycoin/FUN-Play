

## Fix lỗi Mint On-chain thất bại ("missing revert data")

### Nguyên nhân gốc

Tất cả 5 request đều thất bại với lỗi `missing revert data (action="estimateGas")`. Đây là lỗi xảy ra khi smart contract **revert** giao dịch trước khi thực thi. Hai nguyên nhân chính:

1. **Nonce cũ (stale nonce)**: Khi admin tạo multisig request, hệ thống đọc nonce on-chain tại thời điểm đó. Nhưng khi reset request về `pending_sig` để ký lại, **nonce KHÔNG được cập nhật** — chỉ xoá chữ ký và đổi status. Các attester ký lại với nonce cũ, contract từ chối.

2. **Quy trình reset thiếu bước**: Hiện tại reset chỉ làm: `status → pending_sig, signatures → {}, completed_groups → []`. Thiếu bước quan trọng: **đọc lại nonce on-chain mới** và **tạo lại action_hash + evidence_hash** cho nonce mới.

### Kế hoạch sửa

#### 1. Thêm nút "Reset & Refresh Nonce" vào MintProgressTracker
**File: `src/components/Multisig/MintProgressTracker.tsx`**
- Thêm nút **"🔄 Reset"** cho các request có `status === 'failed'`
- Khi bấm: gọi hàm reset mới (bước 2 bên dưới)

#### 2. Tạo hàm `resetRequestWithFreshNonce` 
**File: `src/lib/fun-money/pplp-multisig-helpers.ts`**
- Nhận `requestId` + `provider` (BrowserProvider)
- Đọc nonce on-chain mới nhất: `contract.nonces(recipient_address)`
- Tính lại `actionHash` + `evidenceHash` với nonce mới (dùng `preparePPLPData`)
- Update DB: `nonce`, `action_hash`, `evidence_hash`, `status → pending_sig`, xoá signatures, xoá error

#### 3. Sửa logic auto-mint để verify nonce trước khi submit
**File: `src/components/Multisig/MintProgressTracker.tsx`**
- Trước khi gọi `submitMint`, gọi `verifyNonce(recipient_address, request.nonce)` từ `useMintSubmit`
- Nếu nonce không khớp → tự động reset request thay vì submit (tránh lãng phí gas)

#### 4. Sửa logic ký trong AttesterPanel để kiểm tra nonce
**File: `src/components/Multisig/AttesterPanel.tsx`**
- Khi attester cuối cùng ký (đạt 3/3) và trigger auto-mint, thêm kiểm tra nonce trước
- Nếu nonce lỗi thời → hiện toast cảnh báo thay vì submit rồi thất bại

### Kết quả mong đợi
- Request lỗi có nút Reset để lấy nonce mới, ký lại đúng
- Hệ thống tự phát hiện nonce cũ trước khi submit, tránh giao dịch thất bại
- Quy trình: Reset → Ký lại 3/3 → Verify nonce → Auto-mint → Thành công


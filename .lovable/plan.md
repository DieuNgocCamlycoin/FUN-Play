

## Bảng Thống Kê Toàn Bộ Tiến Trình Mint FUN

### Vấn đề hiện tại
Trang /gov-sign (AttesterPanel) chỉ hiển thị các request có status `pending_sig` hoặc `signing`. Sau khi đủ 3/3 chữ ký (status = `signed`, `submitted`, `confirmed`, `failed`), request biến mất khỏi giao diện — các Attester không theo dõi được kết quả.

### Giải pháp
Thêm một bảng thống kê **"Lịch sử & Tiến trình"** ngay bên dưới AttesterPanel trên trang /gov-sign, hiển thị **tất cả** request (mọi status) với thông tin đầy đủ.

### Thay đổi cụ thể

**1. Tạo component `MintProgressTracker.tsx`** (`src/components/Multisig/`)
- Query tất cả records từ `pplp_mint_requests` (không lọc status)
- Hiển thị bảng với các cột:
  - Tên user (+ avatar) & địa chỉ ví
  - Số FUN
  - Trạng thái ký (WILL ✓/✗, WISDOM ✓/✗, LOVE ✓/✗)
  - Status hiện tại (badge màu: signing/signed/submitted/confirmed/failed)
  - TX hash (link BscScan nếu có)
  - Ngày tạo & cập nhật
- Tabs hoặc filter theo status: Tất cả / Đang ký / Đã ký đủ / Đã submit / Thành công / Thất bại
- Realtime subscription để cập nhật tự động
- Thống kê tổng hợp ở đầu: tổng request, tổng FUN, số đã hoàn tất, số đang chờ

**2. Cập nhật `GovSignPage.tsx`**
- Import và render `MintProgressTracker` bên dưới `AttesterPanel`

**3. Cập nhật RLS (nếu cần)**
- Kiểm tra policy SELECT hiện tại có cho phép đọc các status `signed`, `submitted`, `confirmed`, `failed` không — nếu chưa thì mở rộng

### Giao diện dự kiến

```text
┌─────────────────────────────────────────────────┐
│  📊 Thống kê tiến trình Mint FUN                │
│  Tổng: 9 | Đang ký: 7 | Đã đủ 3/3: 2 | ✅: 0  │
├─────────────────────────────────────────────────┤
│ [Tất cả] [Đang ký] [Đã ký đủ] [On-chain] [Lỗi]│
├──────┬────────┬─────┬─────┬──────┬──────┬───────┤
│ User │  FUN   │WILL │WSDM │LOVE  │Status│ TX    │
├──────┼────────┼─────┼─────┼──────┼──────┼───────┤
│ Hạnh │3,378   │ ✓   │  ✗  │  ✗   │signing│  —   │
│ Lan  │  79.9  │ ✓   │  ✗  │  ✗   │signing│  —   │
│ ...  │15,187  │ ✓   │  ✓  │  ✓   │signed │  —   │
│ ...  │18,485  │ ✓   │  ✓  │  ✓   │confirmed│🔗  │
└──────┴────────┴─────┴─────┴──────┴──────┴───────┘
```


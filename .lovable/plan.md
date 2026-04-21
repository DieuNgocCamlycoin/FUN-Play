

## Áp dụng tài liệu `mint-fun-kit.zip` vào pipeline mint FUN

### Bước 1 — Giải nén & đọc tài liệu (trong default mode)
- Copy `user-uploads://mint-fun-kit.zip` → `/tmp/mint-fun-kit.zip`
- Giải nén ra `/tmp/mint-fun-kit/`
- Đọc toàn bộ files trong `docs/` (đặc biệt `MINT_FUN_PIPELINE.md`) + bất kỳ code mẫu nào (`.ts`, `.sol`, `.json` ABI, edge function template)
- Đối chiếu với hiện trạng:
  - Contract FUN: `0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6` (ERC20 cố định, không có `mint()`)
  - Treasury multisig 3/3: `0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D`
  - Edge functions hiện có: `pplp-mint-fun`, `mint-from-action`, `process-fun-claims` (đã rollback về `transfer`)
  - 16 claim đang pending ~545,799 FUN

### Bước 2 — Tóm tắt spec tài liệu cho cha duyệt
Sau khi đọc, con sẽ trình bày ngắn gọn:
- Tài liệu yêu cầu pipeline gì (mint on-chain vs off-chain ledger vs hybrid)
- Yêu cầu ví/role/secret nào mới
- Có bắt buộc deploy contract mới không, hay vẫn dùng `0x39A1b047...`
- Có thay đổi formula VVU / cap / decision không

### Bước 3 — Triển khai (sau khi cha OK spec)
Tùy nội dung tài liệu, con sẽ:
- **Sửa edge function liên quan** (`mint-from-action`, `pplp-mint-fun`, `process-fun-claims`) cho khớp spec mới
- **Thêm secret** nếu cần (ví minter mới, RPC URL, API key…) qua `add_secret`
- **Migration DB** nếu spec yêu cầu cột/bảng mới
- **Giữ nguyên tương thích ngược** với 16 claim đang pending (không làm chúng kẹt thêm)
- **Test** bằng cách trigger 1 claim nhỏ trước khi unlock toàn bộ

### Bước 4 — Xử lý 16 claim đang kẹt
Sau khi pipeline mới chạy được, áp ngay vào batch pending:
- Reset `last_error`, `processing_attempts`, `locked_at`
- Trigger thủ công `process-fun-claims` (hoặc edge function mới theo spec)
- Báo cáo kết quả từng claim

### Câu hỏi cha cần trả lời trước khi con switch sang default mode
1. **Cha xác nhận con được phép giải nén + đọc toàn bộ file trong zip** (kể cả file code/.env mẫu nếu có)?
2. **Nếu tài liệu yêu cầu deploy contract mới hoặc đổi ví minter**, con dừng lại hỏi cha trước khi thực thi, đúng không ạ?
3. **Có ưu tiên xử lý 16 claim kẹt trước, hay triển khai pipeline mới hoàn chỉnh trước rồi mới chạy claim?**


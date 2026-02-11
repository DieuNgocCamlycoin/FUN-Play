

# Thêm nút "Xem Celebration Card" vào tin nhắn donation trong Chat

## Vấn đề hiện tại

Khi gửi giao dịch qua hàm `sendDonation` (luồng gửi trực tiếp từ ví), tin nhắn chat được tạo **thiếu 2 trường quan trọng**:
- `donation_transaction_id`: null
- `deep_link`: null

Do đó, `ChatDonationCard` hiển thị dạng fallback (chỉ có text) mà không có nút "Xem Celebration Card". Trong khi luồng GiftCelebrationModal thì đầy đủ cả 2 trường nên hiển thị đúng.

Nguyên nhân sâu hơn: hàm `sendDonation` chỉ tạo bản ghi `wallet_transactions`, **không tạo bản ghi `donation_transactions`** nên không có `receipt_public_id` để tạo link Celebration Card.

## Giải pháp

### 1. Tạo bản ghi `donation_transactions` trong hàm `sendDonation`

**Tệp:** `src/lib/donation.ts`

Sau khi giao dịch blockchain thành công (sau `tx.wait()`), thêm bước tạo bản ghi trong bảng `donation_transactions`:
- Tra cứu `token_id` từ bảng `donate_tokens` dựa trên `tokenSymbol`
- Insert bản ghi với status "success", tx_hash, và các thông tin cần thiết
- `receipt_public_id` sẽ được tự động sinh bởi database (có column default)
- Lấy lại `id` và `receipt_public_id` từ kết quả insert

### 2. Truyền `donation_transaction_id` và `deep_link` vào chat message

**Tệp:** `src/lib/donation.ts`

Cập nhật phần insert `chat_messages` để truyền thêm:
- `donation_transaction_id`: ID của bản ghi vừa tạo
- `deep_link`: `/receipt/{receipt_public_id}`

Kết quả: tin nhắn donation trong chat sẽ hiển thị đầy đủ Celebration Card mini với nút "Xem Celebration Card" giống như luồng GiftCelebrationModal.

## Chi tiết kỹ thuật

```text
// Sau khi tx.wait() thành công, TRƯỚC khi insert wallet_transactions:

// 1. Tra cứu token_id
const { data: tokenInfo } = await supabase
  .from("donate_tokens")
  .select("id")
  .eq("symbol", tokenSymbol)
  .eq("is_enabled", true)
  .single();

// 2. Tạo donation_transactions
const { data: donationTx } = await supabase
  .from("donation_transactions")
  .insert({
    sender_id: user.id,
    receiver_id: toUserId,
    token_id: tokenInfo.id,
    amount: amount,
    status: "success",
    chain: isFunToken ? "bsc_testnet" : "bsc",
    tx_hash: txHash,
    explorer_url: isFunToken
      ? `https://testnet.bscscan.com/tx/${txHash}`
      : `https://bscscan.com/tx/${txHash}`,
  })
  .select("id, receipt_public_id")
  .single();

// 3. Trong phần insert chat_messages, thêm:
await supabase.from("chat_messages").insert({
  chat_id: chatId,
  sender_id: user.id,
  message_type: "donation",
  content: `🎁 Bạn đã nhận được ${amount} ${tokenSymbol}!`,
  donation_transaction_id: donationTx?.id || null,
  deep_link: donationTx ? `/receipt/${donationTx.receipt_public_id}` : null,
});
```

## Tệp thay đổi

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/lib/donation.ts` | Thêm tạo bản ghi `donation_transactions` sau khi giao dịch thành công, truyền `donation_transaction_id` và `deep_link` vào chat message |

Sau khi sửa, tất cả tin nhắn donation trong chat (dù gửi qua luồng nào) đều sẽ hiển thị đầy đủ Celebration Card mini với nút "Xem Celebration Card".


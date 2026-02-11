

# Hiển thị ảnh đại diện người nhận trong mục Thưởng & Tặng

---

## Vấn đề hiện tại

Trong modal "Thưởng & Tặng" (EnhancedDonateModal), ảnh đại diện (avatar) của người nhận **không hiển thị** — chỉ hiện chữ cái đầu tiên. Nguyên nhân:

1. **ProfileInfo.tsx** (dòng 230): Truyền `defaultReceiverAvatar: undefined` thay vì ảnh đại diện thật. Đồng thời, interface `ProfileInfoProps` thiếu trường `avatar_url`.
2. **VideoActionsBar.tsx** (dòng 309-314): Thiếu hoàn toàn prop `defaultReceiverAvatar`, mặc dù component đã nhận `channelAvatar` từ props.

---

## Giải pháp

### 1. Cập nhật ProfileInfo.tsx

**Thay đổi 1a**: Thêm `avatar_url` vào interface `profile` trong `ProfileInfoProps`:
```
avatar_url: string | null;
```

**Thay đổi 1b**: Dòng 230 — thay `undefined` bằng giá trị thật:
```
defaultReceiverAvatar: profile.avatar_url || undefined,
```

### 2. Cập nhật VideoActionsBar.tsx

**Thay đổi**: Dòng 309-314 — thêm prop `defaultReceiverAvatar` với giá trị `channelAvatar`:
```
<EnhancedDonateModal
  open={donateModalOpen}
  onOpenChange={setDonateModalOpen}
  defaultReceiverId={channelId}
  defaultReceiverName={channelName}
  defaultReceiverAvatar={channelAvatar || undefined}
/>
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Profile/ProfileInfo.tsx` | Thêm `avatar_url` vào interface và truyền vào modal |
| 2 | `src/components/Video/Mobile/VideoActionsBar.tsx` | Thêm prop `defaultReceiverAvatar` từ `channelAvatar` |

Thay đổi rất nhỏ — chỉ sửa 3 dòng code. Không ảnh hưởng đến luồng giao dịch on-chain (TransactionCard đã hiển thị avatar đúng).


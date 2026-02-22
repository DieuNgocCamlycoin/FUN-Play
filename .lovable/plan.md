

## Kế hoạch chi tiết: Sửa lỗi ví biến mất + Thêm cảnh báo khớp/không khớp ví

### Vấn đề hiện tại
Khi bạn nhập địa chỉ ví bằng tay vào ô "Địa chỉ ví (BSC)" trong trang Cài đặt và bấm Lưu, địa chỉ bị xóa sau vài giây. Nguyên nhân: hệ thống tự động (dòng 521 trong `useWalletConnection.ts`) thấy "không có ví Web3 nào kết nối" nên xóa luôn địa chỉ trong database.

---

### Việc 1: Không xóa ví nhập tay nữa

**File: `src/hooks/useWalletConnection.ts`**

- Thêm biến `wasWeb3ConnectedRef = useRef(false)` ở đầu hook
- Khi ví Web3 kết nối thành công (dòng 503-508), đặt `wasWeb3ConnectedRef.current = true`
- Sửa đoạn xử lý ngắt kết nối (dòng 515-522):

```text
// TRƯỚC (dòng 515-522):
} else {
  setAddress('');
  setIsConnected(false);
  setWalletType('unknown');
  setChainId(undefined);
  setBnbBalance('0');
  await clearWalletFromDb();   // <-- luôn xóa -> LỖI
}

// SAU:
} else {
  setAddress('');
  setIsConnected(false);
  setWalletType('unknown');
  setChainId(undefined);
  setBnbBalance('0');
  if (wasWeb3ConnectedRef.current) {   // chỉ xóa nếu trước đó có kết nối Web3 thật
    await clearWalletFromDb();
    wasWeb3ConnectedRef.current = false;
  }
}
```

---

### Việc 2: Lưu ví Web3 kết nối gần nhất

**File: `src/hooks/useWalletConnection.ts`**

- Khi ví Web3 kết nối thành công (dòng 503-508), thêm:
  ```
  localStorage.setItem('last_connected_wallet', account.address);
  ```
- Thêm vào return (dòng 529-548):
  ```
  lastConnectedWallet: localStorage.getItem('last_connected_wallet') || ''
  ```
- Cập nhật interface `UseWalletConnectionReturn` (dòng 28-49) thêm `lastConnectedWallet: string`

---

### Việc 3: Hiện cảnh báo khớp/không khớp ví

**File: `src/pages/ProfileSettings.tsx`**

Ngay dưới ô input "Địa chỉ ví (BSC)" (sau dòng 588), thêm phần hiển thị trạng thái:

- Lấy `address` (ví đang kết nối) và `lastConnectedWallet` (ví kết nối gần nhất) từ `useWalletContext()`
- So sánh địa chỉ nhập tay với ví tham chiếu (ưu tiên ví đang kết nối, nếu không có thì dùng ví gần nhất)
- Hiển thị 3 trường hợp:

| Trường hợp | Hiển thị | Màu |
|---|---|---|
| Ví nhập tay **giống** ví đang/đã kết nối | "Khớp với ví đang kết nối" + icon Check | Xanh lá |
| Ví nhập tay **khác** ví đang/đã kết nối | "Không khớp với ví kết nối. Hãy kiểm tra lại" + icon AlertTriangle | Vàng/cam |
| Chưa từng kết nối ví Web3 nào | "Kết nối ví Web3 để xác minh địa chỉ" + icon Info | Xám |
| Ô input trống | Không hiện gì | - |

---

### Tóm tắt
- **2 file cần sửa**: `useWalletConnection.ts` và `ProfileSettings.tsx`
- Sửa bug ví nhập tay bị xóa
- Lưu ví Web3 gần nhất vào localStorage
- Hiện cảnh báo trực quan dưới ô nhập ví
- Không ảnh hưởng gì đến hiển thị ví ở trang cá nhân, tặng quà, hay admin


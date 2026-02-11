

# Sửa lỗi hiển thị số dư USDT & CAMLY trong modal Thưởng & Tặng

---

## Nguyên nhân gốc

Hiện tại hàm `fetchBscBalance` sử dụng **wallet provider** (MetaMask/Bitget) để đọc số dư. Khi ví đang ở sai mạng, code cố chuyển mạng rồi tạo lại provider, nhưng:

1. Sau khi gọi `wallet_switchEthereumChain`, provider mới có thể **chưa kịp cập nhật** mạng BSC
2. Gọi `balanceOf` trên provider chưa sẵn sàng → trả về `0x` hoặc lỗi → hiển thị "0.0000"
3. Ngay cả khi đã ở đúng mạng BSC, một số ví mobile trả về lỗi khi gọi qua `BrowserProvider`

## Giải pháp

Thay vì phụ thuộc vào wallet provider để đọc số dư, sử dụng **public BSC RPC** (JsonRpcProvider) cho việc đọc balance — hoàn toàn không cần ví ở đúng mạng.

Luồng mới:
```
1. Lấy địa chỉ ví người dùng từ wallet provider (hoặc từ senderProfile.wallet_address)
2. Tạo JsonRpcProvider với BSC RPC endpoint (luôn đúng mạng)
3. Gọi balanceOf trên JsonRpcProvider → luôn chính xác
```

---

## Chi tiết thay đổi

### Tệp: `src/components/Donate/EnhancedDonateModal.tsx`

**Thay thế toàn bộ hàm `fetchBscBalance` (dòng 236-325):**

- Xoá logic `wallet_switchEthereumChain` và `wallet_addEthereumChain` (không cần thiết cho việc đọc số dư)
- Tạo `ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/")` — provider chỉ đọc, luôn kết nối BSC
- Lấy địa chỉ ví từ `senderProfile.wallet_address` (đã có sẵn) hoặc fallback sang wallet provider
- Gọi `balanceOf` trên JsonRpcProvider → kết quả chính xác bất kể ví đang ở mạng nào

**Logic mới:**
```
const BSC_RPC = "https://bsc-dataseed.binance.org/";

// Lấy address từ senderProfile hoặc wallet provider
const walletAddress = senderProfile?.wallet_address || (await getAddressFromWallet());

// Dùng public RPC để đọc số dư (không phụ thuộc mạng ví)
const readProvider = new ethers.JsonRpcProvider(BSC_RPC);

if (tokenConfig.address === "native") {
  const bal = await readProvider.getBalance(walletAddress);
} else {
  const contract = new ethers.Contract(tokenConfig.address, erc20Abi, readProvider);
  const bal = await contract.balanceOf(walletAddress);
}
```

---

## Tóm tắt

| # | Tệp | Thay đổi |
|---|------|----------|
| 1 | `src/components/Donate/EnhancedDonateModal.tsx` | Dùng public BSC RPC để đọc số dư thay vì wallet provider; lấy address từ senderProfile |

---

## Kết quả mong đợi

- Số dư USDT, CAMLY, FUN, BNB hiển thị đúng bất kể ví đang ở mạng nào
- Không cần chuyển mạng chỉ để xem số dư
- Hoạt động ổn định trên cả desktop và mobile


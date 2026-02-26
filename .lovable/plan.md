

# Phan Tich: So Lieu FUN Money Tren Trang Mint User

## Hien Trang

Cac so lieu hien thi tren trang mint (`/fun-money`) cua user duoc lay **hoan toan tu database** (bang `mint_requests`), **KHONG** truy van truc tiep tu smart contract. Cu the:

### Nguon du lieu:
- **TokenLifecyclePanel**: Nhan `requests` (tu `useMintRequest` → query bang `mint_requests`) roi dem/tinh toan client-side:
  - LOCKED = requests co `status === 'pending'`
  - ACTIVATED = requests co `status === 'approved'`
  - FLOWING = requests co `status === 'minted'`
  - Tong amount, Light Score, Unity Score — tat ca tinh tu du lieu database

- **MintRequestList / MintRequestCard**: Hien thi lich su mint requests tu database

- **Stats cards**: Dem `pending`, `minted`, `rejected` tu array requests

### Ket luan quan trong:
**So lieu KHONG bi anh huong boi viec doi contract** vi chung lay tu database, khong tu on-chain. Moi mint request cu van con trong bang `mint_requests` va hien thi binh thuong.

---

## Van De Con Ton Tai

Co **2 link BSCScan van tro den contract cu** `0x1aa8...`:

| File | Dong | Noi dung |
|------|------|---------|
| `src/components/FunMoney/TokenLifecyclePanel.tsx` | 322 | `testnet.bscscan.com/token/0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2` |
| `src/pages/FunMoneyPage.tsx` | 297 | `testnet.bscscan.com/address/0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2` |

Day la 2 link UI ma user click de xem tren BSCScan — hien van dan den contract cu.

---

## Ke Hoach Fix

### 1. Fix `TokenLifecyclePanel.tsx` (dong 322)
Doi URL tu `0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2` thanh `0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6`

### 2. Fix `FunMoneyPage.tsx` (dong 297)
Doi URL tu `0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2` thanh `0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6`

### 3. (Khuyen nghi) Import dia chi tu web3-config
Thay vi hardcode dia chi trong URL, dung `getContractAddress()` hoac `DEFAULT_CONTRACT_ADDRESS` tu `web3-config.ts` va `BSC_TESTNET_CONFIG.explorerUrl` de tao URL dong. Nhu vay lan sau doi contract se khong bi sot.

---

## Tong ket

- **So lieu**: An toan, lay tu database, khong lien quan contract address
- **Links BSCScan**: 2 cho con tro den contract cu → can fix
- **Thay doi**: Nho, chi sua 2 URL string


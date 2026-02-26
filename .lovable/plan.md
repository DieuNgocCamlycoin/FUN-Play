

# Baao Cao Phan Tich Tac Dong He Thong Mint FUN Money Sau Cap Nhat

## 1. Trang Thai Hien Tai — Tong Ket

Sau cac ban cap nhat gan day, he thong mint FUN Money da duoc chuyen doi hoan toan sang contract moi **`0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6`** (v1.2.1 FINAL, BSC Testnet). Khong con bat ky tham chieu nao den contract cu `0x1aa8...`.

---

## 2. Kiem Tra Dong Bo Dia Chi Contract

| File | Dia chi | Dung? |
|------|---------|-------|
| `src/lib/fun-money/web3-config.ts` (DEFAULT_CONTRACT_ADDRESS) | `0x39A1...0CD6` | OK |
| `src/config/tokens.ts` (FUN_MONEY_ADDRESS) | `0x39A1...0CD6` | OK |
| `src/lib/donation.ts` (FUN_MONEY_CONTRACT) | `0x39A1...0CD6` | OK |
| `src/lib/fun-money/contracts/contract-info.ts` (deployedAddress) | `0x39A1...0CD6` | OK |
| `src/lib/fun-money/contracts/FUNMoney-v1.2.1-final.sol` | `0x39A1...0CD6` | OK |

**Ket luan**: Tat ca 5 file da dong bo chinh xac. Khong con dia chi cu.

---

## 3. ABI va Contract Interface — Phan Tich Chi Tiet

### 3a. Cac ham da khop voi contract v1.2.1:
- `lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs)` — Tham so `action` la **string** (khong phai bytes32). Contract tu hash noi bo. **DUNG**.
- `activate(uint256 amount)` — LOCKED -> ACTIVATED. **DUNG**.
- `claim(uint256 amount)` — ACTIVATED -> FLOWING. **DUNG**.
- `nonces(address)` — Doc nonce cua **recipient** (khong phai signer). **DUNG**.
- `alloc(address)` — Tra ve `locked` va `activated`. **DUNG**.
- Cac ham governance: `govRegisterAction`, `govSetAttester`, `govRecycleExcessToCommunity`... **DUNG**.

### 3b. EIP-712 Domain:
- Name: `"FUN Money"`, Version: `"1.2.1"`, Chain ID: `97`, Verifying Contract: `getContractAddress()` — **KHOP** voi contract.

### 3c. Van de tiem an:
- **Khong co van de nghiem trong**. ABI, EIP-712, va flow mint deu khop voi v1.2.1.

---

## 4. Luong Mint End-to-End

```text
User Action → PPLP Engine (scoreAction) → EIP-712 Sign → lockWithPPLP on-chain
                  │                              │                    │
                  ▼                              ▼                    ▼
          PPLP v2.0 check              Domain v1.2.1           Contract v1.2.1
          (5 dieu kien)              nonce = recipient       action = string
          Pool allocation             chainId = 97
```

### Cac buoc da duoc dam bao:
1. **PPLP Validation v2.0** (constitution.ts) — 5 dieu kien bat buoc duoc kiem tra truoc khi tinh toan
2. **Light Score** (pplp-engine.ts) — Tinh diem tu 5 tru cot, ap dung multipliers
3. **Pre-mint Validation** (contract-helpers.ts) — Kiem tra network, contract, attester, action, threshold
4. **EIP-712 Signing** (eip712-signer.ts) — Ky va xac minh off-chain truoc khi gui
5. **On-chain Execution** — `lockWithPPLP` voi signature array

---

## 5. Nhung Diem MANH Sau Cap Nhat

| # | Diem manh | Chi tiet |
|---|-----------|---------|
| 1 | Contract dong bo 100% | Tat ca 5 file deu tro den `0x39A1...0CD6` |
| 2 | ABI chinh xac v1.2.1 | `lockWithPPLP` nhan string action, khong phai bytes32 |
| 3 | EIP-712 version khop | `"1.2.1"` — khop voi contract deployed |
| 4 | PPLP v2.0 tich hop | 5 dieu kien bat buoc duoc kiem tra truoc khi mint |
| 5 | Pool System ro rang | 4 Pool (40/30/20/10) + Anti-Hoarding logic |
| 6 | Debug Bundle day du | Cung cap toan bo thong tin de trace loi mint |
| 7 | Chain switching tu dong | Donation.ts tu dong chuyen sang BSC Testnet (97) cho FUN |

---

## 6. Nhung Diem CAN LUU Y / RUI RO

| # | Van de | Muc do | Giai thich |
|---|--------|--------|-----------|
| 1 | **Pool allocation chi o client** | Trung binh | `calculatePoolDistribution()` tinh toan 4 pool nhung chua tuong tac on-chain. Contract v1.2.1 chi co `communityPool()` getter, khong co `platformPool` hay `recyclePool` on-chain. Day chi la logic mo phong. |
| 2 | **Anti-Hoarding chi o client** | Trung binh | `calculateInactivityDecay()` tinh toan decay nhung khong co mechanism on-chain de tu dong recycle. Can smart contract upgrade hoac cron job. |
| 3 | **Trang thai RECYCLE chua on-chain** | Thap | `FunMoneyLifecycleState` co 4 trang thai nhung contract v1.2.1 chi ho tro 3 (Locked/Activated/Flowing). Recycle can contract upgrade. |
| 4 | **localStorage override** | Thap | `getContractAddress()` cho phep override qua localStorage. Neu user set sai dia chi, mint se that bai. Day la tinh nang debug, khong anh huong production. |
| 5 | **Testnet vs Mainnet** | Luu y | FUN Money dang tren BSC **Testnet** (chain 97). Khi chuyen mainnet can cap nhat: chainId, RPC, explorer URLs, va EIP-712 domain chainId. |
| 6 | **`require` dong trong scoreAction** | Thap | Dong 278 dung `require('./constitution')` — co the gay van de voi bundler. Nen chuyen sang import tinh o dau file. |

---

## 7. Ma Tran Tuong Thich

| Thanh phan | Constitution v2.0 | Contract v1.2.1 | Trang thai |
|------------|-------------------|-----------------|-----------|
| 4 Pool Structure | Co (client) | Chi co communityPool | **Chua dong bo** |
| PPLP 5 dieu kien | Co (pplp-engine) | Khong co on-chain | **Chi client** |
| Lifecycle 4 trang thai | Co (type) | 3 trang thai | **Thieu RECYCLE on-chain** |
| Anti-Hoarding | Co (pool-system) | Khong co | **Chi client** |
| Guardian Timelock | Co (tai lieu) | Khong co | **Chua trien khai** |
| EIP-712 Signing | Khop | Khop | **DONG BO** |
| lockWithPPLP | Khop | Khop | **DONG BO** |
| activate/claim | Khop | Khop | **DONG BO** |

---

## 8. Ket Luan

**He thong mint FUN Money hien tai HOAT DONG DUNG** voi contract `0x39A1...0CD6` (v1.2.1). Tat ca cac file da dong bo dia chi, ABI khop chinh xac, va EIP-712 domain dung version `"1.2.1"`.

Cac tinh nang Constitution v2.0 (4 Pool, Anti-Hoarding, RECYCLE, Guardian Timelock) hien chi ton tai o **lop logic client** va **tai lieu**. Chung khong anh huong den viec mint on-chain nhung cung chua duoc thuc thi on-chain. Khi nang cap smart contract len phien ban moi, can dong bo lai ABI va SDK.

**Khong can thay doi gi ngay luc nay** — he thong da san sang mint.


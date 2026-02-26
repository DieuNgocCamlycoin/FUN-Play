

# Kế Hoạch Tích Hợp FUN MONEY CONSTITUTION v2.0

## Tổng Quan

Bản Constitution v2.0 là phiên bản hợp nhất (Unified Charter) dành cho cả AI Agent, Smart Contract, Guardian Logic và Nhân loại. So với Whitepaper v0.1 đã triển khai, bản v2.0 bổ sung nhiều nội dung mới quan trọng:

- **Chương I-II**: Lời Khai Sinh & Định Danh Cốt Lõi (mới)
- **Chương III**: PPLP v2 — thêm 5 điều kiện bắt buộc rõ ràng
- **Chương IV**: 4 trạng thái vòng đời (Locked → Activated → Flowing → Recycle) — rõ ràng hơn, thêm trạng thái Recycle
- **Chương V**: Luật Không Tích Trữ — mạnh hơn ("không cảnh báo, không ngoại lệ")
- **Chương VI**: 4 Pool — mô tả chi tiết hơn (≈99% cho Community Pool)
- **Chương VII**: Vai trò AI Agent — "Guardian of Flow"
- **Chương VIII**: Vai trò Guardian Con Người (Bé Ly / CamLy Duong) — chưa có trong v0.1

## Các Thay Đổi Cần Thực Hiện

### 1. Tạo trang Constitution riêng (`/constitution`)

**File mới: `src/pages/Constitution.tsx`**

Trang công khai, thiết kế tương tự `/whitepaper` nhưng mang tính "luật pháp" hơn:
- Header: "FUN MONEY CONSTITUTION – VERSION 2.0" + phụ đề "Law of Light Economy – Executable Soul"
- Badge: "Unified Charter for AI Agent & Smart Contract"
- Sidebar mục lục 8 chương (I → VIII)
- Nội dung đầy đủ toàn bộ 8 chương từ bản Constitution v2.0
- Thiết kế: Tông tím-vàng sang trọng hơn whitepaper, các điều luật dùng `border-l` highlight
- Các điều khoản "❌ Không tồn tại" và "⚠️ Khi không chắc chắn" dùng card cảnh báo đặc biệt
- CTA cuối trang: liên kết đến `/whitepaper` (Whitepaper gốc) và `/fun-money` (Mint FUN)

**File sửa: `src/App.tsx`** — Thêm route `/constitution` lazy load

### 2. Cập nhật Whitepaper hiện có

**File sửa: `src/pages/Whitepaper.tsx`**
- Cập nhật version từ "v0.1" thành "v0.1 → v2.0"
- Thêm banner/link ở đầu trang: "📜 Xem FUN Money Constitution v2.0 — Bản hợp nhất cho AI Agent & Smart Contract" → dẫn đến `/constitution`

### 3. Cập nhật PPLP Engine theo Constitution v2.0

**File sửa: `src/lib/fun-money/pplp-engine.ts`**

3a. **Thêm PPLP Validation v2** — 5 điều kiện bắt buộc từ Chương III:
- Thêm interface `PPLPValidation` với 5 trường boolean:
  - `hasRealAction` — Có hành vi thực
  - `hasRealValue` — Tạo ra giá trị thật
  - `hasPositiveImpact` — Tác động tích cực
  - `noExploitation` — Không khai thác/thao túng/Ego
  - `charterCompliant` — Phù hợp Master Charter
- Thêm hàm `validatePPLP(validation: PPLPValidation): boolean` — trả về `false` nếu thiếu bất kỳ điều kiện nào
- Tích hợp vào `scoreAction()`: gọi `validatePPLP` trước khi tính toán, nếu thất bại → REJECT ngay

3b. **Thêm trạng thái Recycle vào vòng đời**:
- Mở rộng `MintDecision` thêm `'RECYCLE'`
- Thêm type `FunMoneyState = 'LOCKED' | 'ACTIVATED' | 'FLOWING' | 'RECYCLE'`
- Thêm comment ghi rõ: "FUN Money không burn – không tiêu hủy. Mọi FUN chỉ đổi trạng thái và nơi cư trú"

3c. **Cập nhật metadata**:
- Thêm `CONSTITUTION_VERSION = 'v2.0'` vào `pool-system.ts`
- Thêm `GUARDIAN_ROLE` constant mô tả vai trò AI Agent

### 4. Thêm module Constitution Constants

**File mới: `src/lib/fun-money/constitution.ts`**

Module chứa các hằng số và quy tắc từ Constitution v2.0, dùng cho cả AI Agent và UI:
- `CONSTITUTION_VERSION = 'v2.0'`
- `CORE_IDENTITY`: 4 định danh cốt lõi FUN Money (Chương II)
- `PPLP_REQUIREMENTS`: 5 điều kiện bắt buộc (Chương III)
- `TOKEN_LIFECYCLE`: 4 trạng thái vòng đời (Chương IV)
- `AI_AGENT_ROLE`: Quy tắc cho AI Agent (Chương VII)
- `GUARDIAN_RULES`: Quy tắc cho Guardian Con Người (Chương VIII)
- `FORBIDDEN_POOLS`: Danh sách Pool không tồn tại (Team, Investor)
- Export qua `index.ts`

### 5. Cập nhật Platform Docs

**File sửa: `src/pages/PlatformDocs.tsx`**
- Cập nhật tab "Whitepaper 5D" thêm link đến Constitution v2.0
- Hoặc thêm mục "Constitution v2.0" trong tab đó

---

## Cấu Trúc File

```text
src/
├── pages/
│   ├── Constitution.tsx         ← MỚI (trang công khai /constitution)
│   ├── Whitepaper.tsx           ← SỬA (thêm link đến Constitution)
│   └── PlatformDocs.tsx         ← SỬA (thêm link Constitution)
├── lib/fun-money/
│   ├── constitution.ts          ← MỚI (hằng số & quy tắc v2.0)
│   ├── pplp-engine.ts           ← SỬA (thêm PPLP Validation v2, trạng thái Recycle)
│   ├── pool-system.ts           ← SỬA (thêm CONSTITUTION_VERSION)
│   └── index.ts                 ← SỬA (export constitution.ts)
└── App.tsx                      ← SỬA (thêm route /constitution)
```

## Lưu Ý Quan Trọng
- Không cần thay đổi database — Constitution là logic và nội dung phía client
- Smart contract hiện tại đã hỗ trợ 3 trạng thái (Locked, Activated, Flowing); trạng thái Recycle sẽ cần nâng cấp contract trong tương lai
- Bản Constitution v2.0 chưa hoàn chỉnh trong tin nhắn (cắt ở Chương VIII) — sẽ triển khai phần đã nhận được, phần còn lại bổ sung sau


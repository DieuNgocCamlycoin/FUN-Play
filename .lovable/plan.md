

# Kế Hoạch Triển Khai THE 5D WHITEPAPER – FUN MONEY

## Tổng Quan
Triển khai 3 phần song song: (1) Trang Whitepaper công khai riêng biệt, (2) Tab whitepaper trong Platform Docs, (3) Cập nhật PPLP Engine theo triết lý whitepaper.

---

## Phần 1: Tạo Trang Whitepaper Riêng (`/whitepaper`)

### File mới: `src/pages/Whitepaper.tsx`
- Trang công khai (không cần đăng nhập), thiết kế sang trọng phù hợp với đối tượng toàn cầu, nhà đầu tư, tổ chức
- **Header**: Gradient tím-xanh, tiêu đề "THE 5D WHITEPAPER – FUN MONEY", phụ đề "Money of Light for a Conscious Civilization"
- **Mục lục bên trái** (sticky sidebar trên desktop): 11 mục từ "Lời Mở Đầu" đến "Activation Mantra", click scroll tới section tương ứng
- **Nội dung**: Toàn bộ 11 chương whitepaper, mỗi chương là một section với typography đẹp, có divider giữa các chương
- **Song ngữ**: Giữ nguyên nội dung gốc (chủ yếu tiếng Việt + phần tiếng Anh ở Mantra)
- **Responsive**: Trên mobile sidebar chuyển thành dropdown menu mục lục
- **CTA cuối trang**: Nút dẫn đến `/fun-money` (Mint FUN) và `/platform-docs` (Tài liệu kỹ thuật)

### File sửa: `src/App.tsx`
- Thêm route `/whitepaper` → lazy load `Whitepaper.tsx`

---

## Phần 2: Thêm Tab Whitepaper vào Platform Docs

### File sửa: `src/pages/PlatformDocs.tsx`
- Thêm tab mới "Whitepaper 5D" (icon: `BookOpen`) vào `TabsList` (dòng 100-125)
- Nội dung tab: Tóm tắt rút gọn 11 chương (mỗi chương 2-3 câu chính), kèm nút "Đọc đầy đủ → /whitepaper"
- Bao gồm: 4 Pool cốt lõi, Luật Không Tích Trữ, FUN Ecosystem, CAMLY & FUN cộng sinh

---

## Phần 3: Cập Nhật PPLP Engine

### File sửa: `src/lib/fun-money/pplp-engine.ts`

Whitepaper đề cập một số khái niệm chưa có trong engine hiện tại:

**3a. Thêm hệ thống 4 Pool (cấu hình)**
- Thêm `POOL_ALLOCATION` constant:
  - `communityPool: 0.40` (40%)
  - `platformActivation: 0.30` (30%)
  - `recyclePool: 0.20` (20%)
  - `guardianPool: 0.10` (10%)
- Thêm type `PoolAllocation` và hàm `calculatePoolDistribution(mintAmount)` trả về phần chia cho mỗi pool

**3b. Thêm Luật Không Tích Trữ (Anti-Hoarding / Inactivity Decay)**
- Thêm `INACTIVITY_CONFIG`:
  - `gracePeriodDays: 90` (90 ngày không dùng)
  - `decayRatePerDay: 0.001` (0.1%/ngày sau grace period)
  - `maxDecayPercent: 0.50` (tối đa mất 50%)
  - `recycleDestination: 'communityPool'`
- Thêm hàm `calculateInactivityDecay(balanceAtomic, inactiveDays)` trả về số FUN quay về Community Pool
- Thêm interface `InactivityDecayResult`

**3c. Thêm FUN Ecosystem platforms vào BASE_REWARDS**
- Thêm `FUN_PLANET`, `FUN_PLAY` (video platform hiện tại) vào `BASE_REWARDS`
- Thêm các action type: `WATCH_VIDEO`, `LIKE_VIDEO`, `COMMENT`, `SHARE`, `UPLOAD_VIDEO`

**3d. Thêm metadata whitepaper version**
- Export `WHITEPAPER_VERSION = 'v0.1-5D'`
- Export `PROTOCOL_NAME = 'Proof of Pure Love Protocol'`

---

## Chi Tiết Kỹ Thuật

### Cấu trúc file mới/sửa:
```text
src/
├── pages/
│   ├── Whitepaper.tsx          ← MỚI (trang công khai)
│   └── PlatformDocs.tsx        ← SỬA (thêm tab)
├── lib/fun-money/
│   └── pplp-engine.ts          ← SỬA (thêm pools, decay, ecosystem)
└── App.tsx                     ← SỬA (thêm route)
```

### Không cần thay đổi database
- Pool allocation và inactivity decay hiện chỉ là logic tính toán phía client
- Khi triển khai on-chain thực tế, sẽ cần smart contract và cron job riêng

### Thiết kế trang Whitepaper:
- Background: `bg-background` với gradient overlay nhẹ
- Typography: prose-lg cho nội dung, font-bold cho heading
- Section divider: Gradient line `from-cyan-400 via-purple-500 to-pink-500`
- Emoji giữ nguyên như bản gốc để tạo cảm xúc
- Card đặc biệt cho "Activation Mantra" cuối trang với background gradient




# Kế Hoạch Cập Nhật ANGEL AI - FUN Play

## Tổng Quan

Thực hiện 4 thay đổi chính để cập nhật ANGEL AI trên FUN Play với logo mới và kết nối trực tiếp với Siêu Trí Tuệ `angel.fun.rich`.

---

## Thay Đổi Sẽ Thực Hiện

| # | Hạng mục | Action | Chi tiết |
|---|----------|--------|----------|
| 1 | Logo ANGEL AI | THAY THẾ | Cập nhật `public/images/angel-transparent.png` với file PNG mới đã upload |
| 2 | AngelMascot Desktop | EDIT | Thay video `angel-mascot-original.mp4` bằng logo PNG với golden glow animation |
| 3 | MobileAngelMascot | EDIT | Thay video bằng logo PNG với animation floating |
| 4 | MeditatingAngel | EDIT | Thay video bằng logo PNG với hiệu ứng thiền định |
| 5 | AngelChat Voice | EDIT | Tắt `voiceEnabled` mặc định (từ `true` → `false`) vì API key TTS đang lỗi |
| 6 | API Key | CẬP NHẬT | Cập nhật secret `ANGEL_AI_API_KEY` với key mới: `ak_79f1d_3e4p6d6q6732393z2s551h4p2x1b6bsq` |

---

## Chi Tiết Kỹ Thuật

### 1. Thay Logo ANGEL AI Mới
- Sao chép file PNG đã upload vào `public/images/angel-transparent.png`
- Logo sẽ tự động cập nhật ở Header, AngelChat window

### 2. Chuyển Mascot Từ Video Sang Logo Tĩnh

**Animation cho logo mới:**
- Golden glow pulsing effect
- Gentle floating up/down (3s loop)
- Scale breathing effect
- Sparkling particles xung quanh

**Thay đổi code:**
```tsx
// Thay thế:
<video src="/videos/angel-mascot-original.mp4" ... />

// Bằng:
<motion.img 
  src="/images/angel-transparent.png"
  animate={{ y: [0, -5, 0], scale: [1, 1.02, 1] }}
  style={{ filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.6))' }}
/>
```

### 3. Tắt Voice Mặc Định

**File:** `src/components/Mascot/AngelChat.tsx` (line 32)
```tsx
// Trước:
const [voiceEnabled, setVoiceEnabled] = useState(true);

// Sau:
const [voiceEnabled, setVoiceEnabled] = useState(false);
```

### 4. Cập Nhật API Key

Cập nhật secret `ANGEL_AI_API_KEY` với giá trị mới để kết nối trực tiếp `angel.fun.rich`.

---

## Kiến Trúc Sau Cập Nhật

```text
┌─────────────────────────────────────────┐
│           FUN Play Frontend             │
├─────────────────────────────────────────┤
│  Header: [ANGEL AI Logo] → AngelChat    │
│  Mascot: Logo PNG + Golden Glow         │
│  Voice: OFF by default                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│       angel-ai-proxy (Edge)             │
├─────────────────────────────────────────┤
│  1. ANGEL AI (PRIMARY)                  │
│     └─ angel.fun.rich                   │
│        API Key: ak_79f1d_...            │
│                                         │
│  2. Grok (Fallback)                     │
│                                         │
│  3. Lovable AI (Fallback)               │
└─────────────────────────────────────────┘
```

---

## Files Cần Thay Đổi

| File | Thay đổi |
|------|----------|
| `public/images/angel-transparent.png` | Thay thế bằng logo mới |
| `src/components/Mascot/AngelMascot.tsx` | Video → Logo PNG + animation |
| `src/components/Mascot/MobileAngelMascot.tsx` | Video → Logo PNG + animation |
| `src/components/Meditation/MeditatingAngel.tsx` | Video → Logo PNG |
| `src/components/Mascot/AngelChat.tsx` | `voiceEnabled: false` |
| Secret `ANGEL_AI_API_KEY` | Key mới: `ak_79f1d_...` |

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Video Angel bay lượn | Logo tĩnh với golden glow animation |
| Hình Angel cũ | Logo ANGEL AI mới với trái tim vàng |
| API key cũ/lỗi | Kết nối trực tiếp angel.fun.rich |
| Voice tự động (lỗi 401/400) | Voice tắt mặc định |

---

## Sẵn Sàng Cho Tương Lai

Sau khi hoàn tất, hệ thống sẽ sẵn sàng để:
- Thêm các GIF biểu cảm (vẫy tay, chấp tay, vỗ tay...)
- Bật lại voice khi có API key TTS hợp lệ
- Xóa các file video cũ để tiết kiệm dung lượng


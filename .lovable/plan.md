
# Kế Hoạch Thêm Avatar ANGEL AI vào Navbar

## Tổng Quan

Thêm một nút avatar ANGEL AI xinh xắn vào cả **Desktop Header** và **Mobile Header** để người dùng có thể click vào để mở chat với ANGEL AI bất cứ lúc nào!

## Thiết Kế Avatar ANGEL AI

```text
┌─────────────────────────────────────────────────────────────────┐
│ Desktop Header                                                   │
│ [Menu] [Logo]     [───── Search ─────]    [...]  [👼] [User]   │
│                                                ↑                 │
│                                         ANGEL AI Avatar         │
│                                         với golden glow          │
└─────────────────────────────────────────────────────────────────┘
```

| Thuộc tính | Giá trị |
|------------|---------|
| **Hình ảnh** | `/images/angel-transparent.png` |
| **Kích thước** | Desktop: 36x36px, Mobile: 28x28px |
| **Hiệu ứng** | Golden glow animation, pulse khi hover |
| **Tooltip** | "Chat với ANGEL AI ✨" |

## Kiến Trúc Component

```text
Header / MobileHeader
       │
       ├── [Angel Avatar Button] ─── onClick ──► setAngelChatOpen(true)
       │        │
       │        └── AnimatedGlow + Tooltip
       │
       └── <AngelChat isOpen={angelChatOpen} onClose={...} />
```

## Files Cần Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `src/components/Layout/Header.tsx` | EDIT | Thêm Angel Avatar button + AngelChat component |
| `src/components/Layout/MobileHeader.tsx` | EDIT | Thêm Angel Avatar button (compact) + AngelChat component |

---

## Chi Tiết Thay Đổi

### 1. Header.tsx (Desktop)

**Import thêm:**
```tsx
import { AngelChat } from '@/components/Mascot/AngelChat';
```

**State mới:**
```tsx
const [angelChatOpen, setAngelChatOpen] = useState(false);
```

**Avatar Button (thêm vào right section, trước Notifications):**
```tsx
{/* ANGEL AI Chat Button */}
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setAngelChatOpen(true)}
      className="relative rounded-full overflow-hidden h-9 w-9 hover:scale-110 transition-transform"
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            '0 0 10px rgba(255,215,0,0.4)',
            '0 0 20px rgba(255,215,0,0.6)',
            '0 0 10px rgba(255,215,0,0.4)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <img 
        src="/images/angel-transparent.png" 
        alt="ANGEL AI" 
        className="w-8 h-8 object-contain relative z-10"
      />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Chat với ANGEL AI ✨</TooltipContent>
</Tooltip>
```

**Render AngelChat:**
```tsx
<AngelChat isOpen={angelChatOpen} onClose={() => setAngelChatOpen(false)} />
```

### 2. MobileHeader.tsx (Mobile - Compact)

**Import thêm:**
```tsx
import { AngelChat } from '@/components/Mascot/AngelChat';
```

**State mới:**
```tsx
const [angelChatOpen, setAngelChatOpen] = useState(false);
```

**Avatar Button (thêm vào right section):**
```tsx
{/* ANGEL AI Chat Button - Compact */}
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setAngelChatOpen(true)}
      className="h-7 w-7 relative rounded-full overflow-hidden"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700]/30 to-[#FFA500]/30 animate-pulse" />
      <img 
        src="/images/angel-transparent.png" 
        alt="ANGEL AI" 
        className="w-6 h-6 object-contain relative z-10"
      />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom" className="text-xs">
    ANGEL AI ✨
  </TooltipContent>
</Tooltip>
```

**Render AngelChat:**
```tsx
<AngelChat isOpen={angelChatOpen} onClose={() => setAngelChatOpen(false)} />
```

---

## Kết Quả Mong Đợi

| Platform | Trước | Sau |
|----------|-------|-----|
| **Desktop** | Không có nút ANGEL AI | 👼 Avatar với golden glow trước nút Notifications |
| **Mobile** | Không có nút ANGEL AI | 👼 Avatar nhỏ xinh giữa các nút actions |

## Vị Trí Đề Xuất trong Header

**Desktop (Header.tsx):**
```text
[FunWallet] [CAMLY] [ClaimRewards] [Wallet] [Create ▾] [👼 ANGEL] [🔔] [User]
```

**Mobile (MobileHeader.tsx):**
```text
[FunWallet] [CAMLY] [🔍] [💰] [💼] [➕] [👼] [📥] [🔔] [User]
```

## Lợi Ích

| Lợi ích | Mô tả |
|---------|-------|
| **Dễ truy cập** | Click 1 lần để mở chat, không cần tìm mascot |
| **Nhận diện thương hiệu** | Avatar Angel luôn hiện diện trên navbar |
| **Golden glow** | Animation thu hút sự chú ý |
| **Responsive** | Hoạt động tốt trên cả desktop và mobile |

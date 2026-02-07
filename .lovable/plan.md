

# Triển Khai Hệ Thống Nhắn Tin (Messenger) - Facebook-Style

## Tổng Quan

Xây dựng hệ thống chat 1-1 realtime tương tự Facebook Messenger, tích hợp sâu với hệ thống Thưởng & Tặng. Database đã sẵn có (`user_chats`, `chat_messages`) và edge function `create-donation` đã tự động tạo tin nhắn donation.

---

## 1. Database - Cập Nhật Schema

### 1.1 Thêm Cột `last_message_at` và `last_message_preview`

Bảng `user_chats` hiện tại chỉ có `updated_at`. Cần thêm:

```sql
-- Thêm cột để hiển thị danh sách chat hiệu quả hơn
ALTER TABLE user_chats 
ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_message_preview text;

-- Index để sort theo tin nhắn mới nhất
CREATE INDEX IF NOT EXISTS idx_user_chats_last_message ON user_chats(last_message_at DESC);

-- Enable realtime cho chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### 1.2 Trigger Tự Động Cập Nhật `last_message_at`

```sql
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_chats 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 50),
    updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_chat_message_insert
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();
```

---

## 2. Frontend - Cấu Trúc Components

### 2.1 Thư Mục Mới

```text
src/
├── pages/
│   └── Messages.tsx              # Trang chính /messages
├── components/
│   └── Chat/
│       ├── ChatLayout.tsx        # Layout 2 cột (desktop) / stack (mobile)
│       ├── ChatSidebar.tsx       # Danh sách cuộc trò chuyện (cột trái)
│       ├── ChatWindow.tsx        # Khung chat chính (cột phải)
│       ├── ChatHeader.tsx        # Header: avatar, tên, nút tặng
│       ├── ChatMessageList.tsx   # Danh sách tin nhắn scroll
│       ├── ChatMessageItem.tsx   # Một tin nhắn (text/donation/system)
│       ├── ChatInput.tsx         # Ô nhập tin nhắn + nút gửi
│       ├── ChatDonationCard.tsx  # Card tin nhắn donation đặc biệt
│       └── ChatEmptyState.tsx    # Trạng thái chưa có chat
└── hooks/
    ├── useChats.ts               # CRUD danh sách chat
    └── useChatMessages.ts        # CRUD + realtime tin nhắn
```

### 2.2 Route Mới

```tsx
// Thêm vào App.tsx
<Route path="/messages" element={<Messages />} />
<Route path="/messages/:chatId" element={<Messages />} />
```

---

## 3. Layout Chi Tiết

### 3.1 Desktop Layout (lg+)

```text
┌───────────────────────────────────────────────────────────────┐
│ HEADER (giống hiện tại, thêm icon 💬)                        │
├─────────────────┬─────────────────────────────────────────────┤
│                 │ CHAT HEADER                                │
│  CHAT SIDEBAR   │ Avatar | Tên | Online | [🎁] [ℹ️]          │
│  (320px fixed)  ├─────────────────────────────────────────────┤
│                 │                                             │
│  [🔍 Tìm kiếm]  │  MESSAGE LIST                              │
│                 │  ┌─────────────────────────────────────────┐│
│  ┌───────────┐  │  │ Bubble trái (người kia)                ││
│  │ Avatar    │  │  │ Bubble phải (mình)                     ││
│  │ Tên       │  │  │ Card donation (gradient border)        ││
│  │ Preview   │  │  └─────────────────────────────────────────┘│
│  │ Time 🔴   │  │                                             │
│  └───────────┘  │  INPUT FOOTER                              │
│  ┌───────────┐  │  ┌─────────────────────────────────────────┐│
│  │ ...       │  │  │ 📷 | [Nhắn tin yêu thương...] | 💖     ││
│  └───────────┘  │  └─────────────────────────────────────────┘│
└─────────────────┴─────────────────────────────────────────────┘
```

### 3.2 Mobile Layout

- Trang `/messages`: Hiển thị `ChatSidebar` fullscreen
- Tap vào chat → Navigate `/messages/:chatId` → `ChatWindow` fullscreen
- Back button để quay lại danh sách

---

## 4. Components Chi Tiết

### 4.1 ChatLayout.tsx

```tsx
// Desktop: 2 cột side-by-side
// Mobile: Stack (sidebar hoặc window tùy route)
<MainLayout showBottomNav={false}>
  <div className="flex h-[calc(100vh-56px)]">
    {/* Sidebar - hidden on mobile when viewing chat */}
    <ChatSidebar className="w-80 border-r hidden md:flex" />
    
    {/* Window */}
    {selectedChatId ? (
      <ChatWindow chatId={selectedChatId} />
    ) : (
      <ChatEmptyState />
    )}
  </div>
</MainLayout>
```

### 4.2 ChatSidebar.tsx

```tsx
// State: chats, searchQuery, unreadCounts
// UI:
// - Search bar với glass effect
// - List items với:
//   - Avatar + online indicator
//   - Display name
//   - Last message preview (truncate 50 chars)
//   - Time (relative: "2 phút", "Hôm qua")
//   - Unread badge (red dot với số)
// - Active chat: border hologram gradient
// - Hover: glow effect

interface ChatItem {
  id: string;
  otherUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}
```

### 4.3 ChatMessageItem.tsx

**Text Message:**
```tsx
<div className={cn(
  "max-w-[70%] p-3 rounded-2xl",
  isMe 
    ? "ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm"
    : "mr-auto bg-muted rounded-bl-sm"
)}>
  {content}
  <span className="text-[10px] opacity-70 ml-2">{time}</span>
</div>
```

**Donation Message (ChatDonationCard):**
```tsx
<div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-pink-500/10 to-purple-500/10 border-2 border-amber-500/40">
  <div className="flex items-center gap-2 mb-2">
    <Gift className="w-5 h-5 text-amber-500" />
    <span className="font-bold text-amber-600">Lì xì</span>
  </div>
  <p className="font-medium">{senderName} đã tặng {amount} {tokenSymbol}</p>
  {message && <p className="text-sm italic mt-1">"{message}"</p>}
  <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate(deepLink)}>
    Xem biên nhận
  </Button>
</div>
```

### 4.4 ChatInput.tsx

```tsx
// Features:
// - Enter để gửi, Shift+Enter xuống dòng
// - Emoji picker (reuse từ EMOJI_LIST trong EnhancedDonateModal)
// - Optimistic UI: tin nhắn hiện ngay, đánh dấu "đang gửi"
// - Auto-scroll xuống cuối khi gửi
```

### 4.5 ChatHeader.tsx

```tsx
<div className="h-16 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur">
  {/* Mobile back button */}
  <Button variant="ghost" size="icon" className="md:hidden">
    <ArrowLeft />
  </Button>
  
  {/* User info */}
  <div className="flex items-center gap-3">
    <Avatar className="h-10 w-10 ring-2 ring-primary/30">
      <AvatarImage src={user.avatar_url} />
    </Avatar>
    <div>
      <p className="font-medium">{user.display_name}</p>
      <p className="text-xs text-muted-foreground">
        {isOnline ? "Đang hoạt động" : `Hoạt động ${lastSeen}`}
      </p>
    </div>
  </div>
  
  {/* Actions */}
  <div className="flex gap-2">
    <Button variant="ghost" size="icon" onClick={openDonateModal}>
      <Gift className="h-5 w-5 text-amber-500" />
    </Button>
    <Button variant="ghost" size="icon" onClick={() => navigate(`/user/${user.id}`)}>
      <Info className="h-5 w-5" />
    </Button>
  </div>
</div>
```

---

## 5. Hooks

### 5.1 useChats.ts

```typescript
export const useChats = () => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchChats = async () => {
    // Query user_chats where user1_id or user2_id = user.id
    // Join profiles để lấy thông tin người kia
    // Sort by last_message_at DESC
  };

  const findOrCreateChat = async (otherUserId: string) => {
    // Check existing chat
    // Create new if not exists
    // Return chat_id
  };

  // Realtime subscription for new chats
  useEffect(() => {
    const channel = supabase
      .channel('my-chats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_chats',
        filter: `user1_id=eq.${user.id}` // Need OR logic
      }, handleChatChange)
      .subscribe();
  }, [user?.id]);

  return { chats, loading, fetchChats, findOrCreateChat };
};
```

### 5.2 useChatMessages.ts

```typescript
export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    // Query chat_messages where chat_id = chatId
    // Order by created_at ASC
    // Include sender profile info
  };

  const sendMessage = async (content: string) => {
    // Optimistic UI: add message immediately
    // Insert to database
    // Update on error
  };

  const markAsRead = async () => {
    // Update is_read = true for messages where sender_id != user.id
  };

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId}`
      }, handleNewMessage)
      .subscribe();
  }, [chatId]);

  return { messages, loading, sendMessage, markAsRead };
};
```

---

## 6. Header Entry Point

### 6.1 Thêm Icon Tin Nhắn Vào Header

```tsx
// Trong Header.tsx, thêm sau Bell icon:
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => navigate("/messages")}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent>Tin nhắn</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 6.2 User Dropdown - Thêm "Nhắn Tin"

```tsx
// Khi click vào profile người khác, thêm vào dropdown:
<DropdownMenuItem onClick={() => handleStartChat(userId)}>
  <MessageCircle className="mr-2 h-4 w-4" />
  Nhắn tin
</DropdownMenuItem>
```

---

## 7. Styling - Design System FUN PLAY

### 7.1 Glass Effect cho Sidebar

```css
.chat-sidebar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(0, 231, 255, 0.2);
}
```

### 7.2 Active Chat Item

```css
.chat-item-active {
  background: linear-gradient(135deg, 
    rgba(192, 132, 252, 0.1),
    rgba(236, 72, 153, 0.1),
    rgba(0, 231, 255, 0.1)
  );
  border: 1px solid rgba(192, 132, 252, 0.3);
  box-shadow: 0 0 20px rgba(192, 132, 252, 0.2);
}
```

### 7.3 My Message Bubble

```css
.message-bubble-me {
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  border-radius: 20px 20px 4px 20px;
  color: white;
}

.message-bubble-other {
  background: #F3F4F6;
  border-radius: 20px 20px 20px 4px;
}
```

---

## 8. Files Cần Tạo/Sửa

| File | Thay Đổi |
|------|----------|
| **Database Migration** | Thêm `last_message_at`, trigger, enable realtime |
| `src/pages/Messages.tsx` | **MỚI** - Trang chính |
| `src/components/Chat/ChatLayout.tsx` | **MỚI** |
| `src/components/Chat/ChatSidebar.tsx` | **MỚI** |
| `src/components/Chat/ChatWindow.tsx` | **MỚI** |
| `src/components/Chat/ChatHeader.tsx` | **MỚI** |
| `src/components/Chat/ChatMessageList.tsx` | **MỚI** |
| `src/components/Chat/ChatMessageItem.tsx` | **MỚI** |
| `src/components/Chat/ChatInput.tsx` | **MỚI** |
| `src/components/Chat/ChatDonationCard.tsx` | **MỚI** |
| `src/components/Chat/ChatEmptyState.tsx` | **MỚI** |
| `src/hooks/useChats.ts` | **MỚI** |
| `src/hooks/useChatMessages.ts` | **MỚI** |
| `src/components/Layout/Header.tsx` | Thêm icon 💬 |
| `src/components/Layout/MobileHeader.tsx` | Thêm icon 💬 |
| `src/App.tsx` | Thêm route `/messages` |

---

## 9. Testing Checklist

- [ ] Vào `/messages` → Hiển thị danh sách chat (có thể rỗng)
- [ ] Tặng thưởng cho ai đó → Tự động tạo chat + tin nhắn donation
- [ ] Vào chat → Thấy tin nhắn donation với card đẹp
- [ ] Gửi tin nhắn text → Hiện realtime
- [ ] Người khác gửi → Nhận realtime, badge unread
- [ ] Click "Xem biên nhận" trong donation → Mở `/receipt/xxx`
- [ ] Click avatar → Mở profile
- [ ] Click 🎁 trong chat header → Mở modal tặng thưởng
- [ ] Mobile: Danh sách → Tap → Chat fullscreen → Back
- [ ] Desktop: 2 cột hoạt động mượt
- [ ] Search chat hoạt động

---

## Kết Quả Mong Đợi

| Tính Năng | Mô Tả |
|-----------|-------|
| Entry Point | Icon 💬 ở header + dropdown "Nhắn tin" |
| Danh Sách Chat | Sort theo tin nhắn mới nhất, badge unread |
| Chat Realtime | Tin nhắn mới hiện ngay, không reload |
| Donation Integration | Tin nhắn donation tự động, card premium |
| Design | Glassmorphism, hologram gradient, 5D vibe |
| Responsive | Desktop 2 cột, Mobile fullscreen |
| UX | Giống Facebook Messenger |


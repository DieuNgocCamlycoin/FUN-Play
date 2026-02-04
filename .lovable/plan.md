
# Kế Hoạch Lưu Lịch Sử Chat Angel AI vào Database

## Tổng Quan

Thêm tính năng lưu lịch sử chat với Angel AI vào database để người dùng có thể:
- Xem lại các cuộc trò chuyện trước đó
- Tiếp tục cuộc trò chuyện cũ  
- Xóa các cuộc hội thoại không cần thiết

---

## Thiết Kế Database

### Bảng 1: `angel_chat_sessions` (Phiên chat)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | ID phiên chat |
| user_id | uuid | ID người dùng (FK -> auth.users) |
| title | text | Tiêu đề tự động (lấy từ 50 ký tự đầu tin nhắn) |
| created_at | timestamp | Thời gian tạo |
| updated_at | timestamp | Thời gian cập nhật |

### Bảng 2: `angel_chat_messages` (Tin nhắn)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | ID tin nhắn |
| session_id | uuid | ID phiên chat (FK -> angel_chat_sessions) |
| role | text | 'user' hoặc 'assistant' |
| content | text | Nội dung tin nhắn |
| provider | text | 'angel-ai', 'grok', 'chatgpt', 'lovable-ai' |
| created_at | timestamp | Thời gian gửi |

### RLS Policies

- Người dùng chỉ xem/tạo/xóa lịch sử của chính mình
- Messages được bảo vệ thông qua session

---

## Thay Đổi Code

### 1. Tạo Hook `useAngelChatHistory`

```text
Chức năng:
├── loadSessions() - Lấy danh sách phiên chat (giới hạn 50 gần nhất)
├── loadMessages(sessionId) - Lấy tin nhắn của 1 phiên
├── createSession() - Tạo phiên chat mới
├── saveMessage() - Lưu tin nhắn sau khi gửi/nhận
├── deleteSession() - Xóa phiên chat
└── updateSessionTitle() - Cập nhật tiêu đề từ tin nhắn đầu
```

### 2. Cập Nhật `AngelChat.tsx`

```text
Thay đổi:
├── Thêm sidebar hiển thị lịch sử chat (có thể thu gọn)
├── Nút "➕ Cuộc trò chuyện mới" ở header
├── Click vào session cũ để xem lại và tiếp tục
├── Nút xóa từng session (với confirm)
├── Auto-save mỗi khi gửi tin nhắn user và nhận phản hồi assistant
└── Chỉ lưu lịch sử khi user đã đăng nhập
```

### 3. UI Mới (Responsive)

```text
Desktop (w-[420px]):
┌─────────────────────────────────────────────┐
│  🌟 Siêu Trí Tuệ Angel    [📋][🔊][X]      │
├──────────┬──────────────────────────────────┤
│ History  │  Chat Messages                   │
│──────────│                                  │
│ [➕ New] │  Angel: Chào bạn yêu!...         │
│          │                                  │
│ ○ Hôm nay│  Bạn: Xin chào!                  │
│  > Chat1 │                                  │
│  > Chat2 │  Angel: Rất vui được...          │
│ ○ Hôm qua│                                  │
│  > Chat3 │                                  │
├──────────┴──────────────────────────────────┤
│ [📝 Nhắn với Angel... ♡             ] [▶]  │
└─────────────────────────────────────────────┘

Mobile (thu gọn history):
┌───────────────────────────┐
│ 🌟 Angel    [📋][🔊][X]  │  <- Click 📋 để toggle history
├───────────────────────────┤
│  Chat Messages            │
│                           │
│  ...                      │
├───────────────────────────┤
│ [📝 Nhắn...      ] [▶]   │
└───────────────────────────┘
```

---

## Files Sẽ Thay Đổi

| Action | File | Mô tả |
|--------|------|-------|
| CREATE | Migration SQL | Tạo 2 bảng + RLS policies |
| CREATE | `src/hooks/useAngelChatHistory.ts` | Hook quản lý lịch sử |
| EDIT | `src/components/Mascot/AngelChat.tsx` | Thêm sidebar + auto-save + session management |

---

## Chi Tiết Kỹ Thuật

### Migration SQL

```sql
-- Bảng sessions
CREATE TABLE public.angel_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Cuộc trò chuyện mới',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng messages  
CREATE TABLE public.angel_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.angel_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  provider text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.angel_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angel_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho sessions (users quản lý session của mình)
CREATE POLICY "Users can view own sessions" 
  ON public.angel_chat_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
  ON public.angel_chat_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
  ON public.angel_chat_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
  ON public.angel_chat_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies cho messages (thông qua session ownership)
CREATE POLICY "Users can view own messages" 
  ON public.angel_chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.angel_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages" 
  ON public.angel_chat_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.angel_chat_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_angel_chat_sessions_user_id ON public.angel_chat_sessions(user_id);
CREATE INDEX idx_angel_chat_sessions_updated_at ON public.angel_chat_sessions(updated_at DESC);
CREATE INDEX idx_angel_chat_messages_session_id ON public.angel_chat_messages(session_id);
CREATE INDEX idx_angel_chat_messages_created_at ON public.angel_chat_messages(created_at);
```

### Hook useAngelChatHistory.ts

```typescript
// Key functions:
- loadSessions(): Fetch 50 sessions gần nhất, order by updated_at DESC
- loadMessages(sessionId): Fetch tất cả messages của 1 session
- createSession(): Tạo session mới, return session id
- saveMessage(sessionId, role, content, provider?): Insert message mới
- deleteSession(sessionId): Delete session (CASCADE sẽ xóa messages)
- updateSessionTitle(sessionId, title): Update title từ nội dung tin đầu
```

### AngelChat.tsx Updates

```typescript
// Key changes:
1. Import useAngelChatHistory hook
2. Add state: currentSessionId, sessions, showHistory
3. On mount: Load sessions if user logged in
4. On sendMessage success: Save both user & assistant messages
5. On new chat: Create new session, reset messages
6. On select session: Load messages, set currentSessionId
7. Sidebar toggle button in header
8. Sidebar with session list, grouped by date (Today, Yesterday, etc)
```

---

## Kết Quả Mong Đợi

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Lịch sử chat | Mất khi refresh | Lưu vĩnh viễn vào database |
| Xem lại cuộc trò chuyện | Không có | Sidebar hiển thị danh sách |
| Tiếp tục chat cũ | Không thể | Click để load và tiếp tục |
| Xóa lịch sử | Không có | Nút xóa từng session |
| Guest users | Chat bình thường | Chat nhưng không lưu (thông báo) |

---

## Notes

- Chỉ lưu lịch sử cho users đã đăng nhập
- Guest users vẫn chat được nhưng sẽ thấy thông báo "Đăng nhập để lưu lịch sử"
- Title tự động lấy từ 50 ký tự đầu của tin nhắn user đầu tiên
- Giới hạn 50 sessions để tránh load quá nhiều data

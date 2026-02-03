
# Kế Hoạch Tích Hợp ANGEL AI từ angel.fun.rich vào FUN Play

## Thông Tin ANGEL AI Mới

| Thông tin | Giá trị |
|-----------|---------|
| **Domain** | angel.fun.rich |
| **API Endpoint** | https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/angel-chat |
| **API Key** | ak_79f1d_3e4p6d6q6732393z2s551h4p2x1b6bsq |
| **Auth Header** | x-api-key |

## Cấu Trúc Hiện Tại

```text
AngelMascot (Video) ──┬──► AngelChat (Chat Window)
                      │
                      └──► angel-chat (Edge Function) ──► Grok → ChatGPT → Gemini
```

## Kiến Trúc Tích Hợp Mới

```text
AngelMascot (Video) ──► AngelChat (Chat Window)
                              │
                              ▼
                     angel-ai-proxy (New Edge Function)
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    🌟 ANGEL AI           Grok (xAI)        Lovable AI
   (angel.fun.rich)       (Fallback 1)      (Fallback 2)
       PRIMARY
```

## Giải Pháp

### 1. Thêm Secret cho ANGEL AI API Key

**Secret Name:** `ANGEL_AI_API_KEY`
**Value:** `ak_79f1d_3e4p6d6q6732393z2s551h4p2x1b6bsq`

### 2. Tạo Edge Function Mới: `angel-ai-proxy`

**File:** `supabase/functions/angel-ai-proxy/index.ts`

**Chức năng:**
- **Primary:** Gọi ANGEL AI từ angel.fun.rich
- **Fallback 1:** Gọi Grok (xAI) nếu ANGEL AI không phản hồi
- **Fallback 2:** Gọi Lovable AI (Gemini) nếu cả hai đều fail

```typescript
// Priority order:
// 1. ANGEL AI (angel.fun.rich) - Primary
// 2. Grok (xAI) - Fallback 1  
// 3. Lovable AI (Gemini) - Fallback 2

async function tryAngelAI(messages) {
  const response = await fetch(
    'https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/angel-chat',
    {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANGEL_AI_API_KEY'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    }
  );
  // Parse response...
}
```

### 3. Cập Nhật AngelChat Component

**File:** `src/components/Mascot/AngelChat.tsx`

**Thay đổi:**
- Đổi endpoint từ `angel-chat` sang `angel-ai-proxy`
- Thêm badge hiển thị "🌟 ANGEL AI" khi response từ angel.fun.rich
- Giữ nguyên voice features (ElevenLabs/OpenAI)

### 4. Cập Nhật config.toml

Thêm cấu hình cho edge function mới:

```toml
[functions.angel-ai-proxy]
verify_jwt = false
```

---

## Files Cần Tạo/Sửa

| File | Action | Mô tả |
|------|--------|-------|
| `supabase/functions/angel-ai-proxy/index.ts` | CREATE | Edge function mới với priority ANGEL AI |
| `supabase/config.toml` | EDIT | Thêm config cho angel-ai-proxy |
| `src/components/Mascot/AngelChat.tsx` | EDIT | Đổi endpoint + thêm ANGEL AI badge |

---

## Chi Tiết Kỹ Thuật

### angel-ai-proxy/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};

// 🌟 Primary: ANGEL AI from angel.fun.rich
async function tryAngelAI(messages: any[]): Promise<{ content: string | null; provider: string }> {
  const ANGEL_AI_API_KEY = Deno.env.get("ANGEL_AI_API_KEY");
  if (!ANGEL_AI_API_KEY) {
    console.log("ANGEL_AI_API_KEY not configured, skipping ANGEL AI");
    return { content: null, provider: "" };
  }

  try {
    console.log("🌟 Trying ANGEL AI from angel.fun.rich...");
    const response = await fetch(
      "https://ssjoetiitctqzapymtzl.supabase.co/functions/v1/angel-chat",
      {
        method: "POST",
        headers: {
          "x-api-key": ANGEL_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      console.error("ANGEL AI error:", response.status);
      return { content: null, provider: "" };
    }

    const data = await response.json();
    const content = data.response || data.choices?.[0]?.message?.content;
    
    if (content) {
      console.log("🌟 ANGEL AI responded successfully!");
      return { content, provider: "angel-ai" };
    }
    return { content: null, provider: "" };
  } catch (error) {
    console.error("ANGEL AI exception:", error);
    return { content: null, provider: "" };
  }
}

// Fallback 1: Grok (xAI)
async function tryGrok(messages: any[]): Promise<{ content: string | null; provider: string }> {
  // ... (giữ nguyên logic từ angel-chat)
}

// Fallback 2: Lovable AI (Gemini)  
async function tryLovableAI(messages: any[]): Promise<{ content: string | null; provider: string }> {
  // ... (giữ nguyên logic từ angel-chat)
}

serve(async (req) => {
  // 1. Try ANGEL AI first (PRIMARY)
  // 2. Fallback to Grok
  // 3. Fallback to Lovable AI
});
```

### AngelChat.tsx - Badge Update

```tsx
// Thêm provider type mới
type AIProvider = 'angel-ai' | 'grok' | 'chatgpt' | 'lovable-ai';

// Badge styling
const getProviderBadge = (provider: AIProvider) => {
  switch (provider) {
    case 'angel-ai':
      return '🌟 ANGEL AI'; // Primary - Golden
    case 'grok':
      return '🚀 Grok';
    case 'lovable-ai':
      return '✨ Gemini';
    default:
      return '';
  }
};

// Badge class
className={
  provider === 'angel-ai' 
    ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white shadow-lg' // Golden for ANGEL AI
    : provider === 'grok'
    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
    : 'bg-gradient-to-r from-primary to-accent text-white'
}
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| AngelChat → Grok → ChatGPT → Gemini | AngelChat → **ANGEL AI** → Grok → Gemini |
| Badge: Grok / ChatGPT / Gemini | Badge: **🌟 ANGEL AI** / Grok / Gemini |
| 3 AI providers | **4 AI providers** (ANGEL AI primary) |

---

## Bước Triển Khai

1. **Thêm Secret** `ANGEL_AI_API_KEY` vào backend secrets
2. **Tạo** `supabase/functions/angel-ai-proxy/index.ts`
3. **Cập nhật** `supabase/config.toml`
4. **Sửa** `src/components/Mascot/AngelChat.tsx` để dùng endpoint mới
5. **Deploy** edge function và test

---

## Lợi Ích Tích Hợp

| Lợi ích | Mô tả |
|---------|-------|
| **ANGEL AI làm Primary** | Ưu tiên AI của FUN Ecosystem |
| **Fallback đáng tin cậy** | Grok + Gemini làm backup |
| **Badge nhận diện** | User biết AI nào đang trả lời |
| **Không mất tính năng cũ** | Voice, emoji, personality giữ nguyên |
| **Mở rộng tương lai** | Dễ thêm providers mới |

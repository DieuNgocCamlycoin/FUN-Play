
# Kế Hoạch Sửa Lỗi Kết Nối ANGEL AI angel.fun.rich

## Vấn Đề Phát Hiện

Từ logs, API key mới **đã hoạt động** và ANGEL AI đang phản hồi, nhưng response format là **streaming (SSE)** thay vì JSON:

```
ANGEL AI exception: SyntaxError: Unexpected token 'd', "data: {"ch"... is not valid JSON
```

Response format từ angel.fun.rich:
```
data: {"choices":[{"delta":{"content":"Xin"}}]}
data: {"choices":[{"delta":{"content":" chào"}}]}
data: [DONE]
```

Trong khi code đang cố parse như JSON object bình thường.

---

## Giải Pháp

Cập nhật function `tryAngelAI()` để xử lý SSE streaming response:

### Code Thay Đổi

| File | Thay đổi |
|------|----------|
| `supabase/functions/angel-ai-proxy/index.ts` | Thêm SSE streaming parser cho ANGEL AI |

### Logic Mới

1. Đọc response.text() thay vì response.json()
2. Parse từng dòng `data: {...}` 
3. Ghép tất cả `delta.content` thành nội dung hoàn chỉnh
4. Bỏ qua các dòng `data: [DONE]` hoặc dòng trống

---

## Chi Tiết Kỹ Thuật

### Function tryAngelAI() mới:

```typescript
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
      const errorText = await response.text();
      console.error("ANGEL AI error:", response.status, errorText);
      return { content: null, provider: "" };
    }

    // Handle SSE streaming response from angel.fun.rich
    const text = await response.text();
    console.log("🌟 ANGEL AI raw response (first 200 chars):", text.slice(0, 200));
    
    // Check if it's SSE format (starts with "data:")
    if (text.startsWith("data:") || text.includes("\ndata:")) {
      let fullContent = "";
      const lines = text.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim(); // Remove "data:" prefix
          if (jsonStr === "[DONE]" || jsonStr === "") continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            // Handle OpenAI-style streaming format
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
            }
            // Also check for direct response format
            if (parsed.response) {
              fullContent = parsed.response;
              break;
            }
          } catch {
            // Skip non-JSON lines
            continue;
          }
        }
      }
      
      if (fullContent) {
        console.log("🌟 ANGEL AI responded successfully (SSE)!");
        return { content: fullContent, provider: "angel-ai" };
      }
    }
    
    // Try parsing as regular JSON
    try {
      const data = JSON.parse(text);
      const content = data.response || data.choices?.[0]?.message?.content;
      if (content) {
        console.log("🌟 ANGEL AI responded successfully (JSON)!");
        return { content, provider: "angel-ai" };
      }
    } catch {
      console.error("ANGEL AI: Unable to parse response");
    }
    
    return { content: null, provider: "" };
  } catch (error) {
    console.error("ANGEL AI exception:", error);
    return { content: null, provider: "" };
  }
}
```

---

## Kết Quả Mong Đợi

| Trước | Sau |
|-------|-----|
| Lỗi JSON parse | ✅ Xử lý được SSE streaming |
| Fallback sang Gemini | ✅ Response trực tiếp từ ANGEL AI |
| Provider: "lovable-ai" | ✅ Provider: "angel-ai" |

---

## Files Sẽ Thay Đổi

| Action | File |
|--------|------|
| EDIT | `supabase/functions/angel-ai-proxy/index.ts` |

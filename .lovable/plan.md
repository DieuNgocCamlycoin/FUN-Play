

# Kế Hoạch Sửa Lỗi Chớp Nháy + Thêm Text Wrapping cho Thumbnail Editor

## Phân Tích Nguyên Nhân

### Vấn đề 1: Màn hình chớp nháy trắng liên tục

| Bước | Hiện tại | Gây ra |
|------|----------|--------|
| 1 | User gõ text hoặc kéo text → state thay đổi | OK |
| 2 | `useEffect` gọi `drawCanvas()` | OK |
| 3 | `ctx.clearRect()` - xóa toàn bộ canvas → **trắng** | **FLASH TRẮNG** |
| 4 | `new Image()` + `img.onload` - load ảnh async | Mất 10-50ms |
| 5 | Vẽ ảnh + text lên canvas | OK |

**Vấn đề:** Khoảng thời gian từ bước 3 đến bước 5 là async, gây ra flash trắng liên tục khi user gõ hoặc kéo text.

### Vấn đề 2: Text không xuống dòng

- `ctx.fillText(text, x, y)` chỉ vẽ **1 dòng duy nhất**
- Không có tính năng tự động wrap text khi text quá dài
- Text bị tràn ra ngoài canvas nếu dài

---

## Giải Pháp

### Fix 1: Cache ảnh đã load + Double Buffering (Xóa flash trắng)

**Cách tiếp cận:**
1. **Cache ảnh đã load** vào `useRef` - không load lại mỗi lần vẽ
2. **Vẽ trực tiếp không clear** - chỉ clear khi thật sự cần thiết
3. **Sử dụng requestAnimationFrame** để throttle việc vẽ

```typescript
// Thêm ref để cache ảnh
const loadedImageRef = useRef<HTMLImageElement | null>(null);
const loadedImageSrcRef = useRef<string | null>(null);

// Trong drawCanvas:
const drawCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Nếu có ảnh và đã cache → vẽ ngay, không cần load lại
  if (baseImage && loadedImageRef.current && loadedImageSrcRef.current === baseImage) {
    const img = loadedImageRef.current;
    // Vẽ ngay không cần onload → không flash
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... draw image
    drawTextWithWrapping(ctx, canvas); // Vẽ text với wrapping
    return;
  }

  // Nếu ảnh mới → load và cache
  if (baseImage) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImageRef.current = img;
      loadedImageSrcRef.current = baseImage;
      // ... vẽ
    };
    img.src = baseImage;
  }
}, [baseImage, text, ...]);
```

### Fix 2: Text Wrapping - Tự động xuống dòng

**Implement `drawTextWithWrapping()` function:**

```typescript
const drawTextWithWrapping = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  if (!text.trim()) return;

  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.textBaseline = "top";

  // Tính toán max width (80% canvas width)
  const maxWidth = canvas.width * 0.8;
  
  // Chia text thành các dòng
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Tính vị trí Y bắt đầu (để center các dòng theo chiều dọc)
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  let y = (canvas.height * textPosition.y) - (totalHeight / 2);

  // Vẽ từng dòng
  for (const line of lines) {
    let x = canvas.width * textPosition.x;
    
    if (align === "left") {
      ctx.textAlign = "left";
      x = Math.max(60, x - 200);
    } else if (align === "right") {
      ctx.textAlign = "right";
      x = Math.min(canvas.width - 60, x + 200);
    } else {
      ctx.textAlign = "center";
    }

    // Stroke (outline)
    if (showStroke) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = fontSize / 8;
      ctx.lineJoin = "round";
      ctx.strokeText(line, x, y);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillText(line, x, y);

    y += lineHeight;
  }
};
```

---

## Chi Tiết Thay Đổi

### File: `src/components/Upload/ThumbnailCanvas.tsx`

**1. Thêm refs để cache ảnh (dòng 35-36):**
```typescript
const loadedImageRef = useRef<HTMLImageElement | null>(null);
const loadedImageSrcRef = useRef<string | null>(null);
```

**2. Thêm function `wrapText()` (dòng 89-120) - thay thế `drawText()`:**
- Tính `maxWidth = canvas.width * 0.8` (80% chiều rộng)
- Chia text thành words
- Duyệt từng word và kiểm tra `measureText().width`
- Nếu vượt maxWidth → xuống dòng mới
- Tính `lineHeight = fontSize * 1.3`
- Vẽ từng dòng với offset Y tăng dần

**3. Sửa `drawCanvas()` (dòng 47-87):**
- Kiểm tra nếu ảnh đã cache → dùng ảnh cache, không load lại
- Chỉ `clearRect` ngay trước khi vẽ ảnh (không có khoảng trống async)
- Gọi `wrapText()` thay vì `drawText()`

**4. Thêm logic reset cache khi `baseImage` thay đổi (dòng 123-128):**
```typescript
useEffect(() => {
  if (baseImage !== loadedImageSrcRef.current) {
    loadedImageRef.current = null;
    loadedImageSrcRef.current = null;
  }
}, [baseImage]);
```

**5. Sử dụng `requestAnimationFrame` để throttle vẽ khi drag (dòng 134-145):**
```typescript
const rafRef = useRef<number | null>(null);

const handlePointerMove = useCallback((e: React.PointerEvent) => {
  if (!isDragging || !containerRef.current) return;
  
  const rect = containerRef.current.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  
  // Throttle với requestAnimationFrame
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(() => {
    setTextPosition({ x, y });
  });
}, [isDragging]);
```

---

## Cải Tiến UX Bổ Sung

### Hiển thị số dòng và chiều dài text
```tsx
<p className="text-xs text-muted-foreground mt-1">
  {text.length}/50 ký tự • {Math.ceil(text.length / 15)} dòng (ước tính)
</p>
```

### Thêm option Max Width cho text
```tsx
<div className="space-y-2">
  <Label>Độ rộng tối đa: {maxWidthPercent}%</Label>
  <Slider
    value={[maxWidthPercent]}
    onValueChange={([v]) => setMaxWidthPercent(v)}
    min={50}
    max={95}
    step={5}
    className="py-2"
  />
</div>
```

---

## Tóm Tắt Files Cần Sửa

| File | Thay đổi | Mục đích |
|------|----------|----------|
| `src/components/Upload/ThumbnailCanvas.tsx` | Cache ảnh + wrapText() + requestAnimationFrame | Xóa flash trắng + Text wrapping |

---

## Kết Quả Mong Đợi

Sau khi hoàn thành:

| Vấn đề | Trước | Sau |
|--------|-------|-----|
| Chớp nháy khi gõ text | Flash trắng liên tục | Mượt mà, không flash |
| Chớp nháy khi kéo text | Flash trắng liên tục | Mượt mà với requestAnimationFrame |
| Text dài bị tràn | Tràn ra ngoài canvas | Tự động xuống dòng |
| Tiêu đề nổi bật | Chữ nhỏ, 1 dòng | Chữ to, nhiều dòng, dễ đọc |

---

## Thứ Tự Triển Khai

1. Thêm refs cache ảnh + logic kiểm tra cache
2. Implement `wrapText()` function
3. Sửa `drawCanvas()` để dùng cache và wrapText
4. Thêm `requestAnimationFrame` throttling cho drag
5. Test trên mobile: Gõ text + kéo di chuyển + xuống dòng tự động


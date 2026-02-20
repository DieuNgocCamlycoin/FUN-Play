

## Toi uu cuoi cung ShareModal: Xoa CAMLY, ScrollArea, Grid layout, Error handling

### 1. Xoa hoan toan he thong CAMLY du thua

**Van de:** Ham `awardShare()` (dong 149-173) goi `supabase.functions.invoke('award-camly')` moi lan chia se - tao request backend vo ich neu khong con can thuong CAMLY tai day.

**Thay doi:**
- Xoa ham `awardShare` (dong 149-173)
- Xoa state `hasShared` (dong 85) - chi phuc vu `awardShare`
- Xoa 3 lan goi `awardShare()` tai dong 185, 207, 221
- Xoa block "+2 CAMLY khi chia se..." (dong 509-512)
- Xoa emoji khoi cac toast message

### 2. Sua `handleNativeShare` - Fallback copy tham lang

**Truoc (dong 199-218):** Khi `navigator.share()` bi chan (iframe), loi bi log ra console va khong co gi xay ra.

**Sau:**
```tsx
const handleNativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Xem ${getContentTypeLabel()} "${title}" tren FUN Play`,
        url: shareUrl,
      });
      toast({
        title: "Chia se thanh cong!",
        description: "Cam on ban da chia se",
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // Fallback: copy link tham lang
      const success = await copyToClipboard(shareUrl);
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast({
          title: "Da sao chep lien ket de chia se",
        });
      }
    }
  }
};
```

### 3. Layout thong minh voi ScrollArea + Grid

**Thay doi DialogContent:**
- Them `max-h-[80vh]` de modal khong tran man hinh nho
- Boc noi dung trong `ScrollArea` (da co san tai `@/components/ui/scroll-area`) de thanh cuon muot ma

**Thay doi danh sach nut social:**
- Chuyen tu `flex overflow-x-auto` (cuon ngang, kho thao tac mobile) sang `grid grid-cols-4 sm:grid-cols-5 gap-3 justify-items-center`
- 4 cot tren mobile, 5 cot tren desktop - tu dong co gian
- Bo `overflow-x-auto`, `scrollbar-hide`, `pb-2`

**Them `pb-6`** cho container cuoi cung de noi dung khong dinh mep duoi tren dien thoai.

### 4. Giam space-y

- `space-y-6` -> `space-y-4` de tiet kiem khong gian doc

### 5. Don dep imports

- Xoa `Smartphone` khoi lucide-react (van giu vi nut native share van dung)
- Kiem tra khong con import thua nao

### Tom tat thay doi

| Hang muc | Chi tiet |
|----------|---------|
| File | `src/components/Video/ShareModal.tsx` |
| Xoa | `awardShare()`, `hasShared` state, "+2 CAMLY" block, 3 loi goi awardShare |
| Sua | `handleNativeShare` fallback copy tham lang |
| Layout | `ScrollArea` + `grid-cols-4 sm:grid-cols-5` + `max-h-[80vh]` + `pb-6` |
| Spacing | `space-y-6` -> `space-y-4` |


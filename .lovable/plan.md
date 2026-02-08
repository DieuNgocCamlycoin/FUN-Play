

# Fix: Nút "Connecting" Nhấp Nháy Liên Tục trên Trang FUN Money

## Nguyên nhân gốc

Console log cho thấy kênh Realtime đang bị tạo-hủy liên tục trong vòng lặp vô hạn:
```text
SUBSCRIBED -> CLOSED -> SUBSCRIBED -> CLOSED -> ...
```

Nguyên nhân kỹ thuật:
- Trong `FunMoneyPage.tsx`, callback `onUpdate` truyền vào hook `useMintRequestRealtime` là một **inline arrow function**, tạo reference mới mỗi lần render.
- Trong hook `useMintRequestRealtime.ts`, `handleUpdate` phụ thuộc vào `onUpdate` qua `useCallback`.
- `useEffect` (dòng 148) có `handleUpdate` trong dependency array, nên mỗi khi `handleUpdate` thay đổi reference, effect chạy lại, **hủy kênh cũ** (CLOSED) rồi **tạo kênh mới** (SUBSCRIBED), rồi lại render, lại hủy...

```text
render -> onUpdate moi -> handleUpdate moi -> useEffect chay lai
  -> huy kenh cu (CLOSED) -> tao kenh moi -> SUBSCRIBED
  -> connectionStatus thay doi -> render lai -> lap lai...
```

## Giai phap

Su dung **ref pattern** de luu tru callback `onUpdate`, tranh viec thay doi callback gay re-run useEffect.

## Chi tiet ky thuat

### File 1: `src/hooks/useMintRequestRealtime.ts`

**Thay doi:** Dung `useRef` de luu tru `onUpdate` callback thay vi dua vao dependency cua `useCallback`/`useEffect`.

- Them mot `onUpdateRef = useRef(onUpdate)` va cap nhat ref moi render
- `handleUpdate` se goi `onUpdateRef.current()` thay vi `onUpdate` truc tiep, va khong can dependency
- Xoa `handleUpdate` va `handleStatusChange` khoi dependency array cua `useEffect`, thay bang ref pattern

Cu the:

```text
// Truoc (gay vong lap):
const handleUpdate = useCallback(() => {
  ...onUpdate()...
}, [onUpdate]);  // <-- thay doi moi render

useEffect(() => {
  ...
}, [userId, enabled, handleUpdate, handleStatusChange]);
// handleUpdate thay doi -> effect re-run -> kenh bi huy/tao lai

// Sau (on dinh):
const onUpdateRef = useRef(onUpdate);
onUpdateRef.current = onUpdate;  // cap nhat moi render nhung khong gay re-render

const handleUpdate = useCallback(() => {
  ...onUpdateRef.current()...
}, []);  // khong dependency -> khong thay doi

useEffect(() => {
  ...
}, [userId, enabled]);  // chi re-run khi userId hoac enabled thay doi
```

Tuong tu cho `handleStatusChange` - chuyen sang dung ref hoac xoa khoi dependency array (vi no da khong co external dependency nao thay doi).

### File 2: `src/pages/FunMoneyPage.tsx`

**Thay doi nho (optional nhung tot):** Boc callback `onUpdate` trong `useCallback` de dam bao an toan:

```text
const handleRealtimeUpdate = useCallback(() => {
  fetchRequests();
  refetchActivity();
}, [fetchRequests, refetchActivity]);
```

Roi truyen `onUpdate: handleRealtimeUpdate` thay vi inline function.

## Tong ket

| File | Hanh dong | Muc do thay doi |
|------|-----------|-----------------|
| `src/hooks/useMintRequestRealtime.ts` | Sua - Dung ref pattern cho callbacks | Nho (10-15 dong) |
| `src/pages/FunMoneyPage.tsx` | Sua - Boc callback trong useCallback | Rat nho (3-5 dong) |

## Ket qua mong doi

- Kenh Realtime chi tao **1 lan** khi component mount (hoac khi userId thay doi)
- Nut "Connecting" se chuyen sang "Live" (xanh la) va **giu nguyen** thay vi nhap nhay
- Khong con vong lap SUBSCRIBED/CLOSED trong console


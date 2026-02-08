

# Chuyen Angel AI Logo Thanh Link Ngoai - Bo Hop Chat

## Tong Quan

Khi bam vao logo Angel AI (tren desktop va mobile), thay vi mo hop chat, se chuyen huong den trang web `https://angel.fun.rich` trong tab moi. Dong thoi bo component AngelChat khoi Header va MobileHeader.

## Chi Tiet Thay Doi

### 1. Header Desktop (`src/components/Layout/Header.tsx`)

- **Doi `onClick`**: Tu `() => setAngelChatOpen(true)` thanh `() => window.open("https://angel.fun.rich", "_blank")`
- **Bo state**: Xoa `angelChatOpen` state va `setAngelChatOpen`
- **Bo import**: Xoa import `AngelChat` tu `@/components/Mascot/AngelChat`
- **Bo component**: Xoa dong `<AngelChat isOpen={angelChatOpen} onClose={() => setAngelChatOpen(false)} />`
- **Cap nhat tooltip**: Tu "Chat voi ANGEL AI" thanh "ANGEL AI" (vi khong con la chat nua)

### 2. Header Mobile (`src/components/Layout/MobileHeader.tsx`)

- **Doi `onClick`**: Tu `() => setAngelChatOpen(true)` thanh `() => window.open("https://angel.fun.rich", "_blank")`
- **Bo state**: Xoa `angelChatOpen` state va `setAngelChatOpen`
- **Bo import**: Xoa import `AngelChat` tu `@/components/Mascot/AngelChat`
- **Bo component**: Xoa dong `<AngelChat isOpen={angelChatOpen} onClose={...} />`

### 3. Khong Can Xoa File

Cac file AngelChat, AngelMascot, MobileAngelMascot van giu lai trong codebase vi chung co the duoc su dung trong tuong lai. Chi bo chung ra khoi Header va MobileHeader.

## Tong Ket

| File | Thay doi |
|------|----------|
| `src/components/Layout/Header.tsx` | Doi onClick thanh link ngoai, bo AngelChat import/state/component |
| `src/components/Layout/MobileHeader.tsx` | Doi onClick thanh link ngoai, bo AngelChat import/state/component |

Tong cong: 2 file can sua, 0 file moi, 0 thay doi database.

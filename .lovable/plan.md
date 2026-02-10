

# Nang cap Modal "Thuong & Tang" + Popup Chuc Mung Thanh Cong

---

## I. HIEN TRANG

Hien tai he thong Thuong & Tang gom 3 file chinh:
- `EnhancedDonateModal.tsx` (566 dong): Form nhap thong tin co ban (nguoi nhan, token, so tien, loi nhan)
- `DonationSuccessOverlay.tsx` (344 dong): Popup thanh cong voi confetti va thong tin giao dich
- `DonationCelebration.tsx` (176 dong): Popup nhan thuong cho nguoi nhan (Rich rich rich audio)

**Thieu:**
- Khong co buoc Review/Xac nhan truoc khi gui
- Khong co chu de tang thuong (theme)
- Khong co chon nhac
- Khong co wallet address hien thi + COPY
- Popup thanh cong thieu thong tin day du nhu lich su he thong
- Khong tu dong post GIF len profile
- Tieu de popup chi la "Tang Thanh Cong" thay vi "CHUC MUNG TANG THUONG THANH CONG"

---

## II. KE HOACH THAY DOI

### PHASE 1: Bo sung database (metadata ho tro theme/nhac)

Khong can them cot moi. Bang `donation_transactions` da co cot `metadata` (jsonb). Se luu them:
```json
{
  "theme": "birthday",
  "music": "rich-celebration",
  "celebration_gif_url": "..."
}
```

Cap nhat Edge Function `create-donation` de nhan va luu them `theme` va `music` vao metadata.

### PHASE 2: Nang cap EnhancedDonateModal.tsx

Chuyen tu 1 buoc -> 3 buoc (multi-step wizard):

**Buoc 1 - Nhap thong tin:**
- Nguoi gui: Avatar + Ten + @username + Wallet (rut gon + COPY)
- Nguoi nhan: Giu nguyen UI tim kiem hien tai, them hien thi wallet + COPY
- Token & So tien: Giu nguyen (preset + slider + custom input)
- CHU DE TANG THUONG (MOI): 7 nut chon emoji theme (Chuc mung, Ket hon, Sinh nhat, Tri an, Tinh yeu, Gia dinh, Cha me)
- CHON NHAC (MOI, optional): Radio group 3 file nhac + mac dinh Rich Rich Rich
- Loi nhan: Giu nguyen textarea + emoji picker

**Buoc 2 - Xac nhan (REVIEW):**
- Hien thi toan bo thong tin da nhap theo dang card:
  - Nguoi gui (avatar + ten + wallet + copy)
  - Nguoi nhan (avatar + ten + wallet + copy)
  - So tien + Token
  - Chu de
  - Loi nhan
  - Nhac
  - Chain (BSC / Internal)
  - Canh bao: "Giao dich blockchain khong the hoan tac"
- 2 nut: "Quay lai chinh sua" va "Xac nhan & Tang thuong"

**Buoc 3 - Ket qua thanh cong:**
- Chuyen sang DonationSuccessOverlay (da nang cap)

### PHASE 3: Nang cap DonationSuccessOverlay.tsx

Thay doi chinh:

1. **Tieu de**: "CHUC MUNG TANG THUONG THANH CONG" voi emoji phao hoa
2. **Hieu ung**: Giu confetti + them phat nhac da chon (Rich Rich Rich mac dinh)
3. **GIF chuc mung**: Hien thi GIF celebration tu Giphy theo theme (da co CELEBRATION_GIFS array, mo rong them GIF theo tung chu de)
4. **Bang thong tin giao dich day du**:
   - Avatar + ten nguoi gui (link profile) + wallet rut gon + COPY
   - Arrow animation
   - Avatar + ten nguoi nhan (link profile) + wallet rut gon + COPY
   - So luong + Token + Icon
   - Chu de tang thuong (emoji + ten)
   - Loi nhan
   - Thoi gian
   - Chain (BSC / Internal)
   - TX hash (rut gon + COPY + link explorer)
   - Ma bien nhan
5. **Nut hanh dong**:
   - Luu GIF (download celebration image)
   - Sao chep link
   - Chia se len Profile (da co, giu nguyen logic)
   - Dong

### PHASE 4: Cap nhat Edge Function create-donation

Them nhan `theme` va `music` trong request body va luu vao metadata:
```typescript
metadata: {
  theme: body.theme || "celebration",
  music: body.music || "rich-celebration",
  ...existing metadata
}
```

### PHASE 5: Tu dong lan toa

Logic tu dong post len profile DA CO trong DonationSuccessOverlay (handleShareToProfile). Se cap nhat:
- Tu dong goi `handleShareToProfile` sau khi thanh cong (thay vi doi user bam)
- Them chu de vao noi dung post
- Tin nhan he thong DA CO trong create-donation edge function (dong 234-267), giu nguyen

---

## III. CHI TIET FILE THAY DOI

| # | File | Loai | Mo ta |
|---|------|------|-------|
| 1 | `supabase/functions/create-donation/index.ts` | Cap nhat | Them nhan theme/music luu metadata |
| 2 | `src/components/Donate/EnhancedDonateModal.tsx` | Cap nhat lon | Multi-step wizard (3 buoc), them theme picker, music selector, review step |
| 3 | `src/components/Donate/DonationSuccessOverlay.tsx` | Cap nhat lon | Tieu de moi, bang thong tin day du, wallet display + COPY, theme-based GIF, nhac, nut luu GIF |
| 4 | `src/hooks/useDonation.ts` | Cap nhat nho | Them theme/music vao CreateDonationParams va truyen vao edge function |

---

## IV. THEME & GIF MAPPING

| Emoji | Chu de | GIF category |
|-------|--------|-------------|
| 🎉 | Chuc mung | Celebration/Party |
| 💍 | Ket hon | Wedding |
| 🎂 | Sinh nhat | Birthday |
| 🙏 | Tri an | Thank you/Gratitude |
| ❤️ | Tinh yeu | Love/Hearts |
| 👨‍👩‍👧‍👦 | Gia dinh | Family |
| 🌱 | Cha me | Parents/Growth |

Moi theme co 3-5 GIF tu Giphy, random khi hien thi.

---

## V. NHAC OPTIONS

| ID | Ten | File |
|----|-----|------|
| rich-celebration | Rich! Rich! Rich! (mac dinh) | /audio/rich-celebration.mp3 |
| celebrate-synth | Web Audio celebrate | Generated via useSoundEffects |
| coin-shower | Coin Shower | Generated via useSoundEffects |

---

## VI. LUU Y QUAN TRONG

1. Metadata luu offchain (jsonb trong donation_transactions), lien ket tx_hash
2. GIF lay tu Giphy CDN, khong luu vao database
3. Khong autoplay GIF vo han - chi play 1 lan khi popup mo
4. Fallback khi user tat am thanh: skip audio, van hien thi visual effects
5. Noi dung popup, lich su he thong, lich su ca nhan, tin nhan: TRUNG KHOP 100% vi deu doc tu cung 1 record donation_transactions
6. Chi ap dung cho giao dich THANH CONG (status = success)


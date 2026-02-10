
# Sap xep lai bo cuc CelebrationCard — tieu de trang, nut nho gon, khong bi che

---

## Thay doi chinh

### Bo cuc moi cho phan TOP cua card

Hien tai: Nut Loa/X nam `absolute top-2 right-2` che len tieu de holographic. Tieu de nam giua card voi `pt-6`.

**Thiet ke moi:**
- **Dong 1 (top bar):** Flex row — ben trai: nut Loa + X (kich thuoc `h-6 w-6`, icon `h-3 w-3`). Ben phai: nut Download + Share (kich thuoc `h-6 w-6`). Tat ca nam tren 1 hang ngang, sat vien tren.
- **Dong 2:** Tieu de "CHUC MUNG" va "TANG THUONG THANH CONG" — **mau trang** (`text-white`), font dam, drop-shadow manh de noi bat tren nen. Khong dung gradient holographic nua theo yeu cau.
- Xoa block nut Save/Share o cuoi card (da doi len top bar).
- Noi dung con lai (avatars, details) dan trai deu trong khong gian con lai.

### Chi tiet ky thuat

**File 1: `src/components/Profile/DonationCelebrationCard.tsx`**

1. **Xoa** block `absolute top-2 right-2` (dong 240-279) — nut Loa/X rieng biet
2. **Xoa** block BOTTOM Save/Share (dong 403-443)
3. **Thay doi** phan TOP (dong 281-305): Them top bar row chua 4 nut nho (Loa, X, Download, Share) va tieu de 2 dong mau trang
4. **Dieu chinh** padding: `px-4 pt-3 pb-3` de toi uu khong gian
5. Tieu de: `text-white font-extrabold tracking-widest text-base` voi `drop-shadow(0 0 10px rgba(0,0,0,0.8))` va `text-shadow` de doc ro tren moi nen

**File 2: `src/pages/PreviewCelebration.tsx`**

1. Dong bo MockDonationCelebrationCard (dong 104-200): cung bo cuc top bar + tieu de trang
2. Dong bo MockChatDonationCard (dong 217-310): tuong tu, nut nho hon (`h-5 w-5`)

---

## Bo cuc card sau khi chinh

```text
+------------------------------------------+
| [Loa][X]    CHUC MUNG      [Save][Share] |
|          TANG THUONG THANH CONG          |
|                                          |
|  [Avatar]   1,000 ->    [Avatar]         |
|  Sender      CAMLY       Receiver        |
|  @user1                  @user2          |
|  0x1234...               0xabcd...       |
|                                          |
|  Trang thai        Thanh cong            |
|  Loi nhan    "Chuc mung..."              |
|  Thoi gian   05:19 11/02/2026            |
|  Chain       BSC                         |
|  TX Hash     0xabc123de...               |
|  Ma bien nhan  #preview-demo-001         |
+------------------------------------------+
```

---

## Tom tat

| # | File | Thay doi |
|---|------|----------|
| 1 | `DonationCelebrationCard.tsx` | Top bar (Loa, X, Download, Share) + tieu de trang 2 dong, xoa block bottom |
| 2 | `PreviewCelebration.tsx` | Dong bo bo cuc moi cho MockDonationCard va MockChatCard |

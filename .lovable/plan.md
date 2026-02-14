

# Fix: Claim Modal - Incorrect Reward Type Labels + Hidden Breakdown Items

## Problems

### 1. Reward Type Labels Not Matching (Case Mismatch)
The `REWARD_TYPE_LABELS` dictionary in `ClaimRewardsModal.tsx` uses **lowercase** keys (`view`, `like`, `comment`), but the database stores reward types in **UPPERCASE** (`VIEW`, `LIKE`, `COMMENT`, `FIRST_UPLOAD`, `LONG_VIDEO_UPLOAD`, `SHORT_VIDEO_UPLOAD`).

This causes:
- Labels showing raw database names like "LONG_VIDEO_UPLOAD" instead of "Upload video dai"
- Missing Vietnamese translations for several types (`FIRST_UPLOAD`, `SHORT_VIDEO_UPLOAD`, `LONG_VIDEO_UPLOAD`, `BOUNTY`, `WALLET_CONNECT`)

### 2. Breakdown List Too Short on Mobile
The ScrollArea for approved rewards uses `max-h-28` (112px), which only fits ~3 items. Users with 6+ reward types cannot see all their rewards without scrolling, and on mobile scrolling inside a modal scroll area is not obvious.

### 3. Missing Reward Types in Label Map
Several reward types stored in the database are completely absent from the label dictionary: `FIRST_UPLOAD`, `SHORT_VIDEO_UPLOAD`, `LONG_VIDEO_UPLOAD`, `BOUNTY`.

---

## Changes

### File: `src/components/Rewards/ClaimRewardsModal.tsx`

1. **Update `REWARD_TYPE_LABELS`** to use UPPERCASE keys matching the database, and add all missing types:

```
REWARD_TYPE_LABELS = {
  VIEW: "Xem video",
  LIKE: "Thich video",
  COMMENT: "Binh luan",
  SHARE: "Chia se",
  UPLOAD: "Upload video",
  FIRST_UPLOAD: "Upload dau tien",
  SHORT_VIDEO_UPLOAD: "Upload video ngan",
  LONG_VIDEO_UPLOAD: "Upload video dai",
  SIGNUP: "Dang ky",
  WALLET_CONNECT: "Ket noi vi",
  BOUNTY: "Bounty",
}
```

2. **Increase ScrollArea height** from `max-h-28` to `max-h-48` for both approved and pending breakdown lists so all items are visible without scrolling.

---

## Summary

| File | Change |
|------|--------|
| `src/components/Rewards/ClaimRewardsModal.tsx` | Fix REWARD_TYPE_LABELS to UPPERCASE keys, add missing types, increase breakdown scroll height |


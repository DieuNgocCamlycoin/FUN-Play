

# Sửa lỗi thưởng Upload CAMLY bị mất + Đồng bộ Realtime

## Nguyên nhân gốc rễ

### 1. UploadContext gọi edge function trực tiếp, không qua useAutoReward
- Mobile upload gọi `supabase.functions.invoke("award-camly")` trực tiếp
- KHÔNG dispatch sự kiện `camly-reward` trên window
- Trang RewardHistory chỉ cập nhật qua Realtime DB (chậm hơn), không nhận event tức thì

### 2. Thưởng gấp đôi vẫn xảy ra (user 353a2784)
- FIRST_UPLOAD (500K) lúc 09:47:32 VÀ SHORT_VIDEO_UPLOAD (20K) lúc 09:47:35
- Biến `rewardAwarded` không ngăn được vì `supabase.functions.invoke` trả về `{ data, error }` nhưng code check `firstResult?.success` - nếu `data` wrapper khác cấu trúc, rewardAwarded vẫn false

### 3. Thưởng upload thất bại hoàn toàn (user d06c21f9)
- Video "8 Câu Thần Chú Của Cha" tạo thành công nhưng KHÔNG có reward nào
- Lỗi bị nuốt bởi try/catch chỉ log `console.error`

## Kế hoạch sửa lỗi

### A. Sửa UploadContext.tsx - Thêm event dispatch + sửa double reward
**File: `src/contexts/UploadContext.tsx`**

1. Sau khi gọi `award-camly` thành công, dispatch `camly-reward` event:
```typescript
window.dispatchEvent(new CustomEvent("camly-reward", { 
  detail: { type: uploadType, amount: result.amount, autoApproved: true } 
}));
```

2. Sửa logic kiểm tra double reward - kiểm tra response đúng cách:
```typescript
const { data: firstResult, error: firstError } = await supabase.functions.invoke("award-camly", ...);
if (!firstError && firstResult?.success) {
  rewardAwarded = true;
}
```

3. Thêm logging chi tiết để debug khi thưởng thất bại:
```typescript
console.log("[Upload Reward] Attempting FIRST_UPLOAD for video:", videoData.id);
console.log("[Upload Reward] Result:", JSON.stringify(firstResult), "Error:", firstError);
```

### B. Sửa Upload.tsx (Desktop) - Cùng logic
**File: `src/pages/Upload.tsx`**

1. Bọc phần thưởng trong try/catch riêng (đã có nhưng cần thêm logging)
2. Dispatch `camly-reward` event sau khi thưởng thành công
3. Thêm logging chi tiết

### C. Đảm bảo RewardHistory nhận event từ cả mobile lẫn desktop
- Đã có listener `camly-reward` từ bản trước
- Sau khi sửa A + B, event sẽ được dispatch đúng -> RewardHistory cập nhật tức thì

## Tóm tắt

| Lỗi | File | Sửa |
|-----|------|-----|
| Không dispatch camly-reward event | UploadContext.tsx | Thêm dispatchEvent sau reward thành công |
| Double reward FIRST_UPLOAD | UploadContext.tsx | Check cả error lẫn data.success |
| Thưởng thất bại im lặng | UploadContext.tsx, Upload.tsx | Thêm logging chi tiết |
| Desktop không dispatch event | Upload.tsx | Thêm dispatchEvent |

## File cần sửa
1. `src/contexts/UploadContext.tsx`
2. `src/pages/Upload.tsx`

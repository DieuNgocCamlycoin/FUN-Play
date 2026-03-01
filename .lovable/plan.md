

## Căn giữa avatar theo viewport (1 lệnh duy nhất)

### Nguyên nhân gốc
`left-1/2` tính 50% theo **container cha** (phần tử `relative` gần nhất), không phải theo màn hình. Dù container đã có `w-full`, các yếu tố layout phía trên có thể khiến nó không thực sự chiếm đúng 100% viewport.

### Giải pháp
Sửa **duy nhất 1 class** tại dòng 63 của `src/components/Profile/ProfileHeader.tsx`:

- Thay `left-1/2` thành `left-[50vw]` (chỉ trên mobile)
- `50vw` = 50% **viewport width**, luôn đúng tâm màn hình bất kể container cha có padding hay max-width gì

**Thay đổi cụ thể (dòng 63):**

```text
Từ:  left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0
Thành: left-[50vw] -translate-x-1/2 md:left-auto md:translate-x-0
```

Chỉ 1 thay đổi duy nhất, avatar sẽ luôn nằm chính giữa màn hình điện thoại, trùng tâm ảnh bìa (vì ảnh bìa cũng full-width).


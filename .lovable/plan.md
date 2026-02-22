

## Ghim thanh danh mục (CategoryChips) cố định ở đầu Trang Chủ

### Vấn đề
CategoryChips hiện dùng `sticky`, nhưng có thể bị ảnh hưởng bởi cấu trúc scroll container bên trong. Cần đảm bảo thanh danh mục luôn cố định ở đầu khu vực nội dung, không bị cuộn theo.

### Giải pháp
Di chuyển `CategoryChips` ra ngoài container cuộn (`overflow-y-auto`) trên mobile, và đảm bảo nó luôn nằm cố định phía trên nội dung cuộn trên cả desktop lẫn mobile.

### File thay đổi

| File | Thay đổi |
|---|---|
| `src/pages/Index.tsx` | Di chuyển `<CategoryChips>` ra ngoài div có `overflow-y-auto` (dòng 361), đặt ngay trước div đó. Div cuộn sẽ chỉ chứa nội dung video phía dưới. |
| `src/components/Layout/CategoryChips.tsx` | Tăng z-index lên `z-20` để đảm bảo luôn hiển thị trên các thành phần khác |

### Chi tiết kỹ thuật

Trong `Index.tsx`, cấu trúc hiện tại:
```text
<main>
  <div class="overflow-y-auto"> <-- container cuộn
    <CategoryChips />            <-- bị cuộn theo trên mobile
    <MobileCards />
    <Videos />
  </div>
</main>
```

Sẽ đổi thành:
```text
<main>
  <CategoryChips />              <-- nằm ngoài, cố định ở trên
  <div class="overflow-y-auto"> <-- chỉ cuộn nội dung bên dưới
    <MobileCards />
    <Videos />
  </div>
</main>
```

Trên mobile, div cuộn cần giảm chiều cao để trừ thêm phần CategoryChips (~44px).


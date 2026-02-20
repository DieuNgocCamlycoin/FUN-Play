

## Auto-refresh Spam Filter tab khi Admin chuyen tab

### Ket qua kiem tra End-to-End

He thong bao cao video **DA HOAT DONG HOAN CHINH**:
- User bao cao -> Dialog 4 ly do -> Gui thanh cong -> Toast "Cam on ban da dong gop anh sang cho cong dong"
- Database ghi nhan report voi `status: pending`
- Trigger tang `report_count` tu dong
- Admin Spam Filter hien thi 2 video bi bao cao voi badge do "1 bao cao"

### Thay doi: Auto-refresh khi Admin chuyen sang tab Spam Filter

Hien tai, `SpamFilterContent` chi fetch data 1 lan khi mount. Khi admin chuyen qua tab khac roi quay lai, data khong duoc cap nhat.

**Giai phap**: Truyen trang thai tab hien tai (`activeTab`) vao `SpamFilterContent`. Khi tab chuyen sang "spam", tu dong goi lai `fetchSpamVideos()` va `fetchReportedCount()`.

### Chi tiet ky thuat

**File thay doi:** `src/components/Admin/tabs/VideosManagementTab.tsx`

1. **Them state `activeTab`** trong `VideosManagementTab`:
   - Chuyen tu `<Tabs defaultValue="approval">` sang controlled mode voi `value` va `onValueChange`
   
2. **Truyen prop `isActive` vao `SpamFilterContent`**:
   - Khi `activeTab === "spam"`, truyen `isActive={true}`

3. **Auto-refresh trong `SpamFilterContent`**:
   - Them `useEffect` theo doi `isActive`
   - Khi `isActive` chuyen tu `false` sang `true`, goi `fetchSpamVideos()` va `onReportCountChange?.()`

4. **Dong thoi refresh badge count**:
   - Goi `fetchReportedCount()` moi khi admin chuyen sang tab Spam Filter

```typescript
// VideosManagementTab - controlled tabs
const [activeTab, setActiveTab] = useState("approval");

<Tabs value={activeTab} onValueChange={setActiveTab}>
  ...
  <TabsContent value="spam">
    <SpamFilterContent 
      onReportCountChange={fetchReportedCount} 
      isActive={activeTab === "spam"} 
    />
  </TabsContent>
</Tabs>

// SpamFilterContent - auto refresh
function SpamFilterContent({ onReportCountChange, isActive }: { ... isActive?: boolean }) {
  useEffect(() => {
    if (isActive) {
      fetchSpamVideos();
      onReportCountChange?.();
    }
  }, [isActive]);
}
```

Day la thay doi nho, chi anh huong den 1 file, khong thay doi logic nghiep vu.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Radio } from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "Chung" },
  { value: "music", label: "Âm nhạc" },
  { value: "light_meditation", label: "Thiền định" },
  { value: "sound_therapy", label: "Âm thanh trị liệu" },
  { value: "mantra", label: "Mantra" },
  { value: "talk", label: "Trò chuyện" },
];

interface GoLiveFormProps {
  onSubmit: (data: { title: string; description?: string; category?: string }) => void;
  isLoading?: boolean;
}

export const GoLiveForm = ({ onSubmit, isLoading }: GoLiveFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() || undefined, category });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Tiêu đề livestream *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề cho buổi phát sóng..."
          maxLength={100}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về nội dung..."
          rows={3}
          maxLength={500}
        />
      </div>

      <div>
        <Label>Danh mục</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!title.trim() || isLoading} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
        <Radio className="h-4 w-4 mr-2" />
        {isLoading ? "Đang chuẩn bị..." : "Bắt đầu phát sóng"}
      </Button>
    </form>
  );
};

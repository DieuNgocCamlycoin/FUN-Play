import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Upload } from "lucide-react";
import type { ContributionType } from "@/hooks/useBountySubmissions";

const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: "idea", label: "💡 Ý tưởng" },
  { value: "bug", label: "🐛 Báo lỗi" },
  { value: "feedback", label: "💬 Phản hồi" },
  { value: "feature", label: "✨ Đề xuất tính năng" },
];

interface BountySubmissionFormProps {
  onSubmit: (data: {
    name?: string;
    contactInfo?: string;
    contributionType: ContributionType;
    title: string;
    description: string;
    imageUrl?: string;
  }) => void;
  isSubmitting: boolean;
}

export function BountySubmissionForm({ onSubmit, isSubmitting }: BountySubmissionFormProps) {
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [contributionType, setContributionType] = useState<ContributionType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !contributionType) return;
    onSubmit({
      name: name || undefined,
      contactInfo: contactInfo || undefined,
      contributionType: contributionType as ContributionType,
      title,
      description,
      imageUrl: imageUrl || undefined,
    });
    setTitle("");
    setDescription("");
    setImageUrl("");
    setContributionType("");
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Gửi đóng góp của bạn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Tên của bạn (không bắt buộc)
          </label>
          <Input
            placeholder="Nhập tên của bạn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="bg-background border-border/60"
          />
        </div>

        {/* Contact info */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Email hoặc Địa chỉ ví <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="email@example.com hoặc 0x..."
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            maxLength={200}
            className="bg-background border-border/60"
          />
        </div>

        {/* Contribution Type - Dropdown */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Loại đóng góp <span className="text-destructive">*</span>
          </label>
          <Select
            value={contributionType}
            onValueChange={(val) => setContributionType(val as ContributionType)}
          >
            <SelectTrigger className="bg-background border-border/60">
              <SelectValue placeholder="Chọn loại đóng góp" />
            </SelectTrigger>
            <SelectContent>
              {CONTRIBUTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Tiêu đề <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Tiêu đề ngắn gọn cho đóng góp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="bg-background border-border/60"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Mô tả chi tiết <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Mô tả chi tiết ý tưởng, feedback hoặc bug của bạn..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="bg-background border-border/60 resize-none"
          />
        </div>

        {/* Image Upload Area */}
        <div className="space-y-1.5">
          <label className="text-sm text-foreground/80">
            Hình ảnh / Screenshot (không bắt buộc)
          </label>
          <div className="relative">
            <Input
              placeholder="Dán link ảnh screenshot..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-background border-border/60 hidden"
            />
            {imageUrl ? (
              <div className="relative rounded-lg border border-border/60 overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full max-h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-foreground/60 text-background rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-foreground/80"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 transition-colors cursor-pointer bg-muted/30">
                <Upload className="w-6 h-6 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">Click để upload (Max 5MB)</span>
                <input
                  type="text"
                  className="sr-only"
                  onFocus={() => {
                    const url = prompt("Dán link ảnh screenshot:");
                    if (url) setImageUrl(url);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Dán link ảnh screenshot:");
                    if (url) setImageUrl(url);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim() || !contributionType}
          className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 shadow-md border-0"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {isSubmitting ? "Đang gửi..." : "Gửi đóng góp & Nhận thưởng tiềm năng"}
        </Button>
      </CardContent>
    </Card>
  );
}

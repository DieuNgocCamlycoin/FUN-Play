import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Lightbulb, Bug, MessageSquare, Sparkles, ImagePlus } from "lucide-react";
import type { ContributionType } from "@/hooks/useBountySubmissions";

const CONTRIBUTION_TYPES: { value: ContributionType; label: string; icon: any; color: string }[] = [
  { value: "idea", label: "Ý tưởng", icon: Lightbulb, color: "text-yellow-500" },
  { value: "bug", label: "Báo lỗi", icon: Bug, color: "text-red-500" },
  { value: "feedback", label: "Phản hồi", icon: MessageSquare, color: "text-blue-500" },
  { value: "feature", label: "Tính năng", icon: Sparkles, color: "text-purple-500" },
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
  const [contributionType, setContributionType] = useState<ContributionType>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      name: name || undefined,
      contactInfo: contactInfo || undefined,
      contributionType,
      title,
      description,
      imageUrl: imageUrl || undefined,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setImageUrl("");
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="w-5 h-5 text-primary" />
          Gửi Đóng Góp Mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Tên hiển thị <span className="text-xs">(tuỳ chọn)</span>
          </label>
          <Input
            placeholder="Tên của bạn (để trống nếu muốn ẩn danh)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Contact info */}
        <div>
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Thông tin liên hệ <span className="text-xs">(tuỳ chọn)</span>
          </label>
          <Input
            placeholder="Email, Telegram, hoặc số điện thoại..."
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Contribution Type */}
        <div>
          <label className="text-sm font-medium mb-2 block text-muted-foreground">
            Loại đóng góp
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CONTRIBUTION_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = contributionType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContributionType(type.value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Tiêu đề <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="VD: Phát hiện lỗi khi upload video..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Mô tả chi tiết <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Mô tả chi tiết đóng góp của bạn... Càng chi tiết càng dễ được duyệt thưởng!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            <ImagePlus className="w-4 h-4 inline mr-1" />
            Link ảnh chụp màn hình <span className="text-xs">(tuỳ chọn)</span>
          </label>
          <Input
            placeholder="https://... (dán link ảnh screenshot)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 rounded-lg max-h-40 object-cover border border-border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
          size="lg"
        >
          {isSubmitting ? "Đang gửi..." : "🚀 Gửi Đóng Góp"}
        </Button>
      </CardContent>
    </Card>
  );
}

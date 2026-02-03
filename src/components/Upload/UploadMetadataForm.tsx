import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, X, CalendarIcon, Globe, Lock, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  visibility: "public" | "private" | "unlisted" | "scheduled";
  scheduledAt: Date | null;
}

interface UploadMetadataFormProps {
  metadata: VideoMetadata;
  onChange: (metadata: VideoMetadata) => void;
  onNext: () => void;
  onBack: () => void;
}

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Công khai", description: "Mọi người có thể xem", icon: Globe },
  { value: "unlisted", label: "Không công khai", description: "Chỉ ai có link mới xem được", icon: Eye },
  { value: "private", label: "Riêng tư", description: "Chỉ bạn xem được", icon: Lock },
  { value: "scheduled", label: "Lên lịch", description: "Đăng vào thời gian đã chọn", icon: Clock },
];

const SUGGESTED_TAGS = [
  "funplay", "camlycoin", "5d", "lighteconomy", "healing", "meditation",
  "music", "vlog", "tutorial", "review", "gaming", "lifestyle"
];

export function UploadMetadataForm({ metadata, onChange, onNext, onBack }: UploadMetadataFormProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase().replace(/^#/, "");
    if (trimmedTag && !metadata.tags.includes(trimmedTag) && metadata.tags.length < 15) {
      onChange({ ...metadata, tags: [...metadata.tags, trimmedTag] });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ ...metadata, tags: metadata.tags.filter(t => t !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const isValid = metadata.title.trim().length >= 3;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Tiêu đề <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="title"
            value={metadata.title}
            onChange={(e) => onChange({ ...metadata, title: e.target.value.slice(0, 100) })}
            placeholder="Nhập tiêu đề hấp dẫn cho video..."
            className="pr-16"
            maxLength={100}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {metadata.title.length}/100
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Mô tả
        </Label>
        <Textarea
          id="description"
          value={metadata.description}
          onChange={(e) => onChange({ ...metadata, description: e.target.value.slice(0, 5000) })}
          placeholder="Mô tả nội dung video, thêm link, hashtag, timestamp...&#10;&#10;Ví dụ:&#10;0:00 Giới thiệu&#10;1:30 Nội dung chính&#10;&#10;#funplay #camlycoin"
          className="min-h-[150px] resize-none"
          maxLength={5000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {metadata.description.length}/5000
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Thẻ (Tags)
        </Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {metadata.tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-2 py-1 gap-1 text-xs"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tag và nhấn Enter (tối đa 15 tags)"
          disabled={metadata.tags.length >= 15}
        />
        
        {/* Suggested Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-muted-foreground">Gợi ý:</span>
          {SUGGESTED_TAGS.filter(t => !metadata.tags.includes(t)).slice(0, 8).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddTag(tag)}
              className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Quyền riêng tư</Label>
        <RadioGroup
          value={metadata.visibility}
          onValueChange={(value) => onChange({ 
            ...metadata, 
            visibility: value as VideoMetadata["visibility"],
            scheduledAt: value === "scheduled" ? metadata.scheduledAt : null 
          })}
          className="grid grid-cols-2 gap-3"
        >
          {VISIBILITY_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:bg-muted/50",
                    metadata.visibility === option.value
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  )}
                >
                  <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-medium text-sm">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Schedule Date Picker */}
        {metadata.visibility === "scheduled" && (
          <div className="mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {metadata.scheduledAt ? (
                    format(metadata.scheduledAt, "PPP 'lúc' HH:mm", { locale: vi })
                  ) : (
                    "Chọn ngày đăng"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={metadata.scheduledAt || undefined}
                  onSelect={(date) => onChange({ ...metadata, scheduledAt: date || null })}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Tiếp tục
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

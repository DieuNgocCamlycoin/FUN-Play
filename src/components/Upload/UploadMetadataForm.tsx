import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, X, CalendarIcon, Globe, Lock, Eye, Clock, Sparkles, Hash, Pencil } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { validateVideoTitle, TITLE_PPLP_TEXT } from "@/lib/videoUploadValidation";

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
  { 
    value: "public", 
    label: "Công khai", 
    description: "Mọi người có thể xem", 
    icon: Globe,
    gradient: "from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-sapphire))]"
  },
  { 
    value: "unlisted", 
    label: "Không công khai", 
    description: "Chỉ ai có link mới xem được", 
    icon: Eye,
    gradient: "from-[hsl(var(--cosmic-gold))] to-[hsl(var(--cosmic-cyan))]"
  },
  { 
    value: "private", 
    label: "Riêng tư", 
    description: "Chỉ bạn xem được", 
    icon: Lock,
    gradient: "from-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-purple)/1)]"
  },
  { 
    value: "scheduled", 
    label: "Lên lịch", 
    description: "Đăng vào thời gian đã chọn", 
    icon: Clock,
    gradient: "from-[hsl(var(--divine-lavender))] to-[hsl(var(--cosmic-magenta))]"
  },
];

// Extended suggested tags for 5D/healing/meditation content
const SUGGESTED_TAGS = [
  // Core platform tags
  "funplay", "camlycoin", "5d", "lighteconomy", 
  // Healing & Wellness
  "healing", "meditation", "mindfulness", "wellness", "selfcare", "innerpeace",
  "spirituality", "chakra", "reiki", "energy", "holistic", "zenlife",
  // Music & Entertainment
  "music", "relaxing", "ambient", "nature", "asmr", "soundhealing",
  // Lifestyle & Content
  "vlog", "tutorial", "review", "gaming", "lifestyle", "motivation",
  "inspiration", "positivity", "gratitude", "manifestation",
  // Vietnamese specific
  "thiennhien", "suclang", "binhan", "yeuthuong", "hanphuc",
  "tamlinh", "yogatre", "suckhoe", "doisong", "giaitri",
  // Cosmic & Universe
  "universe", "cosmos", "stars", "galaxy", "aurora", "divine",
  "angelic", "lightworker", "ascension", "awakening"
];

export function UploadMetadataForm({ metadata, onChange, onNext, onBack }: UploadMetadataFormProps) {
  const [tagInput, setTagInput] = useState("");
  
  // Refs for focusing inputs
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

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

  // Focus and scroll to input
  const handleLabelClick = (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const titleValidation = validateVideoTitle(metadata.title);
  const isValid = metadata.title.trim().length >= 3 && titleValidation.ok;

  return (
    <div className="space-y-6">
      {/* Title - Clickable label */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleLabelClick(titleRef)}
          className="text-base font-semibold flex items-center gap-2 hover:text-[hsl(var(--cosmic-cyan))] transition-colors group w-full text-left"
        >
          Tiêu đề <span className="text-destructive">*</span>
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--cosmic-cyan))]" />
        </button>
        <div className="relative">
          <Input
            ref={titleRef}
            id="title"
            value={metadata.title}
            onChange={(e) => onChange({ ...metadata, title: e.target.value.slice(0, 100) })}
            placeholder="Nhập tiêu đề hấp dẫn cho video..."
            className="pr-16 h-12 text-base focus:ring-2 focus:ring-[hsl(var(--cosmic-cyan)/0.5)] focus:border-[hsl(var(--cosmic-cyan))]"
            maxLength={100}
          />
          <span className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors",
            metadata.title.length > 90 ? "text-destructive" : "text-muted-foreground"
          )}>
            {metadata.title.length}/100
          </span>
        </div>
        {!titleValidation.ok && metadata.title.length > 0 && (
          <p className="text-xs text-destructive">{titleValidation.reason}</p>
        )}
        {metadata.title.length > 0 && metadata.title.length < 3 && titleValidation.ok && (
          <p className="text-xs text-destructive">Tiêu đề cần ít nhất 3 ký tự</p>
        )}
        <p className="text-xs text-muted-foreground italic">{TITLE_PPLP_TEXT}</p>
      </div>

      {/* Description - Clickable label */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleLabelClick(descriptionRef)}
          className="text-base font-semibold flex items-center gap-2 hover:text-[hsl(var(--cosmic-cyan))] transition-colors group w-full text-left"
        >
          Mô tả <span className="text-destructive">*</span>
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--cosmic-cyan))]" />
        </button>
        <Textarea
          ref={descriptionRef}
          id="description"
          value={metadata.description}
          onChange={(e) => onChange({ ...metadata, description: e.target.value.slice(0, 5000) })}
          placeholder={`Mô tả nội dung video (tối thiểu 50 ký tự), thêm link, hashtag, timestamp...

Ví dụ:
0:00 Giới thiệu
1:30 Nội dung chính

#funplay #camlycoin #5d`}
          className="min-h-[140px] sm:min-h-[160px] resize-none text-base focus:ring-2 focus:ring-[hsl(var(--cosmic-cyan)/0.5)] focus:border-[hsl(var(--cosmic-cyan))]"
          maxLength={5000}
        />
        <div className="flex justify-between">
          <p className={cn(
            "text-xs",
            metadata.description.trim().length < 50 ? "text-destructive" : "text-muted-foreground"
          )}>
            {metadata.description.trim().length < 50 
              ? `Tối thiểu 50 ký tự (còn thiếu ${50 - metadata.description.trim().length})` 
              : "✓ Đủ yêu cầu"}
          </p>
          <p className="text-xs text-muted-foreground">
            {metadata.description.length}/5000
          </p>
        </div>
      </div>

      {/* Tags - Clickable label */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleLabelClick(tagInputRef)}
          className="text-base font-semibold flex items-center gap-2 hover:text-[hsl(var(--cosmic-cyan))] transition-colors group w-full text-left"
        >
          <Hash className="w-4 h-4" />
          Thẻ (Tags)
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--cosmic-cyan))]" />
        </button>
        
        {/* Current tags */}
        <AnimatePresence mode="popLayout">
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {metadata.tags.map(tag => (
              <motion.div
                key={tag}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                layout
              >
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 gap-1.5 text-sm bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.15)] to-[hsl(var(--cosmic-magenta)/0.15)] border border-[hsl(var(--cosmic-cyan)/0.3)] hover:border-[hsl(var(--cosmic-magenta)/0.5)] transition-all"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        <Input
          ref={tagInputRef}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tag và nhấn Enter (tối đa 15 tags)"
          disabled={metadata.tags.length >= 15}
          className="h-11 focus:ring-2 focus:ring-[hsl(var(--cosmic-cyan)/0.5)] focus:border-[hsl(var(--cosmic-cyan))]"
        />
        
        {/* Suggested Tags - scrollable on mobile */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Gợi ý:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {SUGGESTED_TAGS.filter(t => !metadata.tags.includes(t)).slice(0, 20).map(tag => (
              <motion.button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-gradient-to-r hover:from-[hsl(var(--cosmic-cyan)/0.2)] hover:to-[hsl(var(--cosmic-magenta)/0.2)] hover:text-foreground border border-transparent hover:border-[hsl(var(--cosmic-cyan)/0.3)] transition-all"
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Visibility - Clickable label */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          Quyền riêng tư
        </Label>
        <RadioGroup
          value={metadata.visibility}
          onValueChange={(value) => onChange({ 
            ...metadata, 
            visibility: value as VideoMetadata["visibility"],
            scheduledAt: value === "scheduled" ? metadata.scheduledAt : null 
          })}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {VISIBILITY_OPTIONS.map(option => {
            const Icon = option.icon;
            const isSelected = metadata.visibility === option.value;
            
            return (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="block cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-300 min-h-[80px]",
                      isSelected
                        ? "border-transparent bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)]"
                        : "border-border hover:border-[hsl(var(--cosmic-cyan)/0.3)] hover:bg-muted/50"
                    )}
                  >
                    {/* Gradient border effect when selected */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] opacity-50 blur-sm -z-10" />
                    )}
                    
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected 
                        ? `bg-gradient-to-br ${option.gradient} text-white shadow-lg` 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "font-semibold text-sm block",
                        isSelected && "text-foreground"
                      )}>
                        {option.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </motion.div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Schedule Date Picker */}
        <AnimatePresence>
          {metadata.visibility === "scheduled" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-12 border-[hsl(var(--cosmic-cyan)/0.3)] hover:border-[hsl(var(--cosmic-cyan))] hover:bg-[hsl(var(--cosmic-cyan)/0.05)]"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5 text-[hsl(var(--cosmic-cyan))]" />
                      {metadata.scheduledAt ? (
                        format(metadata.scheduledAt, "PPP 'lúc' HH:mm", { locale: vi })
                      ) : (
                        <span className="text-muted-foreground">Chọn ngày giờ đăng</span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation with pulse-halo effect */}
      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onBack} className="gap-2 min-h-[48px] touch-manipulation">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="gap-2 min-h-[48px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] hover:from-[hsl(var(--cosmic-cyan)/0.9)] hover:to-[hsl(var(--cosmic-magenta)/0.9)] text-white shadow-lg relative overflow-hidden touch-manipulation"
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.5 }}
          />
          <span className="relative z-10 flex items-center gap-2">
            Tiếp tục
            <ArrowRight className="w-4 h-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}

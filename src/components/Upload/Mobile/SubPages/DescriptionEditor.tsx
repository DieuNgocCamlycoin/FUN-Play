import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Hash, Clock, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { MIN_DESCRIPTION_LENGTH } from "@/lib/videoUploadValidation";
import { cn } from "@/lib/utils";

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function DescriptionEditor({ value, onChange, onSave }: DescriptionEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { lightTap, mediumTap } = useHapticFeedback();

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    lightTap();
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSave = () => {
    mediumTap();
    onSave();
  };

  const insertHashtag = () => {
    lightTap();
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localValue;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newValue = before + "#" + after;
    setLocalValue(newValue);
    onChange(newValue);

    // Set cursor position after the hashtag
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      textarea.focus();
    }, 0);
  };

  const insertTimestamp = () => {
    lightTap();
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localValue;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const timestamp = "0:00";
    const newValue = before + timestamp + after;
    setLocalValue(newValue);
    onChange(newValue);

    // Set cursor position after the timestamp
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + timestamp.length;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Insert Buttons */}
      <div className="p-4 border-b border-border flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={insertHashtag}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium transition-colors min-h-[40px]"
        >
          <Hash className="w-4 h-4" />
          Hashtag
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={insertTimestamp}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium transition-colors min-h-[40px]"
        >
          <Clock className="w-4 h-4" />
          Mốc thời gian
        </motion.button>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          placeholder="Nói cho người xem biết về video của bạn...

Bạn có thể thêm:
#hashtag để dễ tìm kiếm
0:00 mốc thời gian trong video
@kênh để đề cập kênh khác"
          className="w-full h-full min-h-[300px] text-base border-0 resize-none focus-visible:ring-0 bg-transparent p-0"
          maxLength={5000}
        />
      </div>

      {/* Character Count with minimum requirement */}
      <div className="px-4 pb-2 flex justify-between">
        <p className={cn(
          "text-xs",
          localValue.trim().length < MIN_DESCRIPTION_LENGTH ? "text-destructive" : "text-green-600"
        )}>
          {localValue.trim().length < MIN_DESCRIPTION_LENGTH
            ? `Tối thiểu ${MIN_DESCRIPTION_LENGTH} ký tự (còn ${MIN_DESCRIPTION_LENGTH - localValue.trim().length})`
            : `✓ Đủ yêu cầu`}
        </p>
        <p className="text-xs text-muted-foreground">
          {localValue.length}/5000
        </p>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[56px] bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] shadow-lg"
        >
          <Check className="w-5 h-5" />
          Lưu mô tả
        </motion.button>
      </div>
    </div>
  );
}

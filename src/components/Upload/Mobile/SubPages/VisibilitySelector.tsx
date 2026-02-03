import { motion } from "framer-motion";
import { Globe, Link2, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface VisibilitySelectorProps {
  value: "public" | "unlisted" | "private";
  onChange: (value: "public" | "unlisted" | "private") => void;
}

const VISIBILITY_OPTIONS = [
  {
    id: "public" as const,
    icon: Globe,
    label: "Công khai",
    description: "Mọi người có thể tìm kiếm và xem",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  {
    id: "unlisted" as const,
    icon: Link2,
    label: "Không công khai",
    description: "Bất kỳ ai có đường liên kết đều có thể xem",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  {
    id: "private" as const,
    icon: Lock,
    label: "Riêng tư",
    description: "Chỉ bạn có thể xem",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
];

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const { mediumTap } = useHapticFeedback();

  const handleSelect = (id: "public" | "unlisted" | "private") => {
    mediumTap();
    onChange(id);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Section Title */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Xuất bản ngay
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {VISIBILITY_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all min-h-[72px]",
                isSelected
                  ? cn(option.bgColor, option.borderColor)
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              )}
            >
              {/* Radio Circle */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-[hsl(var(--cosmic-cyan))] bg-[hsl(var(--cosmic-cyan))]"
                    : "border-muted-foreground/50"
                )}
              >
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  option.bgColor
                )}
              >
                <Icon className={cn("w-5 h-5", option.color)} />
              </div>

              {/* Label & Description */}
              <div className="flex-1 text-left">
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground">
          💡 Bạn có thể thay đổi chế độ hiển thị bất kỳ lúc nào sau khi tải lên.
        </p>
      </div>
    </div>
  );
}

import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { SortType } from "@/hooks/useVideoComments";

interface CommentSortDropdownProps {
  sortBy: SortType;
  onSortChange: (value: SortType) => void;
  commentCount?: number;
  /** @deprecated Use sortBy */
  value?: SortType;
  /** @deprecated Use onSortChange */
  onChange?: (value: SortType) => void;
}

export function CommentSortDropdown({ sortBy, onSortChange, value, onChange }: CommentSortDropdownProps) {
  // Support both old and new API
  const currentSort = sortBy || value || "top";
  const handleChange = onSortChange || onChange || (() => {});

  const labels: Record<SortType, string> = {
    top: "Bình luận hàng đầu",
    newest: "Mới nhất trước",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
          <span>{labels[currentSort]}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleChange("top")}>
          <div className="flex items-center gap-2 w-full">
            {currentSort === "top" && <Check className="h-4 w-4" />}
            <span className={currentSort !== "top" ? "ml-6" : ""}>Bình luận hàng đầu</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChange("newest")}>
          <div className="flex items-center gap-2 w-full">
            {currentSort === "newest" && <Check className="h-4 w-4" />}
            <span className={currentSort !== "newest" ? "ml-6" : ""}>Mới nhất trước</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

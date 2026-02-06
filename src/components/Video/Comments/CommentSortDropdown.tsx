import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { SortBy } from "@/hooks/useVideoComments";

interface CommentSortDropdownProps {
  value: SortBy;
  onChange: (value: SortBy) => void;
}

export function CommentSortDropdown({ value, onChange }: CommentSortDropdownProps) {
  const labels: Record<SortBy, string> = {
    top: "Bình luận hàng đầu",
    newest: "Mới nhất trước",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
          <span>{labels[value]}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange("top")}>
          Bình luận hàng đầu
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("newest")}>
          Mới nhất trước
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

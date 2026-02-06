import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { MentionUser } from "@/hooks/useMentionSearch";
import { cn } from "@/lib/utils";

interface MentionAutocompleteProps {
  results: MentionUser[];
  loading: boolean;
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  visible?: boolean;
  position?: { top: number; left: number };
}

export interface MentionAutocompleteRef {
  scrollToSelected: () => void;
}

export const MentionAutocomplete = forwardRef<MentionAutocompleteRef, MentionAutocompleteProps>(
  ({ results, loading, selectedIndex, onSelect, visible, position }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      scrollToSelected: () => {
        const item = itemRefs.current[selectedIndex];
        if (item) {
          item.scrollIntoView({ block: "nearest" });
        }
      },
    }));

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    // Support both old (no visible prop) and new API
    const shouldShow = visible !== undefined ? visible : (results.length > 0 || loading);
    if (!shouldShow) return null;

    const style = position
      ? { top: position.top, left: position.left }
      : undefined;

    return (
      <div
        ref={containerRef}
        className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg"
        style={style}
      >
        {loading ? (
          <div className="p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tìm kiếm...
          </div>
        ) : results.length === 0 ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            Không tìm thấy người dùng
          </div>
        ) : (
          <div className="py-1">
            {results.map((user, index) => (
              <button
                key={user.id}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => onSelect(user)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(user.display_name || user.username)?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MentionAutocomplete.displayName = "MentionAutocomplete";

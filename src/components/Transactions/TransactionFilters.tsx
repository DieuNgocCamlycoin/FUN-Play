import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TransactionFilters as FilterType, TransactionType, TransactionStatus } from "@/hooks/useTransactionHistory";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TransactionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  className?: string;
  compact?: boolean;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  className,
  compact = false,
}: TransactionFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = !!(
    filters.search ||
    (filters.token && filters.token !== "all") ||
    (filters.type && filters.type !== "all") ||
    (filters.timeRange && filters.timeRange !== "all") ||
    (filters.isOnchain !== undefined && filters.isOnchain !== "all") ||
    (filters.status && filters.status !== "all")
  );

  const tokenOptions = [
    { value: "all", label: "Tất cả token" },
    { value: "CAMLY", label: "CAMLY" },
    { value: "BNB", label: "BNB" },
    { value: "USDT", label: "USDT" },
    { value: "FUN", label: "FUN MONEY" },
  ];

  const typeOptions = [
    { value: "all", label: "Tất cả loại" },
    { value: "gift", label: "Tặng thưởng" },
    { value: "donate", label: "Ủng hộ" },
    { value: "claim", label: "Rút thưởng" },
  ];

  const timeOptions = [
    { value: "all", label: "Tất cả thời gian" },
    { value: "7d", label: "7 ngày gần nhất" },
    { value: "30d", label: "30 ngày gần nhất" },
    { value: "thisMonth", label: "Tháng này" },
  ];

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "success", label: "Thành công" },
    { value: "pending", label: "Chờ xử lý" },
    { value: "failed", label: "Thất bại" },
  ];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, ví, tx hash..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Quick filters */}
        <Select value={filters.token || "all"} onValueChange={(v) => updateFilter("token", v)}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tokenOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.timeRange || "all"} onValueChange={(v) => updateFilter("timeRange", v as FilterType["timeRange"])}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
            <X className="h-4 w-4" />
            Xóa lọc
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, địa chỉ ví, mã giao dịch (tx hash)..."
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0 -mx-1 px-1">
        {/* Token */}
        <Select value={filters.token || "all"} onValueChange={(v) => updateFilter("token", v)}>
          <SelectTrigger className="w-[120px] sm:w-[140px] flex-shrink-0">
            <SelectValue placeholder="Token" />
          </SelectTrigger>
          <SelectContent>
            {tokenOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={filters.type || "all"} onValueChange={(v) => updateFilter("type", v as TransactionType | "all")}>
          <SelectTrigger className="w-[120px] sm:w-[140px] flex-shrink-0">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time */}
        <Select value={filters.timeRange || "all"} onValueChange={(v) => updateFilter("timeRange", v as FilterType["timeRange"])}>
          <SelectTrigger className="w-[130px] sm:w-[160px] flex-shrink-0">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filters.status || "all"} onValueChange={(v) => updateFilter("status", v as TransactionStatus | "all")}>
          <SelectTrigger className="w-[120px] sm:w-[150px] flex-shrink-0">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Onchain toggle */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background flex-shrink-0">
          <Checkbox
            id="onchain-filter"
            checked={filters.isOnchain === true}
            onCheckedChange={(checked) => {
              updateFilter("isOnchain", checked ? true : "all");
            }}
          />
          <Label htmlFor="onchain-filter" className="text-sm cursor-pointer">
            Chỉ onchain
          </Label>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Tìm: "{filters.search}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("search", "")} />
            </Badge>
          )}
          {filters.token && filters.token !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Token: {filters.token}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("token", "all")} />
            </Badge>
          )}
          {filters.type && filters.type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Loại: {typeOptions.find(o => o.value === filters.type)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("type", "all")} />
            </Badge>
          )}
          {filters.timeRange && filters.timeRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {timeOptions.find(o => o.value === filters.timeRange)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("timeRange", "all")} />
            </Badge>
          )}
          {filters.status && filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {statusOptions.find(o => o.value === filters.status)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("status", "all")} />
            </Badge>
          )}
          {filters.isOnchain === true && (
            <Badge variant="secondary" className="gap-1">
              Onchain
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("isOnchain", "all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

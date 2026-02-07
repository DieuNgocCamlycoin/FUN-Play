/**
 * Mint Request List
 * Filterable list of user's mint requests
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Filter, 
  Clock, 
  CheckCircle, 
  Coins, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MintRequest } from '@/hooks/useFunMoneyMintRequest';
import { MintRequestCard } from './MintRequestCard';

interface MintRequestListProps {
  requests: MintRequest[];
  loading?: boolean;
  onRefresh?: () => void;
  onSelectRequest?: (request: MintRequest) => void;
  className?: string;
}

const FILTERS = [
  { value: 'all', label: 'Tất cả', icon: FileText },
  { value: 'pending', label: 'Đang chờ', icon: Clock },
  { value: 'approved', label: 'Đã duyệt', icon: CheckCircle },
  { value: 'minted', label: 'Đã mint', icon: Coins },
  { value: 'rejected', label: 'Từ chối', icon: XCircle }
];

export function MintRequestList({ 
  requests, 
  loading, 
  onRefresh, 
  onSelectRequest,
  className 
}: MintRequestListProps) {
  const [filter, setFilter] = useState('all');

  const filteredRequests = requests.filter(r => 
    filter === 'all' || r.status === filter
  );

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    minted: requests.filter(r => r.status === 'minted').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Lịch Sử Request
          </CardTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {FILTERS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(value)}
              className="gap-1.5"
            >
              <Icon className="w-3 h-3" />
              {label}
              {counts[value as keyof typeof counts] > 0 && (
                <Badge 
                  variant={filter === value ? "secondary" : "outline"} 
                  className="ml-1 h-5 px-1.5"
                >
                  {counts[value as keyof typeof counts]}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có request nào</p>
              {filter !== 'all' && (
                <Button 
                  variant="link" 
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  Xem tất cả
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <MintRequestCard
                  key={request.id}
                  request={request}
                  onClick={() => onSelectRequest?.(request)}
                  showDetails
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

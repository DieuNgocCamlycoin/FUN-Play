import { Badge } from '@/components/ui/badge';

interface MintStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_sig: { label: 'Chờ duyệt', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  signing: { label: 'Đang xử lý', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  signed: { label: 'Sẵn sàng mint', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  submitted: { label: 'Đã submit', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  confirmed: { label: 'Thành công', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  failed: { label: 'Thất bại', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function MultisigStatusBadge({ status }: MintStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_sig;
  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

import { Badge } from '@/components/ui/badge';
import { GOV_GROUPS, REQUIRED_GROUPS, type GovGroupName } from '@/lib/fun-money/pplp-multisig-config';
import type { MultisigSignatures } from '@/lib/fun-money/pplp-multisig-types';

interface MultisigStatusBadgeProps {
  signatures: MultisigSignatures;
  completedGroups: GovGroupName[];
}

export function MultisigStatusBadge({ signatures, completedGroups }: MultisigStatusBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REQUIRED_GROUPS.map((group) => {
        const isSigned = completedGroups.includes(group);
        const groupInfo = GOV_GROUPS[group];
        const sig = signatures[group];

        return (
          <Badge
            key={group}
            variant={isSigned ? 'default' : 'outline'}
            className={
              isSigned
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                : 'text-muted-foreground border-border/50'
            }
          >
            <span className="mr-1">{groupInfo.emoji}</span>
            {groupInfo.label}
            {isSigned ? ' ✓' : ' ⏳'}
            {sig?.signer_name && (
              <span className="ml-1 opacity-70 text-[10px]">({sig.signer_name})</span>
            )}
          </Badge>
        );
      })}
      <span className="text-xs text-muted-foreground ml-1">
        {completedGroups.length}/{REQUIRED_GROUPS.length}
      </span>
    </div>
  );
}

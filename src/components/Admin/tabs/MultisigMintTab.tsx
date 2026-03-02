import { AttesterPanel } from '@/components/Multisig/AttesterPanel';
import { AdminMintPanel } from '@/components/Multisig/AdminMintPanel';
import { Separator } from '@/components/ui/separator';

export function MultisigMintTab() {
  return (
    <div className="space-y-8">
      {/* Attester Signing Section */}
      <section>
        <AttesterPanel />
      </section>

      <Separator />

      {/* Admin Submit Section */}
      <section>
        <AdminMintPanel />
      </section>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGovAttesters, GovAttesterRow } from "@/hooks/useGovAttesters";
import { GovGroupName, GOV_GROUPS } from "@/lib/fun-money/pplp-multisig-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Power, PowerOff, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GROUP_META: Record<GovGroupName, { emoji: string; label: string; labelVi: string; color: string }> = {
  will: { emoji: "💪", label: "WILL", labelVi: "Ý Chí", color: "text-blue-400" },
  wisdom: { emoji: "🌟", label: "WISDOM", labelVi: "Trí Tuệ", color: "text-yellow-400" },
  love: { emoji: "❤️", label: "LOVE", labelVi: "Yêu Thương", color: "text-pink-400" },
};

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function GovAttesterManagementTab() {
  const { grouped, loading, refetch } = useGovAttesters();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<GovAttesterRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formWallet, setFormWallet] = useState("");
  const [formGroup, setFormGroup] = useState<GovGroupName>("will");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormWallet("");
    setFormGroup("will");
    setEditItem(null);
  };

  const handleAdd = async () => {
    if (!formName.trim() || !formWallet.trim()) {
      toast.error("Vui lòng nhập đủ thông tin");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("gov_attesters").insert({
      gov_group: formGroup,
      name: formName.trim(),
      wallet_address: formWallet.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đã thêm attester");
      setAddOpen(false);
      resetForm();
      refetch();
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    const { error } = await supabase
      .from("gov_attesters")
      .update({ name: formName.trim(), wallet_address: formWallet.trim(), gov_group: formGroup, updated_at: new Date().toISOString() })
      .eq("id", editItem.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đã cập nhật");
      setEditItem(null);
      resetForm();
      refetch();
    }
  };

  const toggleActive = async (item: GovAttesterRow) => {
    const { error } = await supabase
      .from("gov_attesters")
      .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success(item.is_active ? "Đã vô hiệu hóa" : "Đã kích hoạt");
      refetch();
    }
  };

  const openEdit = (item: GovAttesterRow) => {
    setEditItem(item);
    setFormName(item.name);
    setFormWallet(item.wallet_address);
    setFormGroup(item.gov_group);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groups: GovGroupName[] = ["will", "wisdom", "love"];

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Thêm Attester</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Thêm GOV Attester</DialogTitle></DialogHeader>
            <AttesterForm
              name={formName} setName={setFormName}
              wallet={formWallet} setWallet={setFormWallet}
              group={formGroup} setGroup={setFormGroup}
              saving={saving} onSubmit={handleAdd} submitLabel="Thêm"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) { setEditItem(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sửa Attester</DialogTitle></DialogHeader>
          <AttesterForm
            name={formName} setName={setFormName}
            wallet={formWallet} setWallet={setFormWallet}
            group={formGroup} setGroup={setFormGroup}
            saving={saving} onSubmit={handleUpdate} submitLabel="Lưu"
          />
        </DialogContent>
      </Dialog>

      {/* Group cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {groups.map((gId) => {
          const meta = GROUP_META[gId];
          const members = grouped[gId];
          const activeCount = members.filter((m) => m.is_active).length;

          return (
            <Card key={gId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className={meta.color}>{meta.label}</span>
                  <span className="text-sm text-muted-foreground font-normal">({meta.labelVi})</span>
                </CardTitle>
                {activeCount === 0 && (
                  <div className="flex items-center gap-1.5 text-destructive text-sm mt-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Không có thành viên active!</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có thành viên</p>
                )}
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{shortenAddress(m.wallet_address)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={m.is_active ? "default" : "secondary"} className="text-xs">
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => toggleActive(m)}
                        title={m.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                      >
                        {m.is_active ? <PowerOff className="w-3.5 h-3.5 text-destructive" /> : <Power className="w-3.5 h-3.5 text-green-500" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AttesterForm({
  name, setName, wallet, setWallet, group, setGroup, saving, onSubmit, submitLabel,
}: {
  name: string; setName: (v: string) => void;
  wallet: string; setWallet: (v: string) => void;
  group: GovGroupName; setGroup: (v: GovGroupName) => void;
  saving: boolean; onSubmit: () => void; submitLabel: string;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Nhóm GOV</Label>
        <Select value={group} onValueChange={(v) => setGroup(v as GovGroupName)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="will">💪 WILL — Ý Chí</SelectItem>
            <SelectItem value="wisdom">🌟 WISDOM — Trí Tuệ</SelectItem>
            <SelectItem value="love">❤️ LOVE — Yêu Thương</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tên</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Minh Trí" />
      </div>
      <div className="space-y-2">
        <Label>Địa chỉ ví (Wallet Address)</Label>
        <Input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x..." className="font-mono text-sm" />
      </div>
      <Button onClick={onSubmit} disabled={saving} className="w-full">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

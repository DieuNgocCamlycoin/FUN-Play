import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trash2, AlertTriangle, CheckCircle, Loader2, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CleanupResult {
  deleted: number;
  r2FilesDeleted: number;
  freedBytes: number;
  remaining: number;
  totalBannedUsers: number;
  errors?: string[];
}

interface DryRunResult {
  dryRun: true;
  totalBannedUsers: number;
  totalVideos: number;
  estimatedSizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function BannedVideoCleanupPanel() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dryRunData, setDryRunData] = useState<DryRunResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalDeleted, setTotalDeleted] = useState(0);
  const [totalFreed, setTotalFreed] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const callFunction = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-banned-videos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    return resp.json();
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = await callFunction({ dryRun: true });
      setDryRunData(result as DryRunResult);
      setConfirmOpen(true);
    } catch (e: any) {
      toast.error(`Lỗi quét: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCleanup = async () => {
    setConfirmOpen(false);
    setIsProcessing(true);
    setDone(false);
    setTotalDeleted(0);
    setTotalFreed(0);
    setBatchErrors([]);
    setRemaining(dryRunData?.totalVideos || 0);

    let cumDeleted = 0;
    let cumFreed = 0;
    let allErrors: string[] = [];

    try {
      // Process batches until none remain
      let hasMore = true;
      while (hasMore) {
        const result: CleanupResult = await callFunction({ batchSize: 50 });
        cumDeleted += result.deleted;
        cumFreed += result.freedBytes;
        if (result.errors) allErrors = [...allErrors, ...result.errors];

        setTotalDeleted(cumDeleted);
        setTotalFreed(cumFreed);
        setRemaining(result.remaining);
        setBatchErrors(allErrors);

        hasMore = result.remaining > 0 && result.deleted > 0;
      }

      setDone(true);
      toast.success(`Đã dọn dẹp ${cumDeleted} video, giải phóng ${formatBytes(cumFreed)}`);
    } catch (e: any) {
      toast.error(`Lỗi cleanup: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalVideos = dryRunData?.totalVideos || 0;
  const progress = totalVideos > 0 ? ((totalDeleted / totalVideos) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 className="w-5 h-5 text-destructive" />
            Dọn dẹp Video của User bị Ban
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Xóa toàn bộ video (file trên R2 + database records) của các user đã bị ban 
            để giải phóng dung lượng lưu trữ. Thao tác này không thể hoàn tác.
          </p>

          {!isProcessing && !done && (
            <Button onClick={handleScan} disabled={scanning} variant="destructive">
              {scanning ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang quét...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Quét & Dọn dẹp</>
              )}
            </Button>
          )}

          {/* Progress during cleanup */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xóa...
                </span>
                <span>{totalDeleted} / {totalVideos} video</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Đã giải phóng: {formatBytes(totalFreed)}</span>
                <span>Còn lại: {remaining}</span>
              </div>
            </div>
          )}

          {/* Done summary */}
          {done && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  Dọn dẹp hoàn tất!
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Video đã xóa: <strong>{totalDeleted}</strong></div>
                  <div>Dung lượng giải phóng: <strong>{formatBytes(totalFreed)}</strong></div>
                  <div>Còn lại: <strong>{remaining}</strong></div>
                </div>
                {batchErrors.length > 0 && (
                  <div className="text-xs text-amber-600 mt-2">
                    <p className="font-semibold">{batchErrors.length} lỗi:</p>
                    <ul className="list-disc pl-4 max-h-24 overflow-y-auto">
                      {batchErrors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => { setDone(false); setDryRunData(null); }}>
                  Quét lại
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Xác nhận dọn dẹp
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa vĩnh viễn video và dữ liệu liên quan. Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {dryRunData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-destructive">{dryRunData.totalBannedUsers}</div>
                    <div className="text-xs text-muted-foreground">User bị ban</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-destructive">{dryRunData.totalVideos}</div>
                    <div className="text-xs text-muted-foreground">Video sẽ xóa</div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <HardDrive className="w-4 h-4" />
                Ước tính giải phóng: <strong>{formatBytes(dryRunData.estimatedSizeBytes)}</strong>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Sẽ xóa: video files, thumbnails trên R2 + comments, likes, watch history, reward_actions trong database
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleCleanup}>
              <Trash2 className="w-4 h-4 mr-2" /> Xóa {dryRunData?.totalVideos || 0} video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

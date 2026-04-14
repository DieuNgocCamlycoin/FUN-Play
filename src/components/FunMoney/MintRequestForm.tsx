/**
 * FUN Money Mint Request Form
 * CTO Diagram v13Apr2026: Proof required, 0-10 pillar scale, action groups
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { useMintRequest } from '@/hooks/useFunMoneyMintRequest';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';
import { ACTION_GROUPS, type ActionGroup } from '@/lib/fun-money/light-score-pillars';
import { toast } from 'sonner';

interface MintRequestFormProps {
  platformId?: string;
  actionType?: string;
  onSubmitSuccess?: (requestId: string) => void;
  onSuccess?: () => void;
}

const PILLAR_LABELS: Record<string, string> = {
  S: '🙏 Phụng sự (Serving Life)',
  T: '💎 Chân thật (Truth)',
  H: '💗 Chữa lành (Healing & Love)',
  C: '🌟 Giá trị (Long-term Value)',
  U: '🤝 Đoàn kết (Unity)'
};

const UNITY_SIGNAL_LABELS: Record<string, string> = {
  collaboration: 'Hợp tác',
  beneficiaryConfirmed: 'Người nhận xác nhận',
  communityEndorsement: 'Cộng đồng ủng hộ',
  bridgeValue: 'Giá trị cầu nối'
};

const PROOF_TYPES = [
  { value: 'link', label: '🔗 Link', placeholder: 'https://...' },
  { value: 'video', label: '🎥 Video URL', placeholder: 'https://youtube.com/...' },
  { value: 'image', label: '🖼️ Image URL', placeholder: 'https://...image.png' },
];

export function MintRequestForm({ 
  platformId = 'FUN_PROFILE', 
  actionType = 'CONTENT_CREATE', 
  onSubmitSuccess,
  onSuccess 
}: MintRequestFormProps) {
  const { isConnected, address, connect } = useFunMoneyWallet();
  const { submitRequest, loading, error } = useMintRequest();
  
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofError, setProofError] = useState('');
  
  // Pillar scores (0-10 scale per CTO diagram)
  const [pillars, setPillars] = useState({ S: 7, T: 7, H: 7, C: 7, U: 7 });
  
  // Unity signals
  const [signals, setSignals] = useState({
    collaboration: false,
    beneficiaryConfirmed: false,
    communityEndorsement: false,
    bridgeValue: false
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [resultAmount, setResultAmount] = useState('');

  const validateProof = (url: string): boolean => {
    if (!url.trim()) {
      setProofError('⚠️ Bắt buộc — No Proof → No Score → No Mint');
      return false;
    }
    try {
      new URL(url.trim());
      setProofError('');
      return true;
    } catch {
      setProofError('URL không hợp lệ');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả');
      return;
    }

    // PROOF LAYER: Required per CTO diagram
    if (!validateProof(proofUrl)) {
      toast.error('🚫 No Proof → No Score → No Mint');
      return;
    }
    
    const result = await submitRequest({
      platformId,
      actionType,
      userWalletAddress: address,
      evidence: {
        type: 'TEXT_PROOF',
        description: description.trim(),
        urls: [proofUrl.trim()]
      },
      pillarScores: pillars,
      unitySignals: signals
    });
    
    if (result) {
      setSubmitted(true);
      setResultAmount(result.scoringResult.calculatedAmountFormatted);
      toast.success('Yêu cầu đã được gửi thành công!');
      onSubmitSuccess?.(result.id);
      onSuccess?.();
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Đã gửi yêu cầu!</h3>
          <p className="text-green-600 dark:text-green-400 mt-2">Số lượng ước tính: {resultAmount}</p>
          <p className="text-sm text-green-500 dark:text-green-500 mt-1">Đang chờ Admin duyệt...</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSubmitted(false)}
          >
            Gửi yêu cầu khác
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Gửi yêu cầu Mint
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline">{platformId}</Badge>
          <Badge variant="secondary">{actionType}</Badge>
        </div>
        {/* Formula reminder */}
        <p className="text-xs text-muted-foreground mt-2">
          📐 Score = S × T × L × V × U / 10⁴ — Bất kỳ trụ cột = 0 → Score = 0
        </p>
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Kết nối ví để gửi yêu cầu</p>
            <Button onClick={connect}>Kết nối ví</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Evidence */}
            <div className="space-y-2">
              <Label>Mô tả *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả hành động và tác động của bạn..."
                rows={3}
              />
            </div>
            
            {/* PROOF LAYER (Required) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                URL bằng chứng *
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Bắt buộc
                </Badge>
              </Label>
              <Input
                value={proofUrl}
                onChange={(e) => {
                  setProofUrl(e.target.value);
                  if (proofError) validateProof(e.target.value);
                }}
                placeholder="https://... (link, video, image)"
                className={proofError ? 'border-destructive' : ''}
              />
              {proofError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {proofError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                🔒 No Proof → No Score → No Mint
              </p>
            </div>
            
            {/* Pillar Scores (0-10) */}
            <div className="space-y-4">
              <Label>Điểm tự đánh giá (0-10)</Label>
              {Object.entries(pillars).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{PILLAR_LABELS[key] || key}</span>
                    <span className="font-bold">{value}/10</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => setPillars(p => ({ ...p, [key]: v }))}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              ))}
            </div>
            
            {/* Unity Signals */}
            <div className="space-y-3">
              <Label>Tín hiệu Đoàn kết</Label>
              {Object.entries(signals).map(([key, checked]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => setSignals(s => ({ ...s, [key]: !!c }))}
                  />
                  <span className="text-sm">{UNITY_SIGNAL_LABELS[key] || key}</span>
                </div>
              ))}
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Gửi yêu cầu
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

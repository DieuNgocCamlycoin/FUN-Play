/**
 * FUN Money Action Submission — 4-Step Flow
 * CTO Diagram v13Apr2026: Truth Validation Engine
 * 
 * Step 1: Choose action group
 * Step 2: Upload proof (required)
 * Step 3: System validates (PPLP 5-pillar)
 * Step 4: Receive Light Score + FUN Money
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Upload, Eye, Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MintRequestFormProps {
  platformId?: string;
  actionType?: string;
  onSubmitSuccess?: (requestId: string) => void;
  onSuccess?: () => void;
}

const ACTION_GROUPS = [
  { code: 'INNER_WORK', label: '🧘 Thiền / Sám hối / Biết ơn', desc: 'Inner Work — Thực hành nội tâm' },
  { code: 'CHANNELING', label: '📡 Dẫn kênh / Chia sẻ ánh sáng', desc: 'Channeling — Truyền tải giá trị' },
  { code: 'GIVING', label: '💝 Gieo hạt tài chính / Cho đi', desc: 'Giving — Trao đi không điều kiện' },
  { code: 'SOCIAL_IMPACT', label: '🤝 Tác động xã hội / Giúp đỡ', desc: 'Social Impact — Tạo ảnh hưởng tích cực' },
  { code: 'SERVICE', label: '🛠️ Phụng sự cộng đồng / Build', desc: 'Service — Xây dựng hệ sinh thái' },
  { code: 'LEARNING', label: '📚 Học tập / Nghiên cứu', desc: 'Learning — Phát triển tri thức' },
];

const PROOF_TYPES = [
  { value: 'link', label: '🔗 Link', placeholder: 'https://...' },
  { value: 'video', label: '🎥 Video URL', placeholder: 'https://youtube.com/...' },
  { value: 'image', label: '🖼️ Image URL', placeholder: 'https://...image.png' },
];

const STEP_LABELS = ['Chọn hành động', 'Gửi bằng chứng', 'Hệ thống xác minh', 'Nhận kết quả'];

export function MintRequestForm({ onSubmitSuccess, onSuccess }: MintRequestFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [selectedAction, setSelectedAction] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const [proofType, setProofType] = useState('link');
  const [proofUrl, setProofUrl] = useState('');
  const [proofError, setProofError] = useState('');

  // Step 3 & 4
  const [actionId, setActionId] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [mintResult, setMintResult] = useState<any>(null);

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

  // Step 1 → 2: Submit action
  const handleSubmitAction = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); return; }
    if (!selectedAction || !title.trim()) { toast.error('Vui lòng chọn hành động và nhập tiêu đề'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-action', {
        body: {
          action_type_code: selectedAction,
          title: title.trim(),
          description: description.trim() || undefined,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setActionId(data.action_id);
      setStep(1);
      toast.success('✅ Đã ghi nhận hành động!');
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi gửi hành động');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3: Attach proof + validate
  const handleAttachProof = async () => {
    if (!validateProof(proofUrl)) {
      toast.error('🚫 No Proof → No Score → No Mint');
      return;
    }

    setLoading(true);
    try {
      // Attach proof
      const { data: proofData, error: proofErr } = await supabase.functions.invoke('attach-proof', {
        body: {
          action_id: actionId,
          proof_type: proofType,
          proof_url: proofUrl.trim(),
        },
      });

      if (proofErr) throw new Error(proofErr.message);
      if (proofData?.error) throw new Error(proofData.error);

      toast.success('📎 Đã đính kèm bằng chứng!');
      setStep(2);

      // Auto-validate
      const { data: valData, error: valErr } = await supabase.functions.invoke('validate-action', {
        body: { action_id: actionId },
      });

      if (valErr) throw new Error(valErr.message);
      if (valData?.error) throw new Error(valData.error);

      setValidationResult(valData);

      if (valData.validation_status === 'validated') {
        toast.success('✨ Hệ thống đã xác minh — Ánh sáng thật!');
      } else if (valData.validation_status === 'manual_review') {
        toast.info('🔍 Cần xem xét thêm bởi cộng đồng');
      } else {
        toast.error('❌ Không đạt chuẩn PPLP');
      }

      setStep(3);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi xác minh');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 → 4: Mint
  const handleMint = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-from-action', {
        body: { action_id: actionId },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setMintResult(data);
      toast.success(`💰 Đã mint ${data.mint_amount_user} FUN!`);
      onSubmitSuccess?.(data.mint_record_id);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi mint');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setSelectedAction('');
    setTitle('');
    setDescription('');
    setProofUrl('');
    setProofError('');
    setActionId('');
    setValidationResult(null);
    setMintResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          PPLP — Truth Validation Engine
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          📐 Score = S × T × L × V × U / 10⁴ — 99% User / 1% Platform
        </p>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mt-3">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{label}</span>
              {i < 3 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* STEP 0: Choose Action */}
        {step === 0 && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">🌿 Bước 1: Chọn việc mình đã làm</Label>
            <div className="grid gap-2">
              {ACTION_GROUPS.map(ag => (
                <button
                  key={ag.code}
                  onClick={() => setSelectedAction(ag.code)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedAction === ag.code
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{ag.label}</div>
                  <div className="text-xs text-muted-foreground">{ag.desc}</div>
                </button>
              ))}
            </div>

            {selectedAction && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Tiêu đề *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mô tả ngắn về hành động..."
                  />
                </div>
                <div>
                  <Label>Chi tiết</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết hành động và tác động..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmitAction}
              disabled={!selectedAction || !title.trim() || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Tiếp theo — Gửi bằng chứng
            </Button>
          </div>
        )}

        {/* STEP 1: Upload Proof */}
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">🌿 Bước 2: Gửi bằng chứng</Label>
            <p className="text-xs text-muted-foreground">🔒 No Proof → No Score → No Mint</p>

            <div className="flex gap-2">
              {PROOF_TYPES.map(pt => (
                <Button
                  key={pt.value}
                  variant={proofType === pt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProofType(pt.value)}
                >
                  {pt.label}
                </Button>
              ))}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                URL bằng chứng *
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Bắt buộc</Badge>
              </Label>
              <Input
                value={proofUrl}
                onChange={(e) => {
                  setProofUrl(e.target.value);
                  if (proofError) validateProof(e.target.value);
                }}
                placeholder={PROOF_TYPES.find(p => p.value === proofType)?.placeholder}
                className={proofError ? 'border-destructive' : ''}
              />
              {proofError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />{proofError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
              </Button>
              <Button onClick={handleAttachProof} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Gửi & Xác minh
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Validating */}
        {step === 2 && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="font-medium">🔍 Hệ thống đang xác minh...</p>
            <p className="text-xs text-muted-foreground mt-1">AI Analysis + Community + System Trust</p>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && validationResult && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {mintResult ? '🌿 Bước 4: Kết quả' : '🌿 Bước 3: Kết quả xác minh'}
            </Label>

            {/* PPLP 5-Pillar Scores */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground">5 TRỤ CỘT PPLP</p>
              {[
                { key: 'serving_life', label: '🙏 Phụng sự', emoji: '🙏' },
                { key: 'transparent_truth', label: '💎 Chân thật', emoji: '💎' },
                { key: 'healing_love', label: '💗 Chữa lành', emoji: '💗' },
                { key: 'long_term_value', label: '🌟 Giá trị', emoji: '🌟' },
                { key: 'unity_over_separation', label: '🤝 Đoàn kết', emoji: '🤝' },
              ].map(p => {
                const score = validationResult.pplp_scores?.[p.key] ?? 0;
                return (
                  <div key={p.key} className="flex items-center gap-2">
                    <span className="text-xs w-28">{p.label}</span>
                    <Progress value={score * 10} className="flex-1 h-2" />
                    <span className="text-xs font-bold w-10 text-right">{score}/10</span>
                  </div>
                );
              })}
            </div>

            {/* Light Score */}
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">✨ Light Score</p>
              <p className="text-3xl font-bold text-primary">
                {validationResult.final_light_score?.toFixed(2)}
              </p>
              {validationResult.flags?.length > 0 && (
                <div className="flex gap-1 justify-center mt-2">
                  {validationResult.flags.map((f: string) => (
                    <Badge key={f} variant="destructive" className="text-[10px]">{f}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Mint Result */}
            {mintResult ? (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
                <div className="text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700 dark:text-green-300 text-lg">
                    💰 {mintResult.mint_amount_user} FUN
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    99% User = {mintResult.mint_amount_user} FUN | 1% Platform = {mintResult.mint_amount_platform} FUN
                  </p>
                </div>

                {/* Anti-Whale Cap Badge */}
                {mintResult.anti_whale_capped && (
                  <div className="flex justify-center">
                    <Badge variant="destructive" className="gap-1 text-xs">
                      🐋 Anti-Whale Capped
                    </Badge>
                  </div>
                )}

                {/* Validation Digest */}
                {mintResult.validation_digest && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">🔐 Validation Digest</p>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded" title={mintResult.validation_digest}>
                      {mintResult.validation_digest.slice(0, 16)}…
                    </code>
                  </div>
                )}
              </div>
            ) : validationResult.validation_status === 'validated' ? (
              <Button onClick={handleMint} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
                Mint FUN Money
              </Button>
            ) : (
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {validationResult.validation_status === 'manual_review'
                    ? '🔍 Đang chờ cộng đồng xem xét...'
                    : '❌ Không đạt chuẩn PPLP — Hãy thử lại với hành động chân thật hơn'}
                </p>
              </div>
            )}

            <Button variant="outline" onClick={resetForm} className="w-full">
              Gửi hành động mới
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

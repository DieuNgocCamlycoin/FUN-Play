import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVerified?: () => void;
}

export function PhoneVerificationModal({ open, onOpenChange, onVerified }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (!/^\+\d{8,15}$/.test(phone)) {
      toast({ title: 'Số không hợp lệ', description: 'Dùng định dạng quốc tế, ví dụ: +84912345678', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) {
      toast({ title: 'Không gửi được OTP', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã gửi mã OTP', description: `Kiểm tra tin nhắn tới ${phone}` });
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setBusy(true);
    // Verify phone OTP — Supabase auth marks phone verified on user
    const { error: vErr } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'phone_change' as 'sms' }).then(r => r).catch(() => ({ error: { message: 'verify error' } as { message: string } }));
    // Fallback: try 'sms' type
    let finalErr = vErr;
    if (vErr) {
      const { error: e2 } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      finalErr = e2;
    }
    if (finalErr) {
      setBusy(false);
      toast({ title: 'OTP sai hoặc hết hạn', description: finalErr.message, variant: 'destructive' });
      return;
    }
    // Call edge function to upgrade DID L1→L2 and log identity_link
    const { data, error: fErr } = await supabase.functions.invoke('did-kyc-light', {
      body: { phone },
    });
    setBusy(false);
    if (fErr || (data as { error?: string })?.error) {
      toast({
        title: 'Đã xác thực OTP nhưng nâng cấp DID lỗi',
        description: (data as { error?: string })?.error || fErr?.message || '',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Nâng cấp thành công', description: 'DID đã lên L2' });
    onVerified?.();
    onOpenChange(false);
    setStep('phone');
    setPhone('');
    setOtp('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone className="h-4 w-4" /> Xác thực số điện thoại</DialogTitle>
          <DialogDescription>
            {step === 'phone'
              ? 'Nâng cấp DID L1 → L2 bằng OTP. Số điện thoại được mã hoá, không công khai.'
              : `Nhập mã 6 số đã gửi tới ${phone}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-3 py-2">
            <Label>Số điện thoại (định dạng quốc tế)</Label>
            <Input
              placeholder="+84912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
            />
          </div>
        ) : (
          <div className="space-y-3 py-2 flex flex-col items-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
            <Button variant="link" size="sm" onClick={() => setStep('phone')}>Đổi số</Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          {step === 'phone' ? (
            <Button onClick={sendOtp} disabled={busy || !phone}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Gửi OTP
            </Button>
          ) : (
            <Button onClick={verifyOtp} disabled={busy || otp.length !== 6}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Xác thực
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

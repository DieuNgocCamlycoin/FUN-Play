import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFunWalletSync } from '@/hooks/useFunWalletSync';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FunWalletCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { linkFunWallet } = useFunWalletSync();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const address = searchParams.get('address');
    
    const handleConnect = async () => {
      if (!address) {
        setStatus('error');
        setErrorMessage('Không nhận được địa chỉ ví từ FUN Wallet');
        return;
      }

      if (!user) {
        setStatus('error');
        setErrorMessage('Bạn cần đăng nhập để kết nối ví');
        return;
      }

      try {
        const success = await linkFunWallet(address);
        if (success) {
          setStatus('success');
          
          // Notify opener window if exists
          if (window.opener) {
            window.opener.postMessage({
              type: 'FUN_WALLET_CALLBACK_SUCCESS',
              payload: { address }
            }, window.location.origin);
          }
          
          // Auto close or redirect after 2 seconds
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/');
            }
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Không thể lưu địa chỉ ví. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('[FunWalletCallback] Error:', error);
        setStatus('error');
        setErrorMessage('Đã xảy ra lỗi khi kết nối ví');
      }
    };

    handleConnect();
  }, [searchParams, user, linkFunWallet, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Đang kết nối FUN Wallet...</h1>
            <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-500">Kết nối thành công!</h1>
            <p className="text-muted-foreground">
              FUN Wallet đã được liên kết với tài khoản của bạn.
              {window.opener ? ' Cửa sổ sẽ tự động đóng...' : ' Đang chuyển hướng...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-destructive">Kết nối thất bại</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-4 justify-center mt-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
              <Button onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FunWalletCallback;

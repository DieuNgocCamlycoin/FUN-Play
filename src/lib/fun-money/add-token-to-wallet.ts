/**
 * Add FUN Money token to user's wallet via wallet_watchAsset (EIP-747)
 */

import { toast } from 'sonner';

const FUN_TOKEN_CONFIG = {
  address: '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6',
  symbol: 'FUN',
  decimals: 18,
  image: 'https://official-funplay.lovable.app/images/fun-money-coin.png',
};

export async function addFunTokenToWallet(): Promise<boolean> {
  try {
    const provider = (window as any).ethereum;
    if (!provider) {
      toast.error('Không tìm thấy ví! Vui lòng cài MetaMask hoặc Trust Wallet.');
      return false;
    }

    const added = await provider.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: FUN_TOKEN_CONFIG.address,
          symbol: FUN_TOKEN_CONFIG.symbol,
          decimals: FUN_TOKEN_CONFIG.decimals,
          image: FUN_TOKEN_CONFIG.image,
        },
      },
    });

    if (added) {
      toast.success('✅ Đã thêm FUN Money vào ví!', {
        description: 'Token FUN sẽ hiển thị trong danh sách token của bạn.',
      });
    }
    return !!added;
  } catch (err: any) {
    console.error('Add token error:', err);
    if (err.code === 4001) {
      toast.info('Bạn đã hủy thêm token.');
    } else {
      toast.error('Không thể thêm token. Vui lòng thêm thủ công.', {
        description: `Contract: ${FUN_TOKEN_CONFIG.address}`,
        duration: 8000,
      });
    }
    return false;
  }
}

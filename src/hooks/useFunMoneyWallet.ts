/**
 * FUN Money Wallet Hook (BSC Testnet)
 * v2.0 - Bridge từ WalletContext (wagmi/AppKit)
 * 
 * Lấy trạng thái kết nối từ hệ thống chính (wagmi) thay vì truy cập
 * trực tiếp window.ethereum, đảm bảo tương thích với mọi loại ví.
 */

import { useState, useCallback, useMemo } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';

// ===== BSC TESTNET CONFIG =====

const BSC_TESTNET_CHAIN_ID = 97;

const BSC_TESTNET = {
  chainId: '0x61', // 97 in hex
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com']
};

// ===== TYPES =====

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface UseFunMoneyWalletReturn {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isCorrectChain: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
  hasMetaMask: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBscTestnet: () => Promise<void>;
  clearError: () => void;
  getSigner: () => Promise<JsonRpcSigner>;
}

// ===== HOOK =====

export function useFunMoneyWallet(): UseFunMoneyWalletReturn {
  const walletCtx = useWalletContext();
  const [error, setError] = useState<string | null>(null);
  const [cachedProvider, setCachedProvider] = useState<BrowserProvider | null>(null);
  const [cachedSigner, setCachedSigner] = useState<JsonRpcSigner | null>(null);

  // Derive state from wagmi/AppKit context
  const isConnected = walletCtx.isConnected;
  const address = walletCtx.address || null;
  const chainId = walletCtx.chainId ?? null;
  const isCorrectChain = chainId === BSC_TESTNET_CHAIN_ID;

  const hasMetaMask = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';

  const getEthereum = (): EthereumProvider | undefined => {
    if (typeof window !== 'undefined') {
      return (window as any).ethereum;
    }
    return undefined;
  };

  // Get ethers signer from window.ethereum (needed for contract interactions)
  const getSigner = useCallback(async (): Promise<JsonRpcSigner> => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error('Không tìm thấy ví (MetaMask)');
    const provider = new BrowserProvider(ethereum as any);
    const signer = await provider.getSigner();
    setCachedProvider(provider);
    setCachedSigner(signer);
    return signer;
  }, []);

  // Connect = mở AppKit modal qua WalletContext
  const connect = useCallback(async () => {
    setError(null);
    try {
      await walletCtx.connectWithRetry();
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối ví');
    }
  }, [walletCtx.connectWithRetry]);

  // Switch to BSC Testnet
  const switchToBscTestnet = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setError('Không tìm thấy ví');
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET.chainId }]
      });
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_TESTNET]
          });
        } catch (addErr) {
          setError('Không thể thêm BSC Testnet');
        }
      } else {
        setError('Không thể chuyển mạng');
      }
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    walletCtx.disconnectWallet();
    setCachedProvider(null);
    setCachedSigner(null);
  }, [walletCtx.disconnectWallet]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isConnected,
    address,
    chainId,
    isCorrectChain,
    provider: cachedProvider,
    signer: cachedSigner,
    isConnecting: walletCtx.isConnecting,
    error,
    hasMetaMask,
    connect,
    disconnect,
    switchToBscTestnet,
    clearError,
    getSigner
  };
}

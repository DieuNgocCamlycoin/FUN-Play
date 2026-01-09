import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ExternalLink, Maximize2 } from 'lucide-react';

const WALLET_URL = 'https://funwallet-rich.lovable.app';

export default function FunWallet() {
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <img 
              src="/images/fun-wallet-logo.png" 
              alt="FUN Wallet" 
              className="h-10 w-10 rounded-full shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent">
                FUN Wallet
              </h1>
              <p className="text-sm text-muted-foreground">
                Ví chính thức của hệ sinh thái FUN
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => window.open(WALLET_URL, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Mở tab mới</span>
          </Button>
        </div>
        
        {/* Iframe container */}
        <div className="flex-1 relative">
          <iframe
            src={WALLET_URL}
            className="absolute inset-0 w-full h-full border-0"
            title="FUN Wallet"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </div>
    </MainLayout>
  );
}

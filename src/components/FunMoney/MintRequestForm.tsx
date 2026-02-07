/**
 * FUN Money Mint Request Form
 * SDK v1.0
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
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { useMintRequest } from '@/hooks/useFunMoneyMintRequest';
import { formatFunAmount } from '@/lib/fun-money/pplp-engine';
import { toast } from 'sonner';

interface MintRequestFormProps {
  platformId: string;
  actionType: string;
  onSubmitSuccess?: (requestId: string) => void;
}

export function MintRequestForm({ platformId, actionType, onSubmitSuccess }: MintRequestFormProps) {
  const { isConnected, address, connect } = useFunMoneyWallet();
  const { submitRequest, loading, error } = useMintRequest();
  
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  
  // Pillar scores
  const [pillars, setPillars] = useState({ S: 75, T: 75, H: 75, C: 75, U: 75 });
  
  // Unity signals
  const [signals, setSignals] = useState({
    collaboration: false,
    beneficiaryConfirmed: false,
    communityEndorsement: false,
    bridgeValue: false
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [resultAmount, setResultAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }
    
    const result = await submitRequest({
      platformId,
      actionType,
      userWalletAddress: address,
      evidence: {
        type: 'TEXT_PROOF',
        description: description.trim(),
        urls: proofUrl ? [proofUrl] : undefined
      },
      pillarScores: pillars,
      unitySignals: signals
    });
    
    if (result) {
      setSubmitted(true);
      setResultAmount(result.scoringResult.calculatedAmountFormatted);
      toast.success('Request submitted successfully!');
      onSubmitSuccess?.(result.id);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Request Submitted!</h3>
          <p className="text-green-600 dark:text-green-400 mt-2">Estimated amount: {resultAmount}</p>
          <p className="text-sm text-green-500 dark:text-green-500 mt-1">Waiting for admin approval...</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setSubmitted(false)}
          >
            Submit Another
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
          Submit Mint Request
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline">{platformId}</Badge>
          <Badge variant="secondary">{actionType}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">Connect wallet to submit request</p>
            <Button onClick={connect}>Connect Wallet</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Evidence */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your action and its impact..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Proof URL (optional)</Label>
              <Input
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            {/* Pillar Scores */}
            <div className="space-y-4">
              <Label>Self-Assessment Scores</Label>
              {Object.entries(pillars).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{key === 'S' ? 'Service' : key === 'T' ? 'Truth' : key === 'H' ? 'Healing' : key === 'C' ? 'Contribution' : 'Unity'}</span>
                    <span>{value}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => setPillars(p => ({ ...p, [key]: v }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              ))}
            </div>
            
            {/* Unity Signals */}
            <div className="space-y-3">
              <Label>Unity Signals</Label>
              {Object.entries(signals).map(([key, checked]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => setSignals(s => ({ ...s, [key]: !!c }))}
                  />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * useLightScorePillars — Hook to fetch and calculate 5-pillar Light Score
 * CTO Diagram v13Apr2026: Multiplicative formula
 */

import { useState, useEffect } from 'react';
import { fetchPillarSignals, calculatePillarScores, type PillarScoreResult } from '@/lib/fun-money/light-score-pillar-engine';

export function useLightScorePillars(userId: string | undefined) {
  const [result, setResult] = useState<PillarScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setResult(null);
      return;
    }

    const calculate = async () => {
      setLoading(true);
      setError(null);
      try {
        const signals = await fetchPillarSignals(userId);
        if (!signals) {
          setError('User not found');
          return;
        }

        const scoreResult = calculatePillarScores(
          signals.serving,
          signals.truth,
          signals.love,
          signals.value,
          signals.unity,
          signals.riskScore,
        );

        setResult(scoreResult);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    calculate();
  }, [userId]);

  return { result, loading, error };
}

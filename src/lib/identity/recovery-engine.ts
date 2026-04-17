/**
 * Recovery Engine — 4-layer recovery
 * 1. primary (email/phone/passkey)
 * 2. wallet (linked backup wallet)
 * 3. guardian (2-of-3 trusted identities)
 * 4. governance (core/high-value accounts)
 */

export type RecoveryLayer = 'primary' | 'wallet' | 'guardian' | 'governance';

export interface RecoveryConfig {
  cooldown_hours: Record<RecoveryLayer, number>;
  max_attempts_30d: number;
  freeze_payout_hours: number;
}

export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  cooldown_hours: { primary: 24, wallet: 72, guardian: 168, governance: 720 },
  max_attempts_30d: 3,
  freeze_payout_hours: 72,
};

export const RECOVERY_LABELS: Record<RecoveryLayer, string> = {
  primary: 'Email / Phone / Passkey',
  wallet: 'Backup Wallet',
  guardian: '2-of-3 Guardians',
  governance: 'Governance Recovery',
};

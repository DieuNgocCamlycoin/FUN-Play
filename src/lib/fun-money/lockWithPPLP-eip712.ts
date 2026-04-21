/**
 * EIP-712 helpers for `lockWithPPLP` on FUNMoneyProductionV1_2_1
 * Contract: 0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6 (BSC Testnet, chainId 97)
 *
 * Domain (from contract constructor):
 *   name="FUN Money", version="1.2.1", chainId=97, verifyingContract=<addr>
 *
 * Type:
 *   PureLoveProof(address user,bytes32 actionHash,uint256 amount,bytes32 evidenceHash,uint256 nonce)
 */

import { TypedDataDomain, TypedDataField, keccak256, toUtf8Bytes, Signer } from 'ethers';

export const FUN_MONEY_CONTRACT = '0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6';
export const BSC_TESTNET_CHAIN_ID = 97;

export const PURE_LOVE_PROOF_DOMAIN: TypedDataDomain = {
  name: 'FUN Money',
  version: '1.2.1',
  chainId: BSC_TESTNET_CHAIN_ID,
  verifyingContract: FUN_MONEY_CONTRACT,
};

export const PURE_LOVE_PROOF_TYPES: Record<string, TypedDataField[]> = {
  PureLoveProof: [
    { name: 'user', type: 'address' },
    { name: 'actionHash', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'evidenceHash', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
  ],
};

export interface PureLoveProofMessage {
  user: string;
  actionHash: string;   // 0x... bytes32
  amount: string;       // wei (string for big numbers)
  evidenceHash: string; // 0x... bytes32
  nonce: string;        // string for big numbers
}

/** keccak256 of action name (e.g. "FUN_REWARD") */
export function getActionHash(actionName: string): string {
  return keccak256(toUtf8Bytes(actionName));
}

/** keccak256 of evidence JSON */
export function getEvidenceHash(evidence: unknown): string {
  return keccak256(toUtf8Bytes(JSON.stringify(evidence)));
}

/** Sign PureLoveProof via wallet/signer. Returns 0x-prefixed signature. */
export async function signPureLoveProof(
  signer: Signer,
  message: PureLoveProofMessage,
): Promise<string> {
  return await signer.signTypedData(
    PURE_LOVE_PROOF_DOMAIN,
    PURE_LOVE_PROOF_TYPES,
    message,
  );
}

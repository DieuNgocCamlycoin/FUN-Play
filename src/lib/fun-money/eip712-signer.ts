/**
 * FUN Money EIP-712 Signer
 * SDK v1.0
 */

import type { TypedDataDomain, TypedDataField, JsonRpcSigner } from 'ethers';
import { verifyTypedData, keccak256, toUtf8Bytes } from 'ethers';
import { getContractAddress, BSC_TESTNET_CONFIG } from './web3-config';

// ===== EIP-712 DOMAIN =====

/**
 * EIP-712 Domain for FUN Money contract
 * 
 * CRITICAL: The version MUST be "1.2.1" to match the deployed contract!
 * Using a different version will cause signature verification to fail.
 */
export function getEip712Domain(): TypedDataDomain {
  return {
    name: "FUN Money",
    version: "1.2.1",  // ⚠️ MUST match contract exactly!
    chainId: BSC_TESTNET_CONFIG.chainId,
    verifyingContract: getContractAddress()
  };
}

// ===== EIP-712 TYPES =====

/**
 * PureLoveProof type structure for EIP-712
 * 
 * MUST match the contract's PPLP_TYPEHASH:
 * keccak256("PureLoveProof(address user,bytes32 actionHash,uint256 amount,bytes32 evidenceHash,uint256 nonce)")
 */
export const PPLP_TYPES: Record<string, TypedDataField[]> = {
  PureLoveProof: [
    { name: "user", type: "address" },       // Recipient address
    { name: "actionHash", type: "bytes32" }, // keccak256(actionType)
    { name: "amount", type: "uint256" },     // Amount in atomic units
    { name: "evidenceHash", type: "bytes32" }, // Evidence hash
    { name: "nonce", type: "uint256" }       // From contract.nonces(user)
  ]
};

// ===== DATA INTERFACES =====

/**
 * PPLP data structure for signing
 */
export interface PPLPData {
  /** Recipient address (who receives tokens) */
  user: string;
  /** keccak256(actionType) - e.g., keccak256("CONTENT_CREATE") */
  actionHash: string;
  /** Amount in atomic units (18 decimals) */
  amount: bigint;
  /** Evidence hash (keccak256 of evidence JSON) */
  evidenceHash: string;
  /** Nonce from contract.nonces(user) - MUST be recipient's nonce! */
  nonce: bigint;
}

/**
 * Signature verification result
 */
export interface SignatureVerification {
  isValid: boolean;
  recoveredAddress: string;
  expectedAddress: string;
  domain: TypedDataDomain;
}

// ===== SIGNING FUNCTIONS =====

/**
 * Create typed data for EIP-712 signing
 */
export function createPPLPTypedData(data: PPLPData) {
  return {
    domain: getEip712Domain(),
    types: PPLP_TYPES,
    primaryType: "PureLoveProof" as const,
    message: {
      user: data.user,
      actionHash: data.actionHash,
      amount: data.amount.toString(),
      evidenceHash: data.evidenceHash,
      nonce: data.nonce.toString()
    }
  };
}

/**
 * Sign PPLP data with MetaMask (EIP-712)
 * 
 * @param signer - JsonRpcSigner from connected wallet (Attester)
 * @param data - PPLP data to sign
 * @returns Signature string
 */
export async function signPPLP(signer: JsonRpcSigner, data: PPLPData): Promise<string> {
  const typedData = createPPLPTypedData(data);
  return await signer.signTypedData(
    typedData.domain,
    typedData.types,
    typedData.message
  );
}

// ===== VERIFICATION FUNCTIONS =====

/**
 * Verify PPLP signature off-chain
 * 
 * @param data - Original PPLP data that was signed
 * @param signature - Signature to verify
 * @returns Recovered signer address
 */
export function verifyPPLPSignature(data: PPLPData, signature: string): string {
  const typedData = createPPLPTypedData(data);
  return verifyTypedData(
    typedData.domain,
    typedData.types,
    typedData.message,
    signature
  );
}

/**
 * Verify signature and return detailed result
 * 
 * Use this to check signature validity before sending transaction
 */
export function verifyPPLPSignatureWithDetails(
  data: PPLPData,
  signature: string,
  expectedSigner: string
): SignatureVerification {
  const typedData = createPPLPTypedData(data);
  
  let recoveredAddress = "";
  let isValid = false;
  
  try {
    recoveredAddress = verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      signature
    );
    isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch (err) {
    recoveredAddress = `Error: ${(err as Error).message}`;
    isValid = false;
  }
  
  return {
    isValid,
    recoveredAddress,
    expectedAddress: expectedSigner,
    domain: typedData.domain
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Create action hash from action type string
 */
export function createActionHash(actionType: string): string {
  return keccak256(toUtf8Bytes(actionType));
}

/**
 * Create evidence hash from evidence data
 */
export function createEvidenceHash(data: {
  actionType: string;
  timestamp: number;
  pillars?: Record<string, number>;
  metadata?: Record<string, unknown>;
}): string {
  const json = JSON.stringify(data);
  return keccak256(toUtf8Bytes(json));
}

/**
 * Prepare all signing data in one call
 * 
 * Convenience function that creates all necessary hashes and prepares
 * the PPLP data structure ready for signing.
 */
export function preparePPLPData(params: {
  recipientAddress: string;
  actionType: string;
  amount: bigint;
  evidenceData: object;
  nonce: bigint;
}): { pplpData: PPLPData; actionHash: string; evidenceHash: string } {
  const actionHash = createActionHash(params.actionType);
  const evidenceHash = createEvidenceHash({
    actionType: params.actionType,
    timestamp: Math.floor(Date.now() / 1000),
    ...params.evidenceData
  });
  
  const pplpData: PPLPData = {
    user: params.recipientAddress,
    actionHash,
    amount: params.amount,
    evidenceHash,
    nonce: params.nonce
  };
  
  return { pplpData, actionHash, evidenceHash };
}

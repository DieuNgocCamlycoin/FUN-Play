/**
 * PPLP Multisig 3-of-3 Configuration
 * GOV Groups: WILL + WISDOM + LOVE
 */

import { DEFAULT_CONTRACT_ADDRESS, BSC_TESTNET_CONFIG } from './web3-config';

// ===== GOV GROUP TYPES =====

export type GovGroupName = 'will' | 'wisdom' | 'love';

export interface GovMember {
  name: string;
  address: string;
}

export interface GovGroup {
  id: GovGroupName;
  label: string;
  labelVi: string;
  emoji: string;
  role: string;
  members: GovMember[];
}

// ===== GOV GROUPS CONFIGURATION =====

export const GOV_GROUPS: Record<GovGroupName, GovGroup> = {
  will: {
    id: 'will',
    label: 'WILL',
    labelVi: 'Ý Chí',
    emoji: '💪',
    role: 'Kỹ thuật & Ý chí',
    members: [
      { name: 'Minh Trí', address: '0xe32d50a0badE4cbD5B0d6120d3A5FD07f63694f1' },
      { name: 'Ánh Nguyệt', address: '0xfd0Da7a744245e7aCECCd786d5a743Ef9291a557' },
      { name: 'Thu Trang', address: '0x02D5578173bd0DB25462BB32A254Cd4b2E6D9a0D' },
    ],
  },
  wisdom: {
    id: 'wisdom',
    label: 'WISDOM',
    labelVi: 'Trí Tuệ',
    emoji: '🌟',
    role: 'Tầm nhìn chiến lược',
    members: [
      { name: 'Bé Giàu', address: '0xCa319fBc39F519822385F2D0a0114B14fa89A301' },
      { name: 'Bé Ngọc', address: '0xDf8249159BB67804D718bc8186f95B75CE5ECbe8' },
      { name: 'Ái Vân', address: '0x5102Ecc4a458a1af76aFA50d23359a712658a402' },
    ],
  },
  love: {
    id: 'love',
    label: 'LOVE',
    labelVi: 'Yêu Thương',
    emoji: '❤️',
    role: 'Nhân ái & Chữa lành',
    members: [
      { name: 'Thanh Tiên', address: '0xE418a560611e80E4239F5513D41e583fC9AC2E6d' },
      { name: 'Bé Kim', address: '0x67464Df3082828b3Cf10C5Cb08FC24A28228EFd1' },
      { name: 'Bé Hà', address: '0x9ec8C51175526BEbB1D04100256De71CF99B7CCC' },
    ],
  },
};

export const REQUIRED_GROUPS: GovGroupName[] = ['will', 'wisdom', 'love'];

export const ALL_ATTESTERS = Object.values(GOV_GROUPS).flatMap(g => g.members);

// ===== HELPER FUNCTIONS =====

/** Get the GOV group for a wallet address */
export function getGroupForAddress(address: string): GovGroupName | null {
  const lower = address.toLowerCase();
  for (const [groupName, group] of Object.entries(GOV_GROUPS)) {
    if (group.members.some(m => m.address.toLowerCase() === lower)) {
      return groupName as GovGroupName;
    }
  }
  return null;
}

/** Check if an address is a registered attester */
export function isAttesterAddress(address: string): boolean {
  return getGroupForAddress(address) !== null;
}

/** Get attester name by address */
export function getAttesterName(address: string): string | null {
  const lower = address.toLowerCase();
  for (const group of Object.values(GOV_GROUPS)) {
    const member = group.members.find(m => m.address.toLowerCase() === lower);
    if (member) return member.name;
  }
  return null;
}

/** Get group info by address */
export function getAttesterInfo(address: string): { group: GovGroupName; name: string; groupLabel: string } | null {
  const lower = address.toLowerCase();
  for (const group of Object.values(GOV_GROUPS)) {
    const member = group.members.find(m => m.address.toLowerCase() === lower);
    if (member) {
      return {
        group: group.id,
        name: member.name,
        groupLabel: `${group.emoji} ${group.label}`,
      };
    }
  }
  return null;
}

// ===== CONTRACT CONSTANTS =====

export const MULTISIG_CONTRACT = {
  address: DEFAULT_CONTRACT_ADDRESS,
  chainId: BSC_TESTNET_CONFIG.chainId,
  threshold: 3,
};

export const EIP712_DOMAIN = {
  name: 'FUN Money',
  version: '1.2.1',
  chainId: BSC_TESTNET_CONFIG.chainId,
  verifyingContract: DEFAULT_CONTRACT_ADDRESS,
};

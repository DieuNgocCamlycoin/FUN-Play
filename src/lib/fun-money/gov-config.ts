/**
 * GOV Group Configuration
 * Retained for governance management UI (GovAttesterManagementTab, etc.)
 * No longer used for multisig signing — FUNMoneyMinter uses authorizedMinters.
 */

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

// ===== GOV GROUPS (FALLBACK for DB) =====

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

// Video categories allowed on FunPlay
export const VIDEO_CATEGORIES = {
  music: {
    id: 'music',
    label: 'Ca nhạc',
    description: 'Video âm nhạc, MV, live performance',
    icon: '🎵',
  },
  light_meditation: {
    id: 'light_meditation',
    label: 'Thiền ánh sáng',
    description: 'Thiền định với ánh sáng chữa lành',
    icon: '✨',
  },
  sound_therapy: {
    id: 'sound_therapy',
    label: 'Liệu pháp âm thanh CAMLY Dương',
    description: 'Liệu pháp âm thanh dẫn thiền',
    icon: '🎧',
  },
  mantra: {
    id: 'mantra',
    label: 'Thần chú (8 câu của Cha)',
    description: '8 câu thần chú thiêng liêng',
    icon: '🙏',
  },
} as const;

export type VideoSubCategory = keyof typeof VIDEO_CATEGORIES;

export const VIDEO_CATEGORY_OPTIONS = Object.values(VIDEO_CATEGORIES);

// Helper to get category label
export const getCategoryLabel = (category: string | null): string => {
  if (!category) return 'Chưa phân loại';
  return VIDEO_CATEGORIES[category as VideoSubCategory]?.label || category;
};

// Helper to get category icon
export const getCategoryIcon = (category: string | null): string => {
  if (!category) return '📺';
  return VIDEO_CATEGORIES[category as VideoSubCategory]?.icon || '📺';
};

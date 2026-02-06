export const styleGradients: Record<string, string> = {
  pop: "from-pink-500 via-purple-500 to-indigo-500",
  rock: "from-red-600 via-orange-500 to-yellow-500",
  jazz: "from-amber-600 via-yellow-500 to-orange-400",
  classical: "from-slate-600 via-gray-500 to-zinc-400",
  electronic: "from-cyan-500 via-blue-500 to-purple-600",
  hiphop: "from-yellow-500 via-orange-500 to-red-500",
  rnb: "from-purple-600 via-pink-500 to-rose-400",
  country: "from-amber-500 via-yellow-400 to-green-500",
  blues: "from-blue-700 via-indigo-600 to-purple-500",
  reggae: "from-green-500 via-yellow-400 to-red-500",
  metal: "from-gray-800 via-red-900 to-black",
  folk: "from-green-600 via-emerald-500 to-teal-400",
  latin: "from-orange-500 via-red-500 to-pink-500",
  soul: "from-purple-700 via-violet-600 to-fuchsia-500",
  funk: "from-yellow-400 via-orange-500 to-pink-500",
  disco: "from-pink-400 via-purple-500 to-cyan-400",
  ambient: "from-teal-400 via-cyan-500 to-blue-400",
  lofi: "from-violet-400 via-purple-400 to-pink-300",
  meditation: "from-indigo-400 via-purple-400 to-violet-500",
  chill: "from-sky-400 via-cyan-400 to-teal-400",
  acoustic: "from-amber-400 via-orange-400 to-yellow-300",
  indie: "from-rose-400 via-pink-400 to-fuchsia-400",
  default: "from-purple-500 via-cyan-500 to-blue-500",
};

// Light gradients for "Nhạc Ánh Sáng" backgrounds
export const lightStyleGradients: Record<string, string> = {
  pop: "from-pink-200 via-rose-100 to-white",
  rock: "from-orange-200 via-amber-100 to-yellow-50",
  jazz: "from-amber-200 via-yellow-100 to-white",
  classical: "from-violet-100 via-purple-50 to-white",
  electronic: "from-cyan-200 via-sky-100 to-white",
  hiphop: "from-yellow-200 via-amber-100 to-orange-50",
  rnb: "from-pink-200 via-fuchsia-100 to-white",
  country: "from-green-200 via-emerald-100 to-white",
  blues: "from-blue-200 via-indigo-100 to-white",
  reggae: "from-green-200 via-lime-100 to-yellow-50",
  metal: "from-slate-200 via-gray-100 to-white",
  folk: "from-emerald-200 via-teal-100 to-white",
  latin: "from-orange-200 via-rose-100 to-pink-50",
  soul: "from-violet-200 via-purple-100 to-white",
  funk: "from-yellow-200 via-orange-100 to-pink-50",
  disco: "from-pink-200 via-purple-100 to-cyan-50",
  ambient: "from-teal-100 via-cyan-50 to-white",
  lofi: "from-violet-200 via-purple-100 to-pink-50",
  meditation: "from-indigo-100 via-purple-50 to-violet-50",
  chill: "from-sky-200 via-cyan-100 to-white",
  acoustic: "from-amber-200 via-orange-100 to-yellow-50",
  indie: "from-rose-200 via-pink-100 to-white",
  default: "from-white via-purple-100 to-cyan-100",
};

export function getStyleGradient(style: string): string {
  const normalizedStyle = style.toLowerCase().trim();
  for (const [key, gradient] of Object.entries(styleGradients)) {
    if (normalizedStyle.includes(key)) {
      return gradient;
    }
  }
  return styleGradients.default;
}

export function getLightStyleGradient(style: string): string {
  const normalizedStyle = style.toLowerCase().trim();
  for (const [key, gradient] of Object.entries(lightStyleGradients)) {
    if (normalizedStyle.includes(key)) {
      return gradient;
    }
  }
  return lightStyleGradients.default;
}

export function detectMusicStyle(text: string): string {
  if (!text) return "default";
  const normalizedText = text.toLowerCase();
  for (const key of Object.keys(styleGradients)) {
    if (key !== "default" && normalizedText.includes(key)) {
      return key;
    }
  }
  const keywordMap: Record<string, string[]> = {
    meditation: ["healing", "mantra", "zen", "mindfulness", "calm"],
    chill: ["relax", "peaceful", "gentle", "soothing"],
    lofi: ["lo-fi", "study", "coffee"],
    electronic: ["edm", "techno", "house", "trance", "dubstep"],
    hiphop: ["hip-hop", "rap", "trap", "drill"],
    rnb: ["r&b", "rhythm"],
    acoustic: ["guitar", "unplugged"],
  };
  for (const [style, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => normalizedText.includes(kw))) {
      return style;
    }
  }
  return "default";
}

export function getGradientFromId(id: string): string {
  if (!id) return styleGradients.default;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const gradientValues = Object.values(styleGradients).filter(g => g !== styleGradients.default);
  const index = Math.abs(hash) % gradientValues.length;
  return gradientValues[index];
}

export function getMusicGradient(
  style?: string | null,
  title?: string | null,
  description?: string | null,
  id?: string | null
): string {
  if (style) {
    const gradient = getStyleGradient(style);
    if (gradient !== styleGradients.default) return gradient;
  }
  if (title) {
    const detectedStyle = detectMusicStyle(title);
    if (detectedStyle !== "default") return styleGradients[detectedStyle];
  }
  if (description) {
    const detectedStyle = detectMusicStyle(description);
    if (detectedStyle !== "default") return styleGradients[detectedStyle];
  }
  if (id) return getGradientFromId(id);
  return styleGradients.default;
}

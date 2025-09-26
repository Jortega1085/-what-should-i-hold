export interface Theme {
  bg: string;
  cardBg: string;
  cardFace: string;
  cardBack: string;
  primaryBtn: string;
  secondaryBtn: string;
  successBtn: string;
  dangerBtn: string;
  panel: string;
  panelGlow: string;
  text: string;
  textMuted: string;
  neonText: string;
  accent: string;
  accentBorder: string;
  border: string;
  shadow: string;
  cardShadow: string;
  glassPanel: string;
  feltOverlay: string;
}

export type ThemeName = 'light' | 'dark' | 'casino';

export const themes: Record<ThemeName, Theme> = {
  light: {
    bg: "bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100",
    cardBg: "bg-white",
    cardFace: "bg-white",
    cardBack: "bg-gradient-to-br from-blue-600 to-indigo-700",
    primaryBtn: "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
    secondaryBtn: "bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 hover:from-slate-700 hover:via-gray-800 hover:to-slate-900 shadow-lg shadow-slate-500/25",
    successBtn: "bg-gradient-to-r from-emerald-600 via-green-700 to-teal-700 hover:from-emerald-700 hover:via-green-800 hover:to-teal-800 shadow-lg shadow-emerald-500/25",
    dangerBtn: "bg-gradient-to-r from-red-600 via-rose-700 to-red-700 hover:from-red-700 hover:via-rose-800 hover:to-red-800 shadow-lg shadow-red-500/25",
    panel: "bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-200/60",
    panelGlow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    text: "text-slate-900",
    textMuted: "text-slate-600",
    neonText: "text-blue-500",
    accent: "from-sky-400 via-blue-500 to-indigo-500",
    accentBorder: "ring-2 ring-blue-300/60",
    border: "border-slate-200/80",
    shadow: "shadow-2xl shadow-slate-200/40",
    cardShadow: "shadow-2xl shadow-slate-300/40 hover:shadow-3xl hover:shadow-slate-400/50",
    glassPanel: "bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-2xl border border-white/40",
    feltOverlay: "bg-white/40",
  },
  dark: {
    bg: "bg-gradient-to-br from-slate-900 via-gray-900/95 to-black",
    cardBg: "bg-white",
    cardFace: "bg-gradient-to-br from-white via-slate-100 to-slate-200",
    cardBack: "bg-gradient-to-br from-indigo-700 to-purple-900",
    primaryBtn: "bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-700 hover:from-violet-700 hover:via-purple-800 hover:to-indigo-800 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30",
    secondaryBtn: "bg-gradient-to-r from-slate-700 via-gray-800 to-slate-900 hover:from-slate-600 hover:via-gray-700 hover:to-slate-800 shadow-lg shadow-slate-500/25",
    successBtn: "bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-700 hover:from-emerald-700 hover:via-teal-800 hover:to-cyan-800 shadow-lg shadow-emerald-500/25",
    dangerBtn: "bg-gradient-to-r from-red-600 via-pink-700 to-rose-700 hover:from-red-700 hover:via-pink-800 hover:to-rose-800 shadow-lg shadow-red-500/25",
    panel: "bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/60",
    panelGlow: "shadow-[0_0_30px_rgba(99,102,241,0.25)]",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    neonText: "text-violet-400",
    accent: "from-fuchsia-500 via-violet-500 to-indigo-600",
    accentBorder: "ring-2 ring-violet-400/50",
    border: "border-slate-700/80",
    shadow: "shadow-2xl shadow-black/40",
    cardShadow: "shadow-2xl shadow-black/60 hover:shadow-3xl hover:shadow-black/80",
    glassPanel: "bg-gradient-to-br from-slate-800/90 via-slate-900/70 to-slate-800/90 backdrop-blur-2xl border border-slate-700/40",
    feltOverlay: "bg-slate-900/40",
  },
  casino: {
    bg: "bg-[radial-gradient(circle_at_center,_#040916_0%,_#02030c_55%,_#000000_100%)]",
    cardBg: "bg-white",
    cardFace: "bg-gradient-to-br from-white via-slate-50 to-gray-200",
    cardBack: "bg-[radial-gradient(circle_at_center,_#16213e_0%,_#0f172a_60%,_#020617_100%)]",
    primaryBtn: "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-300 hover:via-amber-400 hover:to-orange-400 text-slate-900 shadow-[0_0_18px_rgba(250,204,21,0.65)]",
    secondaryBtn: "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.45)]",
    successBtn: "bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 hover:from-emerald-300 hover:via-green-400 hover:to-lime-400 text-slate-900 shadow-[0_0_22px_rgba(74,222,128,0.5)]",
    dangerBtn: "bg-gradient-to-r from-rose-500 via-red-600 to-orange-600 hover:from-rose-400 hover:via-red-500 hover:to-orange-500 text-white shadow-[0_0_22px_rgba(248,113,113,0.55)]",
    panel: "bg-slate-900/60 backdrop-blur-lg border border-slate-700/60 shadow-[0_0_35px_rgba(30,64,175,0.35)]",
    panelGlow: "shadow-[0_0_40px_rgba(12,74,110,0.55)]",
    text: "text-slate-100",
    textMuted: "text-slate-400",
    neonText: "text-amber-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]",
    accent: "from-amber-400 via-yellow-500 to-amber-400",
    accentBorder: "ring-2 ring-amber-400/60",
    border: "border-slate-700/60",
    shadow: "shadow-[0_25px_45px_rgba(2,6,23,0.65)]",
    cardShadow: "shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.85)]",
    glassPanel: "bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.85),_rgba(8,11,24,0.9))] backdrop-blur-xl border border-blue-500/20",
    feltOverlay: "bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.25),_rgba(8,47,73,0.45)_60%,_rgba(2,6,23,0.85))]",
  }
};

export function getTheme(themeName: ThemeName): Theme {
  return themes[themeName];
}

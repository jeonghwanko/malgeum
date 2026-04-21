export const COLORS = {
  // Primary
  primary: "#4A90D9",
  primaryLight: "#74B9FF",

  // Status — 신호등 시스템
  safe: "#10B981",
  safeDark: "#059669",
  safeMild: "#65A30D",
  caution: "#F59E0B",
  cautionDark: "#D97706",
  warn: "#EF4444",
  warnDark: "#DC2626",
  danger: "#B91C1C",

  // Background
  bgLight: "#F5F0EB",
  bgDark: "#0F172A",
  bgDarkAlt: "#1E293B",

  // Text
  textDark: "#1E293B",
  textDarkPrimary: "#0F172A",
  textLight: "#F1F5F9",
  textMuted: "#94A3B8",
  textSecondary: "#64748B",
  textTertiary: "#475569",

  // Border
  borderLight: "#E2E8F0",
  borderMedium: "#CBD5E1",

  // Glass
  glassLight: "rgba(255,255,255,0.55)",
  glassDark: "rgba(15,20,35,0.55)",
  glassWarm: "rgba(245,240,235,0.6)",
  glassCard: "rgba(255,255,255,0.68)",
  glassCardStrong: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.35)",
  glassBorderDark: "rgba(255,255,255,0.08)",

  // Accent
  gold: "#FFE066",
  goldWarm: "#FFC107",
  orange: "#FF9A56",

  // Misc
  white: "#FFFFFF",
  kakaoYellow: "#FEE500",
} as const;

export type StatusLevel = "safe" | "caution" | "warn";

export function getStatusColor(status: StatusLevel): string {
  switch (status) {
    case "safe":
      return COLORS.safe;
    case "caution":
      return COLORS.caution;
    case "warn":
      return COLORS.warn;
  }
}

export function getStatusBgColor(status: StatusLevel): string {
  switch (status) {
    case "safe":
      return "rgba(16,185,129,0.10)";
    case "caution":
      return "rgba(245,158,11,0.12)";
    case "warn":
      return "rgba(239,68,68,0.10)";
  }
}

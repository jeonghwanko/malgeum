import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { GameStats } from "@/types/predictionGame";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { EVENT_CARD_BG, EVENT_CARD_BORDER, EVENT_CARD_BG_LIGHT, EVENT_CARD_BORDER_LIGHT, LIGHT_TEXT, LIGHT_TEXT_SUB, LIGHT_TEXT_HINT, LIGHT_DIVIDER, LIGHT_MARGIN_RESET } from "./cardStyle";
import { t } from "@/i18n";

interface Props {
  stats: GameStats;
  palette?: AdaptivePalette;
  variant?: "dark" | "light";
}

export function GameStatsCard({ stats, palette, variant = "dark" }: Props) {
  const isLight = variant === "light";
  const cardBg = isLight ? EVENT_CARD_BG_LIGHT : (palette?.tabBarBg ?? EVENT_CARD_BG);
  const cardBorder = isLight ? EVENT_CARD_BORDER_LIGHT : (palette?.cardBorder ?? EVENT_CARD_BORDER);
  const textColor = isLight ? LIGHT_TEXT : "#FFFFFF";
  const labelColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.7)";
  const hintColor = isLight ? LIGHT_TEXT_HINT : "rgba(255,255,255,0.55)";
  const subColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.5)";
  const divColor = isLight ? LIGHT_DIVIDER : (palette?.dividerColor ?? "rgba(255,255,255,0.12)");

  const decided = stats.totalWins + stats.totalLosses;

  function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
      <View style={styles.cell}>
        <Text style={[styles.cellLabel, { color: hintColor }]} maxFontSizeMultiplier={1.2}>
          {label}
        </Text>
        <Text style={[styles.cellValue, { color: textColor }]} maxFontSizeMultiplier={1.2}>
          {value}
        </Text>
        {sub ? (
          <Text style={[styles.cellSub, { color: subColor }]} maxFontSizeMultiplier={1.2}>
            {sub}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isLight && LIGHT_MARGIN_RESET]}>
      {stats.dailyStreak >= 2 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakText} maxFontSizeMultiplier={1.2}>
            {t("gameStats.dailyStreak", { days: stats.dailyStreak })}
          </Text>
        </View>
      )}

      <View style={styles.weekRow}>
        <Text style={[styles.weekLabel, { color: labelColor }]} maxFontSizeMultiplier={1.2}>
          {t("gameStats.weekLabel")}
        </Text>
        <Text style={[styles.weekValue, { color: textColor }]} maxFontSizeMultiplier={1.2}>
          {t("gameStats.weekRecord", { wins: stats.weekWins, losses: stats.weekLosses })}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: divColor }]} />

      <View style={styles.gridRow}>
        <StatCell
          label={t("event.stats.winRate")}
          value={`${stats.winRate}%`}
          sub={decided === 0 ? t("gameStats.noRecord") : t("gameStats.totalRecord", { wins: stats.totalWins, losses: stats.totalLosses })}
        />
        <StatCell
          label={t("gameStats.currentStreak")}
          value={`${stats.currentStreak}`}
          sub={stats.currentStreak >= 3 ? t("gameStats.onStreak") : ""}
        />
        <StatCell
          label={t("event.stats.bestStreak")}
          value={`${stats.bestStreak}`}
          sub={stats.bestStreak === 0 ? t("gameStats.noRecord") : t("gameStats.bestRecord")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
    backgroundColor: EVENT_CARD_BG,
    borderColor: EVENT_CARD_BORDER,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  weekValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  gridRow: { flexDirection: "row", justifyContent: "space-between" },
  cell: { flex: 1, alignItems: "center", gap: 4 },
  cellLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  cellValue: {
    fontSize: 26,
    letterSpacing: -0.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cellSub: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  streakBanner: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,158,11,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D97706",
    letterSpacing: -0.2,
  },
});

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { PredictionEntry } from "@/types/predictionGame";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { dateKey } from "@/utils/date";
import { EVENT_CARD_BG, EVENT_CARD_BORDER, EVENT_CARD_BG_LIGHT, EVENT_CARD_BORDER_LIGHT, LIGHT_TEXT_SUB, LIGHT_MARGIN_RESET } from "./cardStyle";
import { t } from "@/i18n";

interface Props {
  entries: PredictionEntry[];
  palette?: AdaptivePalette;
  variant?: "dark" | "light";
}

const DAYS = 7;

interface Cell {
  key: string;
  label: string;
  entry: PredictionEntry | null;
}

function buildCells(entries: PredictionEntry[]): Cell[] {
  const today = new Date();
  // O(1) 조회를 위해 entries를 date 키 맵으로 한 번만 인덱싱
  const byDate = new Map<string, PredictionEntry>();
  for (const e of entries) byDate.set(e.date, e);

  const cells: Cell[] = [];
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dateKey(d);
    cells.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      entry: byDate.get(key) ?? null,
    });
  }
  return cells;
}

const LIGHT_DOT = {
  dotEmpty: { backgroundColor: "rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.12)" },
  dotPending: { backgroundColor: "rgba(250,204,21,0.3)", borderColor: "rgba(200,160,0,0.5)" },
};

export function PredictionHistoryList({ entries, palette, variant = "dark" }: Props) {
  const cells = useMemo(() => buildCells(entries), [entries]);
  const isLight = variant === "light";
  const cardBg = isLight ? EVENT_CARD_BG_LIGHT : (palette?.tabBarBg ?? EVENT_CARD_BG);
  const cardBorder = isLight ? EVENT_CARD_BORDER_LIGHT : (palette?.cardBorder ?? EVENT_CARD_BORDER);
  const labelColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.7)";
  const dateLabelColor = isLight ? LIGHT_TEXT_SUB : "rgba(255,255,255,0.6)";

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isLight && LIGHT_MARGIN_RESET]}>
      <Text style={[styles.title, { color: labelColor }]} maxFontSizeMultiplier={1.2}>
        {t("predHistory.last7days")}
      </Text>
      <View style={styles.row}>
        {cells.map((c) => (
          <View key={c.key} style={styles.cell}>
            <View style={[styles.dot, getDotStyle(c.entry, isLight)]}>
              <Text style={[styles.dotText, isLight && { color: "#1E293B" }]} maxFontSizeMultiplier={1.0}>
                {getDotLabel(c.entry)}
              </Text>
            </View>
            <Text style={[styles.dateLabel, { color: dateLabelColor }]} maxFontSizeMultiplier={1.0}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getDotLabel(entry: PredictionEntry | null): string {
  if (!entry) return "·";
  if (!entry.result) return "?";
  if (entry.result === "win") return "W";
  if (entry.result === "lose") return "L";
  return "T";
}

function getDotStyle(entry: PredictionEntry | null, isLight: boolean) {
  if (!entry) return isLight ? LIGHT_DOT.dotEmpty : styles.dotEmpty;
  if (!entry.result) return isLight ? LIGHT_DOT.dotPending : styles.dotPending;
  if (entry.result === "win") return styles.dotWin;
  if (entry.result === "lose") return styles.dotLose;
  return styles.dotTie;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    backgroundColor: EVENT_CARD_BG,
    borderColor: EVENT_CARD_BORDER,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cell: { alignItems: "center", gap: 6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dotText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  dotEmpty: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  dotPending: {
    backgroundColor: "rgba(250,204,21,0.25)",
    borderColor: "rgba(250,204,21,0.55)",
  },
  dotWin: {
    backgroundColor: "rgba(16,185,129,0.6)",
    borderColor: "rgba(16,185,129,0.85)",
  },
  dotLose: {
    backgroundColor: "rgba(239,68,68,0.55)",
    borderColor: "rgba(239,68,68,0.8)",
  },
  dotTie: {
    backgroundColor: "rgba(148,163,184,0.5)",
    borderColor: "rgba(148,163,184,0.75)",
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
});

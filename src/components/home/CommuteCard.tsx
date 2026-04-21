import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, LayoutAnimation } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { getCommuteComparison } from "@/utils/recommendations";
import { getFeelLabel, formatTemp } from "@/utils/weather";
import { getConditionEmoji } from "@/constants/weather-assets";
import { useSubwayArrival } from "@/hooks/useSubwayArrival";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";

// 의미 색상 — 기온 변화 방향
const TEMP_RISE_COLOR = "#F59E0B";
const TEMP_DROP_COLOR = "#60A5FA";

interface CommuteCardProps {
  palette: AdaptivePalette;
}

export function CommuteCard({ palette: ap }: CommuteCardProps) {
  const { state } = useWeatherContext();
  const [expanded, setExpanded] = useState(false);
  const u = state.tempUnit;
  const { arrivals } = useSubwayArrival(state.commuteTime.subwayStation);

  const comparison = useMemo(
    () => getCommuteComparison(state.hourlyForecast, state.commuteTime.departure, state.commuteTime.return),
    [state.hourlyForecast, state.commuteTime.departure, state.commuteTime.return],
  );

  const toggleExpand = useCallback(() => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  }, []);

  const checklist = useMemo(() => {
    if (!comparison) return [];
    const { departure, tempDiff, needUmbrella } = comparison;
    const items: { icon: string; text: string }[] = [];
    const fl = departure.feelsLike;

    if (fl <= 10) items.push({ icon: "🧥", text: t("commuteCard.heavyCoat") });
    else if (fl <= 16) items.push({ icon: "🧶", text: t("commuteCard.cardigan") });
    else if (fl <= 22) items.push({ icon: "👕", text: t("commuteCard.thinLayer") });
    else items.push({ icon: "👕", text: t("commuteCard.tshirtOk") });

    if (needUmbrella) items.push({ icon: "☂️", text: t("commuteCard.bringUmbrella") });
    if (Math.abs(tempDiff) >= 5) {
      items.push({
        icon: "🌡️",
        text: t("commuteCard.eveningTempDiff", { diff: Math.abs(tempDiff), dir: tempDiff < 0 ? t("commuteCard.colder") : t("commuteCard.warmer") }),
      });
    }
    if (state.airQuality && state.airQuality.aqi >= 3) {
      items.push({ icon: "😷", text: t("commuteCard.bringMask") });
    }

    // 지하철 도착정보 (설정된 역이 있고 데이터가 있을 때)
    if (arrivals.length > 0) {
      const next = arrivals[0];
      const min = Math.ceil(next.arrivalSec / 60);
      const rainNow = needUmbrella;
      const subwayText = rainNow
        ? t("commuteCard.subwayRain", { line: next.line, min })
        : t("commuteCard.subwayArrival", { line: next.line, min });
      items.push({ icon: "🚇", text: subwayText });
    }

    return items;
  }, [comparison, state.airQuality?.aqi, arrivals]);

  if (!comparison) return null;

  const { departure, returnTrip, tempDiff, needUmbrella, recommendation } = comparison;
  const depHour = state.commuteTime.departure.split(":")[0];
  const retHour = state.commuteTime.return.split(":")[0];
  const depEmoji = getConditionEmoji(departure.condition);
  const retEmoji = getConditionEmoji(returnTrip.condition);

    const nb = ap.notebook;
  const isNotebook = nb && nb.fontFamily !== "system";

  if (isNotebook && nb) {
    return <NotebookCommute ap={ap} nb={nb} depHour={depHour} retHour={retHour} depEmoji={depEmoji} retEmoji={retEmoji} departure={departure} returnTrip={returnTrip} tempDiff={tempDiff} recommendation={recommendation} expanded={expanded} checklist={checklist} toggleExpand={toggleExpand} u={u} />;
  }

  const shadowColor = ap.textShadowColor ?? "rgba(0,0,0,0.5)";
  const shadowR = (ap.textShadowIntensity ?? 1) * 3;
  const glowColor = ap.textGlowColor ?? "transparent";
  const glowR = ap.textGlowRadius ?? 0;
  const accent = ap.accent;

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleExpand} accessibilityRole="button" accessibilityLabel={t("commuteCard.a11yLabel")} accessibilityState={{ expanded }} style={({ pressed }) => [styles.glass, {
        backgroundColor: ap.cardBg ?? "rgba(0,0,0,0.30)",
        borderColor: ap.cardBorder ?? "rgba(255,255,255,0.20)",
      }, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
        <View style={styles.header}>
          {accent && <View style={[styles.accentBar, { backgroundColor: accent }]} />}
          <Text style={[styles.expandHint, { color: ap.textTertiary ?? "rgba(255,255,255,0.5)" }]}>
            {expanded ? t("commuteCard.collapse") : t("commuteCard.expand")}
          </Text>
        </View>

        <View style={styles.slotsRow}>
          <SlotGlass label={t("commuteCard.depSlot", { hour: depHour })} emoji={depEmoji} temp={departure.temp} feelsLike={departure.feelsLike} precipitation={departure.precipitation} ap={ap} shadowColor={shadowColor} shadowR={shadowR} glowColor={glowColor} glowR={glowR} u={u} />

          <View style={styles.arrow}>
            <Text style={[styles.arrowText, { color: ap.textTertiary ?? "rgba(255,255,255,0.3)" }]}>→</Text>
            {tempDiff !== 0 && (
              <Text style={[styles.diffText, { color: tempDiff > 0 ? TEMP_RISE_COLOR : TEMP_DROP_COLOR }]}>
                {tempDiff > 0 ? "+" : ""}{tempDiff}°
              </Text>
            )}
          </View>

          <SlotGlass label={t("commuteCard.retSlot", { hour: retHour })} emoji={retEmoji} temp={returnTrip.temp} feelsLike={returnTrip.feelsLike} precipitation={returnTrip.precipitation} ap={ap} shadowColor={shadowColor} shadowR={shadowR} glowColor={glowColor} glowR={glowR} u={u} />
        </View>

        <View style={[styles.recoPill, {
          backgroundColor: ap.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.30)",
        }]}>
          <Text style={[styles.recoText, {
            color: ap.textSecondary ?? "rgba(255,255,255,0.88)",
            textShadowColor: shadowColor, textShadowRadius: shadowR * 0.7,
          }]}>
            {recommendation}
          </Text>
        </View>

        {expanded && checklist.length > 0 && (
          <View style={[styles.checklistArea, { borderTopColor: ap.cardBorder ?? "rgba(255,255,255,0.1)" }]}>
            {checklist.map((item) => (
              <View key={item.icon + item.text} style={styles.checkRow}>
                <Text style={styles.checkIcon}>{item.icon}</Text>
                <Text style={[styles.checkText, {
                  color: ap.textSecondary ?? "rgba(255,255,255,0.8)",
                  textShadowColor: shadowColor, textShadowRadius: shadowR * 0.5,
                }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}

      </Pressable>
    </View>
  );
}

function SlotGlass({ label, emoji, temp, feelsLike, precipitation, ap, shadowColor, shadowR, glowColor, glowR, u }: {
  label: string; emoji: string; temp: number; feelsLike: number; precipitation: number;
  ap: AdaptivePalette; shadowColor: string; shadowR: number; glowColor: string; glowR: number; u: "C" | "F";
}) {
  return (
    <View style={styles.slot}>
      <Text style={[styles.slotLabel, { color: ap.textTertiary ?? "rgba(255,255,255,0.5)" }]}>{label}</Text>
      <Text style={styles.slotEmoji}>{emoji}</Text>
      <View style={{
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowR > 0 ? 0.6 : 0,
        shadowRadius: glowR * 0.5,
      }}>
        <Text style={[styles.slotTemp, {
          color: ap.textPrimary ?? "#FFFFFF",
          fontWeight: ap.tempFontWeight ?? "800",
          textShadowColor: shadowColor, textShadowRadius: shadowR,
        }]}>
          {formatTemp(temp, u)}
        </Text>
      </View>
      <Text style={[styles.slotFeel, { color: ap.textTertiary ?? "rgba(255,255,255,0.6)" }]}>
        {getFeelLabel(feelsLike)}
      </Text>
      {precipitation >= 30 && (
        <Text style={[styles.slotRain, { color: precipitation >= 50 ? TEMP_DROP_COLOR : TEMP_RISE_COLOR }]}>
          {precipitation}%
        </Text>
      )}
    </View>
  );
}

function NotebookCommute({ ap, nb, depHour, retHour, depEmoji, retEmoji, departure, returnTrip, tempDiff, recommendation, expanded, checklist, toggleExpand, u }: {
  ap: AdaptivePalette; nb: AdaptivePalette["notebook"];
  depHour: string; retHour: string; depEmoji: string; retEmoji: string;
  departure: { temp: number; feelsLike: number; precipitation: number };
  returnTrip: { temp: number; feelsLike: number; precipitation: number };
  tempDiff: number; recommendation: string; expanded: boolean;
  checklist: { icon: string; text: string }[];
  toggleExpand: () => void; u: "C" | "F";
}) {
  const fontFamily = nb.fontFamily === "system" ? undefined : nb.fontFamily;
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 } as const,
    textShadowRadius: 10,
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleExpand} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <View style={styles.slotsRow}>
          <View style={styles.slot}>
            <Text style={[styles.noteSlotLabel, { fontFamily, ...shadow, textShadowRadius: 6 }]}>{t("commuteCard.depSlot", { hour: depHour })}</Text>
            <Text style={styles.slotEmoji}>{depEmoji}</Text>
            <Text style={[styles.noteSlotTemp, { fontFamily, ...shadow }]}>{formatTemp(departure.temp, u)}</Text>
            <Text style={[styles.noteSlotFeel, { fontFamily, ...shadow, textShadowRadius: 6 }]}>{getFeelLabel(departure.feelsLike)}</Text>
          </View>

          <View style={styles.arrow}>
            <Text style={[styles.noteArrow, { fontFamily, ...shadow }]}>→</Text>
            {tempDiff !== 0 && (
              <Text style={[styles.noteDiff, { fontFamily, color: tempDiff > 0 ? TEMP_RISE_COLOR : TEMP_DROP_COLOR, ...shadow }]}>
                {tempDiff > 0 ? "+" : ""}{tempDiff}°
              </Text>
            )}
          </View>

          <View style={styles.slot}>
            <Text style={[styles.noteSlotLabel, { fontFamily, ...shadow, textShadowRadius: 6 }]}>{t("commuteCard.retSlot", { hour: retHour })}</Text>
            <Text style={styles.slotEmoji}>{retEmoji}</Text>
            <Text style={[styles.noteSlotTemp, { fontFamily, ...shadow }]}>{formatTemp(returnTrip.temp, u)}</Text>
            <Text style={[styles.noteSlotFeel, { fontFamily, ...shadow, textShadowRadius: 6 }]}>{getFeelLabel(returnTrip.feelsLike)}</Text>
          </View>
        </View>

        <Text style={[styles.noteReco, { fontFamily, ...shadow }]}>
          {recommendation}
        </Text>

        {expanded && checklist.length > 0 && (
          <View style={styles.noteCheckArea}>
            {checklist.map((item) => (
              <Text key={item.icon + item.text} style={[styles.noteCheckText, { fontFamily, ...shadow, textShadowRadius: 6 }]}>
                {item.icon} {item.text}
              </Text>
            ))}
          </View>
        )}

        <Text style={[styles.noteExpandHint, { fontFamily, ...shadow, textShadowRadius: 4 }]}>
          {expanded ? t("commuteCard.collapse") : t("commuteCard.expand")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, marginBottom: 16, zIndex: 1 },

  glass: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
  },
  accentBar: { width: 24, height: 3, borderRadius: 1.5 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: "600",
  },

  slotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  slot: { flex: 1, alignItems: "center", gap: 2 },
  slotEmoji: { fontSize: 24, marginVertical: 2 },

  slotLabel: { fontSize: 11, fontWeight: "600" },
  slotTemp: {
    fontSize: 22,
    textShadowOffset: { width: 0, height: 1 },
  },
  slotFeel: { fontSize: 12 },
  slotRain: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  arrow: { alignItems: "center", paddingHorizontal: 8 },
  arrowText: { fontSize: 18 },
  diffText: { fontSize: 12, fontWeight: "700", marginTop: 2 },

  recoPill: {
    alignSelf: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 12,
  },
  recoText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textShadowOffset: { width: 0, height: 1 },
  },

  checklistArea: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkIcon: { fontSize: 16 },
  checkText: {
    fontSize: 13,
    fontWeight: "500",
    textShadowOffset: { width: 0, height: 1 },
  },

  noteSlotLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "normal",
  },
  noteSlotTemp: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "normal",
  },
  noteSlotFeel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "normal",
  },
  noteArrow: { fontSize: 22, color: "rgba(255,255,255,0.5)", fontWeight: "normal" },
  noteDiff: { fontSize: 16, fontWeight: "normal", marginTop: 2 },
  noteReco: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 14,
    fontWeight: "normal",
  },
  noteCheckArea: {
    marginTop: 16,
    gap: 6,
  },
  noteCheckText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "normal",
  },
  noteExpandHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "normal",
  },
});

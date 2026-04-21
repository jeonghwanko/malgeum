import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { usePalette } from "@/context/PaletteContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { formatTemp } from "@/utils/weather";
import type { WeatherCondition } from "@/types/weather";

interface DayRowProps {
  day: string;
  date: string;
  condition: WeatherCondition;
  tempLow: number;
  tempHigh: number;
  weekMin: number;
  weekMax: number;
  action?: { text: string; variant: "safe" | "caution" | "hot" | "default" };
  tip?: string;
  isToday: boolean;
}

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: "☀️", clouds: "⛅", rain: "🌧️", drizzle: "🌦️",
  thunderstorm: "⛈️", snow: "❄️", fog: "🌫️", dust: "😷",
};

const ACTION_BADGE: Record<string, { bg: string; color: string }> = {
  safe: { bg: "#10B981", color: "#FFFFFF" },
  caution: { bg: "#4A90D9", color: "#FFFFFF" },
  hot: { bg: "#F59E0B", color: "#FFFFFF" },
  default: { bg: "#94A3B8", color: "#FFFFFF" },
};

export function DayRow({
  day, date, condition, tempLow, tempHigh,
  weekMin, weekMax, action, tip, isToday,
}: DayRowProps) {
  const ap = usePalette();
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const accentColor = ap?.accent ?? "rgba(255,255,255,0.6)";
  const range = weekMax - weekMin || 1;
  const barLeft = ((tempLow - weekMin) / range) * 100;
  const barWidth = ((tempHigh - tempLow) / range) * 100;
  const badge = action ? ACTION_BADGE[action.variant] ?? ACTION_BADGE.default : null;

  return (
    <View style={[styles.wrapper, isToday && { borderColor: accentColor + "40", borderWidth: 1 }]}>
      <View style={styles.row}>
        <Text style={[styles.day, isToday && { color: accentColor }]}>{day}</Text>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.icon}>{CONDITION_EMOJI[condition] ?? "🌤️"}</Text>
        <Text style={styles.low}>{formatTemp(tempLow, u)}</Text>
        <View style={[styles.bar, { backgroundColor: accentColor + "22" }]}>
          <View style={[styles.barFill, { left: `${barLeft}%`, width: `${Math.max(barWidth, 8)}%`, backgroundColor: accentColor + "99" }]} />
        </View>
        <Text style={styles.high}>{formatTemp(tempHigh, u)}</Text>
        {action && badge ? (
          <View style={[styles.actionBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.actionText, { color: badge.color }]}>{action.text}</Text>
          </View>
        ) : (
          <View style={styles.actionSpacer} />
        )}
      </View>
      {tip ? (
        <Text style={styles.tip} numberOfLines={1}>{tip}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },
  day: {
    width: 32,
    fontSize: 15,
    color: "#1E293B",
  },
  date: {
    width: 36,
    fontSize: 15,
    color: "#64748B",
  },
  icon: {
    width: 30,
    fontSize: 15,
    textAlign: "center",
  },
  low: {
    width: 34,
    fontSize: 15,
    color: "#64748B",
    textAlign: "right",
    marginRight: 6,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)", // fallback — 런타임에 accent 틴팅으로 오버라이드
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    height: "100%",
    borderRadius: 3,
  },
  high: {
    width: 34,
    fontSize: 15,
    color: "#1E293B",
    textAlign: "left",
    marginLeft: 6,
  },
  actionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    marginLeft: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionSpacer: {
    width: 72,
    marginLeft: 6,
  },
  tip: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
    paddingLeft: 2,
  },
});

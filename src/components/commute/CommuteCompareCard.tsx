import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ArrowRight } from "phosphor-react-native";
import { usePalette } from "@/context/PaletteContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { formatTemp } from "@/utils/weather";
import type { WeatherCondition } from "@/types/weather";

interface SlotData {
  label: string;
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
  description: string; // 감성 라벨: "선선해", "따뜻함" 등
}

interface CommuteCompareCardProps {
  departure: SlotData;
  returnTrip: SlotData;
}

const EMOJI: Record<WeatherCondition, string> = {
  clear: "☀️", clouds: "⛅", rain: "🌧️", drizzle: "🌦️",
  thunderstorm: "⛈️", snow: "❄️", fog: "🌫️", dust: "😷",
};

function SlotView({ slot, tempUnit = "C" }: { slot: SlotData; tempUnit?: import("@/types/settings").TempUnit }) {
  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{slot.label}</Text>
      <Text style={styles.slotIcon}>{EMOJI[slot.condition] ?? "🌤️"}</Text>
      <Text style={styles.slotTemp}>{formatTemp(slot.temp, tempUnit)}</Text>
      {slot.precipitation > 0 && (
        <Text style={[styles.slotRain, slot.precipitation >= 50 && { color: "#E67E22" }]}>
          🌧 {slot.precipitation}%
        </Text>
      )}
      <Text style={styles.slotFeel}>{slot.description}</Text>
    </View>
  );
}

export function CommuteCompareCard({ departure, returnTrip }: CommuteCompareCardProps) {
  const ap = usePalette();
  const { state } = useWeatherContext();
  const accent = ap?.accent ?? "#4A90D9";

  return (
    <View style={styles.compare}>
      <View style={styles.slotBox}>
        <SlotView slot={departure} tempUnit={state.tempUnit} />
      </View>
      <ArrowRight size={20} color={accent} />
      <View style={styles.slotBox}>
        <SlotView slot={returnTrip} tempUnit={state.tempUnit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  slotBox: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  slot: { alignItems: "center" },
  slotLabel: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 10, marginTop: 4 },
  slotIcon: { fontSize: 32, marginBottom: 4 },
  slotTemp: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 2, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  slotRain: { fontSize: 12, color: "#74B9FF", marginBottom: 2 },
  slotFeel: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.75)", marginTop: 2 },
});

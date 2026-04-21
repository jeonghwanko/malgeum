import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Thermometer } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { usePalette } from "@/context/PaletteContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { formatTemp, tempUnitSuffix } from "@/utils/weather";
import { t } from "@/i18n";

interface TempDropCardProps {
  fromTemp: number;
  toTemp: number;
  tempDiff: number;
}

export function TempDropCard({ fromTemp, toTemp, tempDiff }: TempDropCardProps) {
  const ap = usePalette();
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const nb = ap?.notebook;
  const fontFamily = nb && nb.fontFamily !== "system" ? nb.fontFamily : undefined;
  const isDropping = tempDiff < 0;
  const absDiff = u === "F" ? Math.round(Math.abs(tempDiff) * 9 / 5) : Math.abs(tempDiff);

  const iconColor = isDropping ? COLORS.primaryLight : "#FF9A56";
  const iconBoxBg = isDropping ? "rgba(116,185,255,0.15)" : "rgba(255,154,86,0.15)";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
          <Thermometer size={24} weight="fill" color={iconColor} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { fontFamily, fontWeight: "normal" }]}>
            {t("tempDrop.title", { diff: absDiff, unit: tempUnitSuffix(u), dir: isDropping ? t("tempDrop.drop") : t("tempDrop.rise") })}
          </Text>
          <Text style={styles.desc}>
            {t("tempDrop.desc", { from: formatTemp(fromTemp, u), to: formatTemp(toTemp, u), tip: isDropping ? t("tempDrop.cardiganNeeded") : t("tempDrop.lightClothes") })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 18,
  },
});

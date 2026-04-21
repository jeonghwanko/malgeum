import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";
import { ClothingDetail } from "./ClothingDetail";
import { UmbrellaDetail } from "./UmbrellaDetail";
import { OutdoorDetail } from "./OutdoorDetail";
import { AirQualityDetail } from "./AirQualityDetail";
import { UvDetail } from "./UvDetail";
import { PollenDetail } from "./PollenDetail";
import { HumidityDetail } from "./HumidityDetail";
import { LifestyleDetail } from "./LifestyleDetail";
import { ActivityDetail } from "./ActivityDetail";
import { LaundryDetail } from "./LaundryDetail";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  type: string;
  id: string;
  bundle: WeatherBundle;
}

const TITLE_KEYS: Record<string, string> = {
  clothing: "detail.title.clothing",
  umbrella: "detail.title.umbrella",
  "umbrella-maybe": "detail.title.umbrella",
  "outdoor-activity": "detail.title.outdoorActivity",
  "indoor-exercise": "detail.title.indoorExercise",
  carwash: "detail.title.carwash",
  "carwash-no": "detail.title.carwash",
  sunscreen: "detail.title.sunscreen",
  mask: "detail.title.mask",
  pollen: "detail.title.pollen",
  pm25: "detail.title.mask",
  uv: "detail.title.sunscreen",
  humidity: "detail.title.humidity",
  date: "detail.title.date",
  picnic: "detail.title.picnic",
  walk: "detail.title.walk",
  laundry: "detail.title.laundry",
  "laundry-no": "detail.title.laundry",
  ventilation: "detail.title.ventilation",
};

export function getDetailTitle(id: string): string {
  const key = TITLE_KEYS[id];
  return key ? t(key) : t("detail.title.fallback");
}

export function DetailContentResolver({ type, id, bundle }: Props) {
  // Action card types
  if (id === "clothing") return <ClothingDetail bundle={bundle} />;
  if (id === "umbrella" || id === "umbrella-maybe") return <UmbrellaDetail bundle={bundle} cardId={id} />;
  if (id === "outdoor-activity" || id === "indoor-exercise") return <OutdoorDetail bundle={bundle} cardId={id} />;
  if (id === "carwash" || id === "carwash-no") return <LifestyleDetail bundle={bundle} cardId={id} />;
  if (id === "sunscreen" || id === "uv") return <UvDetail bundle={bundle} />;
  if (id === "mask" || id === "pm25") return <AirQualityDetail bundle={bundle} />;
  if (id === "pollen") return <PollenDetail bundle={bundle} />;
  if (id === "humidity") return <HumidityDetail bundle={bundle} />;

  // Lifestyle activity cards
  if (id === "date" || id === "picnic" || id === "walk") return <ActivityDetail bundle={bundle} cardId={id} />;
  if (id === "laundry" || id === "laundry-no") return <LaundryDetail bundle={bundle} cardId={id} />;
  if (id === "ventilation") return <AirQualityDetail bundle={bundle} />;

  // Fallback
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>{t("detail.fallbackText")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    padding: 40,
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
});

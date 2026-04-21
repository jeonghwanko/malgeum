import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useWeatherContext } from "@/context/WeatherContext";
import { COLORS } from "@/constants/colors";
import { getClothingCopy, formatTemp, convertTemp, tempUnitSuffix } from "@/utils/weather";
import { formatHour } from "@/utils/date";
import { openAffiliateLink } from "@/utils/affiliate";
import { logMusinsaTap } from "@/services/analytics";
import { t } from "@/i18n";
import { StatusHeader } from "./shared/StatusHeader";
import { HourlyMiniChart } from "./shared/HourlyMiniChart";
import { TipList } from "./shared/TipList";
import { ClothingMoodboard } from "./ClothingMoodboard";
import { getClothingCategoryForFeelsLike } from "@/constants/clothingItems";
import type { WeatherBundle } from "@/types/weather";

interface Props {
  bundle: WeatherBundle;
}

export function ClothingDetail({ bundle }: Props) {
  const { state } = useWeatherContext();
  const u = state.tempUnit;
  const { current, hourly } = bundle;
  const fl = current.feelsLike;
  const style = state.healthProfile?.clothingStyle;

  const chartData = useMemo(() => {
    return hourly.slice(0, 12).map((h) => ({
      label: formatHour(h.dt),
      value: convertTemp(h.temp, u),
      highlight: false,
    }));
  }, [hourly, u]);

  const temps = hourly.slice(0, 12).map((h) => h.temp);
  const maxTemp = temps.length > 0 ? Math.max(...temps, fl) : fl;
  const minTemp = temps.length > 0 ? Math.min(...temps, fl) : fl;
  const tempDiff = maxTemp - minTemp;

  const statusLabel = fl <= 5 ? t("detail.clothing.cold") : fl <= 16 ? t("detail.clothing.cool") : fl <= 27 ? t("detail.clothing.moderate") : t("detail.clothing.hot");
  const statusLevel = fl <= 0 ? "warn" as const : fl <= 10 ? "caution" as const : fl <= 32 ? "safe" as const : "warn" as const;
  const icon = fl <= 5 ? "🧥" : fl <= 16 ? "👔" : fl <= 27 ? "👕" : "🥵";

  const layers = getLayerRecommendation(fl, style);
  const tips = getTips(fl, tempDiff);
  const moodboardCategory = getClothingCategoryForFeelsLike(fl);

  const handleLayerTap = useCallback((query: string) => {
    logMusinsaTap("layer", query, moodboardCategory?.key ?? "unknown");
    openAffiliateLink(query);
  }, [moodboardCategory]);

  return (
    <View>
      <StatusHeader
        icon={icon}
        value={t("detail.clothing.feelsLike", { temp: formatTemp(fl, u) })}
        label={statusLabel}
        status={statusLevel}
        subtitle={getClothingCopy(fl)}
      />

      {moodboardCategory && <ClothingMoodboard category={moodboardCategory} />}

      {layers.length > 0 && (
        <View style={styles.layerSection}>
          <Text style={styles.sectionTitle}>
            {style ? t("detail.clothing.styleRec", { style }) : t("detail.clothing.rec")}
          </Text>
          {layers.map((layer, i) =>
            layer.musinsaQuery ? (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.layerRow,
                  pressed && styles.layerRowPressed,
                ]}
                onPress={() => handleLayerTap(layer.musinsaQuery!)}
              >
                <Text style={styles.layerIcon}>{layer.icon}</Text>
                <View style={styles.layerBody}>
                  <Text style={styles.layerLabel}>{layer.label}</Text>
                  <Text style={styles.layerDesc}>{layer.desc}</Text>
                </View>
              </Pressable>
            ) : (
              <View key={i} style={styles.layerRow}>
                <Text style={styles.layerIcon}>{layer.icon}</Text>
                <View style={styles.layerBody}>
                  <Text style={styles.layerLabel}>{layer.label}</Text>
                  <Text style={styles.layerDesc}>{layer.desc}</Text>
                </View>
              </View>
            ),
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>{t("detail.clothing.chart12h")}</Text>
      <HourlyMiniChart
        data={chartData}
        maxValue={Math.max(convertTemp(maxTemp, u) + 2, 1)}
        unit={tempUnitSuffix(u)}
      />

      <TipList tips={tips} />
    </View>
  );
}

interface Layer { icon: string; label: string; desc: string; musinsaQuery?: string }

function getLayerRecommendation(fl: number, style?: string): Layer[] {
  const layers: Layer[] = [];

  if (fl <= 0) {
    layers.push({ icon: "🧥", label: t("detail.clothing.outer"), desc: t("detail.clothing.paddingLongDown"), musinsaQuery: "롱패딩" });
    layers.push({ icon: "👔", label: t("detail.clothing.top"), desc: t("detail.clothing.heatechKnit"), musinsaQuery: "히트텍 니트" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.fleecePants"), musinsaQuery: "기모바지" });
    layers.push({ icon: "🧣", label: t("detail.clothing.acc"), desc: t("detail.clothing.scarfGlove") });
  } else if (fl <= 10) {
    const outerDesc = style === "포멀" ? t("detail.clothing.coat") : t("detail.clothing.jacketCoat");
    const outerQuery = fl <= 5 ? "코트" : "자켓";
    layers.push({ icon: "🧥", label: t("detail.clothing.outer"), desc: outerDesc, musinsaQuery: outerQuery });
    layers.push({ icon: "👔", label: t("detail.clothing.top"), desc: t("detail.clothing.knitSweater"), musinsaQuery: fl <= 5 ? "니트 스웨터" : "맨투맨" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.thickPantsJeans"), musinsaQuery: fl <= 5 ? "기모팬츠" : "청바지 데님" });
  } else if (fl <= 16) {
    layers.push({ icon: "🧥", label: t("detail.clothing.outer"), desc: style === "스포티" ? t("detail.clothing.windbreaker") : t("detail.clothing.cardiganJacket"), musinsaQuery: "가디건" });
    layers.push({ icon: "👔", label: t("detail.clothing.top"), desc: t("detail.clothing.longTee"), musinsaQuery: fl <= 13 ? "니트" : "긴팔티" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.jeansChinos"), musinsaQuery: fl <= 13 ? "슬랙스" : "면바지 치노" });
  } else if (fl <= 22) {
    layers.push({ icon: "👕", label: t("detail.clothing.top"), desc: t("detail.clothing.halfOrLong"), musinsaQuery: "긴팔 티셔츠" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.chinosJeans"), musinsaQuery: "면바지" });
    layers.push({ icon: "🧥", label: t("detail.clothing.note"), desc: t("detail.clothing.lightJacketBag") });
  } else if (fl <= 27) {
    layers.push({ icon: "👕", label: t("detail.clothing.top"), desc: t("detail.clothing.tShirt"), musinsaQuery: "반팔 티셔츠" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.shortsThin"), musinsaQuery: "반바지" });
  } else {
    layers.push({ icon: "👕", label: t("detail.clothing.top"), desc: t("detail.clothing.linenTee"), musinsaQuery: "린넨 반팔" });
    layers.push({ icon: "👖", label: t("detail.clothing.bottom"), desc: t("detail.clothing.shortsSkirt"), musinsaQuery: "숏팬츠" });
    layers.push({ icon: "💧", label: t("detail.clothing.essential"), desc: t("detail.clothing.hydrateEssential") });
  }

  return layers;
}

function getTips(fl: number, tempDiff: number) {
  const tips = [];
  if (tempDiff >= 8) {
    tips.push({ icon: "🌡️", text: t("detail.clothing.tipTempDiff", { diff: Math.round(tempDiff) }) });
  }
  if (fl <= 5) {
    tips.push({ icon: "🔥", text: t("detail.clothing.tipColdHands") });
  }
  if (fl >= 28) {
    tips.push({ icon: "💧", text: t("detail.clothing.tipHydrate") });
    tips.push({ icon: "🧴", text: t("detail.clothing.tipSunscreen") });
  }
  if (fl >= 15 && fl <= 25) {
    tips.push({ icon: "😊", text: t("detail.clothing.tipNiceOut") });
  }
  return tips;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  layerSection: {
    marginBottom: 24,
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 6,
  },
  layerIcon: {
    fontSize: 22,
  },
  layerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  layerDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  layerRowPressed: {
    backgroundColor: "#F1F5F9",
  },
  layerBody: {
    flex: 1,
  },
});

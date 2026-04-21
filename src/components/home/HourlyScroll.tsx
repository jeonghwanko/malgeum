import React, { useId } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import {
  Sun, CloudSun, CloudRain, Snowflake, Lightning, CloudFog, Wind, Drop,
} from "phosphor-react-native";
import type { HourlyWeather, WeatherCondition } from "@/types/weather";
import type { TempUnit } from "@/types/settings";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { formatHour } from "@/utils/date";
import { formatTemp } from "@/utils/weather";
import { buildSmoothPath, buildFillPath } from "@/utils/chartPath";
import { t } from "@/i18n";

interface HourlyScrollProps {
  data: HourlyWeather[];
  palette?: AdaptivePalette;
  tempUnit?: TempUnit;
}

const CONDITION_ICONS: Record<WeatherCondition, typeof Sun> = {
  clear: Sun, clouds: CloudSun, rain: CloudRain, drizzle: CloudRain,
  snow: Snowflake, thunderstorm: Lightning, fog: CloudFog, dust: Wind,
};

const COL_W = 64;
const CHART_H = 72;
const DOT_R = 3.5;
const TIME_ROW_H = 20;
const ICON_ROW_H = 28;
const TEMP_LABEL_H = 22;
const RAIN_ROW_H = 22;
const GAP = 4;
const SCROLL_PAD_R = 32;
const RAIN_BLUE = "#74B9FF";

function tempsToY(temps: number[]): number[] {
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const pad = DOT_R + 6;
  const usable = CHART_H - pad * 2;
  return temps.map((t) => pad + usable * (1 - (t - min) / range));
}


export const HourlyScroll = React.memo(function HourlyScroll({ data, palette: ap, tempUnit = "C" }: HourlyScrollProps) {
  const gradId = `hc-fill-${useId()}`;
  const items = data.slice(0, 12);
  if (items.length === 0) return null;

  const temps = items.map((h) => h.temp);
  const ys = tempsToY(temps);
  const xs = items.map((_, i) => COL_W / 2 + i * COL_W);
  const totalW = items.length * COL_W;

  const lineColor = ap?.accent ?? "#FFC107";
  const textColor = ap?.textPrimary ?? "#FFFFFF";
  const subColor = ap?.textTertiary ?? "rgba(255,255,255,0.6)";
  const shadowColor = ap?.textShadowColor ?? "rgba(0,0,0,0.5)";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: SCROLL_PAD_R }}
      >
        <View style={{ width: totalW }}>
          {/* 시간 라벨 */}
          <View style={[styles.row, { height: TIME_ROW_H }]}>
            {items.map((h, i) => (
              <View key={`tm-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                <Text style={[styles.timeLabel, {
                  color: i === 0 ? textColor : subColor,
                  fontWeight: i === 0 ? "700" : "400",
                }]}>
                  {i === 0 ? t("hourly.now") : formatHour(h.dt)}
                </Text>
              </View>
            ))}
          </View>

          {/* 날씨 아이콘 */}
          <View style={[styles.row, { height: ICON_ROW_H, marginTop: GAP }]}>
            {items.map((h, i) => {
              const Icon = CONDITION_ICONS[h.condition] ?? CloudSun;
              return (
                <View key={`ic-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                  <Icon
                    size={20}
                    weight={i === 0 ? "fill" : "regular"}
                    color={i === 0 ? textColor : subColor}
                  />
                </View>
              );
            })}
          </View>

          {/* 온도 라벨 */}
          <View style={[styles.row, { height: TEMP_LABEL_H, marginTop: GAP }]}>
            {items.map((h, i) => (
              <View key={`tl-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                <Text style={[styles.tempLabel, {
                  color: textColor,
                  textShadowColor: shadowColor,
                }]}>
                  {formatTemp(h.temp, tempUnit)}
                </Text>
              </View>
            ))}
          </View>

          {/* SVG 라인 차트 */}
          <View style={[styles.row, { height: CHART_H }]}>
            <Svg width={totalW} height={CHART_H}>
              <Defs>
                <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
                  <Stop offset="1" stopColor={lineColor} stopOpacity="0.0" />
                </SvgGradient>
              </Defs>
              <Path d={buildFillPath(xs, ys, CHART_H)} fill={`url(#${gradId})`} />
              <Path
                d={buildSmoothPath(xs, ys)}
                stroke={lineColor}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {xs.map((x, i) => (
                <React.Fragment key={`dot-${items[i].dt}`}>
                  <Circle cx={x} cy={ys[i]} r={DOT_R + 2} fill={lineColor} opacity={i === 0 ? 0.4 : 0.12} />
                  <Circle cx={x} cy={ys[i]} r={DOT_R} fill={i === 0 ? lineColor : textColor} stroke={lineColor} strokeWidth={1.5} />
                </React.Fragment>
              ))}
            </Svg>
          </View>

          {/* 강수확률 */}
          <View style={[styles.row, { height: RAIN_ROW_H, marginTop: GAP }]}>
            {items.map((h, i) => (
              <View key={`rn-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                {h.precipitation > 0 ? (
                  <View style={styles.rainWrap}>
                    <Drop size={10} weight="fill" color={RAIN_BLUE} />
                    <Text style={[styles.rainLabel, { color: RAIN_BLUE }]}>
                      {h.precipitation}%
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.rainLabel, { color: subColor, opacity: 0.4 }]}>0%</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingLeft: 24,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 1,
  },
  row: {
    position: "relative",
    width: "100%",
    ...Platform.select({ ios: { overflow: "visible" as const } }),
  },
  col: {
    position: "absolute",
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    bottom: 0,
  },
  tempLabel: {
    fontSize: 14,
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeLabel: {
    fontSize: 12,
  },
  rainWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rainLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});

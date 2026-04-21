import React, { useId } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import type { HourlyAirQuality } from "@/types/weather";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { formatHour } from "@/utils/date";
import { getPm25Status } from "@/utils/weather";
import { getStatusColor } from "@/constants/colors";
import { buildSmoothPath, buildFillPath } from "@/utils/chartPath";
import { t } from "@/i18n";

interface HourlyAirScrollProps {
  data: HourlyAirQuality[];
  palette?: AdaptivePalette;
}

const COL_W = 64;
const CHART_H = 72;
const DOT_R = 3.5;
const TIME_ROW_H = 20;
const LABEL_ROW_H = 22;
const ZONE_H = 6;
const GAP = 4;
const SCROLL_PAD_R = 32;

const scrollContentStyle = { paddingRight: SCROLL_PAD_R };

function pm25Color(pm25: number): string {
  return getStatusColor(getPm25Status(pm25).status);
}

function pm25ToY(values: number[]): number[] {
  const maxScale = Math.max(80, ...values);
  const pad = DOT_R + 6;
  const usable = CHART_H - pad * 2;
  return values.map((v) => pad + usable * (1 - Math.min(v, maxScale) / maxScale));
}

export const HourlyAirScroll = React.memo(function HourlyAirScroll({ data, palette: ap }: HourlyAirScrollProps) {
  const gradId = `air-fill-${useId()}`;
  const items = data.slice(0, 12);
  if (items.length === 0) return null;

  const pm25s = items.map((h) => h.pm25);
  const avgPm25 = pm25s.reduce((s, v) => s + v, 0) / pm25s.length;
  const lineColor = pm25Color(avgPm25);
  const ys = pm25ToY(pm25s);
  const xs = items.map((_, i) => COL_W / 2 + i * COL_W);
  const totalW = items.length * COL_W;

  const textColor = ap?.textPrimary ?? "#FFFFFF";
  const subColor = ap?.textTertiary ?? "rgba(255,255,255,0.6)";
  const shadowColor = ap?.textShadowColor ?? "rgba(0,0,0,0.5)";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
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

          {/* PM2.5 수치 라벨 */}
          <View style={[styles.row, { height: LABEL_ROW_H, marginTop: GAP }]}>
            {items.map((h, i) => {
              const dotColor = pm25Color(h.pm25);
              return (
                <View key={`lbl-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                  <View style={styles.labelWrap}>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    <Text style={[styles.pm25Label, {
                      color: textColor,
                      textShadowColor: shadowColor,
                    }]}>
                      {Math.round(h.pm25)}
                    </Text>
                  </View>
                </View>
              );
            })}
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
              {xs.map((x, i) => {
                const dotColor = pm25Color(pm25s[i]);
                return (
                  <React.Fragment key={`dot-${items[i].dt}`}>
                    <Circle cx={x} cy={ys[i]} r={DOT_R + 2} fill={dotColor} opacity={i === 0 ? 0.4 : 0.12} />
                    <Circle cx={x} cy={ys[i]} r={DOT_R} fill={i === 0 ? dotColor : textColor} stroke={dotColor} strokeWidth={1.5} />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          {/* 등급 텍스트 라벨 */}
          <View style={[styles.row, { height: LABEL_ROW_H, marginTop: 2 }]}>
            {items.map((h, i) => (
              <View key={`st-${h.dt}`} style={[styles.col, { left: i * COL_W }]}>
                <Text style={[styles.gradeLabel, { color: subColor }]}>
                  {getPm25Status(h.pm25).label}
                </Text>
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
  timeLabel: {
    fontSize: 12,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pm25Label: {
    fontSize: 13,
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  zoneBar: {
    width: COL_W - 8,
    height: ZONE_H,
    borderRadius: 3,
    opacity: 0.6,
  },
  gradeLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});

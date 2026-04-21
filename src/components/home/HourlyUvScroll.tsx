import React, { useId } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import type { HourlyUv } from "@/types/weather";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { formatHour } from "@/utils/date";
import { buildSmoothPath, buildFillPath } from "@/utils/chartPath";
import { t } from "@/i18n";

interface HourlyUvScrollProps {
  data: HourlyUv[];
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

function uvColor(uv: number): string {
  if (uv <= 2) return "#4ADE80";   // 낮음 — 초록
  if (uv <= 5) return "#FBBF24";   // 보통 — 노랑
  if (uv <= 7) return "#F97316";   // 높음 — 주황
  if (uv <= 10) return "#EF4444";  // 매우높음 — 빨강
  return "#A855F7";                 // 위험 — 보라
}

function uvToY(values: number[]): number[] {
  const maxScale = Math.max(11, ...values);
  const pad = DOT_R + 6;
  const usable = CHART_H - pad * 2;
  return values.map((v) => pad + usable * (1 - Math.min(v, maxScale) / maxScale));
}

export const HourlyUvScroll = React.memo(function HourlyUvScroll({ data, palette: ap }: HourlyUvScrollProps) {
  const gradId = `uv-fill-${useId()}`;
  const items = data.slice(0, 12);
  if (items.length === 0) return null;

  const uvs = items.map((h) => h.uvIndex);
  const peakUv = Math.max(...uvs);
  const lineColor = uvColor(peakUv);
  const ys = uvToY(uvs);
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
          {/* 시간 행 — 상단, 첫 항목 "지금" */}
          <View style={[styles.row, { height: TIME_ROW_H }]}>
            {items.map((h, i) => (
              <View key={i} style={styles.col}>
                <Text style={[styles.timeText, {
                  color: i === 0 ? textColor : subColor,
                  fontWeight: i === 0 ? "700" : "500",
                  textShadowColor: shadowColor,
                }]}>
                  {i === 0 ? t("hourly.now") : formatHour(h.dt)}
                </Text>
              </View>
            ))}
          </View>

          {/* UV 라벨 행 */}
          <View style={[styles.row, { height: LABEL_ROW_H, marginTop: GAP }]}>
            {items.map((h, i) => (
              <View key={i} style={styles.col}>
                <Text style={[styles.labelText, { color: uvColor(h.uvIndex), textShadowColor: shadowColor }]}>
                  {Math.round(h.uvIndex)}
                </Text>
              </View>
            ))}
          </View>

          {/* SVG 차트 */}
          <Svg width={totalW} height={CHART_H} style={{ marginTop: GAP }}>
            <Defs>
              <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity={0.3} />
                <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
              </SvgGradient>
            </Defs>
            <Path d={buildFillPath(xs, ys, CHART_H)} fill={`url(#${gradId})`} />
            <Path d={buildSmoothPath(xs, ys)} fill="none" stroke={lineColor} strokeWidth={2.2} />
            {xs.map((x, i) => (
              <Circle key={i} cx={x} cy={ys[i]} r={DOT_R} fill={uvColor(uvs[i])} />
            ))}
          </Svg>
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
    flexDirection: "row",
  },
  col: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 13,
    fontWeight: "700",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  timeText: {
    fontSize: 11,
    fontWeight: "500",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

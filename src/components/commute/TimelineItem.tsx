import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { usePalette } from "@/context/PaletteContext";

interface TimelineItemProps {
  time: string;
  icon: string;
  title: string;
  detail?: string;
  highlight?: boolean;
  isLast?: boolean;
}

export function TimelineItem({ time, icon, title, detail, highlight, isLast }: TimelineItemProps) {
  const ap = usePalette();
  const accent = ap?.accent ?? "#4A90D9";
  return (
    <View style={styles.item}>
      <View style={styles.dotCol}>
        <View
          style={[
            styles.dot,
            highlight && {
              backgroundColor: `${accent}20`,
              borderWidth: 1.5,
              borderColor: `${accent}66`,
              ...(Platform.OS === "ios"
                ? { shadowColor: accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6 }
                : { elevation: 4 }),
            },
          ]}
        >
          <Text style={styles.dotIcon}>{icon}</Text>
        </View>
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.time, highlight && { color: accent, fontWeight: "700" }]}>{time}</Text>
        <Text style={[styles.title, highlight && { fontWeight: "700" }]}>{title}</Text>
        {detail && <Text style={[styles.detail, highlight && { color: accent }]}>{detail}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dotCol: {
    alignItems: "center",
    width: 34,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    zIndex: 1,
  },
  dotIcon: {
    fontSize: 16,
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  time: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  detail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
});

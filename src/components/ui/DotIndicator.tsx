import React from "react";
import { View, StyleSheet } from "react-native";

interface DotIndicatorProps {
  total: number;
  current: number;
  accent?: string;
}

export function DotIndicator({ total, current, accent }: DotIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && [styles.dotActive, { backgroundColor: accent ?? "#4A90D9" }],
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
});

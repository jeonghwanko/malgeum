import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface Tip {
  icon: string;
  text: string;
}

interface TipListProps {
  title?: string;
  tips: Tip[];
}

export function TipList({ title = "오늘의 팁", tips }: TipListProps) {
  if (tips.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {tips.map((tip, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.icon}>{tip.icon}</Text>
          <Text style={styles.text}>{tip.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 6,
  },
  icon: {
    fontSize: 18,
    lineHeight: 24,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textTertiary,
  },
});

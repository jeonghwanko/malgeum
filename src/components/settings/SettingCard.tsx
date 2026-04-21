import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS } from "@/constants/colors";
import { CaretRight } from "phosphor-react-native";

interface SettingCardProps {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  onPress: () => void;
  /** 값 아래 추가 설명 */
  hint?: string;
  /** 값 대신 표시할 태그들 */
  tags?: string[];
}

export function SettingCard({ icon, iconBg, label, value, onPress, hint, tags }: SettingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {tags && tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
        )}
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <CaretRight size={16} color={COLORS.borderMedium} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: "#F8FAFC",
    transform: [{ scale: 0.985 }],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  hint: {
    fontSize: 11,
    color: COLORS.borderMedium,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

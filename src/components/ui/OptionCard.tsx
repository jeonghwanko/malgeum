import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";

interface OptionCardProps {
  emoji: string;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ emoji, label, description, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${description ? `. ${description}` : ""}`}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <Check size={12} weight="bold" color={COLORS.white} />}
      </View>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textBlock}>
        <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.desc, selected && styles.descSelected]} numberOfLines={1}>
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  cardSelected: {
    backgroundColor: "rgba(74,144,217,0.07)",
    borderColor: COLORS.primary,
  },
  cardPressed: {
    opacity: 0.75,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderMedium,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  radioSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  descSelected: {
    color: "rgba(74,144,217,0.75)",
  },
});

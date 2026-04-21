import React from "react";
import { Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";

interface SaveButtonProps {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SaveButton({ label = "저장하기", onPress, disabled, loading }: SaveButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

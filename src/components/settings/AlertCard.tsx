import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Toggle } from "@/components/ui/Toggle";
import { usePalette } from "@/context/PaletteContext";

interface AlertCardProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function AlertCard({ icon, title, description, enabled, onToggle }: AlertCardProps) {
  const ap = usePalette();
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 } as const,
    textShadowRadius: 4,
  };

  return (
    <GlassCard style={styles.card} palette={ap ?? undefined}>
      <View style={styles.inner}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.text}>
          <Text style={[styles.title, { ...shadow }]}>{title}</Text>
          <Text style={[styles.desc, { ...shadow, textShadowRadius: 3 }]}>{description}</Text>
        </View>
        <Toggle value={enabled} onToggle={onToggle} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  inner: {
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: { fontSize: 24 },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: "#FFFFFF", marginBottom: 2 },
  desc: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
});

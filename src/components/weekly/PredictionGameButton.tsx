import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Target, CheckCircle } from "phosphor-react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import { t } from "@/i18n";

interface Props {
  hasPredicted: boolean;
  onPress: () => void;
  palette?: AdaptivePalette | null;
}

export function PredictionGameButton({ hasPredicted, onPress, palette: ap }: Props) {
  return (
    <Pressable
      style={[styles.banner, ap && { backgroundColor: ap.pillBg, borderColor: ap.pillBorder }]}
      onPress={onPress}
    >
      {hasPredicted ? (
        <CheckCircle size={28} weight="fill" color="#10B981" />
      ) : (
        <Target size={28} weight="fill" color="#F59E0B" />
      )}
      <View style={styles.textWrap}>
        <Text style={[styles.title, ap && { color: ap.textPrimary }]} numberOfLines={1}>
          {hasPredicted ? t("weekly.predictionBtnDone") : t("weekly.predictionBtn")}
        </Text>
        <Text style={[styles.sub, ap && { color: ap.textTertiary }]} numberOfLines={1}>
          {hasPredicted ? t("weekly.predictionBtnDoneSub") : t("weekly.predictionBtnSub")}
        </Text>
      </View>
      <Text style={[styles.arrow, ap && { color: ap.textTertiary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "300",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Binoculars } from "phosphor-react-native";
import { t } from "@/i18n";

export function EmptyDiscoverState() {
  return (
    <View style={styles.container}>
      <Binoculars size={48} weight="duotone" color="rgba(255,255,255,0.3)" />
      <Text style={styles.title}>{t("discover.noListings")}</Text>
      <Text style={styles.sub}>{t("discover.noListingsSub")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 20,
  },
});

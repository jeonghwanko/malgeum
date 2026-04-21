import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { OptionCard } from "@/components/ui/OptionCard";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { t } from "@/i18n";
import type { TempUnit } from "@/types/settings";

function getOptions(): { unit: TempUnit; emoji: string; label: string; desc: string }[] {
  return [
    { unit: "C", emoji: "🌡️", label: t("editTemp.celsius"), desc: t("editTemp.celsiusDesc") },
    { unit: "F", emoji: "🌡️", label: t("editTemp.fahrenheit"), desc: t("editTemp.fahrenheitDesc") },
  ];
}

export default function EditTempUnitScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();
  const OPTIONS = getOptions();

  const handleSelect = (unit: TempUnit) => {
    dispatch({ type: "SET_TEMP_UNIT", payload: { unit } });
    showToast(TOAST.TEMP_UNIT_CHANGED(unit));
    router.back();
  };

  return (
    <ScreenSheet title={t("editTemp.title")} subtitle={t("editTemp.subtitle")}>
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.unit}
            emoji={o.emoji}
            label={o.label}
            description={o.desc}
            selected={state.tempUnit === o.unit}
            onPress={() => handleSelect(o.unit)}
          />
        ))}
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: 4 },
});

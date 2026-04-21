import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { OptionCard } from "@/components/ui/OptionCard";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { t } from "@/i18n";

function getAllergens() {
  return [
    { id: "꽃가루", emoji: "🌸", label: t("editAllergen.pollen"), desc: t("editAllergen.pollenDesc") },
    { id: "미세먼지", emoji: "💨", label: t("editAllergen.dust"), desc: t("editAllergen.dustDesc") },
    { id: "자외선", emoji: "☀️", label: t("editAllergen.uv"), desc: t("editAllergen.uvDesc") },
    { id: "황사", emoji: "🏜️", label: t("editAllergen.yellowDust"), desc: t("editAllergen.yellowDustDesc") },
    { id: "곰팡이", emoji: "🍄", label: t("editAllergen.mold"), desc: t("editAllergen.moldDesc") },
  ];
}

export default function EditAllergensScreen() {
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();
  const current = state.healthProfile.allergens;
  const ALLERGENS = getAllergens();

  const toggle = (id: string) => {
    const isRemoving = current.includes(id);
    const updated = isRemoving ? current.filter((a) => a !== id) : [...current, id];
    dispatch({ type: "SET_PROFILE", payload: { allergens: updated } });
    const item = ALLERGENS.find((a) => a.id === id);
    showToast(isRemoving ? TOAST.ALLERGEN_REMOVED(item?.label ?? id) : TOAST.ALLERGEN_ADDED(item?.label ?? id));
  };

  return (
    <ScreenSheet title={t("editAllergen.title")} subtitle={t("editAllergen.subtitle")}>
      <View style={styles.options}>
        {ALLERGENS.map((a) => (
          <OptionCard
            key={a.id}
            emoji={a.emoji}
            label={a.label}
            description={a.desc}
            selected={current.includes(a.id)}
            onPress={() => toggle(a.id)}
          />
        ))}
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: 4 },
});

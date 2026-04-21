import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { OptionCard } from "@/components/ui/OptionCard";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { t } from "@/i18n";

function getOptions() {
  return [
    { id: "비즈니스 캐주얼", emoji: "👔", label: t("editClothing.bizCasual"), desc: t("editClothing.bizCasualDesc") },
    { id: "캐주얼", emoji: "👕", label: t("editClothing.casual"), desc: t("editClothing.casualDesc") },
    { id: "스포티", emoji: "🏅", label: t("editClothing.sporty"), desc: t("editClothing.sportyDesc") },
    { id: "포멀", emoji: "🤵", label: t("editClothing.formal"), desc: t("editClothing.formalDesc") },
    { id: "미니멀", emoji: "🖤", label: t("editClothing.minimal"), desc: t("editClothing.minimalDesc") },
  ];
}

export default function EditClothingScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();
  const OPTIONS = getOptions();

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_PROFILE", payload: { clothingStyle: id } });
    const item = OPTIONS.find((o) => o.id === id);
    showToast(TOAST.CLOTHING_CHANGED(item?.label ?? id));
    router.back();
  };

  return (
    <ScreenSheet title={t("editClothing.title")} subtitle={t("editClothing.subtitle")}>
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            emoji={o.emoji}
            label={o.label}
            description={o.desc}
            selected={state.healthProfile.clothingStyle === o.id}
            onPress={() => handleSelect(o.id)}
          />
        ))}
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: 4 },
});

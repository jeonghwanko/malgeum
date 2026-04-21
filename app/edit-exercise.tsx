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
    { id: "야외 러닝", emoji: "🏃", label: t("editExercise.running") },
    { id: "실내 운동", emoji: "🏋️", label: t("editExercise.indoor") },
    { id: "자전거", emoji: "🚴", label: t("editExercise.cycling") },
    { id: "등산", emoji: "🥾", label: t("editExercise.hiking") },
    { id: "수영", emoji: "🏊", label: t("editExercise.swimming") },
    { id: "산책", emoji: "🚶", label: t("editExercise.walking") },
  ];
}

export default function EditExerciseScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();
  const OPTIONS = getOptions();

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_PROFILE", payload: { exercisePreference: id } });
    const item = OPTIONS.find((o) => o.id === id);
    showToast(TOAST.EXERCISE_CHANGED(item?.label ?? id));
    router.back();
  };

  return (
    <ScreenSheet title={t("editExercise.title")} subtitle={t("editExercise.subtitle")}>
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            emoji={o.emoji}
            label={o.label}
            selected={state.healthProfile.exercisePreference === o.id}
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

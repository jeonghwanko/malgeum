import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Heart, PersonSimpleRun, TShirt } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SelectChip } from "@/components/ui/SelectChip";
import { SaveButton } from "@/components/ui/SaveButton";
import { useWeatherContext } from "@/context/WeatherContext";
import { t } from "@/i18n";

const ALLERGENS = ["꽃가루", "미세먼지", "자외선", "황사", "곰팡이"];
const EXERCISE_OPTIONS = ["야외 러닝", "실내 운동", "자전거", "등산", "수영", "산책"];
const CLOTHING_OPTIONS = ["비즈니스 캐주얼", "캐주얼", "스포티", "포멀", "미니멀"];

export default function EditProfileScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();

  const [allergens, setAllergens] = useState<string[]>(state.healthProfile.allergens);
  const [exercise, setExercise] = useState(state.healthProfile.exercisePreference);
  const [clothing, setClothing] = useState(state.healthProfile.clothingStyle);

  const toggleAllergen = (item: string) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    dispatch({
      type: "SET_PROFILE",
      payload: { allergens, exercisePreference: exercise, clothingStyle: clothing },
    });
    router.back();
  };

  return (
    <ScreenSheet title={t("editProfile.title")} footer={<SaveButton onPress={handleSave} />}>
      {/* 알레르기 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
            <Heart size={20} weight="fill" color={COLORS.warn} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t("editProfile.allergyTitle")}</Text>
            <Text style={styles.sectionSub}>{t("editProfile.allergySub")}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          {ALLERGENS.map((item) => (
            <SelectChip
              key={item}
              label={item}
              selected={allergens.includes(item)}
              onPress={() => toggleAllergen(item)}
              variant="warn"
            />
          ))}
        </View>
      </View>

      {/* 운동 선호 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
            <PersonSimpleRun size={20} weight="fill" color={COLORS.safe} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t("editProfile.exerciseTitle")}</Text>
            <Text style={styles.sectionSub}>{t("editProfile.exerciseSub")}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          {EXERCISE_OPTIONS.map((item) => (
            <SelectChip key={item} label={item} selected={exercise === item} onPress={() => setExercise(item)} />
          ))}
        </View>
      </View>

      {/* 복장 스타일 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: "rgba(74,144,217,0.12)" }]}>
            <TShirt size={20} weight="fill" color={COLORS.primaryLight} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>{t("editProfile.clothingTitle")}</Text>
            <Text style={styles.sectionSub}>{t("editProfile.clothingSub")}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          {CLOTHING_OPTIONS.map((item) => (
            <SelectChip key={item} label={item} selected={clothing === item} onPress={() => setClothing(item)} />
          ))}
        </View>
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textLight },
  sectionSub: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

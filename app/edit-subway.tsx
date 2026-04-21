import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Train, X } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { t } from "@/i18n";

export default function EditSubwayScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();

  const [station, setStation] = useState(state.commuteTime.subwayStation ?? "");

  const handleSave = () => {
    const trimmed = station.trim().replace(/역$/, ""); // "강남역" → "강남"
    dispatch({
      type: "SET_COMMUTE_TIME",
      payload: { ...state.commuteTime, subwayStation: trimmed || undefined },
    });
    if (trimmed) {
      showToast(TOAST.SUBWAY_SAVED(trimmed));
    } else {
      showToast(TOAST.SUBWAY_CLEARED);
    }
    router.back();
  };

  const handleClear = () => {
    setStation("");
  };

  return (
    <ScreenSheet title={t("editSubway.title")} subtitle={t("editSubway.subtitle")} footer={<SaveButton onPress={handleSave} />}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(74,144,217,0.10)" }]}>
          <Train size={20} weight="fill" color={COLORS.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.label}>{t("editSubway.stationLabel")}</Text>
          <Text style={styles.sub}>{t("editSubway.stationSub")}</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <BottomSheetTextInput
          style={styles.input}
          value={station}
          onChangeText={setStation}
          placeholder={t("editSubway.placeholder")}
          placeholderTextColor={COLORS.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        {station.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
            <X size={16} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {station.trim().length > 0 && (
        <View style={styles.preview}>
          <Text style={styles.previewEmoji}>🚇</Text>
          <Text style={styles.previewText}>
            {t("editSubway.preview", { station: station.trim().replace(/역$/, "") })}
          </Text>
        </View>
      )}

      <Text style={styles.hint}>
        {t("editSubway.hint")}
      </Text>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  rowText: { flex: 1 },
  label: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: 4,
  },
  preview: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  previewEmoji: { fontSize: 22 },
  previewText: { fontSize: 14, color: COLORS.primary, fontWeight: "600", flex: 1 },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});

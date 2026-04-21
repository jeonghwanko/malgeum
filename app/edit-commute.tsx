import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Briefcase, ArrowRight } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { TimeStepper } from "@/components/ui/TimeStepper";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { t } from "@/i18n";

const MINS_LABEL = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function parse(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h, Math.min(Math.round(m / 5), 11)];
}

function fmt(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${MINS_LABEL[m]}`;
}

export default function EditCommuteScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();

  const [dH, dM] = parse(state.commuteTime.departure);
  const [rH, rM] = parse(state.commuteTime.return);

  const [depH, setDepH] = useState(dH);
  const [depM, setDepM] = useState(dM);
  const [retH, setRetH] = useState(rH);
  const [retM, setRetM] = useState(rM);
  const [editing, setEditing] = useState<"dep" | "ret" | null>(null);

  const dep = fmt(depH, depM);
  const ret = fmt(retH, retM);

  const handleSave = () => {
    dispatch({ type: "SET_COMMUTE_TIME", payload: { departure: dep, return: ret } });
    showToast(TOAST.COMMUTE_SAVED);
    router.back();
  };

  return (
    <ScreenSheet title={t("editCommute.title")} footer={<SaveButton onPress={handleSave} />}>
      {/* 출근 */}
      <Pressable style={styles.row} onPress={() => setEditing(editing === "dep" ? null : "dep")}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(74,144,217,0.10)" }]}>
          <Briefcase size={20} weight="fill" color={COLORS.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.label}>{t("editCommute.depLabel")}</Text>
          <Text style={styles.sub}>{t("editCommute.depSub")}</Text>
        </View>
        <View style={[styles.timeBadge, editing === "dep" && styles.timeBadgeActive]}>
          <Text style={[styles.timeVal, editing === "dep" && styles.timeValActive]}>{dep}</Text>
        </View>
      </Pressable>

      {editing === "dep" && (
        <View style={styles.pickerBox}>
          <TimeStepper hour={depH} minute={depM} onChangeHour={setDepH} onChangeMinute={setDepM} />
        </View>
      )}

      {/* 퇴근 */}
      <Pressable style={styles.row} onPress={() => setEditing(editing === "ret" ? null : "ret")}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(245,158,11,0.10)" }]}>
          <ArrowRight size={20} weight="bold" color={COLORS.caution} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.label}>{t("editCommute.retLabel")}</Text>
          <Text style={styles.sub}>{t("editCommute.retSub")}</Text>
        </View>
        <View style={[styles.timeBadge, editing === "ret" && styles.timeBadgeActive]}>
          <Text style={[styles.timeVal, editing === "ret" && styles.timeValActive]}>{ret}</Text>
        </View>
      </Pressable>

      {editing === "ret" && (
        <View style={styles.pickerBox}>
          <TimeStepper hour={retH} minute={retM} onChangeHour={setRetH} onChangeMinute={setRetM} />
        </View>
      )}

      {/* 미리보기 */}
      <View style={styles.preview}>
        <View style={styles.previewRow}>
          <View style={styles.slot}>
            <Text style={styles.slotEmoji}>🌅</Text>
            <Text style={styles.slotTime}>{dep}</Text>
            <Text style={styles.slotType}>{t("home.commute.departure")}</Text>
          </View>
          <ArrowRight size={18} color={COLORS.borderMedium} />
          <View style={styles.slot}>
            <Text style={styles.slotEmoji}>🌇</Text>
            <Text style={styles.slotTime}>{ret}</Text>
            <Text style={styles.slotType}>{t("home.commute.return")}</Text>
          </View>
        </View>
      </View>
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
  timeBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timeBadgeActive: {
    backgroundColor: "rgba(74,144,217,0.08)",
    borderColor: COLORS.primary,
  },
  timeVal: { fontSize: 20, fontWeight: "800", color: "#1E293B", letterSpacing: 1 },
  timeValActive: { color: COLORS.primary },
  pickerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  preview: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight,
    padding: 18, marginTop: 16, marginBottom: 16,
  },
  previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  slot: { alignItems: "center" },
  slotEmoji: { fontSize: 24, marginBottom: 4 },
  slotTime: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginBottom: 2 },
  slotType: { fontSize: 11, color: COLORS.textMuted },
});

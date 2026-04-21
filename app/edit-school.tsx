import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { GraduationCap, MagnifyingGlass, X, CheckCircle } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { SaveButton } from "@/components/ui/SaveButton";
import { useWeatherContext } from "@/context/WeatherContext";
import { useToast } from "@/context/ToastContext";
import { TOAST } from "@/constants/toastMessages";
import { searchSchool, type SchoolInfo } from "@/services/kskillProxy";
import { t } from "@/i18n";

const EDU_OFFICES = [
  "서울특별시교육청", "부산광역시교육청", "대구광역시교육청",
  "인천광역시교육청", "광주광역시교육청", "대전광역시교육청",
  "울산광역시교육청", "세종특별자치시교육청", "경기도교육청",
  "강원특별자치도교육청", "충청북도교육청", "충청남도교육청",
  "전북특별자치도교육청", "전라남도교육청", "경상북도교육청",
  "경상남도교육청", "제주특별자치도교육청",
];

const SHORT_LABELS: Record<string, string> = {
  "서울특별시교육청": "서울", "부산광역시교육청": "부산",
  "대구광역시교육청": "대구", "인천광역시교육청": "인천",
  "광주광역시교육청": "광주", "대전광역시교육청": "대전",
  "울산광역시교육청": "울산", "세종특별자치시교육청": "세종",
  "경기도교육청": "경기", "강원특별자치도교육청": "강원",
  "충청북도교육청": "충북", "충청남도교육청": "충남",
  "전북특별자치도교육청": "전북", "전라남도교육청": "전남",
  "경상북도교육청": "경북", "경상남도교육청": "경남",
  "제주특별자치도교육청": "제주",
};

export default function EditSchoolScreen() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const { showToast } = useToast();

  const [eduOffice, setEduOffice] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [results, setResults] = useState<SchoolInfo[]>([]);
  const [selected, setSelected] = useState<SchoolInfo | null>(
    state.schoolSettings
      ? { educationOfficeCode: state.schoolSettings.educationOfficeCode, schoolCode: state.schoolSettings.schoolCode, schoolName: state.schoolSettings.schoolName }
      : null,
  );
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!eduOffice || !schoolName.trim()) return;
    setSearching(true);
    setResults([]);
    setSelected(null);
    try {
      const data = await searchSchool(eduOffice, schoolName.trim());
      setResults(data);
      if (data.length === 1) setSelected(data[0]);
    } finally {
      setSearching(false);
    }
  }, [eduOffice, schoolName]);

  const handleSave = () => {
    if (selected) {
      dispatch({
        type: "SET_SCHOOL",
        payload: {
          educationOfficeCode: selected.educationOfficeCode,
          schoolCode: selected.schoolCode,
          schoolName: selected.schoolName,
        },
      });
      showToast(TOAST.SCHOOL_SAVED(selected.schoolName));
    } else {
      dispatch({ type: "SET_SCHOOL", payload: null });
      showToast(TOAST.SCHOOL_CLEARED);
    }
    router.back();
  };

  const handleClear = () => {
    setSelected(null);
    setResults([]);
    setSchoolName("");
    setEduOffice("");
  };

  return (
    <ScreenSheet title={t("editSchool.title")} subtitle={t("editSchool.subtitle")} footer={<SaveButton onPress={handleSave} />}>
      {/* 현재 설정된 학교 */}
      {state.schoolSettings && !selected && (
        <Pressable style={styles.currentSchool} onPress={handleClear}>
          <CheckCircle size={18} weight="fill" color="#22C55E" />
          <Text style={styles.currentText}>{state.schoolSettings.schoolName}</Text>
          <X size={14} color={COLORS.textMuted} />
        </Pressable>
      )}

      {/* Step 1: 교육청 선택 */}
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: "rgba(34,197,94,0.10)" }]}>
          <GraduationCap size={20} weight="fill" color="#22C55E" />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.label}>{t("editSchool.eduOffice")}</Text>
          <Text style={styles.sub}>{t("editSchool.eduOfficeSub")}</Text>
        </View>
      </View>

      <View style={styles.eduGrid}>
        {EDU_OFFICES.map((office) => (
          <Pressable
            key={office}
            style={[styles.eduPill, eduOffice === office && styles.eduPillActive]}
            onPress={() => setEduOffice(office)}
          >
            <Text style={[styles.eduPillText, eduOffice === office && styles.eduPillTextActive]}>
              {SHORT_LABELS[office] ?? office}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Step 2: 학교 이름 입력 + 검색 */}
      {eduOffice !== "" && (
        <>
          <View style={styles.searchRow}>
            <BottomSheetTextInput
              style={styles.input}
              value={schoolName}
              onChangeText={setSchoolName}
              placeholder={t("editSchool.placeholder")}
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable
              onPress={handleSearch}
              style={[styles.searchBtn, (!schoolName.trim() || searching) && { opacity: 0.4 }]}
              disabled={!schoolName.trim() || searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MagnifyingGlass size={18} weight="bold" color="#FFF" />
              )}
            </Pressable>
          </View>

          {/* 검색 결과 */}
          {results.length > 1 && (
            <View style={styles.resultList}>
              {results.map((s) => (
                <Pressable
                  key={s.schoolCode}
                  style={[styles.resultRow, selected?.schoolCode === s.schoolCode && styles.resultRowActive]}
                  onPress={() => setSelected(s)}
                >
                  <Text style={[styles.resultName, selected?.schoolCode === s.schoolCode && styles.resultNameActive]}>
                    {s.schoolName}
                  </Text>
                  {selected?.schoolCode === s.schoolCode && (
                    <CheckCircle size={18} weight="fill" color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {results.length === 0 && !searching && schoolName.trim().length > 0 && (
            <Text style={styles.hint}>{t("editSchool.hint")}</Text>
          )}
        </>
      )}

      {/* 선택된 학교 미리보기 */}
      {selected && (
        <View style={styles.preview}>
          <Text style={styles.previewEmoji}>🍽️</Text>
          <Text style={styles.previewText}>
            {t("editSchool.preview", { name: selected.schoolName })}
          </Text>
        </View>
      )}

      <Text style={styles.footerHint}>
        {t("editSchool.footerHint")}
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
  currentSchool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  currentText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#166534" },
  eduGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  eduPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  eduPillActive: {
    backgroundColor: "rgba(74,144,217,0.08)",
    borderColor: COLORS.primary,
  },
  eduPillText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  eduPillTextActive: { color: COLORS.primary },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  searchBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  resultList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  resultRowActive: {
    backgroundColor: "rgba(74,144,217,0.06)",
  },
  resultName: { fontSize: 15, fontWeight: "600", color: COLORS.textDark },
  resultNameActive: { color: COLORS.primary },
  preview: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  previewEmoji: { fontSize: 22 },
  previewText: { fontSize: 14, color: "#166534", fontWeight: "600", flex: 1 },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
  footerHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});

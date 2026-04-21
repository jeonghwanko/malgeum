import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { t } from "@/i18n";
import { useWeatherContext } from "@/context/WeatherContext";
import { loadDiary, saveDiaryEntry } from "@/services/diaryService";
import { getConditionEmoji } from "@/constants/weather-assets";
import { getConditionLabel } from "@/utils/weather";
import { todayKey } from "@/utils/date";
import type { DiaryEntry } from "@/types/diary";

const MEMO_MAX = 100;

export default function DiaryScreen() {
  const { state } = useWeatherContext();

  const [memo, setMemo] = useState("");
  const [savedMemo, setSavedMemo] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const saved = useMemo(() => diary.some((e) => e.date === todayKey()), [diary]);
  const showInput = !saved || editing;
  const isDirty = memo.trim() !== savedMemo.trim();

  const condition = state.currentWeather?.condition ?? "clear";
  const temp = Math.round(state.dailyForecast[0]?.tempMax ?? state.currentWeather?.temp ?? 0);
  const emoji = getConditionEmoji(condition);
  const condLabel = getConditionLabel(condition);

  useEffect(() => {
    loadDiary().then((entries) => {
      setDiary(entries);
      const today = entries.find((e) => e.date === todayKey());
      if (today) {
        setMemo(today.memo);
        setSavedMemo(today.memo);
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!memo.trim() || saving) return;
    setSaving(true);
    try {
      const entry = await saveDiaryEntry(memo.trim(), condition, temp);
      setDiary((prev) => {
        const without = prev.filter((e) => e.date !== entry.date);
        return [entry, ...without].sort((a, b) => b.date.localeCompare(a.date));
      });
      setSavedMemo(entry.memo);
      setEditing(false);
      Keyboard.dismiss();
    } finally {
      setSaving(false);
    }
  }, [memo, saving, condition, temp]);

  const handleEdit = useCallback(() => setEditing(true), []);
  const handleCancelEdit = useCallback(() => {
    setMemo(savedMemo);
    setEditing(false);
    Keyboard.dismiss();
  }, [savedMemo]);

  const pastEntries = useMemo(() => diary.filter((e) => e.date !== todayKey()), [diary]);

  return (
    <ScreenSheet title={t("diary.title")} subtitle={t("diary.subtitle")}>
      {/* 오늘 날씨 헤더 */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.todayCard}>
        <Text style={styles.todayEmoji}>{emoji}</Text>
        <View style={styles.todayInfo}>
          <Text style={styles.todayDate}>{todayKey()}</Text>
          <Text style={styles.todayWeather}>
            {condLabel} · {t("diary.highTemp", { temp })}
          </Text>
        </View>
        {saved && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedBadgeText}>{t("diary.recorded")}</Text>
          </View>
        )}
      </Animated.View>

      {/* 저장된 상태 — 읽기 전용 카드 + 수정 버튼 */}
      {!showInput && (
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.savedCard}>
          <Text style={styles.savedMemo}>{savedMemo}</Text>
          <Pressable style={styles.editBtn} onPress={handleEdit} hitSlop={8}>
            <Text style={styles.editBtnText}>{t("diary.edit")}</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* 편집 모드 — 멀티라인 입력 (2~3줄) */}
      {showInput && (
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.inputCard}>
          <BottomSheetTextInput
            style={styles.input}
            value={memo}
            onChangeText={(v) => setMemo(v.slice(0, MEMO_MAX))}
            placeholder={t("diary.placeholderMulti")}
            placeholderTextColor="rgba(0,0,0,0.25)"
            multiline
            numberOfLines={3}
            maxLength={MEMO_MAX}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>
              {memo.length} / {MEMO_MAX}
            </Text>
            <View style={styles.btnRow}>
              {editing && (
                <Pressable style={styles.cancelBtn} onPress={handleCancelEdit} disabled={saving}>
                  <Text style={styles.cancelBtnText}>{t("diary.cancel")}</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.saveBtn, (!memo.trim() || saving || (editing && !isDirty)) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!memo.trim() || saving || (editing && !isDirty)}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? t("diary.saving") : editing ? t("diary.save") : t("diary.record")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {saved && (
        <Animated.View entering={SlideInUp.delay(50).duration(300)} style={styles.anniversaryNote}>
          <Text style={styles.anniversaryNoteText}>
            {t("diary.anniversaryNote")}
          </Text>
        </Animated.View>
      )}

      {/* 과거 일기 타임라인 */}
      {pastEntries.length > 0 && (
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>{t("diary.pastTitle")}</Text>
          {pastEntries.map((entry) => (
            <View key={entry.date} style={styles.pastEntry}>
              <View style={styles.pastEntryLeft}>
                <Text style={styles.pastEmoji}>{getConditionEmoji(entry.condition)}</Text>
                <View style={styles.pastEntryLine} />
              </View>
              <View style={styles.pastEntryBody}>
                <Text style={styles.pastDate}>{entry.date}</Text>
                <Text style={styles.pastMemo}>{entry.memo}</Text>
                <Text style={styles.pastWeather}>
                  {getConditionLabel(entry.condition)} · {t("diary.highTemp", { temp: entry.temp })}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  todayEmoji: { fontSize: 36 },
  todayInfo: { flex: 1 },
  todayDate: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  todayWeather: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginTop: 2 },
  savedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  savedBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.safe },
  inputCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
    padding: 0,
    minHeight: 72,
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  charCount: { fontSize: 12, color: "#94A3B8" },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  savedCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 18,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  savedMemo: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    color: "#1E293B",
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  anniversaryNote: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },
  anniversaryNoteText: { fontSize: 13, fontWeight: "500", color: "#92400E", textAlign: "center" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 28,
    marginBottom: 16,
  },
  pastEntry: {
    flexDirection: "row",
    marginBottom: 4,
  },
  pastEntryLeft: {
    alignItems: "center",
    width: 40,
    marginRight: 12,
  },
  pastEmoji: { fontSize: 22 },
  pastEntryLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginTop: 6,
    borderRadius: 1,
  },
  pastEntryBody: {
    flex: 1,
    paddingBottom: 20,
  },
  pastDate: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  pastMemo: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginTop: 4 },
  pastWeather: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Plus, Minus } from "phosphor-react-native";
import type { NotifySchedule } from "@/types/notify";
import { MAX_SCHEDULES, formatScheduleTime } from "@/types/notify";
import { t } from "@/i18n";

interface Props {
  schedules: NotifySchedule[];
  onChange: (schedules: NotifySchedule[]) => void;
  onAddBlocked?: () => void;
}

export function ScheduleEditor({ schedules, onChange, onAddBlocked }: Props) {
  const adjustTime = (idx: number, field: "hour" | "minute", delta: number) => {
    const updated = [...schedules];
    const s = { ...updated[idx] };
    if (field === "hour") {
      s.hour = (s.hour + delta + 24) % 24;
    } else {
      s.minute = (s.minute + delta + 60) % 60;
    }
    updated[idx] = s;
    onChange(updated);
  };

  const updateMessage = (idx: number, msg: string) => {
    const updated = [...schedules];
    updated[idx] = { ...updated[idx], message: msg };
    onChange(updated);
  };

  const addSchedule = () => {
    if (onAddBlocked) {
      onAddBlocked();
      return;
    }
    if (schedules.length >= MAX_SCHEDULES) return;
    onChange([...schedules, { hour: 9, minute: 0, message: "" }]);
  };

  const removeSchedule = (idx: number) => {
    if (schedules.length <= 1) return;
    onChange(schedules.filter((_, i) => i !== idx));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("scheduleEditor.label")}</Text>
      {schedules.map((s, idx) => (
        <View key={idx} style={styles.scheduleBlock}>
          <View style={styles.row}>
            <View style={styles.timeGroup}>
              <Pressable onPress={() => adjustTime(idx, "hour", -1)} hitSlop={8}>
                <Minus size={16} color="#94A3B8" />
              </Pressable>
              <Text style={styles.time}>
                {formatScheduleTime(s)}
              </Text>
              <Pressable onPress={() => adjustTime(idx, "hour", 1)} hitSlop={8}>
                <Plus size={16} color="#94A3B8" />
              </Pressable>
            </View>
            <View style={styles.minuteGroup}>
              <Pressable onPress={() => adjustTime(idx, "minute", -10)} hitSlop={8}>
                <Minus size={14} color="#94A3B8" />
              </Pressable>
              <Text style={styles.minuteLabel}>{t("scheduleEditor.minute")}</Text>
              <Pressable onPress={() => adjustTime(idx, "minute", 10)} hitSlop={8}>
                <Plus size={14} color="#94A3B8" />
              </Pressable>
            </View>
            {schedules.length > 1 && (
              <Pressable onPress={() => removeSchedule(idx)} hitSlop={8} style={styles.removeBtn}>
                <Text style={styles.removeText}>{t("common.delete")}</Text>
              </Pressable>
            )}
          </View>
          <BottomSheetTextInput
            style={styles.messageInput}
            value={s.message}
            onChangeText={(text) => updateMessage(idx, text)}
            placeholder={t("scheduleEditor.msgPlaceholder")}
            placeholderTextColor="#94A3B8"
            maxLength={50}
          />
        </View>
      ))}
      {schedules.length < MAX_SCHEDULES && (
        <Pressable
          onPress={addSchedule}
          style={[styles.addBtn, onAddBlocked && styles.addBtnDisabled]}
        >
          <Plus size={16} color={onAddBlocked ? "#CBD5E1" : "#475569"} />
          <Text style={[styles.addText, onAddBlocked && styles.addTextDisabled]}>
            {onAddBlocked ? t("scheduleEditor.addTimeSoon") : t("scheduleEditor.addTime")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  scheduleBlock: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  messageInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1E293B",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  time: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    fontVariant: ["tabular-nums"],
    minWidth: 52,
    textAlign: "center",
  },
  minuteGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  minuteLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  removeBtn: {
    marginLeft: "auto",
  },
  removeText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    gap: 6,
  },
  addText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  addBtnDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  addTextDisabled: {
    color: "#CBD5E1",
  },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { CaretUp, CaretDown } from "phosphor-react-native";

interface TimeStepperProps {
  hour: number;
  minute: number;          // 0~11 인덱스 (5분 단위)
  onChangeHour: (h: number) => void;
  onChangeMinute: (m: number) => void;
}

const MINS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function TimeStepper({ hour, minute, onChangeHour, onChangeMinute }: TimeStepperProps) {
  const incH = () => onChangeHour((hour + 1) % 24);
  const decH = () => onChangeHour((hour - 1 + 24) % 24);
  const incM = () => onChangeMinute((minute + 1) % 12);
  const decM = () => onChangeMinute((minute - 1 + 12) % 12);

  return (
    <View style={styles.row}>
      <Column value={String(hour).padStart(2, "0")} onUp={incH} onDown={decH} label="시간" />
      <Text style={styles.colon}>:</Text>
      <Column value={MINS[minute]} onUp={incM} onDown={decM} label="분" />
    </View>
  );
}

function Column({ value, onUp, onDown, label }: { value: string; onUp: () => void; onDown: () => void; label: string }) {
  return (
    <View style={styles.col}>
      <Pressable onPress={onUp} style={styles.arrow} hitSlop={8} accessibilityLabel={`${label} 증가`} accessibilityRole="button">
        <CaretUp size={22} weight="bold" color="#64748B" />
      </Pressable>
      <View style={styles.valueBox} accessibilityLabel={`${label} ${value}`}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
      <Pressable onPress={onDown} style={styles.arrow} hitSlop={8} accessibilityLabel={`${label} 감소`} accessibilityRole="button">
        <CaretDown size={22} weight="bold" color="#64748B" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  col: { alignItems: "center", gap: 4 },
  arrow: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  valueBox: {
    width: 56,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  valueText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 1,
  },
  colon: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 4,
  },
});

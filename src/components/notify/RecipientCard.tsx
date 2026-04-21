import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { UserCircle, Clock, CaretRight } from "phosphor-react-native";
import type { AdaptivePalette } from "@/constants/adaptivePalette";
import type { Recipient } from "@/types/notify";
import { formatScheduleTime } from "@/types/notify";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";

interface Props {
  recipient: Recipient;
  palette: AdaptivePalette | null;
  onPress: () => void;
}

const STATUS_LABEL: Record<string, { textKey: string; color: string }> = {
  pending: { textKey: "recipientCard.pending", color: "#F59E0B" },
  active: { textKey: "recipientCard.active", color: "#10B981" },
  paused: { textKey: "recipientCard.paused", color: "#6B7280" },
};

export function RecipientCard({ recipient, palette: ap, onPress }: Props) {
  const status = STATUS_LABEL[recipient.status] ?? STATUS_LABEL.pending;
  const tertiaryColor = ap?.textTertiary ?? "rgba(255,255,255,0.6)";

  return (
    <Pressable
      onPress={() => { hapticLight(); onPress(); }}
      style={[styles.card, { backgroundColor: ap?.cardBg ?? "rgba(255,255,255,0.1)" }]}
    >
      <View style={styles.left}>
        <UserCircle size={40} weight="fill" color={ap?.textPrimary ?? "#FFFFFF"} />
      </View>
      <View style={styles.center}>
        <View style={styles.nameRow}>
          <Text style={[styles.nickname, { color: ap?.textPrimary ?? "#FFFFFF" }]}>
            {recipient.nickname}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + "22" }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{t(status.textKey)}</Text>
          </View>
        </View>
        {recipient.schedules.map((s, idx) => {
          const time = formatScheduleTime(s);
          const msg = s.message || recipient.personalMessage;
          return (
            <View key={idx} style={styles.infoRow}>
              <Clock size={13} color={tertiaryColor} />
              <Text style={[styles.infoText, { color: tertiaryColor }]} numberOfLines={1}>
                {time}{msg ? ` · ${msg}` : ""}
              </Text>
            </View>
          );
        })}
      </View>
      <CaretRight size={18} color={ap?.textTertiary ?? "rgba(255,255,255,0.4)"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  left: {
    marginRight: 12,
  },
  center: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
});

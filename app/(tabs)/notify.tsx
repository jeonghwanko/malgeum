import React from "react";
import { View, ScrollView, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperPlaneTilt, Plus, Ticket } from "phosphor-react-native";

import { useWeatherContext } from "@/context/WeatherContext";
import { usePalette } from "@/context/PaletteContext";
import { useNotify } from "@/context/NotifyContext";
import { useToast } from "@/context/ToastContext";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { RecipientCard } from "@/components/notify/RecipientCard";
import { MAX_RECIPIENTS } from "@/types/notify";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function NotifyScreen() {
  return <NotifyContent />;
}

function NotifyContent() {
  const { state: weatherState } = useWeatherContext();
  const insets = useSafeAreaInsets();
  const ap = usePalette();
  const { showToast } = useToast();
  const router = useRouter();
  const { state: notifyState, loaded: notifyLoaded } = useNotify();

  const bgCondition = weatherState.currentWeather?.condition ?? "clear";
  const textColor = ap?.textPrimary ?? "#FFFFFF";
  const subColor = ap?.textTertiary ?? "rgba(255,255,255,0.6)";
  const cardBg = ap?.cardBg ?? "rgba(255,255,255,0.1)";

  return (
    <WeatherBackground condition={bgCondition} isNight={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <Text style={[styles.title, { color: textColor }]}>{t("notify.title")}</Text>
        <Text style={[styles.subtitle, { color: subColor }]}>
          {t("notify.subtitle")}
        </Text>

        {/* 공유하기 카드 — 기존 설정에서 이동 */}
        <Pressable
          onPress={() => { hapticLight(); router.push("/share"); }}
          style={[styles.shareCard, { backgroundColor: cardBg }]}
        >
          <PaperPlaneTilt size={28} weight="fill" color={ap?.accent ?? "#60A5FA"} />
          <View style={styles.shareTextWrap}>
            <Text style={[styles.shareTitle, { color: textColor }]}>{t("notify.shareWeather")}</Text>
            <Text style={[styles.shareDesc, { color: subColor }]}>
              {t("notify.shareDesc")}
            </Text>
          </View>
        </Pressable>

        {/* 받는 사람 목록 */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t("notify.recipients")}</Text>
          <Pressable
            onPress={() => {
              hapticLight();
              if (notifyState.recipients.length >= MAX_RECIPIENTS) {
                showToast(t("notify.maxReached", { max: MAX_RECIPIENTS }));
                return;
              }
              router.push("/notify-add" as never);
            }}
            hitSlop={12}
            style={[styles.addBtn, { backgroundColor: ap?.accent ?? "#60A5FA" }]}
          >
            <Plus size={16} weight="bold" color="#FFFFFF" />
          </Pressable>
        </View>

        {!notifyLoaded ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : notifyState.recipients.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.emptyText, { color: subColor }]}>
              {t("notify.emptyDesc")}
            </Text>
          </View>
        ) : (
          notifyState.recipients.map((r) => (
            <RecipientCard
              key={r.id}
              recipient={r}
              palette={ap}
              onPress={() => router.push(`/notify-detail?id=${r.id}` as never)}
            />
          ))
        )}

        {/* 초대 코드 입력 — 상대방이 코드를 받았을 때 */}
        <Pressable
          onPress={() => { hapticLight(); router.push("/notify-invite" as never); }}
          style={styles.inviteLink}
        >
          <Ticket size={16} color={subColor} />
          <Text style={[styles.inviteLinkText, { color: subColor }]}>
            {t("notify.gotInvite")}
          </Text>
        </Pressable>
      </ScrollView>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  shareTextWrap: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  shareDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  inviteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    marginTop: 8,
  },
  inviteLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

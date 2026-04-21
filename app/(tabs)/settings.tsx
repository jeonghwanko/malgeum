import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, LayoutAnimation, Alert, Linking } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { PaletteProvider, usePalette } from "@/context/PaletteContext";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { mapConditionToTexture } from "@/utils/weather";
import { themeById } from "@/constants/themes";
import { TOAST } from "@/constants/toastMessages";
import { subtractTimeMinutes } from "@/utils/date";
import { AlertCard } from "@/components/settings/AlertCard";
import { SettingRow } from "@/components/settings/SettingRow";
import { GlassCard } from "@/components/ui/GlassCard";
import { Toggle } from "@/components/ui/Toggle";
import type { AlertSettings } from "@/types/settings";
import { COLORS } from "@/constants/colors";
import { computePersonalityProfile } from "@/services/personalityService";
import type { PersonalityProfile } from "@/types/personality";
import { usePurchase } from "@/context/PurchaseContext";
import { useNotify } from "@/context/NotifyContext";
import { useLocale } from "@/i18n/useLocale";
import { t } from "@/i18n";
import { hapticLight } from "@/hooks/useHaptics";


function formatAlertTime(time: string | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? t("settings.am") : t("settings.pm");
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${hh}:${String(m).padStart(2, "0")}`;
}

function getAlertTime(key: keyof AlertSettings, commuteTime: { departure: string; return: string }): string | undefined {
  const dep = commuteTime.departure;
  const ret = commuteTime.return;
  switch (key) {
    case "commute": return subtractTimeMinutes(dep, 30);
    case "rain":    return subtractTimeMinutes(dep, 60);
    case "dust":    return subtractTimeMinutes(dep, 45);
    case "uv":      return "11:00";
    case "pollen":  return "08:00";
    case "evening": return subtractTimeMinutes(ret, 30);
    case "game":    return "21:00";
  }
}

function getAlertItems(): { key: keyof AlertSettings; icon: string; title: string; desc: string }[] {
  return [
    { key: "commute", icon: "🌅", title: t("settings.alert.commuteTitle"), desc: t("settings.alert.commuteDetail") },
    { key: "rain", icon: "🌧️", title: t("settings.alert.rainTitle"), desc: t("settings.alert.rainDetail") },
    { key: "dust", icon: "💨", title: t("settings.alert.dustTitle"), desc: t("settings.alert.dustDetail") },
    { key: "uv", icon: "☀️", title: t("settings.alert.uvTitle"), desc: t("settings.alert.uvDetail") },
    { key: "pollen", icon: "🌼", title: t("settings.alert.pollenTitle"), desc: t("settings.alert.pollenDetail") },
    { key: "evening", icon: "🌇", title: t("settings.alert.eveningTitle"), desc: t("settings.alert.eveningDetail") },
    { key: "game", icon: "🎯", title: t("settings.alert.gameTitle"), desc: t("settings.alert.gameDetail") },
  ];
}

export default function SettingsScreen() {
  const { state } = useWeatherContext();
  const { artStyle } = useTheme();
  const bgCondition = state.currentWeather?.condition ?? "clear";
  const textureKey = mapConditionToTexture(bgCondition);

  return (
    <PaletteProvider artStyle={artStyle} textureKey={textureKey}>
      <SettingsContent />
    </PaletteProvider>
  );
}

function SettingsContent() {
  const { state, dispatch } = useWeatherContext();
  const { artStyle } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ap = usePalette()!;
  const currentTheme = themeById(artStyle);
  const { isPremium } = usePurchase();
  const { state: notifyState } = useNotify();
  const { locale } = useLocale();
  const ALERT_ITEMS = getAlertItems();
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null);
  const [alertExpanded, setAlertExpanded] = useState(false);
  const [notiPermission, setNotiPermission] = useState(true);
  useEffect(() => {
    computePersonalityProfile().then(setPersonality);
    Notifications.getPermissionsAsync().then(({ status }) => setNotiPermission(status === "granted"));
  }, []);

  const activeAlertCount = Object.values(state.alerts ?? {}).filter(Boolean).length;
  const anyAlertOn = activeAlertCount > 0;

  const toggleMasterAlert = useCallback((value: boolean) => {
    if (value && !notiPermission) {
      Alert.alert(
        t("settings.alertPermissionTitle"),
        t("settings.alertPermissionDesc"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("home.openSettings"), onPress: () => { Linking.openSettings().catch(() => {}); } },
        ],
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newAlerts = ALERT_ITEMS.reduce(
      (acc, { key }) => ({ ...acc, [key]: value }),
      { ...state.alerts }
    );
    dispatch({ type: "BATCH_SET_ALERTS", payload: newAlerts });
    if (!value) setAlertExpanded(false);
    showToast(value ? TOAST.ALERT_ON(t("settings.allAlerts")) : TOAST.ALERT_OFF(t("settings.allAlerts")));
  }, [dispatch, showToast, state.alerts, notiPermission]);

  const toggleAlertDetail = useCallback(() => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAlertExpanded((v) => !v);
  }, []);

  const nb = ap?.notebook;
  const fontFamily = nb && nb.fontFamily !== "system" ? nb.fontFamily : undefined;
  const alertShadow = {
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 } as const,
    textShadowRadius: 4,
  };
  const shadow = {
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 } as const,
    textShadowRadius: 10,
  };

  const toggleAlert = (key: keyof AlertSettings, value: boolean) => {
    dispatch({ type: "SET_ALERT", payload: { key, enabled: value } });
    const item = ALERT_ITEMS.find((i) => i.key === key);
    const commuteTime = state.commuteTime ?? { departure: "08:30", return: "18:00" };
    const time = value ? getAlertTime(key, commuteTime) : undefined;
    showToast(value ? TOAST.ALERT_ON(item?.title ?? t("settings.alerts"), time) : TOAST.ALERT_OFF(item?.title ?? t("settings.alerts")));
  };

  const location = state.locations.find((l) => l.id === state.currentLocationId);
  const condition = state.currentWeather?.condition ?? "clear";

  return (
    <WeatherBackground condition={condition} isNight={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { fontFamily, fontWeight: fontFamily ? "normal" : "800", ...shadow }]}>
          {t("settings.title")}
        </Text>

        {/* 프리미엄 구독 */}
        <Pressable
          onPress={() => router.push("/subscription" as never)}
          style={({ pressed }) => [styles.premiumBanner, pressed && styles.premiumBannerPressed]}
        >
          <View style={styles.premiumBannerInner}>
            <View>
              <Text style={styles.premiumBannerTitle}>
                {isPremium ? t("settings.premiumActive") : t("settings.premiumInactive")}
              </Text>
              <Text style={styles.premiumBannerSub}>
                {isPremium ? t("settings.premiumManage") : t("settings.premiumUnlock")}
              </Text>
            </View>
            <Text style={styles.premiumBannerArrow}>›</Text>
          </View>
        </Pressable>

        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.widgetShare")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow label={t("settings.widgetSettings")} value="›" onPress={() => router.push("/widget-preview")} />
          <SettingRow label={t("settings.shareAction")} value="›" onPress={() => router.push("/share")} />
          <SettingRow label={t("settings.diary")} value="›" onPress={() => router.push("/diary" as never)} last />
        </GlassCard>

        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.alertSection")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <View style={styles.masterAlertRow}>
            <View style={styles.masterAlertText}>
              <Text style={[styles.masterAlertTitle, alertShadow]}>{t("settings.smartAlert")}</Text>
              <Text style={[styles.masterAlertDesc, { ...alertShadow, textShadowRadius: 3 }]}>
                {anyAlertOn ? t("settings.alertActive", { count: activeAlertCount }) : t("settings.alertAllOff")}
              </Text>
            </View>
            <Toggle value={anyAlertOn} onToggle={toggleMasterAlert} />
          </View>
          {anyAlertOn && (
            <Pressable onPress={toggleAlertDetail} style={styles.alertDetailBtn}>
              <Text style={styles.alertDetailText}>
                {alertExpanded ? t("settings.alertDetailClose") : t("settings.alertDetailOpen")}
              </Text>
            </Pressable>
          )}
        </GlassCard>
        {alertExpanded && anyAlertOn && ALERT_ITEMS.map((item) => (
          <AlertCard
            key={item.key}
            icon={item.icon}
            title={item.title}
            description={(() => { const t = formatAlertTime(getAlertTime(item.key, state.commuteTime)); return t ? `${item.desc} · ${t}` : item.desc; })()}
            enabled={state.alerts[item.key]}
            onToggle={(v) => toggleAlert(item.key, v)}
          />
        ))}

        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.basicSection")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow label={t("settings.locationLabel")} value={`${location?.name ?? t("home.defaultLocation")} ›`} onPress={() => router.push("/edit-location")} />
          <SettingRow label={t("settings.departureTime")} value={`${t("settings.am")} ${state.commuteTime.departure} ›`} onPress={() => router.push("/edit-commute")} />
          <SettingRow label={t("settings.returnTime")} value={`${t("settings.pm")} ${state.commuteTime.return} ›`} onPress={() => router.push("/edit-commute")} />
          {locale === "ko" && (
            <SettingRow label={t("settings.subway")} value={state.commuteTime.subwayStation ? `${state.commuteTime.subwayStation} ›` : `${t("settings.notSet")} ›`} onPress={() => router.push("/edit-subway" as never)} />
          )}
          {locale === "ko" && (
            <SettingRow label={t("settings.school")} value={state.schoolSettings?.schoolName ? `${state.schoolSettings.schoolName} ›` : `${t("settings.notSet")} ›`} onPress={() => router.push("/edit-school" as never)} />
          )}
          <SettingRow label={t("settings.tempUnit")} value={`°${state.tempUnit} ›`} onPress={() => router.push("/edit-temp-unit")} />
          <SettingRow label={t("settings.language")} value={locale === "ko" ? "한국어 ›" : "English ›"} onPress={() => router.push("/edit-language" as never)} />
          <SettingRow label={t("settings.theme")} value={`${currentTheme?.name ?? t("settings.auto")} ›`} onPress={() => router.push("/theme-gallery")} last />
        </GlassCard>

        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.healthProfile")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow
            label={t("settings.allergens")}
            value={
              state.healthProfile.allergens.length === 0
                ? `${t("settings.allergyNone")} ›`
                : state.healthProfile.allergens.length === 1
                ? `${state.healthProfile.allergens[0]} ›`
                : `${t("settings.allergyOther", { first: state.healthProfile.allergens[0], count: state.healthProfile.allergens.length - 1 })} ›`
            }
            onPress={() => router.push("/edit-allergens")}
          />
          <SettingRow
            label={t("settings.exercise")}
            value={`${state.healthProfile.exercisePreference || t("settings.notSet")} ›`}
            onPress={() => router.push("/edit-exercise")}
          />
          <SettingRow
            label={t("settings.clothingStyle")}
            value={`${state.healthProfile.clothingStyle || t("settings.notSet")} ›`}
            onPress={() => router.push("/edit-clothing")}
            last
          />
        </GlassCard>

        {/* 추천 적중률 — 항상 표시 */}
        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.accuracySection")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow
            label={t("settings.accuracy")}
            value={personality && personality.fbTotal > 0 ? `${personality.fbRate}% (${personality.fbTotal})` : t("settings.noFeedback")}
            onPress={() => router.push("/feedback")}
          />
          <SettingRow
            label={t("settings.rateToday")}
            value="›"
            onPress={() => router.push("/feedback")}
            last
          />
        </GlassCard>

        {/* 나의 날씨 성격 */}
        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>나의 날씨 성격</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow
            label={personality?.personalityType ? `${personality.personalityEmoji} ${personality.personalityLabel}` : t("personality.discovering")}
            value={
              personality && !personality.personalityType
                ? `${Math.round(personality.progress * 100)}% ›`
                : `${t("personality.viewDetail")} ›`
            }
            onPress={() => router.push("/personality")}
            last
          />
        </GlassCard>

        {/* 잔소리 */}
        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>{t("settings.nagSection")}</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow
            label={t("settings.nagManage")}
            value={`${notifyState.recipients.length}${t("settings.nagUnit")} ›`}
            onPress={() => router.push("/(tabs)/notify" as never)}
          />
          <SettingRow
            label={t("settings.nagInvite")}
            value="›"
            onPress={() => router.push("/notify-invite" as never)}
            last
          />
        </GlassCard>

        {/* 앱 정보 */}
        <View style={styles.sectionBadge}>
          <Text style={[styles.sectionBadgeText, fontFamily ? { fontFamily, fontWeight: "normal" } : null]}>앱 정보</Text>
        </View>
        <GlassCard style={styles.groupCard} palette={ap ?? undefined}>
          <SettingRow label={t("settings.appVersion")} value={Constants.expoConfig?.version ?? "0.1.0"} />
          <SettingRow label={t("subscription.privacyPolicy")} value="›" onPress={() => Linking.openURL("https://example.com/malgeum/privacy-policy.html")} />
          <SettingRow label={t("subscription.termsOfService")} value="›" onPress={() => Linking.openURL("https://example.com/malgeum/terms-of-service.html")} last />
        </GlassCard>
      </ScrollView>
    </WeatherBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24 },
  title: {
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  sectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
    marginTop: 18,
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  groupCard: {
    marginBottom: 4,
  },
  masterAlertRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 16,
  },
  masterAlertText: { flex: 1 },
  masterAlertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  masterAlertDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  alertDetailBtn: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    alignItems: "center",
  },
  alertDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  premiumBanner: {
    marginBottom: 22,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${COLORS.primary}4D`,   // #4A90D9 30% opacity
    backgroundColor: `${COLORS.primary}1A`, // #4A90D9 10% opacity
  },
  premiumBannerPressed: {
    opacity: 0.75,
  },
  premiumBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  premiumBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryLight,
    marginBottom: 3,
  },
  premiumBannerSub: {
    fontSize: 12,
    color: `${COLORS.primaryLight}99`,   // primaryLight 60% opacity
  },
  premiumBannerArrow: {
    fontSize: 20,
    color: `${COLORS.primaryLight}80`,   // primaryLight 50% opacity
  },
});

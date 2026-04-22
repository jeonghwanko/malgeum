import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { FloatingTabBar } from "@/components/ui/FloatingTabBar";
import { useWeatherRefresh } from "@/hooks/useWeatherRefresh";
import { useNotifications } from "@/hooks/useNotifications";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { PaletteProvider } from "@/context/PaletteContext";
import { mapConditionToTexture } from "@/utils/weather";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { t } from "@/i18n";
import { useLocale } from "@/i18n/useLocale";

export default function TabsLayout() {
  useWeatherRefresh();
  useNotifications();
  const router = useRouter();

  // 딥링크 cold-launch 시 pending 초대 코드가 있으면 modal push —
  // (tabs) 마운트 후 실행하므로 stack 순서 [tabs, modal] 보장.
  const pendingCheckedRef = useRef(false);
  useEffect(() => {
    if (pendingCheckedRef.current) return;
    pendingCheckedRef.current = true;
    (async () => {
      const code = await loadJson<string | null>(STORAGE_KEYS.PENDING_INVITE, null);
      if (code) {
        await saveJson(STORAGE_KEYS.PENDING_INVITE, null);
        router.push(`/notify-invite?code=${code}` as never);
      }
    })();
  }, [router]);

  const { state } = useWeatherContext();
  const { artStyle } = useTheme();
  const { locale } = useLocale();
  const textureKey = mapConditionToTexture(state.currentWeather?.condition ?? "clear");

  return (
    <PaletteProvider artStyle={artStyle} textureKey={textureKey}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: t("tab.home") }} />
        <Tabs.Screen name="weekly" options={{ title: t("tab.weekly") }} />
        <Tabs.Screen name="event" options={{ title: t("tab.discover"), href: locale === "ko" ? undefined : null }} />
        <Tabs.Screen name="notify" options={{ href: null }} />
        <Tabs.Screen name="commute" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ title: t("tab.settings") }} />
      </Tabs>
    </PaletteProvider>
  );
}

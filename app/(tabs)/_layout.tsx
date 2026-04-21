import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/ui/FloatingTabBar";
import { useWeatherRefresh } from "@/hooks/useWeatherRefresh";
import { useNotifications } from "@/hooks/useNotifications";
import { useWeatherContext } from "@/context/WeatherContext";
import { useTheme } from "@/context/ThemeContext";
import { PaletteProvider } from "@/context/PaletteContext";
import { mapConditionToTexture } from "@/utils/weather";
import { t } from "@/i18n";
import { useLocale } from "@/i18n/useLocale";

export default function TabsLayout() {
  useWeatherRefresh();
  useNotifications();

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

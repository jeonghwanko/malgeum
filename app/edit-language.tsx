import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenSheet } from "@/components/ui/ScreenSheet";
import { OptionCard } from "@/components/ui/OptionCard";
import { useLocale } from "@/i18n/useLocale";
import { syncWidgetData } from "@/services/widgetBridge";
import { useWeatherContext } from "@/context/WeatherContext";
import type { Locale } from "@/i18n";

const OPTIONS: { locale: Locale; emoji: string; label: string; desc: string }[] = [
  { locale: "ko", emoji: "🇰🇷", label: "한국어", desc: "Korean" },
  { locale: "en", emoji: "🇺🇸", label: "English", desc: "영어" },
];

export default function EditLanguageScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const { state } = useWeatherContext();

  const handleSelect = async (newLocale: Locale) => {
    await setLocale(newLocale);
    // 위젯 텍스트도 새 언어로 동기화
    syncWidgetData(state).catch(() => {});
    router.back();
  };

  return (
    <ScreenSheet title="Language" subtitle="언어를 선택하세요 · Select language">
      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.locale}
            emoji={o.emoji}
            label={o.label}
            description={o.desc}
            selected={locale === o.locale}
            onPress={() => handleSelect(o.locale)}
          />
        ))}
      </View>
    </ScreenSheet>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: 4 },
});

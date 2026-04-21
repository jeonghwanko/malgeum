import { useEffect, useRef, useState } from "react";
import { AppState as RNAppState, Platform, Text, TextInput, View, Image, StyleSheet as RNStyleSheet } from "react-native";

// 시스템 폰트 배율 무시 — 레이아웃 깨짐 방지
// @ts-ignore
Text.defaultProps = { ...(Text.defaultProps ?? {}), allowFontScaling: false };
// @ts-ignore
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), allowFontScaling: false };
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { parseInviteCode } from "@/types/notify";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import * as Notifications from "expo-notifications";
import * as Sentry from "@sentry/react-native";
import { WeatherProvider, useWeatherContext } from "@/context/WeatherContext";
import { RemoteConfigProvider } from "@/context/RemoteConfigContext";
import { PurchaseProvider } from "@/context/PurchaseContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotifyProvider } from "@/context/NotifyContext";

import { logScreenView } from "@/services/analytics";
import { initLocale } from "@/i18n";

import "../global.css";

/** expo-router pathname → GA 화면 이름 */
const SCREEN_NAME_MAP: Record<string, string> = {
  "/": "entry",
  "/(tabs)": "home",
  "/(tabs)/weekly": "weekly",
  "/(tabs)/event": "event",
  "/(tabs)/settings": "settings",
  "/(tabs)/commute": "commute",
  "/onboarding": "onboarding",
  "/onboarding/location": "onboarding_location",
  "/onboarding/notification": "onboarding_notification",
  "/onboarding/complete": "onboarding_complete",
  "/share": "share",
  "/feedback": "feedback",
  "/diary": "diary",
  "/card-detail": "card_detail",
  "/theme-gallery": "theme_gallery",
  "/theme-preview": "theme_preview",
  "/subscription": "subscription",
  "/widget-preview": "widget_preview",
  "/edit-commute": "edit_commute",
  "/edit-location": "edit_location",
  "/edit-profile": "edit_profile",
  "/edit-allergens": "edit_allergens",
  "/edit-exercise": "edit_exercise",
  "/edit-clothing": "edit_clothing",
  "/edit-temp-unit": "edit_temp_unit",
  "/edit-language": "edit_language",
  "/edit-subway": "edit_subway",
  "/edit-school": "edit_school",
  "/personality": "personality",
  "/(tabs)/notify": "notify",
  "/notify-detail": "notify_detail",
  "/notify-add": "notify_add",
  "/notify-invite": "notify_invite",
  "/prediction-game": "prediction_game",
  "/discover-detail": "discover_detail",
};

function toScreenName(pathname: string): string {
  if (__DEV__ && !SCREEN_NAME_MAP[pathname]) {
    console.warn(`[analytics] Unmapped route: ${pathname}`);
  }
  return SCREEN_NAME_MAP[pathname] ?? pathname.replace(/^\//, "").replace(/\//g, "_");
}

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
Sentry.init({
  dsn: SENTRY_DSN || undefined,
  enabled: !__DEV__ && !!SENTRY_DSN,
  tracesSampleRate: 0.2,
  ignoreErrors: [
    "Network request failed",
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    "Aborted",
    "AbortError",
  ],
});

SplashScreen.preventAutoHideAsync();

// i18n 초기화 — 모듈 로드 시 즉시 시작 (Promise 캐싱)
const localeReady = initLocale();

// 노트북 스타일 필기 폰트 프리로드
Font.loadAsync({
  "NanumPen": require("../assets/fonts/NanumPenScript-Regular.ttf"),
});

// 백그라운드 날씨 체크 태스크 정의 (OS가 주기적으로 실행 → 조건부 알림 재스케줄)
import { defineBackgroundWeatherTask, registerBackgroundWeatherTask } from "@/services/backgroundWeatherTask";
defineBackgroundWeatherTask();

function RootNavigator() {
  const { loaded } = useWeatherContext();
  const { themeReady } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const prevPathRef = useRef<string | null>(null);
  const [showCustomSplash, setShowCustomSplash] = useState(Platform.OS === "android");

  // 앱 실행 중 딥링크 수신 (백그라운드 → 포그라운드)
  // cold-start는 index.tsx가 처리 (onboarding 분기 필요)
  const routerRef = useRef(router);
  routerRef.current = router;
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const code = parseInviteCode(url);
      if (code) {
        routerRef.current.push(`/notify-invite?code=${code}` as never);
        return;
      }
      if (url.includes("malgeum://home")) {
        routerRef.current.replace("/(tabs)" as never);
      }
    });
    return () => sub.remove();
  }, []);

  // 전역 screen_view 트래킹 — 모든 라우트 전환 감지
  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;
    logScreenView(toScreenName(pathname));
  }, [pathname]);

  // 데이터 + 테마 준비 후 네이티브 스플래시 숨김 + 커스텀 스플래시 해제
  useEffect(() => {
    if (!loaded || !themeReady) return;
    const delay = Platform.OS === "ios" ? 400 : 0;
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setShowCustomSplash(false);
    }, delay);
    return () => clearTimeout(t);
  }, [loaded, themeReady]);

  // 백그라운드 날씨 태스크 등록 (로딩 완료 후 1회)
  useEffect(() => {
    if (!loaded) return;
    registerBackgroundWeatherTask().catch(() => {});
  }, [loaded]);

  // 안전장치: 6초 후 강제 해제
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setShowCustomSplash(false);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // 앱 오픈/포그라운드 복귀 시 앱 아이콘 배지(빨콩이) 초기화
  useEffect(() => {
    Notifications.setBadgeCountAsync(0).catch(() => {});
    Notifications.dismissAllNotificationsAsync().catch(() => {});

    const sub = RNAppState.addEventListener("change", (next) => {
      if (next === "active") {
        Notifications.setBadgeCountAsync(0).catch(() => {});
        Notifications.dismissAllNotificationsAsync().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  const sheetOptions = { presentation: "transparentModal" as const, animation: "none" as const, gestureEnabled: false };

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="theme-gallery"
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="theme-preview" options={sheetOptions} />
        <Stack.Screen
          name="share"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="edit-commute" options={sheetOptions} />
        <Stack.Screen name="edit-location" options={sheetOptions} />
        <Stack.Screen name="edit-profile" options={sheetOptions} />
        <Stack.Screen name="feedback" options={sheetOptions} />
        <Stack.Screen name="diary" options={sheetOptions} />
        <Stack.Screen name="widget-preview" options={sheetOptions} />
        <Stack.Screen name="edit-allergens" options={sheetOptions} />
        <Stack.Screen name="edit-exercise" options={sheetOptions} />
        <Stack.Screen name="edit-clothing" options={sheetOptions} />
        <Stack.Screen name="edit-temp-unit" options={sheetOptions} />
        <Stack.Screen name="edit-language" options={sheetOptions} />
        <Stack.Screen name="edit-subway" options={sheetOptions} />
        <Stack.Screen name="edit-school" options={sheetOptions} />
        <Stack.Screen name="card-detail" options={sheetOptions} />
        <Stack.Screen name="personality" options={sheetOptions} />
        <Stack.Screen name="notify-detail" options={sheetOptions} />
        <Stack.Screen name="notify-add" options={sheetOptions} />
        <Stack.Screen name="notify-invite" options={sheetOptions} />
        <Stack.Screen name="prediction-game" options={sheetOptions} />
        <Stack.Screen name="discover-detail" options={{ presentation: "modal" as const, animation: "slide_from_bottom" as const }} />
        <Stack.Screen name="debug-seed" options={{ headerShown: false }} />
      </Stack>
      {showCustomSplash && (
        <View style={splashStyles.overlay} pointerEvents="none">
          <Image
            source={require("../assets/images/splash.png")}
            style={splashStyles.image}
            resizeMode="cover"
          />
        </View>
      )}
    </>
  );
}

function RootLayout() {
  const [localeLoaded, setLocaleLoaded] = useState(false);
  useEffect(() => { localeReady.then(() => setLocaleLoaded(true)); }, []);

  // locale 감지 완료 전에는 렌더하지 않음 (스플래시 유지)
  if (!localeLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <RemoteConfigProvider>
              <WeatherProvider>
                <PurchaseProvider>
                  <ThemeProvider>
                    <NotifyProvider>
                      <ToastProvider>
                        <RootNavigator />
                      </ToastProvider>
                    </NotifyProvider>
                  </ThemeProvider>
                </PurchaseProvider>
              </WeatherProvider>
            </RemoteConfigProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const splashStyles = RNStyleSheet.create({
  overlay: {
    ...RNStyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "#E8E0D4",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default Sentry.wrap(RootLayout);

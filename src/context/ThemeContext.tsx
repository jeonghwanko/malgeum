import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { AllArtStyleKey, PremiumArtStyleKey } from "@/types/settings";
import { FREE_STYLE_KEYS, PREMIUM_STYLE_KEYS } from "@/constants/themes";
import { usePurchase } from "./PurchaseContext";
import { useWeatherContext } from "./WeatherContext";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { syncWidgetData } from "@/services/widgetBridge";
import { logThemeChange } from "@/services/analytics";

interface ThemeState {
  style: AllArtStyleKey;
  pinned: boolean; // 유저가 직접 선택했으면 true → 이후 고정
}

interface ThemeContextValue {
  artStyle: AllArtStyleKey;
  setArtStyle: (style: AllArtStyleKey) => void;
  isPremium: boolean;
  isPinned: boolean;       // 유저가 직접 선택한 상태
  clearPin: () => void;    // 자동 추천으로 돌아가기
  themeReady: boolean;     // 초기 테마 결정 완료 (스플래시 해제 조건)
}

const ThemeContext = createContext<ThemeContextValue>({
  artStyle: "default",
  setArtStyle: () => {},
  isPremium: false,
  isPinned: false,
  clearPin: () => {},
  themeReady: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [artStyle, setArtStyleState] = useState<AllArtStyleKey>("default");
  const [pinned, setPinned] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const { isPremium } = usePurchase();
  const { state: weatherState } = useWeatherContext();

  const mountedRef = useRef(true);
  const weatherStateRef = useRef(weatherState);
  weatherStateRef.current = weatherState;

  // 1. 저장된 테마 로드
  useEffect(() => {
    loadJson<ThemeState | null>(STORAGE_KEYS.THEME, null).then((saved) => {
      if (!mountedRef.current) return;
      if (saved?.pinned && saved.style) {
        const validKeys = new Set<string>(["default", ...FREE_STYLE_KEYS, ...PREMIUM_STYLE_KEYS]);
        if (validKeys.has(saved.style)) {
          setArtStyleState(saved.style);
          setPinned(true);
          setThemeReady(true);
        }
        // 유효하지 않은 키(앱 업데이트로 이름 바뀐 테마)는 자동 추천으로 복귀
      }
      setThemeLoaded(true);
    });
    return () => { mountedRef.current = false; };
  }, []);

  // 2. 구독 취소 시 프리미엄 테마 pin 해제 (isPremium이 확정된 시점에 교차 검증)
  useEffect(() => {
    if (!mountedRef.current) return;
    if (!themeLoaded) return;
    if (isPremium) return;
    if (!pinned) return;
    if (PREMIUM_STYLE_KEYS.includes(artStyle as PremiumArtStyleKey)) {
      setPinned(false);
      saveJson(STORAGE_KEYS.THEME, { style: artStyle, pinned: false });
    }
  }, [themeLoaded, isPremium, pinned, artStyle]);

  // 3. 테마 로드 완료 → themeReady 설정
  useEffect(() => {
    if (themeLoaded && !themeReady) setThemeReady(true);
  }, [themeLoaded, themeReady]);

  // 유저 직접 선택 → pinned = true
  const artStyleRef = useRef(artStyle);
  artStyleRef.current = artStyle;

  const setArtStyle = useCallback((style: AllArtStyleKey) => {
    logThemeChange(artStyleRef.current, style, isPremium);
    setArtStyleState(style);
    setPinned(true);
    saveJson(STORAGE_KEYS.THEME, { style, pinned: true }).then(() => {
      syncWidgetData(weatherStateRef.current);
    });
  }, [isPremium]);

  // 기본 테마로 되돌리기
  const clearPin = useCallback(() => {
    setArtStyleState("default");
    setPinned(false);
    saveJson(STORAGE_KEYS.THEME, { style: "default", pinned: false }).then(() => {
      syncWidgetData(weatherStateRef.current);
    });
  }, []);

  const value = useMemo(
    () => ({ artStyle, setArtStyle, isPremium, isPinned: pinned, clearPin, themeReady }),
    [artStyle, setArtStyle, isPremium, pinned, clearPin, themeReady],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

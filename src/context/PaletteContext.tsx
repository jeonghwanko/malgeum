import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { getAdaptivePalette, type AdaptivePalette } from "@/constants/adaptivePalette";
import type { AllArtStyleKey } from "@/types/settings";
import type { TextureWeatherKey } from "@/types/weather";

const PaletteContext = createContext<AdaptivePalette | null>(null);
const PaletteCommitContext = createContext<(() => void) | null>(null);

interface PaletteProviderProps {
  artStyle: AllArtStyleKey;
  textureKey: TextureWeatherKey;
  children: React.ReactNode;
}

export function PaletteProvider({ artStyle, textureKey, children }: PaletteProviderProps) {
  const nextPalette = useMemo(
    () => getAdaptivePalette(artStyle, textureKey),
    [artStyle, textureKey],
  );

  const [palette, setPalette] = useState(nextPalette);
  const pendingRef = useRef(nextPalette);
  const isFirstRender = useRef(true);

  // 항상 최신 팔레트를 ref에 보관
  pendingRef.current = nextPalette;

  useEffect(() => {
    // 최초 마운트: 즉시 적용 (크로스페이드 없음)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setPalette(nextPalette);
      return;
    }
    // 폴백: WeatherBackground가 없는 화면 (설정 등)에서도 팔레트 반영
    const fallback = setTimeout(() => setPalette(pendingRef.current), 800);
    return () => clearTimeout(fallback);
  }, [nextPalette]);

  // WeatherBackground 크로스페이드 완료 시 호출 — 동일 runOnJS 배치에서 실행되므로 정확히 동기화
  const commitPalette = useCallback(() => {
    setPalette(pendingRef.current);
  }, []);

  return (
    <PaletteCommitContext.Provider value={commitPalette}>
      <PaletteContext.Provider value={palette}>
        {children}
      </PaletteContext.Provider>
    </PaletteCommitContext.Provider>
  );
}

/**
 * Context에서 AdaptivePalette를 가져온다.
 * PaletteProvider 밖에서 호출하면 null 반환 (Settings 등 light-mode 화면).
 */
export function usePalette(): AdaptivePalette | null {
  return useContext(PaletteContext);
}

/**
 * WeatherBackground 전용 — 크로스페이드 완료 후 팔레트 commit 트리거.
 * PaletteProvider 밖에서 호출하면 null (no-op).
 */
export function usePaletteCommit(): (() => void) | null {
  return useContext(PaletteCommitContext);
}

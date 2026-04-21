import { useCallback } from "react";
import { type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

export interface WeatherScrollReturn {
  scrollY: SharedValue<number>;
  scrollHandler: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function useWeatherScroll(): WeatherScrollReturn {
  const scrollY = useSharedValue(0);

  const scrollHandler = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  return { scrollY, scrollHandler };
}

import { useCallback, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const SPRING_CONFIG  = { damping: 28, stiffness: 300, mass: 0.8 };
const SPRING_SNAP    = { damping: 24, stiffness: 400, mass: 0.6 };
const DISMISS_THRESHOLD = 80;

export function useBottomSheetAnim(sheetHeight: number, onDismiss: () => void) {
  const translateY   = useSharedValue(sheetHeight);
  const dragContext  = useSharedValue(0);

  const open = useCallback(() => {
    translateY.value = withSpring(0, SPRING_CONFIG);
  }, [translateY]);

  // 버튼 탭으로 닫을 때 — 원하는 콜백(dismiss / askMore / share 등) 전달
  const animateClose = useCallback((callback: () => void) => {
    translateY.value = withTiming(
      sheetHeight,
      { duration: 260, easing: Easing.in(Easing.cubic) },
      () => { runOnJS(callback)(); },
    );
  }, [translateY, sheetHeight]);

  // 시트 전체 드래그-to-dismiss
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(10)
        .onStart(() => {
          dragContext.value = translateY.value;
        })
        .onUpdate((e) => {
          const next = dragContext.value + e.translationY;
          // 위로 당기면 저항감 (15% 반영)
          translateY.value = next < 0 ? next * 0.15 : next;
        })
        .onEnd((e) => {
          if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 600) {
            const remaining = sheetHeight - translateY.value;
            const velocity  = Math.max(e.velocityY, 800);
            const duration  = Math.min(Math.max((remaining / velocity) * 1000, 150), 350);
            translateY.value = withTiming(
              sheetHeight,
              { duration, easing: Easing.out(Easing.quad) },
              () => { runOnJS(onDismiss)(); },
            );
          } else {
            translateY.value = withSpring(0, SPRING_SNAP);
          }
        }),
    [dragContext, translateY, sheetHeight, onDismiss],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // 드래그 위치에 따라 backdrop 자동 페이드
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, sheetHeight], [1, 0], Extrapolation.CLAMP),
  }));

  return { open, animateClose, panGesture, sheetStyle, backdropStyle };
}

import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { X } from "phosphor-react-native";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 100;
const SPRING_OPEN = { damping: 28, stiffness: 300, mass: 0.8 };
const SPRING_SNAP = { damping: 24, stiffness: 400, mass: 0.6 };

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const sheetHeight = Math.round(screenH * (2 / 3));
  const translateY = useSharedValue(sheetHeight);
  const dragContext = useSharedValue(0);
  const isScrolledToTop = useSharedValue(true);

  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_OPEN);
    } else {
      translateY.value = withTiming(sheetHeight, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, sheetHeight, translateY]);

  const animateClose = useCallback(() => {
    translateY.value = withTiming(sheetHeight, {
      duration: 280,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) runOnJS(dismiss)();
    });
  }, [translateY, sheetHeight, dismiss]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isScrolledToTop.value = e.nativeEvent.contentOffset.y <= 2;
  }, [isScrolledToTop]);

  const nativeGesture = useMemo(() => Gesture.Native(), []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(10)
        .simultaneousWithExternalGesture(nativeGesture)
        .onStart(() => {
          dragContext.value = translateY.value;
        })
        .onUpdate((e) => {
          if (!isScrolledToTop.value && e.translationY <= 0) return;

          const next = dragContext.value + e.translationY;
          if (next < 0) {
            translateY.value = next * 0.15;
          } else {
            translateY.value = next;
          }
        })
        .onEnd((e) => {
          if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 600) {
            const remaining = sheetHeight - translateY.value;
            const velocity = Math.max(e.velocityY, 800);
            const duration = Math.min(Math.max((remaining / velocity) * 1000, 150), 350);
            translateY.value = withTiming(sheetHeight, {
              duration,
              easing: Easing.out(Easing.quad),
            }, (finished) => {
              if (finished) runOnJS(dismiss)();
            });
          } else {
            translateY.value = withSpring(0, SPRING_SNAP);
          }
        }),
    [nativeGesture, sheetHeight, dismiss],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetHeight],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} accessibilityLabel="닫기" accessibilityRole="button" />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: sheetHeight, paddingBottom: Math.max(insets.bottom, 20) + 16 },
              sheetStyle,
            ]}
          >
            <View style={styles.dragZone}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={animateClose} style={styles.closeBtn} hitSlop={10} accessibilityLabel="닫기" accessibilityRole="button">
                  <X size={16} color={COLORS.textSecondary} />
                </Pressable>
              </View>
            </View>

            <GestureDetector gesture={nativeGesture}>
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
                bounces={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {children}
              </ScrollView>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  dragZone: {
    paddingTop: 14,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderMedium,
    alignSelf: "center",
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.textLight,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollInner: {
    paddingBottom: 20,
  },
});

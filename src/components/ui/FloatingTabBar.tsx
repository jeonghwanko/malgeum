import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { House, CalendarBlank, Gear, Compass } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "@/context/PaletteContext";
import { hapticLight } from "@/hooks/useHaptics";

export type TabBarVariant = "light" | "dark" | "warm";

const TAB_CONFIG: Record<string, { label: string; Icon: typeof House }> = {
  index: { label: "\uD648", Icon: House },
  weekly: { label: "\uC8FC\uAC04", Icon: CalendarBlank },
  event: { label: "\uBC1C\uACAC", Icon: Compass },
  settings: { label: "\uC124\uC815", Icon: Gear },
};

interface FloatingTabBarExtraProps {
  variant?: TabBarVariant;
}

export function FloatingTabBar({
  state,
  navigation,
  variant = "light",
}: BottomTabBarProps & FloatingTabBarExtraProps) {
  const insets = useSafeAreaInsets();
  const ap = usePalette();

  const accentDot = ap?.accent ?? "#FFFFFF";
  const activeColor = "#FFFFFF";
  const inactiveColor = ap?.textTertiary ?? "rgba(255,255,255,0.4)";

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={[styles.inner, { backgroundColor: ap?.tabBarBg ?? "#0F172A" }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              hapticLight();
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              label={config.label}
              Icon={config.Icon}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              accentDot={accentDot}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  isFocused,
  onPress,
  label,
  Icon,
  activeColor,
  inactiveColor,
  accentDot,
}: {
  isFocused: boolean;
  onPress: () => void;
  label: string;
  Icon: typeof House;
  activeColor: string;
  inactiveColor: string;
  accentDot: string;
}) {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSequence(
        withTiming(0.82, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }
  }, [isFocused, iconScale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
    >
      {isFocused && <AnimatedDot color={accentDot} />}
      <Animated.View style={iconStyle}>
        <Icon
          size={22}
          weight={isFocused ? "fill" : "regular"}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      {isFocused && <AnimatedLabel label={label} color={activeColor} />}
    </TouchableOpacity>
  );
}

function AnimatedDot({ color }: { color: string }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return <Animated.View style={[styles.activeDot, { backgroundColor: color }, style]} />;
}

function AnimatedLabel({ label, color }: { label: string; color: string }) {
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withSpring(1, { damping: 14, stiffness: 180 });
  }, [enter]);
  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [5, 0]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.label, { color }, style]}
      maxFontSizeMultiplier={1.2}
    >
      {label}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 36,
    right: 36,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 2,
  },
  activeDot: {
    position: "absolute",
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

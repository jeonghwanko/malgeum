import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";
import { hapticMedium } from "@/hooks/useHaptics";

interface ToggleProps {
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function Toggle({ value, onToggle }: ToggleProps) {
  const translateX = useSharedValue(value ? 22 : 2);

  React.useEffect(() => {
    translateX.value = withSpring(value ? 22 : 2, {
      damping: 15,
      stiffness: 200,
    });
  }, [value, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={() => { hapticMedium(); onToggle(!value); }}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  trackOn: {
    backgroundColor: COLORS.primary,
  },
  trackOff: {
    backgroundColor: "#CBD5E1",
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

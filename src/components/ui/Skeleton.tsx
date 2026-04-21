import React, { createContext, useContext, useEffect } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  type SharedValue,
} from "react-native-reanimated";

// ── Shared pulse: single animation drives all children ──

const PulseContext = createContext<SharedValue<number> | null>(null);

function usePulse(): SharedValue<number> {
  const ctx = useContext(PulseContext);
  if (ctx) return ctx;
  // Standalone Skeleton — create own animation
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  return opacity;
}

/** Wrap multiple Skeleton children so they share a single animation driver */
function SkeletonGroup({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  return <PulseContext.Provider value={opacity}>{children}</PulseContext.Provider>;
}

// ── Skeleton primitives ──

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Shimmer pulse skeleton placeholder */
export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const pulse = usePulse();
  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View style={[styles.base, { height, borderRadius }, animStyle]} />
    </View>
  );
}

// ── Composite skeletons (each wraps children in SkeletonGroup) ──

/** Row-shaped skeleton for list items (e.g., weekly past day rows) */
export function SkeletonRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonGroup>
      <View style={[styles.row, style]}>
        <Skeleton width={36} height={14} borderRadius={4} />
        <Skeleton width={30} height={14} borderRadius={4} />
        <Skeleton width={40} height={20} borderRadius={6} />
        <View style={{ flex: 1 }} />
        <Skeleton width={50} height={14} borderRadius={4} />
      </View>
    </SkeletonGroup>
  );
}

/** Card-shaped skeleton for recipient cards */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonGroup>
      <View style={[styles.card, style]}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardLines}>
          <Skeleton width={100} height={14} borderRadius={4} />
          <Skeleton width={150} height={12} borderRadius={4} />
        </View>
      </View>
    </SkeletonGroup>
  );
}

/** Stats grid skeleton (3 cells) */
export function SkeletonStats({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonGroup>
      <View style={[styles.statsGrid, style]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statsCell}>
            <Skeleton width={40} height={24} borderRadius={6} />
            <Skeleton width={50} height={10} borderRadius={3} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

/** History dots skeleton (7 dots) */
export function SkeletonDots({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <SkeletonGroup>
      <View style={[styles.dotsRow, style]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.dotCol}>
            <Skeleton width={10} height={10} borderRadius={3} />
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.10)",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  cardLines: {
    flex: 1,
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statsCell: {
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 24,
  },
  dotCol: {
    alignItems: "center",
    gap: 6,
  },
});

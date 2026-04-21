import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

interface Props {
  visible: boolean;
  onHidden: () => void;
}

export function AppSplash({ visible, onHidden }: Props) {
  const whiteOverlay = useRef(new Animated.Value(0)).current;
  const hideTriggered = useRef(false);

  const triggerExit = () => {
    if (hideTriggered.current) return;
    hideTriggered.current = true;
    // 점점 밝아지면서 사라짐 (따뜻한 빛이 차오르는 느낌)
    Animated.timing(whiteOverlay, {
      toValue: 1,
      duration: 800,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onHidden());
  };

  useEffect(() => {
    if (visible) return;
    triggerExit();
  }, [visible]);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 네이티브 스플래시와 동일한 합성 이미지 (이음새 없음) */}
      <Image
        source={require("../../../assets/images/splash.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* 밝아지는 흰색 오버레이 */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "#FFF8F0", opacity: whiteOverlay }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8E0D4",
    zIndex: 9999,
  },
});

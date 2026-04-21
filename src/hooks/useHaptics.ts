import * as Haptics from "expo-haptics";

/** Standalone 햅틱 함수 — runOnJS 등 훅 외부에서도 사용 가능 */
export const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const hapticHeavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
export const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

export function useHaptics() {
  return { light: hapticLight, medium: hapticMedium, heavy: hapticHeavy, success: hapticSuccess };
}

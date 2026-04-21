import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="invited" options={{ animation: "fade" }} />
      <Stack.Screen name="location" options={{ animation: "fade" }} />
      <Stack.Screen name="notification" options={{ animation: "fade" }} />
    </Stack>
  );
}

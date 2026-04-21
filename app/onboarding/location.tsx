import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MapPin } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { logOnboardingStep } from "@/services/analytics";
import { t } from "@/i18n";
import { OnboardingLayout, onboardingStyles as s } from "@/components/ui/OnboardingLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { requestLocationPermission, getCurrentPosition, reverseGeocode } from "@/services/locationService";
import { fetchWithCache } from "@/services/weatherApi";
import { useWeatherContext } from "@/context/WeatherContext";
import { DiscoveryCard } from "@/components/onboarding/DiscoveryCard";
import { generateActionCards } from "@/utils/recommendations";
import { getConditionLabel } from "@/utils/weather";
import { getActionIcon, ActionIconFallback } from "@/constants/actionIcons";
import type { IconProps } from "phosphor-react-native";
import type { ComponentType } from "react";
import type { WeatherBundle } from "@/types/weather";
import type { HealthProfile } from "@/types/settings";

type Phase = "ready" | "locating" | "discovered";

// Minimum duration for "locating" phase so the discovery moment feels intentional
// even when fetchWithCache hits the cache.
const MIN_LOCATING_MS = 900;

function pickTeaser(
  bundle: WeatherBundle,
  profile: HealthProfile | undefined,
  tempUnit: "C" | "F",
): { Icon: ComponentType<IconProps>; text: string } {
  const cards = generateActionCards(bundle, profile, tempUnit);
  const top = cards[0];
  if (!top) return { Icon: ActionIconFallback, text: t("onboarding.locationFallback") };
  return {
    Icon: getActionIcon(top.icon),
    text: top.title,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Expanding radar ring — 2 staggered rings that expand & fade
function LocatingPulse() {
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);

  useEffect(() => {
    r1.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    r2.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, []);

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + r1.value * 1.4 }],
    opacity: 1 - r1.value,
  }));
  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + r2.value * 1.4 }],
    opacity: 1 - r2.value,
  }));

  return (
    <View style={pulseStyles.wrap}>
      <Animated.View style={[pulseStyles.ring, ringStyle1]} />
      <Animated.View style={[pulseStyles.ring, ringStyle2]} />
      <View style={pulseStyles.core}>
        <MapPin size={36} weight="fill" color={COLORS.primaryLight} />
      </View>
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  wrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  core: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(74,144,217,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// Memoized discovered reveal — prevents re-computing teaser on unrelated renders
function DiscoveredReveal({
  name,
  bundle,
  profile,
  tempUnit,
}: {
  name: string;
  bundle: WeatherBundle;
  profile: HealthProfile | undefined;
  tempUnit: "C" | "F";
}) {
  const teaser = useMemo(() => pickTeaser(bundle, profile, tempUnit), [bundle, profile, tempUnit]);
  const { current } = bundle;
  return (
    <DiscoveryCard
      locationName={name}
      temp={current.temp}
      condition={current.condition}
      conditionLabel={getConditionLabel(current.condition)}
      TeaserIcon={teaser.Icon}
      teaserText={teaser.text}
      tempUnit={tempUnit}
    />
  );
}

export default function OnboardingStep1() {
  const router = useRouter();
  const { state, dispatch } = useWeatherContext();
  const [phase, setPhase] = useState<Phase>("ready");
  const [discovered, setDiscovered] = useState<{ name: string; bundle: WeatherBundle } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAllow = async () => {
    if (busy) return;                             // guard double-tap
    setBusy(true);
    try {
      // 1. Request permission FIRST — keep "ready" phase visible under the native dialog
      const granted = await requestLocationPermission();
      logOnboardingStep(granted ? "location_granted" : "location_denied");
      if (!granted) {
        router.push("/onboarding/notification");
        return;
      }

      // 2. Only NOW switch to loading screen
      setPhase("locating");
      const startedAt = Date.now();

      const pos = await getCurrentPosition();
      if (!pos) {
        router.push("/onboarding/notification");
        return;
      }

      // 3. Fetch name + weather in parallel
      const [name, bundle] = await Promise.all([
        reverseGeocode(pos.lat, pos.lon),
        fetchWithCache(pos.lat, pos.lon),
      ]);

      // 4. Guarantee minimum loading duration so the transition feels intentional
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOCATING_MS) {
        await sleep(MIN_LOCATING_MS - elapsed);
      }

      dispatch({
        type: "ADD_LOCATION",
        payload: { location: { id: "gps", name, lat: pos.lat, lon: pos.lon, isGps: true } },
      });
      dispatch({ type: "SET_WEATHER", payload: bundle });
      setDiscovered({ name, bundle });
      setPhase("discovered");
    } catch {
      // Network/permission issue → skip discovery, continue flow
      router.push("/onboarding/notification");
    } finally {
      setBusy(false);
    }
  };

  const handleNext = () => {
    logOnboardingStep("discovery_next");
    router.push("/onboarding/notification");
  };

  // ── Phase: discovered (DiscoveryCard reveal) ──
  if (phase === "discovered" && discovered) {
    return (
      <OnboardingLayout
        bottom={<PrimaryButton label={t("common.next")} onPress={handleNext} style={s.btn} />}
      >
        <DiscoveredReveal
          name={discovered.name}
          bundle={discovered.bundle}
          profile={state.healthProfile}
          tempUnit={state.tempUnit}
        />
      </OnboardingLayout>
    );
  }

  // ── Phase: locating (radar pulse) — 버튼 없음, 슬롯은 예약 ──
  if (phase === "locating") {
    return (
      <OnboardingLayout bottom={null}>
        <LocatingPulse />
        <Text style={s.title}>{t("onboarding.locating")}</Text>
        <Text style={s.desc}>{t("onboarding.locatingDesc")}</Text>
      </OnboardingLayout>
    );
  }

  // ── Phase: ready (initial) ──
  return (
    <OnboardingLayout
      bottom={<PrimaryButton label={t("onboarding.continue")} onPress={handleAllow} style={s.btn} />}
    >
      <View style={s.iconWrap}>
        <MapPin size={52} weight="fill" color={COLORS.primaryLight} />
      </View>
      <Text style={s.title}>{t("onboarding.locationHeroTitle")}</Text>
      <Text style={s.desc}>{t("onboarding.locationHeroDesc")}</Text>
    </OnboardingLayout>
  );
}

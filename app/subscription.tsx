import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Linking,
} from "react-native";

const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ?? "https://example.com/malgeum/privacy-policy.html";
const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ?? "https://example.com/malgeum/terms-of-service.html";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ArrowCounterClockwise, Palette, DeviceMobile, ChatCircle, Image } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { usePurchase } from "@/context/PurchaseContext";
import { useWeatherContext } from "@/context/WeatherContext";
import { WeatherBackground } from "@/components/weather/WeatherBackground";
import { logSubscriptionView, logSubscriptionStart, logSubscriptionRestore } from "@/services/analytics";
import { t } from "@/i18n";

const FEATURE_KEYS = [
  { icon: <Palette size={15} color={COLORS.primaryLight} />, key: "subscription.feature1" },
  { icon: <DeviceMobile size={15} color={COLORS.primaryLight} />, key: "subscription.feature2" },
  { icon: <ChatCircle size={15} color={COLORS.primaryLight} />, key: "subscription.feature3" },
  { icon: <Image size={15} color={COLORS.primaryLight} />, key: "subscription.feature4" },
] as const;

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useWeatherContext();
  const { isPremium, loading, currentPackage, purchase, restore } = usePurchase();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isActingRef = useRef(false);

  const condition = state.currentWeather?.condition ?? "clear";

  React.useEffect(() => { logSubscriptionView(); }, []);

  const handlePurchase = async () => {
    if (isActingRef.current) return;
    isActingRef.current = true;
    setPurchasing(true);
    try {
      const { success, userCancelled } = await purchase();
      if (success) {
        logSubscriptionStart(currentPackage?.product?.priceString ?? "");
        Alert.alert(t("subscription.successTitle"), t("subscription.successDesc"), [
          { text: t("common.confirm"), onPress: () => router.back() },
        ]);
      } else if (!userCancelled) {
        Alert.alert(t("subscription.failTitle"), t("subscription.failDesc"));
      }
    } finally {
      setPurchasing(false);
      isActingRef.current = false;
    }
  };

  const handleRestore = async () => {
    if (isActingRef.current) return;
    isActingRef.current = true;
    setRestoring(true);
    try {
      const success = await restore();
      logSubscriptionRestore(success);
      if (success) {
        Alert.alert(t("subscription.restoreSuccess"), t("subscription.restoreSuccessDesc"));
      } else {
        Alert.alert(t("subscription.restoreFail"), t("subscription.restoreFailDesc"));
      }
    } finally {
      setRestoring(false);
      isActingRef.current = false;
    }
  };

  return (
    <WeatherBackground condition={condition} isNight={false}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <ModalHeader title={t("subscription.premiumTitle")} onClose={() => router.back()} closeIconColor="#FFFFFF" closeBgColor="rgba(255,255,255,0.2)" />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primaryLight} />
            </View>
          ) : isPremium ? (
            <PremiumActiveSection onRestore={handleRestore} restoring={restoring} />
          ) : (
            <PaywallSection
              onPurchase={handlePurchase}
              onRestore={handleRestore}
              purchasing={purchasing}
              restoring={restoring}
              hasPackage={!!currentPackage}
              priceLabel={currentPackage?.product?.priceString ?? ""}
              hasFreeTrial={!!currentPackage?.product?.introPrice}
              trialDays={currentPackage?.product?.introPrice?.periodNumberOfUnits ?? 0}
            />
          )}
        </ScrollView>
      </View>
    </WeatherBackground>
  );
}

function PremiumActiveSection({
  onRestore,
  restoring,
}: {
  onRestore: () => void;
  restoring: boolean;
}) {
  return (
    <View style={styles.section}>
      {/* 구독 중 배지 */}
      <View style={styles.activeBadge}>
        <Check size={16} color="#10B981" weight="bold" />
        <Text style={styles.activeBadgeText}>{t("subscription.subscribing")}</Text>
      </View>

      <Text style={styles.heroTitle}>{t("subscription.usingPremium")}</Text>
      <Text style={styles.heroSubtitle}>{t("subscription.enjoyThemes")}</Text>

      {/* 활성 혜택 카드 */}
      <GlassCard style={styles.featureCard}>
        {FEATURE_KEYS.map((f, i) => (
          <View key={i} style={[styles.featureRow, i > 0 && styles.featureRowDivider]}>
            <View style={styles.featureIconWrap}>{f.icon}</View>
            <Text style={styles.featureText}>{t(f.key)}</Text>
            <Check size={13} color="#10B981" weight="bold" />
          </View>
        ))}
      </GlassCard>

      {/* 구독 관리 안내 */}
      <GlassCard style={styles.manageCard}>
        <Text style={styles.manageTitle}>{t("subscription.manageTitle")}</Text>
        <Text style={styles.manageDesc}>
          {t("subscription.manageDesc")}
        </Text>
      </GlassCard>

      <Pressable onPress={onRestore} disabled={restoring} style={styles.restoreBtn}>
        {restoring ? (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
        ) : (
          <>
            <ArrowCounterClockwise size={13} color="rgba(255,255,255,0.4)" />
            <Text style={styles.restoreText}>{t("subscription.restorePurchase")}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function PaywallSection({
  onPurchase,
  onRestore,
  purchasing,
  restoring,
  hasPackage,
  priceLabel,
  hasFreeTrial,
  trialDays,
}: {
  onPurchase: () => void;
  onRestore: () => void;
  purchasing: boolean;
  restoring: boolean;
  hasPackage: boolean;
  priceLabel: string;
  hasFreeTrial: boolean;
  trialDays: number;
}) {
  return (
    <View style={styles.section}>
      {/* 헤더 */}
      <Text style={styles.paywallLabel}>{t("subscription.paywallLabel")}</Text>
      <Text style={styles.heroTitle}>{t("subscription.paywallTitle")}</Text>
      <Text style={styles.heroSubtitle}>{t("subscription.paywallSubtitle")}</Text>

      {/* 혜택 카드 */}
      <GlassCard style={styles.featureCard}>
        {FEATURE_KEYS.map((f, i) => (
          <View key={i} style={[styles.featureRow, i > 0 && styles.featureRowDivider]}>
            <View style={styles.featureIconWrap}>{f.icon}</View>
            <Text style={styles.featureText}>{t(f.key)}</Text>
          </View>
        ))}
      </GlassCard>

      {/* 가격 카드 */}
      <GlassCard style={styles.priceCard}>
        {hasFreeTrial && (
          <Text style={styles.priceTrial}>{t("subscription.freeTrialLabel", { days: trialDays })}</Text>
        )}
        <Text style={styles.priceMain}>
          {hasFreeTrial ? t("subscription.afterTrial") : ""}<Text style={styles.priceHighlight}>{t("subscription.monthlyPrice", { price: priceLabel })}</Text>
        </Text>
        <Text style={styles.priceSub}>{t("subscription.cancelAnytime")}</Text>
      </GlassCard>

      {/* 구매 버튼 */}
      <PrimaryButton
        label={purchasing ? t("themePreview.processing") : hasFreeTrial ? t("subscription.freeTrialBtn", { days: trialDays }) : t("subscription.monthlyBtn", { price: priceLabel })}
        onPress={onPurchase}
        disabled={purchasing || restoring || !hasPackage}
        style={styles.purchaseBtn}
      />

      {!hasPackage && (
        <Text style={styles.noPackageText}>{t("subscription.noPackage")}</Text>
      )}

      {/* 복원 */}
      <Pressable onPress={onRestore} disabled={restoring || purchasing} style={styles.restoreBtn}>
        {restoring ? (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
        ) : (
          <>
            <ArrowCounterClockwise size={13} color="rgba(255,255,255,0.4)" />
            <Text style={styles.restoreText}>{t("subscription.alreadySub")}</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.legalText}>
        {t("subscription.legalPrefix")}{"\n"}
        {hasFreeTrial
          ? t("subscription.legalTrial", { days: trialDays })
          : ""}{t("subscription.legalRenewal")}
      </Text>
      <View style={styles.legalLinks}>
        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={styles.legalLink}>{t("subscription.privacyPolicy")}</Text>
        </Pressable>
        <Text style={styles.legalLinkSep}> · </Text>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={styles.legalLink}>{t("subscription.termsOfService")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  section: {},
  // Active badge
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  activeBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
  },
  // Hero
  paywallLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryLight,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 20,
  },
  // Feature card (GlassCard content)
  featureCard: {
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
  },
  featureRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(74,144,217,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
  // Price card (GlassCard content)
  priceCard: {
    alignItems: "center",
    padding: 18,
    marginBottom: 20,
  },
  priceTrial: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  priceMain: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textLight,
    marginBottom: 4,
  },
  priceHighlight: {
    fontWeight: "800",
    color: COLORS.primaryLight,
  },
  priceSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  // CTA
  purchaseBtn: {
    marginBottom: 0,
  },
  noPackageText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginTop: 8,
  },
  // Manage card (GlassCard content, active state)
  manageCard: {
    padding: 16,
    marginBottom: 16,
  },
  manageTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  manageDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
  },
  // Restore
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  legalText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  legalLink: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textDecorationLine: "underline",
  },
  legalLinkSep: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
  },
});

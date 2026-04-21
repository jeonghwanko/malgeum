import React, { useRef, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, Alert, useWindowDimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { themeById } from "@/constants/themes";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { usePurchase } from "@/context/PurchaseContext";
import { t } from "@/i18n";

export default function ThemePreviewScreen() {
  const router = useRouter();
  const routerRef = React.useRef(router);
  const { themeId } = useLocalSearchParams<{ themeId: string }>();
  const theme = themeId ? themeById(themeId) : undefined;
  const { purchase, currentPackage } = usePurchase();
  const hasFreeTrial = !!currentPackage?.product?.introPrice;
  const trialDays = currentPackage?.product?.introPrice?.periodNumberOfUnits ?? 0;
  const priceLabel = currentPackage?.product?.priceString ?? "";
  const [purchasing, setPurchasing] = useState(false);
  const isActingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const handlePurchase = async () => {
    if (isActingRef.current) return;
    isActingRef.current = true;
    setPurchasing(true);
    try {
      const { success, userCancelled } = await purchase();
      if (success) {
        router.back();
      } else if (!userCancelled) {
        Alert.alert(t("themePreview.purchaseFail"), t("themePreview.purchaseFailDesc"));
      }
    } finally {
      setPurchasing(false);
      isActingRef.current = false;
    }
  };

  // 잘못된 themeId 또는 무료 테마로 접근 시 즉시 뒤로 이동
  React.useEffect(() => {
    if (!theme || theme.isFree) {
      routerRef.current.back();
    }
  }, [theme]);

  if (!theme || theme.isFree) return null;

  return (
    <View style={styles.container}>
      <Image
        source={theme.preview}
        style={{ position: "absolute", width, height }}
        resizeMode="cover"
      />

      {/* Top: 날씨 UI 미리보기 */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.05)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        {/* 닫기 버튼 */}
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={16}
        >
          <X size={20} color="rgba(255,255,255,0.85)" weight="bold" />
        </Pressable>
        <View style={styles.previewUI}>
          <Text style={styles.previewLogo}>맑음 <Text style={styles.previewSub}>Malgeum</Text></Text>
          <Text style={styles.previewLocation}>{t("themePreview.sampleLocation")}</Text>
          <Text style={styles.previewTemp}>24°</Text>
          <Text style={styles.previewDesc}>{t("themePreview.sampleDesc")}</Text>
        </View>
      </View>

      {/* Bottom: CTA */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={styles.bottomGradient}
      >
        <Text style={styles.themeName}>{theme.name} — {theme.artist}</Text>
        <Text style={styles.themeTitle}>{t("themePreview.changeTheme")}</Text>
        <PrimaryButton
          label={purchasing ? t("themePreview.processing") : hasFreeTrial ? t("themePreview.freeTrialStart", { days: trialDays }) : t("themePreview.monthlySubscribe", { price: priceLabel })}
          onPress={handlePurchase}
          disabled={purchasing}
          style={styles.btn}
        />
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.skip, { marginBottom: Math.max(insets.bottom, 16) }]}>{t("themePreview.browsOther")}</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  previewUI: {
    zIndex: 1,
  },
  previewLogo: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 8,
  },
  previewSub: {
    fontSize: 11,
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
  },
  previewLocation: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  previewTemp: {
    fontSize: 52,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -2,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  previewDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  bottomGradient: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 80,
  },
  themeName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginBottom: 4,
  },
  themeTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  btn: {
    marginBottom: 10,
  },
  skip: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});

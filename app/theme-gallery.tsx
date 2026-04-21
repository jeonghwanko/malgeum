import React from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, MagicWand, Lock, Crown } from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { ART_THEMES, type ArtTheme } from "@/constants/themes";
import { TOAST } from "@/constants/toastMessages";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";

const GAP = 12;
const PADDING_H = 20;

const FREE_THEMES = ART_THEMES.filter((t) => t.isFree);
const PREMIUM_THEMES = ART_THEMES.filter((t) => !t.isFree);

function ThemeCard({
  theme,
  isActive,
  isPremium,
  locked,
  cardW,
  cardH,
  onPress,
}: {
  theme: ArtTheme;
  isActive: boolean;
  isPremium: boolean;
  locked: boolean;
  cardW: number;
  cardH: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: cardW, height: cardH },
        pressed && styles.cardPressed,
        locked && styles.cardLocked,
      ]}
    >
      <Image
        source={theme.preview}
        style={[styles.cardImage, { width: cardW, height: cardH }, locked && styles.cardImageLocked]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        locations={[0.4, 1]}
        style={[styles.cardGradient, { height: cardH * 0.5 }]}
      >
        <Text style={styles.cardName} numberOfLines={1}>
          {theme.name}
        </Text>
        <Text style={styles.cardArtist} numberOfLines={1}>
          {theme.artist}
        </Text>
      </LinearGradient>

      {/* 사용 중 배지 */}
      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{t("theme.inUse")}</Text>
        </View>
      )}

      {/* 프리미엄 배지 (잠긴 프리미엄 카드에만 표시) */}
      {locked && (
        <View style={styles.premiumBadge}>
          <Crown size={9} color="#FFD700" weight="fill" />
          <Text style={styles.premiumBadgeText}>PRO</Text>
        </View>
      )}

      {/* 잠금 오버레이 */}
      {locked && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIcon}>
            <Lock size={20} color="rgba(255,255,255,0.9)" weight="bold" />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function ThemeGrid({
  themes,
  artStyle,
  isPremium,
  cardW,
  cardH,
  onPress,
}: {
  themes: ArtTheme[];
  artStyle: string;
  isPremium: boolean;
  cardW: number;
  cardH: number;
  onPress: (theme: ArtTheme) => void;
}) {
  const rows: ArtTheme[][] = [];
  for (let i = 0; i < themes.length; i += 2) {
    rows.push(themes.slice(i, i + 2));
  }
  return (
    <>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={artStyle === theme.id}
              isPremium={isPremium}
              locked={!theme.isFree && !isPremium}
              cardW={cardW}
              cardH={cardH}
              onPress={() => onPress(theme)}
            />
          ))}
          {row.length === 1 && <View style={[styles.cardSpacer, { width: cardW }]} />}
        </View>
      ))}
    </>
  );
}

export default function ThemeGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const cardW = Math.floor((screenW - PADDING_H * 2 - GAP) / 2);
  const cardH = Math.floor(cardW * (4 / 3));
  const { artStyle, setArtStyle, isPremium, isPinned, clearPin } = useTheme();
  const { showToast } = useToast();

  function handleThemePress(theme: ArtTheme) {
    if (!theme.isFree && !isPremium) {
      // 프리미엄 미구독 → 테마 프리뷰(페이월)로 이동
      router.push({ pathname: "/theme-preview", params: { themeId: theme.id } });
      return;
    }
    if (artStyle === theme.id) return; // 이미 선택된 테마 재클릭 무시
    setArtStyle(theme.id);
    showToast(TOAST.THEME_CHANGED(theme.name));
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 상단 고정 헤더 — 스크롤과 무관 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={COLORS.textLight} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("theme.title")}</Text>
          {isPinned ? (
            <Pressable
              onPress={() => { clearPin(); showToast(TOAST.THEME_AUTO_RESTORED); }}
              style={styles.autoRow}
            >
              <MagicWand size={12} color="rgba(255,255,255,0.35)" />
              <Text style={styles.subtitleAuto}>{t("theme.autoRestore")}</Text>
            </Pressable>
          ) : (
            <View style={styles.autoRow}>
              <MagicWand size={12} color="rgba(100,220,200,0.7)" />
              <Text style={styles.subtitleActive}>{t("theme.autoActive")}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 기본 테마 섹션 ── */}
        <Text style={styles.sectionTitle}>{t("theme.freeSection")}</Text>
        <ThemeGrid
          themes={FREE_THEMES}
          artStyle={artStyle}
          isPremium={isPremium}
          cardW={cardW}
          cardH={cardH}
          onPress={handleThemePress}
        />

        {/* ── 프리미엄 테마 섹션 ── */}
        <View style={styles.premiumHeader}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{t("theme.premiumSection")}</Text>
          {!isPremium && (
            <View style={styles.proChip}>
              <Crown size={10} color="#FFD700" weight="fill" />
              <Text style={styles.proChipText}>{t("theme.needSub")}</Text>
            </View>
          )}
        </View>
        <ThemeGrid
          themes={PREMIUM_THEMES}
          artStyle={artStyle}
          isPremium={isPremium}
          cardW={cardW}
          cardH={cardH}
          onPress={handleThemePress}
        />
      </ScrollView>

      {/* 테마 확인 버튼 — 항상 표시 */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={[styles.confirmBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.confirmBtn}>
          <Eye size={18} color={COLORS.white} weight="bold" />
          <Text style={styles.confirmText}>{t("theme.confirm")}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  content: {
    paddingHorizontal: PADDING_H,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: PADDING_H,
    paddingBottom: 8,
    backgroundColor: COLORS.bgDark,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textLight,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  subtitleAuto: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  subtitleActive: {
    fontSize: 12,
    color: "rgba(100,220,200,0.7)",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginTop: 20,
    marginBottom: -4,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    marginBottom: -4,
  },
  proChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  proChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFD700",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    marginTop: GAP,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardLocked: {
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  cardImage: {
    borderRadius: 20,
  },
  cardImageLocked: {
    opacity: 0.55,
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 1,
  },
  cardArtist: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  activeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(74,144,217,0.85)",
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  premiumBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFD700",
    letterSpacing: 0.5,
  },
  lockOverlay: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSpacer: {},
  confirmBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#38BDF8",
    paddingTop: 16,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.3,
  },
});

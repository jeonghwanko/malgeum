import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Keyboard } from "react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "phosphor-react-native";

interface ScreenSheetProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 기본 snap point (기본값 "75%") */
  defaultSnap?: string;
}

export function ScreenSheet({ title, subtitle, children, footer, defaultSnap = "75%" }: ScreenSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Android transparentModal에서 keyboardBehavior="extend"가 동작하지 않아
  // Keyboard API로 직접 snap point 확장
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", () => setKbOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const snapPoints = useMemo(
    () => [kbOpen ? "95%" : defaultSnap],
    [kbOpen, defaultSnap],
  );

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const bottomPad = Math.max(insets.bottom, 20);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      style={styles.sheet}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Pressable
          onPress={() => bottomSheetRef.current?.close()}
          style={styles.closeBtn}
          hitSlop={10}
          accessibilityLabel="닫기"
          accessibilityRole="button"
        >
          <X size={16} color="#64748B" />
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: footer ? 80 + bottomPad : 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>

      {footer && (
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          {footer}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  background: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(100,120,180,0.4)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(200,210,230,0.5)",
    borderWidth: 1,
    borderColor: "rgba(200,210,230,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollInner: {
    paddingBottom: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(255,255,255,0.97)",
  },
});

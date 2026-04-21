import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import type { ChatMessage, SuggestedQuestion, WeatherIntent, SettingsAction, OnboardingStep } from "@/types/chat";
import { COLORS } from "@/constants/colors";
import { RichCard } from "./RichCard";
import { t } from "@/i18n";

interface ChatBubbleProps {
  message: ChatMessage;
  /** 노트북 잉크 색상 (AI 버블 텍스트) */
  inkColor?: string;
  /** 노트북 종이 배경 (AI 버블 배경) */
  paperBg?: string;
  /** 후속 질문 칩 탭 핸들러 */
  onFollowUpPress?: (question: SuggestedQuestion) => void;
  /** 피드백 핸들러 */
  onRate?: (messageId: string, rating: "up" | "down", intent?: WeatherIntent) => void;
  /** 공유 핸들러 */
  onShare?: (text: string) => void;
  /** 설정/링크 카드 탭 → 화면 이동 */
  onNavigate?: (route: string) => void;
  /** 확인 카드의 [변경하기] */
  onConfirmSettings?: (messageId: string, action: SettingsAction, summary: string, route: string) => void;
  /** 확인 카드의 [취소] */
  onCancelSettings?: (messageId: string) => void;
  /** 온보딩 퀵탭 — 옵션 탭 (단일/선택 토글) */
  onOnboardingPick?: (messageId: string, step: OnboardingStep, optionId: string, isEscape: boolean) => void;
  /** 온보딩 멀티 — "다음 →" 탭 (선택된 ID들로 제출) */
  onOnboardingSubmit?: (messageId: string, step: OnboardingStep) => void;
  /** 온보딩 직접 입력 요청 — 입력창 포커스 */
  onOnboardingTextInput?: () => void;
}

export function ChatBubble({
  message,
  inkColor,
  paperBg,
  onFollowUpPress,
  onRate,
  onShare,
  onNavigate,
  onConfirmSettings,
  onCancelSettings,
  onOnboardingPick,
  onOnboardingSubmit,
  onOnboardingTextInput,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasFollowUps = !isUser && message.followUps && message.followUps.length > 0;
  const ratingOpacity = useSharedValue(0);

  useEffect(() => {
    if (isUser) return;
    // 3초 후 opacity 0→1. 공간은 처음부터 확보되어 layout shift 없음.
    const age = Date.now() - message.timestamp;
    const delay = Math.max(0, 3000 - age);
    const timer = setTimeout(() => {
      ratingOpacity.value = withTiming(1, { duration: 300 });
    }, delay);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ratingAnimStyle = useAnimatedStyle(() => ({ opacity: ratingOpacity.value }));

  return (
    <Animated.View
      entering={isUser ? FadeInRight.duration(200) : FadeInUp.duration(250)}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          !isUser && message.richContent ? styles.aiBubbleWide : undefined,
          !isUser && paperBg ? { backgroundColor: paperBg } : undefined,
        ]}
      >
        {/* AI 버블 헤더: 레이블 + 공유 아이콘 */}
        {!isUser && (
          <View style={styles.aiBubbleHeader}>
            <Text style={styles.aiLabel}>{t("chatUI.botName")}</Text>
            {onShare && (
              <Pressable
                onPress={() => onShare(message.text)}
                hitSlop={10}
                style={styles.shareBtn}
              >
                <Text style={styles.shareBtnText}>↗</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.aiText,
            !isUser && inkColor ? { color: inkColor } : undefined,
          ]}
        >
          {message.text}
        </Text>

        {/* 인라인 리치 카드 */}
        {!isUser && message.richContent && (
          <RichCard
            richContent={message.richContent}
            messageId={message.id}
            inkColor={inkColor}
            onNavigate={onNavigate}
            onConfirmSettings={onConfirmSettings}
            onCancelSettings={onCancelSettings}
            onOnboardingPick={onOnboardingPick}
            onOnboardingSubmit={onOnboardingSubmit}
            onOnboardingTextInput={onOnboardingTextInput}
          />
        )}
      </View>

      {/* 피드백 버튼 — 공간은 항상 확보, 3초 후 opacity로 페이드인 */}
      {!isUser && (
        <Animated.View style={[styles.ratingRow, ratingAnimStyle]} pointerEvents="box-none">
          <Pressable
            style={[styles.ratingBtn, message.rated === "up" && styles.ratingBtnSelected]}
            onPress={() => !message.rated && onRate?.(message.id, "up", message.intent)}
            disabled={!!message.rated}
          >
            <Text style={styles.ratingEmoji}>👍</Text>
          </Pressable>
          <Pressable
            style={[styles.ratingBtn, message.rated === "down" && styles.ratingBtnSelected]}
            onPress={() => !message.rated && onRate?.(message.id, "down", message.intent)}
            disabled={!!message.rated}
          >
            <Text style={styles.ratingEmoji}>👎</Text>
          </Pressable>
          {message.rated && (
            <Text style={styles.ratedLabel}>{t("chatUI.thanks")}</Text>
          )}
        </Animated.View>
      )}

      {/* 후속 질문 칩 */}
      {hasFollowUps && (
        <View style={styles.followUpRow}>
          {message.followUps!.map((q, i) => (
            <Pressable
              key={i}
              style={styles.followUpChip}
              onPress={() => onFollowUpPress?.(q)}
            >
              <Text style={styles.followUpEmoji}>{q.emoji}</Text>
              <Text style={styles.followUpText}>{q.text}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
}


const THINKING_PHRASES = [
  "하늘을 보고 있어요",
  "바람을 읽고 있어요",
  "구름을 세고 있어요",
  "햇살을 만지고 있어요",
  "공기를 느끼고 있어요",
];

/** 로딩 상태 버블 (3-dot 펄스 + 회전 문구) */
export function ChatBubbleLoading({ paperBg }: { paperBg?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * THINKING_PHRASES.length));
  useEffect(() => {
    const iv = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % THINKING_PHRASES.length);
    }, 1400);
    return () => clearInterval(iv);
  }, []);
  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      style={[styles.bubble, styles.aiBubble, paperBg ? { backgroundColor: paperBg } : undefined]}
    >
      <Text style={styles.aiLabel}>✨ 맑음이</Text>
      <View style={styles.thinkingRow}>
        <Text style={styles.thinkingText}>{THINKING_PHRASES[phraseIndex]}</Text>
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
      </View>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ scale: 0.7 + progress.value * 0.4 }],
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  bubble: {
    maxWidth: "82%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.glassWarm,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  // richContent 붙는 AI 버블은 카드 레이아웃이 숨 쉴 공간 필요 — 고정폭 확장
  aiBubbleWide: {
    width: "92%",
    maxWidth: "92%",
  },
  aiBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  aiText: {
    color: COLORS.textDark,
    fontSize: 15,
    lineHeight: 22,
  },
  aiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  shareBtn: {
    paddingHorizontal: 4,
  },
  shareBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },

  // 피드백 버튼
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingLeft: 4,
  },
  ratingBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ratingBtnSelected: {
    backgroundColor: "rgba(74,144,217,0.12)",
    borderColor: "rgba(74,144,217,0.3)",
  },
  ratingEmoji: {
    fontSize: 14,
  },
  ratedLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },

  // 후속 질문 칩
  followUpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  followUpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "rgba(74,144,217,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(74,144,217,0.15)",
  },
  followUpEmoji: {
    fontSize: 13,
  },
  followUpText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

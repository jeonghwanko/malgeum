/**
 * ChatSheet — AI 날씨 채팅
 *
 * BottomSheetModal 대신 일반 Modal + KeyboardAvoidingView 사용.
 * Android 키보드 처리를 확실하게 하기 위해 @gorhom/bottom-sheet 의존 제거.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Share,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";

import { router } from "expo-router";
import { setLocale } from "@/i18n";
import type { AIFeedbackEntry, ChatMessage, OnboardingStep, RichContent, SettingsAction } from "@/types/chat";
import type { WeatherBundle } from "@/types/weather";
import type { AppState, Action } from "@/context/WeatherContext";
import type { AllArtStyleKey } from "@/types/settings";
import {
  buildAIPrompt,
  classifyIntent,
  getFollowUpQuestions,
  recordEngagement,
} from "@/services/aiContext";
import { parseSettingsAction } from "@/services/settingsParser";
import { useNotify } from "@/context/NotifyContext";
import { askWeatherStream, type RevealHandle } from "@/services/aiService";
import { logAiChatMessage } from "@/services/analytics";
import { logError } from "@/utils/logger";
import {
  applyStepAnswer,
  buildBriefMessages,
  buildConfirmText,
  buildStepMessage,
  nextStep,
  BRIEF_ACTION,
} from "@/services/onboardingChat";
import { buildBriefLines, type WeatherContext as MicroWeatherContext } from "@/services/microcopy";
import { getHeroMessage, getCommuteComparison } from "@/utils/recommendations";
import { getClothingCopy } from "@/utils/weather";
import { loadJson, markOnboardingChatDone, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";

import { useChatSession } from "@/hooks/useChatSession";
import { useChatVoiceInput } from "@/hooks/useChatVoiceInput";
import { ChatSheetHeader } from "./chat/ChatSheetHeader";
import { ChatMessageList } from "./chat/ChatMessageList";
import { ChatSuggestedQuestions } from "./chat/ChatSuggestedQuestions";
import { ChatInputBar } from "./chat/ChatInputBar";
import { t } from "@/i18n";

// ── Props ──

interface ChatSheetProps {
  visible: boolean;
  onClose: () => void;
  state: AppState;
  bundle: WeatherBundle;
  artStyle: AllArtStyleKey;
  rcUserId: string;
  isPremium: boolean;
  dispatch: React.Dispatch<Action>;
  /** 음성 입력 에러 안내용 */
  onShowToast?: (message: string) => void;
  inkColor?: string;
  paperBg?: string;
  /** D1 온보딩 대화형 플로우 모드 */
  onboardingMode?: boolean;
}

const SHEET_TOP_MARGIN = 20; // safe area 아래 여백

export function ChatSheet({
  visible,
  onClose,
  state,
  bundle,
  artStyle,
  rcUserId,
  isPremium,
  dispatch,
  onShowToast,
  inkColor,
  paperBg,
  onboardingMode,
}: ChatSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const { state: notifyState } = useNotify();
  const revealRef = useRef<RevealHandle | null>(null);

  // 열기/닫기 애니메이션
  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible, translateY]);

  const animateClose = useCallback(() => {
    Keyboard.dismiss();
    revealRef.current?.cancel();
    revealRef.current = null;
    translateY.value = withTiming(500, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [translateY, onClose]);

  // handle 영역 드래그로 닫기
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY > 100 || e.velocityY > 500) {
          translateY.value = withTiming(500, { duration: 200 }, (finished) => {
            if (finished) runOnJS(onClose)();
          });
        } else {
          translateY.value = withTiming(0, { duration: 200 });
        }
      }),
  [translateY, onClose]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 300], [1, 0], "clamp"),
  }));

  const {
    inputRef, flatListRef, messagesRef, cancelVoiceRef,
    messages, setMessages,
    input, setInput,
    loading, setLoading,
    suggestions, showSuggestions,
  } = useChatSession({ visible, bundle, healthProfile: state.healthProfile, onboardingMode });

  const { voice, micPulseStyle, cancelVoice } =
    useChatVoiceInput({ setInput, inputRef, onShowToast });

  cancelVoiceRef.current = cancelVoice;

  // ── 설정 변경 확정/취소/이동 ──
  const handleConfirmSettings = useCallback((messageId: string, action: SettingsAction, summary: string, route: string) => {
    switch (action.type) {
      case "SET_TEMP_UNIT":
        dispatch({ type: "SET_TEMP_UNIT", payload: { unit: action.unit } });
        break;
      case "SET_ALERT":
        dispatch({ type: "SET_ALERT", payload: { key: action.key, enabled: action.enabled } });
        break;
      case "SET_COMMUTE_TIME": {
        const current = state.commuteTime;
        dispatch({
          type: "SET_COMMUTE_TIME",
          payload: {
            departure: action.departure ?? current.departure,
            return: action.return ?? current.return,
          },
        });
        break;
      }
      case "SET_PROFILE":
        dispatch({ type: "SET_PROFILE", payload: { [action.field]: action.value } });
        break;
      case "SET_LOCALE":
        setLocale(action.locale);
        break;
    }
    const appliedMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: t("chatUI.settingsApplied"),
      timestamp: Date.now(),
      richContent: { type: "settings-applied", action, route, summary },
    };
    setMessages((prev) => [
      ...prev.map((m) =>
        m.id === messageId && m.richContent?.type === "settings-pending"
          ? { ...m, richContent: { ...m.richContent, resolved: "applied" as const } }
          : m,
      ),
      appliedMsg,
    ]);
  }, [dispatch, state.commuteTime, setMessages]);

  const handleCancelSettings = useCallback((messageId: string) => {
    const cancelMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: "assistant",
      text: t("chatUI.cancelled"),
      timestamp: Date.now(),
    };
    setMessages((prev) => [
      ...prev.map((m) =>
        m.id === messageId && m.richContent?.type === "settings-pending"
          ? { ...m, richContent: { ...m.richContent, resolved: "cancelled" as const } }
          : m,
      ),
      cancelMsg,
    ]);
  }, [setMessages]);

  const handleNavigate = useCallback((route: string) => {
    Keyboard.dismiss();
    // 시트 닫힘 애니메이션(250ms) 완료 후 이동 — 중첩 네비 프레임 회피
    animateClose();
    setTimeout(() => {
      router.push(route as never);
    }, 260);
  }, [animateClose]);

  // ── D1 온보딩 ──
  /**
   * 현재 step 카드를 resolved 처리 + (옵션) 확인 멘트 삽입 + 다음 step 메시지 추가
   * @param appliedAnswer 확인 멘트 생성용 — string(단일) / string[](멀티) / null(skip)
   */
  const advanceOnboarding = useCallback((
    fromStep: OnboardingStep,
    resolvedMessageId: string,
    appliedAnswer?: string | string[] | null,
  ) => {
    const next = nextStep(fromStep);
    const confirmText = buildConfirmText(fromStep, appliedAnswer ?? null, state);
    const selection = Array.isArray(appliedAnswer)
      ? appliedAnswer
      : typeof appliedAnswer === "string" ? [appliedAnswer] : undefined;

    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === resolvedMessageId && m.richContent?.type === "onboarding-quick"
          ? {
              ...m,
              richContent: {
                ...m.richContent,
                resolved: true,
                selectedIds: selection ?? m.richContent.selectedIds,
              },
            }
          : m,
      );
      const confirmMsg: ChatMessage[] = confirmText
        ? [{ id: Crypto.randomUUID(), role: "assistant", text: confirmText, timestamp: Date.now() }]
        : [];
      if (next === "brief") {
        const ctx: MicroWeatherContext = {
          current: bundle.current,
          hourly: bundle.hourly,
          airQuality: bundle.airQuality,
          yesterdayDiff: null,
          locationName: state.locations.find((l) => l.id === state.currentLocationId)?.name ?? "",
          nickname: state.nickname,
        };
        const tempHigh = bundle.daily[0]?.tempMax ?? bundle.current.temp;
        const lines = buildBriefLines(ctx, tempHigh);
        const briefMsgs = buildBriefMessages(lines, state);
        markOnboardingChatDone().catch((e) => logError("storage", e));
        return [...updated, ...confirmMsg, ...briefMsgs];
      }
      if (next === "done") {
        return [...updated, ...confirmMsg];
      }
      const stepMsg = buildStepMessage(next, state);
      return stepMsg ? [...updated, ...confirmMsg, stepMsg] : [...updated, ...confirmMsg];
    });
  }, [bundle, state, setMessages]);

  const handleOnboardingPick = useCallback((messageId: string, step: OnboardingStep, optionId: string, isEscape: boolean) => {
    // Greeting의 "다음에" → 온보딩 종료 + 시트 닫기
    if (step === "greeting" && isEscape) {
      markOnboardingChatDone().catch((e) => logError("storage", e));
      animateClose();
      return;
    }
    // try-typing의 "건너뛰기" → 브리핑으로 바로 진행 (dispatch 없음)
    if (step === "try-typing" && isEscape) {
      advanceOnboarding(step, messageId, null);
      return;
    }
    // brief 카드 액션 처리
    if (step === "brief" && isEscape) {
      if (optionId === BRIEF_ACTION.PERSONALITY) {
        handleNavigate("/personality");
      } else {
        animateClose();
      }
      return;
    }
    // 기타 — 즉시 적용 + 다음 step
    applyStepAnswer(step, optionId, dispatch, state);
    advanceOnboarding(step, messageId, optionId);
  }, [dispatch, state, animateClose, advanceOnboarding, handleNavigate]);

  const handleOnboardingSubmit = useCallback((messageId: string, step: OnboardingStep) => {
    const target = messagesRef.current.find((m) => m.id === messageId);
    if (!target || target.richContent?.type !== "onboarding-quick") return;
    const selected = target.richContent.selectedIds ?? [];
    applyStepAnswer(step, selected, dispatch, state);
    advanceOnboarding(step, messageId, selected);
  }, [dispatch, state, messagesRef, advanceOnboarding]);

  const handleOnboardingTextInput = useCallback(() => {
    // 입력창 포커스 — 유저가 자유 입력 → sendMessage에서 온보딩 모드 감지해 subway step 해석
    inputRef.current?.focus();
  }, [inputRef]);

  // ── 피드백 저장 ──
  const handleRate = useCallback(async (messageId: string, rating: "up" | "down") => {
    // UI는 즉시 갱신 (rating + 👎일 때 link 카드 함께)
    setMessages((prev) => {
      const rated = prev.map((m) => (m.id === messageId ? { ...m, rated: rating } : m));
      if (rating !== "down") return rated;
      const helpMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: "assistant",
        text: t("chatUI.sorryManualHelp"),
        timestamp: Date.now(),
        richContent: {
          type: "settings-link",
          route: "/(tabs)/settings",
          label: t("chatUI.manualSetting"),
          reason: "",
        },
      };
      return [...rated, helpMsg];
    });

    // 저장은 백그라운드 — UI 블록 없음
    const entry: AIFeedbackEntry = {
      date: todayKey(),
      messageId,
      intent: messagesRef.current.find((m) => m.id === messageId)?.intent ?? "general",
      rating,
    };
    const existing = await loadJson<AIFeedbackEntry[]>(STORAGE_KEYS.AI_FEEDBACK, []);
    await saveJson(STORAGE_KEYS.AI_FEEDBACK, [...existing, entry]);
  }, [setMessages, messagesRef]);

  // ── 공유 ──
  const handleShare = useCallback(async (text: string) => {
    await Share.share({
      message: t("chatUI.shareMessage", { text }),
    });
  }, []);

  // ── Send ──
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    cancelVoice();

    const userMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    inputRef.current?.focus();

    // 온보딩 모드: 지하철 step 직접 입력 처리
    let pendingTryTypingId: string | null = null;
    if (onboardingMode) {
      const pendingSubway = messagesRef.current.find(
        (m) => m.richContent?.type === "onboarding-quick" && m.richContent.step === "subway" && !m.richContent.resolved,
      );
      if (pendingSubway) {
        applyStepAnswer("subway", trimmed, dispatch, state);
        advanceOnboarding("subway", pendingSubway.id, trimmed);
        return;
      }
      // try-typing step에서 유저 입력 → 카드 resolved 처리 후 AI 응답으로 진행, 응답 후 brief로 advance
      const pendingTry = messagesRef.current.find(
        (m) => m.richContent?.type === "onboarding-quick" && m.richContent.step === "try-typing" && !m.richContent.resolved,
      );
      if (pendingTry) {
        pendingTryTypingId = pendingTry.id;
        setMessages((prev) => prev.map((m) =>
          m.id === pendingTry.id && m.richContent?.type === "onboarding-quick"
            ? { ...m, richContent: { ...m.richContent, resolved: true } }
            : m,
        ));
      }
    }

    if (/고정환/.test(trimmed)) {
      const eggMsg: ChatMessage = { id: Crypto.randomUUID(), role: "assistant", text: "Love Forever! \u{1F495}", timestamp: Date.now() };
      setMessages((prev) => [...prev, eggMsg]);
      return;
    }

    // 명시적 설정 변경 명령만 클라이언트에서 가로채 확인 카드 표시
    // ("비 알림 켜줘" / "화씨로 바꿔줘" 등 deterministic 패턴).
    // 그 외 질문/조회/추천은 모두 AI가 tools로 처리 — 맥락 있는 답변 보장.
    const settingsResult = parseSettingsAction(trimmed);
    if (settingsResult) {
      const pendingMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: "assistant",
        text: settingsResult.confirmText,
        timestamp: Date.now(),
        richContent: {
          type: "settings-pending",
          action: settingsResult.action,
          summary: settingsResult.summary,
          route: settingsResult.route,
        },
      };
      setMessages((prev) => [...prev, pendingMsg]);
      return;
    }

    setLoading(true);
    const prompt = buildAIPrompt(state, bundle, artStyle, trimmed, messagesRef.current);
    const toolCtx = {
      state,
      bundle,
      recipients: notifyState.recipients,
      artStyle,
      proposedActions: [],
    };
    const hero = getHeroMessage(bundle);
    const fallback = `${hero.message}\n${getClothingCopy(bundle.current.feelsLike)}`;

    const followUps = getFollowUpQuestions(prompt.intent, bundle);
    const msgId = Crypto.randomUUID();
    const updateText = (partial: string) => {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, text: partial } : m)));
    };

    const { revealHandle, ...result } = await askWeatherStream(
      prompt,
      rcUserId,
      isPremium,
      fallback,
      toolCtx,
      {
        onStart: () => {
          const placeholder: ChatMessage = {
            id: msgId,
            role: "assistant",
            text: "",
            timestamp: Date.now(),
            intent: prompt.intent,
          };
          setMessages((prev) => [...prev, placeholder]);
          setLoading(false);
        },
        onChunk: updateText,
      },
    );
    revealRef.current = revealHandle;
    await revealHandle.done;
    revealRef.current = null;

    const isFallback = result.fromFallback;
    // AI가 실제 호출한 tool 기반으로 richContent 결정 (classifyIntent 예측과 불일치 해결)
    let richContent: RichContent | undefined;
    const calledTools = new Set(result.toolCalls.map((tc) => tc.name));
    if (calledTools.has("get_daily_forecast") && bundle.daily.length > 0) {
      richContent = { type: "forecast", days: bundle.daily.slice(0, 5) };
    } else if (calledTools.has("get_commute_comparison")) {
      const comp = getCommuteComparison(bundle.hourly, state.commuteTime.departure, state.commuteTime.return);
      if (comp) {
        richContent = { type: "commute", departure: comp.departure, returnTrip: comp.returnTrip, tempDiff: comp.tempDiff, needUmbrella: comp.needUmbrella };
      }
    }

    setMessages((prev) => prev.map((m) => (
      m.id === msgId
        ? {
            ...m,
            text: result.text,
            followUps: isFallback ? undefined : followUps,
            richContent: isFallback ? undefined : richContent,
          }
        : m
    )));

    if (!result.fromFallback) {
      recordEngagement("question");
      logAiChatMessage(prompt.intent, false);
    }

    // AI가 propose_settings_change로 제안한 설정 변경 → settings-pending 카드로 렌더
    if (result.proposedActions.length > 0) {
      const pendingMsgs: ChatMessage[] = result.proposedActions.map((p) => ({
        id: Crypto.randomUUID(),
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        richContent: {
          type: "settings-pending",
          action: p.action,
          summary: p.summary,
          route: p.route,
        },
      }));
      setMessages((prev) => [...prev, ...pendingMsgs]);
    }

    if (pendingTryTypingId) {
      advanceOnboarding("try-typing", pendingTryTypingId, null);
    }
  }, [loading, state, notifyState.recipients, bundle, artStyle, rcUserId, isPremium, onboardingMode, dispatch, advanceOnboarding, cancelVoice, setMessages, setInput, setLoading, inputRef, messagesRef]);

  // ── 후속 질문 탭 ──
  const handleFollowUpPress = useCallback((question: { emoji: string; text: string }) => {
    inputRef.current?.focus();
    setMessages((prev) => prev.map((m) => m.followUps ? { ...m, followUps: undefined } : m));
    const intent = classifyIntent(question.text);
    recordEngagement("tap", intent);
    logAiChatMessage(intent, true);
    sendMessage(question.text);
  }, [sendMessage, setMessages, inputRef]);

  if (!visible) return null;

  // ── Render ──
  return (
    <Modal transparent statusBarTranslucent animationType="none" visible>
      <GestureHandlerRootView style={styles.overlay}>
        {/* 배경 탭 닫기 */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />
        </Animated.View>

        {/* 시트 본체 */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { top: insets.top + SHEET_TOP_MARGIN },
              sheetAnimStyle,
            ]}
          >
            <View style={styles.handleZone}>
              <View style={styles.handle} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.flex}
              keyboardVerticalOffset={insets.top + SHEET_TOP_MARGIN}
            >
              <ChatSheetHeader onClose={animateClose} />

              <ChatMessageList
                messages={messages}
                loading={loading}
                flatListRef={flatListRef}
                inkColor={inkColor}
                paperBg={paperBg}
                onFollowUpPress={handleFollowUpPress}
                onRate={handleRate}
                onShare={handleShare}
                onNavigate={handleNavigate}
                onConfirmSettings={handleConfirmSettings}
                onCancelSettings={handleCancelSettings}
                onOnboardingPick={handleOnboardingPick}
                onOnboardingSubmit={handleOnboardingSubmit}
                onOnboardingTextInput={handleOnboardingTextInput}
                onScrollEndDrag={(e: any) => {
                  if (e.nativeEvent.contentOffset.y < -60) animateClose();
                }}
              />

              <ChatSuggestedQuestions
                suggestions={suggestions}
                show={showSuggestions}
                onSend={(text) => {
                  inputRef.current?.focus();
                  sendMessage(text);
                }}
              />

              <ChatInputBar
                input={input}
                setInput={setInput}
                loading={loading}
                voice={voice}
                micPulseStyle={micPulseStyle}
                inputRef={inputRef}
                onSend={sendMessage}
                cancelVoice={cancelVoice}
              />
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  handleZone: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(100,120,180,0.3)",
  },
});

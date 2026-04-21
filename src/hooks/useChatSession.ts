/**
 * ChatSheet 세션 상태 관리 — 메시지, 입력, 로딩, suggestions
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { FlatList, type TextInput as TextInputType } from "react-native";
import type { ChatMessage, WeatherIntent } from "@/types/chat";
import type { WeatherBundle } from "@/types/weather";
import type { HealthProfile } from "@/types/settings";
import { getSuggestedQuestions } from "@/services/aiContext";
import { buildGreetingMessages } from "@/services/onboardingChat";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";

interface UseChatSessionOptions {
  visible: boolean;
  bundle: WeatherBundle;
  healthProfile: HealthProfile;
  /** true면 채팅 히스토리 복원 안 하고 온보딩 greeting 메시지 주입 */
  onboardingMode?: boolean;
}

export function useChatSession({
  visible,
  bundle,
  healthProfile,
  onboardingMode,
}: UseChatSessionOptions) {
  const inputRef = useRef<TextInputType>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const cancelVoiceRef = useRef<() => void>(() => {});

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // messagesRef 동기화
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 시트 열릴 때 오늘 세션 복원
  useEffect(() => {
    if (!visible) {
      cancelVoiceRef.current();
      setSessionLoaded(false);
      return;
    }
    setInput("");
    setLoading(false);
    if (onboardingMode) {
      setMessages(buildGreetingMessages());
      setSessionLoaded(true);
      return;
    }
    loadJson<{ date: string; messages: ChatMessage[] }>(
      STORAGE_KEYS.CHAT_HISTORY,
      { date: "", messages: [] },
    ).then((saved) => {
      setMessages(saved.date === todayKey() ? saved.messages : []);
      setSessionLoaded(true);
    });
  }, [visible, onboardingMode]);

  // messages 변경 시 오늘 세션 저장 (온보딩 모드는 저장 안 함)
  useEffect(() => {
    if (onboardingMode) return;
    if (messages.length > 0) {
      saveJson(STORAGE_KEYS.CHAT_HISTORY, { date: todayKey(), messages });
    }
  }, [messages, onboardingMode]);

  // 이미 사용한 의도 목록 (추천 질문 개인화)
  const usedIntents = useMemo(
    () =>
      messages
        .filter((m) => m.role === "assistant" && m.intent)
        .map((m) => m.intent as WeatherIntent),
    [messages],
  );

  const suggestions = useMemo(
    () => getSuggestedQuestions(bundle, healthProfile, usedIntents),
    [bundle, healthProfile, usedIntents],
  );

  // 새 메시지가 추가될 때만 스크롤
  const messageCount = messages.length;
  useEffect(() => {
    if (messageCount > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messageCount]);

  const showSuggestions = sessionLoaded && messages.length === 0 && !loading;

  return {
    inputRef,
    flatListRef,
    messagesRef,
    cancelVoiceRef,
    messages,
    setMessages,
    sessionLoaded,
    input,
    setInput,
    loading,
    setLoading,
    suggestions,
    showSuggestions,
  };
}

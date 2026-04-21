/**
 * ChatSheet 음성 입력 — useVoiceInput 래핑 + 마이크 펄스 애니메이션
 */
import { useEffect, type RefObject } from "react";
import { type TextInput as TextInputType } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface UseChatVoiceInputOptions {
  setInput: (text: string) => void;
  inputRef: RefObject<TextInputType | null>;
  onShowToast?: (message: string) => void;
}

export function useChatVoiceInput({
  setInput,
  inputRef,
  onShowToast,
}: UseChatVoiceInputOptions) {
  const voice = useVoiceInput();
  const cancelVoice = voice.cancelListening;

  // 마이크 펄스 애니메이션
  const micPulse = useSharedValue(1);
  useEffect(() => {
    if (voice.isListening) {
      micPulse.value = withRepeat(
        withTiming(0.4, { duration: 600 }),
        -1,
        true,
      );
    } else {
      micPulse.value = withTiming(1, { duration: 200 });
    }
  }, [voice.isListening]);

  const micPulseStyle = useAnimatedStyle(() => ({
    opacity: micPulse.value,
  }));

  // 최종 결과 → 입력창에 반영
  useEffect(() => {
    if (voice.finalResult) {
      setInput(voice.finalResult);
      voice.reset();
      inputRef.current?.focus();
    }
  }, [voice.finalResult, setInput, inputRef]);

  // 실시간 중간 결과 미리보기
  useEffect(() => {
    if (voice.isListening && voice.partialResult) {
      setInput(voice.partialResult);
    }
  }, [voice.partialResult, voice.isListening, setInput]);

  // 에러 → 토스트
  useEffect(() => {
    if (voice.error) {
      onShowToast?.(voice.error);
      voice.reset();
    }
  }, [voice.error, onShowToast]);

  return { voice, micPulseStyle, cancelVoice };
}

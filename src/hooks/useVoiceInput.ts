/**
 * useVoiceInput — 온디바이스 음성→텍스트 변환 훅
 *
 * expo-speech-recognition 래퍼.
 * 한국어(ko-KR) 실시간 인식, 중간/최종 결과 분리.
 */

import { useState, useCallback, useRef } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

interface UseVoiceInputReturn {
  /** 디바이스 음성인식 지원 여부 (첫 start 시 확인) */
  isAvailable: boolean;
  /** 현재 듣는 중 */
  isListening: boolean;
  /** 실시간 중간 인식 결과 */
  partialResult: string;
  /** 최종 인식 텍스트 */
  finalResult: string;
  /** 에러 메시지 (한국어) */
  error: string | null;
  /** 한국어 음성 인식 시작 */
  startListening: () => Promise<void>;
  /** 인식 중지 (최종 결과 반환) */
  stopListening: () => Promise<void>;
  /** 인식 취소 (결과 없이 중단) */
  cancelListening: () => Promise<void>;
  /** 상태 초기화 */
  reset: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "마이크 권한이 필요합니다",
  "service-not-allowed": "음성 인식을 사용할 수 없어요",
  "language-not-supported": "한국어 인식을 지원하지 않는 기기예요",
  "no-speech": "음성을 인식하지 못했어요",
  "speech-timeout": "음성을 인식하지 못했어요",
  network: "네트워크 오류. 다시 시도해주세요",
  "audio-capture": "오디오 녹음 오류가 발생했어요",
  aborted: "",
  busy: "음성 인식이 이미 진행 중이에요",
};

export function useVoiceInput(): UseVoiceInputReturn {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [partialResult, setPartialResult] = useState("");
  const [finalResult, setFinalResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listeningRef = useRef(false);

  // ── 이벤트 리스너 ──

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    listeningRef.current = true;
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    listeningRef.current = false;
  });

  useSpeechRecognitionEvent("result", (ev) => {
    const transcript = ev.results[0]?.transcript ?? "";
    if (ev.isFinal) {
      setFinalResult(transcript);
      setPartialResult("");
    } else {
      setPartialResult(transcript);
    }
  });

  useSpeechRecognitionEvent("error", (ev) => {
    setIsListening(false);
    listeningRef.current = false;

    if (ev.error === "aborted") return;

    const msg =
      ERROR_MESSAGES[ev.error] ?? "음성 인식 오류가 발생했어요";
    if (msg) setError(msg);

    if (ev.error === "service-not-allowed") {
      setIsAvailable(false);
    }
  });

  // ── 제어 함수 ──

  const startListening = useCallback(async () => {
    setError(null);
    setPartialResult("");
    setFinalResult("");

    const { granted } =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setError("마이크 권한이 필요합니다");
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: "ko-KR",
      interimResults: true,
      maxAlternatives: 1,
      contextualStrings: ["날씨", "기온", "우산", "미세먼지", "옷"],
    });
  }, []);

  const stopListening = useCallback(async () => {
    if (listeningRef.current) {
      ExpoSpeechRecognitionModule.stop();
    }
  }, []);

  const cancelListening = useCallback(async () => {
    if (listeningRef.current) {
      ExpoSpeechRecognitionModule.abort();
    }
  }, []);

  const reset = useCallback(() => {
    setPartialResult("");
    setFinalResult("");
    setError(null);
  }, []);

  return {
    isAvailable,
    isListening,
    partialResult,
    finalResult,
    error,
    startListening,
    stopListening,
    cancelListening,
    reset,
  };
}

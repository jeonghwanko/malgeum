import { useEffect, useRef, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import { useWeatherContext } from "@/context/WeatherContext";
import { parseInviteCode, sanitizeInviteCode } from "@/types/notify";
import { saveJson, STORAGE_KEYS } from "@/utils/storage";

const CLIPBOARD_TOKEN = "malgeum-invite:";

/** 설치 후 첫 실행에서만 사용. 웹 랜딩이 "앱 설치" 탭 시 복사한 코드를 폴백으로 복원 */
async function readClipboardInviteCode(): Promise<string | null> {
  try {
    const hasText = await Clipboard.hasStringAsync();
    if (!hasText) return null;
    const text = await Clipboard.getStringAsync();
    if (!text.startsWith(CLIPBOARD_TOKEN)) return null;
    const code = sanitizeInviteCode(text.slice(CLIPBOARD_TOKEN.length));
    if (code.length !== 6) return null;
    // 코드 사용 후 클립보드 토큰 정리 (재진입 시 중복 처리 방지)
    await Clipboard.setStringAsync("").catch(() => {});
    return code;
  } catch {
    return null;
  }
}

export default function Index() {
  const { state, loaded } = useWeatherContext();
  const router = useRouter();
  const [deepLinkChecked, setDeepLinkChecked] = useState(false);
  const checkedRef = useRef(false);

  // 딥링크로 앱이 열렸을 때 초대 코드 자동 처리 (cold start, 1회만)
  useEffect(() => {
    if (!loaded || checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      try {
        const url = await Linking.getInitialURL();
        // 1순위: Universal Link / custom scheme, 2순위: 클립보드 폴백 (설치 후 cold-start)
        const code =
          (url ? parseInviteCode(url) : null) ??
          (state.onboardingDone ? null : await readClipboardInviteCode());

        if (code) {
          // 온보딩 완료 → pending 저장 + tabs로 이동
          // (탭 레이아웃이 마운트된 뒤 pending을 감지해 modal push — stack 안정성 확보)
          if (state.onboardingDone) {
            await saveJson(STORAGE_KEYS.PENDING_INVITE, code);
            setDeepLinkChecked(true);
            return; // Redirect → /(tabs)
          }
          // 온보딩 전 → pending 저장 + 초대 온보딩 화면
          await saveJson(STORAGE_KEYS.PENDING_INVITE, code);
          setDeepLinkChecked(true);
          router.replace(`/onboarding/invited?code=${code}` as never);
          return;
        }
      } catch { /* 딥링크 파싱 실패 무시 */ }
      setDeepLinkChecked(true);
    })();
  }, [loaded, state.onboardingDone, router]);

  if (!loaded) return null;
  if (!deepLinkChecked) return null;
  if (!state.onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

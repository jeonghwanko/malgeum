import { useCallback, useEffect, useState } from "react";
import { getLocale, setLocale, addLocaleListener, type Locale } from "./index";

/**
 * 현재 locale을 반환하고, 변경 시 리렌더 트리거.
 * 서비스 레이어는 t() 직접 호출, React 컴포넌트는 이 훅 사용.
 */
export function useLocale() {
  const [locale, _setLocale] = useState<Locale>(getLocale);

  useEffect(() => {
    return addLocaleListener(_setLocale);
  }, []);

  const changeLocale = useCallback(async (newLocale: Locale) => {
    await setLocale(newLocale);
  }, []);

  return { locale, setLocale: changeLocale } as const;
}

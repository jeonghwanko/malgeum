import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { logError } from "@/utils/logger";

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS ?? "";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID ?? "";
const PREMIUM_ENTITLEMENT = "premium";

export interface PurchaseResult {
  success: boolean;
  userCancelled: boolean;
}

interface PurchaseContextValue {
  isPremium: boolean;
  loading: boolean;
  customerId: string;
  currentPackage: PurchasesPackage | null;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextValue>({
  isPremium: false,
  loading: true,
  customerId: "",
  currentPackage: null,
  purchase: async () => ({ success: false, userCancelled: false }),
  restore: async () => false,
});

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [currentPackage, setCurrentPackage] = useState<PurchasesPackage | null>(null);

  // 초기화
  useEffect(() => {
    const init = async () => {
      const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        // API 키 없으면 (개발 중) 무료 모드
        if (__DEV__) console.log("[RevenueCat] API 키 미설정 — 무료 모드로 동작");
        setLoading(false);
        return;
      }

      try {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
        await Purchases.configure({ apiKey });

        // 구독 상태 확인
        const info = await Purchases.getCustomerInfo();
        checkPremium(info);
        setCustomerId(info.originalAppUserId ?? "");

        // 패키지 (가격 정보) 가져오기
        const offerings = await Purchases.getOfferings();
        const monthly = offerings.current?.availablePackages?.[0] ?? null;
        setCurrentPackage(monthly);
      } catch (e: unknown) {
        logError("purchase", e);
        // RevenueCat 장애 시 로딩만 해제하고 무료 모드로 패스
      } finally {
        setLoading(false);
      }
    };

    init();

    // 구독 상태 변경 리스너
    const listener = (info: CustomerInfo) => {
      try { checkPremium(info); } catch (e: unknown) { logError("purchase", e); }
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  function checkPremium(info: CustomerInfo) {
    setIsPremium(info?.entitlements?.active?.[PREMIUM_ENTITLEMENT] !== undefined);
  }

  // 구매 — useCallback으로 안정화하여 불필요한 소비자 리렌더 방지
  const purchase = useCallback(async (): Promise<PurchaseResult> => {
    if (!currentPackage) return { success: false, userCancelled: false };
    try {
      const { customerInfo } = await Purchases.purchasePackage(currentPackage);
      const active = customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT] !== undefined;
      setIsPremium(active);
      return { success: active, userCancelled: false };
    } catch (e: unknown) {
      const err = e as Record<string, unknown>;
      const msg = e instanceof Error ? e.message : String(e);
      const isUserIssue =
        err?.userCancelled === true ||
        err?.code === "PURCHASE_NOT_ALLOWED_ERROR" ||
        /not allowed/i.test(msg);
      if (!isUserIssue) logError("purchase", e);
      return { success: false, userCancelled: (err?.userCancelled ?? false) as boolean };
    }
  }, [currentPackage]);

  // 복원 — 의존성 없으므로 한 번만 생성
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      const active = info?.entitlements?.active?.[PREMIUM_ENTITLEMENT] !== undefined;
      setIsPremium(active);
      return active;
    } catch (e: unknown) {
      logError("purchase", e);
      return false;
    }
  }, []);

  // value 객체를 메모이제이션하여 상태 변경 시만 소비자 리렌더
  const value = useMemo(
    () => ({ isPremium, loading, customerId, currentPackage, purchase, restore }),
    [isPremium, loading, customerId, currentPackage, purchase, restore],
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase(): PurchaseContextValue {
  return useContext(PurchaseContext);
}

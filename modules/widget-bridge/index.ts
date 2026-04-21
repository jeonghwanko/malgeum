import { requireNativeModule } from "expo-modules-core";

interface WidgetBridgeNative {
  setWidgetData(json: string): Promise<void>;
  getWidgetData(): Promise<string | null>;
}

const nativeModule: WidgetBridgeNative | null = (() => {
  try {
    return requireNativeModule("WidgetBridge");
  } catch {
    return null;
  }
})();

export async function setWidgetData(json: string): Promise<void> {
  if (!nativeModule) {
    if (__DEV__) console.log("[WidgetBridge] native module not available");
    return;
  }
  return nativeModule.setWidgetData(json);
}

export async function getWidgetData(): Promise<string | null> {
  if (!nativeModule) return null;
  return nativeModule.getWidgetData();
}

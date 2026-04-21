import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { logError, extractErrorMessage } from "@/utils/logger";

const TTL_MS = 60 * 60 * 1000; // 1시간

interface CachedConfig {
  data: Record<string, any>;
  fetchedAt: number;
}

export async function fetchRemoteConfig<T extends Record<string, any>>(
  defaultConfig: T
): Promise<T> {
  // 1. 유효한 캐시 확인
  const cached = await loadJson<CachedConfig | null>(STORAGE_KEYS.REMOTE_CONFIG, null);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return mergeConfig(defaultConfig, cached.data);
  }

  // 2. Firestore fetch
  try {
    const docRef = doc(db, "config", "app_config");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      await saveJson(STORAGE_KEYS.REMOTE_CONFIG, {
        data,
        fetchedAt: Date.now(),
      });
      return mergeConfig(defaultConfig, data);
    }
  } catch (e: unknown) {
    const isOffline = /offline|Failed to get document/i.test(extractErrorMessage(e));
    if (!isOffline) logError("remote-config", e);
    if (cached) {
      return mergeConfig(defaultConfig, cached.data);
    }
  }

  // 3. 기본값 fallback
  return defaultConfig;
}

function mergeConfig<T extends Record<string, any>>(
  defaults: T,
  remote: Record<string, any>
): T {
  const result = { ...defaults };
  for (const key of Object.keys(remote)) {
    if (key in result) {
      (result as any)[key] = remote[key];
    }
  }
  return result;
}

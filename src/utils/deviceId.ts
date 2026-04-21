import * as Crypto from "expo-crypto";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";

/** 디바이스 UUID — AsyncStorage에 영구 저장, 없으면 생성 */
export async function getOrCreateDeviceId(): Promise<string> {
  const saved = await loadJson<string>(STORAGE_KEYS.DEVICE_ID, "");
  if (saved) return saved;
  const id = Crypto.randomUUID();
  await saveJson(STORAGE_KEYS.DEVICE_ID, id);
  return id;
}

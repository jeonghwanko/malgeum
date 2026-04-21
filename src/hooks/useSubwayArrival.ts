/**
 * 지하철 실시간 도착정보 훅
 * 출퇴근 카드에서 사용 — 설정된 역이 있을 때만 조회
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState as RNAppState } from "react-native";
import { fetchSubwayArrival, type SubwayArrival } from "@/services/kskillProxy";

const REFRESH_INTERVAL_MS = 30_000; // 30초
const MIN_FOREGROUND_GAP_MS = 15_000; // 포그라운드 복귀 시 최소 간격

export function useSubwayArrival(stationName: string | undefined) {
  const [arrivals, setArrivals] = useState<SubwayArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!stationName) return;
    setLoading(true);
    try {
      const data = await fetchSubwayArrival(stationName);
      lastFetchRef.current = Date.now();
      setArrivals(data);
    } finally {
      setLoading(false);
    }
  }, [stationName]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL_MS);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!stationName) {
      setArrivals([]);
      return;
    }

    void refresh();
    startPolling();

    const sub = RNAppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (Date.now() - lastFetchRef.current >= MIN_FOREGROUND_GAP_MS) {
          void refresh();
        }
        startPolling();
      } else if (state === "background") {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [stationName, refresh, startPolling, stopPolling]);

  return { arrivals, loading, refresh };
}

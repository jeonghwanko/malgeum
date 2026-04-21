import { useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";

export type CommuteMode = "morning" | "evening";

function calcMode(departure: string, returnTime: string): CommuteMode {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [depH, depM] = departure.split(":").map(Number);
  const [retH, retM] = returnTime.split(":").map(Number);
  const depMinutes = depH * 60 + depM;
  const retMinutes = retH * 60 + retM;
  const midpoint = (depMinutes + retMinutes) / 2;

  return currentMinutes < midpoint ? "morning" : "evening";
}

export function useCommuteMode(
  departure: string,
  returnTime: string
): CommuteMode {
  const [mode, setMode] = useState<CommuteMode>(() => calcMode(departure, returnTime));

  const refresh = useCallback(() => {
    setMode(calcMode(departure, returnTime));
  }, [departure, returnTime]);

  useEffect(() => {
    refresh();

    // 1분 간격 재계산 — 백그라운드에서는 정지
    let interval: ReturnType<typeof setInterval> | null = setInterval(refresh, 60_000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
        if (interval) clearInterval(interval);
        interval = setInterval(refresh, 60_000);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });

    return () => {
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [refresh]);

  return mode;
}

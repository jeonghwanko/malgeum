import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchRemoteConfig } from "@/services/remoteConfig";
import { logError } from "@/utils/logger";

export interface RemoteConfig {
  adLimits: {
    homeAd: number;
  };
  weatherApiProvider: "openweathermap" | "kma";
}

const DEFAULT_CONFIG: RemoteConfig = {
  adLimits: { homeAd: 3 },
  weatherApiProvider: "openweathermap",
};

const RemoteConfigContext = createContext<RemoteConfig>(DEFAULT_CONFIG);

export function RemoteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<RemoteConfig>(DEFAULT_CONFIG);

  const mountedRef = useRef(true);
  useEffect(() => {
    fetchRemoteConfig(DEFAULT_CONFIG)
      .then((c) => { if (mountedRef.current) setConfig(c); })
      .catch((e: unknown) => { logError("remote-config", e); });
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <RemoteConfigContext.Provider value={config}>
      {children}
    </RemoteConfigContext.Provider>
  );
}

export function useRemoteConfig(): RemoteConfig {
  return useContext(RemoteConfigContext);
}

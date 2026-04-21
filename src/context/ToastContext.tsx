import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Toast, type ToastTone } from "@/components/ui/Toast";

export interface ShowToastOptions {
  tone?: ToastTone;
  icon?: string;
}

interface ToastState {
  message: string;
  seq: number;
  tone?: ToastTone;
  icon?: string;
}

interface ToastContextValue {
  showToast: (message: string, opts?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, opts?: ShowToastOptions) => {
    setToast((prev) => ({
      message,
      seq: (prev?.seq ?? 0) + 1,
      tone: opts?.tone,
      icon: opts?.icon,
    }));
  }, []);

  const handleDismiss = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Toast
            message={toast.message}
            seq={toast.seq}
            tone={toast.tone}
            icon={toast.icon}
            onDismiss={handleDismiss}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

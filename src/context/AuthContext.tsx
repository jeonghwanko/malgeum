/**
 * Firebase Anonymous Auth — 소셜 알림 기능의 사용자 식별
 * 앱 시작 시 자동 로그인 (UI 없음). uid가 Firestore + 푸시 토큰의 식별자.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { logError } from "@/utils/logger";

interface AuthContextValue {
  uid: string | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  uid: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const signingInRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
        signingInRef.current = false;
      } else if (!signingInRef.current) {
        signingInRef.current = true;
        signInAnonymously(auth)
          .then((cred) => setUser(cred.user))
          .catch((e) => {
            logError("general", e);
            signingInRef.current = false;
          })
          .finally(() => setLoading(false));
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ uid: user?.uid ?? null, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, isPending } = authClient.useSession();

  const value = {
    session: session?.session ?? null,
    user: session?.user ?? null,
    isPending,
    signIn: (email, password) => authClient.signIn.email({ email, password }),
    signOut: () => authClient.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import api from "@/lib/api";

export interface User {
  id: string;
  account_id: string;
  email: string;
  name: string;
  role: number; // 0=admin, 1=owner, 2=member
  /** Authoritative: true when a Client doc links to this user (they are someone's client, not an agency owner) */
  is_client_user: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True when this account is someone else's client — hide agency-only UI */
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
      // Always re-fetch /auth/me on mount so is_client_user is fresh even
      // for users who logged in before this signal existed.
      api
        .get("/auth/me")
        .then((res) => {
          const { user_id, account_id, first_name, last_name, email, role, is_client_user } = res.data;
          const refreshed: User = {
            id: user_id,
            account_id,
            email,
            name: [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0],
            role: role ?? 1,
            is_client_user: !!is_client_user,
          };
          localStorage.setItem("user", JSON.stringify(refreshed));
          setUser(refreshed);
        })
        .catch(() => {
          /* 401 handler in api interceptor will redirect */
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, account_id, user_id, first_name, last_name, role, is_client_user, email: userEmail } = res.data;

    localStorage.setItem("token", token);
    if (account_id) localStorage.setItem("account_id", account_id);

    const userData: User = {
      id: user_id,
      account_id,
      email: userEmail || email,
      name: [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0],
      role: role ?? 2,
      is_client_user: !!is_client_user,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("account_id");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const isClient = !!user?.is_client_user || user?.role === 2;

  return (
    <AuthContext.Provider value={{ user, loading, isClient, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

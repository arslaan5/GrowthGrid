"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Non-null when the initial auth check failed due to a network / server error. */
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:25',message:'refresh() called',data:{loading,user:user?.id||null,error},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      setError(null);
      const { data } = await api.get<User>("/auth/me");
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:29',message:'/auth/me success',data:{userId:data?.id||null,email:data?.email||null,hasData:!!data},timestamp:Date.now(),runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      setUser(data);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:30',message:'setUser() called with data',data:{userId:data?.id||null,email:data?.email||null},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (err: unknown) {
      setUser(null);
      // #region agent log
      const status = err && typeof err === "object" && "response" in err ? (err as { response?: { status?: number } }).response?.status : null;
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:31',message:'/auth/me error',data:{status,errorType:err?.constructor?.name||'unknown'},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Distinguish network / server errors from a normal 401
      if (err && typeof err === "object" && "response" in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status && status >= 500) {
          setError("The server is currently unavailable. Please try again later.");
        }
        // 401/403 → not logged in, not an error
      } else {
        // No response at all → network error
        setError("Unable to connect to the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:57',message:'refresh() completed',data:{loading:false},timestamp:Date.now(),runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:52',message:'login() called',data:{email},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const loginResponse = await api.post("/auth/login", { email, password });
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:54',message:'/auth/login success',data:{status:loginResponse?.status,hasCookies:!!loginResponse?.headers?.['set-cookie']},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      await refresh();
      // #region agent log
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:77',message:'login() completed, refresh() finished',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      const status = err && typeof err === "object" && "response" in err ? (err as { response?: { status?: number } }).response?.status : null;
      fetch('http://127.0.0.1:7250/ingest/31bbd6ce-720a-4f7a-952f-43db051584c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:56',message:'/auth/login error',data:{status},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    await api.post("/auth/register", { email, password });
    await login(email, password);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginInput, RegisterInput } from "@skillbarter/shared";
import { api } from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  requestPhoneOtp: (phone: string) => Promise<{ challengeId: string; phone: string }>;
  verifyPhoneOtp: (phone: string, otp: string, challengeId: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
    } catch {
      setUser(null);
      if (typeof window !== "undefined") localStorage.removeItem("skillbarter_token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshUser(); }, []);

  const login = async (input: LoginInput) => {
    setError(null);
    try {
      const res = await api.auth.login(input);
      if (typeof window !== "undefined") localStorage.setItem("skillbarter_token", res.accessToken);
      setUser(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in";
      setError(msg);
      throw err;
    }
  };

  const establishOtpSession = (result: { user: AuthUser; accessToken: string }) => {
    if (typeof window !== "undefined") localStorage.setItem("skillbarter_token", result.accessToken);
    setUser(result.user);
  };

  const requestPhoneOtp = async (phone: string) => api.auth.requestPhoneOtp(phone);
  const verifyPhoneOtp = async (phone: string, otp: string, challengeId: string) => {
    setError(null);
    const result = await api.auth.verifyPhoneOtp(phone, otp, challengeId);
    establishOtpSession(result);
  };
  const requestEmailOtp = async (email: string) => { setError(null); await api.auth.requestEmailOtp(email); };
  const verifyEmailOtp = async (email: string, otp: string) => {
    setError(null);
    const result = await api.auth.verifyEmailOtp(email, otp);
    establishOtpSession(result);
  };

  const register = async (input: RegisterInput): Promise<void> => {
    setError(null);
    try {
      const res = await api.auth.register(input);
      if (typeof window !== "undefined") localStorage.setItem("skillbarter_token", res.accessToken);
      setUser(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore network errors */ }
    finally {
      if (typeof window !== "undefined") localStorage.removeItem("skillbarter_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, requestPhoneOtp, verifyPhoneOtp, requestEmailOtp, verifyEmailOtp, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { endpoints } from "@/constants/endpoints";

type AuthContextType = {
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  loginWithOAuthCode: (code: string, state: string) => Promise<void>;  
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );

  const isLoggedIn = !!accessToken;

  // 기본 로그인/로그아웃
  const login = (token: string) => {
    localStorage.setItem("accessToken", token);
    setAccessToken(token);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
  };

  
  const loginWithOAuthCode = async (code: string, state: string) => {
  try {
    const response = await axios.get(
      `${endpoints.CALLBACK_FROM_GOOGLE}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
    );

    const token = response.data.token;
    if (!token) throw new Error("No token returned");

    login(token);
  } catch (error) {
    console.error("OAuth login failed:", error);
    throw error;
  }
};


  // 더미 로그인
  useEffect(() => {
    if (import.meta.env.DEV && !accessToken) {
      const dummyToken = "MOCK_DEV_JWT_TOKEN"; // 더미 토큰
      console.log("[Dev Mode] 더미 로그인 활성화됨");
      login(dummyToken);
    }
  }, [accessToken]);


  return (
    <AuthContext.Provider value={{ accessToken, isLoggedIn, login, logout, loginWithOAuthCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

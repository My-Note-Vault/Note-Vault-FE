// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

type AuthContextType = {
  accessToken: string | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  loginWithOAuthCode: (code: string) => Promise<void>; 
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

  
  const loginWithOAuthCode = async (code: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      // 백엔드가 code를 받아 accessToken을 발급해주는 엔드포인트로 교환 요청
      const response = await axios.post(`${API_BASE}/api/auth/oauth2/callback`, {
        code,
      });

      const token = response.data.accessToken;
      if (!token) throw new Error("No access token returned");

      login(token); // 내부 login() 호출 → localStorage 저장
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

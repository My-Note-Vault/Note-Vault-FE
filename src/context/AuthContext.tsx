import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import apiClient, { ensureFreshAccessToken } from "@/api/client";
import { endpoints } from "@/constants/endpoints";
import { authStorage } from "@/lib/authStorage";

type AuthContextType = {
  accessToken: string | null;
  isLoggedIn: boolean;
  isOAuthLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  redirectToGoogle: () => Promise<void>;
  redirectToKakao: () => Promise<void>;
  loginWithOAuthCode: (provider: OAuthProvider, code: string, state: string) => Promise<void>;
  devLogin: (userId?: number) => Promise<void>;
};

export type OAuthProvider = "google" | "kakao";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    authStorage.getAccessToken()
  );
  const [isOAuthLoading, setIsOAuthLoading] = useState(!authStorage.getAccessToken());

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    const unsubscribe = authStorage.subscribe(() => {
      setAccessToken(authStorage.getAccessToken());
    });
    if (!authStorage.getAccessToken()) {
      ensureFreshAccessToken(true)
        .then(setAccessToken)
        .catch(() => setAccessToken(null))
        .finally(() => setIsOAuthLoading(false));
    }
    return unsubscribe;
  }, []);

  const login = (token: string) => {
    authStorage.setAccessToken(token);
  };

  const logout = () => {
    void axios.post(endpoints.LOGOUT, undefined, { withCredentials: true });
    authStorage.clearTokens();
  };

  const redirectToGoogle = async () => {
    const response = await apiClient.get(endpoints.LOGIN_GOOGLE);
    const url = response.data.url;
    if (!url) throw new Error("No redirect URL returned");
    window.location.href = url;
  };

  const redirectToKakao = async () => {
    const response = await apiClient.get(endpoints.LOGIN_KAKAO);
    const url = response.data.url;
    if (!url) throw new Error("No redirect URL returned");
    window.location.href = url;
  };

  const loginWithOAuthCode = async (provider: OAuthProvider, code: string, state: string) => {
    setIsOAuthLoading(true);
    try {
      const callbackEndpoint = provider === "kakao"
        ? endpoints.CALLBACK_FROM_KAKAO
        : endpoints.CALLBACK_FROM_GOOGLE;
      const response = await apiClient.get(callbackEndpoint, {
        params: { code, state },
      });

      const { token } = response.data;
      if (!token?.accessToken) throw new Error("No access token returned");

      const { accessToken } = token;
      authStorage.clearAppState();
      authStorage.setAccessToken(accessToken);
    } catch (error) {
      console.error("OAuth login failed:", error);
      throw error;
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const devLogin = async (userId?: number) => {
    const response = await axios.get(endpoints.DEV_LOGIN, {
      params: userId != null ? { userId } : undefined,
    });
    const { token } = response.data;
    if (!token?.accessToken) throw new Error("No access token returned");
    authStorage.clearAppState();
    authStorage.setAccessToken(token.accessToken);
  };

  return (
    <AuthContext.Provider value={{ accessToken, isLoggedIn, isOAuthLoading, login, logout, redirectToGoogle, redirectToKakao, loginWithOAuthCode, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

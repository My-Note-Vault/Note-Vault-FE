import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import apiClient from "@/api/client";
import { endpoints } from "@/constants/endpoints";
import { authStorage } from "@/lib/authStorage";

type AuthContextType = {
  accessToken: string | null;
  isLoggedIn: boolean;
  isOAuthLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  redirectToGoogle: () => Promise<void>;
  loginWithOAuthCode: (code: string, state: string) => Promise<void>;
  devLogin: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    authStorage.getAccessToken()
  );
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const isLoggedIn = !!accessToken;

  useEffect(() => {
    return authStorage.subscribe(() => {
      setAccessToken(authStorage.getAccessToken());
    });
  }, []);

  const login = (token: string) => {
    authStorage.setTokens(token, authStorage.getRefreshToken());
  };

  const logout = () => {
    authStorage.clearTokens();
  };

  const redirectToGoogle = async () => {
    const response = await apiClient.get(endpoints.LOGIN_GOOGLE);
    const url = response.data.url;
    if (!url) throw new Error("No redirect URL returned");
    window.location.href = url;
  };

  const loginWithOAuthCode = async (code: string, state: string) => {
    setIsOAuthLoading(true);
    try {
      const response = await apiClient.get(endpoints.CALLBACK_FROM_GOOGLE, {
        params: { code, state },
      });

      const { token } = response.data;
      if (!token?.accessToken) throw new Error("No access token returned");

      const { accessToken, refreshToken } = token;
      authStorage.clearAppState();
      authStorage.setTokens(accessToken, refreshToken);
    } catch (error) {
      console.error("OAuth login failed:", error);
      throw error;
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const devLogin = async () => {
    const response = await axios.get(endpoints.DEV_LOGIN);
    const { token } = response.data;
    if (!token?.accessToken) throw new Error("No access token returned");
    authStorage.clearAppState();
    authStorage.setTokens(token.accessToken, token.refreshToken);
  };

  return (
    <AuthContext.Provider value={{ accessToken, isLoggedIn, isOAuthLoading, login, logout, redirectToGoogle, loginWithOAuthCode, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

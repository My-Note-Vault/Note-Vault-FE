import { createContext, useContext, useState, type ReactNode } from "react";
import apiClient from "@/api/client";
import { endpoints } from "@/constants/endpoints";

type AuthContextType = {
  accessToken: string | null;
  isLoggedIn: boolean;
  isOAuthLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  redirectToGoogle: () => Promise<void>;
  loginWithOAuthCode: (code: string, state: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const isLoggedIn = !!accessToken;

  const login = (token: string) => {
    localStorage.setItem("accessToken", token);
    setAccessToken(token);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
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
      const response = await apiClient.get(
        `${endpoints.CALLBACK_FROM_GOOGLE}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
      );

      const token = response.data.token;
      if (!token) throw new Error("No token returned");

      login(token);
    } catch (error) {
      console.error("OAuth login failed:", error);
      throw error;
    } finally {
      setIsOAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, isLoggedIn, isOAuthLoading, login, logout, redirectToGoogle, loginWithOAuthCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

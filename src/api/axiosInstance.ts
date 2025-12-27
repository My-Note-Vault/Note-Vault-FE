// src/api/axiosInstance.ts
import axios from "axios";
import { API_BASE } from "@/constants/endpoints";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url ?? "";

    
    const isOAuthRequest =
      requestUrl.includes("/oauth") ||
      requestUrl.includes("/auth") ||
      requestUrl.includes("/callback");

    if (status === 401 && !isOAuthRequest) {
      console.warn("401 Unauthorized → redirect to /401");

      // 토큰 정리
      localStorage.removeItem("accessToken");

      // 401 페이지로 이동
      window.location.href = "/401";
    }

    return Promise.reject(error);
  }
);

export default api;

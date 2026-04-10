import axios from "axios";
import { endpoints } from "@/constants/endpoints";
import { authStorage } from "@/lib/authStorage";

// 인증 토큰이 자동으로 포함되는 axios 인스턴스
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰 갱신 중복 방지를 위한 변수
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// 요청 인터셉터: localStorage에서 토큰을 읽어 Authorization 헤더에 추가
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 refreshToken으로 토큰 갱신 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("API Error:", {
      status: error.response?.status,
      code: error.response?.data?.code,
      data: error.response?.data,
      url: error.config?.url,
    });

    // refresh 엔드포인트 자체의 에러는 재시도하지 않음
    const isRefreshEndpoint = error.config?.url?.includes("/oauth/refresh");

    // HTTP 401 상태 코드 또는 응답 body의 code가 UNAUTHORIZED_ERROR인 경우
    if (
      !isRefreshEndpoint &&
      (error.response?.status === 401 ||
        error.response?.data?.code === "UNAUTHORIZED_ERROR") &&
      !originalRequest._retry
    ) {
      const refreshToken = authStorage.getRefreshToken();

      // refreshToken이 없으면 바로 로그아웃
      if (!refreshToken) {
        console.log("No refresh token, redirecting to login page...");
        authStorage.clearTokens();
        window.location.href = "/";
        return Promise.reject(error);
      }

      // 이미 토큰 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Attempting to refresh token...");
        const response = await axios.post(endpoints.REFRESH_TOKEN, {
          refreshToken,
        });

        const tokenPayload = response.data?.token ?? response.data;
        const accessToken = tokenPayload?.accessToken;
        const newRefreshToken = tokenPayload?.refreshToken ?? refreshToken;

        if (!accessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        // 새 토큰 저장
        authStorage.setTokens(accessToken, newRefreshToken);

        console.log("Token refreshed successfully");

        // 대기 중인 요청들 처리
        processQueue();

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed, redirecting to login page...");
        processQueue(refreshError);
        authStorage.clearTokens();
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // refresh 엔드포인트 자체의 에러는 로그아웃 처리
    if (isRefreshEndpoint && error.response?.status === 401) {
      console.log("Refresh token expired, redirecting to login page...");
      authStorage.clearTokens();
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default apiClient;

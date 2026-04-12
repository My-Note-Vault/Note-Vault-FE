import axios from "axios";
import { endpoints } from "@/constants/endpoints";
import { authStorage } from "@/lib/authStorage";

// 인증 토큰이 자동으로 포함되는 axios 인스턴스
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// 진행 중인 refresh Promise. 동시 요청 중복 refresh 방지용.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  console.log("[auth] Attempting to refresh access token...");

  const currentAccessToken = authStorage.getAccessToken();

  const response = await axios.post(
    endpoints.REFRESH_TOKEN,
    { refreshToken },
    {
      headers: {
        ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
      },
    },
  );

  const tokenPayload = response.data?.token ?? response.data;
  const accessToken = tokenPayload?.accessToken;
  const newRefreshToken = tokenPayload?.refreshToken ?? refreshToken;

  if (!accessToken) {
    throw new Error("No access token returned from refresh endpoint");
  }

  authStorage.setTokens(accessToken, newRefreshToken);
  console.log("[auth] Access token refreshed successfully");

  return accessToken;
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
    const url: string = originalRequest?.url ?? "";

    console.log("[auth] API Error:", {
      status: error.response?.status,
      code: error.response?.data?.code,
      url,
      _retry: originalRequest?._retry,
    });

    const is401 = error.response?.status === 401;

    // 401이 아니거나, config가 없거나, 이미 한번 재시도한 요청은 그대로 reject
    // (refresh 엔드포인트 자체는 raw axios로 호출되므로 이 인터셉터를 타지 않고,
    //  실패 시 아래 catch 블록의 refreshStatus === 401 분기에서 처리된다.)
    if (!is401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      console.log("[auth] Already retried once, giving up:", url);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // 진행중인 refresh가 있으면 재사용, 없으면 새로 시작
      if (!refreshPromise) {
        console.log("[auth] Starting new refresh flow for:", url);
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      } else {
        console.log("[auth] Awaiting in-flight refresh for:", url);
      }

      const newAccessToken = await refreshPromise;

      // 새 토큰으로 원래 요청 재시도
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      console.log("[auth] Retrying original request:", url);
      return apiClient(originalRequest);
    } catch (refreshError) {
      // refresh 엔드포인트가 401이거나 refresh token이 아예 없는 경우에만 로그아웃.
      // 네트워크/서버 일시 장애에서는 토큰을 유지해 다음 요청에서 재시도할 수 있게 한다.
      const refreshStatus = (refreshError as { response?: { status?: number } })
        ?.response?.status;
      const hasRefreshToken = !!authStorage.getRefreshToken();

      if (refreshStatus === 401 || !hasRefreshToken) {
        console.log("[auth] Refresh unrecoverable, logging out:", refreshError);
        authStorage.clearTokens();
        window.location.href = "/";
      } else {
        console.log(
          "[auth] Refresh failed (transient), keeping tokens:",
          refreshError,
        );
      }
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;

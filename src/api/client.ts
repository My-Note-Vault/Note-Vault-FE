import axios from "axios";

// 인증 토큰이 자동으로 포함되는 axios 인스턴스
const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: localStorage에서 토큰을 읽어 Authorization 헤더에 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 토큰 제거
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default apiClient;

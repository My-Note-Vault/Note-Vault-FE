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

// 응답 인터셉터: UNAUTHORIZED_ERROR 시 로그인 페이지로 이동
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API Error:", {
      status: error.response?.status,
      code: error.response?.data?.code,
      data: error.response?.data,
      url: error.config?.url,
    });

    // profile 엔드포인트는 회원가입 직후 401이 정상일 수 있으므로 리디렉션 제외
    const isProfileEndpoint = error.config?.url?.includes("/members/profile");

    // HTTP 401 상태 코드 또는 응답 body의 code가 UNAUTHORIZED_ERROR인 경우
    if (
      !isProfileEndpoint &&
      (error.response?.status === 401 ||
        error.response?.data?.code === "UNAUTHORIZED_ERROR")
    ) {
      console.log("Redirecting to login page...");
      localStorage.removeItem("accessToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default apiClient;

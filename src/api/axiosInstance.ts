import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",  // ⭐ 백엔드 주소
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

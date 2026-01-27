// src/api/auth.ts
import api from "@/api/axiosInstance";
import { endpoints } from "@/constants/endpoints";


export const redirectToGoogleOAuth = async () => {
  const res = await api.get(endpoints.LOGIN_GOOGLE);
  window.location.href = res.data.url;
};


export const getAccessToken = async (code: string, state: string) => {
  const res = await api.get(
    `${endpoints.CALLBACK_FROM_GOOGLE}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  );

  return res.data; // { accessToken: "..." }
};

// src/api/auth.ts
import api from "@/api/axiosInstance";
import { endpoints } from "@/constants/endpoints";


export const redirectToGoogleOAuth = () => {
  window.location.href = endpoints.REDIRECT_TO_GOOGLE;
};


export const getAccessToken = async (code: string) => {
  const res = await api.get(
    `${endpoints.CALLBACK_FROM_GOOGLE}?code=${encodeURIComponent(code)}`
  );

  return res.data; // { accessToken: "..." }
};

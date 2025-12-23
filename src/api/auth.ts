// src/api/auth.ts
import axios from "axios";
import { endpoints } from "@/constants/endpoints";

export const redirectToGoogleOAuth = () => {
  window.location.href = endpoints.REDIRECT_TO_GOOGLE;
};

export const getAccessToken = async (code: string) => {
  const res = await axios.get(`${endpoints.CALLBACK_FROM_GOOGLE}?code=${code}`);
  return res.data; // { accessToken: "..." }
};

// src/api/auth.ts
import axios from "axios";

const API_BASE = "/api/v1";

export const redirectToGoogleOAuth = () => {
  window.location.href = `${API_BASE}/oauth/google`;
};

export const getAccessToken = async (code: string) => {
  const res = await axios.get(`${API_BASE}/oauth/callback/google?code=${code}`);
  return res.data; // { accessToken: "..." }
};

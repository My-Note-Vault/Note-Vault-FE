// src/api/auth.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const redirectToGoogleOAuth = () => {
  window.location.href = `${API_BASE}/api/v1/oauth/google`;
};

export const getAccessToken = async (code: string) => {
  const res = await axios.get(`${API_BASE}/api/v1/oauth/callback/google?code=${code}`);
  return res.data; // { accessToken: "..." }
};

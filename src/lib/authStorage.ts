const AUTH_TOKEN_EVENT = "auth-token-changed";

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },

  setTokens(accessToken: string, refreshToken?: string | null) {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
  },

  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
  },

  subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(AUTH_TOKEN_EVENT, onChange);

    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(AUTH_TOKEN_EVENT, onChange);
    };
  },
};


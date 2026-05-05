const AUTH_TOKEN_EVENT = "auth-token-changed";

const APP_STATE_KEYS = [
  "last_visited",
  "selected_workspace",
  "splitState",
  "sidebar_notes",
  "sidebar_notes_ts",
  "sidebar_unfolded",
  "sidebar_unfolded_ts",
  "sidebar_daily",
  "sidebar_daily_ts",
];

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

  clearAppState() {
    APP_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
  },

  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    APP_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
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


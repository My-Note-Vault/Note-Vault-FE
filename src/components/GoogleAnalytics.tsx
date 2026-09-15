import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const MEASUREMENT_ID = "G-5BX6BHFSDE";
const SCRIPT_ID = "google-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

export default function GoogleAnalytics() {
  const { isLoggedIn, isOAuthLoading } = useAuth();

  useEffect(() => {
    if (isOAuthLoading || !isLoggedIn || document.getElementById(SCRIPT_ID)) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.gtag = (...args: unknown[]) => {
      analyticsWindow.dataLayer?.push(args);
    };
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", MEASUREMENT_ID);

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }, [isLoggedIn, isOAuthLoading]);

  return null;
}

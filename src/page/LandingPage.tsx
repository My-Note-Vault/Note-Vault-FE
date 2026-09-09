import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, Columns3, CalendarDays, Search, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const FEATURES = [
  {
    icon: FileText,
    key: "documents",
  },
  {
    icon: Columns3,
    key: "kanban",
  },
  {
    icon: CalendarDays,
    key: "calendar",
  },
  {
    icon: Search,
    key: "search",
  },
];

const DEV_USERS = [1, 2, 3] as const;

export default function LandingPage() {
  const { devLogin, redirectToGoogle, redirectToKakao } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoogleLogin = () => {
    redirectToGoogle();
  };

  const handleKakaoLogin = () => {
    redirectToKakao();
  };

  const handleDevLogin = async (userId: number) => {
    try {
      await devLogin(userId);
      navigate("/profile-setup", { replace: true });
    } catch {
      toast.error(t("landing.devLoginFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-24">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center leading-tight">
          {t("landing.headline")}
          <br />
          <span className="text-primary">{t("landing.headlineAccent")}</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-center max-w-md">
          {t("landing.description1")}
          <br />
          {t("landing.description2")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-base shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t("landing.google")}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[#FEE500] text-[#191919] font-medium text-base shadow-sm hover:brightness-95 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 3C6.48 3 2 6.49 2 10.8c0 2.78 1.87 5.22 4.68 6.6l-.95 3.49a.4.4 0 0 0 .61.44l4.16-2.75c.49.05.99.08 1.5.08 5.52 0 10-3.49 10-7.86S17.52 3 12 3Z" />
            </svg>
            {t("landing.kakao")}
            <ArrowRight className="h-4 w-4" />
          </button>

          {import.meta.env.DEV && (
            <div className="flex gap-2">
              {DEV_USERS.map((id) => (
                <button
                  key={id}
                  onClick={() => handleDevLogin(id)}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  {t("landing.devUser", { id })}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1.5">{t(`landing.features.${feature.key}.title`)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`landing.features.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border py-16 text-center">
        <p className="text-muted-foreground text-sm">
          {t("landing.footer")}
        </p>
      </section>
    </div>
  );
}

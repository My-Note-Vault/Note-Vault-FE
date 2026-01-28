// src/pages/Callback.tsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Callback = () => {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const state = searchParams.get("state");   // 🔐 반드시 필요

  const { loginWithOAuthCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code || !state) {
      console.error("Missing OAuth parameters", { code, state });
      navigate("/login-failed");
      return;
    }

    loginWithOAuthCode(code, state)
      .then(() => {
        // URL에서 code, state 제거 (보안)
        window.history.replaceState({}, document.title, "/");
        navigate("/");
      })
      .catch((err) => {
        console.error("OAuth login failed:", err);
        navigate("/login-failed");
      });
  }, [code, state]);

  return <p className="text-center mt-10">로그인 중입니다...</p>;
};

export default Callback;

// src/pages/Callback.tsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const { loginWithOAuthCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      loginWithOAuthCode(code)
        .then(() => navigate("/"))
        .catch((err) => {
          console.error("OAuth login failed:", err);
          navigate("/login-failed");
        });
    }
  }, [code]);

  return <p className="text-center mt-10">로그인 중입니다...</p>;
};

export default Callback;

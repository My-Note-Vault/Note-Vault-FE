import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const UnAuthorized = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "401 Unauthorized access:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-10 rounded-lg shadow-md w-[380px]">
        <h1 className="text-4xl font-bold mb-2">401</h1>
        <p className="text-lg text-gray-600 mb-6">
          로그인이 필요합니다
        </p>

        <p className="text-sm text-gray-500 mb-8">
          세션이 만료되었거나 인증되지 않은 사용자입니다.
        </p>

        {/* 👉 기존 SignUp 페이지로 이동 */}
        <Button
          onClick={() => navigate("/signup")}
          className="w-full bg-white text-gray-800 hover:bg-gray-200 flex items-center justify-center gap-3 border"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="google"
            className="w-5 h-5"
          />
          Google 계정으로 로그인 / 회원가입
        </Button>

        <div className="mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-blue-500 hover:text-blue-700 underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnAuthorized;

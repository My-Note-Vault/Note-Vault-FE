// src/pages/SignUp.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { redirectToGoogleOAuth } from "@/api/auth";


export default function SignUp() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-primary to-primary-hover text-white">
      <h1 className="text-4xl font-bold mb-6">Note Vault 회원가입</h1>
      <p className="text-lg opacity-90 mb-10 text-center">
        아래 방법 중 하나로 회원가입하거나 로그인하세요.
      </p>

      <div className="flex flex-col gap-4 w-72">
        {/* Google OAuth 버튼 */}
        <Button
          onClick={redirectToGoogleOAuth}
          className="bg-white text-gray-800 hover:bg-gray-200"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="google"
            className="w-5 h-5 mr-3"
          />
          Google 계정으로 시작하기
        </Button>

        {/* Kakao OAuth 버튼 (아직 미구현) */}
        <Button
          disabled
          className="bg-[#FEE500] text-black opacity-70 cursor-not-allowed"
        >
          <img
            src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png"
            alt="kakao"
            className="w-5 h-5 mr-3"
          />
          카카오톡으로 시작하기 (준비 중)
        </Button>
      </div>

      <p className="mt-8 text-sm opacity-80">
        로그인 시 개인정보 처리방침에 동의한 것으로 간주됩니다.
      </p>

      <button
        onClick={() => navigate("/")}
        className="mt-6 underline text-sm opacity-70 hover:opacity-100"
      >
        홈으로 돌아가기
      </button>
    </div>
  );

};
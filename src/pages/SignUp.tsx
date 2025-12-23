// src/pages/SignUp.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  // 실제 백엔드 서버 주소로 변경 (배포 시 환경변수 사용 권장)
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSignup = (provider: string) => {
    // 로그인 중 안내 페이지 등으로 보내고 싶으면 navigate("/loading") 추가 가능
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${BASE_URL}/api/v1/oauth/callback/google&response_type=code&scope=email profile`;
};
    // 백엔드에서 OAuth 수행 후 프론트엔드의 /oauth/callback 으로 redirect 예정

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-primary to-primary-hover text-white">
      <h1 className="text-4xl font-bold mb-6">Note Vault 회원가입</h1>
      <p className="text-lg opacity-90 mb-10 text-center">
        아래 방법 중 하나로 회원가입하거나 로그인하세요.
      </p>

      <div className="flex flex-col gap-4 w-72">
        {/* Google OAuth 버튼 */}
        <Button
          onClick={() => handleSignup("google")}
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
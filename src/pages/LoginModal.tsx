import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function LoginModal() {
  const navigate = useNavigate();

  const handleClose = () => navigate("/"); // 닫기 → 메인으로 복귀

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 로고 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Note Vault</h1>
        </div>

        {/* 입력창 */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="이메일을 입력해주세요"
            className="w-full border rounded-md p-3 focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            className="w-full border rounded-md p-3 focus:ring-2 focus:ring-primary outline-none"
          />

          <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> 로그인 유지
            </label>
            <span className="cursor-pointer hover:text-primary">
              아이디/비밀번호 찾기
            </span>
          </div>

          <Button className="w-full mt-4 py-3 text-lg bg-black text-white rounded-md">
            로그인
          </Button>

          {/* SNS 로그인 */}
          <div className="text-center text-gray-500 mt-6">
            <p className="text-sm mb-3">SNS 간편 로그인</p>
            <div className="flex justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400"></div>
              <div className="w-10 h-10 rounded-full bg-green-500"></div>
              <div className="w-10 h-10 rounded-full bg-black"></div>
              <div className="w-10 h-10 rounded-full bg-blue-500"></div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            아직 회원이 아니신가요?{" "}
            <span className="text-primary font-medium cursor-pointer">
              회원가입
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

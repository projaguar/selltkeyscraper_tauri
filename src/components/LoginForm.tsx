import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { loginUser, getStoredCredentials } from "@/utils/auth";

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("12345");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedCredentials = getStoredCredentials();
    if (storedCredentials) {
      setEmail(storedCredentials.email);
      setPassword(storedCredentials.password);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await loginUser(email, password, rememberMe);
      
      if (success) {
        onLogin();
      } else {
        setError("이메일 또는 비밀번호가 잘못되었습니다.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* 앱 로고/타이틀 */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-light text-indigo-600 mb-2">
          Selltkey<span className="font-medium">Scraper</span>
        </h1>
        <div className="text-sm font-medium text-indigo-400 tracking-wider">V2</div>
        <div className="w-24 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 mx-auto mt-4"></div>
      </div>

      {/* 로그인 폼 */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-1">로그인</h2>
          <p className="text-gray-500 text-sm">계정에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className="w-full h-12 bg-white/70 backdrop-blur border-gray-200 focus:border-indigo-400 rounded-xl text-gray-700 placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full h-12 bg-white/70 backdrop-blur border-gray-200 focus:border-indigo-400 rounded-xl text-gray-700 placeholder:text-gray-400"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
              className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
            <label
              htmlFor="remember"
              className="text-sm text-gray-600 cursor-pointer"
            >
              아이디 비밀번호 저장하기
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50/80 backdrop-blur p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* 하단 장식 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-100/30 to-transparent pointer-events-none"></div>
    </div>
  );
}
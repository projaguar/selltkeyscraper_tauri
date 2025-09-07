import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";

interface NaverLoginGuideProps {
  onLoginComplete: () => void;
}

interface BrowserStatus {
  initialized: boolean;
  naver_login_status: boolean;
  error?: string;
}

export function NaverLoginGuide({ onLoginComplete }: NaverLoginGuideProps) {
  const [browserStatus, setBrowserStatus] = useState<BrowserStatus>({
    initialized: false,
    naver_login_status: false,
    error: undefined,
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(false);

  // 브라우저 상태 조회
  const checkBrowserStatus = async () => {
    try {
      const status = await invoke<BrowserStatus>("get_browser_status");
      setBrowserStatus(status);
      return status;
    } catch (error) {
      console.error("브라우저 상태 조회 실패:", error);
      return null;
    }
  };

  // 브라우저 초기화
  const initializeBrowser = async () => {
    setIsInitializing(true);
    try {
      await invoke("initialize_browser");
      // 초기화 후 상태 확인
      setTimeout(() => {
        checkBrowserStatus();
        setIsInitializing(false);
      }, 3000);
    } catch (error) {
      console.error("브라우저 초기화 실패:", error);
      setIsInitializing(false);
    }
  };

  // 네이버 로그인 상태 확인
  const checkNaverLogin = async () => {
    setCheckingLogin(true);
    try {
      const isLoggedIn = await invoke<boolean>("check_naver_login");
      if (isLoggedIn) {
        onLoginComplete();
      } else {
        alert("아직 네이버 로그인이 완료되지 않았습니다. 브라우저에서 로그인을 완료해주세요.");
      }
    } catch (error) {
      console.error("네이버 로그인 상태 확인 실패:", error);
      alert("로그인 상태 확인 중 오류가 발생했습니다.");
    } finally {
      setCheckingLogin(false);
    }
  };

  // 컴포넌트 마운트 시 브라우저 상태 확인 및 자동 초기화
  useEffect(() => {
    const initializeOnMount = async () => {
      const status = await checkBrowserStatus();
      if (!status?.initialized) {
        // 브라우저가 초기화되지 않았으면 자동으로 초기화
        await initializeBrowser();
      }
    };

    initializeOnMount();

    // 주기적으로 브라우저 상태 체크 (5초마다)
    const statusInterval = setInterval(checkBrowserStatus, 5000);
    
    // 네이버 로그인 상태를 주기적으로 체크해서 자동 전환 (3초마다)
    const loginCheckInterval = setInterval(async () => {
      if (browserStatus.initialized) {
        try {
          const isLoggedIn = await invoke<boolean>("check_naver_login");
          if (isLoggedIn) {
            console.log("네이버 로그인 자동 감지됨! 작업화면으로 전환합니다.");
            onLoginComplete();
          }
        } catch (error) {
          console.error("자동 로그인 체크 실패:", error);
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(loginCheckInterval);
    };
  }, [browserStatus.initialized, onLoginComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-light text-indigo-700 mb-4">
          Selltkey<span className="font-medium">Scraper</span>
        </h1>
        <div className="text-lg font-medium text-indigo-500 tracking-wider mb-2">V2</div>
        <div className="w-32 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 mx-auto rounded-full"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            네이버 로그인이 필요합니다
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            작업을 시작하기 위해 브라우저에서 네이버 계정으로 로그인해주세요.<br />
            브라우저가 자동으로 실행되며 네이버 로그인 페이지가 열립니다.
          </p>
        </div>

        {/* 상태 표시 */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">브라우저 상태:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                browserStatus.initialized 
                  ? 'bg-green-100 text-green-700' 
                  : isInitializing 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {isInitializing ? '초기화 중...' : browserStatus.initialized ? '준비됨' : '대기중'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">네이버 로그인:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                browserStatus.naver_login_status 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {browserStatus.naver_login_status ? '로그인됨' : '로그인 필요'}
              </span>
            </div>
          </div>

          {browserStatus.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{browserStatus.error}</p>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          {!browserStatus.initialized ? (
            <Button 
              onClick={initializeBrowser}
              disabled={isInitializing}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-medium rounded-xl shadow-lg"
            >
              {isInitializing ? '브라우저 실행 중...' : '브라우저 시작하기'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                💡 브라우저 창에서 네이버 로그인을 완료하면 자동으로 전환됩니다.
                <br />
                <span className="text-xs text-gray-500 mt-1 block">
                  (로그인 상태를 3초마다 자동 체크 중...)
                </span>
              </div>
              
              <Button 
                onClick={checkNaverLogin}
                disabled={checkingLogin}
                className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-medium rounded-xl shadow-lg"
              >
                {checkingLogin ? '로그인 확인 중...' : '로그인 완료 확인'}
              </Button>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>• 브라우저가 자동으로 열리지 않으면 '브라우저 시작하기' 버튼을 다시 클릭해주세요</p>
          <p>• 로그인 후 브라우저 창을 닫지 말고 그대로 두세요</p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { LoginForm } from "./components/LoginForm";
import { NaverLoginGuide } from "./components/NaverLoginGuide";
import { WorkScreen } from "./components/WorkScreen";
import { checkAuthStatus } from "./utils/auth";

type AppState = "login" | "naver_guide" | "work";

function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      setAppState(authStatus ? "naver_guide" : "login");
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = () => {
    setAppState("naver_guide");
  };

  const handleNaverLoginComplete = () => {
    setAppState("work");
  };

  const handleLogout = () => {
    setAppState("login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  switch (appState) {
    case "login":
      return <LoginForm onLogin={handleLogin} />;
    case "naver_guide":
      return <NaverLoginGuide onLoginComplete={handleNaverLoginComplete} />;
    case "work":
      return <WorkScreen />;
    default:
      return <LoginForm onLogin={handleLogin} />;
  }
}

export default App;

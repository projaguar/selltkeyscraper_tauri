import { Button } from "@/components/ui/button";
import { logoutUser } from "@/utils/auth";

interface MainScreenProps {
  onLogout: () => void;
}

export function MainScreen({ onLogout }: MainScreenProps) {
  const handleLogout = async () => {
    await logoutUser();
    onLogout();
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              메인 화면
            </h1>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="text-gray-700 hover:text-gray-900"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            환영합니다!
          </h2>
          <p className="text-gray-600">
            로그인이 성공적으로 완료되었습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
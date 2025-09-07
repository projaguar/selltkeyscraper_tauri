export function WorkScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          작업화면입니다
        </h1>
        
        <p className="text-xl text-gray-600">
          네이버 로그인이 성공적으로 완료되었습니다!
        </p>
        
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500">
            실제 작업 기능들이 여기에 추가될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
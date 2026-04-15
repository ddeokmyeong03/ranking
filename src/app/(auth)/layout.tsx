export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎖️</div>
          <h1 className="text-xl font-bold text-gray-900">당직근무 관리 시스템</h1>
          <p className="text-sm text-gray-500 mt-1">육군 간부 전용</p>
        </div>
        {children}
      </div>
    </div>
  );
}

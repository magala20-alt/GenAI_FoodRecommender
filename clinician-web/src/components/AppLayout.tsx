import { Outlet } from 'react-router-dom'
import { useAuth } from '../hooks'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">DiabetesCare</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Dr. {user?.firstName} {user?.lastName}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

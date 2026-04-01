import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="h-screen bg-gray-50">
      <main className="h-full overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { SchedulePage } from './pages/SchedulePage'
import { AlertsPage } from './pages/AlertsPage'
import { AISummariesPage } from './pages/AISummariesPage'
import { PatientListPage } from './pages/PatientListPage'
import { PatientOnboardingPage } from './pages/PatientOnboardingPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { AdminDoctorOnboardingPage } from './pages/AdminDoctorOnboardingPage'
import { AppLayout } from './components/AppLayout'

function AppRoutes() {
  const { user, isLoading } = useAuth()
  const requiresPasswordChange = !!user?.mustChangePassword

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {!user ? (
        <>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          {requiresPasswordChange ? (
            <Route path="*" element={<Navigate to="/change-password" replace />} />
          ) : (
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/tasks" element={<SchedulePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/ai-summaries" element={<AISummariesPage />} />
              <Route path="/patients" element={<PatientListPage />} />
              <Route path="/patients/onboard" element={<PatientOnboardingPage />} />
              <Route path="/patients/:patientId" element={<PatientProfilePage />} />
              <Route path="/admin/doctors/onboard" element={<AdminDoctorOnboardingPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          )}
        </>
      )}
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

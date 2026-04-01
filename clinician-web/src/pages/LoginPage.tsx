import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { AuthCredentials } from '../types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState<AuthCredentials>({
    email: 'admin@caresync.com',
    password: 'Admin@12345',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }

    try {
      await login(formData)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-2/3 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center px-8 py-6">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">⚕️</span>
          </div>
        </div>

        {/* CARESYNC Heading */}
        <h1 className="text-3xl font-bold text-white text-center mb-2 graduate-regular">CARESYNC</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Clinical Dashboard · Secure Access</p>

        {/* Form Container with Transparent Box */}
        <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
          <p className="text-gray-300 text-sm text-left mb-6">Sign in to your clinician account</p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 transition"
                placeholder="admin@caresync.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Forgot Password Link */}
            {/* to be handled later */}
            <div className="text-right">
              <a href="#" className="text-teal-400 hover:text-teal-300 text-sm font-medium transition">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 text-base mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>256-bit encrypted · HIPAA compliant</span>
          </div>
        </div>
      </div>

      {/* Right Side - Features Showcase */}
      <div className="w-1/3 bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center px-8 py-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white text-center max-w-sm">
          <p className="text-teal-100 text-sm text-left font-semibold mb-3 graduate-regular">CARESYNC</p>
          <h1 className="text-3xl text-left font-bold mb-3 leading-tight">
            Intelligent diabetes care, together.
          </h1>
          <p className="text-teal-50 text-base text-left mb-8">
            AI-powered insights, clinical precision, real-time patient monitoring.
          </p>

          {/* Features */}
          <div className="space-y-4 mt-8">
            <div className="flex items-start gap-3">
              <div className="text-xl">💓</div>
              <div className="text-left">
                <p className="font-semibold text-base">Adherence risk predictions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">📊</div>
              <div className="text-left">
                <p className="font-semibold text-base">14-day health forecasts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">🍽️</div>
              <div className="text-left">
                <p className="font-semibold text-base">AI meal plan generation</p>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  )
}

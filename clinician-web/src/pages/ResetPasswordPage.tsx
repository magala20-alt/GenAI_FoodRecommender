import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { authService } from '../services/authService'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [token, setToken] = useState(initialToken)
  const [isChecking, setIsChecking] = useState(Boolean(initialToken))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const verify = async () => {
      if (!token.trim()) {
        setIsChecking(false)
        return
      }

      try {
        setError(null)
        await authService.verifyPasswordResetToken(token.trim())
        setTokenValid(true)
      } catch (err) {
        setTokenValid(false)
        setError(err instanceof Error ? err.message : 'Invalid or expired reset token')
      } finally {
        setIsChecking(false)
      }
    }

    void verify()
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!token.trim()) {
      setError('Enter your reset token.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.resetPassword(token.trim(), newPassword)
      setSuccess(response.detail)
      setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-teal-950/30">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-teal-300 uppercase">CareSync</p>
          <h1 className="mt-2 text-3xl font-bold">Reset password</h1>
          <p className="mt-2 text-sm text-slate-300">
            Use the token from your email. It expires after 15 minutes and works once.
          </p>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="mb-2 block text-sm text-slate-300">
              Reset token
            </label>
            <input
              id="token"
              value={token}
              onChange={event => setToken(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
              placeholder="Paste the token from email"
              disabled={isSubmitting}
            />
            <p className="mt-2 text-xs text-slate-400">
              If you clicked the email link, the token should already be filled in.
            </p>
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm text-slate-300">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
              placeholder="At least 8 characters"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm text-slate-300">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
              placeholder="Re-enter password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isChecking || !token.trim() || !tokenValid}
            className="w-full rounded-2xl bg-teal-500 px-4 py-3 font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSubmitting ? 'Updating...' : isChecking ? 'Checking token...' : 'Update password'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <Link to="/forgot-password" className="text-teal-300 hover:text-teal-200">
            Request a new token
          </Link>
          <Link to="/login" className="hover:text-white">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

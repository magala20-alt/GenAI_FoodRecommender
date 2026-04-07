import { useState } from 'react'
import { Link } from 'react-router-dom'

import { authService } from '../services/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.requestPasswordReset(email.trim())
      setSuccess(response.detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password reset')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-teal-950/40">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-teal-300 uppercase">CareSync</p>
          <h1 className="mt-2 text-3xl font-bold">Forgot password?</h1>
          <p className="mt-2 text-sm text-slate-300">
            Enter your email and we’ll send a 15-minute reset link.
          </p>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {success && <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-teal-400"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-teal-500 px-4 py-3 font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="text-teal-300 hover:text-teal-200">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

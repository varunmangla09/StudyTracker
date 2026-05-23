import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabaseUrlMisconfigured } from '../lib/supabase'
import './Auth.css'

export function Auth() {
  const { signIn, signUp, resetPassword, configured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!configured) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
        <div className="auth-card card">
          <h1>Setup required</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env</code> and add your Supabase URL and anon key.
            Then run the SQL in <code>supabase/schema.sql</code> in your Supabase project.
          </p>
          <p className="hint">See README.md for step-by-step instructions.</p>
        </div>
        </div>
      </div>
    )
  }

  if (supabaseUrlMisconfigured) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
        <div className="auth-card card">
          <h1>Fix your .env URL</h1>
          <p>
            <code>VITE_SUPABASE_URL</code> must be the <strong>Project URL</strong> only — do not add{' '}
            <code>/rest/v1</code>.
          </p>
          <p className="hint">
            Correct: <code>https://xxxxx.supabase.co</code>
            <br />
            Wrong: <code>https://xxxxx.supabase.co/rest/v1</code>
          </p>
          <p className="hint">Update <code>.env</code>, then restart <code>npm run dev</code>.</p>
        </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'forgot') {
      const { error: err } = await resetPassword(email)
      setLoading(false)
      if (err) setError(err)
      else {
        setMessage(
          `Reset link sent. Open it on this computer with "npm run dev" running, at ${window.location.origin}`
        )
      }
      return
    }

    const fn = mode === 'signin' ? signIn : signUp
    const { error: err } = await fn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else if (mode === 'signup') {
      setMessage('Check your email to confirm your account, then sign in.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-logo-large" aria-hidden />
        <h1>SwitchTrack</h1>
        <p>Track job-switch study time & daily habits</p>
      </div>
      <form className="auth-card card" onSubmit={handleSubmit}>
        <h2>
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h2>
        <p className="hint auth-helper">
          {mode === 'forgot'
            ? 'Use the email linked to your account and open the reset link on this device.'
            : 'Use your email and password to keep your study data synced across devices.'}
        </p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        {mode !== 'forgot' && (
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
        )}
        {mode === 'signin' && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setMode('forgot')
              setError(null)
              setMessage(null)
            }}
          >
            Forgot password?
          </button>
        )}
        <div aria-live="polite" className="auth-status">
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
        </div>
        <button type="submit" className="btn btn-primary full" disabled={loading}>
          {loading
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign in'
              : mode === 'signup'
                ? 'Sign up'
                : 'Send reset link'}
        </button>
        {mode === 'forgot' ? (
          <button
            type="button"
            className="btn btn-ghost full"
            onClick={() => {
              setMode('signin')
              setError(null)
              setMessage(null)
            }}
          >
            Back to sign in
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost full"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setMessage(null)
            }}
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        )}
      </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function Auth() {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!configured) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1>Setup required</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env</code> and add your Supabase URL and anon key.
            Then run the SQL in <code>supabase/schema.sql</code> in your Supabase project.
          </p>
          <p className="hint">See README.md for step-by-step instructions.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
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
      <div className="auth-brand">
        <h1>SwitchTrack</h1>
        <p>Track job-switch study time & daily habits</p>
      </div>
      <form className="auth-card card" onSubmit={handleSubmit}>
        <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
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
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <button type="submit" className="btn btn-primary full" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
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
      </form>
    </div>
  )
}

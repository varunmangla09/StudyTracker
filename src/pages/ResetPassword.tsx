import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function ResetPassword() {
  const { updatePassword, isPasswordRecovery, session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const ready = isPasswordRecovery && Boolean(session)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/', { replace: true })
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <p className="hint" style={{ textAlign: 'center' }}>Verifying reset link…</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1>Reset link invalid or expired</h1>
          <p className="hint">
            Request a new link from the sign-in page. Make sure <code>npm run dev</code> is running and
            open the link on this PC at <code>http://localhost:5173</code>.
          </p>
          <Link to="/" className="btn btn-primary full" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>New password</h1>
        <p>Enter a new password — you won&apos;t use the old one anymore</p>
      </div>
      <form className="auth-card card" onSubmit={handleSubmit}>
        <p className="hint auth-helper">Choose a password with at least 6 characters so you can sign in again right away.</p>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <div aria-live="polite" className="auth-status">
          {error && <p className="auth-error">{error}</p>}
        </div>
        <button type="submit" className="btn btn-primary full" disabled={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}

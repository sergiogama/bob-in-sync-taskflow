import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

export default function AccountRecoveryPage() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand"><span className="brand-mark">TF</span><span>TaskFlow</span></div>
          <h1>Password reset</h1>
          <p className="muted">Your password has been updated successfully.</p>
          <Link to="/login" className="button primary full login-action">Sign in with new password</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand"><span className="brand-mark">TF</span><span>TaskFlow</span></div>
        <h1>Reset password</h1>
        <p className="muted">Enter the one-time token issued by your TaskFlow Manager and choose a new password.</p>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Reset token
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste token here" />
          </label>
          <label>New password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label>Confirm password
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </label>
          <button className="button primary full" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
        <div className="login-link">
          <Link to="/login" className="muted">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

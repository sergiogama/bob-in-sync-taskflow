import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('maria.santos@taskflow.local');
  const [password, setPassword] = useState('taskflow123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); setSubmitting(false); }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand"><span className="brand-mark">TF</span><span>TaskFlow</span></div>
        <h1>Sign in</h1>
        <p className="muted">Internal IT maintenance request management</p>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="button primary full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
          <div className="login-link"><Link to="/forgot-password" className="muted">Need help signing in?</Link></div>
        </form>
        <div className="login-help"><strong>Demo access</strong><br />Use the pre-filled credentials. All seeded users share this password.</div>
      </div>
    </div>
  );
}

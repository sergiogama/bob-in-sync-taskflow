import { Link } from 'react-router-dom'

export default function SignInHelpPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand"><span className="brand-mark">TF</span><span>TaskFlow</span></div>
        <h1>Sign-in assistance</h1>
        <p className="muted">For account security, password resets are issued by a TaskFlow Manager.</p>
        <div className="login-help"><strong>What to do</strong><br />Contact your manager through your approved internal support channel. They will verify your identity and provide a one-time reset token valid for 60 minutes.</div>
        <Link to="/reset-password" className="button secondary full login-action">I have a reset token</Link>
        <Link to="/login" className="button primary full login-action">Back to sign in</Link>
      </div>
    </div>
  )
}

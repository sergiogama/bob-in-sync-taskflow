import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/PageState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [issuingFor, setIssuingFor] = useState(null);
  useEffect(() => { api('/users').then(({ users }) => setUsers(users)).catch((e) => { setError(e.message); setUsers([]); }); }, []);

  async function issueResetToken(user) {
    setError('');
    setResetResult(null);
    setIssuingFor(user.id);
    try {
      const result = await api(`/users/${user.id}/password-reset`, { method: 'POST' });
      setResetResult({ ...result, user });
    } catch (err) {
      setError(err.message);
    } finally {
      setIssuingFor(null);
    }
  }

  const canManagePasswords = currentUser.role === 'Manager';
  return (
    <>
      <div className="page-header"><div><h1>Users</h1><p>{canManagePasswords ? 'People and account recovery administration' : 'People available for ticket assignment'}</p></div></div>
      {resetResult && <section className="panel reset-token-panel" aria-live="polite">
        <div><h2>Reset token for {resetResult.user.name}</h2><p>Share this token only after verifying the user through an approved internal channel. It expires in {resetResult.expires_in_minutes} minutes.</p></div>
        <code>{resetResult.reset_token}</code>
        <button className="button secondary" type="button" onClick={() => setResetResult(null)}>Dismiss</button>
      </section>}
      <section className="panel">
        {error && <div className="panel-message"><ErrorState message={error} /></div>}
        {!users ? <LoadingState /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th>{canManagePasswords && <th>Account</th>}</tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><td><div className="person-cell"><span className="avatar small">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{user.name}</strong></div></td><td>{user.email}</td><td>{user.role}</td><td><span className="active-status">{user.active ? 'Active' : 'Inactive'}</span></td>{canManagePasswords && <td><button className="button secondary compact" type="button" disabled={!user.active || issuingFor === user.id} onClick={() => issueResetToken(user)}>{issuingFor === user.id ? 'Generating…' : 'Generate reset token'}</button></td>}</tr>)}
        </tbody></table></div>}
      </section>
    </>
  );
}

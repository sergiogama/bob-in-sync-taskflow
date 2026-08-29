import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/PageState.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/users').then(({ users }) => setUsers(users)).catch((e) => setError(e.message)); }, []);
  return (
    <>
      <div className="page-header"><div><h1>Users</h1><p>People available for ticket assignment</p></div></div>
      <section className="panel">
        {error ? <ErrorState message={error} /> : !users ? <LoadingState /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><td><div className="person-cell"><span className="avatar small">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{user.name}</strong></div></td><td>{user.email}</td><td>{user.role}</td><td><span className="active-status">Active</span></td></tr>)}
        </tbody></table></div>}
      </section>
    </>
  );
}

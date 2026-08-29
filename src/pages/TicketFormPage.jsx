import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/PageState.jsx';

const emptyForm = { title: '', description: '', status: 'OPEN', owner_id: '' };

export default function TicketFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const requests = [api('/users')]; if (editing) requests.push(api(`/tickets/${id}`));
    Promise.all(requests).then(([userData, ticketData]) => {
      setUsers(userData.users);
      if (ticketData) setForm({ title: ticketData.ticket.title, description: ticketData.ticket.description, status: ticketData.ticket.status, owner_id: ticketData.ticket.owner_id || '' });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [editing, id]);

  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, owner_id: form.owner_id ? Number(form.owner_id) : null };
    try {
      const result = await api(editing ? `/tickets/${id}` : '/tickets', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      navigate(`/tickets/${result.ticket.id}`);
    } catch (e) { setError(e.message); setSaving(false); }
  }
  if (loading) return <LoadingState />;
  return (
    <>
      <div className="page-header"><div><div className="breadcrumbs"><Link to="/tickets">Tickets</Link><span>/</span><span>{editing ? `TF-${String(id).padStart(4, '0')}` : 'New ticket'}</span></div><h1>{editing ? 'Edit ticket' : 'Create ticket'}</h1><p>{editing ? 'Update the maintenance request details' : 'Register a new maintenance request'}</p></div></div>
      <form className="panel form-panel" onSubmit={submit}>
        {error && <ErrorState message={error} />}
        <div className="form-grid">
          <label className="field-wide">Title<span className="required">Required</span><input name="title" value={form.title} onChange={change} maxLength="160" required autoFocus /></label>
          <label>Status<select name="status" value={form.status} onChange={change}><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label>
          <label>Owner<select name="owner_id" value={form.owner_id} onChange={change}><option value="">Unassigned</option>{users.map((user) => <option value={user.id} key={user.id}>{user.name} — {user.role}</option>)}</select></label>
          <label className="field-wide">Description<span className="required">Required</span><textarea name="description" value={form.description} onChange={change} rows="9" required /></label>
        </div>
        <div className="form-actions"><Link to={editing ? `/tickets/${id}` : '/tickets'} className="button secondary">Cancel</Link><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create ticket'}</button></div>
      </form>
    </>
  );
}

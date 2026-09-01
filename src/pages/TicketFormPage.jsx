import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorState, LoadingState } from '../components/PageState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { allowedTicketStatuses, canCreateTicket, canEditTicket } from '../permissions.js';

const emptyForm = { title: '', description: '', status: 'OPEN', category: 'OTHER', owner_id: '', expected_behavior: '', steps_to_reproduce: '', environment: '', business_rules: '', acceptance_criteria: '' };

export default function TicketFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const requests = [api('/users')]; if (editing) requests.push(api(`/tickets/${id}`));
    Promise.all(requests).then(([userData, ticketData]) => {
      setUsers(userData.users);
      if (ticketData) {
        const loadedTicket = ticketData.ticket;
        setTicket(loadedTicket);
        const developerClaim = user.role === 'Developer' && loadedTicket.owner_id === null;
        setForm({
          title: loadedTicket.title,
          description: loadedTicket.description,
          status: user.role === 'Developer' && loadedTicket.status === 'OPEN' ? 'IN_PROGRESS' : loadedTicket.status,
          category: loadedTicket.category || 'OTHER',
          owner_id: developerClaim ? String(user.id) : (loadedTicket.owner_id || ''),
          expected_behavior: loadedTicket.expected_behavior || '',
          steps_to_reproduce: loadedTicket.steps_to_reproduce || '',
          environment: loadedTicket.environment || '',
          business_rules: loadedTicket.business_rules || '',
          acceptance_criteria: loadedTicket.acceptance_criteria || '',
        });
      }
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [editing, id, user.id, user.role]);

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
  if (error && (!editing || !ticket)) return <ErrorState message={error} />;

  const authorized = editing ? canEditTicket(user, ticket) : canCreateTicket(user);
  if (!authorized) {
    return <ErrorState message="Your role does not allow this ticket action." />;
  }

  const developerMode = editing && user.role === 'Developer';
  const statuses = allowedTicketStatuses(user);
  return (
    <>
      <div className="page-header"><div><div className="breadcrumbs"><Link to="/tickets">Tickets</Link><span>/</span><span>{editing ? `TF-${String(id).padStart(4, '0')}` : 'New ticket'}</span></div><h1>{editing ? 'Edit ticket' : 'Create ticket'}</h1><p>{editing ? 'Update the maintenance request details' : 'Register a new maintenance request'}</p></div></div>
      <form className="panel form-panel" onSubmit={submit}>
        {error && <ErrorState message={error} />}
        <div className="form-grid">
          <label className="field-wide">Title<span className="required">Required</span><input name="title" value={form.title} onChange={change} maxLength="160" required autoFocus={!developerMode} disabled={developerMode} /></label>
          <label>Status<select name="status" value={form.status} onChange={change}>{statuses.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>
          <label>Category<select name="category" value={form.category} onChange={change} disabled={developerMode}><option value="SOFTWARE">Software</option><option value="HARDWARE">Hardware</option><option value="ACCESS">Access</option><option value="OTHER">Other</option></select></label>
          <label>Owner<select name="owner_id" value={form.owner_id} onChange={change} disabled={developerMode}><option value="">Unassigned</option>{users.map((listedUser) => <option value={listedUser.id} key={listedUser.id}>{listedUser.name} — {listedUser.role}</option>)}</select></label>
          <label className="field-wide">Description<span className="required">Required</span><textarea name="description" value={form.description} onChange={change} rows="9" required disabled={developerMode} /></label>
          <label className="field-wide">Expected behavior<textarea name="expected_behavior" value={form.expected_behavior} onChange={change} rows="3" disabled={developerMode} placeholder="Describe the correct functional outcome" /></label>
          <label className="field-wide">Steps to reproduce<textarea name="steps_to_reproduce" value={form.steps_to_reproduce} onChange={change} rows="4" disabled={developerMode} placeholder="List concise, repeatable steps when applicable" /></label>
          <label>Environment<textarea name="environment" value={form.environment} onChange={change} rows="4" disabled={developerMode} placeholder="Application environment, browser, or equipment details supplied by the requester" /></label>
          <label>Business rules<textarea name="business_rules" value={form.business_rules} onChange={change} rows="4" disabled={developerMode} placeholder="Relevant policy or calculation rules, when applicable" /></label>
          <label className="field-wide">Acceptance criteria<textarea name="acceptance_criteria" value={form.acceptance_criteria} onChange={change} rows="4" disabled={developerMode} placeholder="State how the squad will confirm the request is complete" /></label>
        </div>
        <div className="form-actions"><Link to={editing ? `/tickets/${id}` : '/tickets'} className="button secondary">Cancel</Link><button className="button primary" disabled={saving}>{saving ? 'Saving…' : developerMode && ticket.owner_id === null ? 'Claim and start work' : editing ? 'Save changes' : 'Create ticket'}</button></div>
      </form>
    </>
  );
}

function statusLabel(status) {
  return { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed' }[status];
}

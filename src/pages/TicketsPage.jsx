import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../components/PageState.jsx';
import { formatDate } from './DashboardPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { canCreateTicket } from '../permissions.js';
import ReadinessBadge from '../components/ReadinessBadge.jsx';

export default function TicketsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const readiness = params.get('readiness') || '';

  useEffect(() => {
    const query = new URLSearchParams(); if (search) query.set('search', search); if (status) query.set('status', status); if (category) query.set('category', category); if (readiness) query.set('readiness', readiness);
    const timer = setTimeout(() => api(`/tickets?${query}`).then(({ tickets }) => setTickets(tickets)).catch((e) => setError(e.message)), 150);
    return () => clearTimeout(timer);
  }, [search, status, category, readiness]);

  function updateParam(name, value) { const next = new URLSearchParams(params); value ? next.set(name, value) : next.delete(name); setParams(next); }
  return (
    <>
      <div className="page-header"><div><h1>Tickets</h1><p>Search and manage maintenance requests</p></div>{canCreateTicket(user) && <Link className="button primary" to="/tickets/new">New ticket</Link>}</div>
      <section className="panel">
        <div className="filters">
          <label className="search-field"><span>Search</span><input type="search" placeholder="Search title, description, or owner" value={search} onChange={(e) => updateParam('search', e.target.value)} /></label>
          <label><span>Status</span><select value={status} onChange={(e) => updateParam('status', e.target.value)}><option value="">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label>
          <label><span>Category</span><select value={category} onChange={(e) => updateParam('category', e.target.value)}><option value="">All categories</option><option value="SOFTWARE">Software</option><option value="HARDWARE">Hardware</option><option value="ACCESS">Access</option><option value="OTHER">Other</option></select></label>
          <label><span>Readiness</span><select value={readiness} onChange={(e) => updateParam('readiness', e.target.value)}><option value="">All readiness</option><option value="NEEDS_REVIEW">Needs review</option><option value="READY">Ready</option><option value="NOT_READY">Not ready</option></select></label>
        </div>
        {error ? <ErrorState message={error} /> : !tickets ? <LoadingState /> : (
          <><div className="result-count">{tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}</div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Status</th><th>Readiness</th><th>Category</th><th>Assigned to</th><th>Requester</th><th>Updated</th></tr></thead><tbody>
            {tickets.map((ticket) => <tr key={ticket.id} className={ticket.is_stale ? 'stale-row' : ''}><td><Link className="ticket-link" to={`/tickets/${ticket.id}`}><span>TF-{String(ticket.id).padStart(4, '0')}</span>{ticket.title}{ticket.is_stale ? <span className="stale-badge">Stale</span> : null}</Link></td><td><StatusBadge status={ticket.status} /></td><td><ReadinessBadge status={ticket.readiness_status} /></td><td>{ticket.category}</td><td>{ticket.owner || <span className="muted">Unassigned</span>}</td><td>{ticket.created_by}</td><td>{formatDate(ticket.updated_at)}</td></tr>)}
            {!tickets.length && <tr><td colSpan="7" className="empty-cell">No tickets match the current filters.</td></tr>}
          </tbody></table></div></>
        )}
      </section>
    </>
  );
}

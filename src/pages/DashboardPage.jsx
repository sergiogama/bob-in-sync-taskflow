import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import StatusBadge, { statusLabels } from '../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../components/PageState.jsx';

const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([api('/dashboard'), api('/tickets')]).then(([dashboard, tickets]) => setData({ counts: dashboard.counts, tickets: tickets.tickets.slice(0, 5) })).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return (
    <>
      <div className="page-header"><div><h1>Dashboard</h1><p>Maintenance request overview</p></div><Link className="button primary" to="/tickets/new">New ticket</Link></div>
      <section className="metrics" aria-label="Ticket status summary">
        {statuses.map((status) => <Link to={`/tickets?status=${status}`} className={`metric metric-${status.toLowerCase()}`} key={status}><span>{statusLabels[status]}</span><strong>{data.counts[status]}</strong><small>View tickets</small></Link>)}
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2>Recently updated</h2><p>Latest maintenance request activity</p></div><Link to="/tickets" className="secondary-link">View all tickets</Link></div>
        <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Status</th><th>Owner</th><th>Updated</th></tr></thead><tbody>
          {data.tickets.map((ticket) => <tr key={ticket.id}><td><Link className="ticket-link" to={`/tickets/${ticket.id}`}><span>TF-{String(ticket.id).padStart(4, '0')}</span>{ticket.title}</Link></td><td><StatusBadge status={ticket.status} /></td><td>{ticket.owner || <span className="muted">Unassigned</span>}</td><td>{formatDate(ticket.updated_at)}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}

export function formatDate(value) {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(normalized));
}

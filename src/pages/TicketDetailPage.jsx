import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../components/PageState.jsx';
import { formatDate } from './DashboardPage.jsx';

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() { api(`/tickets/${id}`).then(({ ticket }) => setTicket(ticket)).catch((e) => setError(e.message)); }
  useEffect(load, [id]);

  async function addComment(event) {
    event.preventDefault(); setSubmitting(true); setError('');
    try { await api(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ content: comment }) }); setComment(''); load(); }
    catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }
  if (error && !ticket) return <ErrorState message={error} />;
  if (!ticket) return <LoadingState />;
  return (
    <>
      <div className="page-header detail-header"><div><div className="breadcrumbs"><Link to="/tickets">Tickets</Link><span>/</span><span>TF-{String(ticket.id).padStart(4, '0')}</span></div><div className="title-with-status"><h1>{ticket.title}</h1><StatusBadge status={ticket.status} />{ticket.is_stale ? <span className="stale-badge">Stale</span> : null}</div><p>Created by {ticket.created_by} on {formatDate(ticket.created_at)}</p></div><Link className="button secondary" to={`/tickets/${ticket.id}/edit`}>Edit ticket</Link></div>
      {error && <ErrorState message={error} />}
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel detail-section"><h2>Description</h2><p className="description">{ticket.description}</p></section>
          <section className="panel comments-section">
            <div className="panel-header"><div><h2>Comments</h2><p>{ticket.comments.length} {ticket.comments.length === 1 ? 'comment' : 'comments'}</p></div></div>
            <div className="comments">
              {ticket.comments.map((item) => <article className="comment" key={item.id}><div className="avatar">{initials(item.author)}</div><div><div className="comment-meta"><strong>{item.author}</strong><span>{formatCommentDate(item.created_at)}</span></div><p>{item.content}</p></div></article>)}
              {!ticket.comments.length && <p className="empty-message">No comments have been added.</p>}
            </div>
            <form className="comment-form" onSubmit={addComment}><label>Add a comment<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" placeholder="Enter a work note or update" required /></label><div><button className="button primary" disabled={submitting}>{submitting ? 'Adding…' : 'Add comment'}</button></div></form>
          </section>
        </div>
        <aside className="panel details-panel"><h2>Ticket details</h2><dl><div><dt>Status</dt><dd><StatusBadge status={ticket.status} /></dd></div><div><dt>Category</dt><dd>{ticket.category}</dd></div><div><dt>Owner</dt><dd>{ticket.owner || 'Unassigned'}</dd></div><div><dt>Created by</dt><dd>{ticket.created_by}</dd></div><div><dt>Created</dt><dd>{formatDate(ticket.created_at)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(ticket.updated_at)}</dd></div></dl></aside>
      </div>
    </>
  );
}

function initials(name) { return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(); }
function formatCommentDate(value) {
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(normalized));
}

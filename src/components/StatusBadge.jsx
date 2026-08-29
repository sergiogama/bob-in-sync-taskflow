const labels = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed' };

export default function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status] || status}</span>;
}

export { labels as statusLabels };

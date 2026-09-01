const labels = { NEEDS_REVIEW: 'Needs review', READY: 'Ready', NOT_READY: 'Not ready' };

export default function ReadinessBadge({ status }) {
  return <span className={`readiness readiness-${status.toLowerCase()}`}>{labels[status]}</span>;
}

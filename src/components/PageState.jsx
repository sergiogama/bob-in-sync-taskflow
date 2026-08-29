export function LoadingState() { return <div className="page-state">Loading…</div>; }
export function ErrorState({ message }) { return <div className="alert error" role="alert">{message}</div>; }

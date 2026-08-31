const MANAGED_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function canCreateTicket(user) {
  return ['Analyst', 'Manager'].includes(user?.role);
}

export function canEditTicket(user, ticket) {
  if (!user || !ticket) return false;
  if (user.role === 'Manager') return true;
  if (user.role === 'Analyst') return ['OPEN', 'IN_PROGRESS'].includes(ticket.status);
  if (user.role === 'Developer') {
    return ticket.status !== 'CLOSED' && (ticket.owner_id === null || ticket.owner_id === user.id);
  }
  return false;
}

export function allowedTicketStatuses(user) {
  if (user?.role === 'Manager') return MANAGED_STATUSES;
  if (user?.role === 'Developer') return ['IN_PROGRESS', 'RESOLVED'];
  return ['OPEN', 'IN_PROGRESS'];
}

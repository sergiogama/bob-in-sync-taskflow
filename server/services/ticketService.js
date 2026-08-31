export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const CATEGORIES = ['SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'];

function forbidden(message) {
  throw Object.assign(new Error(message), { status: 403 });
}

function authorizeCreate(user, values) {
  if (!['Analyst', 'Manager'].includes(user.role)) {
    forbidden('Only Analysts and Managers can create tickets.');
  }
  if (user.role === 'Analyst' && !['OPEN', 'IN_PROGRESS'].includes(values.status)) {
    forbidden('Analysts can only create tickets as Open or In Progress.');
  }
}

function authorizeUpdate(current, values, user) {
  if (user.role === 'Manager') return;

  if (user.role === 'Analyst') {
    if (!['OPEN', 'IN_PROGRESS'].includes(current.status)) {
      forbidden('Analysts cannot reopen resolved or closed tickets.');
    }
    if (!['OPEN', 'IN_PROGRESS'].includes(values.status)) {
      forbidden('Analysts can only set tickets to Open or In Progress.');
    }
    return;
  }

  if (user.role === 'Developer') {
    if (current.status === 'CLOSED') {
      forbidden('Developers cannot reopen closed tickets.');
    }
    const ownsTicket = current.owner_id === user.id;
    const claimsUnassignedTicket = current.owner_id === null && values.ownerId === user.id;
    if (!ownsTicket && !claimsUnassignedTicket) {
      forbidden('Developers can only update their own tickets or claim unassigned tickets.');
    }
    if (values.ownerId !== user.id) {
      forbidden('Developers cannot assign tickets to another user.');
    }
    if (values.title !== current.title || values.description !== current.description || values.category !== current.category) {
      forbidden('Developers cannot change ticket classification or description.');
    }
    if (!['IN_PROGRESS', 'RESOLVED'].includes(values.status)) {
      forbidden('Developers can only set tickets to In Progress or Resolved.');
    }
    return;
  }

  forbidden('You do not have permission to update tickets.');
}

function validateFields(data, userModel) {
  if (!data.title?.trim()) throw Object.assign(new Error('Title is required.'), { status: 400 });
  if (!data.description?.trim()) throw Object.assign(new Error('Description is required.'), { status: 400 });
  if (!STATUSES.includes(data.status)) throw Object.assign(new Error('A valid status is required.'), { status: 400 });
  if (!CATEGORIES.includes(data.category)) throw Object.assign(new Error('A valid category is required.'), { status: 400 });
  if (data.ownerId !== null && data.ownerId !== undefined && !userModel.findById(data.ownerId)) {
    throw Object.assign(new Error('Selected owner was not found.'), { status: 400 });
  }
}

export function createTicketService(ticketModel, commentModel, userModel) {
  return {
    list(filters) {
      if (filters.status && !STATUSES.includes(filters.status)) {
        throw Object.assign(new Error('Invalid status filter.'), { status: 400 });
      }
      if (filters.category && !CATEGORIES.includes(filters.category)) {
        throw Object.assign(new Error('Invalid category filter.'), { status: 400 });
      }
      return ticketModel.list(filters);
    },
    get(id) {
      const ticket = ticketModel.findById(id);
      if (!ticket) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      return { ...ticket, comments: commentModel.listForTicket(id) };
    },
    create(data, user) {
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status || 'OPEN', category: data.category || 'OTHER',
        ownerId: data.owner_id ?? null,
      };
      validateFields(values, userModel);
      authorizeCreate(user, values);
      return ticketModel.create({ ...values, createdById: user.id });
    },
    update(id, data, user) {
      const current = ticketModel.findById(id);
      if (!current) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status, category: data.category || current.category,
        ownerId: data.owner_id ?? null,
      };
      validateFields(values, userModel);
      authorizeUpdate(current, values, user);
      return ticketModel.update(id, values);
    },
    addComment(id, content, authorId) {
      if (!ticketModel.findById(id)) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      if (!content?.trim()) throw Object.assign(new Error('Comment content is required.'), { status: 400 });
      return commentModel.create({ ticketId: id, authorId, content: content.trim() });
    },
    counts() {
      const counts = ticketModel.statusCounts();
      return {
        ...Object.fromEntries(STATUSES.map((status) => [status, counts[status] || 0])),
        stale: ticketModel.countStale(),
      };
    },
  };
}

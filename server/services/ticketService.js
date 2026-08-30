export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const CATEGORIES = ['SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'];

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
    create(data, userId) {
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status || 'OPEN', category: data.category || 'OTHER',
        ownerId: data.owner_id ?? null,
      };
      validateFields(values, userModel);
      return ticketModel.create({ ...values, createdById: userId });
    },
    update(id, data) {
      const current = ticketModel.findById(id);
      if (!current) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status, category: data.category || current.category,
        ownerId: data.owner_id ?? null,
      };
      validateFields(values, userModel);
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

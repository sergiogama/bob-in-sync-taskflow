export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const CATEGORIES = ['SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'];
export const READINESS_STATUSES = ['NEEDS_REVIEW', 'READY', 'NOT_READY'];

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
    if (current.readiness_status !== 'READY') {
      forbidden('Developers can only start or update work when the ticket is Ready.');
    }
    const ownsTicket = current.owner_id === user.id;
    const claimsUnassignedTicket = current.owner_id === null && values.ownerId === user.id;
    if (!ownsTicket && !claimsUnassignedTicket) {
      forbidden('Developers can only update their own tickets or claim unassigned tickets.');
    }
    if (values.ownerId !== user.id) {
      forbidden('Developers cannot assign tickets to another user.');
    }
    if (values.title !== current.title || values.description !== current.description || values.category !== current.category ||
      values.expectedBehavior !== current.expected_behavior || values.stepsToReproduce !== current.steps_to_reproduce ||
      values.environment !== current.environment || values.businessRules !== current.business_rules ||
      values.acceptanceCriteria !== current.acceptance_criteria) {
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

function contentValues(data, current = {}) {
  return {
    expectedBehavior: (data.expected_behavior ?? current.expected_behavior ?? '').trim(),
    stepsToReproduce: (data.steps_to_reproduce ?? current.steps_to_reproduce ?? '').trim(),
    environment: (data.environment ?? current.environment ?? '').trim(),
    businessRules: (data.business_rules ?? current.business_rules ?? '').trim(),
    acceptanceCriteria: (data.acceptance_criteria ?? current.acceptance_criteria ?? '').trim(),
  };
}

export function createTicketService(ticketModel, commentModel, userModel, workflowModel, auditModel, notificationModel, activityService) {
  return {
    list(filters) {
      if (filters.status && !STATUSES.includes(filters.status)) {
        throw Object.assign(new Error('Invalid status filter.'), { status: 400 });
      }
      if (filters.category && !CATEGORIES.includes(filters.category)) {
        throw Object.assign(new Error('Invalid category filter.'), { status: 400 });
      }
      if (filters.readiness && !READINESS_STATUSES.includes(filters.readiness)) {
        throw Object.assign(new Error('Invalid readiness filter.'), { status: 400 });
      }
      return ticketModel.list(filters);
    },
    get(id, user) {
      const ticket = ticketModel.findById(id);
      if (!ticket) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      return {
        ...ticket,
        comments: commentModel.listForTicket(id),
        readiness_reviews: workflowModel.listReviews(id),
        activity: auditModel.listForTicket(id),
        ...(user.role === 'Manager' ? { notification_deliveries: notificationModel.listForTicket(id) } : {}),
      };
    },
    create(data, user, context) {
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status || 'OPEN', category: data.category || 'OTHER',
        ownerId: data.owner_id ?? null,
        ...contentValues(data),
      };
      validateFields(values, userModel);
      authorizeCreate(user, values);
      return activityService.run(() => {
        const ticket = ticketModel.create({ ...values, createdById: user.id });
        activityService.record(ticket, user, context, 'TICKET_CREATED', { status: ticket.status, owner_id: ticket.owner_id });
        activityService.notify(ticket, 'TICKET_CREATED', user.id, 'A maintenance request was created.');
        return ticket;
      });
    },
    update(id, data, user, context) {
      const current = ticketModel.findById(id);
      if (!current) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      const values = {
        title: data.title?.trim(), description: data.description?.trim(),
        status: data.status, category: data.category || current.category,
        ownerId: data.owner_id ?? null,
        ...contentValues(data, current),
      };
      validateFields(values, userModel);
      authorizeUpdate(current, values, user);
      const resetReadiness = values.title !== current.title || values.description !== current.description ||
        values.category !== current.category || values.expectedBehavior !== current.expected_behavior ||
        values.stepsToReproduce !== current.steps_to_reproduce || values.environment !== current.environment ||
        values.businessRules !== current.business_rules || values.acceptanceCriteria !== current.acceptance_criteria;
      return activityService.run(() => {
        const updated = ticketModel.update(id, { ...values, resetReadiness });
        activityService.record(updated, user, context, 'TICKET_UPDATED', {
          previous_status: current.status, status: updated.status,
          previous_owner_id: current.owner_id, owner_id: updated.owner_id,
          readiness_reset: resetReadiness,
        });
        const eventType = current.owner_id !== updated.owner_id ? 'ASSIGNMENT_CHANGED' :
          current.status !== updated.status ? 'STATUS_CHANGED' : 'TICKET_UPDATED';
        activityService.notify(updated, eventType, user.id, `Ticket updated by ${user.name}.`);
        return updated;
      });
    },
    addComment(id, content, user, context) {
      if (!ticketModel.findById(id)) throw Object.assign(new Error('Ticket not found.'), { status: 404 });
      if (!content?.trim()) throw Object.assign(new Error('Comment content is required.'), { status: 400 });
      return activityService.run(() => {
        const comment = commentModel.create({ ticketId: id, authorId: user.id, content: content.trim() });
        const ticket = ticketModel.findById(id);
        activityService.record(ticket, user, context, 'COMMENT_ADDED', { comment_id: comment.id });
        activityService.notify(ticket, 'COMMENT_ADDED', user.id, `${user.name} added a comment.`);
        return comment;
      });
    },
    counts() {
      const counts = ticketModel.statusCounts();
      return {
        ...Object.fromEntries(STATUSES.map((status) => [status, counts[status] || 0])),
        stale: ticketModel.countStale(),
        readiness: {
          ...Object.fromEntries(READINESS_STATUSES.map((status) => [status, 0])),
          ...ticketModel.countByReadiness(),
        },
      };
    },
  };
}

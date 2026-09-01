function ticketReference(ticket) {
  return `TF-${String(ticket.id).padStart(4, '0')}`;
}

export function createActivityService(db, auditModel, notificationModel, workflowModel, userModel) {
  return {
    run(work) {
      return db.transaction(work)();
    },
    record(ticket, user, context, action, details = {}) {
      return auditModel.record({
        ticketId: ticket.id,
        actorId: user.id,
        actorType: context.actorType,
        source: context.source,
        action,
        details,
        correlationId: context.correlationId,
      });
    },
    recordSystem(user, context, action, details = {}) {
      return auditModel.record({
        actorId: user.id,
        actorType: context.actorType,
        source: context.source,
        action,
        details,
        correlationId: context.correlationId,
      });
    },
    notify(ticket, eventType, actorId, message) {
      const settings = workflowModel.getSettings();
      if (!settings.notifications_enabled) return [];
      const recipients = new Map();
      if (settings.notify_requester) {
        const requester = userModel.findById(ticket.created_by_id);
        if (requester) recipients.set(requester.id, requester);
      }
      if (settings.notify_assignee && ticket.owner_id) {
        const assignee = userModel.findById(ticket.owner_id);
        if (assignee) recipients.set(assignee.id, assignee);
      }
      recipients.delete(actorId);
      return [...recipients.values()].map((recipient) => notificationModel.enqueue({
        ticketId: ticket.id,
        recipient,
        eventType,
        subject: `[TaskFlow] ${ticketReference(ticket)} ${eventType.replaceAll('_', ' ').toLowerCase()}`,
        body: `${ticketReference(ticket)} — ${ticket.title}\n\n${message}\n\nStatus: ${ticket.status}\nReadiness: ${ticket.readiness_status}`,
      }));
    },
  };
}

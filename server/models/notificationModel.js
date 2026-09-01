export function createNotificationModel(db) {
  return {
    enqueue({ ticketId, recipient, eventType, subject, body }) {
      return db.prepare(`
        INSERT INTO notification_outbox
          (ticket_id, recipient_user_id, recipient_email, event_type, subject, body)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ticketId, recipient.id, recipient.email, eventType, subject, body).lastInsertRowid;
    },
    pending(limit = 20) {
      return db.prepare("SELECT * FROM notification_outbox WHERE status = 'PENDING' ORDER BY id LIMIT ?").all(limit);
    },
    markSent(id, provider, providerMessageId = null) {
      db.prepare(`
        UPDATE notification_outbox SET status = 'SENT', attempts = attempts + 1,
          sent_at = CURRENT_TIMESTAMP, last_error = NULL, provider = ?, provider_message_id = ?
        WHERE id = ?
      `).run(provider, providerMessageId, id);
    },
    markFailed(id, message) {
      db.prepare(`
        UPDATE notification_outbox SET attempts = attempts + 1, last_error = ?,
          status = CASE WHEN attempts + 1 >= 3 THEN 'FAILED' ELSE 'PENDING' END
        WHERE id = ?
      `).run(String(message).slice(0, 500), id);
    },
    listForTicket(ticketId) {
      return db.prepare(`
        SELECT id, recipient_email, event_type, status, attempts, provider,
          provider_message_id, created_at, sent_at
        FROM notification_outbox WHERE ticket_id = ? ORDER BY id DESC
      `).all(ticketId);
    },
  };
}

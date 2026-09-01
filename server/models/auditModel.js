export function createAuditModel(db) {
  const select = `
    SELECT a.*, u.name AS actor
    FROM audit_events a LEFT JOIN users u ON u.id = a.actor_id
  `;
  return {
    record({ ticketId = null, actorId = null, actorType = 'HUMAN', source = 'WEB_API', action, details = {}, correlationId }) {
      const result = db.prepare(`
        INSERT INTO audit_events (ticket_id, actor_id, actor_type, source, action, details, correlation_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(ticketId, actorId, actorType, source, action, JSON.stringify(details), correlationId);
      return db.prepare(`${select} WHERE a.id = ?`).get(result.lastInsertRowid);
    },
    listForTicket(ticketId) {
      return db.prepare(`${select} WHERE a.ticket_id = ? ORDER BY a.created_at DESC, a.id DESC`)
        .all(ticketId).map((row) => ({ ...row, details: JSON.parse(row.details) }));
    },
  };
}

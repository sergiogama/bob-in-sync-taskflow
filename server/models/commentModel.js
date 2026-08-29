export function createCommentModel(db) {
  const select = `
    SELECT c.id, c.ticket_id, c.content, c.created_at,
      c.author_id, u.name AS author
    FROM comments c JOIN users u ON u.id = c.author_id
  `;
  return {
    listForTicket(ticketId) {
      return db.prepare(`${select} WHERE c.ticket_id = ? ORDER BY c.created_at ASC, c.id ASC`).all(ticketId);
    },
    create({ ticketId, authorId, content }) {
      const result = db.prepare('INSERT INTO comments (ticket_id, author_id, content) VALUES (?, ?, ?)')
        .run(ticketId, authorId, content);
      db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId);
      return db.prepare(`${select} WHERE c.id = ?`).get(result.lastInsertRowid);
    },
  };
}

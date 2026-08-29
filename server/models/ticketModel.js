const ticketSelect = `
  SELECT t.id, t.title, t.description, t.status,
    t.owner_id, owner.name AS owner,
    t.created_by_id, creator.name AS created_by,
    t.created_at, t.updated_at
  FROM tickets t
  LEFT JOIN users owner ON owner.id = t.owner_id
  JOIN users creator ON creator.id = t.created_by_id
`;

export function createTicketModel(db) {
  return {
    list({ search, status }) {
      const where = [];
      const params = {};
      if (status) {
        where.push('t.status = @status');
        params.status = status;
      }
      if (search) {
        where.push("(lower(t.title) LIKE @search OR lower(t.description) LIKE @search OR lower(COALESCE(owner.name, '')) LIKE @search)");
        params.search = `%${search.toLowerCase()}%`;
      }
      const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
      return db.prepare(`${ticketSelect}${clause} ORDER BY t.updated_at DESC, t.id DESC`).all(params);
    },
    findById(id) {
      return db.prepare(`${ticketSelect} WHERE t.id = ?`).get(id);
    },
    create({ title, description, status, ownerId, createdById }) {
      const result = db.prepare(`
        INSERT INTO tickets (title, description, status, owner_id, created_by_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(title, description, status, ownerId, createdById);
      return this.findById(result.lastInsertRowid);
    },
    update(id, { title, description, status, ownerId }) {
      db.prepare(`
        UPDATE tickets
        SET title = ?, description = ?, status = ?, owner_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(title, description, status, ownerId, id);
      return this.findById(id);
    },
    statusCounts() {
      const rows = db.prepare('SELECT status, COUNT(*) AS count FROM tickets GROUP BY status').all();
      return rows.reduce((result, row) => ({ ...result, [row.status]: row.count }), {});
    },
  };
}

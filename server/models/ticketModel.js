const STALE_CONDITION = `(t.status IN ('OPEN', 'IN_PROGRESS') AND t.updated_at < datetime('now', '-3 days'))`;

const ticketSelect = `
  SELECT t.id, t.title, t.description, t.status, t.category,
    t.readiness_status, t.expected_behavior, t.steps_to_reproduce, t.environment,
    t.business_rules, t.acceptance_criteria, t.reviewed_at, t.review_summary,
    t.owner_id, owner.name AS owner, owner.email AS owner_email,
    t.created_by_id, creator.name AS created_by, creator.email AS created_by_email,
    t.reviewed_by_id, reviewer.name AS reviewed_by,
    t.created_at, t.updated_at,
    CASE WHEN ${STALE_CONDITION} THEN 1 ELSE 0 END AS is_stale
  FROM tickets t
  LEFT JOIN users owner ON owner.id = t.owner_id
  JOIN users creator ON creator.id = t.created_by_id
  LEFT JOIN users reviewer ON reviewer.id = t.reviewed_by_id
`;

export function createTicketModel(db) {
  return {
    list({ search, status, category, readiness }) {
      const where = [];
      const params = {};
      if (status) {
        where.push('t.status = @status');
        params.status = status;
      }
      if (category) {
        where.push('t.category = @category');
        params.category = category;
      }
      if (readiness) {
        where.push('t.readiness_status = @readiness');
        params.readiness = readiness;
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
    create({ title, description, status, category, ownerId, createdById, expectedBehavior, stepsToReproduce, environment, businessRules, acceptanceCriteria }) {
      const result = db.prepare(`
        INSERT INTO tickets (
          title, description, status, category, owner_id, created_by_id,
          expected_behavior, steps_to_reproduce, environment, business_rules, acceptance_criteria
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, description, status, category, ownerId, createdById,
        expectedBehavior, stepsToReproduce, environment, businessRules, acceptanceCriteria);
      return this.findById(result.lastInsertRowid);
    },
    update(id, { title, description, status, category, ownerId, expectedBehavior, stepsToReproduce, environment, businessRules, acceptanceCriteria, resetReadiness }) {
      db.prepare(`
        UPDATE tickets
        SET title = ?, description = ?, status = ?, category = ?, owner_id = ?,
          expected_behavior = ?, steps_to_reproduce = ?, environment = ?, business_rules = ?,
          acceptance_criteria = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(title, description, status, category, ownerId, expectedBehavior, stepsToReproduce,
        environment, businessRules, acceptanceCriteria, id);
      if (resetReadiness) {
        db.prepare(`
          UPDATE tickets SET readiness_status = 'NEEDS_REVIEW', reviewed_by_id = NULL,
            reviewed_at = NULL, review_summary = NULL WHERE id = ?
        `).run(id);
      }
      return this.findById(id);
    },
    statusCounts() {
      const rows = db.prepare('SELECT status, COUNT(*) AS count FROM tickets GROUP BY status').all();
      return rows.reduce((result, row) => ({ ...result, [row.status]: row.count }), {});
    },
    countStale() {
      return db.prepare(`SELECT COUNT(*) AS count FROM tickets t WHERE ${STALE_CONDITION}`).get().count;
    },
    countByReadiness() {
      const rows = db.prepare('SELECT readiness_status, COUNT(*) AS count FROM tickets GROUP BY readiness_status').all();
      return rows.reduce((result, row) => ({ ...result, [row.readiness_status]: row.count }), {});
    },
  };
}

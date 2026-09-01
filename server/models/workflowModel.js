const fieldLabels = {
  expected_behavior: 'Expected behavior',
  steps_to_reproduce: 'Steps to reproduce',
  environment: 'Environment',
  business_rules: 'Business rules',
  acceptance_criteria: 'Acceptance criteria',
};

function parseSettings(row) {
  return {
    ...row,
    required_fields: JSON.parse(row.required_fields),
    notifications_enabled: Boolean(row.notifications_enabled),
    notify_requester: Boolean(row.notify_requester),
    notify_assignee: Boolean(row.notify_assignee),
  };
}

export function createWorkflowModel(db) {
  const reviewSelect = `
    SELECT r.*, u.name AS reviewer
    FROM readiness_reviews r JOIN users u ON u.id = r.reviewer_id
  `;
  return {
    getSettings() {
      return parseSettings(db.prepare('SELECT * FROM workflow_settings WHERE id = 1').get());
    },
    updateSettings(values, userId) {
      db.prepare(`
        UPDATE workflow_settings SET required_fields = ?, title_min_length = ?,
          description_min_length = ?, not_ready_comment_template = ?,
          notifications_enabled = ?, notify_requester = ?, notify_assignee = ?,
          criteria_version = criteria_version + 1, updated_by_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        JSON.stringify(values.required_fields), values.title_min_length,
        values.description_min_length, values.not_ready_comment_template,
        Number(values.notifications_enabled), Number(values.notify_requester),
        Number(values.notify_assignee), userId,
      );
      return this.getSettings();
    },
    analyze(ticket) {
      const settings = this.getSettings();
      const missing = [];
      if (ticket.title.trim().length < settings.title_min_length) missing.push(`Title must contain at least ${settings.title_min_length} characters`);
      if (ticket.description.trim().length < settings.description_min_length) missing.push(`Description must contain at least ${settings.description_min_length} characters`);
      const fields = [...new Set([
        ...(settings.required_fields.common || []),
        ...(settings.required_fields[ticket.category] || []),
      ])];
      for (const field of fields) {
        if (!ticket[field]?.trim()) missing.push(fieldLabels[field] || field);
      }
      return { settings, missing };
    },
    createReview({ ticketId, reviewerId, result, summary, missingInformation, criteriaVersion, source }) {
      const info = JSON.stringify(missingInformation);
      const insert = db.prepare(`
        INSERT INTO readiness_reviews
          (ticket_id, reviewer_id, result, summary, missing_information, criteria_version, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const update = db.prepare(`
        UPDATE tickets SET readiness_status = ?, reviewed_by_id = ?, reviewed_at = CURRENT_TIMESTAMP,
          review_summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);
      const resultRow = db.transaction(() => {
        const created = insert.run(ticketId, reviewerId, result, summary, info, criteriaVersion, source);
        update.run(result, reviewerId, summary, ticketId);
        return db.prepare(`${reviewSelect} WHERE r.id = ?`).get(created.lastInsertRowid);
      })();
      return { ...resultRow, missing_information: JSON.parse(resultRow.missing_information) };
    },
    listReviews(ticketId) {
      return db.prepare(`${reviewSelect} WHERE r.ticket_id = ? ORDER BY r.created_at DESC, r.id DESC`)
        .all(ticketId).map((row) => ({ ...row, missing_information: JSON.parse(row.missing_information) }));
    },
  };
}

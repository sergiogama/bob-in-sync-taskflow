ALTER TABLE tickets ADD COLUMN readiness_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW'
  CHECK (readiness_status IN ('NEEDS_REVIEW', 'READY', 'NOT_READY'));
ALTER TABLE tickets ADD COLUMN expected_behavior TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN steps_to_reproduce TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN environment TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN business_rules TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN acceptance_criteria TEXT NOT NULL DEFAULT '';
ALTER TABLE tickets ADD COLUMN reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN reviewed_at TEXT;
ALTER TABLE tickets ADD COLUMN review_summary TEXT;

CREATE TABLE readiness_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  result TEXT NOT NULL CHECK (result IN ('READY', 'NOT_READY')),
  summary TEXT NOT NULL,
  missing_information TEXT NOT NULL DEFAULT '[]',
  criteria_version INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'WEB_API',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('HUMAN', 'MCP', 'SYSTEM')),
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  recipient_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE TABLE workflow_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  required_fields TEXT NOT NULL,
  title_min_length INTEGER NOT NULL DEFAULT 10,
  description_min_length INTEGER NOT NULL DEFAULT 40,
  not_ready_comment_template TEXT NOT NULL,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  notify_requester INTEGER NOT NULL DEFAULT 1,
  notify_assignee INTEGER NOT NULL DEFAULT 1,
  criteria_version INTEGER NOT NULL DEFAULT 1,
  updated_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO workflow_settings (
  id, required_fields, not_ready_comment_template
) VALUES (
  1,
  '{"common":["expected_behavior","acceptance_criteria"],"SOFTWARE":["steps_to_reproduce","environment"],"HARDWARE":["environment"],"ACCESS":[],"OTHER":[]}',
  'Please add the information listed below so the request can proceed.'
);

CREATE INDEX idx_tickets_readiness ON tickets(readiness_status);
CREATE INDEX idx_readiness_reviews_ticket ON readiness_reviews(ticket_id);
CREATE INDEX idx_audit_events_ticket ON audit_events(ticket_id, created_at);
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status, created_at);

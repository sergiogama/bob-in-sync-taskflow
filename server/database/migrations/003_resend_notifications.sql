ALTER TABLE notification_outbox ADD COLUMN provider TEXT;
ALTER TABLE notification_outbox ADD COLUMN provider_message_id TEXT;

CREATE INDEX idx_notification_outbox_provider_message
ON notification_outbox(provider, provider_message_id);

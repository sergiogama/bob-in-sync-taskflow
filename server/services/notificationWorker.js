import { Resend } from 'resend';

export function createNotificationWorker(notificationModel, config, { resendClient, autoStart = true } = {}) {
  let running = false;
  const resendEnabled = config.notificationMode === 'resend';
  if (!['log', 'resend'].includes(config.notificationMode)) {
    throw new Error('NOTIFICATION_MODE must be log or resend');
  }
  if (resendEnabled && !config.resend.apiKey) {
    throw new Error('RESEND_API_KEY is required when NOTIFICATION_MODE=resend');
  }
  const resend = resendEnabled ? (resendClient || new Resend(config.resend.apiKey)) : null;

  async function processPending() {
    if (running) return;
    running = true;
    try {
      for (const item of notificationModel.pending()) {
        try {
          const recipient = config.notificationRecipientOverride || item.recipient_email;
          if (resend) {
            const { data, error } = await resend.emails.send({
              from: config.resend.from,
              to: recipient,
              subject: item.subject,
              text: item.body,
              replyTo: config.resend.replyTo,
              idempotencyKey: `taskflow-notification/${item.id}`,
              tags: [
                { name: 'application', value: 'taskflow' },
                { name: 'event_type', value: item.event_type.toLowerCase() },
              ],
            });
            if (error) throw new Error(error.message);
            notificationModel.markSent(item.id, 'RESEND', data.id);
            if (autoStart) console.log(`[TaskFlow notification] outbox ${item.id} sent through Resend as ${data.id}`);
          } else {
            console.log(`[TaskFlow notification preview] ${recipient}: ${item.subject}`);
            notificationModel.markSent(item.id, 'LOG');
          }
        } catch (error) {
          notificationModel.markFailed(item.id, error.message);
        }
      }
    } finally {
      running = false;
    }
  }

  async function tick() {
    try { await processPending(); }
    catch (error) { console.error('[TaskFlow notification worker]', error); }
  }

  const timer = autoStart ? setInterval(tick, config.notificationPollMs) : null;
  timer?.unref();
  if (autoStart) tick();
  return { stop: () => { if (timer) clearInterval(timer); }, processPending };
}

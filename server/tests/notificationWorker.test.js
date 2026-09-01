import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationWorker } from '../services/notificationWorker.js';

test('delivers an outbox item through Resend with an idempotency key', async () => {
  const sent = [];
  const marked = [];
  const notificationModel = {
    pending: () => [{
      id: 42,
      recipient_email: 'daniel.costa@taskflow.local',
      subject: '[TaskFlow] TF-0042 ready',
      body: 'The request is ready.',
      event_type: 'READINESS_READY',
    }],
    markSent: (...args) => marked.push(args),
    markFailed: () => assert.fail('Delivery should not fail'),
  };
  const resendClient = {
    emails: {
      send: async (message) => {
        sent.push(message);
        return { data: { id: 'email_123' }, error: null };
      },
    },
  };
  const worker = createNotificationWorker(notificationModel, {
    notificationMode: 'resend',
    notificationPollMs: 5000,
    notificationRecipientOverride: 'delivered@resend.dev',
    resend: { apiKey: 'test-key', from: 'TaskFlow <onboarding@resend.dev>' },
  }, { resendClient, autoStart: false });

  await worker.processPending();

  assert.equal(sent[0].to, 'delivered@resend.dev');
  assert.equal(sent[0].idempotencyKey, 'taskflow-notification/42');
  assert.deepEqual(marked, [[42, 'RESEND', 'email_123']]);
});

test('keeps a failed Resend delivery in the retry flow', async () => {
  let failure;
  const notificationModel = {
    pending: () => [{ id: 7, recipient_email: 'bounced@resend.dev', subject: 'Test', body: 'Test', event_type: 'TEST' }],
    markSent: () => assert.fail('Delivery should not be marked sent'),
    markFailed: (id, message) => { failure = { id, message }; },
  };
  const resendClient = { emails: { send: async () => ({ data: null, error: { message: 'Rejected' } }) } };
  const worker = createNotificationWorker(notificationModel, {
    notificationMode: 'resend', notificationPollMs: 5000,
    resend: { apiKey: 'test-key', from: 'TaskFlow <onboarding@resend.dev>' },
  }, { resendClient, autoStart: false });

  await worker.processPending();

  assert.deepEqual(failure, { id: 7, message: 'Rejected' });
});

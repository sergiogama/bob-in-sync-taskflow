import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  databasePath: process.env.DATABASE_PATH || path.join(rootDir, 'data', 'taskflow.db'),
  clientDistPath: path.join(rootDir, 'dist'),
  notificationMode: process.env.NOTIFICATION_MODE || 'log',
  notificationPollMs: Number(process.env.NOTIFICATION_POLL_MS || 5000),
  notificationRecipientOverride: process.env.NOTIFICATION_RECIPIENT_OVERRIDE || undefined,
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'TaskFlow <onboarding@resend.dev>',
    replyTo: process.env.RESEND_REPLY_TO || undefined,
  },
};

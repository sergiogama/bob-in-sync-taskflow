import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createDatabase } from '../database/index.js';
import { runMigrations } from '../database/migrationRunner.js';
import { seedDatabase } from '../database/seed.js';
import { createApp } from '../app.js';

let db;
let app;
let token;
let managerToken;
let developerToken;
let bobToken;

before(async () => {
  db = createDatabase(':memory:');
  seedDatabase(db);
  app = createApp(db);
  const response = await request(app).post('/api/auth/login').send({
    email: 'maria.santos@taskflow.local',
    password: 'taskflow123',
  });
  token = response.body.token;
  const managerResponse = await request(app).post('/api/auth/login').send({
    email: 'robert.chen@taskflow.local',
    password: 'taskflow123',
  });
  managerToken = managerResponse.body.token;
  const developerResponse = await request(app).post('/api/auth/login').send({
    email: 'daniel.costa@taskflow.local',
    password: 'taskflow123',
  });
  developerToken = developerResponse.body.token;
  const bobResponse = await request(app).post('/api/auth/login').send({
    email: 'ibm.bob@taskflow.local',
    password: 'taskflow123',
  });
  bobToken = bobResponse.body.token;
});

after(() => db.close());

const authenticated = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${token}`);
const asDeveloper = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${developerToken}`);
const asManager = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${managerToken}`);
const asBob = (method, path) => request(app)[method](path)
  .set('Authorization', `Bearer ${bobToken}`).set('X-TaskFlow-Source', 'IBM_BOB');

test('requires authentication for ticket data', async () => {
  const response = await request(app).get('/api/tickets');
  assert.equal(response.status, 401);
});

test('logs in and returns the current user', async () => {
  assert.ok(token);
  const response = await authenticated('get', '/api/auth/me');
  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, 'Analyst');
});

test('lists, searches, and filters tickets', async () => {
  const all = await authenticated('get', '/api/tickets');
  assert.equal(all.status, 200);
  assert.equal(all.body.tickets.length, 12);

  const filtered = await authenticated('get', '/api/tickets?status=OPEN&search=password');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.tickets.length, 1);
  assert.match(filtered.body.tickets[0].title, /reset password/i);
});

test('creates, edits, assigns, and retrieves a ticket', async () => {
  const created = await authenticated('post', '/api/tickets').send({
    title: 'Application menu not loading',
    description: 'The administration menu remains blank after sign-in.',
    status: 'OPEN',
    category: 'SOFTWARE',
    owner_id: null,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.ticket.created_by, 'Maria Santos');

  const id = created.body.ticket.id;
  const updated = await authenticated('put', `/api/tickets/${id}`).send({
    title: 'Application menu not loading',
    description: 'The administration menu remains blank after sign-in.',
    status: 'IN_PROGRESS',
    category: 'SOFTWARE',
    owner_id: 2,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.ticket.owner, 'Daniel Costa');
  assert.equal(updated.body.ticket.status, 'IN_PROGRESS');

  const detail = await authenticated('get', `/api/tickets/${id}`);
  assert.equal(detail.body.ticket.id, id);
});

test('adds a comment to a ticket', async () => {
  const response = await authenticated('post', '/api/tickets/1/comments').send({ content: 'Validated in the support environment.' });
  assert.equal(response.status, 201);
  assert.equal(response.body.comment.author, 'Maria Santos');

  const detail = await authenticated('get', '/api/tickets/1');
  assert.ok(detail.body.ticket.comments.some((comment) => comment.content === 'Validated in the support environment.'));
});

test('returns dashboard counts and users', async () => {
  const dashboard = await authenticated('get', '/api/dashboard');
  assert.equal(dashboard.status, 200);
  const { stale, readiness, ...statusCounts } = dashboard.body.counts;
  assert.equal(Object.values(statusCounts).reduce((sum, value) => sum + value, 0), 13);
  assert.equal(typeof stale, 'number');
  assert.ok(stale >= 0);
  assert.equal(Object.values(readiness).reduce((sum, value) => sum + value, 0), 13);

  const users = await authenticated('get', '/api/users');
  assert.equal(users.body.users.length, 6);
  assert.equal(users.body.users.some((user) => 'password_hash' in user), false);
});

test('tickets list includes is_stale field', async () => {
  const all = await authenticated('get', '/api/tickets');
  assert.equal(all.status, 200);
  assert.ok(all.body.tickets.every((t) => 'is_stale' in t));

  const staleTickets = all.body.tickets.filter((t) => t.is_stale === 1);
  assert.ok(staleTickets.length > 0);
  staleTickets.forEach((t) => {
    assert.ok(t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  });
});

test('validates invalid ticket status', async () => {
  const response = await authenticated('post', '/api/tickets').send({ title: 'Test', description: 'Test ticket', status: 'PENDING' });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /valid status/i);
});

test('prevents Developers from creating tickets', async () => {
  const response = await asDeveloper('post', '/api/tickets').send({
    title: 'Developer-created ticket',
    description: 'This request must be registered by an Analyst or Manager.',
    status: 'OPEN',
    category: 'OTHER',
    owner_id: 2,
  });
  assert.equal(response.status, 403);
});

test('lets a Developer claim and resolve an unassigned ticket', async () => {
  const claimed = await asDeveloper('put', '/api/tickets/2').send({
    title: 'User unable to reset password',
    description: 'Password reset email is not received by users in the Finance distribution group.',
    status: 'IN_PROGRESS',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(claimed.status, 200);
  assert.equal(claimed.body.ticket.owner, 'Daniel Costa');

  const changedClassification = await asDeveloper('put', '/api/tickets/2').send({
    title: 'Changed by Developer',
    description: 'Password reset email is not received by users in the Finance distribution group.',
    status: 'IN_PROGRESS',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(changedClassification.status, 403);

  const reassigned = await asDeveloper('put', '/api/tickets/2').send({
    title: 'User unable to reset password',
    description: 'Password reset email is not received by users in the Finance distribution group.',
    status: 'IN_PROGRESS',
    category: 'ACCESS',
    owner_id: 3,
  });
  assert.equal(reassigned.status, 403);

  const resolved = await asDeveloper('put', '/api/tickets/2').send({
    title: 'User unable to reset password',
    description: 'Password reset email is not received by users in the Finance distribution group.',
    status: 'RESOLVED',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(resolved.status, 200);
  assert.equal(resolved.body.ticket.status, 'RESOLVED');
});

test('prevents a Developer from changing another owner\'s ticket', async () => {
  const response = await asDeveloper('put', '/api/tickets/10').send({
    title: 'Vendor address changes not saved',
    description: 'Address updates appear successful but revert after the vendor page is refreshed.',
    status: 'IN_PROGRESS',
    category: 'SOFTWARE',
    owner_id: 2,
  });
  assert.equal(response.status, 403);
});

test('reserves resolution and closure transitions for Developer and Manager roles', async () => {
  const analystResolution = await authenticated('put', '/api/tickets/4').send({
    title: 'Authentication timeout in service portal',
    description: 'Several users are redirected to sign-in after five minutes of activity.',
    status: 'RESOLVED',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(analystResolution.status, 403);

  const managerClosure = await asManager('put', '/api/tickets/4').send({
    title: 'Authentication timeout in service portal',
    description: 'Several users are redirected to sign-in after five minutes of activity.',
    status: 'CLOSED',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(managerClosure.status, 200);
  assert.equal(managerClosure.body.ticket.status, 'CLOSED');

  const analystReopen = await authenticated('put', '/api/tickets/4').send({
    title: 'Authentication timeout in service portal',
    description: 'Several users are redirected to sign-in after five minutes of activity.',
    status: 'OPEN',
    category: 'ACCESS',
    owner_id: 2,
  });
  assert.equal(analystReopen.status, 403);

  const developerReopen = await asDeveloper('put', '/api/tickets/6').send({
    title: 'Update tax code reference data',
    description: 'Add the approved FY2026 tax codes to the billing application reference table.',
    status: 'IN_PROGRESS',
    category: 'OTHER',
    owner_id: 2,
  });
  assert.equal(developerReopen.status, 403);
});

test('allows authenticated Developers to comment on tickets they do not own', async () => {
  const response = await asDeveloper('post', '/api/tickets/10/comments').send({
    content: 'Shared a diagnostic observation with the assigned developer.',
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.comment.author, 'Daniel Costa');
});

test('marks an incomplete request NOT_READY and adds a concise comment', async () => {
  const response = await authenticated('post', '/api/tickets/13/readiness-review');
  assert.equal(response.status, 200);
  assert.equal(response.body.ticket.readiness_status, 'NOT_READY');
  assert.ok(response.body.review.missing_information.includes('Expected behavior'));
  assert.ok(response.body.review.missing_information.includes('Acceptance criteria'));

  const detail = await authenticated('get', '/api/tickets/13');
  const comment = detail.body.ticket.comments.find((item) => item.content.startsWith('NOT READY'));
  assert.ok(comment);
  assert.match(comment.content, /Expected behavior/);

  const retry = await authenticated('post', '/api/tickets/13/readiness-review');
  assert.equal(retry.body.unchanged, true);
  const afterRetry = await authenticated('get', '/api/tickets/13');
  assert.equal(afterRetry.body.ticket.comments.filter((item) => item.content.startsWith('NOT READY')).length, 1);
});

test('prevents a Developer from working on a ticket that is not ready', async () => {
  const response = await asDeveloper('put', '/api/tickets/13').send({
    title: 'Application menu not loading',
    description: 'The administration menu remains blank after sign-in.',
    status: 'RESOLVED',
    category: 'SOFTWARE',
    owner_id: 2,
  });
  assert.equal(response.status, 403);
  assert.match(response.body.error, /ready/i);
});

test('marks a complete request READY and records activity and notifications', async () => {
  const created = await authenticated('post', '/api/tickets').send({
    title: 'Invoice validation message is incorrect',
    description: 'The invoice import rejects a valid supplier reference and displays a generic validation message.',
    status: 'OPEN',
    category: 'SOFTWARE',
    owner_id: 2,
    expected_behavior: 'Valid supplier references must be accepted and invalid references must show the specific rule.',
    steps_to_reproduce: 'Open invoice import, upload the approved sample file, and submit validation.',
    environment: 'TaskFlow finance test environment using the supported corporate browser.',
    business_rules: 'Supplier references are validated against the active finance reference table.',
    acceptance_criteria: 'The approved sample imports successfully and invalid references identify the failed rule.',
  });
  const id = created.body.ticket.id;
  const review = await authenticated('post', `/api/tickets/${id}/readiness-review`);
  assert.equal(review.body.ticket.readiness_status, 'READY');
  assert.deepEqual(review.body.review.missing_information, []);

  const started = await asDeveloper('put', `/api/tickets/${id}`).send({
    ...created.body.ticket,
    status: 'IN_PROGRESS',
    owner_id: 2,
  });
  assert.equal(started.status, 200);

  const detail = await asManager('get', `/api/tickets/${id}`);
  assert.ok(detail.body.ticket.activity.some((event) => event.action === 'READINESS_REVIEWED'));
  assert.ok(detail.body.ticket.activity.some((event) => event.action === 'TICKET_UPDATED'));
  assert.ok(detail.body.ticket.notification_deliveries.length > 0);
});

test('records IBM Bob as an MCP actor during readiness review', async () => {
  const response = await asBob('post', '/api/tickets/7/readiness-review');
  assert.equal(response.status, 200);
  assert.equal(response.body.ticket.readiness_status, 'NOT_READY');
  const detail = await asManager('get', '/api/tickets/7');
  const event = detail.body.ticket.activity.find((item) => item.action === 'READINESS_REVIEWED');
  assert.equal(event.actor_type, 'MCP');
  assert.equal(event.source, 'IBM_BOB');
  assert.equal(event.actor, 'IBM Bob');
});

test('allows only Managers to configure readiness and notifications', async () => {
  const denied = await authenticated('get', '/api/workflow/settings');
  assert.equal(denied.status, 403);
  const current = await asManager('get', '/api/workflow/settings');
  assert.equal(current.status, 200);
  const updated = await asManager('put', '/api/workflow/settings').send({
    ...current.body.settings,
    notify_assignee: false,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.settings.notify_assignee, false);
  assert.equal(updated.body.settings.criteria_version, current.body.settings.criteria_version + 1);
});

test('does not reveal account existence or a reset token publicly', async () => {
  const forgotRes = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'maria.santos@taskflow.local' });
  const unknownRes = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody@taskflow.local' });

  assert.equal(forgotRes.status, 202);
  assert.equal(unknownRes.status, 202);
  assert.equal(forgotRes.body.message, unknownRes.body.message);
  assert.equal('reset_token' in forgotRes.body, false);
});

test('allows only a Manager to issue a reset token', async () => {
  const denied = await authenticated('post', '/api/users/1/password-reset');
  assert.equal(denied.status, 403);

  const issued = await request(app)
    .post('/api/users/1/password-reset')
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(issued.status, 201);
  assert.ok(issued.body.reset_token);
  assert.equal(issued.body.expires_in_minutes, 60);
});

test('resets the password, stores only a token hash, and revokes sessions', async () => {
  const issued = await request(app)
    .post('/api/users/1/password-reset')
    .set('Authorization', `Bearer ${managerToken}`);
  const resetToken = issued.body.reset_token;

  const stored = db.prepare('SELECT token FROM password_reset_tokens WHERE user_id = ? AND used = 0').get(1);
  assert.notEqual(stored.token, resetToken);
  assert.equal(stored.token.length, 64);

  const resetRes = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: resetToken, password: 'newpassword123' });
  assert.equal(resetRes.status, 200);
  assert.match(resetRes.body.message, /reset successfully/i);

  // verify new password works
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria.santos@taskflow.local', password: 'newpassword123' });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);

  const oldSession = await authenticated('get', '/api/auth/me');
  assert.equal(oldSession.status, 401);
});

test('rejects reset-password with invalid token', async () => {
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'invalidtoken', password: 'newpassword123' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /invalid or expired/i);
});

test('rejects reset-password with a token used twice', async () => {
  const issued = await request(app)
    .post('/api/users/2/password-reset')
    .set('Authorization', `Bearer ${managerToken}`);
  const resetToken = issued.body.reset_token;

  await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'firstpassword1' });

  const secondRes = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: resetToken, password: 'secondpassword1' });
  assert.equal(secondRes.status, 400);
  assert.match(secondRes.body.error, /invalid or expired/i);
});

test('records migrations and can run them repeatedly', () => {
  const rows = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all();
  assert.deepEqual(rows, [
    { version: 1, name: 'baseline' },
    { version: 2, name: 'ticket_workflow' },
    { version: 3, name: 'resend_notifications' },
  ]);
  assert.equal(runMigrations(db).length, 0);
});

test('adopts a legacy database without losing ticket data', () => {
  const legacy = new Database(':memory:');
  legacy.pragma('foreign_keys = ON');
  legacy.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      owner_id INTEGER REFERENCES users(id),
      created_by_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      author_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users (name, email, password_hash, role) VALUES ('Legacy User', 'legacy@taskflow.local', 'hash', 'Analyst');
    INSERT INTO tickets (title, description, created_by_id) VALUES ('Legacy ticket', 'Existing record', 1);
  `);

  runMigrations(legacy);

  const columns = legacy.prepare('PRAGMA table_info(tickets)').all().map((column) => column.name);
  assert.ok(columns.includes('category'));
  assert.equal(legacy.prepare('SELECT title, category FROM tickets WHERE id = 1').get().title, 'Legacy ticket');
  assert.equal(legacy.prepare('SELECT category FROM tickets WHERE id = 1').get().category, 'OTHER');
  assert.ok(legacy.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'password_reset_tokens'").get());
  assert.ok(legacy.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'").get());
  assert.equal(legacy.prepare('SELECT readiness_status FROM tickets WHERE id = 1').get().readiness_status, 'NEEDS_REVIEW');
  assert.ok(legacy.prepare('PRAGMA table_info(notification_outbox)').all().some((column) => column.name === 'provider_message_id'));
  legacy.close();
});

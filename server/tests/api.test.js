import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createDatabase } from '../database/index.js';
import { seedDatabase } from '../database/seed.js';
import { createApp } from '../app.js';

let db;
let app;
let token;

before(async () => {
  db = createDatabase(':memory:');
  seedDatabase(db);
  app = createApp(db);
  const response = await request(app).post('/api/auth/login').send({
    email: 'maria.santos@taskflow.local',
    password: 'taskflow123',
  });
  token = response.body.token;
});

after(() => db.close());

const authenticated = (method, path) => request(app)[method](path).set('Authorization', `Bearer ${token}`);

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
    owner_id: null,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.ticket.created_by, 'Maria Santos');

  const id = created.body.ticket.id;
  const updated = await authenticated('put', `/api/tickets/${id}`).send({
    title: 'Application menu not loading',
    description: 'The administration menu remains blank after sign-in.',
    status: 'IN_PROGRESS',
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
  assert.equal(Object.values(dashboard.body.counts).reduce((sum, value) => sum + value, 0), 13);

  const users = await authenticated('get', '/api/users');
  assert.equal(users.body.users.length, 5);
  assert.equal(users.body.users.some((user) => 'password_hash' in user), false);
});

test('validates invalid ticket status', async () => {
  const response = await authenticated('post', '/api/tickets').send({ title: 'Test', description: 'Test ticket', status: 'PENDING' });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /valid status/i);
});

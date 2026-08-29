import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { createUserModel } from './models/userModel.js';
import { createTicketModel } from './models/ticketModel.js';
import { createCommentModel } from './models/commentModel.js';
import { createAuthService } from './services/authService.js';
import { createTicketService } from './services/ticketService.js';
import { requireAuth } from './middleware/auth.js';
import { createAuthController } from './controllers/authController.js';
import { createTicketController } from './controllers/ticketController.js';
import { authRoutes } from './routes/authRoutes.js';
import { ticketRoutes } from './routes/ticketRoutes.js';

export function createApp(db, { serveClient = false } = {}) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const userModel = createUserModel(db);
  const ticketModel = createTicketModel(db);
  const commentModel = createCommentModel(db);
  const authService = createAuthService(userModel);
  const ticketService = createTicketService(ticketModel, commentModel, userModel);
  const authMiddleware = requireAuth(authService);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes(createAuthController(authService), authMiddleware));
  app.use('/api/tickets', authMiddleware, ticketRoutes(createTicketController(ticketService)));
  app.get('/api/dashboard', authMiddleware, (req, res) => res.json({ counts: ticketService.counts() }));
  app.get('/api/users', authMiddleware, (req, res) => res.json({ users: userModel.list() }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (!error.status || error.status >= 500) console.error(error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Unexpected server error.' });
  });

  if (serveClient && fs.existsSync(config.clientDistPath)) {
    app.use(express.static(config.clientDistPath));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(config.clientDistPath, 'index.html')));
  }
  return app;
}

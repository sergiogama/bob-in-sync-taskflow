import { Router } from 'express';

export function authRoutes(controller, authMiddleware) {
  const router = Router();
  router.post('/login', controller.login);
  router.get('/me', authMiddleware, controller.me);
  router.post('/logout', authMiddleware, controller.logout);
  return router;
}

import { Router } from 'express';

export function authRoutes(controller, authMiddleware) {
  const router = Router();
  router.post('/login', controller.login);
  router.get('/me', authMiddleware, controller.me);
  router.post('/logout', authMiddleware, controller.logout);
  router.post('/forgot-password', controller.forgotPassword);
  router.post('/reset-password', controller.resetPassword);
  return router;
}

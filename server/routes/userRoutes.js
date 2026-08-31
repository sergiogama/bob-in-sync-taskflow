import { Router } from 'express';

export function userRoutes(controller, managerOnly) {
  const router = Router();
  router.get('/', controller.list);
  router.post('/:id/password-reset', managerOnly, controller.issuePasswordReset);
  return router;
}

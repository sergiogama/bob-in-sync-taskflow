import { Router } from 'express';

export function workflowRoutes(controller, managerOnly) {
  const router = Router();
  router.get('/settings', managerOnly, controller.getSettings);
  router.put('/settings', managerOnly, controller.updateSettings);
  return router;
}

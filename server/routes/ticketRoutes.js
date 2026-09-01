import { Router } from 'express';

export function ticketRoutes(controller, canCreate, reviewReadiness) {
  const router = Router();
  router.get('/', controller.list);
  router.post('/', canCreate, controller.create);
  router.get('/:id', controller.get);
  router.put('/:id', controller.update);
  router.post('/:id/comments', controller.addComment);
  router.post('/:id/readiness-review', reviewReadiness);
  return router;
}

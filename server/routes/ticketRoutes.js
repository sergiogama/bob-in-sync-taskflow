import { Router } from 'express';

export function ticketRoutes(controller, canCreate) {
  const router = Router();
  router.get('/', controller.list);
  router.post('/', canCreate, controller.create);
  router.get('/:id', controller.get);
  router.put('/:id', controller.update);
  router.post('/:id/comments', controller.addComment);
  return router;
}

import { activityContext } from '../middleware/requestContext.js';

export function createTicketController(ticketService) {
  return {
    list(req, res) { res.json({ tickets: ticketService.list(req.query) }); },
    get(req, res) { res.json({ ticket: ticketService.get(Number(req.params.id), req.user) }); },
    create(req, res) { res.status(201).json({ ticket: ticketService.create(req.body, req.user, activityContext(req)) }); },
    update(req, res) { res.json({ ticket: ticketService.update(Number(req.params.id), req.body, req.user, activityContext(req)) }); },
    addComment(req, res) {
      res.status(201).json({ comment: ticketService.addComment(Number(req.params.id), req.body?.content, req.user, activityContext(req)) });
    },
    dashboard(req, res) { res.json({ counts: ticketService.counts() }); },
  };
}

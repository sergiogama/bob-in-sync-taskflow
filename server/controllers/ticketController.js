export function createTicketController(ticketService) {
  return {
    list(req, res) { res.json({ tickets: ticketService.list(req.query) }); },
    get(req, res) { res.json({ ticket: ticketService.get(Number(req.params.id)) }); },
    create(req, res) { res.status(201).json({ ticket: ticketService.create(req.body, req.user.id) }); },
    update(req, res) { res.json({ ticket: ticketService.update(Number(req.params.id), req.body) }); },
    addComment(req, res) {
      res.status(201).json({ comment: ticketService.addComment(Number(req.params.id), req.body?.content, req.user.id) });
    },
    dashboard(req, res) { res.json({ counts: ticketService.counts() }); },
  };
}

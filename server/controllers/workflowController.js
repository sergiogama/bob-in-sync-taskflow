import { activityContext } from '../middleware/requestContext.js';

export function createWorkflowController(workflowService) {
  return {
    getSettings(req, res) {
      res.json({ settings: workflowService.getSettings() });
    },
    updateSettings(req, res) {
      res.json({ settings: workflowService.updateSettings(req.body, req.user, activityContext(req)) });
    },
    review(req, res) {
      res.json(workflowService.review(Number(req.params.id), req.user, activityContext(req)));
    },
  };
}

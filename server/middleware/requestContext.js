import { randomUUID } from 'node:crypto';

export function requestContext(req, res, next) {
  req.correlationId = req.get('X-Correlation-Id')?.slice(0, 100) || randomUUID();
  res.set('X-Correlation-Id', req.correlationId);
  next();
}

export function activityContext(req) {
  const fromBob = req.get('X-TaskFlow-Source') === 'IBM_BOB' &&
    req.user?.email === 'ibm.bob@taskflow.local';
  return {
    source: fromBob ? 'IBM_BOB' : 'WEB_API',
    actorType: fromBob ? 'MCP' : 'HUMAN',
    correlationId: req.correlationId,
  };
}

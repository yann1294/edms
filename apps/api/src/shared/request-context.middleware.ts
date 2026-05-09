import { Request, Response, NextFunction } from 'express';

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  (req as any).context ??= {};
  const orgHeader =
    (req.headers['x-organization-id'] as string | undefined) ??
    (req.headers['x-org-id'] as string | undefined);
  if (orgHeader && typeof orgHeader === 'string') {
    (req as any).context.organizationId = orgHeader.trim();
  }
  next();
}

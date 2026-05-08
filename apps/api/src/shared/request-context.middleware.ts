import { Request, Response, NextFunction } from 'express';

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  (req as any).context ??= {};
  next();
}


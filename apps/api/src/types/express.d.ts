import { RequestContext } from '../shared/request-context';

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export {};


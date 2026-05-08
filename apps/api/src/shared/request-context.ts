import { CurrentUser } from './current-user';

export type RequestContext = {
  user?: CurrentUser;
};

export type RequestWithContext = {
  headers: Record<string, string | undefined>;
  context: RequestContext;
};

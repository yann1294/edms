export type RequestContextUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status?: string;
};

export type RequestContext = {
  user?: RequestContextUser;
};

export type RequestWithContext = {
  headers?: Record<string, string | undefined>;
  context?: RequestContext;
};

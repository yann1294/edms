export type CurrentUserStatus = 'active' | 'invited';

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: CurrentUserStatus;
};


export interface AuthenticatedUser {
  email: string;
  id: string;
}

export interface AuthenticatedRequest {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
}

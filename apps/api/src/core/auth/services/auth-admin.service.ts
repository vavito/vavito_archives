export abstract class AuthAdminService {
  abstract deleteUser(userId: string): Promise<void>;
}

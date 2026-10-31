import { Role } from '../rbac/role.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
}

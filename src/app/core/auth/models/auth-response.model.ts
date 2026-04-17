import { Role } from './role.model';

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  roles: Role[];
  profile: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  fullName: string;
}
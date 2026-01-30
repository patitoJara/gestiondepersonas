// src/app/models/session-user.model.ts
export interface SessionUser {
  id: number;
  firstName: string;
  secondName: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  email: string;
  username: string;
  program: string | null;
}

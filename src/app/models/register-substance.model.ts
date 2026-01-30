// src/app/models/register-substance.model.ts
import { Register } from './register';
import { Substance } from './substance';

export interface RegisterSubstance {
  id?: number;

  register: Partial<Register>;
  substance: Partial<Substance>;

  level: { id: number; name?: string };

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

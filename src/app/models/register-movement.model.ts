// src/app/models/register-movement.model.ts
import { Register } from './register';
import { Profession } from './profession';

export interface RegisterMovement {
  id?: number;

  register: Partial<Register>;
  profession: Partial<Profession>;

  full_name?: string;
  date_attention?: string;   // yyyy-MM-dd
  hour_attention?: string;   // HH:mm
  state?: string;            // 👈 FIX CLAVE

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

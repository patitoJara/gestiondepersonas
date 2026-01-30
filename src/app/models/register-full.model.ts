// src/app/models/register-full.model.ts
import { Register } from './register';
import { RegisterSubstance } from './register-substance.model';
import { RegisterMovement } from './register-movement.model';

export interface RegisterFull {
  registro: Register & { contactoPrincipal: any | null };
  sustancias: RegisterSubstance[];
  movimientos: RegisterMovement[];
}
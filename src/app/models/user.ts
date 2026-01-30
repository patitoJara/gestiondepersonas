import { Role } from './role';
import { Program } from './program';

export interface User {
  id: number | null;
  firstName: string;
  secondName: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  email: string;
  username: string;
  password?: string;
  rut: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  programs?: Program[]; // el backend puede devolver o esperar programas asociados

  /** 👇 Agrega esta línea */
  roles?: Role[]; // el backend puede devolver o esperar roles asociados
}

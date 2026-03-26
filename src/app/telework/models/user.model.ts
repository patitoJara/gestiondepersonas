export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;

  firstName: string;
  secondName?: string;

  firstLastName: string;
  secondLastName?: string;

  email: string;
  username: string;

  rut: string;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;

  roles?: Role[]; // 🔥 AQUÍ ESTÁ LA MAGIA
}
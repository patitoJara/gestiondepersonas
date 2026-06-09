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

  full_name?: string;

  email: string;
  username: string;

  rut: string;

  birth_date?: string | null;
  contract_date?: string | null;
  contract_type?: string | null;

  password?: string | null;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  roles?: Role[];
}
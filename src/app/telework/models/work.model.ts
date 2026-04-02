export interface Work {
  id: number;
  description: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  user?: {
    id: number;
    firstName: string;
    secondName?: string;
    firstLastName: string;
    secondLastName?: string;
    email: string;
    username: string;
    rut: string;
  };

  subscribe?: {
    id: number;
    begin: string;
    end: string;
    active: boolean;
  };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
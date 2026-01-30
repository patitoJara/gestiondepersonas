//  C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\models\postulant.ts


export interface Postulant {
  id?: number;

  user?: {
    id: number;
    firstName?: string;
    secondName?: string;
    firstLastName?: string;
    secondLastName?: string;
    email?: string;
    username?: string;
    password?: string;
    rut?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };

  commune?: {
    id: number;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };

  sex?: {
    id: number;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };

  convPrev?: {
    id: number;
    name?: string;
    intPrev: {
      id: number;
      name?: string;
      createdAt?: string;
      updatedAt?: string;
      deletedAt?: string | null;
    };
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  };

  firstName?: string;
  lastName?: string;
  firstLastName?: string;
  secondLastName?: string;
  rut?: string;
  birthdate?: string | null;
  email?: string;
  phone?: string;
  address?: string;


  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

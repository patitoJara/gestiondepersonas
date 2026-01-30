export interface Demand {
  id?: number;
  postulant: {
    id?: number;
    user: {
      id?: number;
      firstName: string;
      secondName?: string;
      firstLastName: string;
      secondLastName?: string;
      email: string;
      username: string;
      password?: string;
      rut: string;
      createdAt?: string;
      updatedAt?: string;
      deletedAt?: string | null;
    };
    commune: {
      id: number;
      name: string;
    };
    sex: {
      id: number;
      name: string;
    };
    firstName: string;
    firstLastName: string;
    secondLastName?: string;
    rut: string;
    birthdate: string;
    email: string;
    phone: string;
    address: string;
  };
  contactType: { id: number; name: string };
  sender: { id: number; name: string };
  diverter: { id: number; name: string };
  program: { id: number; name: string };
  user: { id: number; firstName: string; firstLastName: string; email: string };
  notRelevant?: { id: number; name: string };
  date_attention: string;
  description: string;
  state: string;
  is_history: string;
}

// models registers
// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\models\register.ts

export class Register {
  id!: number;

  // Relaciones (referencias ligeras)
  postulant!: { id: number };
  contact?: { id: number };

  contactType!: { id: number };
  sender!: { id: number };
  diverter!: { id: number };
  program!: { id: number };
  user!: { id: number };
  notRelevant!: { id: number };
  result!: { id: number };
  state!: { id: number };

  // Datos propios del evento
  number_tto!: string;
  date_attention!: string;
  description!: string;
  is_history!: string;

  createdAt!: string;
  updatedAt!: string;
  deletedAt!: string | null;
  
}
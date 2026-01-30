// src/app/models/conv-prev.ts

import { IntPrev } from './int-prev';

export interface ConvPrev {
  id: number;
  name: string;
  intPrev?: {
    id: number;
    name?: string; // 👈 opcional
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

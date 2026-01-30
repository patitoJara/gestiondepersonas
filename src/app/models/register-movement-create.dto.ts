// src/app/dto/register-movement-create.dto.ts
export interface RegisterMovementCreateDto {
  register: { id: number };
  profession: { id: number };

  full_name: string;
  date_attention: string; // yyyy-MM-dd
  hour_attention: string; // HH:mm
  state: string;          // AGENDADO, etc.
}
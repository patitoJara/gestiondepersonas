export interface Register {
  id?: number;
  userId: number;
  state: 'ING' | 'SAL';
  registerDatetime?: string;
}
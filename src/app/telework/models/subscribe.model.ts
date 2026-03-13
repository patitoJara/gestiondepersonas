export interface Subscribe {
  id: number;
  begin: string;
  end: string;
  userId: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string | null; 
}
export interface Group {
  id?: number;

  user: {
    id: number;
  };

  name: string;
  description?: string;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CreateGroupDto {
  user: {
    id: number;
  };
  name: string;
  description?: string;
}
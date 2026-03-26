export interface UsersGroup {
  id?: number;

  user: {
    id: number;
  };

  group: {
    id: number;
  };

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CreateUsersGroupDto {
  user: {
    id: number;
  };
  group: {
    id: number;
  };
}
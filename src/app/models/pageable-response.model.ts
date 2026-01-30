// src/app/models/pageable-response.model.ts
// =======================================================
// 🌐 MODELO GENÉRICO PARA RESPUESTAS PAGINADAS DEL BACKEND
// =======================================================
// Este modelo sirve para cualquier endpoint que devuelva:
// {
//   content: [...],
//   pageable: {...},
//   totalElements: number,
//   totalPages: number,
//   size: number,
//   number: number,
//   first: boolean,
//   last: boolean
// }
//
// Puedes usarlo como:
//   Observable<PageableResponse<RegisterSubstance>>
//   Observable<PageableResponse<RegisterMovement>>
//   Observable<PageableResponse<User>>   etc.
//
// =======================================================

// src/app/models/pageable-response.model.ts

export interface Pageable {
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PageableResponse<T> {
  content: T[];               // los datos reales
  pageable: Pageable;         // info de paginación
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;             // número de página
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { TypeHousing } from '../models/type-housing.model';

@Injectable({
  providedIn: 'root',
})
export class TypeHousingService {
  private apiUrl = `${environment.apiUrl}/types_housings`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TypeHousing[]> {
    return this.http.get<TypeHousing[]>(this.apiUrl);
  }

  getAllFull(): Observable<TypeHousing[]> {
    return this.http.get<TypeHousing[]>(`${this.apiUrl}/all`);
  }

  getPaginated(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAllPaginated`, { params });
  }

  getDeleted(): Observable<TypeHousing[]> {
    return this.http.get<TypeHousing[]>(`${this.apiUrl}/deleted`);
  }

  getById(id: number): Observable<TypeHousing> {
    return this.http.get<TypeHousing>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<TypeHousing>): Observable<TypeHousing> {
    return this.http.post<TypeHousing>(this.apiUrl, data);
  }

  update(id: number, data: Partial<TypeHousing>): Observable<TypeHousing> {
    return this.http.put<TypeHousing>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }
}
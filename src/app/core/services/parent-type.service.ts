import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ParentType } from '../models/parent-type.model';

@Injectable({
  providedIn: 'root',
})
export class ParentTypeService {
  private apiUrl = `${environment.apiUrl}/parents_types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ParentType[]> {
    return this.http.get<ParentType[]>(this.apiUrl);
  }

  getAllFull(): Observable<ParentType[]> {
    return this.http.get<ParentType[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<ParentType> {
    return this.http.get<ParentType>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ParentType>): Observable<ParentType> {
    return this.http.post<ParentType>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ParentType>): Observable<ParentType> {
    return this.http.put<ParentType>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<ParentType[]> {
    return this.http.get<ParentType[]>(`${this.apiUrl}/deleted`);
  }
}
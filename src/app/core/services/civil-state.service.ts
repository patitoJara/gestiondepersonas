import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { CivilState } from '../models/civil-state.model';

@Injectable({
  providedIn: 'root',
})
export class CivilStateService {
  private apiUrl = `${environment.apiUrl}/civil_states`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CivilState[]> {
    return this.http.get<CivilState[]>(this.apiUrl);
  }

  getAllFull(): Observable<CivilState[]> {
    return this.http.get<CivilState[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<CivilState> {
    return this.http.get<CivilState>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<CivilState>): Observable<CivilState> {
    return this.http.post<CivilState>(this.apiUrl, data);
  }

  update(id: number, data: Partial<CivilState>): Observable<CivilState> {
    return this.http.put<CivilState>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<CivilState[]> {
    return this.http.get<CivilState[]>(`${this.apiUrl}/deleted`);
  }
}
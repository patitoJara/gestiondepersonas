import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Stablishment } from '../models/stablishment.model';

@Injectable({
  providedIn: 'root',
})
export class StablishmentService {
  private apiUrl = `${environment.apiUrl}/stablishments`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Stablishment[]> {
    return this.http.get<Stablishment[]>(this.apiUrl);
  }

  getAllFull(): Observable<Stablishment[]> {
    return this.http.get<Stablishment[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Stablishment> {
    return this.http.get<Stablishment>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Stablishment>): Observable<Stablishment> {
    return this.http.post<Stablishment>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Stablishment>): Observable<Stablishment> {
    return this.http.put<Stablishment>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<Stablishment[]> {
    return this.http.get<Stablishment[]>(`${this.apiUrl}/deleted`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Prevition } from '../models/prevition.model';

@Injectable({
  providedIn: 'root',
})
export class PrevitionService {
  private apiUrl = `${environment.apiUrl}/previtions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Prevition[]> {
    return this.http.get<Prevition[]>(this.apiUrl);
  }

  getAllFull(): Observable<Prevition[]> {
    return this.http.get<Prevition[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Prevition> {
    return this.http.get<Prevition>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Prevition>): Observable<Prevition> {
    return this.http.post<Prevition>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Prevition>): Observable<Prevition> {
    return this.http.put<Prevition>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<Prevition[]> {
    return this.http.get<Prevition[]>(`${this.apiUrl}/deleted`);
  }
}
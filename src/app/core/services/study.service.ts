import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Study } from '../models/study.model';

@Injectable({
  providedIn: 'root',
})
export class StudyService {
  private apiUrl = `${environment.apiUrl}/studies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Study[]> {
    return this.http.get<Study[]>(this.apiUrl);
  }

  getAllFull(): Observable<Study[]> {
    return this.http.get<Study[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Study> {
    return this.http.get<Study>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Study>): Observable<Study> {
    return this.http.post<Study>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Study>): Observable<Study> {
    return this.http.put<Study>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<Study[]> {
    return this.http.get<Study[]>(`${this.apiUrl}/deleted`);
  }
}
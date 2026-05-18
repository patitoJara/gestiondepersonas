import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grade } from '../models/grade.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  private apiUrl = `${environment.apiUrl}/grades`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}`);
  }

  getAllActive(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}/all`);
  }

  getDeleted(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.apiUrl}/deleted`);
  }

  getById(id: number): Observable<Grade> {
    return this.http.get<Grade>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Grade>): Observable<Grade> {
    return this.http.post<Grade>(`${this.apiUrl}`, data);
  }

  update(id: number, data: Partial<Grade>): Observable<Grade> {
    return this.http.put<Grade>(`${this.apiUrl}/${id}`, data);
  }
 
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/restore`, {});
  }
}

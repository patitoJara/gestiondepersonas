import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { WorkPlace } from '../models/work-place.model';

@Injectable({
  providedIn: 'root',
})
export class WorkPlaceService {

  private apiUrl = `${environment.apiUrl}/works_places`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<WorkPlace[]> {
    return this.http.get<WorkPlace[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<WorkPlace> {
    return this.http.get<WorkPlace>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }
}
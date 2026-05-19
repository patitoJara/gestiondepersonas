import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private apiUrl = `${environment.apiUrl}/activities`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.apiUrl);
  }

  getAllFull(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Activity>): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/deleted`);
  }
}
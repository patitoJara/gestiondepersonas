import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { BillType } from '../models/bill-type.model';

@Injectable({
  providedIn: 'root',
})
export class BillTypeService {
  private apiUrl = `${environment.apiUrl}/bills_types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BillType[]> {
    return this.http.get<BillType[]>(this.apiUrl);
  }

  getAllFull(): Observable<BillType[]> {
    return this.http.get<BillType[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<BillType> {
    return this.http.get<BillType>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<BillType>): Observable<BillType> {
    return this.http.post<BillType>(this.apiUrl, data);
  }

  update(id: number, data: Partial<BillType>): Observable<BillType> {
    return this.http.put<BillType>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<BillType[]> {
    return this.http.get<BillType[]>(`${this.apiUrl}/deleted`);
  }
}
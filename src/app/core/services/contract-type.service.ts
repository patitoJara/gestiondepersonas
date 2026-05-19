import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { ContractType } from '../models/contract-type.model';

@Injectable({
  providedIn: 'root',
})
export class ContractTypeService {
  private apiUrl = `${environment.apiUrl}/contracts_types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(this.apiUrl);
  }

  getAllFull(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(`${this.apiUrl}/all`);
  }

  getById(id: number): Observable<ContractType> {
    return this.http.get<ContractType>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ContractType>): Observable<ContractType> {
    return this.http.post<ContractType>(this.apiUrl, data);
  }

  update(id: number, data: Partial<ContractType>): Observable<ContractType> {
    return this.http.put<ContractType>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restore(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }

  getDeleted(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(`${this.apiUrl}/deleted`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscribesService {

  private api = `${environment.apiUrl}/subscribes`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<any[]>(this.api);
  }

  // 🔎 BUSCAR POR ID (no se elimina)
  getById(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  // 🔎 NUEVA CONSULTA POR USUARIO
  getByUser(userId: number) {
    return this.http.get<any[]>(`${this.api}/user/${userId}`);
  }

  create(data: any) {
    return this.http.post(this.api, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegistersService {
  private api = `${environment.apiUrl}/registers`;

  constructor(private http: HttpClient) {}

  getAllPaginated(page: number, size: number) {
    return this.http.get(
      `${this.api}/getAllPaginated?page=${page}&size=${size}`,
    );
  }

  getById(id: number) {
    return this.http.get(`${this.api}/${id}`);
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

  restore(id: number) {
    return this.http.post(`${this.api}/${id}/restore`, {});
  }

  getAll() {
    return this.http.get<any[]>(`${this.api}/all`);
  }

  // 👤 Usuario logueado (si aún lo usas)
  getMyRegisters() {
    return this.http.get<any[]>(`${this.api}/user`);
  }

  // 🧑‍💼 Admin - por usuario específico 🔥
  getRegistersByUser(userId: number) {
    return this.http.get<any[]>(`${this.api}/user`, {
      params: { userId },
    });
  }
}

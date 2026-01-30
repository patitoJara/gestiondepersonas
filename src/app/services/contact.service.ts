import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Contact } from '../models/contact';
import { Observable } from 'rxjs';
import { ContactCreateDto } from '../models/contact-create.dto';


@Injectable({
  providedIn: 'root',
})
export class ContactService {

  private http = inject(HttpClient);

  // Deriva las URLs desde tu BaseUrl (sin barra final)
  private readonly resourceUrl = `${environment.apiBaseUrl}/contacts`;

  /** ============================
   *   🔹 GET: Obtener todos (no paginado)
   * ============================ */
  getAll() {
    return this.http.get<Contact[]>(`${this.resourceUrl}`);
  }

  /** ============================
   *   🔹 GET: Obtener TODOS sin filtros (ALL)
   * ============================ */
  getAllRaw() {
    return this.http.get<Contact[]>(`${this.resourceUrl}/all`);
  }

  /** ============================
   *   🔹 GET: Eliminados (soft delete)
   * ============================ */
  getDeleted() {
    return this.http.get<Contact[]>(`${this.resourceUrl}/deleted`);
  }

  /** ============================
   *   🔹 GET: Obtener por ID
   * ============================ */
  getById(id: number) {
    return this.http.get<Contact>(`${this.resourceUrl}/${id}`);
  }

  /** ============================
   *   🔹 GET: Paginado
   * ============================ */
  getAllPaginated(page: number, size: number) {
    return this.http.get<any>(`${this.resourceUrl}/getAllPaginated`, {
      params: { page, size },
    });
  }

  createDto(data: ContactCreateDto): Observable<Contact> {
    return this.http.post<Contact>(`${this.resourceUrl}`, data);
  }  

  /** ============================
   *   🔹 PUT: Actualizar Contact
   * ============================ */
  update(id: number, data: Partial<Contact>) {
    return this.http.put<Contact>(`${this.resourceUrl}/${id}`, data);
  }

  /** ============================
   *   🔹 DELETE: Soft Delete Contact
   * ============================ */
  delete(id: number) {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }

  /** ============================
   *   🔹 RESTORE: Restaurar Contact
   * ============================ */
  restore(id: number) {
    return this.http.post(`${this.resourceUrl}/${id}/restore`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RegisterReview } from '@app/modules/gestion-personas/teletrabajo/models/register-review.model';


@Injectable({
  providedIn: 'root',
})
export class RegisterReviewService {
  private http = inject(HttpClient);

  // =========================================================
  // API
  // =========================================================
  private apiUrl = `${environment.apiUrl}/registers_modifieds`;

  // =========================================================
  // GET ALL
  // =========================================================
  getAll(): Observable<RegisterReview[]> {
    return this.http.get<RegisterReview[]>(this.apiUrl);
  }

  // =========================================================
  // GET ALL (INCLUDING DELETED)
  // =========================================================
  getAllComplete(): Observable<RegisterReview[]> {
    return this.http.get<RegisterReview[]>(
      `${this.apiUrl}/all`,
    );
  }

  // =========================================================
  // GET DELETED
  // =========================================================
  getDeleted(): Observable<RegisterReview[]> {
    return this.http.get<RegisterReview[]>(
      `${this.apiUrl}/deleted`,
    );
  }

  // =========================================================
  // GET BY ID
  // =========================================================
  getById(id: number): Observable<RegisterReview> {
    return this.http.get<RegisterReview>(
      `${this.apiUrl}/${id}`,
    );
  }

  // =========================================================
  // CREATE
  // =========================================================
  create(
    payload: Partial<RegisterReview>,
  ): Observable<RegisterReview> {
    return this.http.post<RegisterReview>(
      this.apiUrl,
      payload,
    );
  }

  // =========================================================
  // UPDATE
  // =========================================================
  update(
    id: number,
    payload: Partial<RegisterReview>,
  ): Observable<RegisterReview> {
    return this.http.put<RegisterReview>(
      `${this.apiUrl}/${id}`,
      payload,
    );
  }

  // =========================================================
  // DELETE
  // =========================================================
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // =========================================================
  // RESTORE
  // =========================================================
  restore(id: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/restore`,
      {},
    );
  }

  // =========================================================
  // PAGINATED
  // =========================================================
  getPaginated(
    page: number = 0,
    size: number = 10,
  ): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/getAllPaginated?page=${page}&size=${size}`,
    );
  }
}
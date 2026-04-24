import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  Work,
  PageResponse,
} from '@app/modules/gestion-personas/teletrabajo/models/work.model';

type WorkPayload = {
  description: string;
  user: { id: number };
  subscribe?: {
    id: number;
    active: boolean;
  } | null;
};

// 🔥 ESTE FALTABA
type WorkUpdatePayload = {
  description: string;
};

@Injectable({
  providedIn: 'root',
})
export class WorkService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private endpoint = `${this.apiUrl}/works`;

  getByUserId(userId: number): Observable<Work[]> {
    return this.http
      .get<any>(`${this.endpoint}/user`, {
        params: { userId },
      })
      .pipe(
        map((res) => {
          if (Array.isArray(res)) return res;
          return res?.content ?? [];
        }),
      );
  }

  create(payload: WorkPayload) {
    return this.http.post<Work>(this.endpoint, payload);
  }

  update(id: number, payload: WorkPayload) {
    return this.http.put<Work>(`${this.endpoint}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  getAll(): Observable<Work[]> {
    return this.http.get<any>(this.endpoint).pipe(
      map((res) => {
        if (Array.isArray(res)) return res; // 👈 TU CASO REAL
        return res?.content ?? res?.data ?? [];
      }),
    );
  }
}

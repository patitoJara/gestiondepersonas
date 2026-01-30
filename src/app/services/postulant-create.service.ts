// src/app/services/postulant-create.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Postulant } from '@app/models/postulant';
import { PostulantCreateDto } from '@app/models/postulant-create.dto';

@Injectable({
  providedIn: 'root',
})
export class PostulantCreateService {
  private http = inject(HttpClient);

  private readonly resourceUrl = `${environment.apiBaseUrl}/postulants`;

  create(dto: PostulantCreateDto): Observable<Postulant> {
    return this.http.post<Postulant>(this.resourceUrl, dto);
  }
}

// C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\services\substance-Create-Dto.service.ts


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RegisterSubstance } from '../models/register-substance.model';
import { RegisterSubstanceCreateDto } from '../models/register-substance-create.dto';

@Injectable({ providedIn: 'root' })


export class RegisterSubstanceServiceDto {

  private http = inject(HttpClient);

  private readonly resourceUrl =
    `${environment.apiBaseUrl}/registers_substances`;

  create(data: RegisterSubstanceCreateDto): Observable<RegisterSubstance> {
    return this.http.post<RegisterSubstance>(this.resourceUrl, data);
  }
}



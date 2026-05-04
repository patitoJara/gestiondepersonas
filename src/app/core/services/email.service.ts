import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = 'https://teletrabajo.dssm.cl/api/v1/users';

  constructor(private http: HttpClient) {}

  recoverPassword(email: string) {
    return this.http.post(
      `${this.api}/recover-password`,
      { email },
      { responseType: 'text' }, // 🔥 ESTA ES LA CLAVE
    );
  }
}

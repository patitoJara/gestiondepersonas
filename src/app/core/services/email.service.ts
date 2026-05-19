import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private api = 'https://teletrabajo.dssm.cl/api/v1/users';

  private notificationApi = 'https://teletrabajo.dssm.cl/api/v1/notifications';

  constructor(private http: HttpClient) {}

  // =====================================
  // 🔥 RECOVER PASSWORD
  // =====================================

  recoverPassword(email: string) {
    return this.http.post(
      `${this.api}/recover-password`,
      { email },
      {
        responseType: 'text',
      },
    );
  }

  // =====================================
  // 🔥 SEND SIMPLE EMAIL
  // =====================================

  /*
  sendEmail(payload: {
    to: string;
    subject: string;
    message: string;
    cc?: string;
  }) {
    return this.http.post(`${this.notificationApi}/send-email`, payload, {
      responseType: 'text',
    });
  }
  */
 
  sendEmail(payload: {
    to: string;
    subject: string;
    message: string;
  }) {
    return this.http.post(
      `${this.notificationApi}/send-email`,
      payload,
      {
        responseType: 'text',
      },
    );
  }

}
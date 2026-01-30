import { Injectable } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private serviceId = 'service_f56t47b';
  private templateId = 'template_ajgvyt8';
  private publicKey = 'rHZGN1qKPFPSLn8tc';

  /**
   * Envía un correo dinámico usando EmailJS
   * @param toEmail Correo principal del destinatario
   * @param ccEmail Correo en copia (opcional)
   * @param subject Asunto o título del correo
   * @param body Texto o mensaje principal
   */
  sendEmail(
    toEmail: string,
    ccEmail?: string,
    subject: string = 'Mensaje desde el sistema RDA-SM',
    body: string = ''
  ): Promise<EmailJSResponseStatus> {
    const templateParams = {
      email: toEmail,      // {{email}}
      cc_email: ccEmail || '', // {{cc_email}}
      name: 'Sistema RDA-SM',  // {{name}}
      title: subject,          // {{title}}
      message: body,           // {{message}} — puedes usarlo en la plantilla
    };

    console.log('[EmailService] 📤 Enviando correo con:', templateParams);

    return emailjs.send(this.serviceId, this.templateId, templateParams, this.publicKey);
  }

  /**
   * Envío específico para recuperación de contraseña
   */
  sendRecoveryEmail(userEmail: string): Promise<EmailJSResponseStatus> {
    const subject = 'Recuperar acceso RDA-SM';
    const body = `
Estimado equipo TIC,

El usuario ${userEmail} ha solicitado recuperar el acceso al sistema RDA-SM.

Por favor, verifiquen sus credenciales y gestionen el restablecimiento correspondiente.

Este correo fue enviado automáticamente por el formulario "Recuperar contraseña" del sistema.

Atentamente,
Sistema RDA-SM
Servicio de Salud Magallanes
    `;

    return this.sendEmail('patricio.jara@redsalud.gob.cl', userEmail, subject, body);
  }
}

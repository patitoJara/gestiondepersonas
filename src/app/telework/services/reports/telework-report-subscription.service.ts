import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root',
})
export class TeleworkReportPrintSubscriptionService {
  printPdf(html: string): void {
    const element = document.createElement('div');

    element.innerHTML = html;

    const opt = {
      margin: [8, 24, 10, 6] as [number, number, number, number],
      filename: 'reporte-suscripciones.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'legal', orientation: 'portrait' },
    };

    (html2pdf() as any)
      .set(opt)
      .from(element)
      .outputPdf('bloburl')
      .then((url: string) => {
        window.open(url);
      });
  }

  generateReportSubscriptions(payload: {
    userName: string;
    rut: string;
    subscriptions: any[];
  }): string {
    const now = new Date();
    const fechaImp = now.toLocaleDateString('es-CL');
    const horaImp = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { userName, rut, subscriptions } = payload;

    const rows = subscriptions
      .map(
        (s: any) => `
        <tr>
          <td>${s.inicio}</td>
          <td>${s.fin}</td>
          <td>${s.dias}</td>
          <td>${s.estado}</td>
        </tr>
      `,
      )
      .join('');

    const logoUrl = `${window.location.origin}/assets/logoSSM.png`;

    return `
  <div style="
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    font-family: Roboto, Arial, sans-serif;
  ">

    <!-- HEADER -->
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
      <img src="${logoUrl}" style="height:70px;" />

      <div style="font-size:13px;">
        <strong>Servicio de Salud Magallanes</strong><br>
        Sistema de Teletrabajo
      </div>
    </div>

    <!-- TITULO -->
    <h2 style="
      text-align:center;
      color:#1565c0;
      border-top:2px solid #1565c0;
      border-bottom:2px solid #1565c0;
      padding:6px;
      margin:10px 0;
      font-size:16px;
    ">
      REPORTE DE SUSCRIPCIONES
    </h2>

    <!-- DATOS -->
    <div style="font-size:13px; margin-bottom:10px;">
      <div><strong>Nombre:</strong> ${userName}</div>
      <div><strong>RUT:</strong> ${rut}</div>
    </div>

    <!-- TABLA -->
    <table style="
      width:100%;
      border-collapse: collapse;
      font-size:13px;
      text-align:center;
    ">

      <thead>
        <tr>
          <th style="background:#1565c0;color:white;padding:6px;">Inicio</th>
          <th style="background:#1565c0;color:white;padding:6px;">Fin</th>
          <th style="background:#1565c0;color:white;padding:6px;">Días</th>
          <th style="background:#1565c0;color:white;padding:6px;">Estado</th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>

    </table>

    <!-- FOOTER -->
    <div style="
      margin-top: 15px;
      font-size: 11px;
      text-align: right;
      color: #555;
    ">
      Impreso el ${fechaImp} a las ${horaImp}
    </div>

    </div>
  `;
  }
}

// src/app/services/reports/demand-detail-report.service.ts
import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DemandDetailReportService {

  constructor() {}

  generate(reg: any, sustancias: any[], movimientos: any[]): void {

    // ============================
    // ORDEN DE SUSTANCIAS (Principal → Sec)
    // ============================
    sustancias = sustancias.sort((a, b) => {
      if (a.level === 'Principal') return -1;
      if (b.level === 'Principal') return 1;
      return 0;
    });

    // ============================
    // ORDEN DE MOVIMIENTOS por fecha y hora
    // ============================
    movimientos = movimientos.sort((a, b) => {
      const fa = new Date(a.date_attention).getTime();
      const fb = new Date(b.date_attention).getTime();
      if (fa !== fb) return fa - fb;
      return (a.hour_attention ?? '').localeCompare(b.hour_attention ?? '');
    });

    // ============================
    // FORMATEO DE CAMPOS
    // ============================
    const fechaAtencion = reg.date_attention
      ? formatDate(reg.date_attention, 'dd/MM/yyyy', 'es-CL')
      : '---';

    const fechaNacimiento = reg.postulant?.birthdate
      ? formatDate(reg.postulant.birthdate, 'dd-MM-yyyy', 'es-CL')
      : '---';

    const postulante = `
      ${reg.postulant?.firstName ?? ''} 
      ${reg.postulant?.secondName ?? ''} 
      ${reg.postulant?.firstLastName ?? ''} 
      ${reg.postulant?.secondLastName ?? ''}
    `.trim();


    // ============================
    // TABLA SUSTANCIAS
    // ============================
    const tablaSustancias = sustancias.length
      ? sustancias.map(s => `
        <tr>
          <td>${s.level ?? ''}</td>
          <td>${s.substance?.name ?? ''}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="2" style="text-align:center; font-style:italic;">
            Sin sustancias asociadas
          </td>
        </tr>
      `;


    // ============================
    // TABLA MOVIMIENTOS
    // ============================
    const tablaMovimientos = movimientos.length
      ? movimientos.map(m => `
        <tr>
          <td>${m.profession?.name ?? ''}</td>
          <td>${m.full_name ?? ''}</td>
          <td>${m.date_attention ? formatDate(m.date_attention, 'dd/MM/yyyy', 'es-CL') : ''}</td>
          <td>${m.hour_attention ?? ''}</td>
          <td>${m.state ?? ''}</td>
          <td>${m.id ?? ''}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="6" style="text-align:center; font-style:italic;">
            Sin movimientos registrados
          </td>
        </tr>
      `;


    // ============================
    // HTML FINAL — MISMO QUE LA VIEW
    // ============================
    const html = `
    <html>
    <head>
      <title>Detalle Demanda</title>
      <style>
        body {
          font-family: Arial;
          margin: 25px;
          font-size: 13px;
        }
        h2, h3 { text-align: center; margin: 0; }
        hr { margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #555; padding: 6px; font-size: 12px; }
        th { background: #f2f2f2; }
        .titulo { font-weight: bold; margin-top: 15px; }
      </style>
    </head>

    <body>

      <h2>SERVICIO DE SALUD MAGALLANES</h2>
      <h3>Departamento de Salud Mental</h3>
      <h3>Detalle Demanda</h3>
      <hr>

      <div class="titulo">Programa</div>
      <table>
        <tr>
          <td><b>N° Ficha:</b></td><td>${reg.id}-${reg.program?.id}</td>
          <td><b>Fecha Atención:</b></td><td>${fechaAtencion}</td>
        </tr>
        <tr>
          <td><b>Programa:</b></td><td colspan="3">${reg.program?.name ?? '---'}</td>
        </tr>
      </table>

      <div class="titulo">Datos Generales</div>
      <table>
        <tr>
          <td><b>Postulante:</b></td><td>${postulante}</td>
          <td><b>Rut:</b></td><td>${reg.postulant?.rut ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Fecha Nacimiento:</b></td><td>${fechaNacimiento}</td>
          <td><b>Dirección:</b></td><td>${reg.postulant?.address ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Mail:</b></td><td>${reg.postulant?.email ?? '---'}</td>
          <td><b>Celular:</b></td><td>${reg.postulant?.phone ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Comuna:</b></td><td>${reg.postulant?.commune?.name ?? '---'}</td>
          <td><b>Sexo:</b></td><td>${reg.postulant?.sex?.name ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Previsión:</b></td><td>${reg.postulant?.convPrev?.name ?? '---'}</td>
          <td><b># Tratamientos:</b></td><td>${reg.number_tto ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Tipo Contacto:</b></td><td>${reg.contactType?.name ?? '---'}</td>
          <td><b>Quien Solicita:</b></td><td>${reg.sender?.name ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Quien Deriva:</b></td><td>${reg.diverter?.name ?? '---'}</td>
          <td><b>Estado:</b></td><td>${reg.state?.name ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Resultado:</b></td><td>${reg.result?.name ?? '---'}</td>
        </tr>
        <tr>
          <td><b>Observaciones:</b></td><td>${reg.description ?? '---'}</td>
        </tr>
      </table>


      <div class="titulo">Sustancias Asociadas</div>
      <table>
        <thead>
          <tr>
            <th>Nivel</th>
            <th>Sustancia</th>
          </tr>
        </thead>
        <tbody>
          ${tablaSustancias}
        </tbody>
      </table>

      <div class="titulo">Movimientos</div>
      <table>
        <thead>
          <tr>
            <th>Profesión</th>
            <th>Profesional</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          ${tablaMovimientos}
        </tbody>
      </table>

    </body>
    </html>
    `;

    // Abre el reporte
    // ABRIR E IMPRIMIR
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();

    win.onload = () => {
      win.print();
      win.focus();
    };
  }
}

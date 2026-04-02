import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root',
})
export class TeleworkReportPrintService {
  // 🔥 GENERA PDF DIRECTO
  printPdf(html: string): void {
    const element = document.createElement('div');

    element.innerHTML = `
    <style>
      body {
        font-family: Roboto, Arial, sans-serif;
        font-size: 11px;
        margin: 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th {
        border: 1px solid #ccc;
        padding: 5px;
        background: #1565c0;
        color: white;
        font-weight: 600;
        text-align: center;
      }

      td {
        border: 1px solid #ccc;
        margin: 0;
        padding: 0;
        font-size: 11px;
        vertical-align: top; /* 🔥 CLAVE */
      }

      th {
        background: #1565c0;
        color: white;
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      td {
        font-size: 11px;
      }

      thead {
        display: table-header-group;
      }

      tr {
        page-break-inside: avoid;
      }
    </style>

    ${html}
  `;

    const opt = {
      margin: [8, 24, 10, 6] as [number, number, number, number],
      // [top, right, bottom, left]
      filename: 'reporte-telework.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 3 },
      jsPDF: { unit: 'mm', format: 'legal', orientation: 'portrait' },
    };

    // solo descargar
    // (html2pdf() as any).set(opt).from(element).save();

    // solo abrir

    (html2pdf() as any)
      .set(opt)
      .from(element)
      .outputPdf('bloburl')
      .then((url: string) => {
        window.open(url);
      });

    // control total - ambos
    /*(html2pdf() as any)
      .set(opt)
      .from(element)
      .outputPdf('blob')
      .then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url);

        // opcional descarga manual
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-telework.pdf';
        a.click();
      });      */
  }

  generateWorksReport(payload: {
    userName: string;
    rut: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
    works: any[];
  }): string {
    const now = new Date();
    const fechaImp = now.toLocaleDateString('es-CL');
    const horaImp = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { userName, rut, works, dateFrom, dateTo } = payload;

    const logoUrl = `${window.location.origin}/assets/logoSSM.png`;

    const periodo =
      dateFrom && dateTo
        ? `${dateFrom.toLocaleDateString('es-CL')} - ${dateTo.toLocaleDateString('es-CL')}`
        : 'Todos los registros';

    // 🔥 FILAS LIMPIAS (SIN ESPACIOS FANTASMAS)
    
const rows = works.map(w => `
<div style="display:grid; grid-template-columns:90px 70px 1fr; border-bottom:1px solid #ccc; font-size:11px; align-items:center;">

<div style="padding:4px 6px;">${w.fecha}</div>

<div style="padding:4px 6px;">${w.hora}</div>

<div style="padding:4px 6px; text-align:left; white-space:pre-wrap; word-break:break-word; line-height:1.2;">
${w.actividad?.trim() || ''}
</div>

</div>
`).join('');

    return `
<div style="font-family:Arial; font-size:11px; margin:0; padding:0;">

  <!-- HEADER -->
  <div style="display:flex; align-items:center; gap:10px;">
    <img src="${logoUrl}" style="height:65px;" />

    <div style="font-size:12px;">
      <strong>Servicio de Salud Magallanes</strong><br>
      Sistema de Teletrabajo
    </div>
  </div>

  <!-- TITULO -->
  <h3 style="
    text-align:center;
    color:#1565c0;
    border-top:1px solid #1565c0;
    border-bottom:1px solid #1565c0;
    padding:5px;
    margin:10px 0;
    font-size:14px;
  ">
    REPORTE DE ACTIVIDADES DE TELETRABAJO
  </h3>

  <!-- INFO -->
  <div style="font-size:12px; margin-bottom:10px;">
    <div><strong>Nombre:</strong> ${userName}</div>
    <div><strong>RUT:</strong> ${rut}</div>
    <div><strong>Período:</strong> ${periodo}</div>
  </div>

  <!-- HEADER COLUMNAS -->
    <div style="
      display:grid;
      grid-template-columns: 90px 70px 1fr;
      background:#1565c0;
      color:white;
      font-weight:600;
      font-size:12px;
    ">

      <div style="padding:4px 6px;">Fecha</div>

      <div style="padding:4px 6px;">Hora</div>

      <div style="padding:4px 6px; text-align:center;">
        Actividad
      </div>

    </div>
  <!-- CONTENIDO -->
  <div>
    ${rows}
  </div>

  <!-- FOOTER -->
  <div style="
    margin-top:10px;
    font-size:10px;
    text-align:right;
    color:#555;
  ">
    Impreso el ${fechaImp} a las ${horaImp}
  </div>

</div>
`;
  }

  // 🔥 GENERA HTML DEL REPORTE
  generateReport(payload: {
    userName: string;
    rut: string;
    registers: any[];
  }): string {
    const now = new Date();
    const fechaImp = now.toLocaleDateString('es-CL');
    const horaImp = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { userName, rut, registers } = payload;

    const rows = registers
      .map(
        (r: any) => `
      <tr>
        <td>${r.fecha}</td>
        <td>${r.dia}</td>
        <td>${r.hora}</td>
        <td>${r.tipo}</td>
      </tr>
    `,
      )
      .join('');

    const logoUrl = `${window.location.origin}/assets/logoSSM.png`;

    return `
      <table>

        <thead>

          <!-- 🔵 HEADER -->
          <tr>
            <td colspan="4" style="border:none;">

              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${logoUrl}" style="height:68px; display:block;" />

                <div style="font-size:12px; line-height:1.2;">
                  <strong>Servicio de Salud Magallanes</strong><br>
                  Sistema de Teletrabajo
                </div>
              </div>

              <h3 style="
                text-align:center;
                color:#1565c0;
                border-top:1px solid #1565c0;
                border-bottom:1px solid #1565c0;
                padding:4px;
                margin:6px 0;
                font-size:14px;
                font-weight:600;
                letter-spacing:0.3px;
              ">
                REPORTE DE MARCAJES DE TELETRABAJO
              </h3>

              <div style="font-size:12px;">
                <div><strong>Nombre:</strong> ${userName}</div>
                <div><strong>RUT:</strong> ${rut}</div>
              </div>

              <div style="height:4px;"></div>

            </td>
          </tr>

          <!-- 🔵 COLUMNAS -->
          <tr>
            <th>Fecha</th>
            <th>Día</th>
            <th>Hora</th>
            <th>Tipo</th>
          </tr>

        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>

      <!-- 🔵 FOOTER -->
      <div style="
        margin-top: 10px;
        font-size: 10px;
        text-align: right;
        color: #555;
      ">
        Impreso el ${fechaImp} a las ${horaImp}
      </div>
    `;
  }
}

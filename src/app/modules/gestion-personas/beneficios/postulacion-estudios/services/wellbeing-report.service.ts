import { Injectable } from '@angular/core';

import { SummaryResponse } from '../models/summary-response.model';

@Injectable({
  providedIn: 'root',
})
export class WellbeingReportService {

  constructor() {}

  // =========================================
  // 🔥 GENERATE HTML
  // =========================================

  generateSummaryHTML(
    summary: SummaryResponse,
  ): string {

    return `
      <html>

        <head>

          <style>

            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
            }

            .title {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .subtitle {
              color: #64748b;
              margin-bottom: 32px;
            }

            .card {
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 20px;
              margin-bottom: 20px;
            }

            .label {
              font-size: 13px;
              color: #64748b;
            }

            .value {
              font-size: 18px;
              font-weight: 600;
              margin-top: 4px;
            }

          </style>

        </head>

        <body>

          <div class="title">
            Postulación Bienestar SSM
          </div>

          <div class="subtitle">
            Resumen institucional de postulación
          </div>

          <div class="card">

            <div class="label">
              Código postulación
            </div>

            <div class="value">
              ${summary.code}
            </div>

          </div>

          <div class="card">

            <div class="label">
              Afiliado/a
            </div>

            <div class="value">
              ${summary.affiliateName}
            </div>

          </div>

          <div class="card">

            <div class="label">
              Beneficiario/a
            </div>

            <div class="value">
              ${summary.beneficiaryName}
            </div>

          </div>

          <div class="card">

            <div class="label">
              Ingresos familiares
            </div>

            <div class="value">
              $${summary.totalIncome.toLocaleString('es-CL')}
            </div>

          </div>

          <div class="card">

            <div class="label">
              Gastos familiares
            </div>

            <div class="value">
              $${summary.totalExpenses.toLocaleString('es-CL')}
            </div>

          </div>

          <div class="card">

            <div class="label">
              Estado
            </div>

            <div class="value">
              ${summary.status}
            </div>

          </div>

        </body>

      </html>
    `;
  }
}
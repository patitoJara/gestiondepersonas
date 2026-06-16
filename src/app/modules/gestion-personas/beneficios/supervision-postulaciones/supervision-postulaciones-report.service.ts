import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

import { SupervisionDocument } from './supervision-postulaciones.service';

@Injectable({
  providedIn: 'root',
})
export class SupervisionPostulacionesReportService {
  // =========================================================
  // 🔥 GENERAR Y ABRIR PDF DE DETALLE
  // =========================================================

  openDetailPdf(
    summaryResponse: any,
    documents: SupervisionDocument[],
  ): Promise<void> {
    const summary = summaryResponse?.summary || summaryResponse || {};

    const postulation = summary?.postulation || {};

    const html = this.buildDetailHtml(summary, documents);

    const element = document.createElement('div');

    element.innerHTML = `
      <style>
        body {
          margin: 0;
          font-family: Arial, Roboto, sans-serif;
          color: #26374f;
          font-size: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          display: table-header-group;
        }

        tr {
          page-break-inside: avoid;
        }

        th {
          padding: 5px;
          border: 1px solid #cfd8e3;
          background: #1565c0;
          color: #ffffff;
          font-size: 10px;
          text-align: left;
        }

        td {
          padding: 5px;
          border: 1px solid #dbe2ea;
          font-size: 10px;
          vertical-align: top;
        }

        .institutional-header {
          padding: 0 0 7px 0;
          border: none;
        }

        .section-title {
          margin: 10px 0 5px;
          padding: 5px 7px;
          border-left: 4px solid #1565c0;
          background: #eef4fc;
          color: #1565c0;
          font-size: 11px;
          font-weight: 700;
        }

        .money {
          text-align: right;
          white-space: nowrap;
        }

        .center {
          text-align: center;
        }

        .muted {
          color: #7a8798;
        }
      </style>

      ${html}
    `;

    const options = {
      margin: [8, 8, 15, 8] as [number, number, number, number],

      filename: `postulacion-${
        postulation?.code || postulation?.id || 'detalle'
      }.pdf`,

      image: {
        type: 'jpeg' as const,
        quality: 0.98,
      },

      html2canvas: {
        scale: 3,
        useCORS: true,
      },

      jsPDF: {
        unit: 'mm',
        format: 'legal',
        orientation: 'portrait',
      },
    };

    const worker = (html2pdf() as any).set(options).from(element).toPdf();

    return worker
      .get('pdf')
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();

        const pageWidth = pdf.internal.pageSize.getWidth();

        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let page = 1; page <= totalPages; page++) {
          pdf.setPage(page);

          pdf.setFontSize(9);

          pdf.setTextColor(95, 107, 122);

          pdf.text(
            `Página ${page} de ${totalPages}`,
            pageWidth - 10,
            pageHeight - 7,
            {
              align: 'right',
            },
          );
        }

        return pdf.output('bloburl');
      })
      .then((url: string) => {
        window.open(url, '_blank');
      });
  }

  // =========================================================
  // 🔥 HTML GENERAL DEL INFORME
  // =========================================================

  private buildDetailHtml(
    summary: any,
    documents: SupervisionDocument[],
  ): string {
    const postulation = summary?.postulation || {};

    const affiliate = postulation?.affiliate || {};

    const familyMembers = Array.isArray(summary?.familyMembers)
      ? summary.familyMembers
      : [];

    const beneficiaryName = this.getBeneficiaryName(postulation, familyMembers);

    const incomes = Array.isArray(summary?.incomes) ? summary.incomes : [];

    const expenses = Array.isArray(summary?.expenses) ? summary.expenses : [];

    const healthRecords = Array.isArray(summary?.healthRecords)
      ? summary.healthRecords
      : [];

    const academicInfo = summary?.academicInfo || {};

    const verification = summary?.academicVerification || {};

    const housing = summary?.housing || {};

    return `
      <table>
        <thead>
          <tr>
            <td colspan="2" class="institutional-header">
              ${this.buildHeader(postulation)}
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td colspan="2">
              ${this.buildSection(
                'DATOS GENERALES',
                this.buildKeyValueTable([
                  ['Código', postulation?.code],
                  ['Estado', this.getStatus(postulation?.status)],
                  ['Año', postulation?.periodYear],
                  ['Paso actual', postulation?.currentStep],
                  [
                    'Fecha de creación',
                    this.formatDate(postulation?.createdAt),
                  ],
                  ['Fecha de envío', this.formatDate(postulation?.submittedAt)],
                  [
                    'Hogar monoparental',
                    this.yesNo(postulation?.isSingleParentHome),
                  ],
                  ['Beneficiario', beneficiaryName],
                  [
                    'Tipo de beneficiario',
                    this.getBeneficiary(postulation?.beneficiaryType),
                  ],
                ]),
              )}

              ${this.buildSection(
                'DATOS DEL AFILIADO',
                this.buildKeyValueTable([
                  ['Nombre', postulation?.userFullName],
                  ['RUT', postulation?.userRut],
                  ['Establecimiento', postulation?.stablishmentName],
                  ['Teléfono', affiliate?.phone],
                  ['Correo electrónico', affiliate?.email],
                  ['Dirección', affiliate?.address],
                  [
                    'Fecha de nacimiento',
                    this.formatDate(affiliate?.birthDate),
                  ],
                  [
                    'Fecha de afiliación',
                    this.formatDate(affiliate?.affiliateDate),
                  ],
                  ['Tipo de afiliado', affiliate?.affiliateType],
                ]),
              )}

              ${this.buildSection(
                'GRUPO FAMILIAR',
                this.buildFamilyTable(familyMembers),
              )}

              ${this.buildSection(
                'ANTECEDENTES ACADÉMICOS',
                this.buildKeyValueTable([
                  ['Institución', academicInfo?.institution],
                  ['Carrera', academicInfo?.career],
                  ['Nivel de estudio', academicInfo?.studyLevelName],
                  ['Semestre actual', academicInfo?.currentSemester],
                  [
                    'Duración de carrera',
                    academicInfo?.careerDurationSemesters
                      ? `${academicInfo.careerDurationSemesters} semestres`
                      : '—',
                  ],
                  [
                    'Estudia en la región',
                    this.yesNo(academicInfo?.studiesInRegion),
                  ],
                  [
                    'Beneficio anterior',
                    this.yesNo(academicInfo?.hadPreviousBenefit),
                  ],
                  ['Situación académica', verification?.academicSituation],
                  ['Promedio', verification?.gradeAverage],
                  [
                    'Porcentaje de aprobación',
                    verification?.approvalPercentage !== undefined
                      ? `${verification.approvalPercentage}%`
                      : '—',
                  ],
                ]),
              )}

              ${this.buildSection(
                'INGRESOS FAMILIARES',
                this.buildIncomeTable(incomes, familyMembers),
              )}

              ${this.buildSection(
                'GASTOS GENERALES',
                this.buildExpensesTable(expenses),
              )}

              ${this.buildSection(
                'GASTOS MÉDICOS',
                this.buildHealthTable(healthRecords, familyMembers),
              )}

              ${this.buildSection(
                'VIVIENDA',
                this.buildKeyValueTable([
                  ['Tipo de vivienda', housing?.typeHousingName],
                  ['Tipo de propiedad', housing?.typePropertyName],
                  ['Antecedentes de vivienda', housing?.housingBackground],
                  ['Otros antecedentes', housing?.otherBackground],
                ]),
              )}

              ${this.buildSection(
                'RESUMEN ECONÓMICO',
                this.buildKeyValueTable([
                  [
                    'Ingresos familiares',
                    this.formatCurrency(postulation?.totalFamilyIncome),
                  ],
                  [
                    'Gastos básicos',
                    this.formatCurrency(postulation?.totalBasicExpenses),
                  ],
                  [
                    'Gastos educacionales',
                    this.formatCurrency(postulation?.totalEducationExpenses),
                  ],
                  [
                    'Otros gastos',
                    this.formatCurrency(postulation?.totalOtherExpenses),
                  ],
                  [
                    'Gastos de salud',
                    this.formatCurrency(postulation?.totalHealthExpenses),
                  ],
                  [
                    'Total de gastos familiares',
                    this.formatCurrency(postulation?.totalFamilyExpenses),
                  ],
                ]),
              )}

              ${this.buildSection(
                'DOCUMENTOS ADJUNTOS',
                this.buildDocumentsTable(documents),
              )}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 ENCABEZADO INSTITUCIONAL
  // El THEAD permite repetirlo en todas las páginas.
  // =========================================================

  private getBeneficiaryName(postulation: any, familyMembers: any[]): string {
    const beneficiaryFamilyMemberId =
      postulation?.beneficiaryFamilyMemberId ??
      postulation?.beneficiary_family_member_id ??
      postulation?.beneficiaryFamilyMember?.id ??
      postulation?.beneficiary_family_member?.id ??
      null;

    const numericId = Number(beneficiaryFamilyMemberId);

    if (Number.isFinite(numericId) && numericId > 0) {
      const member = familyMembers.find((item: any) => {
        const memberId = Number(item?.id || item?.backendId || 0);

        return memberId === numericId;
      });

      if (member) {
        return this.fullName(member);
      }

      return `Integrante familiar ID ${numericId}`;
    }

    return postulation?.userFullName || 'Afiliado';
  }

  private buildHeader(postulation: any): string {
    const logoUrl = `${window.location.origin}/assets/logoSSM.png`;

    const now = new Date();

    return `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
      ">
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
        ">
          <img
            src="${logoUrl}"
            style="height:62px; display:block;"
          />

          <div style="font-size:11px; line-height:1.3;">
            <strong>Servicio de Salud Magallanes</strong>
            <br>
            Sistema de Gestión de Personas
          </div>
        </div>

        <div style="
          color:#536174;
          font-size:9px;
          text-align:right;
        ">
          Emitido el ${now.toLocaleDateString('es-CL')}
          <br>
          ${now.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          })} hrs.
        </div>
      </div>

      <h3 style="
        margin:6px 0 3px;
        padding:5px;
        border-top:1px solid #1565c0;
        border-bottom:1px solid #1565c0;
        color:#1565c0;
        font-size:13px;
        text-align:center;
      ">
        DETALLE DE POSTULACIÓN BIENESTAR 2026
      </h3>

      <div style="
        color:#536174;
        font-size:11px;
        text-align:center;
      ">
        ${this.escape(postulation?.code || '—')}
        ·
        ${this.escape(postulation?.userFullName || '—')}
      </div>
    `;
  }

  // =========================================================
  // 🔥 SECCIONES
  // =========================================================

  private buildSection(title: string, content: string): string {
    return `
      <div class="section-title">
        ${this.escape(title)}
      </div>

      ${content}
    `;
  }

  private buildKeyValueTable(rows: Array<[string, any]>): string {
    return `
      <table>
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="width:34%;">
                    <strong>${this.escape(label)}</strong>
                  </td>

                  <td>
                    ${this.escape(this.text(value))}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 GRUPO FAMILIAR
  // =========================================================

  private buildFamilyTable(items: any[]): string {
    if (!items.length) {
      return this.emptyRow('No existen integrantes registrados.');
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Integrante</th>
            <th>RUT</th>
            <th>Parentesco</th>
            <th>Previsión</th>
            <th>Actividad</th>
            <th>Trabajo</th>
          </tr>
        </thead>

        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>${this.escape(this.fullName(item))}</td>

                  <td>${this.escape(item?.rut || '—')}</td>

                  <td>${this.escape(item?.parentTypeName || '—')}</td>

                  <td>${this.escape(item?.previtionName || '—')}</td>

                  <td>
                    ${this.escape(
                      item?.othersActivities || item?.activityName || '—',
                    )}
                  </td>

                  <td>
                    ${this.escape(
                      item?.othersWorkplaces || item?.workPlaceName || '—',
                    )}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 INGRESOS
  // =========================================================

  private buildIncomeTable(items: any[], family: any[]): string {
    if (!items.length) {
      return this.emptyRow('No existen ingresos registrados.');
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Integrante</th>
            <th>Tipo de ingreso</th>
            <th>Monto</th>
          </tr>
        </thead>

        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>
                    ${this.escape(
                      this.getFamilyName(family, item?.familyMemberId),
                    )}
                  </td>

                  <td>${this.escape(item?.name || '—')}</td>

                  <td class="money">
                    ${this.formatCurrency(item?.amount)}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 GASTOS GENERALES
  // =========================================================

  private buildExpensesTable(items: any[]): string {
    if (!items.length) {
      return this.emptyRow('No existen gastos registrados.');
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Detalle</th>
            <th>Monto</th>
          </tr>
        </thead>

        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>
                    ${this.escape(this.getExpenseCategory(item?.category))}
                  </td>

                  <td>
                    ${this.escape(item?.name || item?.description || '—')}
                  </td>

                  <td class="money">
                    ${this.formatCurrency(item?.amount)}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 GASTOS MÉDICOS
  // =========================================================

  private buildHealthTable(items: any[], family: any[]): string {
    if (!items.length) {
      return this.emptyRow('No existen gastos médicos registrados.');
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Integrante</th>
            <th>Patología o antecedente</th>
            <th>Monto</th>
          </tr>
        </thead>

        <tbody>
          ${items
            .map(
              (item) => `
                <tr>
                  <td>
                    ${this.escape(
                      item?.familyMemberName ||
                        this.getFamilyName(family, item?.familyMemberId),
                    )}
                  </td>

                  <td>
                    ${this.escape(
                      item?.pathology ||
                        item?.patologia ||
                        item?.description ||
                        item?.name ||
                        '—',
                    )}
                  </td>

                  <td class="money">
                    ${this.formatCurrency(
                      item?.amount ||
                        item?.expense ||
                        item?.gasto ||
                        item?.monthlyExpense ||
                        0,
                    )}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 DOCUMENTOS
  // =========================================================

  private buildDocumentsTable(documents: SupervisionDocument[]): string {
    if (!documents.length) {
      return this.emptyRow('No existen documentos adjuntos registrados.');
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Tipo documental</th>
            <th>Nombre del archivo</th>
            <th>Tamaño</th>
          </tr>
        </thead>

        <tbody>
          ${documents
            .map(
              (document) => `
                <tr>
                  <td>
                    ${this.escape(
                      document?.documentTypeName ||
                        document?.documentTypeCode ||
                        'Documento',
                    )}
                  </td>

                  <td>
                    ${this.escape(
                      document?.originalFilename || 'Documento adjunto',
                    )}
                  </td>

                  <td class="center">
                    ${this.formatFileSize(document?.sizeBytes)}
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // =========================================================
  // 🔥 HELPERS
  // =========================================================

  private emptyRow(message: string): string {
    return `
      <div class="muted">
        ${this.escape(message)}
      </div>
    `;
  }

  private fullName(item: any): string {
    return (
      [
        item?.names,
        item?.lastNames,
        item?.last_names,
        item?.firstName,
        item?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || '—'
    );
  }

  private getFamilyName(family: any[], id: any): string {
    const member = family.find(
      (item) => Number(item?.id || 0) === Number(id || 0),
    );

    return member ? this.fullName(member) : '—';
  }

  private getStatus(value: any): string {
    const status = String(value || '')
      .trim()
      .toUpperCase();

    if (status === 'DRAFT') {
      return 'Borrador';
    }

    if (status === 'SUBMITTED') {
      return 'Enviada';
    }

    return status || '—';
  }

  private getBeneficiary(value: any): string {
    const beneficiary = String(value || '')
      .trim()
      .toUpperCase();

    if (beneficiary === 'AFFILIATE') {
      return 'Afiliado';
    }

    if (beneficiary === 'FAMILY_MEMBER') {
      return 'Integrante familiar';
    }

    return '—';
  }

  private getExpenseCategory(value: any): string {
    const category = String(value || '')
      .trim()
      .toUpperCase();

    if (category === 'BASIC') {
      return 'Gasto básico';
    }

    if (category === 'EDUCATION') {
      return 'Gasto educacional';
    }

    if (category === 'OTHER') {
      return 'Otro gasto';
    }

    return category || 'Sin categoría';
  }

  private yesNo(value: any): string {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return 'Sí';
    }

    if (value === false || value === 'false' || value === 0 || value === '0') {
      return 'No';
    }

    return '—';
  }

  private formatCurrency(value: any): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  private formatDate(value: any): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatFileSize(value: any): string {
    const bytes = Number(value || 0);

    if (!bytes) {
      return '—';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private text(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  private escape(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

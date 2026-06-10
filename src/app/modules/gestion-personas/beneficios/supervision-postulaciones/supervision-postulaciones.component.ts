import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderService } from '@app/core/services/loader.service';

import {
  SupervisionDocument,
  SupervisionPostulation,
  SupervisionPostulacionesService,
} from './supervision-postulaciones.service';

import { SupervisionPostulacionesReportService } from './supervision-postulaciones-report.service';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface StablishmentFilterOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-supervision-postulaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './supervision-postulaciones.component.html',
  styleUrl: './supervision-postulaciones.component.scss',
})
export class SupervisionPostulacionesComponent implements OnInit {
  private supervisionService = inject(SupervisionPostulacionesService);
  private reportService = inject(SupervisionPostulacionesReportService);
  private loader = inject(LoaderService);

  // =========================================================
  // 🔥 DATA
  // =========================================================

  postulations: SupervisionPostulation[] = [];

  filteredPostulations: SupervisionPostulation[] = [];

  selectedDetail: SupervisionPostulation | null = null;

  selectedSummary: any = null;

  selectedDocuments: SupervisionDocument[] = [];

  // =========================================================
  // 🔥 CACHED VALUES
  // IMPORTANTE:
  // NO USAR GETTERS QUE RECONSTRUYAN ARREGLOS EN EL HTML
  // =========================================================

  stablishmentOptions: StablishmentFilterOption[] = [];

  totalPostulations = 0;

  totalDrafts = 0;

  totalSubmitted = 0;

  // =========================================================
  // 🔥 UI STATE
  // =========================================================

  loading = false;

  loadingDetail = false;
  exportingExcel = false;

  downloadingDocumentId: number | null = null;

  errorMessage = '';

  filters = {
    searchText: '',
    status: '',
    stablishmentId: '',
  };

  ngOnInit(): void {
    this.loadPostulations();
  }

  // =========================================================
  // 🔥 LOAD POSTULATIONS
  // =========================================================

  loadPostulations(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;

    this.errorMessage = '';

    this.supervisionService.search().subscribe({
      next: (response: any) => {
        this.postulations = this.extractPostulations(response);

        // =====================================
        // 🔥 CALCULAR UNA SOLA VEZ
        // =====================================

        this.buildSummaryCards();

        this.buildStablishmentOptions();

        this.applyFilters();

        // Evitar imprimir el arreglo completo.
        // DevTools puede volverse pesado al expandir objetos grandes.
        console.log('📦 SUPERVISION POSTULATIONS:', {
          rawResponse: response,
          total: this.postulations.length,
          filtered: this.filteredPostulations.length,
        });

        this.loading = false;
      },

      error: (error) => {
        console.error('❌ ERROR LOADING SUPERVISION POSTULATIONS:', error);

        this.postulations = [];

        this.filteredPostulations = [];

        this.stablishmentOptions = [];

        this.totalPostulations = 0;

        this.totalDrafts = 0;

        this.totalSubmitted = 0;

        this.errorMessage =
          'No fue posible cargar las postulaciones. Revise que el endpoint general esté habilitado para el rol supervisor.';

        this.loading = false;
      },
    });
  }

  /**
   * Tolera las estructuras habituales que puede devolver un backend:
   *
   * []
   * { content: [] }
   * { data: [] }
   * { items: [] }
   * { results: [] }
   * { postulations: [] }
   */
  private extractPostulations(response: any): SupervisionPostulation[] {
    const candidates = [
      response,
      response?.content,
      response?.data,
      response?.items,
      response?.results,
      response?.postulations,
    ];

    const list = candidates.find((candidate) => Array.isArray(candidate));

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .filter((postulation: any) => {
        return postulation?.id && !this.isSoftDeleted(postulation);
      })
      .map((postulation: any) => {
        return {
          ...postulation,

          id: Number(postulation.id),

          currentStep: Number(postulation.currentStep || 1),

          status: String(postulation.status || '').toUpperCase(),
        } as SupervisionPostulation;
      })
      .sort((a: SupervisionPostulation, b: SupervisionPostulation) => {
        const dateA = new Date(
          a.updatedAt || a.createdAt || a.submittedAt || 0,
        ).getTime();

        const dateB = new Date(
          b.updatedAt || b.createdAt || b.submittedAt || 0,
        ).getTime();

        return dateB - dateA;
      });
  }

  private isSoftDeleted(postulation: any): boolean {
    return Boolean(
      postulation?.deletedAt ||
      postulation?.deleted_at ||
      postulation?.deletedDate ||
      postulation?.deleted,
    );
  }

  // =========================================================
  // 🔥 SUMMARY CARDS
  // CALCULAR UNA SOLA VEZ AL RECIBIR DATOS
  // =========================================================

  private buildSummaryCards(): void {
    this.totalPostulations = this.postulations.length;

    this.totalDrafts = 0;

    this.totalSubmitted = 0;

    for (const postulation of this.postulations) {
      const status = this.normalizeStatus(postulation.status);

      if (status === 'DRAFT') {
        this.totalDrafts++;
      }

      if (status === 'SUBMITTED') {
        this.totalSubmitted++;
      }
    }
  }

  // =========================================================
  // 🔥 STABLISHMENTS
  // CALCULAR UNA SOLA VEZ AL RECIBIR DATOS
  // =========================================================

  private buildStablishmentOptions(): void {
    const map = new Map<number, string>();

    for (const postulation of this.postulations) {
      const id = Number(postulation.stablishmentId || 0);

      const name = String(postulation.stablishmentName || '').trim();

      if (!id || !name) {
        continue;
      }

      map.set(id, name);
    }

    this.stablishmentOptions = Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  // =========================================================
  // 🔥 FILTERS
  // =========================================================

  applyFilters(): void {
    const searchText = this.normalizeText(this.filters.searchText);

    const selectedStatus = this.normalizeStatus(this.filters.status);

    const selectedStablishmentId = Number(this.filters.stablishmentId || 0);

    this.filteredPostulations = this.postulations.filter((postulation) => {
      const code = this.normalizeText(postulation.code);

      const rut = this.normalizeText(postulation.userRut);

      const fullName = this.normalizeText(postulation.userFullName);

      const stablishmentName = this.normalizeText(postulation.stablishmentName);

      const matchesSearch =
        !searchText ||
        code.includes(searchText) ||
        rut.includes(searchText) ||
        fullName.includes(searchText) ||
        stablishmentName.includes(searchText);

      const matchesStatus =
        !selectedStatus ||
        this.normalizeStatus(postulation.status) === selectedStatus;

      const matchesStablishment =
        !selectedStablishmentId ||
        Number(postulation.stablishmentId || 0) === selectedStablishmentId;

      return matchesSearch && matchesStatus && matchesStablishment;
    });
  }

  clearFilters(): void {
    this.filters = {
      searchText: '',
      status: '',
      stablishmentId: '',
    };

    this.applyFilters();
  }

  private normalizeText(value: any): string {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeStatus(value: any): string {
    return String(value || '')
      .trim()
      .toUpperCase();
  }

  // =========================================================
  // 🔥 DETAIL
  // =========================================================

  openDetail(
    postulation: SupervisionPostulation,
    focusSection: 'top' | 'documents' = 'top',
  ): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId || this.loadingDetail) {
      return;
    }

    this.loadingDetail = true;

    this.errorMessage = '';

    this.selectedDetail = null;

    this.selectedSummary = null;

    this.selectedDocuments = [];

    /**
     * El resumen y los documentos se consultan
     * simultáneamente.
     *
     * Si falla solamente la carga de documentos,
     * igualmente se muestra el detalle general.
     */
    forkJoin({
      summary: this.supervisionService.getSummary(postulationId),

      documents: this.supervisionService.getDocuments(postulationId).pipe(
        catchError((error) => {
          console.warn('⚠️ No fue posible cargar los documentos:', error);

          return of([]);
        }),
      ),
    }).subscribe({
      next: ({ summary, documents }) => {
        this.selectedSummary = summary;

        this.selectedDetail = this.normalizeSummary(summary, postulation);

        this.selectedDocuments = this.extractDocuments(documents);

        console.log('📄 SUPERVISION DETAIL READY:', {
          detailId: this.selectedDetail?.id,

          documents: this.selectedDocuments.length,
        });

        this.loadingDetail = false;

        setTimeout(() => {
          const selector =
            focusSection === 'documents'
              ? '.documents-section'
              : '.detail-card';

          document.querySelector(selector)?.scrollIntoView({
            behavior: 'auto',
            block: 'start',
          });
        }, 0);
      },

      error: (error) => {
        console.error('❌ ERROR LOADING SUPERVISION SUMMARY:', error);

        this.loadingDetail = false;

        this.errorMessage =
          'No fue posible cargar el resumen de la postulación seleccionada.';
      },
    });
  }

  /**
   * Tolera distintas estructuras del summary.
   *
   * Puede recibir:
   * - summary directo
   * - { postulation: ... }
   * - { summary: ... }
   * - { summary: { postulation: ... } }
   *
   * También conserva los datos básicos que ya venían
   * desde el listado general.
   */
  private normalizeSummary(
    response: any,
    fallback: SupervisionPostulation,
  ): SupervisionPostulation {
    const summary = response?.summary || response || {};

    const postulation = summary?.postulation || response?.postulation || {};

    return {
      ...fallback,
      ...postulation,
      ...summary,

      id: Number(postulation?.id || summary?.id || fallback?.id || 0),

      currentStep: Number(
        postulation?.currentStep ||
          summary?.currentStep ||
          fallback?.currentStep ||
          1,
      ),

      status: String(
        postulation?.status || summary?.status || fallback?.status || '',
      ).toUpperCase(),
    } as SupervisionPostulation;
  }

  closeDetail(): void {
    this.selectedDetail = null;

    this.selectedSummary = null;

    this.selectedDocuments = [];
  }

  openDocuments(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId) {
      return;
    }

    if (
      Number(this.selectedDetail?.id || 0) === postulationId &&
      !this.loadingDetail
    ) {
      setTimeout(() => {
        document.querySelector('.documents-section')?.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
      }, 0);

      return;
    }

    this.openDetail(postulation, 'documents');
  }

  /**
   * El detalle puede devolver los documentos en diferentes propiedades.
   * Dejamos la lectura tolerante para adaptarnos sin romper la vista.
   */
  private extractDocuments(response: any): SupervisionDocument[] {
    const candidates = [
      response,
      response?.content,
      response?.data,
      response?.items,
      response?.results,
      response?.documents,
      response?.uploadedDocuments,
      response?.attachments,
      response?.postulation?.documents,
      response?.postulation?.uploadedDocuments,
      response?.summary?.documents,
    ];

    const documents = candidates.find((candidate) => Array.isArray(candidate));

    if (!Array.isArray(documents)) {
      return [];
    }

    return documents
      .map((document: any) => this.normalizeDocument(document))
      .filter((document: SupervisionDocument) => Boolean(document.id));
  }

  private normalizeDocument(document: any): SupervisionDocument {
    const documentType =
      document?.documentType || document?.type || document?.document_type || {};

    return {
      ...document,

      id: Number(document?.id || document?.documentId || 0),

      originalFilename:
        document?.originalFilename ||
        document?.original_filename ||
        document?.filename ||
        document?.fileName ||
        'Documento adjunto',

      documentTypeName:
        document?.documentTypeName ||
        document?.document_type_name ||
        documentType?.name ||
        documentType?.label ||
        'Documento',

      documentTypeCode:
        document?.documentTypeCode ||
        document?.document_type_code ||
        documentType?.code ||
        '',
    };
  }

  // =========================================================
  // 🔥 DOCUMENT DOWNLOAD
  // =========================================================

  downloadDocument(document: SupervisionDocument): void {
    const documentId = Number(document?.id || 0);

    if (!documentId || this.downloadingDocumentId) {
      return;
    }

    this.downloadingDocumentId = documentId;

    this.supervisionService.downloadDocument(documentId).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(
          blob,
          document.originalFilename || `documento-${documentId}`,
        );

        this.downloadingDocumentId = null;
      },

      error: (error) => {
        console.error('❌ ERROR DOWNLOADING DOCUMENT:', error);

        this.downloadingDocumentId = null;

        this.errorMessage = 'No fue posible descargar el documento.';
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const safeFilename = filename || 'documento-adjunto';

    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');

    anchor.href = url;

    anchor.download = safeFilename;

    anchor.style.display = 'none';

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    window.URL.revokeObjectURL(url);
  }

  // =========================================================
  // 🔥 EXCEL-COMPATIBLE EXPORT
  // =========================================================

  // =========================================================
  // 🔥 EXPORTACIÓN EXCEL COMPLETA CON MÚLTIPLES HOJAS
  // =========================================================

  exportFilteredExcel(): void {
    const postulations = this.filteredPostulations;

    if (!postulations.length) {
      this.errorMessage = 'No existen postulaciones para exportar.';
      return;
    }

    if (this.exportingExcel) {
      return;
    }

    this.exportingExcel = true;

    this.errorMessage = '';

    this.loader.lock(120000);

    const requests = postulations.map((postulation) => {
      return this.supervisionService.getSummary(Number(postulation.id)).pipe(
        catchError((error) => {
          console.warn(
            `⚠️ No fue posible cargar el summary de la postulación ${postulation.id}:`,
            error,
          );

          return of({
            postulation,
            familyMembers: [],
            academicInfo: null,
            academicVerification: null,
            incomes: [],
            expenses: [],
            healthRecords: [],
            housing: null,
            documents: [],
            summaryLoadError: true,
          });
        }),
      );
    });

    forkJoin(requests).subscribe({
      next: (summaries: any[]) => {
        try {
          const workbook = XLSX.utils.book_new();

          // =====================================================
          // 🔥 FILTROS APLICADOS
          // =====================================================

          const selectedStablishmentId = Number(
            this.filters.stablishmentId || 0,
          );

          const selectedStablishment =
            this.stablishmentOptions.find(
              (item) => Number(item.id) === selectedStablishmentId,
            )?.name || 'Todos';

          const filtrosRows = [
            {
              Criterio: 'Fecha de exportación',
              Valor: new Date().toLocaleString('es-CL'),
            },
            {
              Criterio: 'Búsqueda aplicada',
              Valor: this.filters.searchText || 'Sin búsqueda',
            },
            {
              Criterio: 'Estado',
              Valor: this.filters.status
                ? this.getStatusLabel(this.filters.status)
                : 'Todos',
            },
            {
              Criterio: 'Establecimiento',
              Valor: selectedStablishment,
            },
            {
              Criterio: 'Total de postulaciones exportadas',
              Valor: postulations.length,
            },
          ];

          this.appendSheet(workbook, 'Filtros', filtrosRows);

          // =====================================================
          // 🔥 HOJA 1: POSTULACIONES
          // =====================================================

          const postulacionesRows = summaries.map((summary: any) => {
            const postulation = summary?.postulation || summary || {};

            return {
              'ID postulación': postulation.id,
              Código: postulation.code,
              Año: postulation.periodYear,
              Estado: this.getStatusLabel(postulation.status),
              'Paso actual': postulation.currentStep,
              'RUT afiliado': postulation.userRut,
              'Nombre afiliado': postulation.userFullName,
              Establecimiento: postulation.stablishmentName,
              Beneficiario: this.getBeneficiaryLabel(
                postulation.beneficiaryType,
              ),
              'Hogar monoparental': this.getYesNoLabel(
                postulation.isSingleParentHome,
              ),
              'Fecha creación': this.formatDate(postulation.createdAt),
              'Fecha envío': this.formatDate(postulation.submittedAt),
              'Última actualización': this.formatDate(postulation.updatedAt),
              'Ingresos familiares': Number(postulation.totalFamilyIncome || 0),
              'Gastos básicos': Number(postulation.totalBasicExpenses || 0),
              'Gastos educacionales': Number(
                postulation.totalEducationExpenses || 0,
              ),
              'Otros gastos': Number(postulation.totalOtherExpenses || 0),
              'Gastos de salud': Number(postulation.totalHealthExpenses || 0),
              'Total gastos familiares': Number(
                postulation.totalFamilyExpenses || 0,
              ),
            };
          });

          this.appendSheet(workbook, 'Postulaciones', postulacionesRows);

          // =====================================================
          // 🔥 HOJA 2: GRUPO FAMILIAR
          // =====================================================

          const familyRows = summaries.flatMap((summary: any) => {
            const postulation = summary?.postulation || {};

            return (summary?.familyMembers || []).map((member: any) => ({
              'ID postulación': postulation.id,
              Código: postulation.code,
              'RUT afiliado': postulation.userRut,
              'ID integrante': member.id,
              'RUT integrante': member.rut,
              'Nombre integrante': this.getFamilyMemberFullName(member),
              Parentesco: member.parentTypeName,
              'Fecha nacimiento': this.formatDate(member.birthDate),
              'Estado civil': member.civilStateName,
              Previsión: member.previtionName,
              Actividad: member.othersActivities || member.activityName,
              'Lugar de trabajo':
                member.othersWorkplaces || member.workPlaceName,
              Estudiante: this.getYesNoLabel(member.student),
              'Nivel de estudio': member.studyLevelName,
              'Lugar de estudio': member.studyPlace,
              'Ingreso mensual': Number(member.monthlyIncome || 0),
            }));
          });

          this.appendSheet(workbook, 'Grupo familiar', familyRows);

          // =====================================================
          // 🔥 HOJA 3: INGRESOS
          // =====================================================

          const incomeRows = summaries.flatMap((summary: any) => {
            const postulation = summary?.postulation || {};

            return (summary?.incomes || []).map((income: any) => ({
              'ID postulación': postulation.id,
              Código: postulation.code,
              'ID ingreso': income.id,
              'ID integrante': income.familyMemberId,
              Integrante: this.getFamilyNameFromSummary(
                summary,
                income.familyMemberId,
              ),
              'Tipo de ingreso': income.name,
              Monto: Number(income.amount || 0),
            }));
          });

          this.appendSheet(workbook, 'Ingresos', incomeRows);

          // =====================================================
          // 🔥 HOJA 4: GASTOS GENERALES
          // =====================================================

          const expenseRows = summaries.flatMap((summary: any) => {
            const postulation = summary?.postulation || {};

            return (summary?.expenses || []).map((expense: any) => ({
              'ID postulación': postulation.id,
              Código: postulation.code,
              'ID gasto': expense.id,
              Categoría: this.getExpenseCategoryLabel(expense.category),
              Código_gasto: expense.code,
              Detalle: expense.name || expense.description,
              Monto: Number(expense.amount || 0),
            }));
          });

          this.appendSheet(workbook, 'Gastos generales', expenseRows);

          // =====================================================
          // 🔥 HOJA 5: GASTOS MÉDICOS
          // =====================================================

          const healthRows = summaries.flatMap((summary: any) => {
            const postulation = summary?.postulation || {};

            return (summary?.healthRecords || []).map((record: any) => ({
              'ID postulación': postulation.id,
              Código: postulation.code,
              'ID registro médico': record.id,
              'ID integrante': record.familyMemberId || record.familiarId || '',
              Integrante:
                record.familyMemberName ||
                this.getFamilyNameFromSummary(
                  summary,
                  record.familyMemberId || record.familiarId,
                ),
              'Patología o antecedente':
                record.pathology ||
                record.patologia ||
                record.description ||
                record.name,
              Monto: this.getHealthAmount(record),
            }));
          });

          this.appendSheet(workbook, 'Gastos médicos', healthRows);

          // =====================================================
          // 🔥 HOJA 6: ANTECEDENTES ACADÉMICOS
          // =====================================================

          const academicRows = summaries.map((summary: any) => {
            const postulation = summary?.postulation || {};

            const academic = summary?.academicInfo || {};

            const verification = summary?.academicVerification || {};

            return {
              'ID postulación': postulation.id,
              Código: postulation.code,
              Institución: academic.institution,
              Carrera: academic.career,
              'Nivel de estudio': academic.studyLevelName,
              'Semestre actual': academic.currentSemester,
              'Duración carrera semestres': academic.careerDurationSemesters,
              'Estudia en la región': this.getYesNoLabel(
                academic.studiesInRegion,
              ),
              'Beneficio anterior': this.getYesNoLabel(
                academic.hadPreviousBenefit,
              ),
              'Situación académica': verification.academicSituation,
              Promedio: verification.gradeAverage,
              'Porcentaje aprobación': verification.approvalPercentage,
            };
          });

          this.appendSheet(workbook, 'Académicos', academicRows);

          // =====================================================
          // 🔥 HOJA 7: VIVIENDA
          // =====================================================

          const housingRows = summaries.map((summary: any) => {
            const postulation = summary?.postulation || {};

            const housing = summary?.housing || {};

            return {
              'ID postulación': postulation.id,
              Código: postulation.code,
              'Tipo de vivienda': housing.typeHousingName,
              'Tipo de propiedad': housing.typePropertyName,
              'Antecedentes de vivienda': housing.housingBackground,
              'Otros antecedentes': housing.otherBackground,
            };
          });

          this.appendSheet(workbook, 'Vivienda', housingRows);

          // =====================================================
          // 🔥 HOJA 8: DOCUMENTOS
          // =====================================================

          const documentRows = summaries.flatMap((summary: any) => {
            const postulation = summary?.postulation || {};

            return (summary?.documents || []).map((document: any) => ({
              'ID postulación': postulation.id,
              Código: postulation.code,
              'ID documento': document.id,
              'Tipo documental': document.documentTypeName,
              'Código documental': document.documentTypeCode,
              'Nombre archivo': document.originalFilename,
              'Tamaño bytes': Number(document.sizeBytes || 0),
              'Tamaño legible': this.formatFileSize(document.sizeBytes),
              'Tipo contenido': document.mimeType || document.contentType,
              'Fecha carga': this.formatDate(document.uploadedAt),
            }));
          });

          this.appendSheet(workbook, 'Documentos', documentRows);

          // =====================================================
          // 🔥 HOJA 9: CONTROL DOCUMENTAL
          // =====================================================

          const controlRows = summaries.map((summary: any) => {
            const postulation = summary?.postulation || {};

            return {
              'ID postulación': postulation.id,
              Código: postulation.code,
              'Documentos obligatorios requeridos':
                summary.requiredDocumentsTotal || 0,
              'Documentos obligatorios cargados':
                summary.requiredDocumentsUploaded || 0,
              'Puede enviar postulación': this.getYesNoLabel(summary.canSubmit),
              'Documentos pendientes': (
                summary.pendingRequiredDocuments || []
              ).join(', '),
              'Error cargando summary': this.getYesNoLabel(
                summary.summaryLoadError,
              ),
            };
          });

          this.appendSheet(workbook, 'Control documental', controlRows);

          // =====================================================
          // 🔥 GENERAR ARCHIVO XLSX
          // =====================================================

          const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          });

          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });

          saveAs(
            blob,
            `supervision-postulaciones-${this.getTodayFileText()}.xlsx`,
          );
        } catch (error) {
          console.error('❌ ERROR BUILDING EXCEL:', error);

          this.errorMessage = 'No fue posible construir el archivo Excel.';
        } finally {
          this.exportingExcel = false;
          this.loader.unlock();      
        }
      },

      error: (error) => {
        console.error('❌ ERROR LOADING DATA FOR EXCEL:', error);

        this.exportingExcel = false;

        this.loader.unlock();

        this.errorMessage =
          'No fue posible obtener la información para exportar el Excel.';
      },
    });
  }

  private escapeCsv(value: any): string {
    const text = String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  }

  private getTodayFileText(): string {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');

    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // 🔥 VISUAL HELPERS
  // =========================================================

  getStatusLabel(status: any): string {
    const normalizedStatus = this.normalizeStatus(status);

    if (normalizedStatus === 'DRAFT') {
      return 'Borrador';
    }

    if (normalizedStatus === 'SUBMITTED') {
      return 'Enviada';
    }

    return normalizedStatus || 'Sin estado';
  }

  getStatusClass(status: any): string {
    const normalizedStatus = this.normalizeStatus(status);

    if (normalizedStatus === 'DRAFT') {
      return 'status-draft';
    }

    if (normalizedStatus === 'SUBMITTED') {
      return 'status-submitted';
    }

    return 'status-default';
  }

  getBeneficiaryLabel(beneficiaryType: any): string {
    const normalizedType = String(beneficiaryType || '')
      .trim()
      .toUpperCase();

    if (normalizedType === 'AFFILIATE') {
      return 'Afiliado';
    }

    if (normalizedType === 'FAMILY_MEMBER') {
      return 'Integrante familiar';
    }

    return 'Sin información';
  }

  getDocumentCount(postulation: SupervisionPostulation): number | null {
    const candidates = [
      postulation?.documents,
      postulation?.uploadedDocuments,
      postulation?.['attachments'],
    ];

    const documents = candidates.find((candidate) => Array.isArray(candidate));

    return Array.isArray(documents) ? documents.length : null;
  }

  formatDate(value: any): string {
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

  formatCurrency(value: any): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  trackByPostulationId(
    _index: number,
    postulation: SupervisionPostulation,
  ): number {
    return Number(postulation.id);
  }

  trackByDocumentId(_index: number, document: SupervisionDocument): number {
    return Number(document.id);
  }

  // =========================================================
  // 🔥 DETAIL HELPERS
  // =========================================================

  getFamilyMemberName(familyMemberId: any): string {
    const id = Number(familyMemberId || 0);

    if (!id) {
      return '—';
    }

    const member = (this.selectedSummary?.familyMembers || []).find(
      (item: any) => Number(item?.id || 0) === id,
    );

    if (!member) {
      return '—';
    }

    return (
      [member?.names, member?.lastNames].filter(Boolean).join(' ').trim() || '—'
    );
  }

  getFamilyMemberFullName(member: any): string {
    return (
      [member?.names, member?.lastNames].filter(Boolean).join(' ').trim() || '—'
    );
  }

  getYesNoLabel(value: any): string {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return 'Sí';
    }

    if (value === false || value === 'false' || value === 0 || value === '0') {
      return 'No';
    }

    return '—';
  }

  getExpenseCategoryLabel(category: any): string {
    const value = String(category || '')
      .trim()
      .toUpperCase();

    if (value === 'BASIC') {
      return 'Gasto básico';
    }

    if (value === 'EDUCATION') {
      return 'Gasto educacional';
    }

    if (value === 'OTHER') {
      return 'Otro gasto';
    }

    return value || 'Sin categoría';
  }

  getHealthMemberName(record: any): string {
    return (
      record?.familyMemberName ||
      record?.memberName ||
      this.getFamilyMemberName(record?.familyMemberId || record?.familiarId)
    );
  }

  getHealthDescription(record: any): string {
    return (
      record?.pathology ||
      record?.patologia ||
      record?.description ||
      record?.name ||
      '—'
    );
  }

  getHealthAmount(record: any): number {
    return Number(
      record?.amount ||
        record?.expense ||
        record?.gasto ||
        record?.monthlyExpense ||
        0,
    );
  }

  formatFileSize(value: any): string {
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

  // =========================================================
  // 🔥 PRINT DETAIL REPORT
  // =========================================================

  printPostulationDetail(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId) {
      return;
    }

    this.loader.lock(120000);

    forkJoin({
      summary: this.supervisionService.getSummary(postulationId),

      documents: this.supervisionService.getDocuments(postulationId).pipe(
        catchError((error) => {
          console.warn(
            '⚠️ No fue posible cargar documentos para el informe:',
            error,
          );

          return of([]);
        }),
      ),
    }).subscribe({
      next: ({ summary, documents }) => {
        const normalizedDocuments = this.extractDocuments(documents);

        this.reportService
          .openDetailPdf(summary, normalizedDocuments)
          .catch((error) => {
            console.error('❌ ERROR BUILDING DETAIL PDF:', error);

            this.errorMessage = 'No fue posible construir el informe PDF.';
          })
          .finally(() => {
            this.loader.unlock();
          });
      },

      error: (error) => {
        console.error('❌ ERROR GENERATING DETAIL REPORT:', error);

        this.errorMessage =
          'No fue posible generar el informe de la postulación.';

        this.loader.unlock();
      },
    });
  }

  // =========================================================
  // 🔥 EXCEL HELPERS
  // =========================================================

  private appendSheet(
    workbook: XLSX.WorkBook,
    sheetName: string,
    rows: any[],
  ): void {
    const safeRows = rows.length ? rows : [{ Información: 'Sin registros' }];

    const worksheet = XLSX.utils.json_to_sheet(safeRows);

    this.applyWorksheetWidths(worksheet, safeRows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName.substring(0, 31),
    );
  }

  private applyWorksheetWidths(worksheet: XLSX.WorkSheet, rows: any[]): void {
    const headers = Object.keys(rows[0] || {});

    worksheet['!cols'] = headers.map((header) => {
      const contentWidths = rows.map((row) => {
        return String(row?.[header] ?? '').length;
      });

      const maxLength = Math.max(header.length, ...contentWidths);

      return {
        wch: Math.min(Math.max(maxLength + 2, 12), 45),
      };
    });
  }

  private getFamilyNameFromSummary(summary: any, familyMemberId: any): string {
    const id = Number(familyMemberId || 0);

    const member = (summary?.familyMembers || []).find(
      (item: any) => Number(item?.id || 0) === id,
    );

    return member ? this.getFamilyMemberFullName(member) : '—';
  }
}

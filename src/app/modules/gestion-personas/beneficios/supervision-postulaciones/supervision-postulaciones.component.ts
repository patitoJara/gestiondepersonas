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

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogYesNoComponent } from '@app/shared/confirm-dialog/confirm-dialog-yes-no.component';

import {
  SupervisionDocument,
  SupervisionPostulation,
  SupervisionPostulacionesService,
} from './supervision-postulaciones.service';

import { SupervisionPostulacionesReportService } from './supervision-postulaciones-report.service';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface StablishmentFilterOption {
  id: number;
  name: string;
}

type SupervisionAdministrativeAction =
  | 'DELETE'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RESTORE';

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
    MatCheckboxModule,
  ],
  templateUrl: './supervision-postulaciones.component.html',
  styleUrl: './supervision-postulaciones.component.scss',
})
export class SupervisionPostulacionesComponent implements OnInit {
  private supervisionService = inject(SupervisionPostulacionesService);
  private reportService = inject(SupervisionPostulacionesReportService);
  private loader = inject(LoaderService);
  private dialog = inject(MatDialog);

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

  successMessage = '';

  actionInProgressId: number | null = null;

  actionInProgressType: SupervisionAdministrativeAction | null = null;

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

    const selectedStatus = this.normalizeStatus(this.filters.status);

    const request$ =
      selectedStatus === 'DELETED'
        ? this.supervisionService.searchDeleted()
        : this.supervisionService.search();

    request$.subscribe({
      next: (response: any) => {
        this.postulations = this.extractPostulations(response);

        this.buildSummaryCards();

        this.buildStablishmentOptions();

        this.applyFilters();

        console.log('📦 SUPERVISION POSTULATIONS:', {
          selectedStatus,
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
          selectedStatus === 'DELETED'
            ? 'No fue posible cargar las postulaciones eliminadas.'
            : 'No fue posible cargar las postulaciones.';

        this.loading = false;
      },
    });
  }

  onStatusFilterChange(): void {
    this.loadPostulations();
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
        return Boolean(postulation?.id);
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

  isSoftDeleted(postulation: any): boolean {
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

      const status = this.normalizeStatus(postulation.status);

      const matchesSearch =
        !searchText ||
        code.includes(searchText) ||
        rut.includes(searchText) ||
        fullName.includes(searchText) ||
        stablishmentName.includes(searchText);

      const matchesStatus =
        selectedStatus === 'DELETED'
          ? this.isSoftDeleted(postulation)
          : !selectedStatus || status === selectedStatus;

      const matchesStablishment =
        !selectedStablishmentId ||
        Number(postulation.stablishmentId || 0) === selectedStablishmentId;

      return matchesSearch && matchesStatus && matchesStablishment;
    });
  }

  isDeleted(postulation: SupervisionPostulation): boolean {
    return this.isSoftDeleted(postulation);
  }

  private executeRestoreAction(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId) {
      return;
    }

    this.actionInProgressId = postulationId;

    this.actionInProgressType = 'RESTORE';

    this.supervisionService.restorePostulation(postulationId).subscribe({
      next: () => {
        if (Number(this.selectedDetail?.id || 0) === postulationId) {
          this.closeDetail();
        }

        this.finishAdministrativeAction();

        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          disableClose: true,

          data: {
            title: 'Postulación recuperada',

            message:
              `La postulación ${postulation.code || `#${postulationId}`} ` +
              'fue recuperada correctamente.',

            confirmText: 'Aceptar',
            cancelText: '',
            icon: 'restore',
            color: 'primary',
          },
        });

        this.loadPostulations();
      },

      error: (error) => {
        console.error('❌ ERROR RESTORING POSTULATION:', {
          postulationId,
          status: error?.status,
          error,
        });

        this.finishAdministrativeAction();

        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          disableClose: true,

          data: {
            title: 'No fue posible recuperar la postulación',

            message:
              Number(error?.status) === 401 || Number(error?.status) === 403
                ? 'El servidor rechazó la recuperación porque el usuario no cuenta con permisos suficientes.'
                : 'No fue posible recuperar la postulación eliminada.',

            confirmText: 'Aceptar',
            cancelText: '',
            icon: 'warning',
            color: 'warn',
          },
        });
      },
    });
  }

  clearFilters(): void {
    this.filters = {
      searchText: '',
      status: '',
      stablishmentId: '',
    };

    this.loadPostulations();
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
  // 🔥 ADMINISTRACIÓN DE POSTULACIONES
  // Rol requerido en backend: SUPERVISOR_BIENESTAR
  // =========================================================

  canReturnToDraft(status: any): boolean {
    return this.normalizeStatus(status) === 'SUBMITTED';
  }

  canMarkAsSubmitted(status: any): boolean {
    return this.normalizeStatus(status) === 'DRAFT';
  }

  isActionInProgress(postulation: SupervisionPostulation): boolean {
    return (
      this.actionInProgressId !== null &&
      Number(postulation?.id || 0) === this.actionInProgressId
    );
  }

  returnToDraft(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId || this.actionInProgressId !== null) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogYesNoComponent, {
      width: '520px',

      disableClose: true,

      data: {
        title: 'Devolver postulación a borrador',

        message:
          `La postulación ${postulation.code || `#${postulationId}`} ` +
          'volverá al estado BORRADOR. ' +
          'El funcionario podrá corregir la información y adjuntar los documentos faltantes. ' +
          'Posteriormente deberá enviarla nuevamente para continuar con la revisión.',

        yesText: 'Devolver a borrador',

        noText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.executeAdministrativeAction(postulation, 'DRAFT');
      }
    });
  }

  markAsSubmitted(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId || this.actionInProgressId !== null) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogYesNoComponent, {
      width: '520px',

      disableClose: true,

      data: {
        title: 'Marcar postulación como enviada',

        message:
          `La postulación ${postulation.code || `#${postulationId}`} ` +
          'quedará nuevamente en estado ENVIADA. ' +
          'El funcionario dejará de poder modificar sus datos y adjuntar documentos. ' +
          'Verifique previamente que la información y los archivos requeridos estén completos.',

        yesText: 'Marcar como enviada',

        noText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.executeAdministrativeAction(postulation, 'SUBMITTED');
      }
    });
  }

  deletePostulation(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId || this.actionInProgressId !== null) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogYesNoComponent, {
      width: '520px',

      disableClose: true,

      data: {
        title: 'Eliminar postulación',

        message:
          `Está a punto de eliminar la postulación ` +
          `${postulation.code || `#${postulationId}`} de ` +
          `${postulation.userFullName || 'un funcionario'}. ` +
          'La postulación dejará de aparecer en el listado de supervisión. ' +
          'Esta acción debe utilizarse solamente cuando la postulación no corresponda o haya sido creada por error.',

        yesText: 'Eliminar postulación',

        noText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.executeAdministrativeAction(postulation, 'DELETE');
      }
    });
  }

  private executeAdministrativeAction(
    postulation: SupervisionPostulation,
    action: 'DELETE' | 'DRAFT' | 'SUBMITTED',
  ): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId) {
      return;
    }

    this.actionInProgressId = postulationId;

    this.actionInProgressType = action;

    const request$ =
      action === 'DELETE'
        ? this.supervisionService.softDeletePostulation(postulationId)
        : this.supervisionService.changeStatus(postulationId, action);

    request$.subscribe({
      next: () => {
        if (Number(this.selectedDetail?.id || 0) === postulationId) {
          this.closeDetail();
        }

        this.finishAdministrativeAction();

        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          disableClose: true,

          data: {
            title: this.getAdministrativeSuccessTitle(action),

            message: this.getAdministrativeSuccessMessage(postulation, action),

            confirmText: 'Aceptar',
            cancelText: '',
            icon: 'check_circle',
            color: 'primary',
          },
        });

        this.loadPostulations();
      },

      error: (error) => {
        console.error('❌ ERROR ADMINISTRATING POSTULATION:', {
          postulationId,
          action,
          status: error?.status,
          error,
        });

        this.finishAdministrativeAction();

        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          disableClose: true,

          data: {
            title: 'No fue posible completar la acción',

            message: this.getAdministrativeErrorMessage(action, error),

            confirmText: 'Aceptar',
            cancelText: '',
            icon: 'warning',
            color: 'warn',
          },
        });
      },
    });
  }

  private getAdministrativeSuccessTitle(
    action: SupervisionAdministrativeAction,
  ): string {
    if (action === 'DRAFT') {
      return 'Postulación devuelta a borrador';
    }

    if (action === 'SUBMITTED') {
      return 'Postulación marcada como enviada';
    }

    return 'Postulación eliminada';
  }

  private finishAdministrativeAction(): void {
    this.actionInProgressId = null;

    this.actionInProgressType = null;
  }

  private getAdministrativeSuccessMessage(
    postulation: SupervisionPostulation,
    action: SupervisionAdministrativeAction,
  ): string {
    const code = postulation.code || `#${postulation.id}`;

    if (action === 'DRAFT') {
      return `La postulación ${code} fue devuelta a borrador. El funcionario podrá corregir la información y adjuntar los documentos faltantes.`;
    }

    if (action === 'SUBMITTED') {
      return `La postulación ${code} fue marcada nuevamente como enviada. La edición quedó bloqueada para el funcionario.`;
    }

    return `La postulación ${code} fue eliminada correctamente.`;
  }

  private getAdministrativeErrorMessage(
    action: SupervisionAdministrativeAction,
    error: any,
  ): string {
    if (Number(error?.status) === 401) {
      return (
        'El servidor rechazó la operación porque el usuario autenticado ' +
        'no tiene autorización para ejecutar esta acción. ' +
        'Debe habilitarse el permiso correspondiente para el rol ' +
        'SUPERVISOR_BIENESTAR en el backend.'
      );
    }

    if (Number(error?.status) === 403) {
      return (
        'El usuario autenticado no cuenta con permisos suficientes ' +
        'para ejecutar esta acción.'
      );
    }

    if (action === 'DRAFT') {
      return 'No fue posible devolver la postulación a borrador.';
    }

    if (action === 'SUBMITTED') {
      return (
        'No fue posible marcar la postulación como enviada. ' +
        'Verifique que los documentos obligatorios estén completos.'
      );
    }

    return 'No fue posible eliminar la postulación.';
  }

  // =========================================================
  // 🔥 EXCEL-COMPATIBLE EXPORT
  // =========================================================

  // =========================================================
  // 🔥 EXPORTACIÓN EXCEL COMPLETA CON MÚLTIPLES HOJAS
  // =========================================================

  exportFilteredExcel(): void {
    const postulations = this.filteredPostulations.filter(
      (postulation) => !this.isSoftDeleted(postulation),
    );

    if (!postulations.length) {
      this.errorMessage =
        this.filters.status === 'DELETED'
          ? 'Las postulaciones eliminadas no se incluyen en la exportación Excel.'
          : 'No existen postulaciones activas para exportar.';

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

  restorePostulation(postulation: SupervisionPostulation): void {
    const postulationId = Number(postulation?.id || 0);

    if (!postulationId || this.actionInProgressId !== null) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogYesNoComponent, {
      width: '520px',

      disableClose: true,

      data: {
        title: 'Recuperar postulación eliminada',

        message:
          `La postulación ${postulation.code || `#${postulationId}`} ` +
          'será recuperada y volverá al estado BORRADOR. ' +
          'El funcionario podrá revisar los antecedentes, realizar correcciones ' +
          'y adjuntar los documentos faltantes antes de enviarla nuevamente.',

        yesText: 'Recuperar postulación',

        noText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.executeRestoreAction(postulation);
      }
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

  canDelete(postulation: SupervisionPostulation): boolean {
    return !this.isSoftDeleted(postulation);
  }

  canRestore(postulation: SupervisionPostulation): boolean {
    return this.isSoftDeleted(postulation);
  }

  getPostulationStatusLabel(postulation: SupervisionPostulation): string {
    if (this.isSoftDeleted(postulation)) {
      return 'Eliminada';
    }

    return this.getStatusLabel(postulation.status);
  }

  getPostulationStatusClass(postulation: SupervisionPostulation): string {
    if (this.isSoftDeleted(postulation)) {
      return 'status-deleted';
    }

    return this.getStatusClass(postulation.status);
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

    if (normalizedStatus === 'DELETED') {
      return 'Eliminada';
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

    if (normalizedStatus === 'DELETED') {
      return 'status-deleted';
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

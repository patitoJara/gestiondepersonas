import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import html2pdf from 'html2pdf.js';
import { FormArray } from '@angular/forms';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { AcademicBackgroundRequest } from '../postulacion-estudios/models/academic-background-request.model';
import { TypeProperty } from '@app/core/models/type-property.model';
import { TypeHousing } from '@app/core/models/type-housing.model';
import { Study } from '@app/core/models/study.model';
import { Stablishment } from '@app/core/models/stablishment.model';
import { Prevition } from '@app/core/models/prevition.model';
import { ParentType } from '@app/core/models/parent-type.model';
import { ContractType } from '@app/core/models/contract-type.model';
import { CivilState } from '@app/core/models/civil-state.model';
import { BillType } from '@app/core/models/bill-type.model';
import { Activity } from '@app/core/models/activity.model';
import { WorkPlace } from '@app/core/models/work-place.model';
import { Grade } from '@app/core/models/grade.model';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { firstValueFrom, timeout } from 'rxjs';
import { TokenService } from '@app/core/services/token.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { WellbeingPostulationService } from './services/wellbeing-postulation.service';
import { WellbeingCatalogsService } from './services/wellbeing-catalogs.service';
import { WellbeingDocumentsService } from './services/wellbeing-documents.service';
import { WellbeingWorkflowService } from './services/wellbeing-workflow.service';
import { WellbeingReportService } from './services/wellbeing-report.service';
import { WellbeingMapperService } from './services/wellbeing-mapper.service';
import { WellbeingStorageService } from './services/wellbeing-storage.service';
import { WellbeingStateService } from './services/wellbeing-state.service';
import { WellbeingValidationService } from './services/wellbeing-validation.service';
import { WellbeingErrorService } from './services/wellbeing-error.service';
import { WellbeingFormatService } from './services/wellbeing-format.service';
import { WellbeingCalculationService } from './services/wellbeing-calculation.service';
import { WellbeingStepService } from './services/wellbeing-step.service';
import { WellbeingDateService } from './services/wellbeing-date.service';
import { WellbeingPermissionService } from './services/wellbeing-permission.service';
import { WellbeingFileService } from './services/wellbeing-file.service';

import { WellbeingAutosaveService } from './services/wellbeing-autosave.service';
import { WellbeingSummaryService } from './services/wellbeing-summary.service';
import { WellbeingFormService } from './services/wellbeing-form.service';
import { BeneficiaryRequest } from './models/beneficiary-request.model';
import { DocumentTypeResponse } from './models/document-type-response.model';
import { WellbeingLoadingService } from './services/wellbeing-loading.service';
import { PostulationResumeDialogComponent } from '../postulacion-estudios/postulation-resume-dialog.component';
import { EmailService } from '../../../../core/services/email.service';

interface Step {
  id: number;
  title: string;
}
interface Documento {
  key: string;
  label: string;
  open: boolean;
  help?: string;
}

interface DocumentoOpcional {
  key: string;
  label: string;
  open: boolean;
  help?: string;
}

interface Familiar {
  id: number;

  // =====================================
  // 🔥 BACKEND
  // =====================================

  backendId?: number;

  // =====================================
  // 🔥 BASIC
  // =====================================

  rut: string;

  nombre: string;

  apellido: string;

  parentTypeId?: number;

  civilStateId?: number;

  activityId?: number | null;
  othersActivities?: string;

  workPlaceId?: number | null;
  othersWorkplaces?: string;

  studyId?: number;

  previtionId?: number;

  estudiaRegion?: string;

  open?: boolean;

  birthDate?: string | null;

  // =====================================
  // 🔥 NUEVOS FLAGS
  // =====================================

  titular?: boolean;

  existsInUsers?: boolean;

  mustCreatePassive?: boolean;

  source?: 'AUTH' | 'USERS' | 'MANUAL';

  searching?: boolean;

  notFound?: boolean;

  isComplete?: boolean;

  incomeTypeId?: number;
  monthlyIncome?: number;
  student?: boolean;
  studyPlace?: string;
}

interface Salud {
  id: number;
  nombre: string;
  familiarId?: number | null;
  patologia: string;
  gasto: number;
  open?: boolean;
}

// 🔹 INTERFAZ (opcional pero pro)
interface OtroGasto {
  glosa: string;
  monto: number;
  open: boolean;
}

interface VerificacionAcademica {
  tipo: string;
  promedio: number | null;
  aprobacion: number | null;
}

interface IngresoFamiliar {
  familiarId: number | null; // 🔥 CLAVE
  monto: number;
  open: boolean;
}

@Component({
  selector: 'app-postulation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './postulation-form.component.html',
  styleUrl: './postulation-form.component.scss',
})
export class PostulationFormComponent {
  @ViewChild('fileInputExtra') fileInputExtra!: ElementRef;
  private emailService = inject(EmailService);

  comprobantePdfFile: File | null = null;
  openingPostulation = false;
  private pendingPostulationToOpen: number | null = null;

  form: FormGroup;
  studies: Study[] = [];
  stablishments: Stablishment[] = [];
  previtions: Prevition[] = [];
  parentTypes: ParentType[] = [];
  contractTypes: ContractType[] = [];
  civilStates: CivilState[] = [];
  billTypes: BillType[] = [];
  activities: Activity[] = [];
  workPlaces: WorkPlace[] = [];
  typesHousing: TypeHousing[] = [];
  typesProperties: TypeProperty[] = [];
  grades: Grade[] = [];

  activeIndex: number | null = null;
  salud: Salud[] = [];
  tipoPostulante: 'afiliado' | 'familiar' = 'afiliado';

  today = new Date();

  codigoPostulacion = 'POST-' + Date.now();
  comentario: string = '';

  loadingAffiliate = false;

  academico = {
    institucion: '',
    carrera: '',
    studyId: null as number | null,
    semestre: null as number | null,
    duracion: null as number | null,
    region: '',
  };

  ingresosFamiliares: IngresoFamiliar[] = [
    {
      familiarId: null, // ✔ valor, no tipo
      monto: 0,
      open: true,
    },
  ];

  // 🔥 STEPPER
  steps = [
    { id: 1, title: 'Datos Afiliado', valid: false, error: false },
    { id: 2, title: 'Grupo Familiar', valid: false, error: false },
    { id: 3, title: 'Postulante', valid: false, error: false },
    { id: 4, title: 'Académicos', valid: false, error: false },
    { id: 5, title: 'Verificación', valid: false, error: false },
    { id: 6, title: 'Ingresos', valid: false, error: false },
    { id: 7, title: 'Gastos', valid: false, error: false },
    { id: 8, title: 'Salud/Vivienda', valid: false, error: false },
    { id: 9, title: 'Documentos', valid: false, error: false },
    { id: 10, title: 'Confirmación', valid: false, error: false },
    { id: 11, title: 'Finalizado', valid: false, error: false },
  ];

  camposGastosEducacion = [
    { label: 'Matrícula', key: 'matricula' },
    { label: 'Mensualidad', key: 'mensualidad' },
    { label: 'Alojamiento', key: 'alojamiento' },
  ];

  camposGastosBasicos = [
    { label: 'Arriendo / Dividendo', key: 'arriendo' },
    { label: 'Luz', key: 'luz' },
    { label: 'Agua', key: 'agua' },
    { label: 'Gas', key: 'gas' },
    { label: 'Teléfono', key: 'telefonoGasto' },
    { label: 'Créditos', key: 'creditos' },
  ];

  // 🔹 LISTA
  otrosGastos: OtroGasto[] = [{ glosa: '', monto: 0, open: true }];
  grupoFamiliar: Familiar[] = [];

  currentStep = 1;

  // 🔥 ARCHIVOS
  filesObligatorios: Record<string, File[]> = {};
  filesOpcionales: Record<string, File[]> = {};

  // Documentos ya registrados en backend. No son objetos File, porque el navegador no permite reconstruir archivos físicos
  // desde metadata. Se usan para precargar visualmente el Step 9 y para validar obligatorios ya guardados.
  uploadedDocumentsByKey: Record<string, any[]> = {};

  documentTypes: DocumentTypeResponse[] = [];
  private uploadedDocumentFingerprints = new Set<string>();

  private readonly documentTypeCodeByKey: Record<string, string> = {
    cedula: 'ID_POSTULANTE',
    alumno: 'ALUMNO_REGULAR',
    notas2025: 'NOTAS_ANIO',
    notasMedia: 'NOTAS_MEDIA_PRIMER_ANIO',
    arancel: 'DEUDA_ARANCEL',
    becas: 'BECAS_BENEFICIOS',
    modalidad: 'MODALIDAD_ESTUDIOS',
    liquidaciones: 'LIQUIDACIONES_SUELDO_GRUPO',
    pensiones: 'COMPROBANTE_PENSIONES',
    sii: 'CARPETA_TRIBUTARIA',
    cesantia: 'FINIQUITO_CESANTIA',
    alimentos: 'RESOLUCION_PENSION_ALIMENTOS',
    gastos: 'GASTOS_GRUPO_FAMILIAR',
    medicos: 'CERTIFICADOS_MEDICOS',
    catastroficas: 'GASTOS_ENFERMEDADES',
    divorcio: 'CERTIFICADO_DIVORCIO_CONVIVENCIA',
    otros: 'OTRO',
  };

  documentosObligatorios: Documento[] = [
    {
      key: 'cedula',
      label: 'Fotocopia de cédula de identidad del postulante',
      open: false,
    },
    {
      key: 'alumno',
      label: 'Certificado de alumno regular vigente',
      open: false,
    },
    { key: 'notas2025', label: 'Certificado de notas año 2025', open: false },
    {
      key: 'notasMedia',
      label: 'Certificado de notas enseñanza media (solo primer año)',
      open: false,
    },
    {
      key: 'arancel',
      label: 'Certificado de deuda o pago de arancel del año academico',
      open: false,
    },
    {
      key: 'becas',
      label: 'Certificado de becas o beneficios educacionales',
      open: false,
    },
    {
      key: 'modalidad',
      label: 'Certificado modalidad de estudios (online/presencial)',
      open: false,
    },
  ];

  documentosOpcionales: DocumentoOpcional[] = [
    {
      key: 'liquidaciones',
      label: 'Liquidaciones de sueldo grupo familiar',
      open: true,
    },
    {
      key: 'pensiones',
      label: 'Comprobantes de pago de pensiones',
      open: false,
    },
    {
      key: 'sii',
      label:
        'Carpeta tributaria SII (12 meses) para trabajadores independientes.',
      help: 'Documento que acredita becas, gratuidad o beneficios entregados por la institución.',
      open: false,
    },
    { key: 'cesantia', label: 'Finiquito o cesantía', open: false },
    { key: 'alimentos', label: 'Resolución pensión de alimentos', open: false },
    {
      key: 'gastos',
      label: 'Gastos del grupo familiar.',
      help: 'arriendo o dividendo, servicios básicos, gastos educacionales, créditos bancarios, gastos médicos permanentes.',
      open: false,
    },
    {
      key: 'medicos',
      label:
        'Certificados médicos en caso de enfermedades de integrantes del grupo familiar',
      open: false,
    },
    {
      key: 'catastroficas',
      label: 'Gastos enfermedades catastróficas o permanentes',
      open: false,
    },
    {
      key: 'divorcio',
      label: 'Certificado de divorcio o cese de convivencia',
      open: false,
    },
    {
      key: 'otros',
      label: 'Otro Documento',
      open: false,
    },
  ];

  sexos = [
    { id: 1, name: 'Masculino' },
    { id: 2, name: 'Femenino' },
  ];

  tiposPostulante = [
    { id: 1, name: 'Titular' },
    { id: 2, name: 'Pasivo' },
  ];

  establecimientos: any[] = [
    {
      id: 1,
      name: 'DSSM',
    },
    {
      id: 2,
      name: 'Hospital Clínico Magallanes',
    },
    {
      id: 3,
      name: 'Hospital Dr. Augusto Essmann Burgos',
    },
    {
      id: 4,
      name: 'Hospital Comunitario Cristina Calderon',
    },
    {
      id: 5,
      name: 'Hospital Dr. Marco Chamorro',
    },
    {
      id: 6,
      name: 'Otro',
    },
  ];

  tipoPostul: any[] = [
    {
      id: 1,
      name: 'Activo',
    },
    {
      id: 2,
      name: 'Pasivo',
    },
  ];

  // =====================================
  // 🔥 TIPO AFILIADO
  // =====================================

  tiposAfiliado = [
    {
      id: 1,
      name: 'ACTIVO',
    },
    {
      id: 2,
      name: 'PASIVO',
    },
  ];

  tiposEstudio = [
    {
      id: 1,
      name: 'Técnico Profesional',
    },
    {
      id: 2,
      name: 'Universitario',
    },
    {
      id: 3,
      name: 'Postgrado',
    },
  ];

  // =====================================
  // 🔥 CALIDAD CONTRACTUAL
  // =====================================

  calidadesContractuales = [
    {
      id: 1,
      name: 'PLANTA',
    },
    {
      id: 2,
      name: 'CONTRATA',
    },
    {
      id: 3,
      name: 'HONORARIOS',
    },
    {
      id: 4,
      name: 'SUPLENTE',
    },
    {
      id: 5,
      name: 'NO APLICA',
    },
  ];

  // =====================================
  // 🔥 BENEFICIARIO
  // =====================================

  tiposBeneficiario = [
    {
      id: 1,
      name: 'AFILIADO',
    },
    {
      id: 2,
      name: 'MIEMBRO DE LA FAMILIA',
    },
  ];

  postulanteSeleccionado: any = null;

  loggedUser: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private wellbeingPostulationService: WellbeingPostulationService,
    private wellbeingCatalogsService: WellbeingCatalogsService,
    private wellbeingDocumentsService: WellbeingDocumentsService,
    private wellbeingWorkflowService: WellbeingWorkflowService,
    private wellbeingReportService: WellbeingReportService,
    private wellbeingMapperService: WellbeingMapperService,
    private wellbeingStorageService: WellbeingStorageService,
    private wellbeingStateService: WellbeingStateService,
    private wellbeingValidationService: WellbeingValidationService,
    private wellbeingErrorService: WellbeingErrorService,
    private wellbeingFormatService: WellbeingFormatService,
    private wellbeingCalculationService: WellbeingCalculationService,
    private wellbeingStepService: WellbeingStepService,
    private wellbeingDateService: WellbeingDateService,
    private wellbeingPermissionService: WellbeingPermissionService,
    private wellbeingFileService: WellbeingFileService,
    private wellbeingAutosaveService: WellbeingAutosaveService,
    private wellbeingSummaryService: WellbeingSummaryService,
    private wellbeingFormService: WellbeingFormService,
    private usersService: UsersService,
    private tokenService: TokenService,
    public loader: WellbeingLoadingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.form = this.fb.group({
      nombre: [''], // antes: ['', Validators.required]
      apellido: [''],
      rut: [''],
      telefono: [''],
      email: [''], // antes: ['', [Validators.required, Validators.email]]
      direccion: [''],
      planta: [''],
      grado: [null],
      fechaNacimiento: [null],
      establecimiento: [''],
      sexo: [''],
      previtionId: [null],

      tipoAfiliado: [null],

      calidadContractual: [null],

      tipoVivienda: [null],
      tipoPropiedad: [null],
      infoVivienda: [''],
      otrosAntecedentes: [''],

      fechaAfiliacion: [null],
      esPostulante: ['si'],
      beneficiado: ['no'],
      hogarMonoparental: [false],

      ingresoJefe: [null],
      ingresoOtros: [0],
      otrosIngresos: [0],

      arriendo: [0],
      luz: [0],
      agua: [0],
      gas: [0],
      telefonoGasto: [0],
      creditos: [0],
      matricula: [0],
      mensualidad: [0],
      alojamiento: [0],

      typePropertyId: [null],
      typeHousingId: [null],
      stablishmentId: [null],

      tipoBeneficiario: [''],
      familiarId: [null],
    });
  }

  postulationId: number | null = null;
  summary: any = null;
  isSaving = false;
  isSubmitted = false;
  isFinalizing = false;
  isLoading = false;
  showPostulationForm = false;

  // Lista de postulaciones del usuario para poder elegir entre borrador y enviada.
  // Importante: id = postulationId, no userId.
  availablePostulations: any[] = [];
  selectedPostulationViewId: number | null = null;

  afiliadoValido = false;
  afiliado: any = null;

  tipoSolicitante: string = '';
  comentario_postulante?: string;

  verificacion: VerificacionAcademica = {
    tipo: '',
    promedio: null,
    aprobacion: null,
  };

  estudiaenlaRegion = ['Si', 'No'];

  /* ---------------------------------------------------------------------------------------------------
                                            ngOnInit() {
  ------------------------------------------------------------------------------------------------------*/

  async ngOnInit() {
    try {
      this.loader.show();

      // =====================================
      // 🔥 USUARIO LOGEADO
      // =====================================

      this.loggedUser = this.tokenService.getUserProfile();

      console.log('👤 LOGGED USER:', this.loggedUser);

      // =====================================
      // 🔥 CATALOGOS
      // =====================================

      await this.loadCatalogs();

      console.log('🚀 WELLBEING MODULE READY');

      // =====================================
      // 🔥 NUEVO INICIO CONTROLADO
      // NO USA startWorkflow()
      // NO ABRE ENVIADAS AUTOMATICAMENTE
      // NO CREA NUEVA AUTOMATICAMENTE
      // =====================================

      await this.prepareInitialFormEntry();
    } catch (e) {
      console.error('❌ INIT ERROR:', e);

      this.showError('Error cargando el formulario');
    } finally {
      this.isLoading = false;
      this.openingPostulation = false;

      this.loader.hide();

      setTimeout(() => {
        this.loader.hide();

        console.log('🔓 INIT FINALIZADO - LOADER OFF', {
          loaderOverlay: document.querySelectorAll('.loader-overlay').length,
          postulationId: this.postulationId,
          currentStep: this.currentStep,
          selectedPostulationViewId: this.selectedPostulationViewId,
          availablePostulations: this.availablePostulations.length,
        });
      }, 300);
    }
  }

  /*
  async ngOnInit() {
    try {
      this.loader.show();

      this.loggedUser = this.tokenService.getUserProfile();

      await this.loadCatalogs();

      console.log('🚀 WELLBEING MODULE READY');

      await this.startWorkflow();
    } catch (e) {
      console.error('❌ INIT ERROR:', e);

      this.showError('Error cargando el formulario');
    } finally {
      this.isLoading = false;
      this.openingPostulation = false;

      this.loader.hide();

      setTimeout(() => {
        this.loader.hide();

        console.log('🔓 INIT FINALIZADO - LOADER OFF', {
          loaderOverlay: document.querySelectorAll('.loader-overlay').length,
        });
      }, 300);
    }
  }
*/
  /* ---------------------------------------------------------------------------------------------------
                        FIN ngOnInit() {
  ------------------------------------------------------------------------------------------------------*/

  // =========================================================
  // 🔥 NUEVO INICIO CONTROLADO DEL FORMULARIO
  // =========================================================

  private async prepareInitialFormEntry(): Promise<void> {
    console.log('🧭 PREPARE INITIAL FORM ENTRY');

    const { drafts, active } = await this.loadInitialPostulationLists();

    this.availablePostulations = this.mergePostulationLists(drafts, active);

    console.log(
      '📦 INITIAL AVAILABLE POSTULATIONS:',
      this.availablePostulations,
    );

    // =====================================
    // 🔥 AL ENTRAR NO SE ABRE NADA AUTOMÁTICO
    // =====================================

    this.showPostulationForm = false;
    this.selectedPostulationViewId = null;
    this.postulationId = null;
    this.currentStep = 1;
    this.isSubmitted = false;

    console.log('📌 ESPERANDO ACCIÓN DEL USUARIO EN MIS POSTULACIONES');
  }

  async openSelectedPostulationByUserAction(): Promise<void> {
    if (!this.selectedPostulationViewId) {
      this.showWarning('Seleccione una postulación');
      return;
    }

    await this.openPostulationFromSelector(
      Number(this.selectedPostulationViewId),
    );

    this.showPostulationForm = true;
  }

  async startNewPostulationFromSelector(): Promise<void> {
    try {
      this.loader.show();

      console.log('🆕 NUEVA POSTULACIÓN DESDE MIS POSTULACIONES');

      this.clearPostulationSession();

      this.isSubmitted = false;
      this.summary = null;
      this.postulationId = null;
      this.selectedPostulationViewId = null;
      this.codigoPostulacion = '';
      this.currentStep = 1;

      await this.prepareNewBaseFormFromUsers();

      this.showPostulationForm = true;
    } catch (e) {
      console.error('❌ ERROR INICIANDO NUEVA POSTULACIÓN:', e);
      this.showError('No fue posible iniciar una nueva postulación');
    } finally {
      this.loader.hide();
    }
  }

  // =========================================================
  // 🔥 CARGAR LISTAS INICIALES
  // =========================================================

  private async loadInitialPostulationLists(): Promise<{
    drafts: any[];
    active: any[];
  }> {
    let drafts: any[] = [];
    let active: any[] = [];

    try {
      drafts = await firstValueFrom(
        this.wellbeingPostulationService.getMyDrafts(),
      );
    } catch (draftError) {
      console.warn('⚠️ No fue posible consultar borradores', draftError);
      drafts = [];
    }

    try {
      const response: any = await firstValueFrom(
        this.wellbeingPostulationService.getMyActive(),
      );

      active = Array.isArray(response) ? response : [];
    } catch (activeError) {
      console.warn(
        '⚠️ No fue posible consultar postulaciones enviadas/activas',
        activeError,
      );

      active = [];
    }

    return { drafts, active };
  }

  // =========================================================
  // 🔥 FORMULARIO BASE DESDE USERS
  // SOLO CUANDO NO HAY DRAFT
  // =========================================================

  private async prepareNewBaseFormFromUsers(): Promise<void> {
    // =====================================
    // 🔥 LIMPIAR SESION DE POSTULACION
    // IMPORTANTE: NO CREA POSTULACION NUEVA
    // =====================================

    this.clearPostulationSession();

    this.isSubmitted = false;
    this.summary = null;
    this.postulationId = null;
    this.selectedPostulationViewId = null;
    this.codigoPostulacion = '';
    this.currentStep = 1;

    // =====================================
    // 🔥 CARGAR SOLO DATOS BASE DESDE USERS
    // =====================================

    await this.loadLoggedAffiliate();

    // =====================================
    // 🔥 CREAR/SINCRONIZAR TITULAR EN STEP 2
    // =====================================

    this.syncAffiliateToFamily();

    // =====================================
    // 🔥 GUARDAR STEP INICIAL LOCAL
    // =====================================

    this.wellbeingStorageService.saveCurrentStep(this.currentStep);

    console.log('✅ FORMULARIO BASE LISTO DESDE USERS:', {
      postulationId: this.postulationId,
      currentStep: this.currentStep,
      grupoFamiliar: this.grupoFamiliar.length,
      availablePostulations: this.availablePostulations.length,
    });
  }

  // =========================================================
  // 🔥 START WORKFLOW
  // =========================================================

  private async startWorkflow() {
    try {
      console.log('🚀 START WORKFLOW');

      await this.checkDraftPostulation();
    } catch (e) {
      console.error('❌ START WORKFLOW ERROR:', e);

      this.showError('Error iniciando workflow');
    }
  }

  // =========================================================
  // 🔒 ACTIVE DRAFT GUARD
  // =========================================================

  private clearPostulationSession(): void {
    this.postulationId = null;
    this.codigoPostulacion = '';
    this.summary = null;
    this.wellbeingStorageService.clearAll();
    localStorage.removeItem('wellbeing_workflow');
  }

  private isSoftDeletedPostulation(postulation: any): boolean {
    return Boolean(
      postulation?.deletedAt ||
      postulation?.deleted_at ||
      postulation?.deletedDate ||
      postulation?.deleted,
    );
  }

  /**
   * Selecciona el borrador más avanzado y reciente.
   * Evita retomar borradores vacíos creados accidentalmente por llamadas repetidas a /start.
   */
  private selectBestDraft(drafts: any[] = []): any | null {
    const activeDrafts = (drafts || []).filter(
      (draft: any) => draft?.id && !this.isSoftDeletedPostulation(draft),
    );

    if (!activeDrafts.length) {
      return null;
    }

    return activeDrafts.sort((a: any, b: any) => {
      const stepDiff = Number(b.currentStep || 1) - Number(a.currentStep || 1);
      if (stepDiff !== 0) return stepDiff;

      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;

      return Number(b.id || 0) - Number(a.id || 0);
    })[0];
  }

  private async ensureActiveDraft(): Promise<number> {
    if (this.postulationId) {
      try {
        const current: any = await firstValueFrom(
          this.wellbeingPostulationService.getMyPostulation(this.postulationId),
        );

        if (this.isSoftDeletedPostulation(current)) {
          throw new Error('La postulación activa está eliminada lógicamente');
        }

        return this.postulationId;
      } catch (error) {
        console.warn(
          '⚠️ Postulación activa inválida o eliminada. Se buscará un borrador activo.',
          error,
        );
        this.clearPostulationSession();
      }
    }

    const drafts: any[] = await firstValueFrom(
      this.wellbeingPostulationService.getMyDrafts(),
    );

    const bestDraft = this.selectBestDraft(drafts);
    if (bestDraft) {
      await this.handleContinueDraft(bestDraft);
      if (this.postulationId) return this.postulationId;
    }

    await this.createPostulation(false);

    if (!this.postulationId) {
      throw new Error('No fue posible crear una postulación activa');
    }

    return this.postulationId;
  }

  // =========================================================
  // 🔥 CHECK DRAFT POSTULATION
  // =========================================================
  async checkDraftPostulation() {
    try {
      console.log('🔥 CHECKING WELLBEING POSTULATIONS...');

      const drafts: any[] = await firstValueFrom(
        this.wellbeingPostulationService.getMyDrafts(),
      );

      let active: any[] = [];
      try {
        const response: any = await firstValueFrom(
          this.wellbeingPostulationService.getMyActive(),
        );
        active = Array.isArray(response) ? response : [];
      } catch (activeError) {
        console.warn(
          '⚠️ No fue posible consultar postulaciones activas/enviadas',
          activeError,
        );
      }

      this.availablePostulations = this.mergePostulationLists(drafts, active);
      console.log('📦 AVAILABLE POSTULATIONS:', this.availablePostulations);

      const bestDraft = this.selectBestDraft(drafts);

      // Si hay borrador activo, se retoma por defecto para que el usuario pueda seguir editándolo.
      if (bestDraft) {
        console.log('♻️ Retomando borrador activo:', bestDraft);
        await this.openPostulationFromSelector(Number(bestDraft.id));
        return;
      }

      // Si no hay borrador, pero hay una postulación enviada/activa, se muestra en modo lectura / Step 11.
      const bestSubmitted = this.selectBestSubmittedOrActive(
        this.availablePostulations,
      );
      if (bestSubmitted) {
        console.log('📄 Cargando postulación enviada/activa:', bestSubmitted);
        await this.openPostulationFromSelector(Number(bestSubmitted.id));
        return;
      }

      // Solo si no existe nada, crear un nuevo borrador.
      this.clearPostulationSession();
      await this.handleNewPostulation();
    } catch (e) {
      console.error('❌ ERROR CHECK POSTULATIONS:', e);
      this.showError('Error verificando postulaciones');
    }
  }

  private mergePostulationLists(...lists: any[][]): any[] {
    const map = new Map<number, any>();

    for (const list of lists) {
      for (const item of list || []) {
        const id = Number(item?.id || 0);
        if (!id || this.isSoftDeletedPostulation(item)) {
          continue;
        }
        map.set(id, { ...(map.get(id) || {}), ...item });
      }
    }

    return Array.from(map.values()).sort((a: any, b: any) => {
      const rank = (p: any) => {
        const status = String(p?.status || '').toUpperCase();
        if (status === 'DRAFT') return 1;
        if (status === 'OBSERVED') return 2;
        if (status === 'SUBMITTED') return 3;
        if (status === 'UNDER_REVIEW') return 4;
        return 9;
      };

      const rankDiff = rank(a) - rank(b);
      if (rankDiff !== 0) return rankDiff;

      const stepDiff = Number(b.currentStep || 1) - Number(a.currentStep || 1);
      if (stepDiff !== 0) return stepDiff;

      const dateA = new Date(
        a.updatedAt || a.createdAt || a.submittedAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.createdAt || b.submittedAt || 0,
      ).getTime();
      if (dateB !== dateA) return dateB - dateA;

      return Number(b.id || 0) - Number(a.id || 0);
    });
  }

  private selectBestSubmittedOrActive(postulations: any[] = []): any | null {
    const candidates = (postulations || []).filter((p: any) => {
      const status = String(p?.status || '').toUpperCase();
      return (
        p?.id &&
        !this.isSoftDeletedPostulation(p) &&
        ['SUBMITTED', 'UNDER_REVIEW', 'OBSERVED'].includes(status)
      );
    });

    if (!candidates.length) {
      return null;
    }

    return candidates.sort((a: any, b: any) => {
      const dateA = new Date(
        a.submittedAt || a.updatedAt || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.submittedAt || b.updatedAt || b.createdAt || 0,
      ).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.id || 0) - Number(a.id || 0);
    })[0];
  }

  async openPostulationFromSelector(
    postulationId: number | string,
  ): Promise<void> {
    const id = Number(postulationId);

    if (!id) {
      return;
    }

    // =====================================
    // 🔥 SI YA ESTÁ CARGANDO UNA,
    // GUARDAR LA ÚLTIMA SELECCIÓN
    // =====================================

    if (this.openingPostulation) {
      console.warn('⏳ OPEN POSTULATION EN PROCESO, SE DEJA PENDIENTE:', id);

      this.pendingPostulationToOpen = id;

      return;
    }

    // =====================================
    // 🔥 SI YA ESTÁ CARGADA, NO REPETIR
    // IMPORTANTE:
    // YA NO FORZAMOS DRAFT A STEP 1 AQUÍ
    // =====================================

    if (Number(this.postulationId) === id && this.summary) {
      console.log('ℹ️ Postulación ya cargada, no se vuelve a abrir:', id);

      return;
    }

    try {
      this.openingPostulation = true;
      this.isLoading = true;

      console.log('📂 OPEN POSTULATION:', id);

      const summary: any = await firstValueFrom(
        this.wellbeingPostulationService.getSummary(id),
      );

      const postulation = summary?.postulation || summary;

      if (!postulation?.id) {
        throw new Error('La respuesta summary no contiene postulación válida');
      }

      const status = String(postulation.status || '').toUpperCase();

      this.postulationId = Number(postulation.id);
      this.selectedPostulationViewId = this.postulationId;
      this.codigoPostulacion = postulation.code || '';

      this.isSubmitted = ['SUBMITTED', 'UNDER_REVIEW'].includes(status);

      this.summary = summary;

      // =====================================
      // 🔥 RESTAURAR DESDE SUMMARY / DASH
      // =====================================

      console.log('♻️ RESTORE FULL STATE START:', {
        id: this.postulationId,
        status,
      });

      this.restoreFullStateFromSummary(summary);

      console.log('♻️ RESTORE FULL STATE OK');

      // =====================================
      // 🔥 RESPALDO USERS
      // =====================================

      const shouldLoadUsersBackup =
        status === 'DRAFT' ||
        status === 'OBSERVED' ||
        status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW';

      if (shouldLoadUsersBackup) {
        console.log('👤 LOAD LOGGED AFFILIATE BACKUP START');

        this.loadLoggedAffiliate({ onlyEmpty: true })
          .then(() => {
            console.log('👤 LOAD LOGGED AFFILIATE BACKUP OK');

            // 🔥 Solo sincroniza familia si es editable.
            // Enviadas solo completan visualmente datos vacíos.
            if (!this.isSubmitted && this.grupoFamiliar.length === 0) {
              this.syncAffiliateToFamily();
            }
          })
          .catch((e) => {
            console.warn(
              '⚠️ No fue posible cargar users como respaldo. Se mantiene summary.',
              e,
            );
          });
      }

      // =====================================
      // 🔥 STEP
      // =====================================

      if (status === 'DRAFT') {
        // =====================================
        // 🔥 BORRADOR:
        // AL ABRIR DESDE MIS POSTULACIONES,
        // PARTE EN STEP 1 PARA REVISAR
        // =====================================

        this.isSubmitted = false;
        this.currentStep = 1;
      } else if (status === 'OBSERVED') {
        this.isSubmitted = false;
        this.currentStep = Number(postulation.currentStep || 1);
      } else if (
        status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW' ||
        status === 'CLOSED' ||
        status === 'FINALIZED'
      ) {
        this.isSubmitted = true;
        this.currentStep = 11;
      } else {
        this.isSubmitted = false;
        this.currentStep = Number(postulation.currentStep || 1);
      }

      // =====================================
      // 🔥 STORAGE
      // =====================================

      this.wellbeingStorageService.savePostulationId(this.postulationId);
      this.wellbeingStorageService.saveCurrentStep(this.currentStep);

      this.saveWorkflow();

      // =====================================
      // 🚨 IMPORTANTE:
      // SE ELIMINÓ EL BLOQUE FINAL QUE VOLVÍA
      // A FORZAR EL DRAFT A STEP 1.
      // =====================================

      console.log('✅ POSTULATION OPENED:', {
        id: this.postulationId,
        status,
        currentStep: this.currentStep,
        isSubmitted: this.isSubmitted,
      });

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });
      }, 0);
    } catch (e) {
      console.error('❌ ERROR OPEN POSTULATION:', e);

      this.showError('No fue posible cargar la postulación seleccionada');
    } finally {
      this.isLoading = false;
      this.openingPostulation = false;

      // =====================================
      // 🔥 MATAR SPINNER / LOADER VISUAL
      // =====================================

      this.loader.hide();

      setTimeout(() => {
        this.loader.hide();

        console.log('🔓 OPEN POSTULATION FINALIZADO:', {
          isLoading: this.isLoading,
          openingPostulation: this.openingPostulation,
          postulationId: this.postulationId,
          currentStep: this.currentStep,
          isSubmitted: this.isSubmitted,
          loaderOverlay: document.querySelectorAll('.loader-overlay').length,
          cdkBackdrop: document.querySelectorAll('.cdk-overlay-backdrop')
            .length,
          cdkPane: document.querySelectorAll('.cdk-overlay-pane').length,
        });
      }, 300);

      // =====================================
      // 🔥 SI EL USUARIO CAMBIÓ OTRA VEZ
      // MIENTRAS CARGABA, ABRIR LA ÚLTIMA
      // =====================================

      const pendingId = this.pendingPostulationToOpen;

      this.pendingPostulationToOpen = null;

      if (pendingId && pendingId !== Number(this.postulationId)) {
        console.log('🔁 ABRIENDO POSTULACIÓN PENDIENTE:', pendingId);

        setTimeout(() => {
          this.openPostulationFromSelector(pendingId);
        }, 0);
      }
    }
  }

  getPostulationOptionLabel(postulation: any): string {
    const id = postulation?.id ?? '-';

    const code = postulation?.code || `Postulación ${id}`;

    const status = String(postulation?.status || '').toUpperCase();

    const step = Number(postulation?.currentStep || 1);

    const fecha =
      postulation?.updatedAt ||
      postulation?.createdAt ||
      postulation?.submittedAt;

    const fechaTexto = fecha ? ` · ${this.formatFechaVisual(fecha)}` : '';

    if (status === 'DRAFT') {
      return `Borrador editable #${id} · Revisar desde el inicio · ${code}${fechaTexto}`;
    }

    if (status === 'SUBMITTED') {
      return `Enviada #${id} · Solo lectura · ${code}${fechaTexto}`;
    }

    if (status === 'UNDER_REVIEW') {
      return `En revisión #${id} · Solo lectura · ${code}${fechaTexto}`;
    }

    if (status === 'OBSERVED') {
      return `Observada #${id} · Corregir desde paso ${step} · ${code}${fechaTexto}`;
    }

    if (status === 'CLOSED' || status === 'FINALIZED') {
      return `Cerrada #${id} · Descargar copia · ${code}${fechaTexto}`;
    }

    return `${status || 'Postulación'} #${id} · ${code}${fechaTexto}`;
  }

  getSelectedPostulationStatus(): string {
    const selected = this.availablePostulations.find(
      (p: any) => Number(p.id) === Number(this.selectedPostulationViewId),
    );
    return String(selected?.status || '').toUpperCase();
  }

  // =========================================================
  // 🔥 HANDLE DRAFT ACTION
  // =========================================================

  private async handleDraftAction(result: any) {
    switch (result?.action) {
      // =====================================
      // 🔥 CONTINUE
      // =====================================
      case 'continue':
        await this.handleContinueDraft(result.postulation);

        break;
      // =====================================
      // 🔥 NEW
      // =====================================
      case 'new': {
        const drafts: any[] = await firstValueFrom(
          this.wellbeingPostulationService.getMyDrafts(),
        );
        const bestDraft = this.selectBestDraft(drafts);
        if (bestDraft) {
          this.showSuccess(
            'Ya existe un borrador activo. Se retomará la postulación existente.',
          );
          await this.handleContinueDraft(bestDraft);
        } else {
          await this.handleNewPostulation();
        }
        break;
      }
      // =====================================
      // 🔥 DELETE
      // =====================================
      case 'delete':
        await this.handleDeleteDraft(result.postulation);
        break;
      // =====================================
      // 🔥 CLOSED
      // =====================================
      default:
        console.log('🚪 DIALOG CLOSED');
        break;
    }
  }

  // =========================================================
  // 🔥 CONTINUE DRAFT
  // =========================================================

  private async handleContinueDraft(postulation: any) {
    if (!postulation?.id) {
      return;
    }

    await this.openPostulationFromSelector(Number(postulation.id));
  }

  // =========================================================
  // 🔥 NEW POSTULATION
  // =========================================================

  private async handleNewPostulation() {
    console.log('🆕 NEW POSTULATION');

    const drafts: any[] = await firstValueFrom(
      this.wellbeingPostulationService.getMyDrafts(),
    );

    const bestDraft = this.selectBestDraft(drafts);
    if (bestDraft) {
      console.log(
        '♻️ Ya existe borrador activo. Se retomará en vez de crear uno nuevo:',
        bestDraft.id,
      );
      await this.handleContinueDraft(bestDraft);
      return;
    }

    // =====================================
    // 🔥 RESET
    // =====================================
    await this.resetWorkflow();
    // =====================================
    // 🔥 CREATE ACTIVE DRAFT
    // =====================================
    await this.createPostulation(false);
    // =====================================
    // 🔥 LOAD AFFILIATE
    // =====================================
    await this.loadLoggedAffiliate();
    // =====================================
    // 🔥 SYNC TITULAR
    // =====================================
    this.syncAffiliateToFamily();
  }

  // =========================================================
  // 🔥 DELETE DRAFT
  // =========================================================

  // =========================================================
  // 🔥 HANDLE DELETE DRAFT
  // =========================================================

  private async handleDeleteDraft(postulation: any) {
    console.log('🗑️ DELETE DRAFT:', postulation.id);

    // =====================================
    // 🔥 DELETE
    // =====================================

    await firstValueFrom(
      this.wellbeingPostulationService.deleteMyPostulation(postulation.id),
    );

    // =====================================
    // 🔥 PREPARE EMPTY WORKFLOW
    // =====================================

    await this.handleNewPostulation();

    // =====================================
    // 🔥 SUCCESS
    // =====================================

    this.showSuccess('Borrador eliminado correctamente');
  }

  // =========================================================
  // 🔥 RESTORE AFFILIATE FROM POSTULATION
  // =========================================================

  private restoreAffiliateFromPostulation(postulation: any): void {
    const affiliate = postulation.affiliate || {};

    const toDateOnlyString = (value: any): string | null => {
      if (!value) {
        return null;
      }

      const text = String(value).trim();

      if (
        text === '' ||
        text.toLowerCase() === 'null' ||
        text.toLowerCase() === 'undefined' ||
        text.toLowerCase() === 'invalid date'
      ) {
        return null;
      }

      // yyyy-MM-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
      }

      // yyyy-MM-ddTHH:mm:ss
      if (text.includes('T')) {
        const datePart = text.split('T')[0];

        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }
      }

      return null;
    };

    const fechaNacimiento =
      toDateOnlyString(affiliate.birthDate) ||
      toDateOnlyString(affiliate.birth_date) ||
      toDateOnlyString(postulation.birthDate) ||
      null;

    const fechaAfiliacion =
      toDateOnlyString(affiliate.affiliateDate) ||
      toDateOnlyString(affiliate.affiliationDate) ||
      toDateOnlyString(affiliate.contractDate) ||
      toDateOnlyString(affiliate.contract_date) ||
      toDateOnlyString(postulation.affiliateDate) ||
      toDateOnlyString(postulation.affiliationDate) ||
      toDateOnlyString(postulation.contractDate) ||
      toDateOnlyString(postulation.contract_date) ||
      null;

    this.form.patchValue({
      rut: affiliate.rut || '',
      nombre: affiliate.names || '',
      apellido: affiliate.lastNames || '',
      telefono: affiliate.phone || '',
      email: affiliate.email || '',
      direccion: affiliate.address || '',
      fechaNacimiento,
      sexo: affiliate.sex || '',
      fechaAfiliacion,
      establecimiento: postulation.stablishmentId || null,
    });

    console.log('♻️ RESTORE AFFILIATE FROM POSTULATION:', {
      affiliate,
      rawAffiliateDate: affiliate.affiliateDate,
      rawAffiliationDate: affiliate.affiliationDate,
      rawContractDate: affiliate.contract_date || affiliate.contractDate,
      fechaNacimiento,
      fechaAfiliacion,
      formFechaAfiliacion: this.form.value.fechaAfiliacion,
    });
  }

  // =========================================================
  // 🔥 EMPTY WORKFLOW
  // =========================================================

  private async handleEmptyWorkflow() {
    console.log('🟢 EMPTY WORKFLOW');

    await this.loadLoggedAffiliate();

    this.syncAffiliateToFamily();
  }

  async loadLoggedAffiliate(options: { onlyEmpty?: boolean } = {}) {
    try {
      if (!this.loggedUser?.id) {
        console.warn('⚠️ No existe loggedUser.id para cargar afiliado');
        return;
      }

      const user: any = await firstValueFrom(
        this.usersService.getById(this.loggedUser.id).pipe(timeout(5000)),
      );

      console.log('👤 USER FOUND:', user);

      if (!user) {
        return;
      }

      this.afiliado = user;
      this.afiliadoValido = true;

      this.patchAffiliateFromUsers(user, {
        onlyEmpty: options.onlyEmpty ?? false,
      });

      console.log('✅ AFILIADO CARGADO DESDE USERS');
    } catch (e) {
      console.warn('⚠️ ERROR/TIMEOUT LOAD AFFILIATE:', e);
    }
  }

  private patchAffiliateFromUsers(
    user: any,
    options: { onlyEmpty?: boolean } = {},
  ): void {
    const onlyEmpty = options.onlyEmpty === true;
    const current = this.form.getRawValue();

    const isEmpty = (value: any): boolean => {
      return (
        value === null || value === undefined || String(value).trim() === ''
      );
    };

    const keepOrSet = (field: string, value: any, fallback: any = null) => {
      if (onlyEmpty && !isEmpty(current[field])) {
        return current[field];
      }

      if (!isEmpty(value)) {
        return value;
      }

      return fallback;
    };

    const toDateOnlyString = (value: any): string | null => {
      if (!value) {
        return null;
      }

      const text = String(value).trim();

      if (
        text === '' ||
        text.toLowerCase() === 'null' ||
        text.toLowerCase() === 'undefined' ||
        text.toLowerCase() === 'invalid date'
      ) {
        return null;
      }

      // yyyy-MM-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
      }

      // yyyy-MM-ddTHH:mm:ss
      if (text.includes('T')) {
        const datePart = text.split('T')[0];

        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }
      }

      return null;
    };

    // =====================================
    // 🔥 NOMBRE Y APELLIDO DESDE USERS
    // =====================================

    const nombre = `${user.firstName || ''} ${user.secondName || ''}`
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const apellido = `${user.firstLastName || ''} ${user.secondLastName || ''}`
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    // =====================================
    // 🔥 CALIDAD CONTRACTUAL
    // =====================================

    const calidadContractual = user.contract_type
      ? String(user.contract_type).trim().toUpperCase()
      : 'CONTRATA';

    // =====================================
    // 🔥 FECHAS DESDE USERS
    // =====================================

    const fechaNacimientoUser =
      user.birth_date || user.birthDate || user.fechaNacimiento || null;

    const fechaAfiliacionUser =
      user.contract_date ||
      user.contractDate ||
      user.affiliationDate ||
      user.affiliateDate ||
      user.fechaAfiliacion ||
      null;

    const fechaNacimientoFinal = toDateOnlyString(fechaNacimientoUser);
    const fechaAfiliacionFinal = toDateOnlyString(fechaAfiliacionUser);

    this.form.patchValue({
      rut: keepOrSet('rut', user.rut, ''),

      nombre: keepOrSet('nombre', nombre, ''),

      apellido: keepOrSet('apellido', apellido, ''),

      email: keepOrSet('email', user.email, ''),

      fechaNacimiento: keepOrSet('fechaNacimiento', fechaNacimientoFinal, null),

      fechaAfiliacion: keepOrSet('fechaAfiliacion', fechaAfiliacionFinal, null),

      calidadContractual: keepOrSet(
        'calidadContractual',
        calidadContractual,
        'CONTRATA',
      ),

      tipoAfiliado: keepOrSet('tipoAfiliado', 'ACTIVO', 'ACTIVO'),
    });

    console.log('🧩 PATCH USERS STEP 1:', {
      onlyEmpty,
      rawBirthDate: fechaNacimientoUser,
      rawContractDate: fechaAfiliacionUser,
      fechaNacimientoFinal,
      fechaAfiliacionFinal,
      formFechaNacimiento: this.form.value.fechaNacimiento,
      formFechaAfiliacion: this.form.value.fechaAfiliacion,
      rut: this.form.value.rut,
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      email: this.form.value.email,
      calidadContractual: this.form.value.calidadContractual,
      tipoAfiliado: this.form.value.tipoAfiliado,
    });
  }

  private patchAffiliate(user: any): void {
    this.patchAffiliateFromUsers(user, { onlyEmpty: false });
  }

  async saveStep1Affiliate() {
    try {
      const activePostulationId = await this.ensureActiveDraft();

      this.isSaving = true;

      // =====================================
      // 🔥 UPDATE USER
      // =====================================

      const fullUser: any = await firstValueFrom(
        this.usersService.getById(this.loggedUser.id),
      );

      await firstValueFrom(
        this.usersService.updateUser(this.loggedUser.id, {
          ...fullUser,

          // =====================================
          // 🔥 CONTACTO
          // =====================================

          phone: this.form.value.telefono || fullUser.phone,

          email: this.form.value.email || fullUser.email,

          address: this.form.value.direccion || fullUser.address,

          // =====================================
          // 🔥 PERSONALES
          // =====================================

          sex: this.form.value.sexo || fullUser.sex,

          birth_date:
            this.formatDateOnlyForBackend(this.form.value.fechaNacimiento) ||
            fullUser.birth_date,

          // =====================================
          // 🔥 AFILIACIÓN
          // =====================================

          contract_date:
            this.formatDateOnlyForBackend(this.form.value.fechaAfiliacion) ||
            fullUser.contract_date,

          contract_type: this.form.value.calidadContractual
            ? String(this.form.value.calidadContractual).toUpperCase()
            : fullUser.contract_type,
        }),
      );

      console.log('✅ USER UPDATED OK');

      // =====================================
      // 🔥 PAYLOAD AFFILIATE
      // =====================================

      const payload = this.wellbeingMapperService.mapAffiliate(this.form.value);

      console.log('🚀 AFFILIATE PAYLOAD:', payload);

      // =====================================
      // 🔥 SAVE AFFILIATE
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.saveAffiliate(
          activePostulationId,
          payload,
        ),
      );

      console.log('✅ AFFILIATE SAVED OK');

      // =====================================
      // 🔥 SYNC TITULAR
      // =====================================

      this.syncAffiliateToFamily();

      // =====================================
      // 🔥 AVANCE SEGURO A STEP 2
      // =====================================

      console.log('➡️ INTENTANDO PASAR A STEP 2');

      try {
        await firstValueFrom(
          this.wellbeingPostulationService
            .updateCurrentStep(activePostulationId, 2)
            .pipe(timeout(5000)),
        );

        console.log('✅ CURRENT STEP BACKEND UPDATED TO 2');
      } catch (stepError) {
        console.warn(
          '⚠️ No se pudo actualizar currentStep en backend, pero se avanzará visualmente:',
          stepError,
        );
      }

      this.currentStep = 2;

      this.wellbeingStorageService.saveCurrentStep(2);

      this.saveWorkflow();

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto',
        });
      }, 0);

      console.log('✅ YA PASÓ A STEP:', this.currentStep);
      setTimeout(() => {
        console.log('🧪 DEBUG DOM STEP 2:', {
          currentStep: this.currentStep,
          showPostulationForm: this.showPostulationForm,
          totalFamiliares: this.grupoFamiliar.length,
          step2Element: document.querySelector('.step2-container'),
          step1Element: document.querySelector('.step1-container'),
        });
      }, 300);
    } catch (e) {
      console.error('❌ ERROR SAVE STEP 1 AFFILIATE:', e);

      this.showError('Error guardando afiliado');
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 WORKFLOW STORAGE
  // =========================================================

  loadWorkflowStorage() {
    this.postulationId = this.wellbeingStorageService.getPostulationId();

    console.log('🔥 STORAGE:', {
      postulationId: this.postulationId,
      step: this.currentStep,
    });
  }

  private async restoreWorkflow() {
    // =====================================
    // 🔥 STORAGE
    // =====================================

    this.loadWorkflowStorage();

    // =====================================
    // 🔥 LOAD AFFILIATE
    // =====================================

    // 🚨 IMPORTANTE:
    // Ya NO depende de postulationId
    // porque ahora puede existir draft
    // pero NO affiliate restaurado.

    if (!this.afiliadoValido) {
      await this.loadLoggedAffiliate();
    }

    console.log('👤 AFILIADO RESTAURADO:', this.afiliado);
    // =====================================
    // 🔥 FAMILY
    // =====================================

    if (this.grupoFamiliar.length === 0) {
      this.syncAffiliateToFamily();
    }

    // =====================================
    // 🔥 HEALTH
    // =====================================

    if (this.salud.length === 0) {
      this.agregarSalud();
    }

    console.log('♻️ WORKFLOW RESTORED');
  }

  // =========================================================
  // 🔥 CREATE POSTULATION
  // =========================================================

  // =========================================================
  // 🔥 CREATE POSTULATION
  // =========================================================

  // =========================================================
  // 🔥 CREATE POSTULATION
  // =========================================================

  // =========================================================
  // 🔥 CREATE POSTULATION
  // =========================================================

  async createPostulation(showMessage = true) {
    try {
      this.isLoading = true;

      // =====================================
      // 🔥 CREATE DRAFT
      // =====================================

      const response: any = await firstValueFrom(
        this.wellbeingPostulationService.start({
          userId: this.loggedUser.id,
          periodYear: new Date().getFullYear(),
        }),
      );

      console.log('🚀 DRAFT CREATED:', response);

      // =====================================
      // 🔥 IDS
      // =====================================

      this.postulationId = response.id;
      this.selectedPostulationViewId = response.id;
      this.isSubmitted = false;

      this.codigoPostulacion = response.code;
      this.availablePostulations = this.mergePostulationLists(
        this.availablePostulations,
        [response],
      );

      // =====================================
      // 🔥 STORAGE
      // =====================================

      this.wellbeingStorageService.savePostulationId(response.id);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      if (showMessage) {
        this.showSuccess('Postulación creada correctamente');
      }
    } catch (e) {
      console.error('❌ ERROR CREATE POSTULATION:', e);

      this.showError('No fue posible crear la postulación');
    } finally {
      this.isLoading = false;
    }
  }

  // =========================================================
  // 🔥 LOAD SUMMARY
  // =========================================================

  async loadSummary() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.summary = await firstValueFrom(
        this.wellbeingPostulationService.getSummary(this.postulationId),
      );

      console.log('📊 SUMMARY:', this.summary);
    } catch (e) {
      console.error(e);
    }
  }

  // =========================================================
  // 🔥 LOAD CATALOGS
  // =========================================================

  async loadCatalogs() {
    try {
      this.isLoading = true;

      // =====================================
      // 🔥 STUDIES
      // =====================================

      this.studies = (
        await firstValueFrom(this.wellbeingCatalogsService.getStudies())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 STABLISHMENTS
      // =====================================

      this.stablishments = (
        await firstValueFrom(this.wellbeingCatalogsService.getStablishments())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 PREVITIONS
      // =====================================

      this.previtions = (
        await firstValueFrom(this.wellbeingCatalogsService.getPrevitions())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 PARENT TYPES
      // =====================================

      this.parentTypes = (
        await firstValueFrom(this.wellbeingCatalogsService.getParentTypes())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 CONTRACT TYPES
      // =====================================

      this.contractTypes = (
        await firstValueFrom(this.wellbeingCatalogsService.getContractTypes())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 CIVIL STATES
      // =====================================

      this.civilStates = (
        await firstValueFrom(this.wellbeingCatalogsService.getCivilStates())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 BILL TYPES
      // =====================================

      this.billTypes = (
        await firstValueFrom(this.wellbeingCatalogsService.getBillTypes())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 ACTIVITIES
      // =====================================

      this.activities = (
        await firstValueFrom(this.wellbeingCatalogsService.getActivities())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 WORK PLACES
      // =====================================

      this.workPlaces = (
        await firstValueFrom(this.wellbeingCatalogsService.getWorkPlaces())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 GRADES
      // =====================================

      this.grades = (
        await firstValueFrom(this.wellbeingCatalogsService.getGrades())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 TYPE PROPERTIES
      // =====================================

      this.typesProperties = (
        await firstValueFrom(this.wellbeingCatalogsService.getTypeProperties())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 TYPE HOUSINGS
      // =====================================

      this.typesHousing = (
        await firstValueFrom(this.wellbeingCatalogsService.getTypeHousings())
      ).filter((r: any) => !r.deletedAt);

      // =====================================
      // 🔥 DOCUMENT TYPES
      // =====================================

      this.documentTypes = (
        await firstValueFrom(this.wellbeingDocumentsService.getDocumentTypes())
      ).filter((r: any) => !r.deletedAt && r.active !== false);

      console.log('✅ CATALOGS LOADED');
    } catch (e) {
      console.error(e);

      this.showError('Error cargando catálogos');
    } finally {
      this.isLoading = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 2
  // =========================================================

  async saveStep2FamilyMembers() {
    // =====================================
    // 🔥 VALIDATE
    // =====================================

    const valid = this.validateFamilyMembers();

    if (!valid) {
      return;
    }

    // =====================================
    // 🔥 ENSURE ACTIVE POSTULATION
    // =====================================

    try {
      const activePostulationId = await this.ensureActiveDraft();
      this.isSaving = true;

      // =====================================
      // 🔥 SYNC TITULAR
      // =====================================

      this.syncAffiliateToFamily();

      console.log('👨‍👩‍👧‍👦 GRUPO FAMILIAR:', this.grupoFamiliar);

      // =====================================
      // 🔥 SAVE FAMILY GROUP FLAGS
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.updateFamilyGroup(
          activePostulationId,
          { isSingleParentHome: Boolean(this.form.value.hogarMonoparental) },
        ),
      );

      // =====================================
      // 🔥 SAVE FAMILY MEMBERS
      // =====================================

      for (const familiar of this.grupoFamiliar) {
        const payload = this.wellbeingMapperService.mapFamilyMember(familiar);

        console.log('🚀 FAMILY MEMBER:', payload);

        const response: any = await firstValueFrom(
          familiar.backendId
            ? this.wellbeingPostulationService.updateFamilyMember(
                familiar.backendId,
                payload,
              )
            : this.wellbeingPostulationService.saveFamilyMember(
                activePostulationId,
                payload,
              ),
        );

        console.log('✅ FAMILY MEMBER SAVED:', response);

        // =====================================
        // 🔥 SAVE BACKEND ID
        // =====================================

        familiar.backendId = response.id;
      }

      // =====================================
      // 🔥 UPDATE STEP
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.updateCurrentStep(
          activePostulationId,
          3,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(3);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      //this.showSuccess('Grupo familiar guardado');
    } catch (e) {
      console.error(e);

      this.showError('Error guardando grupo familiar');
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 3
  // =========================================================

  async saveStep3Beneficiary() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      if (!this.tipoPostulante) {
        this.tipoPostulante = 'afiliado';
      }

      const payload: BeneficiaryRequest = {
        beneficiaryType: (this.tipoPostulante === 'afiliado'
          ? 'AFFILIATE'
          : 'FAMILY_MEMBER') as 'AFFILIATE' | 'FAMILY_MEMBER',

        familyMemberId:
          this.tipoPostulante === 'familiar'
            ? this.postulanteSeleccionado?.backendId || null
            : null,
      };

      console.log('🚀 BENEFICIARY:', payload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveBeneficiary(
          this.postulationId,
          payload,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(4);

      //this.showSuccess('Beneficiario guardado');
    } catch (e) {
      console.error(e);

      this.showError('Error guardando beneficiario');
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 4
  // =========================================================

  async saveStep4AcademicBackground() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      // =====================================
      // 🔥 PAYLOAD
      // =====================================

      const payload: any = {
        institution: this.academico.institucion,

        career: this.academico.carrera,

        currentSemester: Number(this.academico.semestre || 0),

        careerDurationSemesters: Number(this.academico.duracion || 0),

        studiesInRegion: String(this.academico.region).toLowerCase() === 'si',

        studyLevelId: Number(this.academico.studyId || 0) || null,

        hadPreviousBenefit: this.form.value.beneficiado === 'si',
      };

      console.log('🚀 ACADEMIC INFO:', payload);

      // =====================================
      // 🔥 SAVE
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.updateAcademicInfo(
          this.postulationId,
          payload,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(5);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      //this.showSuccess('Antecedentes académicos guardados');
    } catch (e) {
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 6
  // =========================================================
  async saveStep6FamilyIncomes() {
    try {
      const activePostulationId = await this.ensureActiveDraft();

      this.isSaving = true;

      // =====================================
      // 🔥 1) CARGAR SUMMARY ACTUAL
      // =====================================

      await this.loadSummary();

      const currentIncomes = Array.isArray(this.summary?.incomes)
        ? this.summary.incomes
        : [];

      console.log('🧹 INCOMES EXISTENTES A BORRAR:', currentIncomes);

      // =====================================
      // 🔥 2) DELETE INCOMES EXISTENTES
      // =====================================

      for (const income of currentIncomes) {
        const incomeId = Number(income.id || 0);

        if (!incomeId) {
          continue;
        }

        console.log('🗑️ DELETE INCOME:', incomeId);

        await firstValueFrom(
          this.wellbeingPostulationService.deleteIncome(incomeId),
        );
      }

      // =====================================
      // 🔥 3) CREATE INCOMES ACTUALES
      // =====================================

      for (const ingreso of this.ingresosFamiliares) {
        const selectedFamilyId = Number(ingreso.familiarId || 0);
        const amount = Number(ingreso.monto || 0);

        if (!selectedFamilyId) {
          console.warn(
            '⚠️ Ingreso sin familiar seleccionado, se omite:',
            ingreso,
          );
          continue;
        }

        if (amount <= 0) {
          console.warn('⚠️ Ingreso con monto 0, se omite:', ingreso);
          continue;
        }

        const familiar = this.grupoFamiliar.find((f: any) => {
          return (
            Number(f.backendId) === selectedFamilyId ||
            Number(f.id) === selectedFamilyId
          );
        });

        if (!familiar) {
          console.warn('⚠️ No se encontró familiar para guardar ingreso:', {
            ingreso,
            selectedFamilyId,
            grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
              id: f.id,
              backendId: f.backendId,
              nombre: f.nombre,
              parentTypeId: f.parentTypeId,
            })),
          });

          continue;
        }

        const backendFamilyMemberId = Number(
          familiar.backendId || familiar.id || selectedFamilyId,
        );

        if (!backendFamilyMemberId) {
          console.warn('⚠️ Familiar sin ID backend válido:', {
            ingreso,
            familiar,
          });

          continue;
        }

        const payload = {
          familyMemberId: backendFamilyMemberId,
          incomeTypeId: 1,
          amount,
        };

        console.log('💰 CREATE INCOME:', payload);

        await firstValueFrom(
          this.wellbeingPostulationService.createIncome(
            activePostulationId,
            payload,
          ),
        );
      }

      // =====================================
      // 🔥 4) RELOAD SUMMARY
      // =====================================

      await this.loadSummary();

      this.restoreIncomesFromSummary(this.summary);

      await this.moveToStep(7);

      //this.showSuccess('Ingresos familiares guardados');
    } catch (e) {
      console.error('❌ ERROR SAVE INCOMES:', e);

      this.showError('Error guardando ingresos');
    } finally {
      this.isSaving = false;
    }
  }

  /*
  async saveStep6FamilyIncomes() {
    try {
      const activePostulationId = await this.ensureActiveDraft();

      this.isSaving = true;

      // =====================================
      // 🔥 CARGAR SUMMARY ACTUAL
      // Para saber qué ingresos ya existen en BD
      // =====================================

      await this.loadSummary();

      const existingIncomes = Array.isArray(this.summary?.incomes)
        ? this.summary.incomes
        : [];

      const existingKeys = new Set<string>();

      for (const income of existingIncomes) {
        const familyMemberId = Number(income.familyMemberId || 0);
        const incomeTypeId = Number(income.incomeTypeId || 1);

        if (familyMemberId) {
          existingKeys.add(`${familyMemberId}|${incomeTypeId}`);
        }
      }

      // =====================================
      // 🔥 COMPACTAR INGRESOS DEL FRONT
      // 1 ingreso por familiar
      // =====================================

      const ingresosUnicos = new Map<number, IngresoFamiliar>();

      for (const ingreso of this.ingresosFamiliares) {
        if (!ingreso.familiarId) {
          continue;
        }

        ingresosUnicos.set(Number(ingreso.familiarId), ingreso);
      }

      let createdCount = 0;
      let skippedCount = 0;

      // =====================================
      // 🔥 GUARDAR SOLO LOS QUE NO EXISTEN
      // =====================================

      for (const ingreso of Array.from(ingresosUnicos.values())) {
        const familiar = this.grupoFamiliar.find(
          (f) => Number(f.id) === Number(ingreso.familiarId),
        );

        if (!familiar?.backendId) {
          console.warn('⚠️ Familiar sin backendId, no se guarda ingreso:', {
            ingreso,
            familiar,
          });

          continue;
        }

        const familyMemberId = Number(familiar.backendId);
        const incomeTypeId = 1;
        const key = `${familyMemberId}|${incomeTypeId}`;

        if (existingKeys.has(key)) {
          console.log('⏭️ INCOME YA EXISTE, SE OMITE:', {
            familyMemberId,
            incomeTypeId,
            amount: ingreso.monto,
          });

          skippedCount++;
          continue;
        }

        const payload = {
          familyMemberId,
          incomeTypeId,
          amount: Number(ingreso.monto || 0),
        };

        console.log('💰 INCOME CREATE:', payload);

        await firstValueFrom(
          this.wellbeingPostulationService.createIncome(
            activePostulationId,
            payload,
          ),
        );

        existingKeys.add(key);
        createdCount++;
      }

      // =====================================
      // 🔥 RECARGAR SUMMARY Y RESTAURAR LIMPIO
      // =====================================

      await this.loadSummary();
      this.restoreIncomesFromSummary(this.summary);

      await this.moveToStep(7);

      if (createdCount > 0) {
        this.showSuccess('Ingresos familiares guardados');
      } else if (skippedCount > 0) {
        this.showSuccess('Ingresos familiares ya estaban registrados');
      }
    } catch (e) {
      console.error(e);

      this.showError('Error guardando ingresos');
    } finally {
      this.isSaving = false;
    }
  }*/

  /*
  async saveStep6FamilyIncomes() {
    try {
      const activePostulationId = await this.ensureActiveDraft();
      this.isSaving = true;

      for (const ingreso of this.ingresosFamiliares) {
        const familiar = this.grupoFamiliar.find(
          (f) => f.id === ingreso.familiarId,
        );

        const payload = {
          familyMemberId: familiar?.backendId,

          incomeTypeId: 1,

          amount: Number(ingreso.monto || 0),
        };

        console.log('💰 INCOME:', payload);

        await firstValueFrom(
          this.wellbeingPostulationService.createIncome(
            activePostulationId,
            payload,
          ),
        );
      }

      await this.moveToStep(7);

      //this.showSuccess('Ingresos familiares guardados');
    } catch (e) {
      console.error(e);

      this.showError('Error guardando ingresos');
    } finally {
      this.isSaving = false;
    }
  }
  */

  // =========================================================
  // 🔥 SAVE STEP 7
  // =========================================================
  async saveStep7FamilyExpenses() {
    try {
      const activePostulationId = await this.ensureActiveDraft();

      this.isSaving = true;

      // =====================================
      // 🔥 1) LOAD SUMMARY ACTUAL
      // =====================================

      await this.loadSummary();

      const currentExpenses = Array.isArray(this.summary?.expenses)
        ? this.summary.expenses
        : [];

      // =====================================
      // 🔥 2) SAVE FIXED EXPENSES
      // Estos son PUT, no duplican.
      // =====================================

      const fixedPayload = {
        rentOrDividend: Number(this.form.value.arriendo || 0),

        electricity: Number(this.form.value.luz || 0),

        water: Number(this.form.value.agua || 0),

        gas: Number(this.form.value.gas || 0),

        phone: Number(this.form.value.telefonoGasto || 0),

        credits: Number(this.form.value.creditos || 0),

        tuition: Number(this.form.value.matricula || 0),

        monthlyFee: Number(this.form.value.mensualidad || 0),

        lodging: Number(this.form.value.alojamiento || 0),
      };

      console.log('💸 FIXED EXPENSES:', fixedPayload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveFixedExpenses(
          activePostulationId,
          fixedPayload,
        ),
      );

      // =====================================
      // 🔥 3) DELETE OTHER EXPENSES EXISTENTES
      // Solo otros gastos dinámicos.
      // =====================================

      const otherExpensesToDelete = currentExpenses.filter((expense: any) => {
        const category = String(expense.category || '').toUpperCase();
        const code = String(expense.code || '').toUpperCase();

        return category === 'OTHER' || code === 'OTRO';
      });

      console.log(
        '🧹 OTHER EXPENSES EXISTENTES A BORRAR:',
        otherExpensesToDelete,
      );

      for (const expense of otherExpensesToDelete) {
        const expenseId = Number(expense.id || 0);

        if (!expenseId) {
          continue;
        }

        console.log('🗑️ DELETE OTHER EXPENSE:', expenseId);

        await firstValueFrom(
          this.wellbeingPostulationService.deleteExpense(expenseId),
        );
      }

      // =====================================
      // 🔥 4) CREATE OTHER EXPENSES ACTUALES
      // =====================================

      for (const g of this.otrosGastos) {
        const amount = Number(g.monto || 0);
        const glosa = String(g.glosa || '').trim();

        if (amount <= 0 && !glosa) {
          continue;
        }

        if (amount <= 0) {
          continue;
        }

        const payload = {
          code: 'OTRO',

          name: glosa || 'Otro gasto',

          description: glosa || 'Otro gasto',

          amount,
        };

        console.log('🧾 CREATE OTHER EXPENSE:', payload);

        await firstValueFrom(
          this.wellbeingPostulationService.createOtherExpense(
            activePostulationId,
            payload,
          ),
        );
      }

      // =====================================
      // 🔥 5) RELOAD SUMMARY
      // =====================================

      await this.loadSummary();

      this.restoreExpensesFromSummary(this.summary);

      await this.moveToStep(8);

      //this.showSuccess('Gastos familiares guardados');
    } catch (e) {
      console.error('❌ ERROR SAVE EXPENSES:', e);

      this.showError(
        'Error guardando gastos. Verifique que el borrador esté activo y que la sesión sea válida.',
      );
    } finally {
      this.isSaving = false;
    }
  }

  /*
  async saveStep7FamilyExpenses() {
    try {
      const activePostulationId = await this.ensureActiveDraft();
      this.isSaving = true;

      // =====================================
      // 🔥 FIXED EXPENSES
      // =====================================

      const fixedPayload = {
        rentOrDividend: Number(this.form.value.arriendo || 0),

        electricity: Number(this.form.value.luz || 0),

        water: Number(this.form.value.agua || 0),

        gas: Number(this.form.value.gas || 0),

        phone: Number(this.form.value.telefonoGasto || 0),

        credits: Number(this.form.value.creditos || 0),

        tuition: Number(this.form.value.matricula || 0),

        monthlyFee: Number(this.form.value.mensualidad || 0),

        lodging: Number(this.form.value.alojamiento || 0),
      };

      console.log('💸 FIXED EXPENSES:', fixedPayload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveFixedExpenses(
          activePostulationId,
          fixedPayload,
        ),
      );

      // =====================================
      // 🔥 OTHER EXPENSES
      // =====================================

      for (const g of this.otrosGastos) {
        if (!g.monto || Number(g.monto) <= 0) {
          continue;
        }

        const payload = {
          code: 'OTRO',

          name: g.glosa,

          description: g.glosa,

          amount: Number(g.monto),
        };

        console.log('🧾 OTHER EXPENSE:', payload);

        await firstValueFrom(
          this.wellbeingPostulationService.createOtherExpense(
            activePostulationId,
            payload,
          ),
        );
      }

      // =====================================
      // 🔥 RELOAD BACKEND SUMMARY AFTER PERSISTENCE
      // =====================================

      await this.loadSummary();

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(8);

      //this.showSuccess('Gastos familiares guardados');
    } catch (e) {
      console.error(e);

      this.showError(
        'Error guardando gastos. Verifique que el borrador esté activo y que la sesión sea válida.',
      );
    } finally {
      this.isSaving = false;
    }
  }
    */

  // =========================================================
  // 🔥 SAVE STEP 8
  // =========================================================

  async saveStep8HealthAndHousing() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      const activePostulationId = Number(this.postulationId);

      // =====================================
      // 🔥 1) LOAD SUMMARY ACTUAL
      // =====================================

      await this.loadSummary();

      const currentHealthRecords = Array.isArray(this.summary?.healthRecords)
        ? this.summary.healthRecords
        : [];

      console.log(
        '🧹 HEALTH RECORDS EXISTENTES A BORRAR:',
        currentHealthRecords,
      );

      // =====================================
      // 🔥 2) DELETE HEALTH RECORDS EXISTENTES
      // =====================================

      for (const record of currentHealthRecords) {
        const recordId = Number(record.id || 0);

        if (!recordId) {
          continue;
        }

        console.log('🗑️ DELETE HEALTH RECORD:', recordId);

        await firstValueFrom(
          this.wellbeingPostulationService.deleteHealthRecord(recordId),
        );
      }

      // =====================================
      // 🔥 3) CREATE HEALTH RECORDS ACTUALES
      // =====================================

      const healthPayload = this.salud
        .filter(
          (s: any) =>
            s.nombre?.trim() &&
            s.familiarId &&
            s.patologia?.trim() &&
            Number(s.gasto || 0) > 0,
        )
        .map((s: any) => {
          const familiar = this.grupoFamiliar.find(
            (f: any) => Number(f.id) === Number(s.familiarId),
          );

          return {
            familyMemberId: Number(familiar?.backendId || 0),

            personName: String(s.nombre || '').trim(),

            pathology: String(s.patologia || '').trim(),

            monthlyExpense: Number(s.gasto || 0),
          };
        })
        .filter((record: any) => record.familyMemberId > 0);

      console.log('🩺 HEALTH CREATE PAYLOAD:', healthPayload);

      if (healthPayload.length > 0) {
        await firstValueFrom(
          this.wellbeingPostulationService.saveHealthRecords(
            activePostulationId,
            healthPayload,
          ),
        );
      }

      // =====================================
      // 🔥 4) SAVE HOUSING
      // Esto es PUT, no duplica.
      // =====================================

      const housingPayload = {
        typeHousingId: Number(this.form.value.tipoVivienda || 0),

        typePropertyId: Number(this.form.value.tipoPropiedad || 0),

        housingBackground: this.form.value.infoVivienda || '',

        otherBackground: this.form.value.otrosAntecedentes || '',
      };

      console.log('🏠 HOUSING:', housingPayload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveHousing(
          activePostulationId,
          housingPayload,
        ),
      );

      // =====================================
      // 🔥 5) RELOAD SUMMARY
      // =====================================

      await this.loadSummary();

      this.restoreHealthFromSummary(this.summary);

      this.restoreHousingFromSummary(this.summary);

      await this.moveToStep(9);

      //this.showSuccess('Salud y vivienda guardados');
    } catch (e) {
      console.error('❌ ERROR SAVE HEALTH/HOUSING:', e);

      this.showError('Error guardando salud/vivienda');
    } finally {
      this.isSaving = false;
    }
  }

  /*
  async saveStep8HealthAndHousing() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      // =====================================
      // 🔥 HEALTH
      // =====================================

      const healthPayload = this.salud
        .filter(
          (s: any) =>
            s.nombre?.trim() &&
            s.familiarId &&
            s.patologia?.trim() &&
            Number(s.gasto || 0) > 0,
        )
        .map((s: any) => {
          const familiar = this.grupoFamiliar.find(
            (f: any) => f.id === s.familiarId,
          );

          return {
            familyMemberId: Number(familiar?.backendId || 0),

            personName: String(s.nombre || '').trim(),

            pathology: String(s.patologia || '').trim(),

            monthlyExpense: Number(s.gasto || 0),
          };
        })
        .filter((record: any) => record.familyMemberId > 0);

      console.log('🩺 HEALTH:', JSON.stringify(healthPayload, null, 2));

      // =====================================
      // 🔥 SAVE HEALTH
      // =====================================

      if (healthPayload.length > 0) {
        await firstValueFrom(
          this.wellbeingPostulationService.saveHealthRecords(
            this.postulationId,
            healthPayload,
          ),
        );
      }

      // =====================================
      // 🔥 HOUSING
      // =====================================

      const housingPayload = {
        typeHousingId: Number(this.form.value.tipoVivienda || 0),

        typePropertyId: Number(this.form.value.tipoPropiedad || 0),

        housingBackground: this.form.value.infoVivienda || '',

        otherBackground: this.form.value.otrosAntecedentes || '',
      };

      console.log('🏠 HOUSING:', housingPayload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveHousing(
          this.postulationId,
          housingPayload,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(9);

      //this.showSuccess('Salud y vivienda guardados');
    } catch (e) {
      console.error(e);

      this.showError('Error guardando salud/vivienda');
    } finally {
      this.isSaving = false;
    }
  }*/

  // =========================================================
  // 🔥 SAVE STEP 9 DOCUMENTS
  // =========================================================

  async saveStep9Documents(): Promise<void> {
    try {
      this.isSaving = true;

      console.groupCollapsed('🚀 SAVE STEP 9 PHYSICAL DOCUMENTS');

      const activePostulationId = await this.ensureActiveDraft();

      console.log('🆔 POSTULACIÓN ACTIVA:', activePostulationId);

      // =====================================
      // 🔥 1) CARGAR RESUMEN ACTUAL
      // =====================================

      await this.loadSummary();

      this.restoreDocumentsFromSummary(this.summary);
      this.seedUploadedDocumentFingerprintsFromSummary();

      console.log('📊 DOCUMENTOS YA REGISTRADOS EN BACKEND:', {
        summaryDocuments: this.summary?.documents || [],
        uploadedDocumentsByKey: this.uploadedDocumentsByKey,
        fingerprints: Array.from(this.uploadedDocumentFingerprints),
      });

      // =====================================
      // 🔥 2) RECOPILAR ARCHIVOS FÍSICOS
      // =====================================

      const pendingDocuments = this.collectSelectedDocumentsForBackend();

      console.log(
        '📎 TOTAL ARCHIVOS FÍSICOS PENDIENTES:',
        pendingDocuments.length,
      );

      console.table(
        pendingDocuments.map((doc, index) => ({
          orden: index + 1,
          key: doc.key,
          documentTypeId: doc.documentTypeId,
          originalFilename: doc.file.name,
          contentType: doc.file.type,
          sizeBytes: doc.file.size,
        })),
      );

      if (!pendingDocuments.length && !this.hasAllRequiredDocuments()) {
        console.warn('⚠️ FALTAN DOCUMENTOS OBLIGATORIOS');

        this.showWarning(
          'Debe adjuntar todos los documentos obligatorios antes de continuar',
        );

        console.groupEnd();

        return;
      }

      // =====================================
      // 🔥 3) SUBIR ARCHIVOS FÍSICOS UNO POR UNO
      // =====================================

      let savedCount = 0;

      for (let index = 0; index < pendingDocuments.length; index++) {
        const doc = pendingDocuments[index];

        const fingerprint = this.buildDocumentFingerprint(
          doc.documentTypeId,
          doc.file.name,
          doc.file.size,
        );

        console.groupCollapsed(
          `📤 SUBIENDO ARCHIVO ${index + 1}/${pendingDocuments.length}: ${doc.file.name}`,
        );

        console.log('🧾 ARCHIVO QUE SE ENVIARÁ:', {
          postulationId: activePostulationId,
          key: doc.key,
          documentTypeId: doc.documentTypeId,
          originalFilename: doc.file.name,
          contentType: doc.file.type,
          sizeBytes: doc.file.size,
        });

        console.log('🔐 FINGERPRINT:', fingerprint);

        if (this.uploadedDocumentFingerprints.has(fingerprint)) {
          console.warn('⏭️ DOCUMENTO YA REGISTRADO, SE OMITE:', {
            fingerprint,
            fileName: doc.file.name,
          });

          console.groupEnd();

          continue;
        }

        try {
          const response = await firstValueFrom(
            this.wellbeingDocumentsService.uploadDocument(
              activePostulationId,
              doc.documentTypeId,
              doc.file,
            ),
          );

          console.log('✅ ARCHIVO FÍSICO SUBIDO CORRECTAMENTE:', {
            fileName: doc.file.name,
            response,
          });

          this.uploadedDocumentFingerprints.add(fingerprint);

          // =====================================
          // 🔥 RETIRAR ARCHIVO DE LA LISTA LOCAL
          // DESPUÉS DE QUE BACKEND CONFIRMA LA SUBIDA
          // =====================================

          this.removeUploadedFileFromPending(doc.key, doc.file);

          savedCount++;
        } catch (documentError: any) {
          console.error('❌ FALLÓ LA SUBIDA DEL ARCHIVO FÍSICO:', {
            orden: index + 1,
            total: pendingDocuments.length,
            postulationId: activePostulationId,
            key: doc.key,
            documentTypeId: doc.documentTypeId,
            fileName: doc.file.name,
            contentType: doc.file.type,
            sizeBytes: doc.file.size,
            fingerprint,
            status: documentError?.status,
            statusText: documentError?.statusText,
            url: documentError?.url,
            message: documentError?.message,
            backendError: documentError?.error,
            fullError: documentError,
          });

          console.groupEnd();

          throw documentError;
        }

        console.groupEnd();
      }

      // =====================================
      // 🔥 4) RECARGAR SUMMARY
      // =====================================

      await this.loadSummary();

      this.restoreDocumentsFromSummary(this.summary);
      this.seedUploadedDocumentFingerprintsFromSummary();

      console.log('📊 DOCUMENTOS DESPUÉS DE LA SUBIDA FÍSICA:', {
        savedCount,
        summaryDocuments: this.summary?.documents || [],
        uploadedDocumentsByKey: this.uploadedDocumentsByKey,
      });

      // =====================================
      // 🔥 5) VALIDACIÓN FINAL
      // =====================================

      if (!this.hasAllRequiredDocuments()) {
        console.warn('⚠️ VALIDACIÓN FINAL: FALTAN DOCUMENTOS OBLIGATORIOS');

        this.showWarning(
          'Debe adjuntar todos los documentos obligatorios antes de continuar',
        );

        console.groupEnd();

        return;
      }

      // =====================================
      // 🔥 6) AVANZAR
      // =====================================

      await this.moveToStep(10);

      this.showSuccess(
        savedCount > 0
          ? `Documentos físicos subidos correctamente (${savedCount})`
          : 'Documentos ya se encontraban registrados',
      );

      console.log('✅ STEP 9 COMPLETADO CORRECTAMENTE');

      console.groupEnd();
    } catch (error: any) {
      console.error('❌ ERROR GENERAL SUBIENDO DOCUMENTOS FÍSICOS:', {
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url,
        message: error?.message,
        backendError: error?.error,
        fullError: error,
      });

      this.showError(
        'Error subiendo documentos físicos. Revise la consola para identificar el archivo rechazado.',
      );
    } finally {
      this.isSaving = false;
    }
  }

  private collectSelectedDocumentsForBackend(): Array<{
    key: string;
    documentTypeId: number;
    file: File;
  }> {
    const result: Array<{
      key: string;
      documentTypeId: number;
      file: File;
    }> = [];

    console.groupCollapsed('🧩 CONSTRUCCIÓN DE ARCHIVOS FÍSICOS PARA BACKEND');

    const appendFiles = (
      group: 'OBLIGATORIO' | 'OPCIONAL',
      key: string,
      files: File[] | undefined,
    ): void => {
      if (!files?.length) {
        return;
      }

      console.groupCollapsed(`📂 ${group}: ${key}`);

      const expectedCode = this.documentTypeCodeByKey[key];

      const documentTypeId = this.getDocumentTypeIdByKey(key);

      console.log('📌 CATEGORÍA DOCUMENTAL:', {
        group,
        key,
        expectedCode,
        documentTypeId,
        totalFiles: files.length,
      });

      for (const file of files) {
        result.push({
          key,
          documentTypeId,
          file,
        });

        console.log('📦 ARCHIVO FÍSICO PREPARADO:', {
          group,
          key,
          expectedCode,
          documentTypeId,
          originalFilename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        });
      }

      console.groupEnd();
    };

    Object.entries(this.filesObligatorios).forEach(([key, files]) => {
      appendFiles('OBLIGATORIO', key, files);
    });

    Object.entries(this.filesOpcionales).forEach(([key, files]) => {
      appendFiles('OPCIONAL', key, files);
    });

    console.groupEnd();

    return result;
  }

  private removeUploadedFileFromPending(key: string, uploadedFile: File): void {
    if (this.filesObligatorios[key]?.length) {
      this.filesObligatorios[key] = this.filesObligatorios[key].filter(
        (file) =>
          !(
            file.name === uploadedFile.name &&
            file.size === uploadedFile.size &&
            file.lastModified === uploadedFile.lastModified
          ),
      );
    }

    if (this.filesOpcionales[key]?.length) {
      this.filesOpcionales[key] = this.filesOpcionales[key].filter(
        (file) =>
          !(
            file.name === uploadedFile.name &&
            file.size === uploadedFile.size &&
            file.lastModified === uploadedFile.lastModified
          ),
      );
    }
  }

  private getDocumentTypeIdByKey(key: string): number {
    const expectedCode = this.documentTypeCodeByKey[key];

    console.groupCollapsed(`🔎 RESOLVIENDO TIPO DOCUMENTAL: ${key}`);

    console.log('🔑 KEY FRONTEND:', key);
    console.log('🏷️ CÓDIGO BACKEND ESPERADO:', expectedCode);

    if (!expectedCode) {
      console.error('❌ NO EXISTE MAPEO FRONTEND PARA LA KEY:', key);
      console.groupEnd();

      throw new Error(`No existe mapeo frontend para el documento ${key}`);
    }

    const found = this.documentTypes.find(
      (type: any) =>
        String(type.code || '')
          .trim()
          .toUpperCase() === String(expectedCode).trim().toUpperCase(),
    );

    if (!found?.id) {
      console.error('❌ TIPO DOCUMENTAL NO ENCONTRADO EN EL CATÁLOGO BACKEND');

      console.table(
        this.documentTypes.map((type: any) => ({
          id: type.id,
          code: type.code,
          name: type.name,
          required: type.required,
          documentGroup: type.documentGroup,
        })),
      );

      console.groupEnd();

      throw new Error(
        `No existe tipo de documento backend para el código ${expectedCode}`,
      );
    }

    console.log('✅ TIPO DOCUMENTAL RESUELTO:', {
      key,
      expectedCode,
      documentTypeId: Number(found.id),
      backendType: found,
    });

    console.groupEnd();

    return Number(found.id);
  }

  private buildDocumentStoragePath(key: string, file: File): string {
    const postulationId = this.postulationId || 'sin-postulacion';
    const safeName = this.sanitizeFileName(file.name);

    return `/uploads/bienestar/${postulationId}/${key}/${safeName}`;
  }

  private buildDocumentChecksum(key: string, file: File): string {
    const postulationId = this.postulationId || 'sin-postulacion';
    return `${postulationId}-${key}-${file.name}-${file.size}-${file.lastModified}`;
  }

  private sanitizeFileName(fileName: string): string {
    return String(fileName || 'documento')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private buildDocumentFingerprint(
    documentTypeId: number,
    originalFilename: string,
    sizeBytes: number,
  ): string {
    return `${documentTypeId}|${originalFilename}|${sizeBytes}`;
  }

  private seedUploadedDocumentFingerprintsFromSummary(): void {
    const documents = (this.summary as any)?.documents || [];

    for (const doc of documents) {
      const documentTypeId = Number(
        doc.documentTypeId || doc.document_type_id || 0,
      );
      const originalFilename = String(
        doc.originalFilename || doc.original_filename || doc.fileName || '',
      );
      const sizeBytes = Number(
        doc.sizeBytes || doc.size_bytes || doc.fileSize || 0,
      );

      if (documentTypeId && originalFilename) {
        this.uploadedDocumentFingerprints.add(
          this.buildDocumentFingerprint(
            documentTypeId,
            originalFilename,
            sizeBytes,
          ),
        );
      }
    }
  }

  private restoreDocumentsFromSummary(summary: any): void {
    this.uploadedDocumentsByKey = {};

    const documents = Array.isArray(summary?.documents)
      ? summary.documents
      : [];

    console.log('📂 DOCUMENTOS RECIBIDOS DESDE SUMMARY:', documents);

    for (const doc of documents) {
      const documentTypeCode =
        doc.documentTypeCode ||
        doc.document_type_code ||
        doc.documentType?.code ||
        doc.document_type?.code ||
        '';

      const documentTypeId = Number(
        doc.documentTypeId ||
          doc.document_type_id ||
          doc.documentType?.id ||
          doc.document_type?.id ||
          0,
      );

      const key =
        this.getDocumentKeyByTypeCode(documentTypeCode) ||
        this.getDocumentKeyByTypeId(documentTypeId);

      console.log('🧩 RESTAURANDO DOCUMENTO BACKEND:', {
        id: doc.id,
        originalFilename:
          doc.originalFilename || doc.original_filename || doc.fileName,
        documentTypeCode,
        documentTypeId,
        key,
      });

      if (!key) {
        console.warn(
          '⚠️ DOCUMENTO OMITIDO: NO SE PUDO RESOLVER SU CATEGORÍA',
          doc,
        );

        continue;
      }

      if (!this.uploadedDocumentsByKey[key]) {
        this.uploadedDocumentsByKey[key] = [];
      }

      const alreadyExists = this.uploadedDocumentsByKey[key].some(
        (existing: any) => {
          const existingId = Number(existing.id || 0);

          const docId = Number(doc.id || 0);

          return (
            (existingId && docId && existingId === docId) ||
            ((existing.originalFilename ||
              existing.original_filename ||
              existing.fileName) ===
              (doc.originalFilename || doc.original_filename || doc.fileName) &&
              Number(
                existing.sizeBytes ||
                  existing.size_bytes ||
                  existing.fileSize ||
                  0,
              ) ===
                Number(doc.sizeBytes || doc.size_bytes || doc.fileSize || 0))
          );
        },
      );

      if (!alreadyExists) {
        this.uploadedDocumentsByKey[key].push(doc);
      }
    }

    console.log(
      '✅ DOCUMENTOS AGRUPADOS PARA MOSTRAR EN STEP 9:',
      this.uploadedDocumentsByKey,
    );
  }

  private getDocumentKeyByTypeId(documentTypeId: number): string | null {
    if (!documentTypeId) {
      return null;
    }

    const documentType = this.documentTypes.find(
      (type: any) => Number(type.id) === Number(documentTypeId),
    );

    if (!documentType?.code) {
      return null;
    }

    return this.getDocumentKeyByTypeCode(documentType.code);
  }

  private getDocumentKeyByTypeCode(code: string): string | null {
    const normalized = String(code || '').toUpperCase();

    const found = Object.entries(this.documentTypeCodeByKey).find(
      ([, backendCode]) =>
        String(backendCode || '').toUpperCase() === normalized,
    );

    return found ? found[0] : null;
  }

  getBackendDocumentsForKey(key: string): any[] {
    return this.uploadedDocumentsByKey[key] || [];
  }

  hasBackendDocumentsForKey(key: string): boolean {
    return this.getBackendDocumentsForKey(key).length > 0;
  }

  async cierrePostulacion(): Promise<boolean> {
    if (!this.postulationId || this.isSaving || this.isFinalizing) {
      return false;
    }

    const activePostulationId = Number(this.postulationId);

    try {
      this.isSaving = true;
      this.isFinalizing = true;

      this.dialog.closeAll();

      // =====================================
      // 🔥 1) LOAD LATEST SUMMARY
      // =====================================

      const latestSummary: any = await firstValueFrom(
        this.wellbeingPostulationService.getSummary(activePostulationId),
      );

      if (latestSummary) {
        this.summary = latestSummary;
        this.restoreFullStateFromSummary(latestSummary);
      }

      // =====================================
      // 🔥 2) VALIDATE CAN SUBMIT
      // =====================================

      if (latestSummary?.canSubmit === false) {
        const pending = Array.isArray(latestSummary?.pendingRequiredDocuments)
          ? latestSummary.pendingRequiredDocuments
          : [];

        const pendingText = pending.join('\n• ');

        this.showWarning(
          pending.length
            ? `No es posible enviar. Faltan documentos obligatorios:\n\n• ${pendingText}`
            : 'No es posible enviar. Existen antecedentes obligatorios pendientes.',
        );

        return false;
      }

      // =====================================
      // 🔥 3) VALIDATE CURRENT STATUS
      // Si ya está enviada, NO reenviar correo
      // =====================================

      const currentStatus = String(
        latestSummary?.postulation?.status || '',
      ).toUpperCase();

      const alreadySubmitted = [
        'SUBMITTED',
        'UNDER_REVIEW',
        'EN_REVISION',
      ].includes(currentStatus);

      if (alreadySubmitted) {
        this.currentStep = 11;
        this.isSubmitted = true;

        this.postulationId = Number(
          latestSummary?.postulation?.id || activePostulationId,
        );

        this.selectedPostulationViewId = this.postulationId;

        this.codigoPostulacion =
          latestSummary?.postulation?.code || this.codigoPostulacion;

        this.wellbeingStorageService.savePostulationId(this.postulationId);
        this.wellbeingStorageService.saveCurrentStep(11);
        this.saveWorkflow();

        requestAnimationFrame(() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto',
          });
        });

        this.showWarning(
          'Esta postulación ya fue enviada y no puede volver a enviarse.',
        );

        return false;
      }

      // =====================================
      // 🔥 4) SUBMIT POSTULATION
      // =====================================

      const response: any = await firstValueFrom(
        this.wellbeingWorkflowService.submitPostulation(activePostulationId),
      );

      const submittedPostulation = {
        ...(latestSummary?.postulation || {}),
        ...(response || {}),
        status: response?.status || 'SUBMITTED',
        currentStep: Number(response?.currentStep || 11),
      };

      // =====================================
      // 🔥 5) UPDATE LOCAL SUMMARY
      // =====================================

      this.summary = {
        ...(latestSummary || {}),
        postulation: submittedPostulation,
      };

      this.postulationId = Number(
        submittedPostulation.id || activePostulationId,
      );

      this.codigoPostulacion =
        submittedPostulation.code || this.codigoPostulacion;

      this.currentStep = 11;
      this.isSubmitted = true;
      this.selectedPostulationViewId = this.postulationId;

      this.restoreFullStateFromSummary(this.summary);

      this.currentStep = 11;
      this.isSubmitted = true;

      // =====================================
      // 🔥 6) SAVE LOCAL WORKFLOW
      // =====================================

      this.wellbeingStorageService.savePostulationId(this.postulationId);
      this.wellbeingStorageService.saveCurrentStep(11);
      this.saveWorkflow();

      // =====================================
      // 🔥 7) UPDATE POSTULATION SELECTOR
      // =====================================

      this.availablePostulations = this.mergePostulationLists(
        this.availablePostulations,
        [submittedPostulation],
      );

      // =====================================
      // 🔥 8) FINAL UI
      // =====================================

      this.dialog.closeAll();

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto',
        });
      });

      // =====================================
      // 🔥 9) NON-BLOCKING REFRESH
      // =====================================

      this.refreshSubmittedSummaryNonBlocking();

      // 🔥 CLAVE:
      // Solo aquí retorna true, porque se cerró recién ahora.
      // submitPostulation() usará esto para enviar el correo una sola vez.
      return true;
    } catch (e: any) {
      console.error('❌ ERROR SUBMIT POSTULATION:', e);

      if (e?.status === 401) {
        this.showError(
          'No fue posible enviar la postulación. Puede que la sesión no tenga autorización, que la postulación ya esté cerrada o que no pertenezca al usuario actual.',
        );

        return false;
      }

      this.showError('Error enviando postulación');

      return false;
    } finally {
      this.isSaving = false;
      this.isFinalizing = false;
    }
  }

  private refreshSubmittedSummaryNonBlocking(): void {
    setTimeout(async () => {
      try {
        if (!this.postulationId) {
          return;
        }

        const refreshedSummary: any = await firstValueFrom(
          this.wellbeingPostulationService.getSummary(this.postulationId),
        );

        if (!refreshedSummary?.postulation) {
          return;
        }

        this.summary = refreshedSummary;

        this.restoreFullStateFromSummary(refreshedSummary);

        this.currentStep = 11;
        this.isSubmitted = true;
      } catch (err) {
        console.warn(
          'No fue posible refrescar summary después del submit. Se mantiene summary previo.',
          err,
        );
      }
    }, 0);
  }

  // =========================================================
  // 🔥 RESET WORKFLOW
  // =========================================================

  async resetWorkflow() {
    this.afiliado = null;
    this.grupoFamiliar = [];
    this.salud = [];
    this.postulationId = null;
    this.summary = null;
    this.afiliadoValido = false;
    await this.moveToStep(1);
    this.wellbeingStorageService.clearAll();
    this.ingresosFamiliares = [
      {
        familiarId: null,
        monto: 0,
        open: true,
      },
    ];

    this.otrosGastos = [
      {
        glosa: '',
        monto: 0,
        open: true,
      },
    ];
    this.filesObligatorios = {};
    this.filesOpcionales = {};
    this.uploadedDocumentsByKey = {};
    console.log('🧹 WORKFLOW RESET');
  }

  formatearMontoOtro(event: any, item: OtroGasto) {
    this.formatCurrencyInput(event, (numero) => {
      item.monto = numero;
    });
  }

  toggleFamiliar(index: number) {
    const f = this.grupoFamiliar[index];
    f.open = !f.open;
  }

  eliminarFamiliar(index: number) {
    const familiar = this.grupoFamiliar[index];

    // =====================================
    // 🔥 NO ELIMINAR TITULAR
    // =====================================

    if (familiar?.titular) {
      this.showWarning('El titular de la postulación no puede eliminarse');

      return;
    }

    // =====================================
    // 🔥 VALIDAR USO EN INGRESOS
    // =====================================

    const usadoEnIngresos = this.ingresosFamiliares.some(
      (i: any) => i.familiarId === familiar.id,
    );

    if (usadoEnIngresos) {
      this.showWarning(
        'El integrante está siendo utilizado en ingresos familiares',
      );

      return;
    }

    // =====================================
    // 🔥 REMOVE
    // =====================================

    this.grupoFamiliar.splice(index, 1);

    // =====================================
    // 🔥 OPEN LAST
    // =====================================

    if (this.grupoFamiliar.length) {
      this.grupoFamiliar[this.grupoFamiliar.length - 1].open = true;
    }
  }

  // =========================================================
  // 🔥 NEXT STEP
  // =========================================================

  async nextStep() {
    // En postulaciones enviadas/en revisión permitimos navegar visualmente,
    // pero no ejecutar guardados sobre endpoints editables.
    if (this.isSubmitted) {
      await this.moveToStep(Math.min(this.currentStep + 1, 11));
      return;
    }

    if (!this.validateCurrentStep()) {
      return;
    }

    switch (this.currentStep) {
      // =====================================
      // 🔥 STEP 1
      // =====================================

      case 1:
        // =====================================
        // 🔥 CREATE WORKFLOW
        // =====================================

        if (!this.postulationId) {
          await this.createPostulation(false);
        }

        // =====================================
        // 🔥 SAVE STEP 1
        // =====================================

        await this.saveStep1Affiliate();

        break;

      case 2:
        await this.saveStep2FamilyMembers();
        break;

      case 3:
        await this.saveStep3Beneficiary();
        break;

      case 4:
        await this.saveStep4AcademicBackground();
        break;

      case 5:
        await this.saveStep5AcademicVerification();
        break;

      case 6:
        await this.saveStep6FamilyIncomes();
        break;

      case 7:
        await this.saveStep7FamilyExpenses();
        break;

      case 8:
        await this.saveStep8HealthAndHousing();
        break;

      case 9:
        await this.saveStep9Documents();
        break;

      case 10:
        await this.submitPostulation();
        break;

      default:
        await this.moveToStep(this.currentStep + 1);
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;

      if (this.currentStep === 6) {
        this.normalizarIngresosParaStep6();
      }
    }
  }

  private normalizarIngresosParaStep6(): void {
    this.ingresosFamiliares = this.ingresosFamiliares.map((ingreso: any) => {
      const familiar = this.grupoFamiliar.find((f: any) => {
        return (
          Number(f.backendId) === Number(ingreso.familiarId) ||
          Number(f.id) === Number(ingreso.familiarId)
        );
      });

      if (!familiar) {
        return ingreso;
      }

      return {
        ...ingreso,
        familiarId: Number(familiar.backendId || familiar.id),
      };
    });

    console.log('🔁 INGRESOS NORMALIZADOS STEP 6:', {
      ingresosFamiliares: this.ingresosFamiliares,
      grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
        id: f.id,
        backendId: f.backendId,
        nombre: f.nombre,
      })),
    });
  }

  refreshFamilySummary() {
    this.grupoFamiliar = [...this.grupoFamiliar];
  }

  get familiaresAdicionales() {
    return this.grupoFamiliar.filter((f) => !f.titular);
  }

  get progress(): number {
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  getHousingName(id: number): string {
    return this.typesHousing.find((t: TypeHousing) => t.id === id)?.name || '-';
  }

  getPropertyName(id: number): string {
    return (
      this.typesProperties.find((t: TypeProperty) => t.id === id)?.name || '-'
    );
  }

  agregarSalud() {
    // 🔥 cerrar todos primero (UX PRO)
    this.salud.forEach((s) => (s.open = false));

    // 🔥 crear nuevo registro
    const nuevo = {
      id: Date.now(),
      nombre: '',
      familiarId: undefined,
      patologia: '',
      gasto: 0,
      open: true, // 🔥 ESTE ES CLAVE
    };

    this.salud.push(nuevo);
  }

  toggleSalud(i: number) {
    this.salud[i].open = !this.salud[i].open;
  }

  eliminarSalud(i: number) {
    this.salud.splice(i, 1);
  }

  get totalGastosBasicos(): number {
    return this.camposGastosBasicos.reduce((acc, campo) => {
      const valor = Number(
        String(this.form.get(campo.key)?.value || 0).replace(/\./g, ''),
      );
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
  }

  // 🔹 TOTAL GASTOS EDUCACIÓN
  get totalGastosEducacion(): number {
    return this.camposGastosEducacion.reduce((acc, campo) => {
      const valor = Number(
        String(this.form.get(campo.key)?.value || 0).replace(/\./g, ''),
      );
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
  }

  get totalGastos(): number {
    const f = this.form.value;

    return [
      f.arriendo,
      f.luz,
      f.agua,
      f.gas,
      f.telefonoGasto,
      f.creditos,
      f.matricula,
      f.mensualidad,
      f.alojamiento,
    ]
      .map((v) => Number(v) || 0) // 🔥 limpia todo
      .reduce((acc, val) => acc + val, 0);
  }

  getStablishmentName(id: any): string {
    const establecimiento = this.establecimientos.find((e: any) => {
      return Number(e.id) === Number(id);
    });

    return establecimiento?.name || '';
  }

  getSexoName(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const raw = String(value).trim().toUpperCase();

    if (raw === 'M' || raw === '1' || raw === 'MASCULINO') {
      return 'Masculino';
    }

    if (raw === 'F' || raw === '2' || raw === 'FEMENINO') {
      return 'Femenino';
    }

    const sexo = this.sexos.find((s: any) => {
      return Number(s.id) === Number(value);
    });

    return sexo?.name || String(value);
  }

  isStepValid(step: number): boolean {
    if (this.isSubmitted) {
      return true;
    }
    switch (step) {
      case 1:
        return this.getStep1Errors().length === 0;

      case 2:
        return this.getStep2Errors().length === 0;

      case 3:
        return !!this.form.value.esPostulante;

      case 4:
        return true;

      case 5:
        return true;

      case 6:
        return this.ingresosFamiliares.length > 0;

      case 7:
        return true;

      case 8:
        return true;

      case 9:
        return this.hasAllRequiredDocuments();

      case 10:
        return this.validateAll();

      case 11:
        return true;

      default:
        return true;
    }
  }

  goToStep(step: number): void {
    // =====================================
    // 🔒 STEP 11 NO SE NAVEGA MANUALMENTE
    // =====================================

    if (step === 11) {
      console.warn('⛔ Step 11 solo se alcanza al finalizar la postulación');
      return;
    }

    // =====================================
    // 🔒 DRAFT / OBSERVED
    // No permite saltar hacia adelante.
    //
    // 🔓 SUBMITTED / UNDER_REVIEW
    // Permite navegar libremente SOLO PARA MIRAR.
    // =====================================

    if (!this.isSubmitted && step > this.currentStep) {
      console.warn('⛔ No se puede saltar hacia pasos superiores:', {
        requestedStep: step,
        currentStep: this.currentStep,
      });
      return;
    }

    // =====================================
    // 👀 SOLO CAMBIO VISUAL
    // NO GUARDA EN BACKEND
    // =====================================

    this.currentStep = step;

    // =====================================
    // 🔥 FIX STEP 6
    // Cuando entra a ingresos, normaliza integrante
    // =====================================

    if (this.currentStep === 6) {
      this.normalizarIngresosParaStep6();
    }

    this.wellbeingStorageService.saveCurrentStep(step);

    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });

    console.log('👀 STEP VIEW ONLY:', {
      step,
      isSubmitted: this.isSubmitted,
    });
  }

  async irAlPaso(step: number) {
    if (step > this.currentStep + 1) {
      return;
    }
    await this.moveToStep(step);
  }

  tieneArchivoObligatorio(key: string): boolean {
    return (
      !!this.filesObligatorios[key]?.length ||
      !!this.uploadedDocumentsByKey[key]?.length
    );
  }

  // ============================
  // 📎 ARCHIVOS
  // ============================

  onFileSelected(event: any, key?: string) {
    const files: FileList = event.target.files;

    if (!files) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 🔥 Tipo
      if (!tiposPermitidos.includes(file.type)) {
        this.showWarning(`${file.name} no es un formato válido`);
        continue;
      }

      // 🔥 Tamaño
      if (file.size > 5 * 1024 * 1024) {
        this.showWarning(`${file.name} supera 5MB`);
        continue;
      }

      if (key) {
        if (!this.filesObligatorios[key]) {
          this.filesObligatorios[key] = [];
        }

        const existe = this.filesObligatorios[key].some(
          (f) => f.name === file.name && f.size === file.size,
        );

        if (existe) {
          this.showWarning(`${file.name} ya fue agregado`);
          continue;
        }

        this.filesObligatorios[key].push(file);

        this.showSuccess(`${file.name} cargado correctamente`);

        // 🔥 UX PRO
        const doc = this.documentosObligatorios.find((d) => d.key === key);
        if (doc) doc.open = false;
      }
    }

    // 🔥 CLAVE
    event.target.value = '';
  }

  removeFile(key: string, index: number) {
    this.filesObligatorios[key].splice(index, 1);
  }

  removeFileOpcional(key: string, index: number) {
    this.filesOpcionales[key].splice(index, 1);
  }

  // ============================
  // ⚠️ WARNING
  // ============================

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Atención',
        message,
        confirmText: 'Aceptar',
        icon: 'warning',
        color: 'warn',
      },
    });
  }

  showSuccess(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Éxito',
        message,
        confirmText: 'Aceptar',
        icon: 'check_circle',
        color: 'primary',
      },
    });
  }

  showError(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Error',
        message,
        confirmText: 'Aceptar',
        icon: 'error',
        color: 'warn',
      },
    });
  }

  // ============================
  // 📤 ENVIAR
  // ============================
  enviar() {
    if (!this.validateAll()) {
      return;
    }
    console.log('📤 Enviando...', this.form.value);
    this.showSuccess('Formulario enviado correctamente');
  }

  get totalIngresos(): number {
    const limpiar = (v: any) => Number(String(v).replace(/\./g, '')) || 0;

    return (
      limpiar(this.form.value.ingresoJefe) +
      limpiar(this.form.value.ingresoOtros) +
      limpiar(this.form.value.otrosIngresos)
    );
  }

  getCamposInvalidos(): string[] {
    const campos: any = {
      nombre: 'Nombres',
      apellido: 'Apellidos',
      rut: 'RUT',
      email: 'Correo institucional',
      grado: 'Grado',
      planta: 'Tipo de contrato',
      establecimiento: 'Establecimiento',
    };

    return Object.keys(this.form.controls)
      .filter((key) => this.form.get(key)?.invalid)
      .map((key) => campos[key] || key);
  }

  async existeRutLocal(rut: string): Promise<boolean> {
    const rutsExistentes = ['12.345.678-5'];

    const rutNormalizado = this.normalizarRut(rut);

    return rutsExistentes.some((r) => this.normalizarRut(r) === rutNormalizado);
  }

  completarCorreo(): void {
    const control = this.form.get('email');
    if (!control) return;

    let value = control.value;
    if (!value) return;

    value = value.trim().toLowerCase();

    // 🚫 si ya tiene dominio → no hacer nada
    if (value.includes('@')) return;

    const nuevo = `${value}@redsalud.gob.cl`;

    // ✅ solo actualizar si realmente cambió
    if (control.value !== nuevo) {
      control.setValue(nuevo);
      control.updateValueAndValidity();
    }
  }

  get cumpleAcademico(): boolean {
    if (!this.verificacion) return false;

    const promedio = this.verificacion.promedio ?? 0;
    const aprobacion = this.verificacion.aprobacion ?? 0;

    return promedio >= 5 && aprobacion >= 75;
  }

  get estadoAcademico(): 'ok' | 'error' {
    return this.cumpleAcademico ? 'ok' : 'error';
  }

  accesoSupervisor() {
    const clave = prompt('Ingrese clave de supervisor');

    if (clave === '1234') {
      // 🔥 navega o habilita modo admin
      console.log('Acceso permitido');
    } else {
      this.showWarning('Clave incorrecta');
    }
  }

  tieneArchivo(key: string): boolean {
    return (
      !!this.filesObligatorios[key]?.length ||
      !!this.uploadedDocumentsByKey[key]?.length
    );
  }

  tieneArchivoOpcional(key: string): boolean {
    return (
      !!this.filesOpcionales[key]?.length ||
      !!this.uploadedDocumentsByKey[key]?.length
    );
  }

  getTotalObligatoriosCargados(): number {
    return this.documentosObligatorios.filter((d) =>
      this.tieneArchivoObligatorio(d.key),
    ).length;
  }

  private hasAllRequiredDocuments(): boolean {
    const faltantes = this.documentosObligatorios.filter((doc: any) => {
      return !this.tieneArchivoObligatorio(doc.key);
    });

    console.log('📎 VALIDACIÓN DOCUMENTOS OBLIGATORIOS:', {
      totalObligatorios: this.documentosObligatorios.length,
      faltantes: faltantes.map((d: any) => ({
        key: d.key,
        label: d.label,
      })),
      filesObligatorios: this.filesObligatorios,
      filesOpcionales: this.filesOpcionales,
      uploadedDocumentsByKey: this.uploadedDocumentsByKey,
    });

    return faltantes.length === 0;
  }

  onFileSelectedOpcional(event: any, key: string): void {
    const files: FileList = event.target.files;

    console.groupCollapsed(`📎 ARCHIVO OPCIONAL SELECCIONADO: ${key}`);

    console.log('🔑 KEY FRONTEND:', key);
    console.log('🏷️ CÓDIGO BACKEND ESPERADO:', this.documentTypeCodeByKey[key]);
    console.log('📦 CANTIDAD DE ARCHIVOS SELECCIONADOS:', files?.length || 0);

    if (!files?.length) {
      console.warn('⚠️ No se seleccionaron archivos');
      console.groupEnd();
      return;
    }

    if (!this.filesOpcionales[key]) {
      this.filesOpcionales[key] = [];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      console.log(`📄 ARCHIVO ${i + 1}:`, {
        key,
        name: file.name,
        type: file.type,
        sizeBytes: file.size,
        sizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
        lastModified: file.lastModified,
      });

      if (file.size > 5 * 1024 * 1024) {
        console.warn('⛔ ARCHIVO RECHAZADO POR TAMAÑO:', file.name);
        this.showWarning(`${file.name} supera 5MB`);
        continue;
      }

      const existe = this.filesOpcionales[key].some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size,
      );

      if (existe) {
        console.warn('⚠️ ARCHIVO DUPLICADO, NO SE AGREGA:', file.name);
        continue;
      }

      this.filesOpcionales[key].push(file);

      console.log('✅ ARCHIVO OPCIONAL AGREGADO AL FRONTEND:', {
        key,
        fileName: file.name,
        totalArchivosEnCategoria: this.filesOpcionales[key].length,
      });
    }

    console.log(
      '📚 ESTADO ACTUAL DE ARCHIVOS OPCIONALES:',
      this.filesOpcionales,
    );

    console.groupEnd();

    // Permite volver a seleccionar el mismo archivo si se elimina manualmente.
    event.target.value = '';
  }

  toggleDoc(doc: any) {
    const todas = [
      ...this.documentosObligatorios,
      ...this.documentosOpcionales,
    ];

    // 👉 si ya está abierto → cerrar todo
    if (doc.open) {
      todas.forEach((d) => (d.open = false));
      return;
    }

    // 👉 cerrar todos
    todas.forEach((d) => (d.open = false));

    // 👉 abrir solo el seleccionado
    doc.open = true;
  }

  validarRut(rut: string): boolean {
    const clean = rut.replace(/\./g, '').replace('-', '');

    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    let suma = 0;
    let multiplo = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      suma += Number(body[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const dvEsperado = 11 - (suma % 11);

    let dvFinal = '';

    if (dvEsperado === 11) dvFinal = '0';
    else if (dvEsperado === 10) dvFinal = 'K';
    else dvFinal = dvEsperado.toString();

    return dvFinal === dv;
  }

  formatearRutValue(value: string): string {
    let clean = value.toUpperCase().replace(/[^0-9K]/g, '');

    if (!clean) return '';

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let formatted = '';

    for (let i = body.length; i > 0; i -= 3) {
      const start = Math.max(i - 3, 0);
      formatted = body.substring(start, i) + (formatted ? '.' + formatted : '');
    }

    return `${formatted}-${dv}`;
  }

  procesarRut(event: any, persona?: any) {
    let valor = event.target.value.replace(/[^0-9kK]/g, '').toUpperCase();

    if (valor.length > 1) {
      const cuerpo = valor.slice(0, -1);
      const dv = valor.slice(-1);

      valor = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    }

    if (persona) {
      persona.rut = valor;
    } else {
      this.form.get('rut')?.setValue(valor, { emitEvent: false });
    }
  }

  async validarRutGeneral(f: Familiar) {
    // =====================================
    // 🔥 NO RUT
    // =====================================

    if (!f.rut) {
      return;
    }

    // =====================================
    // 🔥 EVITAR DOBLE EJECUCIÓN
    // =====================================

    if (f.searching) {
      return;
    }

    try {
      f.searching = true;

      // =====================================
      // 🔥 NORMALIZAR
      // =====================================

      f.rut = f.rut.trim().toUpperCase();

      // =====================================
      // 🔥 VALIDAR RUT
      // =====================================

      const valido = this.validarRut(f.rut);

      if (!valido) {
        this.showWarning('RUT inválido');

        f.existsInUsers = false;

        f.notFound = false;

        return;
      }

      // =====================================
      // 🔥 DUPLICADOS
      // =====================================

      const currentRut = this.cleanRut((f.rut || '').replace(/\./g, ''));

      const repetido = this.grupoFamiliar.some((x: Familiar) => {
        if (x === f) {
          return false;
        }

        const compareRut = this.cleanRut((x.rut || '').replace(/\./g, ''));

        return compareRut === currentRut;
      });

      if (repetido) {
        this.showWarning('El RUT ya existe en el grupo familiar');

        f.rut = '';

        return;
      }

      // =====================================
      // 🔥 SEARCH USER
      // =====================================

      console.log('🚀 SEARCHING:', f.rut);

      const response: any = await firstValueFrom(
        this.usersService.searchUsers(String(f.rut || '').replace(/\./g, '')),
      );

      console.log('📦 RESPONSE:', response);

      // =====================================
      // 🔥 USERS
      // =====================================

      const users = Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response?.data)
            ? response.data
            : response?.id
              ? [response]
              : [];

      // =====================================
      // 🔥 MATCH
      // =====================================

      const searchRut = this.cleanRut(String(f.rut || '').replace(/\./g, ''));

      const user = users.find((u: any) => {
        const userRut = this.cleanRut(String(u?.rut || '').replace(/\./g, ''));

        return userRut === searchRut;
      });

      console.log('👤 USER:', user);

      // =====================================
      // 🔥 ENCONTRADO
      // =====================================

      if (user) {
        f.id = user.id || -1;
        f.nombre = `${user.firstName || ''} ${user.secondName || ''}`
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        f.apellido = `${user.firstLastName || ''} ${user.secondLastName || ''}`
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();
        f.birthDate = user.birth_date || null;
        f.previtionId = user.previtionId || null;
        f.existsInUsers = true;
        f.mustCreatePassive = false;
        f.notFound = false;
        f.source = 'USERS';
        console.log('✅ USER ENCONTRADO:', user);
        //this.showSuccess('Integrante encontrado en sistema');
        return;
      }

      // =====================================
      // 🔥 NO ENCONTRADO
      // =====================================

      f.nombre = '';
      f.apellido = '';
      f.birthDate = null;
      f.previtionId = undefined;
      f.existsInUsers = false;
      f.mustCreatePassive = true;
      f.notFound = true;
      f.source = 'MANUAL';
      //this.showWarning('🔥 VALIDAR RUT GENERAL - Usuario no encontrado');
    } catch (e) {
      console.error(e);
      f.existsInUsers = false;
      f.mustCreatePassive = true;
      f.notFound = true;
      f.source = 'MANUAL';
    } finally {
      f.searching = false;
    }
  }

  normalizarRut(rut: string): string {
    return rut.replace(/\./g, '').replace('-', '').toUpperCase();
  }

  private async generarComprobantePDFFile(): Promise<File> {
    const html = this.generarComprobanteHTML();

    const element = document.createElement('div');
    element.innerHTML = html;

    const opt = {
      margin: 10,
      filename: `comprobante-postulacion-${this.codigoPostulacion}.pdf`,
      image: {
        type: 'jpeg' as const,
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'letter' as const,
        orientation: 'portrait' as const,
      },
    };

    const blob: Blob = await (html2pdf() as any)
      .set(opt)
      .from(element)
      .outputPdf('blob');

    return new File(
      [blob],
      `comprobante-postulacion-${this.codigoPostulacion}.pdf`,
      {
        type: 'application/pdf',
      },
    );
  }

  async prepararComprobantePDF(): Promise<void> {
    try {
      console.log('📄 GENERANDO COMPROBANTE PDF...');

      this.comprobantePdfFile = await this.generarComprobantePDFFile();

      console.log('✅ COMPROBANTE PDF GENERADO:', this.comprobantePdfFile);

      this.showSuccess('Comprobante generado correctamente');
    } catch (e) {
      console.error('❌ ERROR GENERANDO COMPROBANTE:', e);

      this.showError('No fue posible generar el comprobante');
    }
  }

  async enviarCorreoPost(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.emailService.sendEmail({
          to: 'beneficios.bienestar@redsalud.gob.cl',

          subject: `Nueva postulación Bienestar SSM ${this.codigoPostulacion}`,

          message: `
                  Se ha generado una nueva postulación al beneficio Apoyo Estudios Superiores Bienestar SSM 2026.

                  Código de postulación: ${this.codigoPostulacion}

                  Datos del postulante:
                  Nombre: ${this.form.value.nombre} ${this.form.value.apellido}
                  RUT: ${this.form.value.rut}
                  Correo: ${this.form.value.email}
                  Teléfono: ${this.form.value.telefono || 'No informado'}                  
                  Calidad contractual: ${this.form.value.calidadContractual || 'No informado'}

                  Resumen:
                  Grupo familiar: ${this.grupoFamiliar.length} integrante(s)
                  Total ingresos familiares: $ ${Number(this.totalIngresosFamiliares || 0).toLocaleString('es-CL')}
                  Total gastos familiares: $ ${Number(this.totalGastos || 0).toLocaleString('es-CL')}
                  Total gastos salud: $ ${Number(this.totalSalud || 0).toLocaleString('es-CL')}

                  Sistema Gestión de Personas / Bienestar SSM.
        `.trim(),
        }),
      );

      console.log('✅ EMAIL POSTULACIÓN ENVIADO:', response);

      this.showSuccess(
        'Postulación enviada y aviso enviado por correo correctamente',
      );
    } catch (e) {
      console.error('💥 ERROR EMAIL POSTULACIÓN:', e);

      this.showWarning(
        'La postulación fue enviada correctamente, pero no fue posible enviar el aviso por correo.',
      );
    }
  }

  async descargarPDF() {
    try {
      if (!this.comprobantePdfFile) {
        await this.prepararComprobantePDF();
      }

      if (!this.comprobantePdfFile) {
        return;
      }

      const url = URL.createObjectURL(this.comprobantePdfFile);

      const link = document.createElement('a');
      link.href = url;
      link.download = this.comprobantePdfFile.name;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('❌ ERROR DESCARGANDO PDF:', e);

      this.showError('No fue posible descargar el comprobante');
    }
  }

  descargarPDF_ant() {
    const html = this.generarComprobanteHTML();

    const element = document.createElement('div');
    element.innerHTML = html;

    const opt = {
      margin: 10,
      filename: `comprobante-postulacion-${this.codigoPostulacion}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'letter' as const,
        orientation: 'portrait' as const,
      },
    };

    (html2pdf() as any).set(opt).from(element).save();
  }

  generarComprobanteHTML(): string {
    const logoGob = `${window.location.origin}/assets/logoGobierno.png`;
    const logoBienestar = `${window.location.origin}/assets/LOGO-BIENESTAR-SSM.png`;

    const f = this.form.value;

    const formatMoney = (value: any): string => {
      const number = Number(value || 0);

      return number.toLocaleString('es-CL');
    };

    const formatDate = (value: any): string => {
      if (!value) {
        return 'No informado';
      }

      try {
        return new Date(value).toLocaleDateString('es-CL');
      } catch {
        return String(value);
      }
    };

    const clean = (value: any): string => {
      if (value === null || value === undefined || value === '') {
        return 'No informado';
      }

      return String(value);
    };

    const getBoolean = (value: any): string => {
      return value ? 'Sí' : 'No';
    };

    const documentosCargados = [
      ...this.documentosObligatorios.map((doc: any) => ({
        label: doc.label,
        cargado: this.tieneArchivoObligatorio(doc.key),
        backend: this.getBackendDocumentsForKey(doc.key),
      })),

      ...this.documentosOpcionales.map((doc: any) => ({
        label: doc.label,
        cargado: this.tieneArchivoOpcional(doc.key),
        backend: this.getBackendDocumentsForKey(doc.key),
      })),
    ];

    const beneficiario =
      this.tipoPostulante === 'afiliado'
        ? `${clean(f.nombre)} ${clean(f.apellido)}`
        : `${clean(this.postulanteSeleccionado?.nombre)} ${clean(
            this.postulanteSeleccionado?.apellido,
          )}`;

    const htmlGrupoFamiliar = this.grupoFamiliar
      .map(
        (fam: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${clean(fam.rut)}</td>
          <td>${clean(fam.nombre)} ${clean(fam.apellido)}</td>
          <td>${clean(this.getParentTypeName(fam.parentTypeId))}</td>
          <td>${fam.titular ? 'Titular / Funcionario' : 'Familiar'}</td>
        </tr>
      `,
      )
      .join('');

    const htmlIngresos = this.ingresosFamiliares
      .map(
        (ingreso: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${clean(this.getNombreIngresoComprobante(ingreso))}</td>
          <td style="text-align:right;">$ ${formatMoney(ingreso.monto)}</td>
        </tr>
  `,
      )
      .join('');

    const htmlOtrosGastos = this.otrosGastos
      .filter((g: any) => g.glosa || Number(g.monto || 0) > 0)
      .map(
        (gasto: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${clean(gasto.glosa)}</td>
          <td style="text-align:right;">$ ${formatMoney(gasto.monto)}</td>
        </tr>
      `,
      )
      .join('');

    const htmlSalud = this.salud
      .filter(
        (s: any) =>
          s.nombre || s.familiarId || s.patologia || Number(s.gasto || 0) > 0,
      )
      .map(
        (salud: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${clean(this.getNombreFamiliar(salud.familiarId))}</td>
          <td>${clean(salud.patologia)}</td>
          <td style="text-align:right;">$ ${formatMoney(salud.gasto)}</td>
        </tr>
      `,
      )
      .join('');

    const htmlDocumentos = documentosCargados
      .map((doc: any) => {
        const tieneBackend = doc.backend?.length > 0;
        const estado = doc.cargado || tieneBackend ? 'Cargado' : 'Pendiente';

        const archivos = tieneBackend
          ? doc.backend
              .map(
                (d: any) =>
                  `<div style="font-size:10px; color:#475569;">${clean(
                    d.originalFilename || d.original_filename || d.fileName,
                  )}</div>`,
              )
              .join('')
          : '';

        return `
        <tr>
          <td>${clean(doc.label)}</td>
          <td style="text-align:center;">
            <span style="
              display:inline-block;
              padding:3px 8px;
              border-radius:12px;
              font-size:10px;
              font-weight:bold;
              color:${estado === 'Cargado' ? '#047857' : '#b45309'};
              background:${estado === 'Cargado' ? '#d1fae5' : '#fef3c7'};
            ">
              ${estado}
            </span>
            ${archivos}
          </td>
        </tr>
      `;
      })
      .join('');

    return `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1f2937;
    padding: 22px;
    max-width: 760px;
    margin: auto;
    line-height: 1.35;
  ">

    <!-- HEADER -->
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:14px;
    ">
      <img src="${logoGob}" style="height:48px;" />
      <img src="${logoBienestar}" style="height:52px;" />
    </div>

    <div style="
      text-align:center;
      border-top:3px solid #1565c0;
      border-bottom:1px solid #dbeafe;
      padding:12px 0;
      margin-bottom:12px;
    ">
      <h2 style="
        margin:0;
        color:#1565c0;
        font-size:18px;
        letter-spacing:0.5px;
      ">
        COMPROBANTE DE POSTULACIÓN
      </h2>

      <div style="
        margin-top:4px;
        font-size:12px;
        color:#475569;
        font-weight:bold;
      ">
        Apoyo Estudios Superiores · Bienestar SSM 2026
      </div>
    </div>

    <!-- META -->
    <div style="
      display:flex;
      justify-content:space-between;
      margin-bottom:14px;
      font-size:11px;
    ">
      <div>
        <strong>Fecha emisión:</strong>
        ${new Date().toLocaleString('es-CL')}
      </div>

      <div>
        <strong>N° Postulación:</strong>
        ${clean(this.codigoPostulacion)}
      </div>
    </div>

    <!-- ESTADO -->
    <div style="
      margin: 12px 0 16px 0;
      padding: 10px;
      border-radius: 8px;
      background: #ecfdf5;
      border: 1px solid #bbf7d0;
      color: #047857;
      font-weight: bold;
      text-align:center;
    ">
      POSTULACIÓN RECIBIDA PARA REVISIÓN
    </div>

    <!-- AFILIADO -->
    <h3 style="${this.getComprobanteTitleStyle()}">1. Datos del afiliado/a</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Nombre</strong></td>
        <td>${clean(f.nombre)} ${clean(f.apellido)}</td>
      </tr>
      <tr>
        <td><strong>RUT</strong></td>
        <td>${clean(f.rut)}</td>
      </tr>
      <tr>
        <td><strong>Teléfono</strong></td>
        <td>${clean(f.telefono)}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td>${clean(f.email)}</td>
      </tr>
      <tr>
        <td><strong>Fecha nacimiento</strong></td>
        <td>${formatDate(f.fechaNacimiento)}</td>
      </tr>
      <tr>
        <td><strong>Dirección</strong></td>
        <td>${clean(f.direccion)}</td>
      </tr>
      <tr>
        <td><strong>Calidad contractual</strong></td>
        <td>${clean(f.calidadContractual)}</td>
      </tr>
      <tr>
        <td><strong>Fecha afiliación</strong></td>
        <td>${formatDate(f.fechaAfiliacion)}</td>
      </tr>
      <tr>
        <td><strong>Hogar monoparental</strong></td>
        <td>${getBoolean(f.hogarMonoparental)}</td>
      </tr>
    </table>

    <!-- GRUPO FAMILIAR -->
    <h3 style="${this.getComprobanteTitleStyle()}">2. Grupo familiar</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <thead>
        <tr style="background:#eff6ff;">
          <th style="${this.getComprobanteThStyle()}">#</th>
          <th style="${this.getComprobanteThStyle()}">RUT</th>
          <th style="${this.getComprobanteThStyle()}">Nombre</th>
          <th style="${this.getComprobanteThStyle()}">Parentesco</th>
          <th style="${this.getComprobanteThStyle()}">Condición</th>
        </tr>
      </thead>
      <tbody>
        ${
          htmlGrupoFamiliar ||
          `<tr><td colspan="5">No registra grupo familiar</td></tr>`
        }
      </tbody>
    </table>

    <!-- BENEFICIARIO -->
    <h3 style="${this.getComprobanteTitleStyle()}">3. Beneficiario</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Tipo beneficiario</strong></td>
        <td>${
          this.tipoPostulante === 'afiliado'
            ? 'Afiliado/a'
            : 'Integrante grupo familiar'
        }</td>
      </tr>
      <tr>
        <td><strong>Beneficiario</strong></td>
        <td>${beneficiario}</td>
      </tr>
    </table>

    <!-- ACADEMICOS -->
    <h3 style="${this.getComprobanteTitleStyle()}">4. Antecedentes académicos</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Institución</strong></td>
        <td>${clean(this.academico.institucion)}</td>
      </tr>
      <tr>
        <td><strong>Carrera</strong></td>
        <td>${clean(this.academico.carrera)}</td>
      </tr>
      <tr>
        <td><strong>Tipo de estudio</strong></td>
        <td>${clean(this.getStudyName(this.academico.studyId))}</td>
      </tr>
      <tr>
        <td><strong>Semestre actual</strong></td>
        <td>${clean(this.academico.semestre)}</td>
      </tr>
      <tr>
        <td><strong>Duración carrera</strong></td>
        <td>${clean(this.academico.duracion)} semestres</td>
      </tr>
      <tr>
        <td><strong>Estudia en la región</strong></td>
        <td>${this.academico.region === 'si' ? 'Sí' : 'No'}</td>
      </tr>
      <tr>
        <td><strong>Beneficio anterior</strong></td>
        <td>${getBoolean(f.beneficiado)}</td>
      </tr>
    </table>

    <!-- VERIFICACION -->
    <h3 style="${this.getComprobanteTitleStyle()}">5. Verificación académica</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Situación académica</strong></td>
        <td>${clean(this.verificacion.tipo)}</td>
      </tr>
      <tr>
        <td><strong>Promedio de notas</strong></td>
        <td>${clean(this.verificacion.promedio)}</td>
      </tr>
      <tr>
        <td><strong>% aprobación</strong></td>
        <td>${clean(this.verificacion.aprobacion)}%</td>
      </tr>
    </table>

    <!-- INGRESOS -->
    <h3 style="${this.getComprobanteTitleStyle()}">6. Ingresos familiares</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <thead>
        <tr style="background:#eff6ff;">
          <th style="${this.getComprobanteThStyle()}">#</th>
          <th style="${this.getComprobanteThStyle()}">Integrante</th>
          <th style="${this.getComprobanteThStyle()}">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${
          htmlIngresos ||
          `<tr><td colspan="3">No registra ingresos familiares</td></tr>`
        }
      </tbody>
      <tfoot>
        <tr style="background:#f8fafc; font-weight:bold;">
          <td colspan="2">Total ingresos familiares</td>
          <td style="text-align:right;">$ ${formatMoney(
            this.totalIngresosFamiliares,
          )}</td>
        </tr>
      </tfoot>
    </table>

    <!-- GASTOS -->
    <h3 style="${this.getComprobanteTitleStyle()}">7. Gastos familiares</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Arriendo / Dividendo</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.arriendo)}</td>
      </tr>
      <tr>
        <td><strong>Luz</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.luz)}</td>
      </tr>
      <tr>
        <td><strong>Agua</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.agua)}</td>
      </tr>
      <tr>
        <td><strong>Gas</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.gas)}</td>
      </tr>
      <tr>
        <td><strong>Teléfono</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.telefonoGasto)}</td>
      </tr>
      <tr>
        <td><strong>Créditos</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.creditos)}</td>
      </tr>
      <tr>
        <td><strong>Matrícula</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.matricula)}</td>
      </tr>
      <tr>
        <td><strong>Mensualidad</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.mensualidad)}</td>
      </tr>
      <tr>
        <td><strong>Alojamiento</strong></td>
        <td style="text-align:right;">$ ${formatMoney(f.alojamiento)}</td>
      </tr>
      <tr style="background:#f8fafc; font-weight:bold;">
        <td>Total gastos familiares</td>
        <td style="text-align:right;">$ ${formatMoney(this.totalGastos)}</td>
      </tr>
    </table>

    ${
      htmlOtrosGastos
        ? `
        <h4 style="margin:10px 0 6px 0; color:#475569;">Otros gastos</h4>
        <table style="${this.getComprobanteTableStyle()}">
          <thead>
            <tr style="background:#eff6ff;">
              <th style="${this.getComprobanteThStyle()}">#</th>
              <th style="${this.getComprobanteThStyle()}">Glosa</th>
              <th style="${this.getComprobanteThStyle()}">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${htmlOtrosGastos}
          </tbody>
        </table>
      `
        : ''
    }

    <!-- SALUD -->
    <h3 style="${this.getComprobanteTitleStyle()}">8. Salud</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <thead>
        <tr style="background:#eff6ff;">
          <th style="${this.getComprobanteThStyle()}">#</th>
          <th style="${this.getComprobanteThStyle()}">Integrante</th>
          <th style="${this.getComprobanteThStyle()}">Patología</th>
          <th style="${this.getComprobanteThStyle()}">Gasto mensual</th>
        </tr>
      </thead>
      <tbody>
        ${htmlSalud || `<tr><td colspan="4">No registra antecedentes de salud</td></tr>`}
      </tbody>
      <tfoot>
        <tr style="background:#f8fafc; font-weight:bold;">
          <td colspan="3">Total salud</td>
          <td style="text-align:right;">$ ${formatMoney(this.totalSalud)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- VIVIENDA -->
    <h3 style="${this.getComprobanteTitleStyle()}">9. Vivienda</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <tr>
        <td><strong>Tipo vivienda</strong></td>
        <td>${clean(this.getHousingName(f.tipoVivienda))}</td>
      </tr>
      <tr>
        <td><strong>Tipo propiedad</strong></td>
        <td>${clean(this.getPropertyName(f.tipoPropiedad))}</td>
      </tr>
      <tr>
        <td><strong>Antecedentes habitacionales</strong></td>
        <td>${clean(f.infoVivienda)}</td>
      </tr>
      <tr>
        <td><strong>Otros antecedentes</strong></td>
        <td>${clean(f.otrosAntecedentes)}</td>
      </tr>
    </table>

    <!-- DOCUMENTOS -->
    <h3 style="${this.getComprobanteTitleStyle()}">10. Documentos adjuntos</h3>

    <table style="${this.getComprobanteTableStyle()}">
      <thead>
        <tr style="background:#eff6ff;">
          <th style="${this.getComprobanteThStyle()}">Documento</th>
          <th style="${this.getComprobanteThStyle()}">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${htmlDocumentos}
      </tbody>
    </table>

    <!-- RESUMEN FINAL -->
    <div style="
      margin-top:18px;
      padding:12px;
      border-radius:10px;
      background:#f8fafc;
      border:1px solid #e2e8f0;
    ">
      <div style="
        font-size:13px;
        font-weight:bold;
        color:#1565c0;
        margin-bottom:8px;
      ">
        Resumen económico
      </div>

      <div style="display:flex; justify-content:space-between;">
        <span>Total ingresos familiares</span>
        <strong>$ ${formatMoney(this.totalIngresosFamiliares)}</strong>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <span>Total gastos familiares</span>
        <strong>$ ${formatMoney(this.totalGastos)}</strong>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <span>Total salud</span>
        <strong>$ ${formatMoney(this.totalSalud)}</strong>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="
      margin-top:22px;
      padding-top:12px;
      border-top:1px solid #e5e7eb;
      text-align:center;
      font-size:10px;
      color:#64748b;
    ">
      Este comprobante acredita el ingreso de la postulación al sistema Bienestar SSM 2026.
      <br/>
      La postulación será revisada conforme a los antecedentes presentados.
    </div>

  </div>
  `;
  }

  getNombreIngresoComprobante(ingreso: any): string {
    const familiarId = Number(
      ingreso?.familiarId ||
        ingreso?.familyMemberId ||
        ingreso?.family_member_id ||
        ingreso?.backendFamilyMemberId ||
        0,
    );

    if (!familiarId) {
      return 'No informado';
    }

    const familiar = this.grupoFamiliar.find((f: any) => {
      return (
        Number(f.backendId) === familiarId ||
        Number(f.id) === familiarId ||
        Number(f.familyMemberId) === familiarId
      );
    });

    return familiar?.nombre || 'No informado';
  }

  getNombreIntegranteIngreso(familiarId: number | string | null): string {
    if (familiarId === null || familiarId === undefined || familiarId === '') {
      return 'No informado';
    }

    const familiar = this.grupoFamiliar.find((f: any) => {
      return (
        Number(f.backendId) === Number(familiarId) ||
        Number(f.id) === Number(familiarId)
      );
    });

    return familiar?.nombre || 'No informado';
  }

  getParentescoIntegranteIngreso(familiarId: number | string | null): string {
    if (familiarId === null || familiarId === undefined || familiarId === '') {
      return '';
    }

    const familiar = this.grupoFamiliar.find((f: any) => {
      return (
        Number(f.backendId) === Number(familiarId) ||
        Number(f.id) === Number(familiarId)
      );
    });

    if (!familiar) {
      return '';
    }

    return this.getParentTypeName(familiar.parentTypeId);
  }

  async nuevaPostulacion() {
    // =====================================
    // 🔥 CLEAR WORKFLOW LOCAL
    // =====================================

    this.wellbeingStorageService.clearAll();
    localStorage.removeItem('wellbeing_workflow');

    // =====================================
    // 🔥 CLEAR CURRENT POSTULATION
    // =====================================

    this.postulationId = null;
    this.summary = null;
    this.selectedPostulationViewId = null;
    this.codigoPostulacion = '';

    // =====================================
    // 🔥 CLEAR SUBMITTED / LOADING MODES
    // =====================================

    this.isSubmitted = false;
    this.isSaving = false;
    this.isFinalizing = false;
    this.isLoading = false;
    this.openingPostulation = false;
    this.pendingPostulationToOpen = null;

    // =====================================
    // 🔥 RESET STEP
    // =====================================

    this.currentStep = 1;

    // =====================================
    // 🔥 RESET STEP 2 - GRUPO FAMILIAR
    // =====================================

    this.grupoFamiliar = [];
    this.postulanteSeleccionado = null;
    this.tipoPostulante = 'afiliado';

    // =====================================
    // 🔥 RESET STEP 4 - ACADÉMICOS
    // =====================================

    this.academico = {
      institucion: '',
      carrera: '',
      studyId: null,
      semestre: null,
      duracion: null,
      region: '',
    };

    // =====================================
    // 🔥 RESET STEP 5 - VERIFICACIÓN
    // =====================================

    this.verificacion = {
      tipo: '',
      promedio: null,
      aprobacion: null,
    };

    // =====================================
    // 🔥 RESET STEP 6 - INGRESOS
    // =====================================

    this.ingresosFamiliares = [
      {
        familiarId: null,
        monto: 0,
        open: true,
      },
    ];

    // =====================================
    // 🔥 RESET STEP 7 - GASTOS
    // =====================================

    this.otrosGastos = [
      {
        glosa: '',
        monto: 0,
        open: true,
      },
    ];

    this.form.patchValue({
      ingresoJefe: null,
      ingresoOtros: 0,
      otrosIngresos: 0,

      arriendo: 0,
      luz: 0,
      agua: 0,
      gas: 0,
      telefonoGasto: 0,
      creditos: 0,
      matricula: 0,
      mensualidad: 0,
      alojamiento: 0,
    });

    // =====================================
    // 🔥 RESET STEP 8 - SALUD / VIVIENDA
    // =====================================

    this.salud = [];

    this.form.patchValue({
      tipoVivienda: null,
      tipoPropiedad: null,
      infoVivienda: '',
      otrosAntecedentes: '',
      typePropertyId: null,
      typeHousingId: null,
    });

    // =====================================
    // 🔥 RESET STEP 9 - DOCUMENTOS
    // =====================================

    this.filesObligatorios = {};
    this.filesOpcionales = {};
    this.uploadedDocumentsByKey = {};

    this.documentosObligatorios = this.documentosObligatorios.map((doc) => ({
      ...doc,
      open: false,
    }));

    this.documentosOpcionales = this.documentosOpcionales.map((doc) => ({
      ...doc,
      open: doc.key === 'liquidaciones',
    }));

    // =====================================
    // 🔥 RESET FORM STEP 1 PARCIAL
    // OJO: NO LIMPIAMOS CATÁLOGOS
    // =====================================

    this.form.patchValue({
      nombre: '',
      apellido: '',
      rut: '',
      telefono: '',
      email: '',
      direccion: '',
      planta: '',
      grado: null,
      fechaNacimiento: null,
      establecimiento: '',
      sexo: '',
      previtionId: null,

      tipoAfiliado: null,
      calidadContractual: null,

      fechaAfiliacion: null,
      esPostulante: 'si',
      beneficiado: 'no',
      hogarMonoparental: false,

      tipoBeneficiario: '',
      familiarId: null,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();

    // =====================================
    // 🔥 RETURN TO SELECTOR
    // =====================================

    this.showPostulationForm = false;

    // =====================================
    // 🔥 SCROLL TOP
    // =====================================

    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });

    console.log('🆕 VOLVIENDO A SELECTOR DE POSTULACIONES - FORM LIMPIO', {
      postulationId: this.postulationId,
      currentStep: this.currentStep,
      grupoFamiliar: this.grupoFamiliar.length,
      ingresosFamiliares: this.ingresosFamiliares.length,
      otrosGastos: this.otrosGastos.length,
      salud: this.salud.length,
      showPostulationForm: this.showPostulationForm,
    });
  }

  volverAlSelector(): void {
    // =====================================
    // 🔥 VOLVER AL MENÚ DE MIS POSTULACIONES
    // =====================================

    this.showPostulationForm = false;

    // =====================================
    // 🔥 LIMPIAR SELECCIÓN VISUAL
    // =====================================

    this.selectedPostulationViewId = null;

    // =====================================
    // 🔥 NO BORRAMOS LA POSTULACIÓN NI LOS DATOS
    // =====================================
    // Importante:
    // Si estás en Step 1, 2, 3, etc., solo salimos de la vista.
    // No limpiamos postulationId.
    // No hacemos form.reset().
    // No hacemos clearAll().
    // No creamos nueva postulación.

    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });

    console.log('↩️ VOLVIENDO AL SELECTOR SIN BORRAR DATOS');
  }

  isOtherActivitySelected(f: any): boolean {
    const activityId = Number(f?.activityId || 0);

    if (!activityId) {
      return false;
    }

    const activity = this.activities?.find((a: any) => {
      return Number(a.id) === activityId;
    });

    if (!activity) {
      return false;
    }

    const name = String(activity.name || '')
      .trim()
      .toUpperCase();

    return name === 'OTRO' || name === 'OTRA' || name.includes('OTRO');
  }

  onFamilyActivityChange(f: any): void {
    if (!this.isOtherActivitySelected(f)) {
      f.othersActivities = '';
    }
  }

  isOtherWorkPlaceSelected(f: any): boolean {
    const workPlaceId = Number(f?.workPlaceId || 0);

    if (!workPlaceId) {
      return false;
    }

    const workPlace = this.workPlaces?.find((w: any) => {
      return Number(w.id) === workPlaceId;
    });

    if (!workPlace) {
      return false;
    }

    const name = String(workPlace.name || '')
      .trim()
      .toUpperCase();

    return name === 'OTRO' || name === 'OTRA' || name.includes('OTRO');
  }

  onFamilyWorkPlaceChange(f: any): void {
    if (!this.isOtherWorkPlaceSelected(f)) {
      f.othersWorkplaces = '';
    }
  }

  getParentTypeName(id: number | string | undefined | null): string {
    if (id === null || id === undefined || id === '') {
      return '';
    }

    const parent = this.parentTypes.find(
      (p: any) => Number(p.id) === Number(id),
    );

    return parent?.name || '';
  }

  private toDateInputValue(value: any): string {
    if (!value) {
      return '';
    }

    return String(value).substring(0, 10);
  }

  private asegurarSeleccionVisualIngresos(): void {
    if (!this.ingresosFamiliares?.length || !this.grupoFamiliar?.length) {
      return;
    }

    this.ingresosFamiliares = this.ingresosFamiliares.map(
      (ingreso: any, index: number) => {
        // =====================================
        // 🔎 1. INTENTAR RESPETAR EL FAMILIAR YA GUARDADO
        // =====================================

        const familiarExistente = this.grupoFamiliar.find((f: any) => {
          return (
            Number(f.id) === Number(ingreso.familiarId) ||
            Number(f.backendId) === Number(ingreso.familiarId)
          );
        });

        if (familiarExistente) {
          return {
            ...ingreso,
            familiarId: familiarExistente.id,
          };
        }

        // =====================================
        // 🔥 2. SI NO CALZA, USAR EL MISMO ÍNDICE DEL CARD
        // Ingreso 1 -> Familiar 1
        // Ingreso 2 -> Familiar 2
        // =====================================

        const familiarPorIndex =
          this.grupoFamiliar[index] || this.grupoFamiliar[0];

        return {
          ...ingreso,
          familiarId: familiarPorIndex?.id ?? null,
        };
      },
    );

    console.log('🔁 INGRESOS AJUSTADOS VISUALMENTE:', {
      ingresosFamiliares: this.ingresosFamiliares,
      grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
        id: f.id,
        backendId: f.backendId,
        nombre: f.nombre,
        parentTypeId: f.parentTypeId,
      })),
    });
  }

  agregarFamiliar() {
    // =====================================
    // 🔥 CLOSE ALL
    // =====================================
    this.grupoFamiliar.forEach((f) => (f.open = false));
    // =====================================
    // 🔥 PUSH
    // =====================================
    this.grupoFamiliar.push({
      // =====================================
      // 🔥 UI
      // =====================================
      open: true,
      titular: false,
      existsInUsers: false,
      notFound: false,
      mustCreatePassive: false,
      source: 'MANUAL',
      searching: false,
      isComplete: false,

      // =====================================
      // 🔥 DATOS
      // =====================================
      id: Date.now(),
      rut: '',
      nombre: '',
      apellido: '',
      birthDate: null,
      previtionId: undefined,
      parentTypeId: undefined,
      civilStateId: undefined,

      activityId: undefined,
      othersActivities: '',

      workPlaceId: undefined,
      othersWorkplaces: '',

      studyId: undefined,
      studyPlace: '',

      estudiaRegion: '',
    });
    console.log('👨‍👩‍👧 Familiar agregado:', this.grupoFamiliar);
  }

  get saludArray(): FormArray {
    return this.form.get('salud') as FormArray;
  }

  crearSalud(): FormGroup {
    return this.fb.group({
      nombre: [''],
      familiarId: [null],
      patologia: [''],
      gasto: [0],
      open: [true],
    });
  }

  get postulanteFinal() {
    return this.tipoPostulante === 'afiliado'
      ? this.form.value
      : this.postulanteSeleccionado;
  }

  formatearMontoIngreso(event: any, index: number) {
    this.formatCurrencyInput(event, (numero) => {
      this.ingresosFamiliares[index].monto = numero;
    });
  }

  getParentescoIngreso(familiarId: number | string | null): string {
    if (familiarId === null || familiarId === undefined || familiarId === '') {
      return '';
    }

    const familiar = this.grupoFamiliar.find((f: any) => {
      return (
        Number(f.id) === Number(familiarId) ||
        Number(f.backendId) === Number(familiarId)
      );
    });

    if (!familiar) {
      return '';
    }

    return this.getParentTypeName(familiar.parentTypeId) || '';
  }

  getFamilyBackendKey(f: any): number | null {
    const id = Number(f?.backendId || f?.id || 0);

    return id > 0 ? id : null;
  }

  compareIds = (a: any, b: any): boolean => {
    if (a === null || a === undefined || b === null || b === undefined) {
      return a === b;
    }

    return Number(a) === Number(b);
  };

  onIngresoFamiliarChange(value: any, index: number): void {
    const selectedId = Number(value);

    const familiar = this.grupoFamiliar.find((f: any) => {
      return Number(f.backendId) === selectedId || Number(f.id) === selectedId;
    });

    if (!familiar) {
      this.ingresosFamiliares[index].familiarId = null;
      return;
    }

    this.ingresosFamiliares[index].familiarId = Number(
      familiar.backendId || familiar.id,
    );

    console.log('💰 INGRESO FAMILIAR SELECCIONADO:', {
      index,
      familiarId: this.ingresosFamiliares[index].familiarId,
      frontendId: familiar.id,
      backendId: familiar.backendId,
      nombre: familiar.nombre,
      parentTypeId: familiar.parentTypeId,
    });
  }

  private normalizeIngresosFamiliaresSelection(): void {
    this.ingresosFamiliares = this.ingresosFamiliares.map((ingreso: any) => {
      const familiar = this.grupoFamiliar.find((f: any) => {
        return (
          Number(f.id) === Number(ingreso.familiarId) ||
          Number(f.backendId) === Number(ingreso.familiarId)
        );
      });

      if (!familiar) {
        return {
          ...ingreso,
          familiarId: ingreso.familiarId ?? null,
        };
      }

      return {
        ...ingreso,
        familiarId: familiar.id,
      };
    });

    console.log('🔁 INGRESOS NORMALIZADOS PARA SELECT:', {
      ingresosFamiliares: this.ingresosFamiliares,
      grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
        id: f.id,
        backendId: f.backendId,
        nombre: f.nombre,
        parentTypeId: f.parentTypeId,
      })),
    });
  }

  estaSeleccionado(id: number | string, actualIndex: number): boolean {
    return this.ingresosFamiliares.some(
      (ing, i) => i !== actualIndex && Number(ing.familiarId) === Number(id),
    );
  }

  getNombreIngreso(value: any): string {
    const familiarId = Number(
      typeof value === 'object'
        ? value?.familiarId ||
            value?.familyMemberId ||
            value?.family_member_id ||
            value?.backendFamilyMemberId ||
            0
        : value || 0,
    );

    if (!familiarId) {
      console.warn('⚠️ INGRESO SIN FAMILIAR ID:', value);
      return 'No informado';
    }

    const familiar = this.grupoFamiliar.find((f: any) => {
      return (
        Number(f.backendId) === familiarId ||
        Number(f.id) === familiarId ||
        Number(f.familyMemberId) === familiarId
      );
    });

    if (!familiar) {
      console.warn('⚠️ NO SE ENCONTRÓ FAMILIAR PARA INGRESO:', {
        familiarId,
        value,
        grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
          id: f.id,
          backendId: f.backendId,
          familyMemberId: f.familyMemberId,
          nombre: f.nombre,
          parentTypeId: f.parentTypeId,
        })),
      });

      return 'No informado';
    }

    return familiar.nombre || 'No informado';
  }

  ngAfterViewChecked() {
    const el = document.querySelector('.step.active');
    el?.scrollIntoView({ behavior: 'auto', inline: 'center' });
  }

  getStepState(stepId: number) {
    if (this.currentStep === stepId) return 'active';

    const step = this.steps.find((s) => s.id === stepId);

    if (step?.error) return 'error';
    if (step?.valid) return 'done';

    return 'pending';
  }

  private trigger(id: string) {
    const input = document.getElementById(id) as HTMLInputElement;
    input?.click();
  }

  triggerFile(key: string) {
    this.trigger('file-' + key);
  }

  triggerFileOpcional(key: string) {
    const input = document.getElementById(
      'file-opc-' + key,
    ) as HTMLInputElement;
    input?.click();
  }

  async onRutCompleto() {
    const rut = this.form.value.rut;
    console.log('🪪 INPUT RUT:', rut);
    if (!rut) {
      console.log('❌ EMPTY RUT');
      return;
    }
    try {
      this.loadingAffiliate = true;
      // =====================================
      // 🔥 SEARCH USER
      // =====================================
      console.log('🚀 SEARCHING USER...');
      const response: any = await firstValueFrom(
        this.usersService.searchUsers(String(rut || '').replace(/\./g, '')),
      );
      console.log('✅ RESPONSE RECEIVED');
      console.log('==============================');
      console.log('🔍 SEARCH RUT:', rut);
      console.log('📦 RESPONSE:', response);
      console.log('📦 TYPE:', typeof response);
      console.log('📦 IS ARRAY:', Array.isArray(response));
      console.log('📦 CONTENT:', response?.content);
      console.log('📦 DATA:', response?.data);
      console.log('==============================');

      // =====================================
      // 🔥 USERS ARRAY
      // =====================================

      const users = Array.isArray(response)
        ? response
        : Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response?.data)
            ? response.data
            : response?.id
              ? [response]
              : [];

      console.log('👥 USERS:', users);

      // =====================================
      // 🔥 CLEAN RUT
      // =====================================

      const cleanRut = this.cleanRut(String(rut).replace(/\./g, ''));

      console.log('🔎 SEARCH RUT:', cleanRut);

      // =====================================
      // 🔥 FIND EXACT MATCH
      // =====================================

      const user = users.find((u: any) => {
        const userRut = this.cleanRut(String(u?.rut || '').replace(/\./g, ''));

        console.log('🪪 USER RUT:', userRut);

        return userRut === cleanRut;
      });

      console.log('👤 USER FOUND:', user);

      // =====================================
      // 🔥 NO USER
      // =====================================
      if (!user) {
        this.afiliado = null;
        this.afiliadoValido = false;
        this.grupoFamiliar = this.grupoFamiliar.filter((f) => !f.titular);
        this.showWarning('Usuario no encontrado');
        return;
      }
      // =====================================
      // 🔥 AFILIADO OK
      // =====================================
      this.afiliado = user;
      this.afiliadoValido = true;
      // =====================================
      // 🔥 PATCH FORM
      // =====================================

      this.patchAffiliate(user);

      // =====================================
      // 🔥 SYNC TITULAR
      // =====================================

      this.syncAffiliateToFamily();
    } catch (error) {
      console.error('❌ USER NOT FOUND', error);
      this.afiliado = null;
      this.grupoFamiliar = this.grupoFamiliar.filter((f) => !f.titular);
      this.afiliadoValido = false;
      this.form.patchValue({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        previtionId: null,
        fechaNacimiento: null,
        calidadContractual: null,
      });
    } finally {
      this.loadingAffiliate = false;
    }
  }

  getNombreFamiliar(id: number | null | undefined): string {
    if (!id) return 'No informado';

    const familiar = this.grupoFamiliar.find((f: any) => f.id === id);

    return familiar?.nombre || 'No informado';
  }

  cleanRut(rut?: string | null): string {
    if (!rut) {
      return '';
    }

    return rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  }

  formatDateSafe(value: string | Date): string {
    if (!value) return '';

    // 🔥 si ya es Date
    if (value instanceof Date) {
      const d = value.getDate().toString().padStart(2, '0');
      const m = (value.getMonth() + 1).toString().padStart(2, '0');
      const y = value.getFullYear();

      return `${d}/${m}/${y}`;
    }

    // 🔥 si es string ISO
    const [datePart] = value.split('T');
    const [y, m, d] = datePart.split('-');

    return `${d}/${m}/${y}`;
  }

  private syncAffiliateToFamily(): void {
    // =====================================
    // 🔥 FORM
    // =====================================

    const formValue = this.form.getRawValue();

    if (!formValue.rut) {
      console.warn('⚠️ No se sincroniza titular: formulario sin RUT');
      return;
    }

    // =====================================
    // 🔥 TITULAR EXISTENTE
    // =====================================

    let familiar = this.grupoFamiliar.find((f) => f.titular);

    // =====================================
    // 🔥 CREAR TITULAR SI NO EXISTE
    // =====================================

    if (!familiar) {
      familiar = {
        id: -1,

        rut: '',

        nombre: '',

        apellido: '',

        birthDate: null,

        parentTypeId: undefined,

        civilStateId: undefined,

        activityId: undefined,

        workPlaceId: undefined,

        studyId: undefined,

        previtionId: undefined,

        estudiaRegion: '',

        open: true,

        titular: true,

        existsInUsers: true,

        mustCreatePassive: false,

        source: 'AUTH',

        searching: false,

        notFound: false,

        isComplete: true,
      };

      this.grupoFamiliar.unshift(familiar);
    }

    // =====================================
    // 🔥 DATOS BASE DESDE STEP 1
    // =====================================

    familiar.id = this.afiliado?.id || familiar.id || -1;

    familiar.rut = formValue.rut || familiar.rut;

    familiar.nombre = (formValue.nombre || familiar.nombre || '')
      .trim()
      .toUpperCase();

    familiar.apellido = (formValue.apellido || familiar.apellido || '')
      .trim()
      .toUpperCase();

    familiar.birthDate =
      this.formatDateOnlyForBackend(formValue.fechaNacimiento) ||
      familiar.birthDate ||
      null;

    familiar.previtionId = familiar.previtionId || formValue.previtionId;

    familiar.workPlaceId = familiar.workPlaceId || formValue.workPlaceId;

    // =====================================
    // 🔥 FLAGS TITULAR
    // =====================================

    familiar.open = true;

    familiar.titular = true;

    familiar.existsInUsers = true;

    familiar.mustCreatePassive = false;

    familiar.source = 'AUTH';

    familiar.notFound = false;

    familiar.searching = false;

    familiar.isComplete = true;

    // =====================================
    // 🔥 PARENTESCO TITULAR
    // =====================================

    if (!familiar.parentTypeId) {
      const titular = this.parentTypes.find((p: any) => {
        const name = String(p.name || '').toLowerCase();

        return name.includes('titular') || name.includes('funcionario');
      });

      if (titular) {
        familiar.parentTypeId = titular.id;
      }
    }

    // =====================================
    // 🔥 DEBUG
    // =====================================

    console.log('✅ TITULAR SINCRONIZADO', familiar);

    console.log('👨‍👩‍👧‍👦 FAMILY AFTER SYNC:', {
      currentStep: this.currentStep,
      showPostulationForm: this.showPostulationForm,
      total: this.grupoFamiliar.length,
      grupoFamiliar: this.grupoFamiliar,
    });
  }

  private formatCurrencyInput(event: any, callback: (value: number) => void) {
    let value = event.target.value;

    value = value.replace(/\D/g, '');

    if (!value) {
      callback(0);

      event.target.value = '';

      return;
    }

    const numero = Number(value);

    callback(numero);

    event.target.value = numero.toLocaleString('es-CL');
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validateStep1();

      case 2:
        return this.validateStep2();

      case 3:
        return this.validateStep3();

      case 4:
        return this.validateStep4();

      case 5:
        return this.validateStep5();

      case 6:
        return this.validateStep6();

      case 7:
        return this.validateStep7();

      case 8:
        return this.validateStep8();

      default:
        return true;
    }
  }

  private handleStepTransitions() {
    if (this.currentStep === 1) {
      this.syncAffiliateToFamily();
    }
  }

  agregarIngreso() {
    this.ingresosFamiliares.forEach((i) => (i.open = false));

    this.ingresosFamiliares.push({
      familiarId: null,

      monto: 0,

      open: true,
    });
  }

  eliminarIngreso(index: number) {
    this.ingresosFamiliares.splice(index, 1);
  }

  get totalIngresosFamiliares(): number {
    return this.ingresosFamiliares.reduce(
      (sum: number, i: any) => sum + Number(i.monto || 0),
      0,
    );
  }

  formatearMonto(event: any, controlName: string) {
    this.formatCurrencyInput(event, (numero) => {
      this.form.get(controlName)?.setValue(numero, {
        emitEvent: false,
      });
    });
  }

  agregarGasto() {
    this.otrosGastos.push({
      glosa: '',
      monto: 0,
      open: true,
    });
  }

  toggleGasto(index: number) {
    this.otrosGastos[index].open = !this.otrosGastos[index].open;
  }

  eliminarGasto(index: number) {
    this.otrosGastos.splice(index, 1);
  }

  get totalOtrosGastos(): number {
    return this.otrosGastos.reduce(
      (sum: number, g: any) => sum + Number(g.monto || 0),
      0,
    );
  }

  formatearMontoSalud(event: any, s: any) {
    this.formatCurrencyInput(event, (numero) => {
      s.gasto = numero;
    });
  }

  get totalSalud(): number {
    return this.salud.reduce(
      (sum: number, s: any) => sum + Number(s.gasto || 0),
      0,
    );
  }

  async guardarFinal(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    await this.submitPostulation();
  }

  async submitPostulation() {
    const postulationClosed = await this.cierrePostulacion();

    if (!postulationClosed) {
      return;
    }

    await this.enviarCorreoPost();
  }

  validateAll(): boolean {
    const errores: string[] = [];
    // =====================================
    // 🔥 STEP 1
    // =====================================
    errores.push(...this.getStep1Errors());
    // =====================================
    // 🔥 STEP 2
    // =====================================
    errores.push(...this.getStep2Errors());
    // =====================================
    // 🔥 STEP 6
    // =====================================
    errores.push(...this.getStep6Errors());
    // =====================================
    // 🔥 DOCUMENTOS
    // =====================================
    const faltantes = this.documentosObligatorios
      .filter((doc) => !this.tieneArchivoObligatorio(doc.key))
      .map((doc) => doc.label);
    errores.push(...faltantes);
    // =====================================
    // 🔥 UNIQUE ERRORS
    // =====================================
    const erroresUnicos = [...new Set(errores)];
    // =====================================
    // 🔥 SHOW WARNING
    // =====================================
    if (erroresUnicos.length > 0) {
      this.showWarning(
        `Debe completar o adjuntar:\n\n• ${erroresUnicos.join('\n• ')}`,
      );
      return false;
    }
    return true;
  }

  private validateStep1(): boolean {
    const errores = this.getStep1Errors();
    if (errores.length > 0) {
      this.showWarning(
        `Faltan o son inválidos los siguientes campos:\n\n• ${errores.join('\n• ')}`,
      );
      return false;
    }
    return true;
  }

  private getStep1Errors(): string[] {
    const errores: string[] = [];
    const form = this.form.value;
    // =====================================
    // 🔥 CAMPOS OBLIGATORIOS
    // =====================================
    if (!form.rut) {
      errores.push('RUT');
    }
    if (!form.nombre) {
      errores.push('Nombres');
    }
    if (!form.apellido) {
      errores.push('Apellidos');
    }
    if (!form.telefono) {
      errores.push('Teléfono');
    }
    if (!form.email) {
      errores.push('Correo institucional');
    }
    if (!form.direccion) {
      errores.push('Dirección');
    }
    if (!form.fechaNacimiento) {
      errores.push('Fecha nacimiento');
    }
    if (!form.sexo) {
      errores.push('Sexo');
    }
    if (!form.establecimiento) {
      errores.push('Establecimiento');
    }
    if (!form.tipoAfiliado) {
      errores.push('Tipo afiliado');
    }
    /*
    if (!form.calidadContractual) {
      errores.push('Calidad contractual');
    }
      */

    if (!form.fechaAfiliacion) {
      errores.push('Fecha afiliación');
    }

    // =====================================
    // 🔥 RUT
    // =====================================

    if (form.rut && !this.validarRut(form.rut)) {
      errores.push('RUT válido');
    }
    // =====================================
    // 🔥 TELÉFONO
    // =====================================
    if (form.telefono && String(form.telefono).replace(/\D/g, '').length < 8) {
      errores.push('Teléfono válido');
    }
    // =====================================
    // 🔥 EMAIL
    // =====================================
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      errores.push('Correo institucional válido');
    }
    return errores;
  }

  private validateStep2(): boolean {
    const errores = this.getStep2Errors();

    if (errores.length > 0) {
      this.showWarning(
        `Grupo familiar incompleto:\n\n• ${errores.join('\n• ')}`,
      );

      return false;
    }

    return true;
  }

  private getStep2Errors(): string[] {
    const errores: string[] = [];

    // =====================================
    // 🔥 SIN FAMILIARES
    // =====================================

    if (this.grupoFamiliar.length === 0) {
      errores.push('Debe agregar al menos un familiar');
    }

    return errores;
  }

  private validateStep3(): boolean {
    return true;
  }
  private validateStep4(): boolean {
    const errores = this.getStep4Errors();

    if (errores.length > 0) {
      this.showWarning(
        `Antecedentes académicos incompletos:\n\n• ${errores.join('\n• ')}`,
      );

      return false;
    }

    return true;
  }

  private getStep4Errors(): string[] {
    const errores: string[] = [];

    if (!this.academico.institucion?.trim()) {
      errores.push('Debe ingresar institución');
    }

    if (!this.academico.carrera?.trim()) {
      errores.push('Debe ingresar carrera');
    }

    if (!this.academico.studyId) {
      errores.push('Debe seleccionar tipo de estudio');
    }

    if (!this.academico.semestre) {
      errores.push('Debe ingresar semestre actual');
    }

    if (!this.academico.duracion) {
      errores.push('Debe ingresar duración de la carrera');
    }

    if (!this.academico.region) {
      errores.push('Debe indicar si estudia en la región');
    }

    if (!['si', 'no'].includes(String(this.form.value.beneficiado))) {
      errores.push(
        'Debe indicar si el beneficiario ha recibido este beneficio anteriormente',
      );
    }

    return errores;
  }

  private validateStep5(): boolean {
    return true;
  }

  private validateStep6(): boolean {
    const errores = this.getStep6Errors();

    if (errores.length > 0) {
      this.showWarning(
        `Ingresos familiares incompletos:\n\n• ${errores.join('\n• ')}`,
      );

      return false;
    }

    return true;
  }

  private getStep6Errors(): string[] {
    const errores: string[] = [];

    if (this.ingresosFamiliares.length === 0) {
      errores.push('Debe ingresar ingresos familiares');
    }

    return errores;
  }

  private validateStep7(): boolean {
    return true;
  }
  private validateStep8(): boolean {
    return true;
  }

  async moveToStep(step: number) {
    this.currentStep = step;

    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });

    // =====================================
    // 🔥 SAVE CURRENT STEP
    // =====================================

    if (this.postulationId && this.currentStep <= 10 && !this.isSubmitted) {
      try {
        await firstValueFrom(
          this.wellbeingPostulationService.updateCurrentStep(
            this.postulationId,
            this.currentStep,
          ),
        );

        console.log('💾 STEP SAVED:', this.currentStep);
      } catch (e) {
        console.error('❌ ERROR SAVING STEP:', e);
      }
    }

    // =====================================
    // 🔥 STORAGE
    // =====================================

    this.wellbeingStorageService.saveCurrentStep(step);
  }

  validateFamilyMembers(): boolean {
    // =====================================
    // 🔥 SIN INTEGRANTES
    // =====================================

    if (!this.grupoFamiliar.length) {
      this.showWarning('Debe ingresar integrantes familiares');
      return false;
    }

    // =====================================
    // 🔥 HELPERS
    // =====================================

    const getNombreIntegrante = (f: Familiar, index: number): string => {
      const nombre = `${f.nombre || ''} ${f.apellido || ''}`
        .replace(/\s+/g, ' ')
        .trim();

      if (nombre) {
        return nombre;
      }

      if (f.titular) {
        return 'el titular';
      }

      return `el integrante familiar ${index + 1}`;
    };

    const warning = (f: Familiar, index: number, campo: string): boolean => {
      const nombre = getNombreIntegrante(f, index);

      this.showWarning(`Falta ${campo} para ${nombre}`);

      return false;
    };

    // =====================================
    // 🔥 VALIDAR TODOS
    // =====================================

    for (let i = 0; i < this.grupoFamiliar.length; i++) {
      const f = this.grupoFamiliar[i];

      // =====================================
      // 🔥 RUT
      // =====================================

      if (!f.rut) {
        return warning(f, i, 'RUT');
      }

      // =====================================
      // 🔥 NOMBRE
      // =====================================

      if (!f.nombre?.trim()) {
        return warning(f, i, 'nombre');
      }

      // =====================================
      // 🔥 APELLIDO
      // =====================================

      if (!f.apellido?.trim()) {
        return warning(f, i, 'apellido');
      }

      // =====================================
      // 🔥 FECHA NACIMIENTO
      // =====================================

      if (!f.birthDate) {
        return warning(f, i, 'fecha de nacimiento');
      }

      // =====================================
      // 🔥 PREVISIÓN
      // =====================================

      if (!f.previtionId) {
        return warning(f, i, 'previsión');
      }

      // =====================================
      // 🔥 PARENTESCO
      // =====================================

      if (!f.parentTypeId) {
        return warning(f, i, 'parentesco');
      }

      // =====================================
      // 🔥 ESTADO CIVIL
      // =====================================

      if (!f.civilStateId) {
        return warning(f, i, 'estado civil');
      }

      // =====================================
      // 🔥 ACTIVIDAD
      // =====================================

      if (!f.activityId) {
        return warning(f, i, 'actividad');
      }

      // =====================================
      // 🔥 LUGAR TRABAJO
      // =====================================

      if (!f.workPlaceId) {
        return warning(f, i, 'lugar de trabajo');
      }

      // =====================================
      // 🔥 ESTUDIOS
      // =====================================

      if (!f.studyId) {
        return warning(f, i, 'nivel de estudios');
      }

      // =====================================
      // 🔥 MANUAL
      // =====================================

      if (f.mustCreatePassive) {
        if (
          !f.nombre?.trim() ||
          !f.apellido?.trim() ||
          !f.birthDate ||
          !f.previtionId
        ) {
          const nombre = getNombreIntegrante(f, i);

          this.showWarning(
            `Complete todos los antecedentes obligatorios para ${nombre}`,
          );

          return false;
        }
      }
    }

    return true;
  }

  async deleteDraft(id: number) {
    console.log('🗑️ DELETE DRAFT:', id);
  }

  saveWorkflow() {
    const workflow = {
      userId: this.loggedUser?.id || null,

      postulationId: this.postulationId,

      step: this.currentStep,
    };

    localStorage.setItem('wellbeing_workflow', JSON.stringify(workflow));

    console.log('💾 WORKFLOW SAVED:', workflow);
  }

  private restoreFullStateFromSummary(summary: any): void {
    if (!summary) {
      return;
    }

    this.summary = summary;

    const postulation = summary.postulation || summary;

    if (postulation?.affiliate) {
      this.restoreAffiliateFromPostulation(postulation);
    }

    this.form.patchValue({
      hogarMonoparental: Boolean(postulation?.isSingleParentHome),
    });

    this.restoreFamilyMembersFromSummary(summary);
    this.restoreBeneficiaryFromSummary(summary);
    this.restoreAcademicInfoFromSummary(summary);
    this.restoreAcademicVerificationFromSummary(summary);
    this.restoreIncomesFromSummary(summary);
    this.restoreExpensesFromSummary(summary);
    this.restoreHealthFromSummary(summary);
    this.restoreHousingFromSummary(summary);
    this.restoreDocumentsFromSummary(summary);
    this.seedUploadedDocumentFingerprintsFromSummary();
  }

  private restoreBeneficiaryFromSummary(summary: any): void {
    const postulation = summary?.postulation || summary;
    const beneficiaryType = postulation?.beneficiaryType;
    const beneficiaryFamilyMemberId = Number(
      postulation?.beneficiaryFamilyMemberId || 0,
    );

    if (beneficiaryType === 'FAMILY_MEMBER' && beneficiaryFamilyMemberId) {
      this.tipoPostulante = 'familiar';
      this.postulanteSeleccionado =
        this.grupoFamiliar.find(
          (f: any) => Number(f.backendId) === beneficiaryFamilyMemberId,
        ) || null;
      this.form.patchValue({
        esPostulante: 'no',
        tipoBeneficiario: 'FAMILY_MEMBER',
        familiarId: this.postulanteSeleccionado?.id || null,
      });
    } else {
      this.tipoPostulante = 'afiliado';
      this.postulanteSeleccionado = null;
      this.form.patchValue({
        esPostulante: 'si',
        tipoBeneficiario: 'AFFILIATE',
        familiarId: null,
      });
    }
  }

  private restoreAcademicInfoFromSummary(summary: any): void {
    const academic = summary?.academicInfo;

    if (!academic) {
      return;
    }

    const rawStudiesInRegion =
      academic.studiesInRegion ?? academic.studies_in_region;

    const studiesInRegion =
      rawStudiesInRegion === true ||
      rawStudiesInRegion === 1 ||
      rawStudiesInRegion === '1' ||
      String(rawStudiesInRegion).toLowerCase() === 'true';

    this.academico = {
      institucion: academic.institution || '',
      carrera: academic.career || '',
      studyId: academic.studyLevelId || null,
      semestre: academic.currentSemester
        ? Number(academic.currentSemester)
        : null,
      duracion: academic.careerDurationSemesters || null,

      // 🔥 El select espera 'si' o 'no'
      region: studiesInRegion ? 'si' : 'no',
    };

    this.form.patchValue({
      beneficiado: academic.hadPreviousBenefit ? 'si' : 'no',
    });

    console.log('🎓 RESTORE STEP 4 REGION:', {
      rawStudiesInRegion,
      studiesInRegion,
      regionFrontend: this.academico.region,
    });
  }

  private restoreAcademicVerificationFromSummary(summary: any): void {
    const verification = summary?.academicVerification;
    if (!verification) return;

    this.verificacion = {
      tipo: verification.academicSituation || '',
      promedio:
        verification.gradeAverage != null
          ? Number(verification.gradeAverage)
          : null,
      aprobacion:
        verification.approvalPercentage != null
          ? Number(verification.approvalPercentage)
          : null,
    };
  }

  private restoreIncomesFromSummary(summary: any): void {
    const incomes = Array.isArray(summary?.incomes) ? summary.incomes : [];

    if (!incomes.length) {
      this.ingresosFamiliares = [
        {
          familiarId: null,
          monto: 0,
          open: true,
        },
      ];

      return;
    }

    const map = new Map<string, any>();

    for (const income of incomes) {
      const backendFamilyMemberId = Number(
        income.familyMemberId ||
          income.family_member_id ||
          income.familyMember?.id ||
          0,
      );

      const incomeTypeId = Number(
        income.incomeTypeId || income.income_type_id || income.typeId || 1,
      );

      if (!backendFamilyMemberId) {
        continue;
      }

      const key = `${backendFamilyMemberId}|${incomeTypeId}`;

      map.set(key, income);
    }

    const incomesUnicos = Array.from(map.values());

    this.ingresosFamiliares = incomesUnicos.map(
      (income: any, index: number) => {
        const backendFamilyMemberId = Number(
          income.familyMemberId ||
            income.family_member_id ||
            income.familyMember?.id ||
            0,
        );

        const familiar = this.grupoFamiliar.find((f: any) => {
          return (
            Number(f.backendId) === backendFamilyMemberId ||
            Number(f.id) === backendFamilyMemberId
          );
        });

        return {
          // 🔥 ahora usamos backendId, porque eso es lo que viene guardado
          familiarId: familiar
            ? Number(familiar.backendId || familiar.id)
            : backendFamilyMemberId,

          monto: Number(
            income.amount || income.monthlyIncome || income.monthly_income || 0,
          ),

          open: index === 0,
        };
      },
    );

    this.normalizeIngresosFamiliaresSelection();

    console.log('💰 INCOMES RESTORED FOR STEP 6:', {
      incomesBackend: incomes,
      grupoFamiliar: this.grupoFamiliar.map((f: any) => ({
        id: f.id,
        backendId: f.backendId,
        nombre: f.nombre,
        parentTypeId: f.parentTypeId,
      })),
      ingresosFamiliares: this.ingresosFamiliares,
    });
  }

  /*
  private restoreIncomesFromSummary(summary: any): void {
    const incomes = Array.isArray(summary?.incomes) ? summary.incomes : [];

    if (!incomes.length) {
      return;
    }

    // =====================================
    // 🔥 DEDUP VISUAL
    // 1 ingreso por familyMemberId + incomeTypeId
    // Si vienen duplicados desde BD, se queda con el último
    // =====================================

    const map = new Map<string, any>();

    for (const income of incomes) {
      const familyMemberId = Number(income.familyMemberId || 0);
      const incomeTypeId = Number(income.incomeTypeId || 1);

      if (!familyMemberId) {
        continue;
      }

      const key = `${familyMemberId}|${incomeTypeId}`;

      map.set(key, income);
    }

    const incomesUnicos = Array.from(map.values());

    this.ingresosFamiliares = incomesUnicos.map(
      (income: any, index: number) => {
        const backendFamilyMemberId = Number(income.familyMemberId || 0);

        const familiar = this.grupoFamiliar.find(
          (f: any) => Number(f.backendId) === backendFamilyMemberId,
        );

        return {
          familiarId: familiar?.id || null,
          monto: Number(income.amount || 0),
          open: index === 0,
        };
      },
    );

    console.log('💰 INCOMES RESTORED DEDUP:', this.ingresosFamiliares);
  }
  */

  /*
  private restoreIncomesFromSummary(summary: any): void {
    const incomes = Array.isArray(summary?.incomes) ? summary.incomes : [];
    if (!incomes.length) return;

    this.ingresosFamiliares = incomes.map((income: any, index: number) => {
      const backendFamilyMemberId = Number(income.familyMemberId || 0);
      const familiar = this.grupoFamiliar.find(
        (f: any) => Number(f.backendId) === backendFamilyMemberId,
      );

      return {
        familiarId: familiar?.id || null,
        monto: Number(income.amount || 0),
        open: index === 0,
      };
    });
  }
    */

  private restoreExpensesFromSummary(summary: any): void {
    const expenses = Array.isArray(summary?.expenses) ? summary.expenses : [];

    if (!expenses.length) {
      return;
    }

    const patch: any = {};

    const fixedMap: Record<string, string> = {
      RENT_OR_DIVIDEND: 'arriendo',
      ELECTRICITY: 'luz',
      WATER: 'agua',
      GAS: 'gas',
      PHONE: 'telefonoGasto',
      CREDITS: 'creditos',
      TUITION: 'matricula',
      MONTHLY_FEE: 'mensualidad',
      LODGING: 'alojamiento',
    };

    const otherMap = new Map<string, OtroGasto>();

    for (const expense of expenses) {
      const category = String(expense.category || '').toUpperCase();
      const code = String(expense.code || '').toUpperCase();
      const amount = Number(expense.amount || 0);

      if (category === 'OTHER') {
        const glosa = String(
          expense.name || expense.description || 'Otro gasto',
        ).trim();

        const key = `${glosa.toUpperCase()}|${amount}`;

        otherMap.set(key, {
          glosa,
          monto: amount,
          open: false,
        });

        continue;
      }

      const formKey = fixedMap[code];

      if (formKey) {
        patch[formKey] = amount;
      }
    }

    this.form.patchValue(patch);

    const otherExpenses = Array.from(otherMap.values());

    if (otherExpenses.length) {
      otherExpenses[0].open = true;
      this.otrosGastos = otherExpenses;
    }

    console.log('💸 EXPENSES RESTORED DEDUP:', {
      patch,
      otrosGastos: this.otrosGastos,
    });
  }

  /*
  private restoreExpensesFromSummary(summary: any): void {
    const expenses = Array.isArray(summary?.expenses) ? summary.expenses : [];
    if (!expenses.length) return;

    const patch: any = {};
    const fixedMap: Record<string, string> = {
      RENT_OR_DIVIDEND: 'arriendo',
      ELECTRICITY: 'luz',
      WATER: 'agua',
      GAS: 'gas',
      PHONE: 'telefonoGasto',
      CREDITS: 'creditos',
      TUITION: 'matricula',
      MONTHLY_FEE: 'mensualidad',
      LODGING: 'alojamiento',
    };

    const otherExpenses: OtroGasto[] = [];

    for (const expense of expenses) {
      const category = String(expense.category || '').toUpperCase();
      const code = String(expense.code || '').toUpperCase();
      const amount = Number(expense.amount || 0);

      if (category === 'OTHER') {
        otherExpenses.push({
          glosa: expense.name || expense.description || 'Otro gasto',
          monto: amount,
          open: false,
        });
        continue;
      }

      const formKey = fixedMap[code];
      if (formKey) {
        patch[formKey] = amount;
      }
    }

    this.form.patchValue(patch);

    if (otherExpenses.length) {
      otherExpenses[0].open = true;
      this.otrosGastos = otherExpenses;
    }
  }
  */

  private restoreHealthFromSummary(summary: any): void {
    const records = Array.isArray(summary?.healthRecords)
      ? summary.healthRecords
      : [];

    if (!records.length) {
      return;
    }

    const map = new Map<string, any>();

    for (const record of records) {
      const familyMemberId = Number(record.familyMemberId || 0);
      const personName = String(record.personName || '')
        .trim()
        .toUpperCase();
      const pathology = String(record.pathology || '')
        .trim()
        .toUpperCase();
      const monthlyExpense = Number(record.monthlyExpense || 0);

      if (!familyMemberId || !personName || !pathology) {
        continue;
      }

      const key = `${familyMemberId}|${personName}|${pathology}|${monthlyExpense}`;

      map.set(key, record);
    }

    const recordsUnicos = Array.from(map.values());

    this.salud = recordsUnicos.map((record: any, index: number) => {
      const backendFamilyMemberId = Number(record.familyMemberId || 0);

      const familiar = this.grupoFamiliar.find(
        (f: any) => Number(f.backendId) === backendFamilyMemberId,
      );

      return {
        id: record.id || Date.now() + index,
        nombre: record.personName || '',
        familiarId: familiar?.id || null,
        patologia: record.pathology || '',
        gasto: Number(record.monthlyExpense || 0),
        open: index === 0,
      };
    });

    console.log('🩺 HEALTH RESTORED DEDUP:', this.salud);
  }

  formatFechaVisual(value: any): string {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();

      return `${day}-${month}-${year}`;
    }

    const text = String(value).substring(0, 10);
    const [year, month, day] = text.split('-');

    if (!year || !month || !day) {
      return text;
    }

    return `${day}-${month}-${year}`;
  }

  /*
  private restoreHealthFromSummary(summary: any): void {
    const records = Array.isArray(summary?.healthRecords)
      ? summary.healthRecords
      : [];
    if (!records.length) return;

    this.salud = records.map((record: any, index: number) => {
      const backendFamilyMemberId = Number(record.familyMemberId || 0);
      const familiar = this.grupoFamiliar.find(
        (f: any) => Number(f.backendId) === backendFamilyMemberId,
      );

      return {
        id: record.id || Date.now() + index,
        nombre: record.personName || '',
        familiarId: familiar?.id || null,
        patologia: record.pathology || '',
        gasto: Number(record.monthlyExpense || 0),
        open: index === 0,
      };
    });
  }
  */

  private restoreHousingFromSummary(summary: any): void {
    const housing = summary?.housing;
    if (!housing) return;

    this.form.patchValue({
      tipoVivienda: housing.typeHousingId || null,
      tipoPropiedad: housing.typePropertyId || null,
      typeHousingId: housing.typeHousingId || null,
      typePropertyId: housing.typePropertyId || null,
      infoVivienda: housing.housingBackground || '',
      otrosAntecedentes: housing.otherBackground || '',
    });
  }

  private restoreFamilyMembersFromSummary(summary: any): void {
    const members = Array.isArray(summary?.familyMembers)
      ? summary.familyMembers
      : [];

    if (!members.length) {
      return;
    }

    this.grupoFamiliar = members.map((m: any, index: number) => {
      // =====================================
      // 🔥 CAMPOS OTRO DESDE BACKEND
      // backend devuelve snake_case
      // =====================================

      const othersActivities = m.othersActivities || m.others_activities || '';

      const othersWorkplaces = m.othersWorkplaces || m.others_workplaces || '';

      // =====================================
      // 🔥 ACTIVIDAD
      // activity_id OTRO = 7
      // Si viene texto en others_activities,
      // forzamos activityId = 7 para mostrar input
      // =====================================

      const activityId =
        Number(m.activityId || m.activity_id || m.activity?.id || 0) ||
        (othersActivities ? 7 : null);

      // =====================================
      // 🔥 PROFESIÓN / OFICIO
      // work_place_id OTRO = 9
      // Si viene texto en others_workplaces,
      // forzamos workPlaceId = 9 para mostrar input
      // =====================================

      const workPlaceId =
        Number(m.workPlaceId || m.work_place_id || m.workPlace?.id || 0) ||
        (othersWorkplaces ? 9 : null);

      return {
        id: Number(m.id || 0) || (index === 0 ? -1 : Date.now() + index),

        backendId: Number(m.id || 0) || undefined,

        rut: m.rut || '',

        nombre: m.names || '',

        apellido: m.lastNames || '',

        parentTypeId: m.parentTypeId || undefined,

        civilStateId: m.civilStateId || undefined,

        // =====================================
        // 🔥 ACTIVIDAD
        // =====================================

        activityId,

        othersActivities,

        // =====================================
        // 🔥 PROFESIÓN / OFICIO
        // =====================================

        workPlaceId,

        othersWorkplaces,

        // =====================================
        // 🔥 ESTUDIOS / PREVISIÓN / INGRESOS
        // =====================================

        studyId: m.studyLevelId || undefined,

        previtionId: m.previtionId || undefined,

        incomeTypeId: m.incomeTypeId || undefined,

        monthlyIncome: Number(m.monthlyIncome || 0),

        student: Boolean(m.student),

        studyPlace: m.studyPlace || '',

        birthDate: m.birthDate || m.birth_date || null,

        estudiaRegion: '',

        // =====================================
        // 🔥 UI
        // =====================================

        open: true,

        titular: index === 0,

        existsInUsers: index === 0,

        mustCreatePassive: false,

        source: index === 0 ? 'AUTH' : 'MANUAL',

        searching: false,

        notFound: false,

        isComplete: true,
      };
    });

    console.log(
      '🧪 FAMILY OTHERS RESTORED:',
      this.grupoFamiliar.map((f: any) => ({
        nombre: f.nombre,
        birthDate: f.birthDate,
        activityId: f.activityId,
        othersActivities: f.othersActivities,
        workPlaceId: f.workPlaceId,
        othersWorkplaces: f.othersWorkplaces,
        isOtherActivity: this.isOtherActivitySelected(f),
        isOtherWorkPlace: this.isOtherWorkPlaceSelected(f),
      })),
    );
  }

  private restoreAffiliateFromResponse(affiliate: any) {
    if (!affiliate?.rut) {
      console.warn('⚠️ Affiliate vacío');

      return;
    }
    this.afiliado = affiliate;
    this.afiliadoValido = true;
    this.patchAffiliate(affiliate);
    this.syncAffiliateToFamily();
    console.log('✅ AFFILIATE RESTORED');
  }

  async saveStep5AcademicVerification() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      const payload: any = {
        academicSituation: this.verificacion.tipo,

        gradeAverage: Number(this.verificacion.promedio || 0),

        approvalPercentage: Number(this.verificacion.aprobacion || 0),
      };

      console.log('🚀 ACADEMIC VERIFICATION:', payload);

      await firstValueFrom(
        this.wellbeingPostulationService.saveAcademicVerification(
          this.postulationId,
          payload,
        ),
      );

      await this.moveToStep(6);

      console.log('✅ STEP 5 SAVED');
    } catch (e) {
      console.error('❌ ERROR STEP 5', e);
    } finally {
      this.isSaving = false;
    }
  }

  loadDraft(draft: any) {
    console.log('📦 LOAD DRAFT:', draft);

    this.postulationId = draft.id;

    // =====================================
    // 🔥 SAVE WORKFLOW
    // =====================================

    this.saveWorkflow();
  }

  async startPostulation() {
    try {
      console.log('🚀 STARTING POSTULATION...');

      const response: any = await firstValueFrom(
        this.wellbeingPostulationService.start({
          userId: this.loggedUser.id,
          periodYear: new Date().getFullYear(),
        }),
      );

      console.log('✅ NEW DRAFT:', response);

      this.postulationId = response.id;

      // =====================================
      // 🔥 SAVE WORKFLOW
      // =====================================

      this.saveWorkflow();
    } catch (e) {
      console.error('❌ START POSTULATION ERROR:', e);
    }
  }

  getStudyName(id: number | null): string {
    const found = this.tiposEstudio.find((t) => t.id === Number(id));

    return found?.name || '-';
  }

  validarSemestreAcademico(): void {
    let value = Number(this.academico.semestre);

    if (!value || value < 1) {
      value = 1;
    }

    if (value > 15) {
      value = 15;
    }

    this.academico.semestre = value;
  }

  validarDuracionAcademico(): void {
    let value = Number(this.academico.duracion);

    if (!value || value < 1) {
      value = 1;
    }

    if (value > 15) {
      value = 15;
    }

    this.academico.duracion = value;
  }

  validarPromedioVerificacion(): void {
    let value = Number(this.verificacion.promedio);

    if (!value || value < 1) {
      value = 1;
    }

    if (value > 100) {
      value = 100;
    }

    this.verificacion.promedio = value;
  }

  validarAprobacionVerificacion(): void {
    let value = Number(this.verificacion.aprobacion);

    if (!value || value < 1) {
      value = 1;
    }

    if (value > 100) {
      value = 100;
    }

    this.verificacion.aprobacion = value;
  }

  private getComprobanteTitleStyle(): string {
    return `
    margin: 18px 0 8px 0;
    padding: 7px 10px;
    background: #eff6ff;
    color: #1565c0;
    border-left: 4px solid #1565c0;
    font-size: 13px;
    border-radius: 6px;
  `;
  }

  private getComprobanteTableStyle(): string {
    return `
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 11px;
  `;
  }

  private getComprobanteThStyle(): string {
    return `
    padding: 6px;
    border: 1px solid #dbeafe;
    text-align: left;
    color: #1e3a8a;
    font-size: 10px;
  `;
  }

  private parseDateOnlyLocal(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const text = String(value).substring(0, 10);

    const [year, month, day] = text.split('-').map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private formatDateOnlyForBackend(value: any): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value.substring(0, 10);
    }

    const date = value instanceof Date ? value : new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  toDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const text = String(value).trim();

    // 🔥 Evita desfase de zona horaria con fechas tipo yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split('-').map(Number);

      return new Date(year, month - 1, day);
    }

    // 🔥 Si viene con hora tipo 2026-05-22T00:00:00
    if (text.includes('T')) {
      const datePart = text.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);

      return new Date(year, month - 1, day);
    }

    const date = new Date(text);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  onFamilyBirthDateChange(familiar: any, value: Date | null): void {
    if (!value) {
      familiar.birthDate = null;
      return;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    familiar.birthDate = `${year}-${month}-${day}`;

    console.log(
      '📅 Fecha nacimiento familiar actualizada:',
      familiar.birthDate,
    );
  }

  hasValidFamilyBirthDate(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const text = String(value).trim();

    if (
      text === '' ||
      text.toLowerCase() === 'null' ||
      text.toLowerCase() === 'undefined' ||
      text.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return true;
    }

    if (text.includes('T')) {
      const datePart = text.split('T')[0];

      return /^\d{4}-\d{2}-\d{2}$/.test(datePart);
    }

    return false;
  }

  canEditFamilyBirthDate(familiar: Familiar): boolean {
    // 🔒 El titular nunca se edita desde Step 2
    if (familiar.titular === true) {
      return false;
    }

    // 🔥 Usuario no encontrado: completar manualmente
    if (familiar.notFound === true) {
      return true;
    }

    // 🔥 Usuario existe, pero viene sin fecha válida: permitir completar
    if (
      familiar.existsInUsers === true &&
      !this.hasValidFamilyBirthDate(familiar.birthDate)
    ) {
      return true;
    }

    return false;
  }

  formatFamilyBirthDateMMDDYYYY(value: any): string {
    if (!value) {
      return '';
    }

    const text = String(value).trim();

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split('-');
      return `${month}-${day}-${year}`;
    }

    // yyyy-MM-ddTHH:mm:ss
    if (text.includes('T')) {
      const datePart = text.split('T')[0];

      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-');
        return `${month}-${day}-${year}`;
      }
    }

    // MM-DD-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
      return text;
    }

    return '';
  }

  onFamilyBirthDateMMDDYYYYChange(familiar: Familiar, value: string): void {
    // =====================================
    // 🔒 ÚNICA CONDICIÓN
    // =====================================

    if (familiar.titular === true) {
      return;
    }

    // =====================================
    // 🔥 FORMATEAR MM-DD-YYYY
    // =====================================

    const clean = String(value || '')
      .replace(/[^\d]/g, '')
      .slice(0, 8);

    let formatted = clean;

    if (clean.length >= 5) {
      formatted = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
    } else if (clean.length >= 3) {
      formatted = `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }

    // Mientras escribe, se mantiene visual MM-DD-YYYY
    familiar.birthDate = formatted;

    // =====================================
    // 🔥 SI ESTÁ COMPLETA, GUARDAR BACKEND yyyy-MM-dd
    // =====================================

    if (/^\d{2}-\d{2}-\d{4}$/.test(formatted)) {
      const [month, day, year] = formatted.split('-');

      familiar.birthDate = `${year}-${month}-${day}`;

      console.log('📅 Fecha nacimiento familiar actualizada:', {
        visual: formatted,
        backend: familiar.birthDate,
      });
    }
  }

  openNativeDatePicker(input: HTMLInputElement): void {
    if (!input || input.disabled) {
      return;
    }

    input.focus();

    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  hasFamilyBirthDate(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const text = String(value).trim();

    if (
      text === '' ||
      text.toLowerCase() === 'null' ||
      text.toLowerCase() === 'undefined' ||
      text.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return true;
    }

    // yyyy-MM-ddTHH:mm:ss
    if (text.includes('T')) {
      const datePart = text.split('T')[0];
      return /^\d{4}-\d{2}-\d{2}$/.test(datePart);
    }

    return false;
  }

  hasValidDate(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const text = String(value).trim();

    if (
      text === '' ||
      text.toLowerCase() === 'null' ||
      text.toLowerCase() === 'undefined' ||
      text.toLowerCase() === 'invalid date'
    ) {
      return false;
    }

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return true;
    }

    // yyyy-MM-ddTHH:mm:ss
    if (text.includes('T')) {
      const datePart = text.split('T')[0];
      return /^\d{4}-\d{2}-\d{2}$/.test(datePart);
    }

    return false;
  }

  onAffiliationDateNativeChange(value: string): void {
    this.form.patchValue({
      fechaAfiliacion: value,
    });

    this.form.get('fechaAfiliacion')?.markAsDirty();
    this.form.get('fechaAfiliacion')?.markAsTouched();

    console.log('📅 FECHA AFILIACIÓN INGRESADA:', value);
  }

  normalizeDateInput(value: any): string | null {
    if (!this.hasFamilyBirthDate(value)) {
      return null;
    }

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    if (text.includes('T')) {
      return text.split('T')[0];
    }

    return null;
  }

  onFamilyBirthDateNativeChange(familiar: Familiar, value: string): void {
    familiar.birthDate = value || null;

    console.log(
      '📅 Fecha nacimiento familiar actualizada:',
      familiar.birthDate,
    );
  }

  async downloadBackendDocument(document: any): Promise<void> {
    const documentId = Number(document?.id || document?.documentId || 0);

    if (!documentId) {
      this.showWarning('No fue posible identificar el documento');

      return;
    }

    try {
      console.log('⬇️ DESCARGANDO DOCUMENTO FÍSICO:', {
        documentId,
        document,
      });

      const blob = await firstValueFrom(
        this.wellbeingDocumentsService.downloadDocument(documentId),
      );

      const fileName =
        document.originalFilename ||
        document.original_filename ||
        document.fileName ||
        `documento-${documentId}`;

      const url = URL.createObjectURL(blob);

      const link = window.document.createElement('a');

      link.href = url;
      link.download = fileName;

      window.document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

      console.log('✅ DOCUMENTO DESCARGADO:', {
        documentId,
        fileName,
      });
    } catch (error: any) {
      console.error('❌ ERROR DESCARGANDO DOCUMENTO:', {
        documentId,
        status: error?.status,
        statusText: error?.statusText,
        url: error?.url,
        message: error?.message,
        backendError: error?.error,
        fullError: error,
      });

      this.showError(
        'No fue posible descargar el documento. Es posible que el registro corresponda a una carga antigua sin archivo físico.',
      );
    }
  }

  openLocalFilePreview(file: File): void {
    if (!file) {
      this.showWarning('No fue posible abrir el archivo');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.showWarning(
        'La vista previa solo está disponible para PDF, JPG y PNG',
      );

      return;
    }

    const url = URL.createObjectURL(file);

    window.open(url, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }

  hasAnyOptionalDocument(): boolean {
    return this.documentosOpcionales.some((doc) =>
      this.tieneArchivoOpcional(doc.key),
    );
  }

  getFamilyBirthDatePickerValue(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const text = String(value).trim();

    const dateOnly = text.includes('T') ? text.split('T')[0] : text;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return null;
    }

    const [year, month, day] = dateOnly.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  onFamilyBirthDatePickerChange(
    familiar: Familiar,
    selectedDate: Date | null,
  ): void {
    if (!selectedDate) {
      familiar.birthDate = null;

      return;
    }

    const year = selectedDate.getFullYear();

    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

    const day = String(selectedDate.getDate()).padStart(2, '0');

    familiar.birthDate = `${year}-${month}-${day}`;

    console.log('📅 FECHA NACIMIENTO FAMILIAR ACTUALIZADA:', {
      familiar: `${familiar.nombre || ''} ${familiar.apellido || ''}`.trim(),

      birthDate: familiar.birthDate,
    });
  }
}

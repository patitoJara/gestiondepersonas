import { Component, ViewChild, ElementRef } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
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

import { PostulationResumeDialogComponent } from '../postulacion-estudios/postulation-resume-dialog.component';

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
  rut: string;
  nombre: string;
  apellido: string;
  parentTypeId?: number;
  civilStateId?: number;
  activityId?: number;
  workPlaceId?: number;
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
  tipoPostulante: string = '';

  today = new Date();

  codigoPostulacion = 'POST-' + Date.now();
  comentario: string = '';

  loadingAffiliate = false;

  academico = {
    institucion: '',
    carrera: '',
    nivel: '',
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
      name: 'Hospital Clínico Magallanes',
    },
    {
      id: 2,
      name: 'Hospital Puerto Natales',
    },
    {
      id: 3,
      name: 'Hospital Porvenir',
    },
    {
      id: 4,
      name: 'Hospital Puerto Williams',
    },
    {
      id: 5,
      name: 'DSSM',
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

      fechaContratacion: [null],

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
  isLoading = false;

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
    // =====================================
    // 🔥 USUARIO LOGEADO
    // =====================================

    this.loggedUser = this.tokenService.getUserProfile();

    console.log('👤 LOGGED USER:', this.loggedUser);

    // =====================================
    // 🔥 LOAD CATALOGS FIRST
    // =====================================

    await this.loadCatalogs();

    // =====================================
    // 🔥 CHECK DRAFTS
    // =====================================

    await this.checkDraftPostulation();

    // =====================================
    // 🔥 RESTORE WORKFLOW
    // =====================================

    await this.restoreWorkflow();

    // =====================================
    // 🔥 SYNC TITULAR
    // =====================================

    this.syncAffiliateToFamily();

    // =====================================
    // 🔥 HEALTH OPEN STATE
    // =====================================

    const hayDatos = this.salud.some(
      (s) => s.nombre || s.familiarId || s.patologia || s.gasto,
    );

    this.salud.forEach((s, index) => {
      const tieneDatos = s.nombre || s.familiarId || s.patologia || s.gasto;

      // =====================================
      // 🔥 OPEN WITH DATA
      // =====================================

      if (hayDatos) {
        s.open = !!tieneDatos;
      }

      // =====================================
      // 🔥 OPEN FIRST
      // =====================================
      else {
        s.open = index === 0;
      }
    });

    // =====================================
    // 🔥 AUTOSAVE
    // =====================================

    this.form.valueChanges.subscribe((value) => {
      this.wellbeingAutosaveService.run(() => {
        const data = {
          form: value,

          grupoFamiliar: this.grupoFamiliar,

          salud: this.salud,

          ingresosFamiliares: this.ingresosFamiliares,

          otrosGastos: this.otrosGastos,
        };

        //localStorage.setItem('postulacion_full', JSON.stringify(data));

        console.log('💾 AUTOSAVE');
      }, 1200);
    });

    // =====================================
    // 🔥 LOAD SUMMARY
    // =====================================

    if (this.currentStep >= 10) {
      await this.loadSummary();
    }

    // =====================================
    // 🔥 READY
    // =====================================

    console.log('🚀 WELLBEING MODULE READY');
  }

  async loadLoggedAffiliate() {
    if (this.afiliadoValido) {
      return;
    }

    try {
      const user: any = await firstValueFrom(
        this.usersService.getById(this.loggedUser.id),
      );

      console.log('👤 USER FOUND:', user);

      if (!user) {
        return;
      }

      this.afiliado = user;

      this.afiliadoValido = true;

      this.patchAffiliate(user);

      console.log('✅ AFILIADO CARGADO');
    } catch (e) {
      console.error('❌ ERROR LOAD AFFILIATE:', e);
    }
  }

  private patchAffiliate(user: any) {
    this.form.patchValue({
      // 🔹 IDENTIFICACIÓN
      rut: user.rut || '',

      // 🔹 NOMBRES
      nombre: `${user.firstName || ''} ${user.secondName || ''}`
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase(),

      apellido: `${user.firstLastName || ''} ${user.secondLastName || ''}`
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase(),

      // 🔹 CONTACTO
      telefono: user.phone || '',
      email: user.email || '',
      sexo: user.sex || '',
      planta: user.plant || '',
      grado: user.grade || '',
      direccion: user.address || '',
      establecimiento: user.stablishment || '',
      previtionId: user.previtionId || null,
      fechaAfiliacion: user.affiliationDate || null,
      tipoAfiliado: user.contract_type === 'PASIVO' ? 'PASIVO' : 'ACTIVO',
      calidadContractual: user.contract_type,
      fechaContratacion: user.contract_date,
      fechaNacimiento: user.birth_date,
    });
  }

  async saveStep1Affiliate() {
    // =====================================
    // 🔥 NO POSTULATION
    // =====================================
    if (!this.postulationId) {
      this.showError('No existe postulación activa');
      return;
    }
    try {
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

          birth_date: this.form.value.fechaNacimiento,

          contract_date: this.form.value.fechaContratacion,

          contract_type: String(
            this.form.value.calidadContractual || '',
          ).toUpperCase(),
        }),
      );
      // =====================================
      // 🔥 PAYLOAD
      // =====================================
      const payload = this.wellbeingMapperService.mapAffiliate(this.form.value);
      console.log('🚀 AFFILIATE PAYLOAD:', payload);
      // =====================================
      // 🔥 SAVE
      // =====================================
      await firstValueFrom(
        this.wellbeingPostulationService.saveAffiliate(
          this.postulationId,
          payload,
        ),
      );
      // =====================================
      // 🔥 SYNC TITULAR
      // =====================================
      this.syncAffiliateToFamily();
      // =====================================
      // 🔥 NEXT STEP
      // =====================================
      await this.moveToStep(2);
      // =====================================
      // 🔥 SUCCESS
      // =====================================
      this.showSuccess('Antecedentes afiliado guardados');
    } catch (e) {
      console.error(e);
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
    // 🔥 LOAD DATA IF NEEDED
    // =====================================

    if (this.postulationId) {
      await this.loadData();
    }

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

  async createPostulation() {
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
      // 🔥 SAVE IDS
      // =====================================

      this.postulationId = response.id;

      this.codigoPostulacion = response.code;

      // =====================================
      // 🔥 RESTORE AFFILIATE
      // =====================================

      this.restoreAffiliateFromResponse(response.affiliate);
      this.syncAffiliateToFamily();

      // =====================================
      // 🔥 FALLBACK USER LOGGED
      // =====================================

      if (!this.afiliadoValido) {
        console.log('🔥 LOADING LOGGED USER...');

        await this.loadLoggedAffiliate();
      }

      // =====================================
      // 🔥 STORAGE
      // =====================================

      this.wellbeingStorageService.savePostulationId(response.id);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      this.showSuccess('Postulación creada correctamente');
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
    // 🔥 NO POSTULATION
    // =====================================

    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      // =====================================
      // 🔥 CREATE PASSIVE USERS
      // =====================================

      for (const f of this.grupoFamiliar) {
        // =====================================
        // 🔥 IGNORE TITULAR
        // =====================================

        if (f.titular) {
          continue;
        }

        // =====================================
        // 🔥 CREATE PASSIVE
        // =====================================

        if (f.mustCreatePassive) {
          // =====================================
          // 🔥 APELLIDOS
          // =====================================

          const nombres = String(f.nombre || '')
            .trim()
            .split(' ');

          const apellidos = String(f.apellido || '')
            .trim()
            .split(' ');

          // =====================================
          // 🔥 PAYLOAD
          // =====================================

          const payloadUser: any = {
            firstName: nombres[0] || '',
            secondName: nombres.slice(1).join(' ') || '',
            firstLastName: apellidos[0] || '',
            secondLastName: apellidos.slice(1).join(' ') || '',
            full_name: `${f.nombre || ''} ${f.apellido || ''}`
              .replace(/\s+/g, ' ')
              .trim(),
            email: null,
            username: String(f.rut || '')
              .replace(/\./g, '')
              .replace('-', ''),
            password: null,
            rut: f.rut || '',
            birth_date: f.birthDate || null,
            contract_date: null,
            contract_type: 'PASIVO',
          };
          console.log('🔥 CREATING PASIVO:', payloadUser);
          const created: any = await firstValueFrom(
            this.usersService.createUser(payloadUser),
          );
          console.log('✅ PASIVO CREATED:', created);
          f.id = created.id;
          f.existsInUsers = true;
          f.mustCreatePassive = false;
          f.notFound = false;
          f.source = 'USERS';
        }
      }

      // =====================================
      // 🔥 PAYLOAD
      // =====================================

      const payload = this.wellbeingMapperService.mapFamilyMembers(
        this.grupoFamiliar,
      );

      console.log('🚀 FAMILY MEMBERS:', payload);

      // =====================================
      // 🔥 SAVE
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.saveFamilyMembers(
          this.postulationId,
          payload,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(3);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      this.showSuccess('Grupo familiar guardado');
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

      const payload = this.wellbeingMapperService.mapBeneficiary({
        tipoBeneficiario: this.form.value.tipoBeneficiario,

        familiarId: this.form.value.familiarId,
      });

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

      this.showSuccess('Beneficiario guardado');
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

      const payload: AcademicBackgroundRequest = {
        institution: this.academico.institucion,
        career: this.academico.carrera,
        studyLevel: this.academico.nivel,
        currentSemester: Number(this.academico.semestre || 0),
        careerDurationSemesters: Number(this.academico.duracion || 0),
        studiesInRegion: String(this.academico.region).toLowerCase() === 'si',
        receivedBenefitBefore: this.form.value.beneficiado === 'si',
      };

      console.log('🚀 ACADEMIC:', payload);

      // =====================================
      // 🔥 SAVE
      // =====================================

      await firstValueFrom(
        this.wellbeingPostulationService.saveAcademicBackground(
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

      this.showSuccess('Antecedentes académicos guardados');
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
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      const payload = this.ingresosFamiliares.map((i: any) => {
        const familiar = this.grupoFamiliar.find(
          (f: any) => f.id === i.familiarId,
        );

        return {
          familyMemberId: i.familiarId,

          relationshipType: this.getParentTypeName(familiar?.parentTypeId),

          amount: i.monto,
        };
      });

      await firstValueFrom(
        this.wellbeingPostulationService.saveFamilyIncomes(
          this.postulationId,
          payload,
        ),
      );

      await this.moveToStep(7);

      this.showSuccess('Ingresos familiares guardados');
    } catch (e) {
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 7
  // =========================================================

  async saveStep7FamilyExpenses() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      const payload = {
        rentOrMortgage: this.form.value.arriendo,
        electricity: this.form.value.luz,
        water: this.form.value.agua,
        gas: this.form.value.gas,
        phone: this.form.value.telefonoGasto,
        credits: this.form.value.creditos,
        tuition: this.form.value.matricula,
        monthlyFee: this.form.value.mensualidad,
        accommodation: this.form.value.alojamiento,
        otherExpenses: this.otrosGastos.map((g: any) => ({
          description: g.glosa,
          amount: g.monto,
        })),
      };

      await firstValueFrom(
        this.wellbeingPostulationService.saveFamilyExpenses(
          this.postulationId,
          payload,
        ),
      );

      // =====================================
      // 🔥 NEXT STEP
      // =====================================

      await this.moveToStep(8);

      this.showSuccess('Gastos familiares guardados');
    } catch (e) {
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 8
  // =========================================================

  async saveStep8HealthAndHousing() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;

      // =====================================
      // 🔥 HEALTH
      // =====================================

      const healthPayload = this.salud.map((s: any) => ({
        name: s.nombre,

        familyMemberId: s.familiarId,

        pathology: s.patologia,

        monthlyExpense: s.gasto,
      }));

      await firstValueFrom(
        this.wellbeingPostulationService.saveHealthRecords(
          this.postulationId,
          healthPayload,
        ),
      );

      // =====================================
      // 🔥 HOUSING
      // =====================================

      const housingPayload = {
        propertyType: this.form.value.tipoPropiedad,
        propertyTenureType: this.form.value.tipoVivienda,
        housingBackground: this.form.value.infoVivienda,
        otherBackground: this.form.value.otrosAntecedentes,
      };

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

      this.showSuccess('Salud y vivienda guardados');
    } catch (e) {
      console.error(e);

      this.showError('Error guardando salud/vivienda');
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SAVE STEP 9 DOCUMENTS
  // =========================================================

  async saveStep9Documents() {
    if (!this.postulationId) {
      return;
    }

    try {
      this.isSaving = true;
      console.log('📎 DOCUMENTS READY');
      await this.moveToStep(10);
      this.showSuccess('Documentos preparados');
    } catch (e) {
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  // =========================================================
  // 🔥 SUBMIT POSTULATION
  // =========================================================

  async submitPostulation() {
    // =====================================
    // 🔥 NO POSTULATION
    // =====================================

    if (!this.postulationId) {
      return;
    }

    // =====================================
    // 🔥 VALIDATE ALL
    // =====================================

    if (!this.validateAll()) {
      return;
    }

    try {
      this.isSaving = true;

      // =====================================
      // 🔥 SUBMIT
      // =====================================

      await firstValueFrom(
        this.wellbeingWorkflowService.submitPostulation(this.postulationId),
      );

      // =====================================
      // 🔥 LOAD SUMMARY
      // =====================================

      await this.loadSummary();

      // =====================================
      // 🔥 FINAL STEP
      // =====================================

      await this.moveToStep(11);

      // =====================================
      // 🔥 SUCCESS
      // =====================================

      this.showSuccess('Postulación enviada correctamente');
    } catch (e) {
      console.error(e);

      this.showError('Error enviando postulación');
    } finally {
      this.isSaving = false;
    }
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
    console.log('🧹 WORKFLOW RESET');
  }

  /* ---------------------------------------------------------------------------------------------------
                        FIN ngOnInit() {
  ------------------------------------------------------------------------------------------------------*/

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

  async nextStep() {
    if (!this.validateCurrentStep()) {
      return;
    }

    switch (this.currentStep) {
      case 1:
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

  async previousStep() {
    if (this.currentStep > 1) {
      await this.moveToStep(this.currentStep - 1);
    }
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

  isStepValid(step: number): boolean {
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
        return this.documentosObligatorios.every(
          (doc) => this.filesObligatorios[doc.key]?.length,
        );

      case 10:
        return this.validateAll();

      case 11:
        return true;

      default:
        return true;
    }
  }

  goToStep(step: number) {
    this.irAlPaso(step);
  }

  async irAlPaso(step: number) {
    if (step > this.currentStep + 1) {
      return;
    }
    await this.moveToStep(step);
  }

  tieneArchivoObligatorio(key: string): boolean {
    return !!this.filesObligatorios[key]?.length;
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
    return !!this.filesObligatorios[key]?.length;
  }

  tieneArchivoOpcional(key: string): boolean {
    return !!this.filesOpcionales[key]?.length;
  }

  getTotalObligatoriosCargados(): number {
    return this.documentosObligatorios.filter(
      (d) => this.filesObligatorios[d.key]?.length,
    ).length;
  }

  onFileSelectedOpcional(event: any, key: string) {
    const files: FileList = event.target.files;

    if (!files) return;

    if (!this.filesOpcionales[key]) {
      this.filesOpcionales[key] = [];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        this.showWarning(`${file.name} supera 5MB`);
        continue;
      }

      const existe = this.filesOpcionales[key].some(
        (f) => f.name === file.name && f.size === file.size,
      );

      if (!existe) {
        this.filesOpcionales[key].push(file);
      }
    }
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

        this.showSuccess('Integrante encontrado en sistema');

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
      this.showWarning('🔥 VALIDAR RUT GENERAL - Usuario no encontrado');
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

  descargarPDF() {
    const html = this.generarComprobanteHTML();

    const element = document.createElement('div');
    element.innerHTML = html;

    const opt = {
      margin: 10,
      filename: 'comprobante-postulacion.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: 'mm' as const,
        format: 'letter' as const,
        orientation: 'portrait' as const,
      },
    };

    (html2pdf() as any).set(opt).from(element).save();
  }

  async loadData() {
    // =====================================
    // 🔥 BACKEND ONLY
    // =====================================

    console.log('♻️ LOAD DATA DESDE BACKEND');

    // =====================================
    // 🔥 STEP
    // =====================================

    const savedStep = this.wellbeingStorageService.getCurrentStep();

    if (savedStep) {
      await this.moveToStep(savedStep);
    }
  }

  generarComprobanteHTML(): string {
    const logoGob = `${window.location.origin}/assets/logoGobierno.png`;
    const logoBienestar = `${window.location.origin}/assets/LOGO-BIENESTAR-SSM.png`;

    return `
  <div style="font-family: Arial; font-size:12px; padding:20px; max-width:700px; margin:auto;">

    <div style="display:flex; justify-content:space-between;">
      <img src="${logoGob}" style="height:50px;" />
      <img src="${logoBienestar}" style="height:50px;" />
    </div>

    <h2 style="text-align:center; color:#1565c0;">
      COMPROBANTE DE POSTULACIÓN
    </h2>

    <div style="display:flex; justify-content:space-between; font-size:11px;">
      <div>Fecha: ${new Date().toLocaleString('es-CL')}</div>
      <div>N°: ${this.codigoPostulacion}</div>
    </div>

    <hr/>

    <div><strong>Nombre:</strong> ${this.form.value.nombre} ${this.form.value.apellido}</div>
    <div><strong>RUT:</strong> ${this.form.value.rut}</div>
    <div><strong>Email:</strong> ${this.form.value.email}</div>

    <hr/>

    <div><strong>Total ingresos:</strong> $${this.totalIngresos.toLocaleString('es-CL')}</div>
    <div><strong>Total gastos:</strong> $${this.totalGastos.toLocaleString('es-CL')}</div>

    <div style="margin-top:20px; text-align:center; color:#2e7d32; font-weight:bold;">
      ✔ POSTULACIÓN RECIBIDA
    </div>

  </div>
  `;
  }

  async nuevaPostulacion() {
    // =====================================
    // 🔥 BACKUP STEP 1
    // =====================================

    const affiliateBackup = {
      rut: this.form.value.rut,
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      telefono: this.form.value.telefono,
      email: this.form.value.email,
      direccion: this.form.value.direccion,
      sexo: this.form.value.sexo,
      previtionId: this.form.value.previtionId,
      fechaNacimiento: this.form.value.fechaNacimiento,
      fechaAfiliacion: this.form.value.fechaAfiliacion,
      tipoAfiliado: this.form.value.tipoAfiliado,
      calidadContractual: this.form.value.calidadContractual,
      fechaContratacion: this.form.value.fechaContratacion,
      hogarMonoparental: this.form.value.hogarMonoparental,
      establecimiento: this.form.value.establecimiento,
    };

    // =====================================
    // 🔥 BACKUP FAMILY
    // =====================================

    const familyBackup = [...this.grupoFamiliar];

    // =====================================
    // 🔥 RESET FORM
    // =====================================

    this.form.reset();

    // =====================================
    // 🔥 RESTORE STEP 1
    // =====================================

    this.form.patchValue({
      ...affiliateBackup,
      esPostulante: 'si',
      beneficiado: 'no',
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
    // 🔥 RESTORE FAMILY
    // =====================================

    this.grupoFamiliar = familyBackup;

    this.syncAffiliateToFamily();

    // =====================================
    // 🔥 RESET HEALTH
    // =====================================

    this.salud = [];

    // =====================================
    // 🔥 RESET INCOMES
    // =====================================

    this.ingresosFamiliares = [
      {
        familiarId: null,
        monto: 0,
        open: true,
      },
    ];

    // =====================================
    // 🔥 RESET OTHER EXPENSES
    // =====================================

    this.otrosGastos = [
      {
        glosa: '',
        monto: 0,
        open: true,
      },
    ];

    // =====================================
    // 🔥 HEALTH DEFAULT
    // =====================================
    this.agregarSalud();

    // =====================================
    // 🔥 CLEAR FILES
    // =====================================
    this.filesObligatorios = {};
    this.filesOpcionales = {};

    // =====================================
    // 🔥 CLEAR STORAGE
    // =====================================
    //localStorage.removeItem('postulacion_full');

    // =====================================
    // 🔥 CLEAR WORKFLOW
    // =====================================
    this.wellbeingStorageService.clearAll();
    this.postulationId = null;
    this.summary = null;
    await this.createPostulation();

    // =====================================
    // 🔥 STEP 1
    // =====================================
    await this.moveToStep(1);
    console.log('🆕 NUEVA POSTULACIÓN');
  }

  getParentTypeName(id: number | undefined): string {
    if (!id) {
      return '';
    }

    const parent = this.parentTypes.find((p: any) => p.id === id);

    return (parent?.name || '').toUpperCase();
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
      workPlaceId: undefined,
      studyId: undefined,
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

  getParentescoIngreso(familiarId?: number | null): string {
    if (!familiarId) return '-';

    const familiar = this.grupoFamiliar.find((f) => f.id === familiarId);

    if (!familiar) return '-';

    return this.getParentTypeName(familiar.parentTypeId);
  }

  estaSeleccionado(id: number, actualIndex: number): boolean {
    return this.ingresosFamiliares.some(
      (ing, i) => i !== actualIndex && ing.familiarId === id,
    );
  }

  getNombreIngreso(familiarId: number | null): string {
    if (!familiarId) return 'Sin seleccionar';

    const f = this.grupoFamiliar.find((x) => x.id === familiarId);
    return f?.nombre || 'Sin nombre';
  }

  ngAfterViewChecked() {
    const el = document.querySelector('.step.active');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
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
        fechaContratacion: null,
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

  toDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    return new Date(value);
  }

  private syncAffiliateToFamily(): void {
    // =====================================
    // 🔥 FORM
    // =====================================

    const formValue = this.form.getRawValue();

    if (!formValue.rut) {
      return;
    }
    // =====================================
    // 🔥 TITULAR EXISTENTE
    // =====================================

    let familiar = this.grupoFamiliar.find((f) => f.titular);

    // =====================================
    // 🔥 CREAR TITULAR
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
        open: false,
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
    // 🔥 SOLO ACTUALIZAR CAMPOS BASE
    // =====================================
    familiar.id = this.afiliado?.id || -1;
    familiar.rut = formValue.rut || familiar.rut;
    familiar.nombre = (formValue.nombre || familiar.nombre || '')
      .trim()
      .toUpperCase();
    familiar.apellido = (formValue.apellido || familiar.apellido || '')
      .trim()
      .toUpperCase();
    familiar.birthDate = formValue.fechaNacimiento || familiar.birthDate;
    familiar.previtionId = formValue.previtionId || familiar.previtionId;
    // =====================================
    // 🔥 FLAGS
    // =====================================

    familiar.titular = true;
    familiar.existsInUsers = true;
    familiar.mustCreatePassive = false;
    familiar.source = 'AUTH';
    familiar.notFound = false;
    familiar.searching = false;
    familiar.isComplete = true;

    // =====================================
    // 🔥 PARENTESCO
    // =====================================

    if (!familiar.parentTypeId) {
      const titular = this.parentTypes.find((p: any) => {
        const name = (p.name || '').toLowerCase();

        return name.includes('titular') || name.includes('funcionario');
      });

      if (titular) {
        familiar.parentTypeId = titular.id;
      }
    }

    console.log('✅ TITULAR SINCRONIZADO');
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
    this.otrosGastos.forEach((g) => (g.open = false));

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

  guardarFinal() {
    this.enviar();
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
      .filter((doc) => !this.filesObligatorios[doc.key]?.length)
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

    if (!form.tipoPost) {
      errores.push('Tipo afiliado');
    }

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
    return true;
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
      behavior: 'smooth',
    });

    // =====================================
    // 🔥 SAVE CURRENT STEP
    // =====================================

    if (this.postulationId) {
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
    // 🔥 SIN FAMILIARES
    // =====================================
    if (!this.grupoFamiliar.length) {
      this.showWarning('Debe ingresar integrantes familiares');
      return false;
    }
    // =====================================
    // 🔥 VALIDAR TODOS
    // =====================================
    for (const f of this.grupoFamiliar) {
      // =====================================
      // 🔥 IGNORAR TITULAR
      // =====================================
      if (f.titular) {
        continue;
      }
      // =====================================
      // 🔥 RUT
      // =====================================
      if (!f.rut) {
        this.showWarning('Todos los integrantes deben tener RUT');
        return false;
      }
      // =====================================
      // 🔥 NOMBRE
      // =====================================
      if (!f.nombre?.trim()) {
        this.showWarning('Todos los integrantes deben tener nombres');
        return false;
      }
      // =====================================
      // 🔥 APELLIDO
      // =====================================
      if (!f.apellido?.trim()) {
        this.showWarning('Todos los integrantes deben tener apellidos');
        return false;
      }

      if (!f.birthDate) {
        this.showWarning('Debe ingresar fecha de nacimiento');

        return false;
      }
      // =====================================
      // 🔥 PARENTESCO
      // =====================================
      if (!f.parentTypeId) {
        this.showWarning('Debe seleccionar parentesco');
        return false;
      }
      // =====================================
      // 🔥 ESTADO CIVIL
      // =====================================
      if (!f.civilStateId) {
        this.showWarning('Debe seleccionar estado civil');
        return false;
      }
      // =====================================
      // 🔥 ACTIVIDAD
      // =====================================
      if (!f.activityId) {
        this.showWarning('Debe seleccionar actividad');
        return false;
      }
      // =====================================
      // 🔥 ESTUDIOS
      // =====================================
      if (!f.studyId) {
        this.showWarning('Debe seleccionar nivel de estudios');
        return false;
      }
      // =====================================
      // 🔥 MANUAL / PASIVO
      // =====================================
      if (f.mustCreatePassive) {
        if (
          !f.nombre?.trim() ||
          !f.apellido?.trim() ||
          !f.birthDate ||
          !f.previtionId
        ) {
          this.showWarning(
            'Complete todos los antecedentes del integrante manual',
          );
          return false;
        }
      }
    }
    return true;
  }

  // =========================================================
  // 🔥 CHECK DRAFT POSTULATION
  // =========================================================

  // =========================================================
  // 🔥 CHECK DRAFT POSTULATION
  // =========================================================

  async checkDraftPostulation() {
    try {
      console.log('🔥 CHECKING DRAFT POSTULATIONS...');

      // =====================================
      // 🔥 GET MY DRAFTS
      // =====================================

      const drafts: any[] = await firstValueFrom(
        this.wellbeingPostulationService.getMyDrafts(),
      );

      console.log('📦 DRAFTS:', drafts);

      // =====================================
      // 🔥 NO DRAFTS
      // =====================================

      if (!drafts?.length) {
        console.log('⚠️ NO DRAFT FOUND');

        await this.createPostulation();

        return;
      }

      // =====================================
      // 🔥 OPEN DIALOG
      // =====================================

      const dialogRef = this.dialog.open(PostulationResumeDialogComponent, {
        width: '420px',

        disableClose: true,

        data: drafts,
      });

      // =====================================
      // 🔥 RESULT
      // =====================================

      const result = await firstValueFrom(dialogRef.afterClosed());

      console.log('🔥 DIALOG RESULT:', result);

      // =====================================
      // 🔥 CLOSED
      // =====================================

      if (!result) {
        return;
      }

      // =====================================
      // 🔥 CONTINUE
      // =====================================

      if (result.action === 'continue') {
        const selectedDraft = result.postulation;

        console.log('♻️ CONTINUING DRAFT:', selectedDraft.id);

        // =====================================
        // 🔥 LOAD FULL POSTULATION
        // =====================================

        const fullPostulation: any = await firstValueFrom(
          this.wellbeingPostulationService.getMyPostulation(selectedDraft.id),
        );

        console.log('📦 FULL POSTULATION:', fullPostulation);

        // =====================================
        // 🔥 SET IDS
        // =====================================

        this.postulationId = fullPostulation.id;

        this.codigoPostulacion = fullPostulation.code;

        // =====================================
        // 🔥 STORAGE
        // =====================================

        this.wellbeingStorageService.savePostulationId(fullPostulation.id);

        // =====================================
        // 🔥 RESTORE AFFILIATE
        // =====================================

        if (fullPostulation.affiliate) {
          this.form.patchValue({
            rut: fullPostulation.affiliate.rut || '',

            nombre: fullPostulation.affiliate.names || '',

            apellido: fullPostulation.affiliate.lastNames || '',

            telefono: fullPostulation.affiliate.phone || '',

            email: fullPostulation.affiliate.email || '',

            direccion: fullPostulation.affiliate.address || '',

            fechaNacimiento: fullPostulation.affiliate.birthDate || '',

            sexo: fullPostulation.affiliate.sex || '',

            tipoAfiliado: fullPostulation.affiliate.affiliateType || '',

            fechaAfiliacion: fullPostulation.affiliate.affiliateDate || '',
          });
        }

        // =====================================
        // 🔥 CURRENT STEP
        // =====================================

        if (fullPostulation.currentStep) {
          this.currentStep = fullPostulation.currentStep;
        }

        // =====================================
        // 🔥 SUCCESS
        // =====================================

        this.showSuccess('Postulación restaurada correctamente');

        return;
      }

      // =====================================
      // 🔥 NEW DRAFT
      // =====================================

      if (result.action === 'new') {
        console.log('🆕 NEW DRAFT');

        await this.createPostulation();

        return;
      }

      // =====================================
      // 🔥 DELETE DRAFT
      // =====================================

      if (result.action === 'delete') {
        const selectedDraft = result.postulation;

        console.log('🗑️ DELETING DRAFT:', selectedDraft.id);

        await firstValueFrom(
          this.wellbeingPostulationService.deleteMyPostulation(
            selectedDraft.id,
          ),
        );

        this.showSuccess('Borrador eliminado correctamente');

        // =====================================
        // 🔥 RELOAD
        // =====================================

        await this.checkDraftPostulation();

        return;
      }
    } catch (e) {
      console.error('❌ ERROR CHECK DRAFT:', e);

      this.showError('Error verificando borradores');
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

  async saveStep5AcademicVerification() {}
}

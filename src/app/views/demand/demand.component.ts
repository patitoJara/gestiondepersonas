/********************************************************************
 * 🟦 DEMAND COMPONENT — VERSION REFACTORIZADA
 * Usa los 7 servicios: preload, rutSearch, save, previousRecords,
 * edit, utils y token.
 ********************************************************************/

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

// Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { DangerConfirmData } from '@app/shared/confirm-dialog/DangerConfirmDialogComponent';

import { MatMenuModule } from '@angular/material/menu';

// Servicios
import { PreloadCatalogsService } from '@app/services/demand/preload-catalogs.service';
import { DemandUtilsService } from '@app/services/demand/demand-utils.service';

import { TokenService } from '@app/services/token.service';
import { PostulantService } from '@app/services/postulant.service';
import { ContactService } from '@app/services/contact.service';
import { RegisterService } from '@app/services/register.service';
import { RegisterMovementService } from '@app/services/register-movement.service';
import { RegisterSubstanceService } from '@app/services/register-substance.service';
import { RegisterSubstanceServiceDto } from '@app/services/substance-Create-Dto.service';
import { DemandCloneService } from '@app/services/demand/demand-clone.service';
import { Register } from '@app/models/register';

import { PostulantCreateService } from '@app/services/postulant-create.service';

import type { PostulantCreateDto } from '@app/models/postulant-create.dto';

import { DemandUpdateService } from '@app/services/demand/demand-update.service';
import { PostulantEditDialogComponent } from '@app/views/postulant/postulant-edit-dialog/postulant-edit-dialog.component';
import { ContactEditDialogComponent } from '@app/views/contact/contact-edit-dialog/contact-edit-dialog.component';

import { rutValidator } from '@app/core/validator/rut.validator';
import { CitationReportService } from '@app/services/reports/citation-report.service';

import { firstValueFrom } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { distinctUntilChanged } from 'rxjs/operators';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-demand',
  standalone: true,
  templateUrl: './demand.component.html',
  styleUrls: ['./demand.component.scss'],
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatListModule,
    MatRadioModule,
    MatDialogModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class DemandComponent implements OnInit {
  canClearForm = false; // 🧹 botón limpiar
  canEditPostulant = false; // ✏️ botón editar

  currentAction: 'NEW' | 'EDIT' | 'CLONE_SAME_PROGRAM' | 'CLONE_OTHER_PROGRAM' =
    'NEW';

  register: Register | null = null;
  fichaAnterior: any | null = null;
  private panelCerradoManualmente = false;
  uiReady = false;

  actionLabel: string = 'Gestión de Demanda';

  mostrarBloqueoPostulante = false;
  mostrarBloqueoReferente = false;

  // =========================
  // 🔐 FLAGS DE EDICIÓN
  // =========================

  saving = false;
  numerosTratamiento: number[] = Array.from({ length: 11 }, (_, i) => i);

  // =========================
  // 🧩 FORMULARIO
  // =========================

  form!: FormGroup;

  // =========================
  // UI / ESTADO
  // =========================

  citacionCollapsed = true;
  showBlock2 = false;
  showBlock3 = false;
  showBlock4 = false;

  private cargandoPrevision = false;
  private ultimoRutBuscado: string | null = null;

  isLoading = false;
  isSearchingRut = false;

  // =========================
  // CATÁLOGOS
  // =========================

  communes: any[] = [];
  sexes: any[] = [];
  contactTypes: any[] = [];
  senders: any[] = [];
  diverters: any[] = [];
  programs: any[] = [];
  notRelevants: any[] = [];
  substances: any[] = [];
  professions: any[] = [];
  results: any[] = [];
  states: any[] = [];
  convPrev: any[] = [];
  intPrev: any[] = [];
  filteredConvPrev: any[] = [];

  fichasMismoPrograma: any[] = [];
  fichasOtrosProgramas: any[] = [];
  mostrarPanelFichas = false;

  // =========================
  // SESIÓN
  // =========================

  fullName = '';
  activeProgram: string | null = null;

  edad: number | null = null;
  diasTranscurridos: number | null = null;

  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private preload: PreloadCatalogsService,
    public utils: DemandUtilsService,
    private tokenService: TokenService,
    private report: CitationReportService,
    private demandCloneService: DemandCloneService,
    private postulantService: PostulantService,
    private postulantCreateService: PostulantCreateService,
    private contactService: ContactService,
    private registerService: RegisterService,
    private registerMovementService: RegisterMovementService,
    private demandUpdateService: DemandUpdateService,
    private registerSubstanceService: RegisterSubstanceService,
    private registerSubstanceServiceDto: RegisterSubstanceServiceDto,
  ) {}

  movements: any[] = [];
  isLoadingMovements = false;

  displayedColumns = [
    'date',
    'hour',
    'profession',
    'professional',
    'state',
    'actions',
  ];
  // ============================================================
  // 🟦 INICIO
  // ============================================================

  ngOnInit(): void {
    this.initForm();

    this.loadCatalogs().then(() => {
      queueMicrotask(() => {
        this.nuevaDemanda(); // 👈 RESET REAL

        this.form.get('fechaSolicitud')?.valueChanges.subscribe((fecha) => {
          this.onFechaSolicitudChange(fecha);
        });

        // 📅 Fecha solicitud → días transcurridos
        this.form.get('fechaSolicitud')?.valueChanges.subscribe((fecha) => {
          this.onFechaSolicitudChange(fecha);
        });
        this.onFechaSolicitudChange(this.form.get('fechaSolicitud')?.value);

        // 🎂 Fecha nacimiento → edad

        this.form
          .get('birthDate')
          ?.valueChanges.pipe(distinctUntilChanged())
          .subscribe((value) => {
            this.edad = this.utils.getEdadDesdeFecha(value);
          });
        this.edad = this.utils.getEdadDesdeFecha(
          this.form.get('birthDate')?.value,
        );
        this.uiReady = true;
        this.cdRef.detectChanges();
      });
    });

    this.setupReactiveListeners();
  }

  private setupReactiveListeners(): void {
    this.form
      .get('result')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => {});

    this.form
      .get('intPrev')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((rawId) => {
        if (this.cargandoPrevision) return;

        const id = Number(rawId);
        if (!id) return;

        this.filterConvPrevByIntPrev(id);
        this.aplicarReglaPrevision(id);
      });
  }
  // ============================================================
  // 🟦 FORMULARIO
  // ============================================================
  initForm(): void {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    this.form = this.fb.group({
      rut: ['', [Validators.required, rutValidator()]],
      birthDate: new Date(),
      firstName: ['', Validators.required],
      secondName: [''],
      firstLastName: ['', Validators.required],
      secondLastName: [''],
      phone: [''],
      email: ['', [Validators.email, Validators.pattern(EMAIL_REGEX)]],

      commune: [null, Validators.required],
      address: [''],
      sex: [null, Validators.required],

      // Referente
      name: ['', Validators.required],
      cellphone: ['', Validators.required],
      emailPostulant: ['', [Validators.email, Validators.pattern(EMAIL_REGEX)]],
      contactDescription: [''],

      // Previsión
      intPrev: [null, Validators.required],
      convPrev: [{ value: null, disabled: true }, Validators.required],

      ntrat: [0, Validators.required],
      contactTypes: [null, Validators.required],

      // Sustancias
      substance: [null, Validators.required],
      secondarySubstances: [[]],

      senders: [null, Validators.required],
      diverters: [null, Validators.required],

      state: [null, Validators.required],
      result: [null, Validators.required],
      notRelevants: [null, Validators.required],

      fechaSolicitud: [now],

      // ===============================
      // 🟦 NUEVA ATENCIÓN (FORM AUXILIAR)
      // ===============================
      newDate: [now],
      newHour: [currentTime],
      newProfession: [null],
      newProfessional: [''],

      registerDescription: [''],
    });
  }

  // ============================================================
  // 📦 CARGAR CATÁLOGOS
  // ============================================================
  loadCatalogs(): Promise<void> {
    this.isLoading = true;

    return new Promise((resolve) => {
      this.preload.loadAll().subscribe({
        next: (data) => {
          this.communes = data.communes;
          this.sexes = data.sexes;
          this.contactTypes = [...data.contactTypes];
          this.senders = data.senders;
          this.diverters = data.diverters;
          this.programs = data.programs;
          this.notRelevants = data.notRelevants;
          this.substances = data.substances;

          this.intPrev = data.intPrev;
          this.convPrev = data.convPrev;
          this.filteredConvPrev = [];

          this.professions = data.profession1;
          this.results = data.results;
          this.states = data.state;

          // 🔑 BUSCAR VALORES POR DEFECTO
          const estadoEnTramite = this.states.find(
            (s) => s.name === 'EN TRAMITE',
          );

          const notRelevantNinguna = this.notRelevants.find(
            (n) => n.name === 'NINGUNA',
          );

          const resultadoSinResultado = this.results.find(
            (r) => r.name === 'AUN SIN RESULTADO',
          );

          this.isLoading = false;
          this.cdRef.detectChanges();
          resolve();
        },

        error: () => {
          this.isLoading = false;
          resolve();
        },
      });
    });
  }

  private getActiveProgramId(): number | null {
    const programList = JSON.parse(sessionStorage.getItem('programs') || '[]');
    const activeName = this.tokenService.getActiveProgram();
    const p = programList.find((x: any) => x.name === activeName);
    return p?.id ?? null;
  }

  // ============================================================
  // 🟦 Crear Register Movimiento de Atención
  // ============================================================
  addMovement(): void {
    const { newDate, newHour, newProfession, newProfessional } =
      this.form.value;

    if (!newDate || !newHour || !newProfession || !newProfessional) return;

    const newMovement = {
      id: null,
      profession: this.professions.find((p) => p.id === Number(newProfession)),
      full_name: String(newProfessional),
      date_attention: formatDate(newDate, 'yyyy-MM-dd', 'en-CL'),
      hour_attention: String(newHour),
      state: 'AGENDADO',
      __isNew: true,
      __isDirty: true,
    };

    // 🔥 CLAVE: nueva referencia (mat-table refresca)
    this.movements = [...this.movements, newMovement];
    this.cdRef.detectChanges();

    this.form.patchValue({
      newDate: null,
      newHour: '',
      newProfession: null,
      newProfessional: '',
    });
  }

  // ============================================================
  // 🟦 Cancela Register Movimiento de Atención
  // ============================================================
  setMovementState(movement: any, accion: string): void {
    const stateChanged = movement.state !== accion;

    movement.state = accion;

    if (!movement.id || stateChanged) {
      movement.__isDirty = true;
    }
    this.cdRef.detectChanges();
  }

  getStateLabel(state: string): string {
    switch (state) {
      case 'AGENDADO':
        return 'Agendado';
      case 'SE_PRESENTO':
        return 'Se presentó';
      case 'NO_SE_PRESENTO':
        return 'No se presentó';
      case 'CANCELA_PROGRAMA':
        return 'Cancela programa';
      default:
        return state;
    }
  }

  getStateColor(state: string): 'success' | 'warn' | 'info' {
    switch (state) {
      case 'SE_PRESENTO':
        return 'success';
      case 'NO_SE_PRESENTO':
      case 'CANCELA_PROGRAMA':
        return 'warn';
      case 'AGENDADO':
        return 'info';
      default:
        return 'info';
    }
  }

  getStateIcon(state: string): string {
    switch (state) {
      case 'AGENDADO':
        return 'event';
      case 'SE_PRESENTO':
        return 'check_circle';
      case 'NO_SE_PRESENTO':
        return 'person_off';
      case 'CANCELA_PROGRAMA':
        return 'cancel';
      default:
        return 'help';
    }
  }

  // ============================================================
  // 🟦 Crear y update Register Movimiento de Atención
  // ============================================================

  private async syncRegisterMovements(
    registerId: number,
    movements: any[],
  ): Promise<void> {
    for (const m of movements) {
      // ❌ datos incompletos
      if (
        !m.date_attention ||
        !m.hour_attention ||
        !m.profession?.id ||
        !m.full_name
      ) {
        continue;
      }

      // 🟢 NUEVO → CREATE
      if (!m.id) {
        const created: any = await firstValueFrom(
          this.registerMovementService.create({
            register: { id: registerId },
            profession: { id: m.profession.id },
            full_name: m.full_name,
            date_attention: m.date_attention,
            hour_attention: m.hour_attention,
            state: m.state ?? 'AGENDADO',
          }),
        );
        m.id = created.id;
        m.__isDirty = false;
        m.__isNew = false;
        continue;
      }

      // 🟡 EXISTENTE + CAMBIO → UPDATE (REEMPLAZO COMPLETO)
      if (m.__isDirty) {
        await firstValueFrom(
          this.registerMovementService.update(m.id, {
            register: { id: registerId },
            profession: { id: m.profession.id },
            full_name: m.full_name,
            date_attention: m.date_attention,
            hour_attention: m.hour_attention,
            state: m.state,
          }),
        );
      }
    }
  }

  private toggleBodyScroll(block: boolean): void {
    document.body.style.overflow = block ? 'hidden' : '';
  }

  // ===========================================================
  // 🔁 Builder Datos de Contactos
  // ===========================================================
  private buildContactPayload(): any {
    return {
      name: this.form.value.name?.trim() || null,
      description: this.form.value.contactDescription?.trim() || null,
      email: this.form.value.emailPostulant?.trim() || null,
      cellphone: this.form.value.cellphone?.trim() || null,
    };
  }

  // ===========================================================
  // 🔁 Builder Register
  // ===========================================================
  private buildRegisterPayload(userId: number): any {
    if (!this.register) {
      throw new Error('buildRegisterPayload llamado sin register cargado');
    }

    const raw = this.form.getRawValue();

    return {
      postulant: { id: this.register.postulant.id },
      program: { id: this.register.program.id },
      user: { id: userId },

      contactType: { id: this.extractId(this.form.value.contactTypes) },

      sender: { id: this.extractId(this.form.value.senders) },
      diverter: { id: this.extractId(this.form.value.diverters) },

      number_tto: String(this.form.value.ntrat),

      description: this.form.value.registerDescription || '',

      result: { id: this.extractId(this.form.value.result) },
      state: { id: this.extractId(this.form.value.state) },

      notRelevant: raw.notRelevants ? { id: Number(raw.notRelevants) } : null,

      date_attention: this.form.get('fechaSolicitud')?.value,
      is_history: 'NO',
    };
  }

  // ===========================================================
  // 🔁 ACTUALIZAR DEMANDA (MISMA BASE QUE GUARDAR)
  // ===========================================================
  async updateDemand(): Promise<void> {
    if (!this.register) return;
    const register = this.register;
    const registerId = register.id;
    // ===============================================
    // 🔎 VALIDACIÓN ÚNICA (EDIT)
    // ===============================================

    if (!this.validateEditDemand()) {
      throw new Error('Formulario inválido (EDIT)');
    }

    const userId = this.tokenService.getUserId();
    if (!userId) {
      this.showValidationDialog();
      throw new Error('Usuario inválido');
    }

    try {
      // ===============================================================
      // 🟦 PASO 1: ACTUALIZAR DATOS DE DEMANDA (FORM)
      // ===============================================================
      await this.demandUpdateService.updateDemand(
        this.register.id,
        this.form.getRawValue(),
        {
          userId,
          programId: this.register.program.id,
        },
        this.register,
      );

      // ===============================================================
      // 🟦 PASO 1.5: ACTUALIZAR CONTACTO (REFERENTE)
      // ===============================================================
      if (this.register?.contact?.id) {
        await firstValueFrom(
          this.contactService.update(
            this.register.contact.id,
            this.buildContactPayload(),
          ),
        );
      }
      // ===============================================================
      // 🟦 PASO 2: ACTUALIZAR REGISTER
      // ===============================================================
      const registerPayload = this.buildRegisterPayload(userId);

      await this.demandUpdateService.updateRegister(
        this.register.id,
        registerPayload,
      );

      // ===============================================================
      // 🔥 PASO 3: SINCRONIZAR MOVIMIENTOS (TABLA → BACKEND)
      // ===============================================================
      await this.syncRegisterMovements(this.register.id, this.movements);

      // ===============================================================
      // 🔥 PASO 3.5: ACTUALIZAR SUSTANCIAS (FALTABA)
      // ===============================================================
      await this.updateSubstances(this.register.id);

      // ===============================================================
      // 🔄 PASO 4: RECARGA FINAL DESDE BACKEND
      // ===============================================================
      this.register = await firstValueFrom(
        this.registerService.getById(this.register.id),
      );

      // ===============================================================
      // 🟦 PASO 5: REFRESCAR FORMULARIO + ESTADO
      // ===============================================================
      this.utils.cargarFichaCompletaEnFormulario(this.form, this.register);

      this.ultimoRutBuscado = null;
      this.cdRef.detectChanges();

      console.log('✅ Demanda actualizada correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar la demanda', error);
      throw error; // 🔥 CLAVE
    } finally {
      // reservado para loader global
    }
  }

  //----------------------------------------------------------------------------------------------------

  async updateSubstances(registerId: number): Promise<void> {
    // 1️⃣ Anular sustancias actuales (soft delete)
    await firstValueFrom(
      this.registerSubstanceService.deleteByRegisterId(registerId),
    );

    // 2️⃣ Obtener valores desde el formulario
    const principal = this.extractId(this.form.value.substance);

    const secondaries: number[] = (this.form.value.secondarySubstances || [])
      .map((s: any) => this.extractId(s))
      .filter((s: number | null): s is number => s !== null && s !== principal);

    // 🟢 Principal
    if (principal) {
      await firstValueFrom(
        this.registerSubstanceServiceDto.create({
          register: { id: registerId },
          substance: { id: principal },
          level: 'Principal',
        }),
      );
    }

    // 🟡 Secundarias
    for (const s of secondaries) {
      await firstValueFrom(
        this.registerSubstanceServiceDto.create({
          register: { id: registerId },
          substance: { id: s },
          level: 'Secundaria',
        }),
      );
    }

    console.log('✅ Sustancias actualizadas (DTO)');
  }

  // ===========================================================
  // 💾 GUARDAR DEMANDA (sin tipo de previsión)
  // ===========================================================
  async saveDemand(): Promise<void> {
    // ===============================================
    // 🔎 VALIDACIÓN ÚNICA (NEW)
    // ===============================================
    if (!this.validateNewDemand()) {
      this.showValidationDialog();
      return;
    }

    // ===============================================
    // 🔹 SESIÓN USUARIO
    // ===============================================
    const profile = this.tokenService.getUserProfile();
    const userId = this.tokenService.getUserId();

    if (!profile || !userId) {
      this.dialog.open(ConfirmDialogOkComponent, {
        width: '620px',
        disableClose: true,
        data: {
          title: 'Sesión',
          message: '❌ Sesión inválida. Inicie sesión nuevamente.',
          icon: 'lock_outline',
          confirmText: 'OK',
        },
      });
      return;
    }

    // ===============================================
    // 🔹 PROGRAMA ACTIVO
    // ===============================================
    const activeProgram =
      this.tokenService.getActiveProgram() ||
      this.tokenService.getUserPrograms()?.[0];

    if (!activeProgram) {
      this.dialog.open(ConfirmDialogOkComponent, {
        width: '620px',
        disableClose: true,
        data: {
          title: 'Programa',
          message: '❌ No hay programa activo asociado al usuario.',
          icon: 'assignment_ind_off',
          confirmText: 'OK',
        },
      });
      return;
    }

    const programList = JSON.parse(sessionStorage.getItem('programs') || '[]');
    const programObj = programList.find((p: any) => p.name === activeProgram);

    if (!programObj?.id) {
      this.dialog.open(ConfirmDialogOkComponent, {
        width: '620px',
        disableClose: true,
        data: {
          title: 'Programa',
          message: '❌ Programa activo inválido. Inicie sesión nuevamente.',
          icon: 'assignment_ind_off',
          confirmText: 'OK',
        },
      });
      return;
    }

    try {
      // ===============================================================
      // 🟦 PASO 1: CREAR POSTULANTE
      // ===============================================================
      const postulantPayload: PostulantCreateDto = {
        user: { id: userId },

        commune: { id: this.form.value.commune },
        sex: { id: this.form.value.sex },

        convPrev: this.form.value.convPrev
          ? {
              id: this.form.value.convPrev,
              intPrev: { id: this.form.value.intPrev },
            }
          : undefined,

        firstName: this.form.value.firstName?.trim() ?? null,
        lastName: this.form.value.secondName?.trim() ?? null,
        firstLastName: this.form.value.firstLastName?.trim() ?? null,
        secondLastName: this.form.value.secondLastName?.trim() ?? null,

        rut: this.form.value.rut,
        birthdate: formatDate(this.form.value.birthDate, 'yyyy-MM-dd', 'en-CL'),

        email: this.form.value.email?.trim() ?? null,
        phone: this.form.value.phone?.trim() ?? null,
        address: this.form.value.address?.trim() ?? null,
      };

      // 🔥 AQUÍ FALTABA ESTO
      const postulant = await firstValueFrom(
        this.postulantCreateService.create(postulantPayload),
      );

      // ===============================================================
      // 🟦 PASO 2: CONTACTO
      // ===============================================================

      const contact = await firstValueFrom(
        this.contactService.createDto({
          name: this.form.value.name?.trim() || null,
          description: this.form.value.contactDescription?.trim() || null,
          email: this.form.value.emailPostulant?.trim() || null,
          cellphone: this.form.value.cellphone?.trim() || null,
          postulant: { id: postulant.id! }, // 🔥 CLAVE
        }),
      );

      // ===============================================================
      // 🟦 PASO 3: REGISTER
      // ===============================================================
      const raw = this.form.getRawValue();

      console.log('FORM VALUE:', {
        notRelevants: this.form.value.notRelevants,
        result: this.form.value.result,
        state: this.form.value.state,
      });

      console.log('FORM RAW:', {
        notRelevants: raw.notRelevants,
        result: raw.result,
        state: raw.state,
      });

      const register = await firstValueFrom(
        this.registerService.create({
          postulant: { id: postulant.id },
          contact: { id: contact.id },

          contactType: { id: this.extractId(this.form.value.contactTypes)! },
          sender: { id: this.extractId(this.form.value.senders)! },
          diverter: { id: this.extractId(this.form.value.diverters)! },

          program: { id: programObj.id },
          user: { id: userId },

          number_tto:
            this.form.value.ntrat === 0
              ? 0
              : this.form.value.ntrat
                ? this.form.value.ntrat
                : null,

          // 🔑 AQUÍ ESTABA EL PROBLEMA
          notRelevant: raw.notRelevants ? { id: raw.notRelevants } : null,
          result: raw.result ? { id: raw.result } : null,
          state: raw.state ? { id: raw.state } : null,

          date_attention: this.form.get('fechaSolicitud')?.value ?? null,
          description: this.form.value.registerDescription?.trim() || null,
          is_history: 'NO',
        }),
      );

      // ===============================================================
      // 🟦 PASO 4: MOVIMIENTOS
      // ===============================================================
      await this.syncRegisterMovements(register.id, this.movements);
      // ===============================================================
      // 🟦 PASO 5: SUSTANCIAS (FIX)
      // ===============================================================
      const principal = this.extractId(this.form.value.substance);

      const secondaries: number[] = (this.form.value.secondarySubstances || [])
        .map((s: any) => this.extractId(s))
        .filter(
          (s: number | null): s is number => s !== null && s !== principal,
        );

      // 🟢 Principal
      if (principal) {
        await firstValueFrom(
          this.registerSubstanceServiceDto.create({
            register: { id: register.id },
            substance: { id: principal },
            level: 'Principal',
          }),
        );
      }

      // 🟡 Secundarias
      for (const s of secondaries) {
        await firstValueFrom(
          this.registerSubstanceServiceDto.create({
            register: { id: register.id },
            substance: { id: s },
            level: 'Secundaria',
          }),
        );
      }

      // ===============================================================
      // 🔥 RECARGA + RESET CLAVE
      // ===============================================================
      this.register = await firstValueFrom(
        this.registerService.getById(register.id),
      );
      this.utils.cargarFichaCompletaEnFormulario(this.form, this.register);

      // ===============================================================
      // 🔄 LA DEMANDA YA EXISTE → PASA A EDIT
      // ===============================================================
      this.currentAction = 'EDIT';
      this.actionLabel = '🔵 Modificando Demanda';

      // 🔒 Regla clínica
      this.bloquearCamposPostulante();
      this.bloquearCamposReferente();

      // 🎛️ UX
      this.canClearForm = true;
      this.canEditPostulant = true;

      this.form.markAsPristine();
      this.form.markAsUntouched();

      this.cdRef.detectChanges();

      // ✅ Mensaje final
      this.mostrarMensajeExito('Demanda creada correctamente');
      // ===============================================================

      // 🔑 CLAVE: permitir buscar el mismo RUT nuevamente
      this.ultimoRutBuscado = null;

      this.form.patchValue({
        newDate: null,
        newHour: '',
        newProfession: null,
        newProfessional: '',
      });

      //this.cdRef.detectChanges();
    } catch (error) {
      console.error('❌ Error guardar la demanda', error);
      throw error; // 🔥 CLAVE
    } finally {
      // reservado para loader global
    }
  }

  // ===========================================================
  // 💾 GUARDAR CLON DE DEMANDA (delegado a DemandCloneService)
  // ===========================================================
  async saveDemandClone(): Promise<void> {
    // ❌ NO validar this.register
    // ❌ NO usar registerId aquí

    if (!this.validateCloneDemand()) {
      this.showValidationDialog();
      return;
    }

    const userId = this.tokenService.getUserId();
    if (!userId || !this.fichaAnterior?.postulant) {
      this.showValidationDialog();
      return;
    }

    const activeProgram =
      this.tokenService.getActiveProgram() ||
      this.tokenService.getUserPrograms()?.[0];

    const programList = JSON.parse(sessionStorage.getItem('programs') || '[]');
    const programObj = programList.find((p: any) => p.name === activeProgram);

    if (!programObj?.id) {
      this.showValidationDialog('Programa activo inválido.');
      return;
    }

    try {
      const raw = this.form.getRawValue();

      // 🔑 datos base del clone
      raw.postulantId = this.fichaAnterior.postulant.id;
      raw.contactId = this.fichaAnterior.contact?.id;

      if (!raw.postulantId || !raw.contactId) {
        this.showValidationDialog(
          'No es posible clonar la demanda: faltan datos del postulante o contacto.',
        );
        return;
      }

      raw.notRelevants ??= this.getNotRelevanteNinguna();
      raw.result ??= this.getResultadoSinResultado();
      raw.state ??= this.getEstadoEnTramite();

      const principal = this.extractId(raw.substance);
      if (!principal) {
        this.showValidationDialog(
          'Debe seleccionar una sustancia principal para clonar la demanda.',
        );
        return;
      }

      // 🟦 AQUÍ SE CREA EL REGISTER
      const createdRegister = await this.demandCloneService.cloneDemand({
        formRaw: raw,
        userId,
        programId: programObj.id,
        movements: this.movements,
      });

      // 🔄 RECARGAR DESDE BACKEND
      this.register = await firstValueFrom(
        this.registerService.getById(createdRegister.id),
      );

      this.utils.cargarFichaCompletaEnFormulario(this.form, this.register);

      this.movements = [];
      this.fichaAnterior = null;

      this.form.patchValue({
        registerDescription: '',
        newDate: null,
        newHour: '',
        newProfession: null,
        newProfessional: '',
      });

      this.form.markAsPristine();
      this.form.markAsUntouched();

      // ✅ MENSAJE SOLO AQUÍ
      this.mostrarMensajeExito('Operación realizada correctamente');
    } catch (error) {
      console.error('❌ Error guardando demanda (CLONE)', error);
      throw error;
    }
  }

  // ============================================================
  // 🟦 CARGAR DEMANDA COMPLETA (EDIT / USAR FICHA)
  // ============================================================
  private async loadDemandCompleta(registerId: number): Promise<void> {
    this.isLoading = true;
    this.cargandoPrevision = true; // 🔒 bloquear reacciones

    try {
      const [register, substances, movements] = await Promise.all([
        firstValueFrom(this.registerService.getById(registerId)),
        firstValueFrom(
          this.registerSubstanceService.searchByRegisterId(registerId),
        ),
        firstValueFrom(
          this.registerMovementService.searchByRegisterId(registerId),
        ),
      ]);

      this.register = register;

      // ============================
      // 🟦 DATOS BASE (REGISTER)
      // ============================
      this.utils.cargarFichaCompletaEnFormulario(this.form, register);

      // ============================
      // 🟦 POSTULANTE COMPLETO (CLAVE)
      // ============================
      const postulant = await firstValueFrom(
        this.postulantService.getById(register.postulant.id),
      );

      // ============================
      // 🟦 PREVISIÓN (DESDE POSTULANT)
      // ============================
      const intPrevId = postulant.convPrev?.intPrev?.id ?? null;
      const convPrevId = postulant.convPrev?.id ?? null;

      if (intPrevId) {
        // 1️⃣ setear tipo previsión SIN eventos
        this.form.get('intPrev')?.setValue(intPrevId, { emitEvent: false });

        // 2️⃣ filtrar previsiones
        this.filterConvPrevByIntPrev(intPrevId);

        // 3️⃣ habilitar convPrev
        const convPrevControl = this.form.get('convPrev');
        convPrevControl?.enable({ emitEvent: false });

        // 4️⃣ setear previsión real
        if (convPrevId) {
          convPrevControl?.setValue(convPrevId, { emitEvent: false });
        }

        // 5️⃣ aplicar reglas clínicas UNA vez
        this.aplicarReglaPrevision(intPrevId);
      }

      // ============================
      // 🟦 CONTACTO (FULL)
      // ============================
      if (register.contact?.id) {
        const contact = await firstValueFrom(
          this.contactService.getById(register.contact.id),
        );

        this.form.patchValue(
          {
            name: contact?.name ?? '',
            cellphone: contact?.cellphone ?? '',
            emailPostulant: contact?.email ?? '',
            contactDescription: contact?.description ?? '',
          },
          { emitEvent: false },
        );
      }

      // ============================
      // 🟦 MOVIMIENTOS
      // ============================
      this.movements = (movements ?? [])
        .filter((m: any) => Number(m.register?.id) === Number(register.id))
        .map((m: any) => ({
          ...m,
          __isDirty: false,
          __isNew: false,
        }));

      // ============================
      // 🟦 SUSTANCIAS
      // ============================
      const principal = substances.find((s: any) => s.level === 'Principal');
      const secundarias = substances.filter(
        (s: any) => s.level === 'Secundaria',
      );

      this.form.patchValue(
        {
          substance: principal?.substance?.id ?? null,
          secondarySubstances: secundarias.map((s: any) => s.substance.id),
        },
        { emitEvent: false },
      );

      // ============================
      // 🟦 UI FINAL
      // ============================
      this.form.markAsPristine();
      this.form.markAsUntouched();

      this.cdRef.detectChanges();
    } catch (err) {
      console.error('❌ Error cargando demanda completa', err);
    } finally {
      this.cargandoPrevision = false;
      this.isLoading = false;
    }
  }

  // ============================================================
  // 🔍 FILTRADO DE PREVISIONES SEGÚN TIPO
  // ============================================================
  filterConvPrevByIntPrev(typeId: number): void {
    const convPrevControl = this.form.get('convPrev');

    if (!typeId || !this.convPrev.length) {
      this.filteredConvPrev = [];
      convPrevControl?.reset(null, { emitEvent: false });
      convPrevControl?.disable({ emitEvent: false });
      convPrevControl?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    // 1️⃣ Filtrar por asociación real
    this.filteredConvPrev = this.convPrev.filter(
      (p: any) => Number(p.intPrev?.id) === Number(typeId),
    );

    if (this.filteredConvPrev.length === 0) {
      convPrevControl?.reset(null, { emitEvent: false });
      convPrevControl?.disable({ emitEvent: false });
      convPrevControl?.updateValueAndValidity({ emitEvent: false });
      return;
    }

    // 🔑 Habilitar correctamente
    convPrevControl?.enable({ emitEvent: false });
    convPrevControl?.updateValueAndValidity({ emitEvent: false });

    // 2️⃣ Si ya hay una previsión válida, NO pisarla
    const currentValue = convPrevControl?.value;
    const sigueSiendoValida = this.filteredConvPrev.some(
      (p) => p.id === currentValue,
    );

    if (sigueSiendoValida) {
      return; // 👈 CLAVE
    }

    // 3️⃣ Regla de negocio: FONASA → FONASA A
    let selected = null;

    if (Number(typeId) === 1) {
      selected =
        this.filteredConvPrev.find(
          (p) => this.normalize(p.name) === 'FONASA A',
        ) ?? this.filteredConvPrev[0];
    } else {
      selected = this.filteredConvPrev[0];
    }

    convPrevControl?.setValue(selected.id, { emitEvent: false });
    convPrevControl?.updateValueAndValidity({ emitEvent: false });

    this.cdRef.detectChanges();
  }

  // ============================================================
  // SUSTANCIAS
  // ============================================================
  selectPrincipal(id: number) {
    this.utils.selectPrincipal(this.form, id);
  }

  toggleSecondary(id: number) {
    this.utils.toggleSecondary(this.form, id);
  }

  validatePrincipal(): boolean {
    return this.utils.validatePrincipal(this.form);
  }

  // ===========================================================
  // 🧾 Métodos del formulario
  // ===========================================================
  onSubmit(): void {
    if (this.isSaveDisabled()) return;
    this.viewAction();
  }

  cancel(): void {
    this.nuevaDemanda();
  }

  // ===========================================================
  // 🧮 Métodos auxiliares
  // ===========================================================
  onChangeGroup(field: string): void {
    const controlName = `asistencia${field}`;
    const asistencia = this.form.get(controlName)?.value; // "Ninguna" | "Se presentó" | "No se presentó"
    setTimeout(() => {
      // ================================
      // SI ELIGE "Ninguna" → cerrar bloques siguientes
      // ================================
      if (asistencia === 'Ninguna') {
        if (field === '1') {
          this.showBlock2 = false;
          this.showBlock3 = false;
          this.showBlock4 = false;

          this.form
            .get('asistencia2')
            ?.setValue('Ninguna', { emitEvent: false });
          this.form
            .get('asistencia3')
            ?.setValue('Ninguna', { emitEvent: false });
          this.form
            .get('asistencia4')
            ?.setValue('Ninguna', { emitEvent: false });
        } else if (field === '2') {
          this.showBlock3 = false;
          this.showBlock4 = false;

          this.form
            .get('asistencia3')
            ?.setValue('Ninguna', { emitEvent: false });
          this.form
            .get('asistencia4')
            ?.setValue('Ninguna', { emitEvent: false });
        } else if (field === '3') {
          this.showBlock4 = false;

          this.form
            .get('asistencia4')
            ?.setValue('Ninguna', { emitEvent: false });
        }

        this.cdRef.detectChanges();
        return;
      }

      // ================================
      // SI ELIGE "Se presentó" o "No se presentó"
      // habilitar el siguiente bloque
      // ================================
      switch (field) {
        case '1':
          this.showBlock2 = true;
          break;

        case '2':
          this.showBlock3 = true;
          break;

        case '3':
          this.showBlock4 = true;
          break;

        case '4':
          //////console.log('📁 Registro pasa a histórico:', this.form.value);
          break;
      }

      this.cdRef.detectChanges();
    });
  }

  // ============================================================
  // 🔠 FORMATEAR Y VALIDAR RUT EN VIVO
  // ============================================================
  autoFormatRut(event: any): void {
    this.panelCerradoManualmente = false;
    let value = event.target.value.toUpperCase();

    // Solo números y K
    value = value.replace(/[^0-9K]/g, '');

    // Máx 9 caracteres
    if (value.length > 9) {
      value = value.slice(0, 9);
    }

    if (value.length < 2) {
      const control = this.form.get('rut');
      control?.setValue(value, { emitEvent: false });
      control?.updateValueAndValidity({ emitEvent: false }); // 🔑 CLAVE
      return;
    }

    const cuerpo = value.slice(0, -1);
    const dv = value.slice(-1);

    const cuerpoFmt = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const rutFinal = `${cuerpoFmt}-${dv}`;

    this.form.get('rut')?.setValue(rutFinal, { emitEvent: false });
    this.form.get('rut')?.updateValueAndValidity({ emitEvent: false });
  }

  onRutFinalizado(): void {
    const control = this.form.get('rut');
    if (!control) return;

    control.updateValueAndValidity();
    control.markAsTouched();

    if (control.valid) {
      this.searchByRut();
    }
  }

  preventEnter(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  }

  /* ************************************************************* */
  /* reporte */
  /* ************************************************************* */

  imprimirCitacion(index: number, movement: any): void {
    const numero = index + 1;
    const raw = this.form.getRawValue();

    const demandante = [
      raw.firstName,
      raw.secondName,
      raw.firstLastName,
      raw.secondLastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    // ✅ generar HTML (NO imprime)
    const html = this.report.generateFromMovement({
      numero,
      movement,
      demandante,
      usuario: this.fullName,
      professions: this.professions,
      program: this.activeProgram,
    });

    // ✅ imprimir sin robar foco
    this.report.printHtml(html);
  }

  /* ************************************************************* */
  /* reporte */
  /* ************************************************************* */

  async viewAction(): Promise<void> {
    if (this.saving || !this.currentAction) return;

    this.saving = true;
    try {
      switch (this.currentAction) {
        case 'EDIT':
          await this.updateDemand();
          break;
        case 'CLONE_SAME_PROGRAM':
          await this.saveDemandClone();
          break;
        case 'CLONE_OTHER_PROGRAM':
          await this.saveDemandClone();
          break;
        case 'NEW':
          await this.saveDemand();
          break;
      }
    } catch (error) {
      this.mostrarMensajeError('Error al guardar la demanda');
    } finally {
      this.saving = false;
      this.cdRef.detectChanges();
    }
  }

  private mostrarMensajeExito(mensaje: string): void {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '520px',
      disableClose: true,
      data: {
        title: 'Operación exitosa',
        message: mensaje,
        icon: 'check_circle',
        confirmText: 'Aceptar',
      },
    });
  }

  private mostrarMensajeError(mensaje: string): void {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '520px',
      disableClose: true,
      data: {
        title: 'Error',
        message: mensaje,
        icon: 'warning',
        confirmText: 'Aceptar',
      },
    });
  }

  validateNewDemand(): boolean {
    // 🔴 0️⃣ RUT obligatorio y válido
    const rutControl = this.form.get('rut');

    if (!rutControl || rutControl.invalid) {
      rutControl?.markAsTouched();
      this.showValidationDialog('Debe ingresar un RUT válido.');
      return false;
    }

    // 1️⃣ Sustancia principal
    if (!this.validatePrincipal()) {
      this.showValidationDialog(
        'Debe seleccionar una sustancia principal válida.',
      );
      return false;
    }

    // 2️⃣ Validación general Angular
    if (this.form.invalid) {
      this.marcarErrores();

      const campos = this.getInvalidFields().join(', ');
      this.showValidationDialog(`Faltan campos obligatorios: ${campos}`);

      return false;
    }

    return true;
  }

  validateCloneDemand(): boolean {
    if (!this.validatePrincipal()) return false;

    if (!this.fichaAnterior?.postulant) {
      this.showValidationDialog('No hay ficha base para clonar.');
      return false;
    }

    if (this.form.invalid) {
      this.marcarErrores();
      return false;
    }

    return true;
  }

  validateEditDemand(): boolean {
    if (!this.validatePrincipal()) {
      this.showValidationDialog(
        'Debe seleccionar una sustancia principal válida.',
      );
      return false;
    }

    if (!this.register?.id) {
      this.showValidationDialog('La demanda no está cargada correctamente.');
      return false;
    }

    return true;
  }

  private showValidationDialog(
    message: string = 'Revise el formulario, faltan datos obligatorios.',
  ): void {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '620px',
      disableClose: true,
      data: {
        title: 'Formulario incompleto',
        message,
        icon: 'assignment_late',
        confirmText: 'Aceptar',
      },
    });
  }

  // ============================================================
  // 🔧 UTILIDAD: normaliza valores ID (select / array / null)
  // ============================================================
  private extractId(val: any): number | null {
    if (val === null || val === undefined) return null;

    if (Array.isArray(val)) {
      const first = val[0];
      return typeof first === 'object' ? Number(first.id) : Number(first);
    }

    if (typeof val === 'object') {
      return Number(val.id);
    }

    return Number(val);
  }

  // ============================================================
  // No cumple por Sistema de Salud
  // ============================================================
  private getNoRelevantePorPrevision(): number | null {
    const item = this.notRelevants.find(
      (n: any) => this.normalize(n.name) === 'POR PREVISION DE SALUD',
    );
    return item?.id ?? null;
  }

  private getResultadoHistorico(): number | null {
    const item = this.results.find(
      (r: any) => this.normalize(r.name) === 'HISTORICO',
    );
    return item?.id ?? null;
  }

  private getEstadoNoAceptado(): number | null {
    const item = this.states.find(
      (s: any) => this.normalize(s.name) === 'NO ACEPTADO',
    );
    return item?.id ?? null;
  }

  private catalogsReady(): boolean {
    return (
      this.notRelevants.length > 0 &&
      this.results.length > 0 &&
      this.states.length > 0
    );
  }

  private aplicarReglaPrevision(intPrevId: number): void {
    // ⛔ Catálogos aún no cargados
    if (!this.catalogsReady()) return;

    // 🟢 FONASA
    if (intPrevId === 1) {
      const ninguna = this.getNotRelevanteNinguna();
      const sinResultado = this.getResultadoSinResultado();
      const enTramite = this.getEstadoEnTramite();

      this.form.get('notRelevants')?.enable({ emitEvent: false });
      this.form.get('result')?.enable({ emitEvent: false });
      this.form.get('state')?.enable({ emitEvent: false });

      this.form.patchValue(
        {
          notRelevants: ninguna, // ✅ NINGUNA
          result: sinResultado, // ✅ AÚN SIN RESULTADO
          state: enTramite, // ✅ EN TRÁMITE
        },
        { emitEvent: false },
      );

      return;
    }

    // 🔴 NO FONASA → SIEMPRE avisar
    const noRelevante = this.getNoRelevantePorPrevision();
    const historico = this.getResultadoHistorico();
    const noAceptado = this.getEstadoNoAceptado();

    if (!noRelevante || !historico || !noAceptado) return;

    this.form.patchValue(
      {
        notRelevants: noRelevante,
        result: historico,
        state: noAceptado,
      },
      { emitEvent: false },
    );

    this.form.get('notRelevants')?.disable({ emitEvent: false });
    this.form.get('result')?.disable({ emitEvent: false });
    this.form.get('state')?.disable({ emitEvent: false });

    this.dialog.open(ConfirmDialogOkComponent, {
      disableClose: true,
      data: {
        title: 'Importante – Previsión de Salud debe ser FONASA',
        message: `
        El postulante <strong>no cumple con el requisito de previsión de salud</strong>
        para optar al tratamiento.<br><br>

        El registro quedará marcado como:<br>
        • <strong>No relevante: Por previsión de salud</strong><br>
        • <strong>Resultado: Histórico</strong><br>
        • <strong>Estado: No aceptado</strong><br><br>

        <strong>El registro puede continuar.</strong><br>
        La responsabilidad del ingreso recae en el profesional entrevistador.
      `,
        icon: 'warning',
        confirmText: 'Entendido',
      },
    });
  }

  private normalize(text?: string): string {
    return (
      text
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // elimina tildes
        .toUpperCase()
        .trim() ?? ''
    );
  }

  editarPostulante(): void {
    // 🔑 Resolver contexto manualmente
    const postulantId =
      this.register?.postulant?.id ?? this.fichaAnterior?.postulant?.id;

    if (!postulantId) {
      console.warn('⚠️ No hay postulante disponible para editar');
      return;
    }

    this.dialog
      .open(PostulantEditDialogComponent, {
        width: '950px',
        disableClose: true,
        data: { postulantId },
      })
      .afterClosed()
      .subscribe((updated: boolean) => {
        if (!updated) return;

        // 🔵 EDITAR DEMANDA EXISTENTE
        if (this.register?.id) {
          this.loadDemandCompleta(this.register.id);
          return;
        }

        // 🟠 USAR DATOS / CLONE
        this.reloadPostulant();
      });
  }

  editarReferente(): void {
    // 🔑 Resolver contexto manualmente
    const contactId =
      this.register?.contact?.id ?? this.fichaAnterior?.contact?.id;

    if (!contactId) {
      console.warn('⚠️ No hay referente disponible para editar');
      return;
    }

    this.dialog
      .open(ContactEditDialogComponent, {
        width: '600px',
        disableClose: true,
        data: { contactId },
      })
      .afterClosed()
      .subscribe((updated: boolean) => {
        if (!updated) return;

        this.reloadReferente();
      });
  }

  private reloadPostulant(): void {
    const postulantId =
      this.register?.postulant?.id ?? this.fichaAnterior?.postulant?.id;

    if (!postulantId) return;

    this.postulantService.getById(postulantId).subscribe((p) => {
      const intPrevId = p.convPrev?.intPrev?.id ?? null;
      const convPrevId = p.convPrev?.id ?? null;

      // 🔑 1️⃣ RECARGAR OPCIONES DEL COMBO (SIN REGLAS)
      if (intPrevId) {
        this.filteredConvPrev = this.convPrev.filter(
          (c) => Number(c.intPrev?.id) === Number(intPrevId),
        );
      } else {
        this.filteredConvPrev = [];
      }

      // 🔑 2️⃣ MOSTRAR EXACTAMENTE LO QUE VIENE DE BD
      this.form.patchValue(
        {
          firstName: p.firstName ?? '',
          secondName: p.lastName ?? '',
          firstLastName: p.firstLastName ?? '',
          secondLastName: p.secondLastName ?? '',
          birthDate: p.birthdate ?? null,
          phone: p.phone ?? '',
          email: p.email ?? '',
          address: p.address ?? '',
          sex: p.sex?.id ?? null,
          commune: p.commune?.id ?? null,

          intPrev: intPrevId,
          convPrev: convPrevId,
        },
        { emitEvent: false },
      );
    });
  }

  private reloadReferente(): void {
    const contactId =
      this.register?.contact?.id ?? this.fichaAnterior?.contact?.id;

    if (!contactId) return;

    this.contactService.getById(contactId).subscribe((c) => {
      this.form.patchValue(
        {
          name: c.name ?? '',
          cellphone: c.cellphone ?? '',
          emailPostulant: c.email ?? '',
          contactDescription: c.description ?? '',
        },
        { emitEvent: false },
      );

      this.cdRef.detectChanges();
    });
  }

  private async recargarReferente(): Promise<void> {
    if (!this.register?.contact?.id) return;

    const contact = await firstValueFrom(
      this.contactService.getById(this.register.contact.id),
    );

    this.form.patchValue({
      name: contact.name,
      cellphone: contact.cellphone,
      emailPostulant: contact.email,
      contactDescription: contact.description,
    });

    this.cdRef.detectChanges();
  }

  onFechaSolicitudChange(fecha: string): void {
    if (!fecha) {
      this.diasTranscurridos = null;
      return;
    }

    const fechaSolicitud = new Date(fecha);
    const hoy = new Date();

    // Normalizar horas para evitar errores
    fechaSolicitud.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    const diffMs = hoy.getTime() - fechaSolicitud.getTime();
    this.diasTranscurridos = Math.max(
      0,
      Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    );
  }
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------

  private getInvalidFields(): string[] {
    const invalid: string[] = [];

    if (this.form.get('rut')?.invalid) {
      return ['RUT válido'];
    }
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        invalid.push(this.fieldLabels[key] ?? key);
      }
    });

    return invalid;
  }

  private fieldLabels: Record<string, string> = {
    rut: 'RUT válido',
    firstName: 'Nombre',
    firstLastName: 'Apellido paterno',
    commune: 'Comuna',
    sex: 'Sexo',
    intPrev: 'Tipo de previsión',
    convPrev: 'Previsión',
    substance: 'Sustancia principal',
    contactTypes: 'Tipo de contacto',
    senders: 'Origen de la demanda',
    diverters: 'Derivador',
    state: 'Estado',
    result: 'Resultado',
    notRelevants: 'Motivo no relevante',
  };

  private marcarErrores(): void {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });

    this.cdRef.detectChanges();
  }

  private getNotRelevanteNinguna(): number | null {
    return (
      this.notRelevants.find((n: any) => this.normalize(n.name) === 'NINGUNA')
        ?.id ?? null
    );
  }

  private getResultadoSinResultado(): number | null {
    return (
      this.results.find(
        (r: any) => this.normalize(r.name) === 'AUN SIN RESULTADO',
      )?.id ?? null
    );
  }

  private getEstadoEnTramite(): number | null {
    return (
      this.states.find((s: any) => this.normalize(s.name) === 'EN TRAMITE')
        ?.id ?? null
    );
  }

  private aplicarValoresPorDefectoNuevaDemanda(): void {
    const notRelevante = this.getNotRelevanteNinguna();
    const sinResultado = this.getResultadoSinResultado();
    const enTramite = this.getEstadoEnTramite();

    console.log('Defaults:', {
      notRelevante,
      sinResultado,
      enTramite,
    });

    this.form.patchValue(
      {
        notRelevants: notRelevante,
        result: sinResultado,
        state: enTramite,
      },
      { emitEvent: false },
    );
  }

  get citacionHeaderText(): string {
    return this.citacionCollapsed
      ? '➕ Agregar citación'
      : '📝 Agregando citación';
  }

  private moverFocoSeguro(): void {
    const rutInput = document.querySelector(
      'input[formcontrolname="rut"]',
    ) as HTMLInputElement;

    rutInput?.focus();
  }

  /*
  get actionLabel(): string {
    switch (this.currentAction) {
      case 'NEW':
        return '🟢 Nueva Demanda';

      case 'EDIT':
        return '🔵 Modificando Demanda';

      case 'CLONE_SAME_PROGRAM':
        return '🟠 Nueva Demanda (mismo programa)';

      case 'CLONE_OTHER_PROGRAM':
        return '🟣 Nueva Demanda (otro programa)';

      default:
        return 'Gestión de Demanda';
    }
  }*/

  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------------------------------------------------------------------

  // ----------------------------------------------------------------------------------------------------------
  //  desde aqui hacia abajo manejo del comportamiento  del formulario
  // ----------------------------------------------------------------------------------------------------------

  //🔍 FLUJO RUT (INICIO REAL)
  private procesarFichas(registros: any[]): void {
    if (!Array.isArray(registros)) {
      console.error(
        '❌ procesarFichas recibió algo que NO es array',
        registros,
      );
      return;
    }
    const programList = JSON.parse(sessionStorage.getItem('programs') || '[]');
    const activeProgramName = this.tokenService.getActiveProgram();

    const activeProgram = programList.find(
      (p: any) => p.name === activeProgramName,
    );

    if (!activeProgram) {
      console.error('❌ Programa activo no encontrado');
      return;
    }

    this.fichasMismoPrograma = registros.filter(
      (r) => r.program?.id === activeProgram.id,
    );

    this.fichasOtrosProgramas = registros.filter(
      (r) => r.program?.id !== activeProgram.id,
    );

    this.mostrarPanelFichas = true;
    this.panelCerradoManualmente = false;

    this.cdRef.detectChanges();
  }

  private evaluarRutParaBusqueda(rutRaw: string | null): void {
    if (!rutRaw) return;

    const rut = rutRaw.toUpperCase().trim();
    const control = this.form.get('rut');

    const fullFormat = /^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/;
    if (!fullFormat.test(rut)) {
      console.log('⛔ Formato incompleto');
      return;
    }

    if (control?.hasError('rutInvalido')) {
      console.log('⛔ RUT inválido');
      return;
    }
    this.searchByRut();
  }

  //-------------------------------------------------------------------------------------------------------
  // Buscar por Rut
  //-------------------------------------------------------------------------------------------------------

  async searchByRut(): Promise<void> {
    if (this.isSearchingRut) return;

    const rut = this.form.get('rut')?.value;
    if (!rut) return;

    if (rut === this.ultimoRutBuscado) return;

    this.isSearchingRut = true;

    try {
      const registros = await firstValueFrom(
        this.registerService.getAllByRut(rut),
      );
      // 🔎 Registrar búsqueda
      this.ultimoRutBuscado = rut;
      // 👉 Clasificación pura
      this.procesarFichas(registros);
    } catch (e) {
      console.error('❌ Error buscando por RUT', e);
    } finally {
      this.isSearchingRut = false;
    }
  }

  //-------------------------------------------------------------------------------------------------------
  //🚦 ACCIONES DE USUARIO
  //-------------------------------------------------------------------------------------------------------

  async usarDatos(f: any): Promise<void> {
    this.ultimoRutBuscado = this.form.get('rut')?.value;
    this.cargandoPrevision = true;

    this.register = null;
    this.fichaAnterior = f;

    // 🔑 TRAER POSTULANTE COMPLETO
    const postulant = await firstValueFrom(
      this.postulantService.getById(f.postulant.id),
    );
    // 🔑 PREVISIÓN DESDE REGISTER
    const intPrevId = postulant.convPrev?.intPrev?.id ?? null;
    const convPrevId = postulant.convPrev?.id ?? null;
    // 🧩 PATCH GENERAL (SIN convPrev)
    this.form.patchValue(
      {
        rut: postulant.rut,
        firstName: postulant.firstName ?? '',
        secondName: postulant.lastName ?? '',
        firstLastName: postulant.firstLastName ?? '',
        secondLastName: postulant.secondLastName ?? '',
        birthDate: postulant.birthdate
          ? new Date(postulant.birthdate + 'T00:00:00')
          : null,
        phone: postulant.phone ?? '',
        email: postulant.email ?? '',
        address: postulant.address ?? '',
        commune: postulant.commune?.id ?? null,
        sex: postulant.sex?.id ?? null,

        // 👈 SOLO tipo previsión
        intPrev: intPrevId,

        // ✅ referente
        name: f.contact?.name ?? '',
        cellphone: f.contact?.cellphone ?? '',
        emailPostulant: f.contact?.email ?? '',
        contactDescription: f.contact?.description ?? '',

        contactTypes: f.contactType?.id ?? null,
        registerDescription: '',
      },
      { emitEvent: false },
    );

    setTimeout(() => {
      const rawBirth = this.form.get('birthDate')?.value;
      this.edad = this.utils.getEdadDesdeFecha(rawBirth);
      console.log('🧪 EDAD calculada (post patch):', this.edad);
    });

    // 1️⃣ Mostrar tipo previsión (visual)
    this.form.get('intPrev')?.setValue(intPrevId, { emitEvent: false });
    // 2️⃣ Mostrar SOLO la opción correcta (sin reglas)
    this.filteredConvPrev = this.convPrev.filter(
      (p: any) => Number(p.intPrev?.id) === Number(intPrevId),
    );
    // 3️⃣ Mostrar previsión real
    this.form.get('convPrev')?.setValue(convPrevId, { emitEvent: false });
    // 4️⃣ Asegurar estado BLOQUEADO (porque no es NEW)
    this.form.get('convPrev')?.disable({ emitEvent: false });
    this.form.get('intPrev')?.disable({ emitEvent: false });

    this.cargandoPrevision = false;
    this.toggleBodyScroll(false);
    this.cdRef.detectChanges();
  }

  //-------------------------------------------------------------------------------------------------------
  //🛠 HELPERS DE MODO / RESET
  //-------------------------------------------------------------------------------------------------------

  private bloquearCamposPostulante(): void {
    const camposPostulante = [
      'rut',
      'birthDate',
      'firstName',
      'secondName',
      'firstLastName',
      'secondLastName',
      'phone',
      'email',
      'address',
      'commune',
      'sex',
      'intPrev',
      'convPrev',
    ];

    camposPostulante.forEach((campo) => {
      const control = this.form.get(campo);
      if (control && control.enabled) {
        control.disable({ emitEvent: false });
      }
    });

    this.cdRef.detectChanges();
  }

  private habilitarCamposPostulante(): void {
    const camposPostulante = [
      'rut',
      'birthDate',
      'firstName',
      'secondName',
      'firstLastName',
      'secondLastName',
      'phone',
      'email',
      'address',
      'commune',
      'sex',
      'intPrev',
      'convPrev',
    ];

    camposPostulante.forEach((campo) => {
      const control = this.form.get(campo);
      if (control && control.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }

  private habilitarEstadoDemanda(): void {
    this.form.get('notRelevants')?.enable({ emitEvent: false });
    this.form.get('result')?.enable({ emitEvent: false });
    this.form.get('state')?.enable({ emitEvent: false });
  }

  //-------------------------------------------------------------------------------------------------------
  //🧮 ESTADO DE GUARDADO
  //-------------------------------------------------------------------------------------------------------

  isSaveDisabled(): boolean {
    if (this.saving) return true;

    switch (this.currentAction) {
      case 'EDIT':
        // En editar solo habilita si hay cambios
        return this.form.pristine;

      case 'NEW':
      case 'CLONE_SAME_PROGRAM':
      case 'CLONE_OTHER_PROGRAM':
        // En nueva o clonar, validar formulario
        return this.form.invalid;

      default:
        return true;
    }
  }

  private bloquearCamposReferente(): void {
    this.form.get('name')?.disable({ emitEvent: false });
    this.form.get('cellphone')?.disable({ emitEvent: false });
    this.form.get('emailPostulant')?.disable({ emitEvent: false });
    this.form.get('contactDescription')?.disable({ emitEvent: false });
    //this.form.get('contactTypes')?.disable({ emitEvent: false });
  }

  private habilitarCamposReferente(): void {
    this.form.get('name')?.enable({ emitEvent: false });
    this.form.get('cellphone')?.enable({ emitEvent: false });
    this.form.get('emailPostulant')?.enable({ emitEvent: false });
    this.form.get('contactDescription')?.enable({ emitEvent: false });
    //this.form.get('contactTypes')?.enable({ emitEvent: false });
  }

  private habilitarBotonesEdicion(): void {
    this.canClearForm = true;
    this.canEditPostulant = true;
  }

  private ocultarBotonesEdicion(): void {
    this.canClearForm = false;
    this.canEditPostulant = false;
  }

  //-------------------------------------------------------------------------------------------------------
  get isNew(): boolean {
    return this.currentAction === 'NEW';
  }

  //-------------------------------------------------------------------------------------------------------
  cerrarPanelFichas(): void {
    this.panelCerradoManualmente = true;
    // 🔥 CLAVE: permitir volver a buscar el mismo RUT
    this.ultimoRutBuscado = null;
    this.toggleBodyScroll(false);
    // 👉 cerrar NO decide lógica clínica
    this.mostrarPanelFichas = false;
  }

  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  // CENTRAL DE LA TOMA DECISIONES SEGUN SELECCION DE LAS FICHAS
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------

  seleccionarUsoDeFicha(f: any, accion: 'EDITAR' | 'USAR_DATOS'): void {
    // ==================================================
    // 🧹 0️⃣ RESET TOTAL — FORMULARIO COMO RECIÉN CARGADO
    // ==================================================

    // 🔹 Estado lógico
    this.register = null;
    this.fichaAnterior = null;
    this.cargandoPrevision = false;

    // 🔹 Estado UI
    this.mostrarPanelFichas = false;
    this.toggleBodyScroll(false);

    // 🔹 Flags UX
    this.panelCerradoManualmente = false;

    // 🔹 Secciones dinámicas
    this.movements = [];
    this.citacionCollapsed = true;

    // 🔹 Estado de campos — TODO habilitado
    this.habilitarCamposPostulante();
    this.habilitarCamposReferente();
    this.habilitarEstadoDemanda();

    // 🔹 Reset duro del formulario
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();

    // 🔹 Flags UI base
    this.canClearForm = false;
    this.canEditPostulant = false;

    this.ocultarBotonesEdicion();
    // ==================================================
    // 🧭 1️⃣ CONTEXTO DE PROGRAMA ACTIVO
    // ==================================================

    const activeProgramId = this.getActiveProgramId();

    // ==================================================
    // 🔵 CASO 1: FICHA DEL MISMO PROGRAMA
    // ==================================================
    if (f.program?.id === activeProgramId) {
      // ----------------------------------------------
      // 🔵 A. EDITAR DEMANDA EXISTENTE
      // ----------------------------------------------
      if (accion === 'EDITAR') {
        this.currentAction = 'EDIT';
        this.actionLabel = '🔵 Modificando Demanda';
        // 🔥 AQUÍ ESTABA EL PROBLEMA
        this.loadDemandCompleta(f.id);

        queueMicrotask(() => {
          // 🎛️ UI
          this.canClearForm = true;
          this.canEditPostulant = true;
          this.habilitarBotonesEdicion();
          // 🔒 Bloqueos
          this.bloquearCamposPostulante();
          this.bloquearCamposReferente();

          this.cdRef.detectChanges();
        });
        return;
      }

      // ----------------------------------------------
      // 🟠 B. USAR DATOS (MISMO PROGRAMA)
      // ----------------------------------------------
      else {
        this.currentAction = 'CLONE_SAME_PROGRAM';
        this.actionLabel = '🟠 Nueva Demanda (usando datos del mismo programa)';
        this.usarDatos(f);
      }
    }

    // ==================================================
    // 🟣 CASO 2: FICHA DE OTRO PROGRAMA
    // ==================================================
    else {
      this.currentAction = 'CLONE_OTHER_PROGRAM';
      this.actionLabel = '🟠 Nueva Demanda (usando datos de otro programa)';
      this.usarDatos(f);
    }

    // ==================================================
    // 📦 2️⃣ CARGA DE DATOS (NEUTRA, SIN DECISIÓN)
    // ==================================================
    queueMicrotask(() => {
      // 🎛️ UI
      this.canClearForm = true;
      this.canEditPostulant = true;
      this.habilitarBotonesEdicion();
      // 🔒 Bloqueos
      this.bloquearCamposPostulante();
      this.bloquearCamposReferente();

      this.cdRef.detectChanges();
    });
  }

  // ==================================================
  // Nueva demanda de cero
  // ==================================================

  nuevaDemanda(): void {
    // 🧹 Estado base
    this.resetFormularioBase();

    this.currentAction = 'NEW';
    this.actionLabel = '🟢 Nueva Demanda';

    // 🧠 Defaults clínicos
    this.aplicarValoresPorDefectoNuevaDemanda();

    // 🎛️ UI
    this.canClearForm = false;
    this.canEditPostulant = false;

    this.cdRef.detectChanges();
  }

  // ==================================================
  // 🧹 RESET TOTAL — FORMULARIO COMO RECIÉN CARGADO
  // ==================================================

  private resetFormularioBase(): void {
    // 🔹 Estado lógico
    this.register = null;
    this.fichaAnterior = null;
    this.cargandoPrevision = false;

    // 🔹 Estado UI
    this.mostrarPanelFichas = false;
    this.toggleBodyScroll(false);

    // 🔹 Flags UX
    this.panelCerradoManualmente = false;

    // 🔹 Secciones dinámicas
    this.movements = [];
    this.citacionCollapsed = true;

    // 🔹 Estado de campos — TODO habilitado
    this.habilitarCamposPostulante();
    this.habilitarCamposReferente();
    this.habilitarEstadoDemanda();

    // 🔹 Reset duro del formulario
    this.form.reset({
      birthDate: null, 
      substance: null,
      secondarySubstances: [], // 👈 CLAVE ABSOLUTA
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}

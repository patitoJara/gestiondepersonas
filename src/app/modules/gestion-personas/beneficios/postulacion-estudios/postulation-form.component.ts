import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { ViewChild, ElementRef } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import html2pdf from 'html2pdf.js';
import { FormArray, FormControl } from '@angular/forms';

import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

import { TypePropertyService } from '@app/core/services/type-property.service';
import { TypeProperty } from '@app/core/models/type-property.model';
import { TypeHousingService } from '@app/core/services/type-housing.service';
import { TypeHousing } from '@app/core/models/type-housing.model';
import { StudyService } from '@app/core/services/study.service';
import { Study } from '@app/core/models/study.model';
import { StablishmentService } from '@app/core/services/stablishment.service';
import { Stablishment } from '@app/core/models/stablishment.model';
import { PrevitionService } from '@app/core/services/prevition.service';
import { Prevition } from '@app/core/models/prevition.model';
import { ParentTypeService } from '@app/core/services/parent-type.service';
import { ParentType } from '@app/core/models/parent-type.model';
import { ContractTypeService } from '@app/core/services/contract-type.service';
import { ContractType } from '@app/core/models/contract-type.model';
import { CivilStateService } from '@app/core/services/civil-state.service';
import { CivilState } from '@app/core/models/civil-state.model';
import { BillTypeService } from '@app/core/services/bill-type.service';
import { BillType } from '@app/core/models/bill-type.model';
import { ActivityService } from '@app/core/services/activity.service';
import { Activity } from '@app/core/models/activity.model';
import { WorkPlaceService } from '@app/core/services/work-place.service';
import { WorkPlace } from '@app/core/models/work-place.model';
import { GradeService } from '@app/core/services/grade.service';
import { Grade } from '@app/core/models/grade.model';

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
  edad: number | null;
  nombre: string;

  parentTypeId?: number;
  civilStateId?: number;
  activityId?: number;
  workPlaceId?: number;
  studyId?: number;
  previtionId?: number;
  contractTypeId?: number;

  estudiaRegion?: string; // 🔥 ESTE FALTABA

  open?: boolean;
}

interface Salud {
  id: number;
  nombre: string;

  parentTypeId?: number | null; // 🔥 CAMBIO CLAVE

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

  tipoVivienda: any = null;
  tipoPropiedad: any = null;
  infoVivienda: string = '';
  otrosAntecedentes: string = '';

  activeIndex: number | null = null;
  salud: Salud[] = [];

  today = new Date();

  codigoPostulacion = 'POST-' + Date.now();
  comentario: string = '';

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

  tipoPostulante = 'afiliado';

  postulanteSeleccionado: any = null;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private typePropertyService: TypePropertyService,
    private typeHousingService: TypeHousingService,
    private studyService: StudyService,
    private stablishmentService: StablishmentService,
    private previtionService: PrevitionService,
    private parentTypeService: ParentTypeService,
    private contractTypeService: ContractTypeService,
    private civilStateService: CivilStateService,
    private billTypeService: BillTypeService,
    private activityService: ActivityService,
    private workPlaceService: WorkPlaceService,
    private gradeService: GradeService,
  ) {
    this.form = this.fb.group({
      nombre: [''], // antes: ['', Validators.required]
      apellido: [''],
      rut: [''],
      telefono: [''],
      email: [''], // antes: ['', [Validators.required, Validators.email]]
      planta: [''],
      grado: [null],
      establecimiento: [''],

      esPostulante: ['si'],
      beneficiado: ['no'],

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

      tipoVivienda: [''],
      tipoPropiedad: [''],

      typePropertyId: [null],
      typeHousingId: [null],
      stablishmentId: [null],
      /*
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      rut: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      planta: ['', Validators.required],
      grado: [null, Validators.required],
      establecimiento: ['', Validators.required],
      esPostulante: ['si', Validators.required],
      beneficiado: ['no', Validators.required],

      // 🔥 PASO 3
      ingresoJefe: [null, Validators.required],
      ingresoOtros: [0],
      otrosIngresos: [0],

      // 🔥 PASO 4
      arriendo: [0],
      luz: [0],
      agua: [0],
      gas: [0],
      telefonoGasto: [0],
      creditos: [0],
      matricula: [0],
      mensualidad: [0],
      alojamiento: [0],
      otrosGastos: [''],

      // 🔥 PASO 5
      tipoVivienda: ['', Validators.required],
      tipoPropiedad: ['', Validators.required],
      infoVivienda: [''],
      otrosAntecedentes: [''],

      // 🔥 AQUÍ VA
      typePropertyId: [null, Validators.required],
      typeHousingId: [null, Validators.required],
      stablishmentId: [null, Validators.required],
      */
    });
  }

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

  ngOnInit() {
    this.cargarTiposPropiedad();
    this.cargarTiposVivienda();
    this.cargarStudies();
    this.cargarStablishments();
    this.cargarPrevitions();
    this.cargarParentTypes();
    this.cargarContractTypes();
    this.cargarCivilStates();
    this.cargarBillTypes();
    this.cargarActivities();
    this.cargarWorkPlaces();
    this.cargarGrades();

    if (this.grupoFamiliar.length === 0) {
      this.agregarFamiliar();
    }

    this.loadData();

    // 🔥 ASEGURAR AL MENOS 1 REGISTRO
    if (this.saludArray.length === 0) {
      this.agregarSalud();
    }

    // 🔥 DETECTAR SI HAY DATOS
    const hayDatos = this.salud.some(
      (s) => s.nombre || s.parentTypeId || s.patologia || s.gasto,
    );

    // 🔥 ABRIR SEGÚN CONTEXTO
    this.salud.forEach((s, index) => {
      const tieneDatos = s.nombre || s.parentTypeId || s.patologia || s.gasto;

      // 👉 si hay datos → abrir solo los que tienen info
      if (hayDatos) {
        s.open = !!tieneDatos;
      }
      // 👉 si NO hay datos → abrir el primero
      else {
        s.open = index === 0;
      }
    });

    // 🔥 GUARDADO AUTOMÁTICO
    this.form.valueChanges.subscribe((value) => {
      localStorage.setItem('postulacion_form', JSON.stringify(value));
    });
  }

  /* ---------------------------------------------------------------------------------------------------
                        FIN ngOnInit() {
  ------------------------------------------------------------------------------------------------------*/

  ngAfterViewInit() {
    setInterval(() => {
      this.guardarTodo();
    }, 5000); // cada 5 seg
  }

  cargarWorkPlaces() {
    this.workPlaceService.getAll().subscribe({
      next: (data) => (this.workPlaces = data),
      error: () => console.error('Error cargando lugares de trabajo'),
    });
  }

  cargarActivities() {
    this.activityService.getAll().subscribe({
      next: (data) => (this.activities = data),
      error: () => console.error('Error cargando actividades'),
    });
  }

  cargarGrades() {
    this.gradeService.getAll().subscribe({
      next: (data) => {
        if (!data || !data.length) {
          this.grades = Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `Grado ${i + 1}`,
          }));
        } else {
          this.grades = data;
        }
      },
      error: () => console.error('Error cargando grados'),
    });
  }

  cargarBillTypes() {
    this.billTypeService.getAll().subscribe({
      next: (data) => (this.billTypes = data),
      error: () => console.error('Error cargando tipos de gasto'),
    });
  }

  cargarCivilStates() {
    this.civilStateService.getAll().subscribe({
      next: (data) => (this.civilStates = data),
      error: () => console.error('Error cargando estados civiles'),
    });
  }

  cargarContractTypes() {
    this.contractTypeService.getAll().subscribe({
      next: (data) => (this.contractTypes = data),
      error: () => console.error('Error cargando tipos de ingreso'),
    });
  }

  cargarParentTypes() {
    this.parentTypeService.getAll().subscribe({
      next: (data) => (this.parentTypes = data),
      error: () => console.error('Error cargando parentescos'),
    });
  }

  cargarPrevitions() {
    this.previtionService.getAll().subscribe({
      next: (data) => (this.previtions = data),
      error: () => console.error('Error cargando previsiones'),
    });
  }

  cargarStablishments() {
    this.stablishmentService.getAll().subscribe({
      next: (data) => (this.stablishments = data),
      error: () => console.error('Error cargando establecimientos'),
    });
  }

  cargarStudies() {
    this.studyService.getAll().subscribe({
      next: (data) => (this.studies = data),
      error: () => console.error('Error cargando estudios'),
    });
  }

  cargarTiposVivienda() {
    this.typeHousingService.getAll().subscribe({
      next: (data) => (this.typesHousing = data),
      error: () => console.error('Error cargando tipos de vivienda'),
    });
  }

  cargarTiposPropiedad() {
    this.typePropertyService.getAll().subscribe({
      next: (data) => {
        this.typesProperties = data;
      },
      error: () => {
        console.error('Error cargando tipos de propiedad');
      },
    });
  }

  toggleFamiliar(index: number) {
    const f = this.grupoFamiliar[index];
    f.open = !f.open;
  }

  eliminarFamiliar(index: number) {
    this.grupoFamiliar.splice(index, 1);

    // 🔥 abrir el último automáticamente
    if (this.grupoFamiliar.length) {
      this.grupoFamiliar[this.grupoFamiliar.length - 1].open = true;
    }
  }

  nextStep() {
    if (this.currentStep === 1 && this.form.invalid) {
      this.form.markAllAsTouched();
      this.showWarning('Debe completar datos personales');
      return;
    }

    if (this.currentStep === 2 && this.grupoFamiliar.length === 0) {
      this.showWarning('Debe agregar al menos un familiar');
      return;
    }

    if (this.currentStep === 6 && this.ingresosFamiliares.length === 0) {
      this.showWarning('Debe ingresar ingresos');
      return;
    }

    this.currentStep++;
  }

  markStepTouched() {
    const map: any = {
      1: [
        'nombre',
        'apellido',
        'rut',
        'telefono',
        'email',
        'planta',
        'grado',
        'establecimiento',
        'esPostulante',
        'beneficiado',
      ],
      3: ['ingresoJefe'],
      5: ['tipoVivienda', 'tipoPropiedad'],
    };

    (map[this.currentStep] || []).forEach((c: string) => {
      this.form.get(c)?.markAsTouched();
    });
  }

  scrollToFirstError() {
    setTimeout(() => {
      const el = document.querySelector('.ng-invalid');
      if (el) {
        (el as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(stepId: number) {
    this.currentStep = stepId;
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
      parentTypeId: undefined,
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

  warnStep() {}

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return [
          'nombre',
          'apellido',
          'rut',
          'telefono',
          'email',
          'planta',
          'grado',
          'establecimiento',
          'esPostulante',
          'beneficiado',
        ].every((c) => this.form.get(c)?.valid);

      case 2:
        return (
          this.grupoFamiliar.length > 0 &&
          this.grupoFamiliar.every(
            (f) => f.rut && f.nombre && f.edad && f.parentTypeId,
          )
        );

      case 3:
        return this.form.get('ingresoJefe')?.valid ?? false;

      case 4:
        return true; // no obligatorio

      case 5:
        return ['tipoVivienda', 'tipoPropiedad'].every(
          (c) => this.form.get(c)?.valid,
        );

      case 6:
        return this.documentosObligatorios.every(
          (doc) => this.filesObligatorios[doc.key]?.length,
        );

      case 7:
        return true;

      default:
        return true;
    }
  }

  irAlPaso(step: number) {
    this.warnStep();

    this.currentStep = step;

    if (this.currentStep === 6) {
      this.cerrarTodosDocumentos();
    }
  }

  // ============================
  // 💾 GUARDAR FINAL
  // ============================

  guardarFinal() {
    const errores: string[] = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      const camposInvalidos = this.getCamposInvalidos();

      this.showWarning(
        `Debe corregir los siguientes campos:\n\n• ${camposInvalidos.join('\n• ')}`,
      );

      return;
    }

    // 🔴 FORM
    if (this.form.invalid) {
      errores.push('Datos personales incompletos');
    }

    // 🔴 DOCUMENTOS
    const faltantes = this.documentosObligatorios
      .filter((doc) => !this.filesObligatorios[doc.key]?.length)
      .map((doc) => doc.label);

    if (faltantes.length) {
      errores.push(...faltantes);
    }

    // 🔥 BLOQUEO REAL
    if (errores.length) {
      this.showWarning(`Debe completar:\n\n• ${errores.join('\n• ')}`);
      return;
    }

    // 🧠 🔥 AQUÍ ESTÁ LA MAGIA
    /*
    const payload = {
      ...this.form.value,
      comentario: this.comentario,
    };
    */

    const payload = this.construirPayload();

    console.log('📦 PAYLOAD FINAL:', payload);

    // 🚀 FUTURO (cuando conectes backend)
    // this.postulationService.create(payload).subscribe({
    //   next: () => {
    //     this.showSuccess('Postulación enviada correctamente');
    //     this.currentStep = 8;
    //   },
    //   error: () => {
    //     this.showWarning('Error al enviar la postulación');
    //   }
    // });

    // ✅ POR AHORA
    this.showSuccess('Postulación enviada correctamente');
    this.currentStep = 8;
  }

  construirPayload() {
    const f = this.form.value;

    return {
      datosPersonales: {
        nombre: f.nombre,
        apellido: f.apellido,
        rut: f.rut,
        telefono: f.telefono,
        email: f.email,
        planta: f.planta,
        grado: f.grado,
        stablishmentId: f.stablishmentId,
      },

      vivienda: {
        typeHousingId: f.typeHousingId,
        typePropertyId: f.typePropertyId,
        infoVivienda: f.infoVivienda,
        otrosAntecedentes: f.otrosAntecedentes,
      },

      ingresos: {
        ingresoJefe: f.ingresoJefe,
        ingresoOtros: f.ingresoOtros,
        otrosIngresos: f.otrosIngresos,
      },

      gastos: {
        arriendo: f.arriendo,
        luz: f.luz,
        agua: f.agua,
        gas: f.gas,
        telefono: f.telefonoGasto,
        creditos: f.creditos,
        matricula: f.matricula,
        mensualidad: f.mensualidad,
        alojamiento: f.alojamiento,
      },

      salud: this.saludArray.value.map((s: any) => ({
        nombre: s.nombre,
        parentTypeId: s.parentTypeId,
        patologia: s.patologia,
        gasto: s.gasto,
      })),

      grupoFamiliar: this.grupoFamiliar.map((f) => ({
        rut: f.rut,
        nombre: f.nombre,
        edad: f.edad,
        parentTypeId: f.parentTypeId,
        civilStateId: f.civilStateId,
        activityId: f.activityId,
        workPlaceId: f.workPlaceId, // 🔥 AQUÍ
        previtionId: f.previtionId,
        contractTypeId: f.contractTypeId,
        studyId: f.studyId,
      })),
    };
  }

  validateAll(): boolean {
    const errores: string[] = [];

    if (this.form.invalid) {
      errores.push('Completar datos personales');
    }

    const faltantes = this.documentosObligatorios
      .filter((doc) => !this.filesObligatorios[doc.key]?.length)
      .map((doc) => doc.label);

    if (faltantes.length) {
      errores.push(...faltantes);
    }

    if (errores.length) {
      this.showWarning(
        `Debe completar o adjuntar:\n\n• ${errores.join('\n• ')}`,
      );
      return false;
    }

    return true;
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

  // ============================
  // 📤 ENVIAR
  // ============================
  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showWarning('Formulario incompleto');
      return;
    }
    /*
    if (!this.selectedFile) {
      this.showWarning('Debe adjuntar un archivo');
      return;
    }*/

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

  tieneArchivoObligatorio(key: string): boolean {
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

  cerrarTodosDocumentos() {
    this.documentosObligatorios.forEach((d) => (d.open = false));
    this.documentosOpcionales.forEach((d) => (d.open = false));
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

  validarRutValue(rut: string): boolean {
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

  async validarRutGeneral(f?: Familiar): Promise<void> {
    let rut = '';

    if (f) {
      rut = f.rut;
    } else {
      rut = this.form.get('rut')?.value;
    }

    if (!rut || rut.length < 7) return;

    if (!this.validarRutValue(rut)) {
      this.showWarning('RUT inválido');
      return;
    }

    const existe = await this.existeRutLocal(rut);

    if (existe) {
      this.showWarning('RUT ya registrado');
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

  guardarTodo() {
    const data = {
      form: this.form.value,
      grupoFamiliar: this.grupoFamiliar,
      salud: this.salud,
    };

    localStorage.setItem('postulacion_full', JSON.stringify(data));
  }

  loadData() {
    const data = localStorage.getItem('postulacion_full');

    if (!data) return;

    const parsed = JSON.parse(data);

    if (parsed.form) {
      this.form.patchValue(parsed.form);
    }

    if (parsed.grupoFamiliar) {
      this.grupoFamiliar = parsed.grupoFamiliar;
    }

    if (parsed.salud) {
      this.salud = parsed.salud;
    }
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return [
        'nombre',
        'apellido',
        'rut',
        'telefono',
        'email',
        'planta',
        'grado',
        'establecimiento',
        'esPostulante',
        'beneficiado',
      ].every((c) => this.form.get(c)?.valid);
    }

    if (this.currentStep === 3) {
      return this.form.get('ingresoJefe')?.valid ?? false;
    }

    if (this.currentStep === 5) {
      // 🔥 VALIDAR FORM
      const formValido = ['tipoVivienda', 'tipoPropiedad'].every(
        (c) => this.form.get(c)?.valid,
      );

      // 🔥 VALIDAR SALUD
      const saludValida = this.salud.every(
        (s) => s.nombre && s.parentTypeId && s.patologia,
      );

      if (!saludValida) {
        this.showWarning('Debe completar todos los registros de salud');

        // 🔥 UX PRO → abrir los incompletos
        this.salud.forEach((s) => {
          const incompleto = !s.nombre || !s.parentTypeId || !s.patologia;
          s.open = incompleto;
        });
      }

      return formValido && saludValida;
    }

    return true;
  }

  isStep1Valid(): boolean {
    return [
      'nombre',
      'apellido',
      'rut',
      'telefono',
      'email',
      'planta',
      'grado',
      'establecimiento',
      'esPostulante',
      'beneficiado',
    ].every((c) => this.form.get(c)?.valid);
  }

  isStep3Valid(): boolean {
    return this.form.get('ingresoJefe')?.valid ?? false;
  }

  isStep5Valid(): boolean {
    return ['tipoVivienda', 'tipoPropiedad'].every(
      (c) => this.form.get(c)?.valid,
    );
  }

  formatearMonto(event: any, controlName: string) {
    let value = event.target.value;

    // limpiar todo excepto números
    value = value.replace(/\D/g, '');

    if (!value) {
      this.form.get(controlName)?.setValue(null);
      event.target.value = '';
      return;
    }

    const numero = Number(value);

    // guardar número limpio
    this.form.get(controlName)?.setValue(numero, { emitEvent: false });

    // mostrar formateado
    event.target.value = numero.toLocaleString('es-CL');
  }

  // 🔹 AGREGAR
  agregarGasto() {
    this.otrosGastos.push({
      glosa: '',
      monto: 0,
      open: true,
    });
  }

  // 🔹 ELIMINAR
  eliminarGasto(index: number) {
    this.otrosGastos.splice(index, 1);
  }

  // 🔹 TOGGLE
  toggleGasto(index: number) {
    this.otrosGastos[index].open = !this.otrosGastos[index].open;
  }

  // 🔹 TOTAL
  get totalOtrosGastos(): number {
    return this.otrosGastos.reduce((acc, g) => acc + (g.monto || 0), 0);
  }

  // 🔹 FORMATEO
  formatearMontoOtro(event: any, item: OtroGasto) {
    let valor = event.target.value.replace(/\D/g, '');
    item.monto = Number(valor);
  }

  getClaseMonto(valor: number) {
    if (!valor) return 'zero';
    return 'positive';
  }

  limpiarNumero(v: any): number {
    return Number(String(v).replace(/\./g, '')) || 0;
  }

  get totalSalud(): number {
    return this.salud.reduce((sum, s) => {
      return sum + this.limpiarNumero(s.gasto);
    }, 0);
  }

  formatearMontoSalud(event: any, s: any) {
    let value = event.target.value;

    // limpiar todo excepto números
    value = value.replace(/\D/g, '');

    if (!value) {
      s.gasto = 0;
      event.target.value = '';
      return;
    }

    const numero = Number(value);

    // guardar limpio
    s.gasto = numero;

    // mostrar formateado
    event.target.value = numero.toLocaleString('es-CL');
  }

  trackBySalud(index: number, item: any) {
    return item.id;
  }

  trackByFamiliar(index: number, item: Familiar): number {
    return item.id;
  }

  validarSalud(): boolean {
    if (!this.salud.length) return true;

    const incompletos = this.salud.some(
      (s) => !s.nombre || !s.parentTypeId || !s.patologia,
    );

    if (incompletos) {
      this.showWarning('Debe completar todos los registros de salud');
      return false;
    }

    return true;
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

    <div><strong>Total ingresos:</strong> $${(this.totalIngresos * 1000).toLocaleString('es-CL')}</div>
    <div><strong>Total gastos:</strong> $${(this.totalGastos * 1000).toLocaleString('es-CL')}</div>

    <div style="margin-top:20px; text-align:center; color:#2e7d32; font-weight:bold;">
      ✔ POSTULACIÓN RECIBIDA
    </div>

  </div>
  `;
  }

  nuevaPostulacion() {
    // 🔥 RESET FORM
    this.form.reset();

    // 🔥 VALORES POR DEFECTO
    this.form.patchValue({
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

    // 🔥 LIMPIAR ARRAYS
    this.grupoFamiliar = [];
    this.salud = [];

    // 🔥 REINICIAR CON 1 ITEM
    this.agregarFamiliar();
    this.agregarSalud();

    // 🔥 LIMPIAR ARCHIVOS
    this.filesObligatorios = {};
    this.filesOpcionales = {};

    // 🔥 LIMPIAR STORAGE
    localStorage.removeItem('postulacion_form');
    localStorage.removeItem('postulacion_full');

    // 🔥 VOLVER AL INICIO
    this.currentStep = 1;
  }

  getParentTypeName(id?: number): string {
    if (!id) return 'Sin parentesco';
    return this.parentTypes.find((p) => p.id === id)?.name || 'Sin parentesco';
  }

  agregarFamiliar() {
    this.grupoFamiliar.push({
      id: Date.now(),
      rut: '',
      nombre: '',
      edad: null,

      parentTypeId: undefined,
      civilStateId: undefined,

      activityId: undefined,
      workPlaceId: undefined,
      studyId: undefined,

      estudiaRegion: '',

      previtionId: undefined,
      contractTypeId: undefined,

      open: true,
    });
  }

  get saludArray(): FormArray {
    return this.form.get('salud') as FormArray;
  }

  crearSalud(): FormGroup {
    return this.fb.group({
      nombre: [''],
      parentTypeId: [null],
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
    let valor = event.target.value.replace(/\D/g, '');

    const numero = Number(valor) || 0;

    this.ingresosFamiliares[index].monto = numero;

    event.target.value = numero ? numero.toLocaleString('es-CL') : '';
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

  agregarIngreso() {
    this.ingresosFamiliares.push({
      familiarId: null,
      monto: 0,
      open: true,
    });
  }

  get totalIngresosFamiliares(): number {
    return this.ingresosFamiliares.reduce((acc, i) => acc + (i.monto || 0), 0);
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
}

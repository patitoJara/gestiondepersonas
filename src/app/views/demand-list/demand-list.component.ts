// ===================================================================
// DEMAND LIST COMPONENT — COMPLETO, ORDENADO Y COMPILABLE
// ===================================================================
import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule, registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';

// 🔹 Adaptador de fecha chileno
import {
  ChileDateAdapter,
  FORMATO_FECHA_CHILE,
} from '@app/core/chile-date-adapter';

// 🔹 Angular Material
import {
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
  MatNativeDateModule,
  DateAdapter,
} from '@angular/material/core';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// 🔹 RXJS
import { forkJoin, merge, finalize } from 'rxjs';
import { map } from 'rxjs/operators';

// 🔹 Servicios
import { CommuneService } from '../../services/comunes.service';
import { SexService } from '../../services/sex.service';
import { ContactTypeService } from '../../services/contact.type.service';
import { ProgramService } from '../../services/program.service';
import { SubstanceService } from '../../services/substance.service';
import { ResultService } from '../../services/result.service';
import { StateService } from '@app/services/state.service';
import { ConvPrevService } from '../../services/conv-prev.service';
import { IntPrevService } from '../../services/int-prev.service';
import { TokenService } from '../../services/token.service';
import { PostulantService } from '../../services/postulant.service';
import { ContactService } from '../../services/contact.service';
import { RegisterMovementService } from '../../services/register-movement.service';
import { RegisterSubstanceService } from '../../services/register-substance.service';
import { DiverterService } from '../../services/diverter.service';
import { SenderService } from '../../services/sender.service';
import { ProfessionService } from '../../services/profession.service';
import { NotRelevantService } from '../../services/not-relevant.service';
import { RegisterService } from '../../services/register.service';

import { DemandDetailViewService } from '@app/services/reports/demand-detail-view.service';
import { RegisterFullLoaderService } from '@app/services/register-full-loader.service';

registerLocaleData(localeEsCL);

// ===================================================================
// INTERFACE FILAS DE TABLA
// ===================================================================
interface Demandante {
  id: number;
  programa: string;
  usuario: string;
  dias: number;
  postulante: string;
  rut: string;
  comuna: string;
  fecha: Date;
  tipoContacto: string;
  estado: string;
  sustancia: string;
  //sexo: string;
}

// ===================================================================
// COMPONENTE
// ===================================================================
@Component({
  selector: 'app-demand-list',
  standalone: true,
  templateUrl: './demand-list.component.html',
  styleUrls: ['./demand-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSortModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_FECHA_CHILE },
    { provide: DateAdapter, useClass: ChileDateAdapter },
  ],
})
export class DemandListComponent implements OnInit, AfterViewInit {
  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private communeService: CommuneService,
    private sexService: SexService,
    private contactTypeService: ContactTypeService,
    private programService: ProgramService,
    private substanceService: SubstanceService,
    private stateService: StateService,
    private ResultService: ResultService,
    private convPrevService: ConvPrevService,
    private intPrevService: IntPrevService,
    private tokenService: TokenService,
    private postulantService: PostulantService,
    private contactService: ContactService,
    private registerMovementService: RegisterMovementService,
    private registerSubstanceService: RegisterSubstanceService,
    private senderService: SenderService,
    private diverterService: DiverterService,
    private notRelevantService: NotRelevantService,
    private professionService: ProfessionService,
    private demandDetailViewService: DemandDetailViewService,
    private registerFullLoader: RegisterFullLoaderService,
    private registerService: RegisterService
  ) {}

  // =============================================================
  // UTILITY: normaliza array pageable o normal
  // =============================================================
  private toArray(resp: any): any[] {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (resp?.content && Array.isArray(resp.content)) return resp.content;
    return [];
  }

  displayedColumns = [
    'id',
    'postulante',
    'rut',
    'programa',
    'comuna',
    'dias',
    'fecha',
    'estado',
    'sustancia',
    'tipoContacto',
    'acciones',
  ];

  dataSource = new MatTableDataSource<Demandante>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  formFiltros!: FormGroup;

  programsCatalog: any[] = [];
  sexesCatalog: any[] = [];
  communesCatalog: any[] = [];
  substancesCatalog: any[] = [];
  contactTypesCatalog: any[] = [];
  statesCatalog: any[] = [];

  programs: any[] = [];
  sexes: any[] = [];
  communes: any[] = [];
  substances: any[] = [];
  contactTypes: any[] = [];
  states: any[] = [];

  isLoading = false;

  // ===================================================================
  // INIT
  // ===================================================================

  ngOnInit(): void {
    this.cargarFormulario();
    this.loadCatalogs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    merge(this.sort.sortChange, this.paginator.page).subscribe(() =>
      this.cargarDatosTablaReal()
    );

    this.cargarDatosTablaReal();
  }

  // =============================================================
  cargarFormulario() {
    this.formFiltros = this.fb.group({
      programa: [null],
      //sexo: [null],
      comuna: [null],
      tcontacto: [null],
      sustancia: [null],
      estado: [null],
      fechaInicio: [null],
      fechaFin: [null],
      nombre: [''],
    });
  }

  // =============================================================
  //   🚀 CARGA DATOS CON SUSTANCIA PRINCIPAL
  // =============================================================
  cargarDatosTablaReal(): void {
    this.isLoading = true;

    const page = this.paginator?.pageIndex ?? 0;
    const size = this.paginator?.pageSize ?? 10;

    const active = this.sort?.active ?? 'id';
    const direction = (this.sort?.direction as '' | 'asc' | 'desc') || 'asc';
    const sort = `${active},${direction}`;

    this.registerService
      .getAllPaginated({ page, size, sort })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          const rows: any[] = Array.isArray(res) ? res : res?.content ?? [];

          console.log('👉 R AWS registers:', rows);
          console.log(
            'REGISTER IDS:',
            rows.map((r) => r.id)
          );
          console.log(
            'POSTULANTS:',
            rows.map((r) => r.postulant?.id ?? 'SIN_POSTULANTE')
          );

          // ================================
          //  llamadas paralelas por registro
          // ================================
          const requests = rows.map((reg) =>
            this.registerSubstanceService.searchByRegisterId(reg.id).pipe(
              map((resp: any) => {
                // Normalizar SIEMPRE a pageable
                const pageable:
                  | { content: any[] }
                  | { content: any[]; [key: string]: any } = Array.isArray(resp)
                  ? { content: resp }
                  : resp;

                const subs = pageable.content ?? [];

                const principal = subs.find(
                  (x: any) => x.level === 'Principal'
                );

                return {
                  reg,
                  principal: principal?.substance?.name ?? '---',
                };
              })
            )
          );

          forkJoin(requests).subscribe({
            next: (results: { reg: any; principal: string }[]) => {
              const tabla: Demandante[] = results.map((item) => {
                const r = item.reg;

                return {
                  id: r.id,                  
                  postulante: `${r.postulant?.firstName ?? ''} ${ r.postulant?.lastName ?? '' }`.trim(),                  
                  rut: r.postulant?.rut ?? '---',
                  programa: r.program?.name ?? '---',
                  comuna: r.postulant?.commune?.name ?? '---',
                  dias: r.date_attention? this.getDiasTranscurridos(r.date_attention): 0,
                  fecha: r.date_attention,
                  estado: r.state?.name ?? '---',
                  usuario: r.user?.username ?? '---',
                  sustancia: item.principal,
                  tipoContacto: r.contactType?.name ?? '---',
                  //sexo: r.postulant?.sex?.name ?? '---',                  
                };
              });

              this.dataSource.data = tabla;

              setTimeout(() => {
                this.actualizarFiltrosPorTabla();
                this.cdRef.detectChanges();
              });
            },
          });
        },

        error: (err) => console.error('❌ Error cargando tabla:', err),
      });
  }

  // =============================================================
  // CATÁLOGOS
  // =============================================================
  loadCatalogs(): void {
    this.isLoading = true;

    forkJoin({
      programs: this.programService.listAll(),
      //sexes: this.sexService.listAll(),
      communes: this.communeService.listAll(),
      contactTypes: this.contactTypeService.listAll(),
      substances: this.substanceService.listAll(),
      states: this.stateService.listAll(),
    }).subscribe({
      next: (data) => {
        this.programsCatalog = data.programs;
        //this.sexesCatalog = data.sexes;
        this.communesCatalog = data.communes;
        this.contactTypesCatalog = data.contactTypes;
        this.substancesCatalog = data.substances;
        this.statesCatalog = data.states;

        this.actualizarFiltrosPorTabla();
      },
      complete: () => (this.isLoading = false),
      error: (err) => console.error('❌ Error catálogos:', err),
    });
  }

  // =============================================================
  // FILTROS (FRONT)
  // =============================================================
  actualizarFiltrosPorTabla(): void {
    const data = this.dataSource.data;

    const norm = (txt: string) =>
      this.normalizar(this.formatearTexto(txt || ''));

    const unique = <T>(arr: T[]) => Array.from(new Set(arr));

    this.programs = this.programsCatalog.filter((p) =>
      unique(data.map((d) => norm(d.programa))).includes(norm(p.name))
    );

   /* this.sexes = this.sexesCatalog.filter((s) =>
      unique(data.map((d) => norm(d.sexo))).includes(norm(s.name))
    );*/

    this.communes = this.communesCatalog.filter((c) =>
      unique(data.map((d) => norm(d.comuna))).includes(norm(c.name))
    );

    this.contactTypes = this.contactTypesCatalog.filter((t) =>
      unique(data.map((d) => norm(d.tipoContacto))).includes(norm(t.name))
    );

    this.states = this.statesCatalog.filter((st) =>
      unique(data.map((d) => norm(d.estado))).includes(norm(st.name))
    );

    this.substances = []; // no llega del backend (solo principal)
  }

  aplicarFiltros(): void {
    const f = this.formFiltros.value;

    this.dataSource.filterPredicate = (
      item: Demandante,
      filterText: string
    ) => {
      const v = JSON.parse(filterText);

      const norm = (s: string) => this.normalizar(s ?? '');

      const nombreOK = v.nombre
        ? norm(item.postulante).includes(norm(v.nombre))
        : true;

      const programaOK = v.programa
        ? norm(item.programa) ===
          norm(
            this.programsCatalog.find((p) => p.id === v.programa)?.name || ''
          )
        : true;
/*
      const sexoOK = v.sexo
        ? norm(item.sexo) ===
          norm(this.sexesCatalog.find((s) => s.id === v.sexo)?.name || '')
        : true;
*/
      const comunaOK = v.comuna
        ? norm(item.comuna) ===
          norm(this.communesCatalog.find((c) => c.id === v.comuna)?.name || '')
        : true;

      const contactoOK = v.tcontacto
        ? norm(item.tipoContacto) ===
          norm(
            this.contactTypesCatalog.find((t) => t.id === v.tcontacto)?.name ||
              ''
          )
        : true;

      const estadoOK = v.estado
        ? norm(item.estado) ===
          norm(this.statesCatalog.find((e) => e.id === v.estado)?.name || '')
        : true;

      // FECHAS
      const fInicio = this.parsearFecha(v.fechaInicio);
      const fFin = this.parsearFecha(v.fechaFin);
      const fReg = this.parsearFecha(item.fecha);

      let fechaOK = true;

      if (fReg) {
        fechaOK = (!fInicio || fReg >= fInicio) && (!fFin || fReg <= fFin);
      }

      //sexoOK &&
      return (
        nombreOK &&
        programaOK &&        
        comunaOK &&
        contactoOK &&
        estadoOK &&
        fechaOK
      );
    };

    this.dataSource.filter = JSON.stringify(f);
  }

  limpiarFiltros(): void {
    this.formFiltros.reset();
    this.dataSource.filter = '';
  }

  // =============================================================
  //  UTILIDADES
  // =============================================================
  normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  formatearTexto(texto: string): string {
    if (!texto) return '';
    return texto
      .split(' ')
      .filter((p) => p.trim().length)
      .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  parsearFecha(fecha: any): Date | null {
    if (!fecha) return null;

    if (fecha instanceof Date) return fecha;

    if (typeof fecha === 'string' && fecha.includes('T')) {
      const d = new Date(fecha);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha)) {
      const [d, m, y] = fecha.split('/');
      return new Date(+y, +m - 1, +d);
    }

    return null;
  }

  getDiasTranscurridos(fecha: Date | string): number {
    // Convertir ambas fechas a medianoche (00:00)
    const f = new Date(fecha);
    const hoy = new Date();

    const fechaSinHora = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    const hoySinHora = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );

    const diffMs = hoySinHora.getTime() - fechaSinHora.getTime();

    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return dias;
  }

  private toArrayForce(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
  //******************************************************************************************
  //  VER DETALLE DEMANDA
  //******************************************************************************************

  verDetalle(regResumen: any): void {
    if (!regResumen || !regResumen.id) {
      alert('❌ Registro no válido.');
      return;
    }

    this.registerFullLoader.load(regResumen.id).subscribe((full) => {
      const sustancias = this.toArrayForce(full.sustancias);
      const movimientos = this.toArrayForce(full.movimientos);

      //this.demandDetailViewService.show(full.registro, sustancias, movimientos);
      this.demandDetailViewService.generate(
        full.registro,
        sustancias,        
        movimientos
      );
    });
  }

  //******************************************************************************************
  //  IMPRIMIR DETALLE DEMANDA
  //******************************************************************************************

  imprimirDetalle(regResumen: any): void {
    if (!regResumen?.id) {
      alert('❌ Registro no válido.');
      return;
    }

    this.registerFullLoader.load(regResumen.id).subscribe((full) => {
      const sustancias = this.toArrayForce(full.sustancias);
      const movimientos = this.toArrayForce(full.movimientos);

      // 👉 Imprime directamente
      this.demandDetailViewService.generate(
        full.registro,
        sustancias,
        movimientos
      );
    });
  }
}

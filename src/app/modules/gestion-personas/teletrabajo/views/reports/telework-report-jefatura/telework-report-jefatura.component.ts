/**
 * 🔥 NORMALIZADOR OFICIAL DEL SISTEMA
 *
 * Convierte cualquier fecha backend/local
 * a día operacional Chile evitando
 * bugs UTC/timezone.
 *
 * ⚠️ NO usar new Date() directamente
 * para comparaciones operacionales.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TimeService } from '@app/core/services/time.service';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { TeleworkReportService } from '@app/modules/gestion-personas/teletrabajo/services/telework-report.service';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { WorkService } from '@app/modules/gestion-personas/teletrabajo/services/work.service';
import { Work } from '@app/modules/gestion-personas/teletrabajo/models/work.model';
import { RegisterReviewService } from '../../../services/reports/register-review.service';
import { TeleworkOperationalReviewModal } from '../../../views/reports/telework-report-jefatura/telework-operational-review-modal';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogYesNoComponent } from '@app/shared/confirm-dialog/confirm-dialog-yes-no.component';
import { RegisterReview } from '../../../models/register-review.model';
import { LoaderService } from '@app/core/services/loader.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenService } from '@app/core/services/token.service';

@Component({
  selector: 'app-telework-report-jefatura',
  standalone: true,
  templateUrl: './telework-report-jefatura.component.html',
  styleUrls: ['./telework-report-jefatura.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatTooltipModule,
  ],
})
export class TeleworkReportJefaturaComponent {
  private dialog = inject(MatDialog);
  private reportService = inject(TeleworkReportService);
  private teleworkReport = inject(TeleworkReportPrintService);
  private usersGroupService = inject(UsersGroupService);
  private loader = inject(LoaderService);
  private groupService = inject(GroupService);
  private workService = inject(WorkService);
  private registerReviewService = inject(RegisterReviewService);
  private timeService = inject(TimeService);
  private snackBar = inject(MatSnackBar);
  private tokenService = inject(TokenService);

  constructor() {}

  selectedReview: Partial<RegisterReview> = {
    observations: '',
    state: 'REVIEW',
  };

  loggedUser: any;

  allReviews: any[] = [];
  operationalRegisters: any[] = [];

  users: any[] = [];
  registers: any[] = [];
  works: any[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredUsers: any[] = [];
  selectedUserRegisters: any[] = [];
  selectedUserSubscriptions: any[] = [];
  dailyRows: any[] = [];

  showDetail = false;
  hasSearched: boolean = false;

  userSearch = new FormControl('');

  // ===============================
  // 🟦 JEFATURA
  // ===============================
  jefe: any = {
    id: 0,
    fullName: '',
  };

  grupo: any = {
    name: '',
    description: '',
  };

  allWorks: any[] = [];
  days: any[] = [];
  selectedDay: Date | null = null;

  // ===============================
  // FILTROS
  // ===============================
  rut: string = '';
  rutInvalido = false;

  month: number | null = null;
  year: number | null = null;

  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' },
  ];

  years: number[] = [];

  // ===============================
  // RESULTADOS
  // ===============================

  selectedUser: any = null;
  allRegisters: any[] = [];

  subscriptions: any[] = [];
  allSubscriptions: any[] = [];

  // ===============================
  // COLUMNAS
  // ===============================
  displayedUsersColumns: string[] = ['fullName', 'rut', 'marks', 'actions'];
  //displayedRegistersColumns = ['date', 'day', 'hour', 'type'];
  displayedRegistersColumns = [
    'status',
    'date',
    'entry',
    'exit',
    'hours',
    'activities',
    'actions',
  ];
  displayedSubscriptionsColumns = ['start', 'end', 'duration', 'state'];

  // ===============================
  // INIT
  // ===============================
  async ngOnInit() {
    // =====================================
    // 🔥 USUARIO LOGEADO
    // =====================================

    this.loggedUser = this.tokenService.getUserProfile();

    console.log('👤 LOGGED USER:', this.loggedUser);

    // =====================================
    // 🔥 PERFIL ACTUAL SISTEMA
    // =====================================

    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');

    this.jefe.id = profile.id;

    this.jefe.fullName = profile.fullName;

    // =====================================
    // 🔥 FECHAS
    // =====================================

    const currentYear = this.timeService.getServerTime().getFullYear();

    for (let i = currentYear; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.month = this.timeService.getServerTime().getMonth() + 1;

    this.year = this.timeService.getServerTime().getFullYear();

    this.onMonthYearChange();

    await this.cargarGrupo();
  }

  // ===============================
  // 🔥 USUARIOS DE JEFATURA
  // ===============================
  async getUsuariosDeJefatura(): Promise<number[]> {
    const relaciones = await firstValueFrom(this.usersGroupService.getAll());

    return relaciones
      .filter((r: any) => r.group?.user?.id === this.jefe.id && !r.deletedAt)
      .map((r: any) => r.user?.id);
  }

  async cargarGrupo() {
    try {
      const groups = await firstValueFrom(this.groupService.getAll());

      const group = (groups as any[]).find((g) => g.user?.id === this.jefe.id);

      this.grupo.name = group?.name || 'Sin nombre';
      this.grupo.description = group?.description || '';
    } catch (error) {
      console.error('Error cargando grupo', error);
    }
  }

  // ===============================
  // 🔍 SEARCH (MODIFICADO)
  // ===============================
  async search() {
    this.hasSearched = false;
    this.loader.lock();

    // 🔥 LIMPIEZA
    this.clearResults();

    try {
      this.hasSearched = true;

      const [users, registers, subscribes, relaciones, works, reviews] =
        (await Promise.all([
          firstValueFrom(this.reportService.getUsers()),

          firstValueFrom(this.reportService.getRegisters()),

          firstValueFrom(this.reportService.getSubscribes()),

          firstValueFrom(this.usersGroupService.getAll()),

          firstValueFrom(this.workService.getAll()),

          firstValueFrom(this.registerReviewService.getAll()),
        ])) as any;

      console.log('🔥 REGISTERS RAW:', registers);

      console.table(
        registers.map((r: any) => ({
          id: r.id,

          raw: r.register_datetime,

          newDate: new Date(r.register_datetime).toString(),

          parseLocal: this.toLocalDate(r.register_datetime),

          user: r.user?.full_name || r.user?.fullName,

          state: r.state,

          type: r.type,
        })),
      );
      // ===============================
      // 🔥 IDS DEL EQUIPO (JEFATURA)
      // ===============================
      const idsJefatura = relaciones
        .filter((r: any) => r.group?.user?.id === this.jefe.id && !r.deletedAt)
        .map((r: any) => r.user?.id);

      // ===============================
      // 🔥 FILTRO REGISTROS POR FECHA
      // ===============================
      let filteredRegisters = [...registers];

      if (this.dateFrom && this.dateTo) {
        const from = this.toLocalDate(this.dateFrom);
        const to = this.toLocalDate(this.dateTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = this.toLocalDate(r.register_datetime);

          return d >= from && d <= to;
        });
      }

      // ===============================
      // 🔥 CONTEO DE MARCAS
      // ===============================
      const userMap: any = {};

      filteredRegisters.forEach((r: any) => {
        const uid = r.user?.id;
        if (!uid) return;
        userMap[uid] = (userMap[uid] || 0) + 1;
      });

      // ===============================
      // 🔥 USERS (🔥 TODOS LOS DEL EQUIPO)
      // ===============================
      this.users = users
        .filter((u: any) => idsJefatura.includes(u.id)) // 🔥 SOLO EQUIPO
        .map((u: any) => {
          const marks = userMap[u.id] || 0;

          const fullName = [
            u.firstName,
            u.secondName,
            u.firstLastName,
            u.secondLastName,
          ]
            .filter(Boolean)
            .join(' ');

          return {
            id: u.id,
            fullName,
            rut: u.rut,
            marks,
          };
        });

      // ===============================
      // 🔥 DATASETS BASE
      // ===============================
      this.allRegisters = filteredRegisters

        .filter((r: any) => !r.deletedAt)

        .map((r: any) => ({
          ...r,

          type: r.type || r.state,

          isVirtual: r.isVirtual ?? false,
        }));
      console.table(
        this.allRegisters.map((r: any) => ({
          id: r.id,

          raw: r.register_datetime,

          type: r.type,

          state: r.state,

          user: [
            r.user?.firstName,
            r.user?.secondName,
            r.user?.firstLastName,
            r.user?.secondLastName,
          ]
            .filter(Boolean)
            .join(' '),
        })),
      );

      this.allSubscriptions = subscribes.filter(
        (s: any) => idsJefatura.includes(s.user?.id) && !s.deletedAt,
      );

      // ===============================
      // 🔥 WORKS
      // ===============================
      const safeWorks: Work[] = Array.isArray(works)
        ? works
        : works?.content || works?.data || [];

      this.allWorks = safeWorks.filter((w: any) => {
        if (w.deletedAt) return false;

        const isUser =
          idsJefatura.includes(w.user?.id) || idsJefatura.includes(w.userId);

        if (!isUser) return false;

        if (this.dateFrom && this.dateTo) {
          const from = this.toLocalDate(this.dateFrom);
          const to = this.toLocalDate(this.dateTo);

          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);

          const rawDate = w.createdAt || w.created_at;
          if (!rawDate) return false;

          const d = this.toLocalDate(rawDate);

          return d >= from && d <= to;
        }

        return true;
      });

      this.allReviews = (reviews || []).filter((r: any) => !r.deletedAt);

      // ===============================
      // 🔍 VALIDAR SI HAY DATOS
      // ===============================
      const hasRegisters = this.allRegisters.length > 0;
      const hasSubscriptions = this.allSubscriptions.length > 0;
      const hasWorks = this.allWorks.length > 0;

      if (!hasRegisters && !hasSubscriptions && !hasWorks) {
        this.showWarning(
          'No se encontró información para el rango seleccionado',
        );
      }
    } catch (error) {
      console.error(error);
      this.showWarning('Error al cargar reporte');
    } finally {
      this.loader.unlock();
    }
  }

  // ===============================
  // 👤 SELECT USER (MODIFICADO)
  // ===============================
  async selectUser(user: any): Promise<void> {
    this.selectedUser = user;

    // 🔹 REGISTROS
    let userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id)

      // 🔥 ORDEN REAL
      .sort(
        (a: any, b: any) =>
          (this.parseDateTimeLocal(a.register_datetime)?.getTime() || 0) -
          (this.parseDateTimeLocal(b.register_datetime)?.getTime() || 0),
      )

      .map((r: any, index: number) => ({
        ...r,
        type: r.type || r.state || '',
        isVirtual: r.isVirtual ?? false,
      }));

    // 🔥 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = this.toLocalDate(this.dateFrom);
      const to = this.toLocalDate(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = this.toLocalDate(r.register_datetime);

        return d >= from && d <= to;
      });
    }

    // 🔹 SUSCRIPCIONES
    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    // 🔥 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = this.toLocalDate(this.dateFrom);
      const to = this.toLocalDate(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);
          return start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // 🔹 ASIGNACIONES
    this.subscriptions = userSubscriptions.sort((a, b) => {
      const d1 = this.toLocalDate(a.begin).getTime();
      const d2 = this.toLocalDate(b.begin).getTime();

      return d2 - d1; // 🔥 DESC → más reciente primero
    });

    this.works = this.allWorks.filter((w: any) => w.user?.id === user.id);

    // 🔥 GENERACIÓN COMPLETA (CLAVE)
    this.registers = this.generateFullRegisters(
      this.subscriptions,
      userRegisters,
    );

    // 🔹 AGRUPACIÓN
    this.days = this.groupByDay(this.registers, this.works);

    // 🔥 FIX FINAL (EL QUE TE FALTABA)
    const hasRealRegisters = this.registers.some((r) => !r.isVirtual);
    const hasSubscriptions = this.subscriptions.length > 0;

    this.buildDailyRows(this.registers);

    if (!hasRealRegisters && !hasSubscriptions) {
      this.showDetail = false;

      //this.showWarning(
      //  'El usuario no posee información en el período seleccionado.',
      //);
    } else {
      this.showDetail = true;
    }
  }

  selectRegisterDay(register: any) {
    const targetDate = this.toLocalDate(register.register_datetime);
    targetDate.setHours(0, 0, 0, 0);

    this.selectedDay = targetDate;

    this.works = this.allWorks
      .filter((w: any) => {
        const rawDate = w.createdAt || w.created_at;
        if (!rawDate) return false;

        const d = this.toLocalDate(rawDate);
        d.setHours(0, 0, 0, 0);

        return d.getTime() === targetDate.getTime();
      })
      .sort((a: any, b: any) => {
        const da =
          this.parseDateTimeLocal(a.createdAt || a.created_at)?.getTime() || 0;

        const db =
          this.parseDateTimeLocal(b.createdAt || b.created_at)?.getTime() || 0;

        return da - db;
      });

    this.showDetail = true;
  }

  groupByDay(registers: any[], works: any[]) {
    const map = new Map<number, any>();

    // 🔵 REGISTROS
    registers.forEach((r) => {
      const d = this.toLocalDate(r.register_datetime);
      d.setHours(0, 0, 0, 0);

      const key = d.getTime();

      if (!map.has(key)) {
        map.set(key, {
          date: new Date(d),
          registros: [],
          actividades: [],
        });
      }

      map.get(key).registros.push(r);
    });

    // 🟣 ACTIVIDADES
    works.forEach((w) => {
      const rawDate = w.createdAt || w.created_at;
      if (!rawDate) return;

      const d = this.toLocalDate(rawDate);
      if (isNaN(d.getTime())) return;

      d.setHours(0, 0, 0, 0);

      const key = d.getTime();

      if (!map.has(key)) {
        map.set(key, {
          date: new Date(d),
          registros: [],
          actividades: [],
        });
      }

      map.get(key).actividades.push(w);
    });

    // 🔥 PROCESAR
    const result = Array.from(map.values());

    result.forEach((day: any) => {
      day.actividades.sort((a: any, b: any) => {
        const da =
          this.parseDateTimeLocal(a.createdAt || a.created_at)?.getTime() || 0;

        const db =
          this.parseDateTimeLocal(b.createdAt || b.created_at)?.getTime() || 0;

        return da - db;
      });
      day.totalActividades = day.actividades.length;
      day.tieneActividad = day.totalActividades > 0;
      day.totalRegistros = day.registros.length;

      const ingreso = day.registros.find((r: any) => r.type === 'ING');

      const salida = day.registros.find((r: any) => r.type === 'SAL');

      day.ingreso = ingreso || null;
      day.salida = salida || null;

      day.ingresoHora = ingreso ? this.formatTimeCL(ingreso) : 'Sin marca';

      day.salidaHora = salida ? this.formatTimeCL(salida) : 'Sin marca';

      day.isIngresoVirtual = ingreso?.isVirtual || false;
      day.isSalidaVirtual = salida?.isVirtual || false;

      day.estado = day.tieneActividad ? 'ok' : 'sin-actividad';

      // 🔥 SOLO PARA MOSTRAR
      day.dateLabel = this.formatDateCL(day.date);
    });

    // 🔥 ORDEN FINAL DESC (JEFATURA)
    return result.sort((a: any, b: any) => {
      return b.date.getTime() - a.date.getTime();
    });
  }

  // ===============================
  // 🧠 CORE (NO TOCAR)
  // ===============================
  generateFullRegisters(subs: any[], regs: any[]) {
    const result: any[] = [...regs];

    const from = this.dateFrom ? this.toLocalDate(this.dateFrom) : null;

    const to = this.dateTo ? this.toLocalDate(this.dateTo) : null;

    if (from) {
      from.setHours(0, 0, 0, 0);
    }

    if (to) {
      to.setHours(23, 59, 59, 999);
    }

    // 🔥 DEFINIR HOY UNA SOLA VEZ
    const today = this.toLocalDate(this.timeService.getServerTime());

    subs.forEach((s) => {
      let start = this.toLocalDate(s.begin);
      let end = this.toLocalDate(s.end);

      if (!start || !end) return;

      if (from && start < from) start = new Date(from);
      if (to && end > to) end = new Date(to);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (
        let d = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );
        d.getTime() <= end.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        const currentDay = new Date(d);
        if (from && currentDay < from) {
          continue;
        }

        if (to && currentDay > to) {
          continue;
        }

        const ingreso = result.find((r) => {
          const rd = this.toLocalDate(r.register_datetime);

          return rd.getTime() === currentDay.getTime() && r.type === 'ING';
        });

        const salida = result.find((r) => {
          const rd = this.toLocalDate(r.register_datetime);

          return rd.getTime() === currentDay.getTime() && r.type === 'SAL';
        });

        const isPastDay = currentDay.getTime() < today.getTime();

        // 🔥 SOLO DÍAS PASADOS
        if (isPastDay) {
          const baseDate = new Date(currentDay);
          baseDate.setHours(12, 0, 0, 0); // 🔥 hora neutra

          if (!ingreso) {
            result.push({
              user: this.selectedUser,

              register_datetime: `${this.getKeyFromDate(baseDate)}T12:00:00`,

              type: 'ING',

              isVirtual: true,
            });
          }

          if (!salida) {
            result.push({
              user: this.selectedUser,

              register_datetime: `${this.getKeyFromDate(baseDate)}T12:00:00`,

              type: 'SAL',

              isVirtual: true,
            });
          }
        }
      }
    });

    return result.sort((a, b) => {
      const d1 = this.parseDateTimeLocal(a.register_datetime)?.getTime() || 0;

      const d2 = this.parseDateTimeLocal(b.register_datetime)?.getTime() || 0;

      // 🔥 ORDEN POR FECHA (MENOR → MAYOR)
      if (d1 !== d2) return d1 - d2;

      // 🔥 MISMO DÍA → ORDEN POR HORA REAL
      if (!a.isVirtual && !b.isVirtual) return d1 - d2;

      // 🔥 REALES ARRIBA, VIRTUALES ABAJO
      if (a.isVirtual && !b.isVirtual) return 1;
      if (!a.isVirtual && b.isVirtual) return -1;

      // 🔥 VIRTUALES → ING ANTES QUE SAL
      if (a.type === b.type) return 0;
      return a.type === 'ING' ? -1 : 1;
    });
  }

  // ===============================
  // UTIL
  // ===============================
  formatDateCL(date: any): string {
    const d = this.toLocalDate(date);

    if (isNaN(d.getTime())) return ''; // 🔥 evita error

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  showWarning(msg: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Atención',
        message: msg,
        confirmText: 'Aceptar',
        icon: 'warning',
      },
    });
  }

  getDurationDays(s: any): number {
    if (!s?.begin || !s?.end) return 0;

    const start = this.toLocalDate(s.begin);
    const end = this.toLocalDate(s.end);

    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  getEstado(s: any): string {
    if (!s?.begin || !s?.end) return 'pendiente';

    const today = this.toLocalDate(this.timeService.getServerTime());
    const start = this.toLocalDate(s.begin);
    const end = this.toLocalDate(s.end);

    if (today < start) return 'pendiente';
    if (today >= start && today <= end) return 'vigente';
    return 'vencido';
  }

  onDateChange(type: 'from' | 'to'): void {
    if (!this.dateFrom && !this.dateTo) return;

    // 🔥 SI CAMBIA DESDE
    if (type === 'from' && this.dateFrom) {
      const from = this.toLocalDate(this.dateFrom);

      this.month = from.getMonth() + 1;
      this.year = from.getFullYear();

      from.setHours(0, 0, 0, 0);
      this.dateFrom = from;
    }

    // 🔥 SI CAMBIA HASTA
    if (type === 'to' && this.dateTo) {
      const to = this.toLocalDate(this.dateTo);

      to.setHours(23, 59, 59, 999);
      this.dateTo = to;
    }

    // 🔥 LIMPIAR RESULTADOS (UX PRO)
    this.showDetail = false;
    this.days = [];
  }

  clearFilters(): void {
    const now = this.timeService.getServerTime();

    // 🔹 usuario
    this.selectedUser = null;

    // 🔥 DEJAR RANGO VÁLIDO (CLAVE)
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    from.setHours(0, 0, 0, 0);

    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);

    this.dateFrom = from;
    this.dateTo = to;

    // 🔹 sincronizar UI
    this.month = from.getMonth() + 1;
    this.year = from.getFullYear();

    // 🔹 filtros UI
    this.rut = '';
    this.rutInvalido = false;

    // 🔹 limpiar resultados (NO datos base del filtro)
    this.clearResults();
  }

  get usersCount(): number {
    return this.users?.length || 0;
  }

  getDayOfWeek(date: any, format: 'short' | 'long' = 'long'): string {
    const d = this.toLocalDate(date);

    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('es-CL', { weekday: format }).replace('.', '');
  }

  isSameDay(date1: string | Date, date2: string | Date | null): boolean {
    if (!date1 || !date2) return false;

    const d1 = this.toLocalDate(date1);
    const d2 = this.toLocalDate(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }

  formatTimeCL(value: any): string {
    // 🔥 REGISTROS
    if (value && typeof value === 'object' && 'isVirtual' in value) {
      if (value.isVirtual) return '08:00';

      const d = this.parseDateTimeLocal(value.register_datetime);

      if (!d) return '00:00'; // 🔥 fallback seguro

      return d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    // 🔥 FECHA DIRECTA
    const d = this.parseDateTimeLocal(value);

    if (!d) return '00:00'; // 🔥 fallback

    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  formatRut(event: any) {
    this.hasSearched = false;
    let value = event.target.value.replace(/[^0-9kK]/g, '');

    if (value.length < 2) {
      this.rut = value;
      this.validarRut(); // 👈 agregar
      return;
    }

    let cuerpo = value.slice(0, -1);
    let dv = value.slice(-1);

    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    this.rut = cuerpo + '-' + dv.toUpperCase();

    this.validarRut(); // 👈 agregar
  }

  validarRut() {
    if (!this.rut) {
      this.rutInvalido = false;
      return;
    }

    // limpiar formato
    const rutLimpio = this.rut
      .replace(/\./g, '')
      .replace('-', '')
      .toUpperCase();

    if (rutLimpio.length < 2) {
      this.rutInvalido = true;
      return;
    }

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);

    if (!/^\d+$/.test(cuerpo)) {
      this.rutInvalido = true;
      return;
    }

    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += multiplo * parseInt(cuerpo.charAt(i), 10);
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const resto = suma % 11;
    const dvEsperado = 11 - resto;

    let dvCalculado = '';

    if (dvEsperado === 11) {
      dvCalculado = '0';
    } else if (dvEsperado === 10) {
      dvCalculado = 'K';
    } else {
      dvCalculado = dvEsperado.toString();
    }

    this.rutInvalido = dvCalculado !== dv;
  }

  onMonthYearChange(): void {
    this.hasSearched = false;
    if (!this.month || !this.year) {
      this.dateFrom = null;
      this.dateTo = null;
      return;
    }

    const from = new Date(this.year, this.month - 1, 1);
    from.setHours(0, 0, 0, 0);

    const to = new Date(this.year, this.month, 0);
    to.setHours(23, 59, 59, 999);

    this.dateFrom = from;
    this.dateTo = to;

    this.clearResults();
  }

  onMonthFocus(): void {
    this.hasSearched = false;
    this.clearResults();
  }

  onDateFocus(): void {
    //this.month = null;
    //this.year = null;
    this.clearResults();
  }

  clearResults(): void {
    // 🔹 selección
    this.selectedUser = null;
    // 🔹 datasets operacionales
    this.registers = [];
    this.subscriptions = [];
    this.dailyRows = [];
    this.works = [];
    this.days = [];
    // 🔹 detalle
    this.selectedDay = null;
    this.selectedUserRegisters = [];
    this.selectedUserSubscriptions = [];
    // 🔹 UI
    this.showDetail = false;
    this.hasSearched = false;
  }

  printUser(user: any): void {
    // =====================================
    // 🔥 REGISTROS
    // =====================================

    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    let userReviews = this.allReviews.filter(
      (r: any) => r.user?.id === user.id && !r.deletedAt,
    );

    // =====================================
    // 🔥 FILTRO RANGO
    // =====================================

    if (this.dateFrom && this.dateTo) {
      const from = this.toLocalDate(this.dateFrom);
      const to = this.toLocalDate(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = this.toLocalDate(r.register_datetime || r.createdAt);

        return d >= from && d <= to;
      });

      userReviews = userReviews.filter((r: any) => {
        const d = this.toLocalDate(r.register_datetime);

        return d >= from && d <= to;
      });

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);

          return start && end && start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // =====================================
    // 🔥 GENERAR COMPLETOS
    // =====================================

    const fullRegisters = this.generateFullRegisters(
      userSubscriptions,
      userRegisters,
    );

    // =====================================
    // 🔥 NORMALIZAR
    // =====================================

    const safeRegisters = fullRegisters
      .map((r: any) => {
        const d = this.parseDateTimeLocal(r.register_datetime || r.createdAt);

        return {
          ...r,

          register_datetime: d && !isNaN(d.getTime()) ? d : null,

          type: r.type ?? r.state,

          isVirtual: r.isVirtual ?? false,
        };
      })
      .filter((r: any) => r.register_datetime !== null);

    // =====================================
    // 🔥 AGRUPAR
    // =====================================

    const grouped: Record<string, any[]> = safeRegisters.reduce(
      (acc: Record<string, any[]>, r: any) => {
        const key = this.formatDateCL(r.register_datetime);

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(r);

        return acc;
      },
      {},
    );

    // =====================================
    // 🔥 DATA FINAL
    // =====================================

    const data: any[] = [];

    Object.entries(grouped).forEach(([day, registers]) => {
      const ingreso = registers.find((r: any) => (r.type || r.state) === 'ING');

      const salida = registers.find((r: any) => (r.type || r.state) === 'SAL');

      // =====================================
      // 🔥 REVIEWS
      // =====================================

      const operationalDay = this.getKeyFromDate(
        ingreso?.register_datetime || salida?.register_datetime,
      );

      const reviews = userReviews.filter((rev: any) => {
        return this.getDateOnly(rev.register_datetime) === operationalDay;
      });

      reviews.sort((a: any, b: any) => b.id - a.id);

      const review = reviews[0];

      // =====================================
      // 🔥 HORAS
      // =====================================

      let workedHours = 0;

      if (ingreso?.register_datetime && salida?.register_datetime) {
        const diff =
          salida.register_datetime.getTime() -
          ingreso.register_datetime.getTime();

        workedHours = Number((diff / (1000 * 60 * 60)).toFixed(1));
      }

      // =====================================
      // 🔥 ESTADO
      // =====================================

      let estado = 'Pendiente';

      if (review?.state === 'OK') {
        estado = 'Validada';
      } else if (review?.state === 'OBSERVED') {
        estado = 'Observada';
      } else if (review?.state === 'CRITICAL') {
        estado = 'Crítica';
      } else if (review?.state === 'REVIEW') {
        estado = 'Regularizar';
      }

      // =====================================
      // 🔥 ROW FINAL PDF
      // =====================================

      data.push({
        fecha: day,

        dia: this.getDayOfWeek(
          ingreso?.register_datetime || salida?.register_datetime,
        ),

        entrada: ingreso ? this.formatTimeCL(ingreso) : '--:--',

        salida: salida ? this.formatTimeCL(salida) : '--:--',

        horas: workedHours,

        estado,

        observacion: review?.observations || '',
      });
    });

    // =====================================
    // 🔥 GENERAR PDF
    // =====================================

    const html = this.teleworkReport.generateReport({
      userName: user.fullName,

      rut: user.rut,

      jefatura: this.jefe?.fullName || '',

      registers: data,
    });

    this.teleworkReport.printPdf(html);
  }

  exportUser(user: any): void {
    // =====================================
    // 🔥 REGISTROS USUARIO
    // =====================================

    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    let userReviews = this.allReviews.filter(
      (r: any) => r.user?.id === user.id && !r.deletedAt,
    );

    // =====================================
    // 🔥 FILTRO RANGO
    // =====================================

    if (this.dateFrom && this.dateTo) {
      const from = this.toLocalDate(this.dateFrom);
      const to = this.toLocalDate(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = this.toLocalDate(r.register_datetime || r.createdAt);

        return d >= from && d <= to;
      });

      userReviews = userReviews.filter((r: any) => {
        const d = this.toLocalDate(r.register_datetime);

        return d >= from && d <= to;
      });

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);

          return start && end && start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.toLocalDate(s.begin);
          const end = this.toLocalDate(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // =====================================
    // 🔥 GENERAR COMPLETOS
    // =====================================

    const fullRegisters = this.generateFullRegisters(
      userSubscriptions,
      userRegisters,
    );

    // =====================================
    // 🔥 NORMALIZAR
    // =====================================

    const safeRegisters = fullRegisters
      .map((r: any) => {
        const d = this.parseDateTimeLocal(r.register_datetime || r.createdAt);

        return {
          ...r,

          register_datetime: d && !isNaN(d.getTime()) ? d : null,

          type: r.type ?? r.state,

          isVirtual: r.isVirtual ?? false,
        };
      })
      .filter((r: any) => r.register_datetime !== null);

    // =====================================
    // 🔥 AGRUPAR POR DÍA
    // =====================================

    const grouped: Record<string, any[]> = safeRegisters.reduce(
      (acc: Record<string, any[]>, r: any) => {
        const key = this.formatDateCL(r.register_datetime);

        if (!acc[key]) acc[key] = [];

        acc[key].push(r);

        return acc;
      },
      {},
    );

    // =====================================
    // 🔥 RESULTADO FINAL
    // =====================================

    const finalRows: any[] = [];

    Object.entries(grouped).forEach(([day, registers]) => {
      const ingreso = registers.find((r: any) => (r.type || r.state) === 'ING');

      const salida = registers.find((r: any) => (r.type || r.state) === 'SAL');

      const operationalDay = this.getKeyFromDate(
        ingreso?.register_datetime || salida?.register_datetime,
      );

      const reviews = userReviews.filter((rev: any) => {
        return this.getDateOnly(rev.register_datetime) === operationalDay;
      });

      reviews.sort((a: any, b: any) => b.id - a.id);

      const review = reviews[0];

      // =====================================
      // 🔥 HORAS
      // =====================================

      let workedHours = 0;

      if (ingreso?.register_datetime && salida?.register_datetime) {
        const diff =
          salida.register_datetime.getTime() -
          ingreso.register_datetime.getTime();

        workedHours = Number((diff / (1000 * 60 * 60)).toFixed(1));
      }

      // =====================================
      // 🔥 ESTADO
      // =====================================

      let estado = 'Sin revisión';

      if (review?.state === 'OK') {
        estado = 'Validada';
      } else if (review?.state === 'OBSERVED') {
        estado = 'Observada';
      } else if (review?.state === 'CRITICAL') {
        estado = 'Crítica';
      } else if (review?.state === 'REVIEW') {
        estado = 'Regularizar';
      }

      // =====================================
      // 🔥 ROW FINAL
      // =====================================

      finalRows.push({
        Fecha: day,

        Día: this.getDayOfWeek(
          ingreso?.register_datetime || salida?.register_datetime,
        ),

        Entrada: ingreso ? this.formatTimeCL(ingreso) : '--:--',

        Salida: salida ? this.formatTimeCL(salida) : '--:--',

        Horas: workedHours,

        Estado: estado,

        Observación: review?.observations || '',

        RevisadoPor:
          `
    ${review?.administrator?.firstName || ''}
    ${review?.administrator?.secondName || ''}
    ${review?.administrator?.firstLastName || ''}
    ${review?.administrator?.secondLastName || ''}
  `
            .replace(/\s+/g, ' ')
            .trim() ||
          review?.administrator?.username ||
          '',
      });
    });

    // =====================================
    // 🔥 VALIDAR
    // =====================================

    if (!finalRows.length) {
      this.showWarning('El usuario no tiene registros válidos en el período');

      return;
    }

    // =====================================
    // 🔥 EXCEL
    // =====================================

    const worksheet = XLSX.utils.json_to_sheet(finalRows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Operacional');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, `Reporte_Operacional_${user.fullName}.xlsx`);
  }

  formatDateShortCL(date: any): string {
    const d = this.toLocalDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}`; // 🔥 SOLO dd/MM
  }

  toLocalDate(date: any): Date {
    if (!date) {
      return new Date(NaN);
    }

    // 🔥 Date real
    if (date instanceof Date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // 🔥 STRING YYYY-MM-DD o ISO
    if (typeof date === 'string') {
      const onlyDate = date.includes('T') ? date.split('T')[0] : date;

      // 🔥 YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) {
        const [y, m, d] = onlyDate.split('-').map(Number);

        return new Date(y, m - 1, d);
      }
    }

    // 🔥 fallback seguro
    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return new Date(NaN);
    }

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  parseDateTimeLocal(value: any): Date | null {
    if (!value) return null;

    // 🔥 ISO UTC
    if (typeof value === 'string' && value.includes('T')) {
      const [datePart, timePart] = value.split('T');

      const [y, m, d] = datePart.split('-').map(Number);

      const [hh, mm, ss] = timePart.replace('Z', '').split(':');

      return new Date(y, m - 1, d, Number(hh), Number(mm), Number(ss || 0));
    }

    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
  }

  onFilterFocus(): void {
    this.showDetail = false;
    this.days = [];
    this.registers = [];
  }

  selectDay(date: any): void {
    const targetDate = this.toLocalDate(date);
    targetDate.setHours(0, 0, 0, 0);

    this.selectedDay = targetDate;

    this.works = this.allWorks
      .filter((w: any) => {
        const d = this.toLocalDate(w.createdAt || w.created_at);
        d.setHours(0, 0, 0, 0);

        const isUser =
          w.user?.id === this.selectedUser?.id ||
          w.userId === this.selectedUser?.id;

        return isUser && d.getTime() === targetDate.getTime();
      })
      .sort((a: any, b: any) => {
        const da =
          this.parseDateTimeLocal(a.createdAt || a.created_at)?.getTime() || 0;

        const db =
          this.parseDateTimeLocal(b.createdAt || b.created_at)?.getTime() || 0;

        return da - db;
      });
  }

  getKeyFromDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');

    return `${y}-${m}-${d}`; // 🔥 evita toISOString (bug clásico)
  }

  // =====================================
  // 🔥 BUILD DAILY ROWS (FINAL)
  // =====================================

  buildDailyRows(registers: any[]) {
    const map = new Map<string, any>();

    // =====================================
    // 🔥 BUILD BASE ROWS
    // =====================================

    registers.forEach((r: any) => {
      const date = this.getKeyFromDate(this.toLocalDate(r.register_datetime));

      if (!map.has(date)) {
        map.set(date, {
          date,

          entry: null,
          exit: null,

          entryTime: null,
          exitTime: null,

          isVirtualEntry: false,
          isVirtualExit: false,

          worksCount: 0,

          hasActivities: false,

          status: 'OK',

          user: this.selectedUser,

          works: [],

          subscriptions: this.subscriptions,

          review: null,

          reviewObservation: '',

          comment: '',

          workedHours: 0,

          // 🔥 NUEVO
          isReviewed: false,
        });
      }

      const row = map.get(date);

      // =====================================
      // 🔥 INGRESO
      // =====================================

      if (r.type === 'ING') {
        if (!row.entry || (row.entry.isVirtual && !r.isVirtual)) {
          row.entry = r;

          row.entryTime = this.formatTimeCL(r);

          row.isVirtualEntry = !!r.isVirtual;
        }
      }

      // =====================================
      // 🔥 SALIDA
      // =====================================

      if (r.type === 'SAL') {
        if (!row.exit || (row.exit.isVirtual && !r.isVirtual)) {
          row.exit = r;

          row.exitTime = this.formatTimeCL(r);

          row.isVirtualExit = !!r.isVirtual;
        }
      }
    });

    // =====================================
    // 🔥 ACTIVIDADES + STATUS
    // =====================================

    map.forEach((row) => {
      // =====================================
      // 🔥 WORKS
      // =====================================

      const works = this.allWorks.filter((w: any) => {
        const workDate = this.getKeyFromDate(
          this.toLocalDate(w.createdAt || w.created_at),
        );

        return (
          workDate === row.date &&
          (w.user?.id === this.selectedUser?.id ||
            w.userId === this.selectedUser?.id)
        );
      });

      row.worksCount = works.length;

      row.hasActivities = works.length > 0;

      row.works = works;

      // =====================================
      // 🔥 REVIEWS JORNADA
      // =====================================

      const reviews = this.allReviews.filter((rev: any) => {
        return (
          rev.user?.id === row.user?.id &&
          this.getDateOnly(rev.register_datetime) === row.date &&
          !rev.deletedAt
        );
      });

      reviews.sort((a: any, b: any) => b.id - a.id);

      row.review = reviews[0] || null;

      // =====================================
      // 🔥 REVIEW ING / SAL
      // =====================================

      row.entryReview = reviews.find(
        (r: any) => r.register?.id === row.entry?.id,
      );

      row.exitReview = reviews.find(
        (r: any) => r.register?.id === row.exit?.id,
      );

      // =====================================
      // 🔥 NUEVO BLOQUEO OPERACIONAL
      // =====================================

      row.isReviewed = reviews.length > 0;

      // =====================================
      // 🔥 REVIEW STATES
      // =====================================

      const reviewStates = [...new Set(reviews.map((r: any) => r.state))];

      // =====================================
      // 🔥 OBSERVACIÓN
      // =====================================

      row.reviewObservation = row.review?.observations || '';

      // =====================================
      // 🕒 WORKED HOURS
      // =====================================

      row.workedHours = 0;

      if (row.entry && row.exit && !row.isVirtualEntry && !row.isVirtualExit) {
        const entryDate = this.parseDateTimeLocal(row.entry.register_datetime);

        const exitDate = this.parseDateTimeLocal(row.exit.register_datetime);

        if (entryDate && exitDate) {
          const diffMs = exitDate.getTime() - entryDate.getTime();

          row.workedHours = diffMs / (1000 * 60 * 60);

          row.workedHours = Number(row.workedHours.toFixed(1));
        }
      }

      // =====================================
      // 🔥 STATUS MANUAL
      // =====================================

      if (reviewStates.length > 0) {
        if (reviewStates.includes('CRITICAL')) {
          row.status = 'CRITICAL';
        } else if (reviewStates.includes('REVIEW')) {
          row.status = 'REVIEW';
        } else if (reviewStates.includes('OBSERVED')) {
          row.status = 'OBSERVED';
        } else if (reviewStates.includes('OK')) {
          row.status = 'OK';
        } else {
          row.status = 'OK';
        }

        // =====================================
        // 🔥 COMENTARIO VISUAL
        // =====================================

        if (row.status === 'OK') {
          row.comment =
            row.review?.observations || 'Jornada validada por jefatura';
        } else if (row.status === 'CRITICAL') {
          row.comment = row.review?.observations || 'Inconsistencia crítica';
        } else if (row.status === 'OBSERVED') {
          row.comment = row.review?.observations || 'Jornada observada';
        } else {
          row.comment =
            row.review?.observations || 'Requiere validación operacional';
        }

        return;
      }

      // =====================================
      // 🔥 STATUS AUTOMÁTICO
      // =====================================

      const noEntry = !row.entry || row.isVirtualEntry;

      const noExit = !row.exit || row.isVirtualExit;

      const lessThan9Hours = row.entry && row.exit && row.workedHours < 9;

      if (noEntry && noExit) {
        row.status = 'CRITICAL';

        row.comment = 'Sin marcas operacionales';
      } else if (lessThan9Hours) {
        row.status = 'OBSERVED';

        row.comment = 'Jornada inferior a 9 horas';
      } else if (noEntry || noExit || !row.hasActivities) {
        row.status = 'REVIEW';

        row.comment = 'Requiere validación operacional';
      } else {
        row.status = 'OK';

        row.comment = '';
      }
    });

    // =====================================
    // 🔥 FINAL ROWS
    // =====================================

    this.dailyRows = Array.from(map.values());
  }

  get totalOk(): number {
    return this.dailyRows.filter((r) => r.status === 'OK').length;
  }

  get totalReview(): number {
    return this.dailyRows.filter((r) => r.status === 'REVIEW').length;
  }

  get totalCritical(): number {
    return this.dailyRows.filter((r) => r.status === 'CRITICAL').length;
  }

  get totalObserved(): number {
    return this.dailyRows.filter((r) => r.status === 'OBSERVED').length;
  }

  get hasDailyRows(): boolean {
    return (this.dailyRows?.length || 0) > 0;
  }

  get totalWorkedHours(): number {
    const total = this.dailyRows
      .filter((r: any) => {
        // 🔥 debe tener entrada real
        if (!r.entry || r.isVirtualEntry) {
          return false;
        }

        // 🔥 debe tener salida real
        if (!r.exit || r.isVirtualExit) {
          return false;
        }

        // 🔥 horas válidas
        return r.workedHours > 0;
      })
      .reduce((sum: number, r: any) => sum + (r.workedHours || 0), 0);

    return Number(total.toFixed(1));
  }

  displayUser(user: any): string {
    return user?.fullName || '';
  }

  openReview(row: any): void {
    console.log('🧾 REVIEW ROW:', row);

    const dialogRef = this.dialog.open(TeleworkOperationalReviewModal, {
      width: '900px',

      maxWidth: '95vw',

      disableClose: true,

      data: {
        ...row,

        // 🔥 NUEVA ARQUITECTURA
        entryReview: row.entryReview,
        exitReview: row.exitReview,

        // 🔥 JEFATURA AUTENTICADA REAL
        administrator: this.loggedUser,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result || !this.selectedUser) {
        return;
      }

      const ok = await this.saveOperationalReview(
        row,
        result.state,
        result.observations,
      );

      if (!ok) {
        return;
      }
    });
  }

  // =====================================
  // 🔥 GUARDAR REVIEW OPERACIONAL
  // =====================================

  // =====================================
  // 🔥 GUARDAR REVIEW OPERACIONAL
  // =====================================

  async saveOperationalReview(
    row: any,
    state: string,
    observations: string = '',
  ) {
    try {
      // =====================================
      // 🔥 REGISTROS OPERACIONALES
      // =====================================

      const registers = [row.entry, row.exit].filter((r: any) => !!r);

      // =====================================
      // 🔥 RECORRER ING / SAL
      // =====================================

      for (const register of registers) {
        let finalRegister = register;

        // =====================================
        // 🔥 RESOLVER REAL
        // =====================================

        finalRegister = await this.resolveOperationalRegister(row, register);

        // =====================================
        // 🔥 REFRESH ROW REFERENCES
        // =====================================

        if (finalRegister.type === 'ING') {
          row.entry = finalRegister;

          row.isVirtualEntry = false;
        }

        if (finalRegister.type === 'SAL') {
          row.exit = finalRegister;

          row.isVirtualExit = false;
        }

        // =====================================
        // 🔥 REVIEW EXISTENTE
        // =====================================

        const existingReview = this.allReviews.find((r: any) => {
          return (
            r.user?.id === row.user?.id &&
            this.getDateOnly(r.register_datetime) === row.date &&
            r.register?.id === finalRegister.id &&
            !r.deletedAt
          );
        });

        // =====================================
        // 🔥 PAYLOAD REVIEW
        // =====================================

        const payload = {
          register: {
            id: finalRegister.id,
          },

          administrator: {
            id: this.loggedUser?.id,
          },

          user: {
            id: row.user?.id,
          },

          observations,

          // 🔥 CLAVE OPERACIONAL
          register_datetime: `${row.date}T00:00:00`,

          state,
        };

        console.log('🚀 SAVING REVIEW:', payload);

        let response: any;

        // =====================================
        // 🔥 UPDATE
        // =====================================

        if (existingReview?.id) {
          response = await firstValueFrom(
            this.registerReviewService.update(existingReview.id, payload),
          );

          console.log('✏️ REVIEW UPDATED:', response);
        }

        // =====================================
        // 🔥 CREATE
        // =====================================
        else {
          response = await firstValueFrom(
            this.registerReviewService.create(payload),
          );

          console.log('✅ REVIEW CREATED:', response);
        }

        // =====================================
        // 🔥 REFRESH MEMORIA
        // =====================================

        if (response) {
          const index = this.allReviews.findIndex(
            (r: any) => r.id === response.id,
          );

          if (index >= 0) {
            this.allReviews[index] = response;
          } else {
            this.allReviews.push(response);
          }
        }
      }

      // =====================================
      // 🔥 REFRESH VISUAL
      // =====================================
      //this.buildDailyRows(this.registers);
      //this.dailyRows = [...this.dailyRows];

      await this.selectUser(this.selectedUser);

      return true;
    } catch (e) {
      console.error('❌ ERROR SAVE REVIEW:', e);

      return false;
    }
  }

  // =====================================
  // 🔥 VALIDACIÓN RÁPIDA
  // =====================================

  async quickApprove(row: any): Promise<void> {
    try {
      // =====================================
      // 🔥 VALIDAR
      // =====================================

      const ok = await this.saveOperationalReview(
        row,

        'OK',

        'Jornada validada por jefatura',
      );

      // =====================================
      // 🔥 ERROR
      // =====================================

      if (!ok) {
        throw new Error('No fue posible validar');
      }

      // =====================================
      // 🔥 MENSAJE
      // =====================================

      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',

        data: {
          title: 'Jornada validada',

          message: 'La jornada fue validada correctamente.',
        },
      });
    } catch (e) {
      console.error('❌ ERROR QUICK APPROVE:', e);

      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',

        data: {
          title: 'Error',

          message: 'No fue posible validar la jornada.',
        },
      });
    }
  }

  async markCritical(row: any) {
    await this.saveOperationalReview(
      row,
      'CRITICAL',
      'Inconsistencia operacional crítica',
    );
  }

  confirmQuickApprove(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogYesNoComponent, {
      width: '420px',

      disableClose: true,

      data: {
        title: 'Validar jornada',

        message: 'La jornada será validada oficialmente.',

        yesText: 'Validar',

        noText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.quickApprove(row);
      }
    });
  }

  // =====================================
  // 🔥 HELPER OFICIAL
  // =====================================

  getDateOnly(value: any): string {
    if (!value) return '';

    return String(value).split('T')[0];
  }

  // =====================================
  // 🔥 RESOLVER REGISTER OPERACIONAL
  // =====================================

  async resolveOperationalRegister(row: any, register: any): Promise<any> {
    // =====================================
    // 🔥 NORMALIZAR TYPE
    // =====================================

    const registerType = register.type || register.state;

    // =====================================
    // 🔥 BUSCAR REAL EXISTENTE
    // =====================================

    const existingReal = this.allRegisters.find((r: any) => {
      return (
        r.user?.id === row.user?.id &&
        (r.type || r.state) === registerType &&
        this.getDateOnly(r.register_datetime || r.createdAt) === row.date &&
        !r.isVirtual &&
        !r.deletedAt
      );
    });
    if (existingReal?.id) {
      console.log('♻️ USING EXISTING REAL REGISTER:', existingReal);

      return {
        ...existingReal,

        type: registerType,

        isVirtual: false,
      };
    }
    // =====================================
    // 🔥 BUSCAR REVIEW EXISTENTE
    // =====================================

    console.log('🔥 ALL REVIEWS:', this.allReviews);

    console.log('🔥 SEARCHING REVIEW:', {
      rowDate: row.date,

      registerType,

      userId: row.user?.id,
    });

    const existingReview = this.allReviews.find((rev: any) => {
      const reviewDate = rev.register_datetime?.substring(0, 10);

      const reviewType = rev.register?.state || rev.register?.type;

      console.log('🧠 REVIEW CHECK', {
        reviewId: rev.id,

        reviewUser: rev.user?.id,

        rowUser: row.user?.id,

        reviewType,

        registerType,

        reviewDate,

        rowDate: row.date,
      });

      return (
        rev.user?.id === row.user?.id &&
        reviewDate === row.date &&
        reviewType === registerType &&
        !rev.deletedAt
      );
    });

    // =====================================
    // 🔥 YA EXISTE REGISTER REAL
    // =====================================

    if (existingReview?.register?.id) {
      console.log('♻️ USING REGISTER FROM REVIEW:', existingReview.register);

      return {
        ...existingReview.register,

        type: registerType,

        isVirtual: false,
      };
    }

    // =====================================
    // 🔥 YA ES REAL SIN REVIEW
    // =====================================

    if (!register?.isVirtual && register?.id) {
      console.log('♻️ USING CURRENT REAL REGISTER:', register);

      return {
        ...register,

        type: registerType,

        isVirtual: false,
      };
    }

    // =====================================
    // 🔥 CREAR REAL
    // =====================================

    const payload = {
      user: {
        id: row.user?.id,
      },

      state: registerType,

      register_datetime: `${row.date}T12:00:00`,
    };

    console.log('🚀 CREATING REAL REGISTER:', payload);

    const created = await firstValueFrom(
      this.reportService.createRegister(payload),
    );

    created.isVirtual = false;

    // 🔥 FIX OPERACIONAL
    created.register_datetime = `${row.date}T12:00:00`;

    // =====================================
    // 🔥 NORMALIZAR
    // =====================================

    created.type = registerType;

    created.isVirtual = false;

    // =====================================
    // 🔥 MEMORIA GLOBAL
    // =====================================

    this.allRegisters.push(created);

    // =====================================
    // 🔥 LIMPIAR VIRTUAL
    // =====================================

    this.registers = this.registers.filter(
      (r: any) =>
        !(
          r.isVirtual &&
          (r.type || r.state) === registerType &&
          r.user?.id === row.user?.id &&
          this.getDateOnly(r.register_datetime) === row.date
        ),
    );

    // =====================================
    // 🔥 INSERTAR REAL
    // =====================================

    this.registers.push(created);

    console.log('✅ REAL REGISTER CREATED:', created);

    return created;
  }

  buildOperationalRegisters() {
    const result: any[] = [];

    // =====================================
    // 🔥 REGISTROS ORIGINALES
    // =====================================

    for (const reg of this.allRegisters) {
      const review = this.allReviews.find((rev: any) => {
        return rev.register?.id === reg.id && !rev.deletedAt;
      });

      // =====================================
      // 🔥 EXISTE REVIEW
      // =====================================

      if (review) {
        result.push({
          ...reg,

          // 🔥 ESTADO OPERACIONAL
          operationalState: review.state,

          operationalObservation: review.observations,

          operationalDate: review.register_datetime,

          administrator: review.administrator,

          isReviewed: true,
        });
      }

      // =====================================
      // 🔥 ORIGINAL
      // =====================================
      else {
        result.push({
          ...reg,

          operationalState: null,

          operationalObservation: null,

          operationalDate: reg.register_datetime,

          administrator: null,

          isReviewed: false,
        });
      }
    }

    this.operationalRegisters = result;
  }
}

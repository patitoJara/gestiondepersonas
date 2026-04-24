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

import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { TeleworkReportService } from '@app/modules/gestion-personas/teletrabajo/services/telework-report.service';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { WorkService } from '@app/modules/gestion-personas/teletrabajo/services/work.service';
import { Work } from '@app/modules/gestion-personas/teletrabajo/models/work.model';

import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { LoaderService } from '@app/core/services/loader.service';

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
  constructor() {}

  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredUsers: any[] = [];
  selectedUserRegisters: any[] = [];
  selectedUserSubscriptions: any[] = [];

  showDetail = false;
  hasSearched: boolean = false;

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
  works: any[] = [];
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
  users: any[] = [];
  selectedUser: any = null;

  registers: any[] = [];
  allRegisters: any[] = [];

  subscriptions: any[] = [];
  allSubscriptions: any[] = [];

  // ===============================
  // COLUMNAS
  // ===============================
  displayedUsersColumns: string[] = ['fullName', 'rut', 'marks', 'actions'];
  displayedRegistersColumns = ['date', 'day', 'hour', 'type'];
  displayedSubscriptionsColumns = ['start', 'end', 'duration', 'state'];

  // ===============================
  // INIT
  // ===============================
  async ngOnInit() {
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');

    this.jefe.id = profile.id;
    this.jefe.fullName = profile.fullName;

    const currentYear = new Date().getFullYear();

    for (let i = currentYear; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.month = new Date().getMonth() + 1;
    this.year = new Date().getFullYear();

    this.onMonthYearChange();

    await this.cargarGrupo();
    //await this.search(); // ❌ AQUÍ ESTÁ EL PROBLEMA
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

      const [users, registers, subscribes, relaciones, works] =
        (await Promise.all([
          firstValueFrom(this.reportService.getUsers()),
          firstValueFrom(this.reportService.getRegisters()),
          firstValueFrom(this.reportService.getSubscribes()),
          firstValueFrom(this.usersGroupService.getAll()),
          firstValueFrom(this.workService.getAll()),
        ])) as any;

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
        const from = new Date(this.dateFrom);
        const to = new Date(this.dateTo);

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);
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
      this.allRegisters = filteredRegisters;

      this.allSubscriptions = subscribes.filter((s: any) =>
        idsJefatura.includes(s.user?.id),
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
          const from = new Date(this.dateFrom);
          const to = new Date(this.dateTo);

          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);

          const rawDate = w.createdAt || w.created_at;
          if (!rawDate) return false;

          const d = new Date(rawDate);

          return d >= from && d <= to;
        }

        return true;
      });
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
  selectUser(user: any): void {
    this.selectedUser = user;

    // 🔹 REGISTROS
    let userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id)
      .map((r: any, index: number) => ({
        ...r,
        type: r.type ?? (index % 2 === 0 ? 'ING' : 'SAL'),
        isVirtual: r.isVirtual ?? false,
      }));

    // 🔥 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = new Date(r.register_datetime);
        return d >= from && d <= to;
      });
    }

    // 🔹 SUSCRIPCIONES
    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    // 🔥 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);
          return start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // 🔹 ASIGNACIONES
    this.subscriptions = userSubscriptions.sort((a, b) => {
      const d1 = this.parseDateLocal(a.begin).getTime();
      const d2 = this.parseDateLocal(b.begin).getTime();

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
    const targetDate = new Date(register.register_datetime);
    targetDate.setHours(0, 0, 0, 0);

    this.selectedDay = targetDate;

    this.works = this.allWorks
      .filter((w: any) => {
        const rawDate = w.createdAt || w.created_at;
        if (!rawDate) return false;

        const d = new Date(rawDate);
        d.setHours(0, 0, 0, 0);

        return d.getTime() === targetDate.getTime();
      })
      .sort((a: any, b: any) => {
        return (
          new Date(a.createdAt || a.created_at).getTime() -
          new Date(b.createdAt || b.created_at).getTime()
        );
      });

    this.showDetail = true;
  }

  groupByDay(registers: any[], works: any[]) {
    const map = new Map<number, any>();

    // 🔵 REGISTROS
    registers.forEach((r) => {
      const d = new Date(r.register_datetime);
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

      const d = new Date(rawDate);
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
        const da = new Date(a.createdAt || a.created_at || 0).getTime();
        const db = new Date(b.createdAt || b.created_at || 0).getTime();
        return da - db;
      });

      day.totalActividades = day.actividades.length;
      day.tieneActividad = day.totalActividades > 0;
      day.totalRegistros = day.registros.length;

      day.estado = day.tieneActividad ? 'ok' : 'sin-actividad';

      // 🔥 SOLO PARA MOSTRAR
      day.dateLabel = this.formatDateCL(day.date);
    });

    // 🔥 ORDEN FINAL DESC (JEFATURA)
    return result.sort((a: any, b: any) => {
      return b.date.getTime() - a.date.getTime();
    });
  }

  parseDateCL(dateStr: string): Date {
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  // ===============================
  // 🧠 CORE (NO TOCAR)
  // ===============================
  generateFullRegisters(subs: any[], regs: any[]) {
    const result: any[] = [...regs];

    const from = this.dateFrom ? new Date(this.dateFrom) : null;
    const to = this.dateTo ? new Date(this.dateTo) : null;

    // 🔥 DEFINIR HOY UNA SOLA VEZ
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subs.forEach((s) => {
      let start = this.parseDateLocal(s.begin);
      let end = this.parseDateLocal(s.end);

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
        currentDay.setHours(0, 0, 0, 0);

        const ingreso = result.find((r) => {
          const rd = new Date(r.register_datetime);
          rd.setHours(0, 0, 0, 0);
          return rd.getTime() === currentDay.getTime() && r.type === 'ING';
        });

        const salida = result.find((r) => {
          const rd = new Date(r.register_datetime);
          rd.setHours(0, 0, 0, 0);
          return rd.getTime() === currentDay.getTime() && r.type === 'SAL';
        });

        const isPastDay = currentDay.getTime() < today.getTime();

        // 🔥 SOLO DÍAS PASADOS
        if (isPastDay) {
          const baseDate = new Date(currentDay);
          baseDate.setHours(12, 0, 0, 0); // 🔥 hora neutra

          if (!ingreso) {
            result.push({
              register_datetime: new Date(baseDate),
              type: 'ING',
              isVirtual: true,
            });
          }

          if (!salida) {
            result.push({
              register_datetime: new Date(baseDate),
              type: 'SAL',
              isVirtual: true,
            });
          }
        }
      }
    });

    return result.sort((a, b) => {
      const d1 = new Date(a.register_datetime).getTime();
      const d2 = new Date(b.register_datetime).getTime();

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
    const d = new Date(date);

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

    const start = new Date(s.begin);
    const end = new Date(s.end);

    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  getEstado(s: any): string {
    if (!s?.begin || !s?.end) return 'pendiente';

    const today = new Date();
    const start = new Date(s.begin);
    const end = new Date(s.end);

    if (today < start) return 'pendiente';
    if (today >= start && today <= end) return 'vigente';
    return 'vencido';
  }

  onDateChange(type: 'from' | 'to'): void {
    if (!this.dateFrom && !this.dateTo) return;

    // 🔥 SI CAMBIA DESDE
    if (type === 'from' && this.dateFrom) {
      const from = new Date(this.dateFrom);

      this.month = from.getMonth() + 1;
      this.year = from.getFullYear();

      from.setHours(0, 0, 0, 0);
      this.dateFrom = from;
    }

    // 🔥 SI CAMBIA HASTA
    if (type === 'to' && this.dateTo) {
      const to = new Date(this.dateTo);

      to.setHours(23, 59, 59, 999);
      this.dateTo = to;
    }

    // 🔥 LIMPIAR RESULTADOS (UX PRO)
    this.showDetail = false;
    this.days = [];
    this.registers = [];
  }

  clearFilters(): void {
    const now = new Date();

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
    const d = new Date(date);

    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('es-CL', { weekday: format }).replace('.', '');
  }

  isSameDay(date1: string | Date, date2: string | Date | null): boolean {
    if (!date1 || !date2) return false;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }

  formatTimeCL(value: any): string {
    // 🔥 REGISTROS
    if (value && typeof value === 'object' && 'isVirtual' in value) {
      if (value.isVirtual) return '00:00';

      const d = this.safeDate(value.register_datetime);

      if (!d) return '00:00'; // 🔥 fallback seguro

      return d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    // 🔥 FECHA DIRECTA
    const d = this.safeDate(value);

    if (!d) return '00:00'; // 🔥 fallback

    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  safeDate(value: any): Date | null {
    if (!value) return null;

    // 🔥 si ya es Date
    if (value instanceof Date) return value;

    // 🔥 intentar convertir
    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
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
    this.selectedUser = null;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];

    this.works = [];
    this.days = [];
    this.selectedDay = null;

    this.allRegisters = [];
    this.allSubscriptions = [];
    this.allWorks = [];

    this.showDetail = false;
  }

  printUser(user: any): void {
    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    // 🔹 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = new Date(r.register_datetime);
        return !isNaN(d.getTime()) && d >= from && d <= to;
      });

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);
          return start && end && start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // 🔥 GENERAR COMPLETOS (reales + virtuales)
    const fullRegisters = this.generateFullRegisters(
      userSubscriptions,
      userRegisters,
    );

    console.log('ANTES:', fullRegisters);

    // 🔥 NORMALIZAR FECHAS
    const safeRegisters = fullRegisters
      .map((r: any) => {
        const d = new Date(r.register_datetime);

        return {
          ...r,
          register_datetime: !isNaN(d.getTime()) ? d : null,

          // 🔥 NORMALIZACIÓN CLAVE
          type: r.type ?? r.state, // ← 💣 AQUÍ
          isVirtual: r.isVirtual ?? false, // ← 💣 AQUÍ
        };
      })
      .filter((r: any) => r.register_datetime !== null);

    console.log('NORMALIZADOS:', safeRegisters);

    // 🔥 TIPADO CORRECTO (AQUÍ SE ARREGLA TU ERROR TS)
    const grouped: Record<string, any[]> = safeRegisters.reduce(
      (acc: Record<string, any[]>, r: any) => {
        const key = this.formatDateCL(r.register_datetime);

        if (!acc[key]) acc[key] = [];

        acc[key].push(r);
        return acc;
      },
      {},
    );

    // 🔥 ELIMINAR VIRTUALES SI HAY REALES
    const filtered = Object.values(grouped).flatMap((day) => {
      const real = day.filter((r) => !r.isVirtual);
      const virtual = day.filter((r) => r.isVirtual);

      // 🔥 si NO hay reales → deja todo (día completamente virtual)
      if (real.length === 0) {
        return day;
      }

      // 🔥 hay reales → conservar reales
      const result = [...real];

      // 🔥 detectar tipos presentes
      const hasIngreso = real.some((r) => r.type === 'ING');
      const hasSalida = real.some((r) => r.type === 'SAL');

      // 🔥 completar con virtual SOLO si falta
      if (!hasIngreso) {
        const vIng = virtual.find((r) => r.type === 'ING');
        if (vIng) result.push(vIng);
      }

      if (!hasSalida) {
        const vSal = virtual.find((r) => r.type === 'SAL');
        if (vSal) result.push(vSal);
      }

      return result;
    });

    console.log('FILTRADOS:', filtered);

    // 🔥 DATA FINAL
    const data = filtered.map((r: any) => ({
      fecha: this.formatDateCL(r.register_datetime),
      dia: this.getDayOfWeek(r.register_datetime),
      hora: this.formatTimeCL(r),
      tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
    }));

    // 🔥 GENERAR PDF
    const html = this.teleworkReport.generateReport({
      userName: user.fullName,
      rut: user.rut,
      registers: data,
    });

    this.teleworkReport.printPdf(html);
  }

  exportUser(user: any): void {
    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    // 🔹 FILTRO POR RANGO
    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userRegisters = userRegisters.filter((r: any) => {
        const d = new Date(r.register_datetime);
        return !isNaN(d.getTime()) && d >= from && d <= to;
      });

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);
          return start && end && start <= to && end >= from;
        })
        .map((s: any) => {
          const start = this.parseDateLocal(s.begin);
          const end = this.parseDateLocal(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    // 🔥 GENERAR COMPLETOS
    const fullRegisters = this.generateFullRegisters(
      userSubscriptions,
      userRegisters,
    );

    // 🔥 NORMALIZAR Y FILTRAR
    // 🔥 NORMALIZAR + UNIFICAR CAMPOS
    const safeRegisters = fullRegisters
      .map((r: any) => {
        const d = new Date(r.register_datetime);

        return {
          ...r,
          register_datetime: !isNaN(d.getTime()) ? d : null,
          type: r.type ?? r.state, // 🔥 clave
          isVirtual: r.isVirtual ?? false, // 🔥 clave
        };
      })
      .filter((r: any) => r.register_datetime !== null);

    if (!safeRegisters.length) {
      this.showWarning('El usuario no tiene registros válidos en el período');
      return;
    }

    // 🔥 AGRUPAR POR DÍA
    const grouped: Record<string, any[]> = safeRegisters.reduce(
      (acc: Record<string, any[]>, r: any) => {
        const key = this.formatDateCL(r.register_datetime);

        if (!acc[key]) acc[key] = [];
        acc[key].push(r);

        return acc;
      },
      {},
    );

    // 🔥 LÓGICA INTELIGENTE (IGUAL QUE PRINT)
    const filtered = Object.values(grouped).flatMap((day) => {
      const real = day.filter((r) => !r.isVirtual);
      const virtual = day.filter((r) => r.isVirtual);

      if (real.length === 0) {
        return day; // todo virtual
      }

      const result = [...real];

      const hasIngreso = real.some((r) => r.type === 'ING');
      const hasSalida = real.some((r) => r.type === 'SAL');

      if (!hasIngreso) {
        const vIng = virtual.find((r) => r.type === 'ING');
        if (vIng) result.push(vIng);
      }

      if (!hasSalida) {
        const vSal = virtual.find((r) => r.type === 'SAL');
        if (vSal) result.push(vSal);
      }

      return result;
    });

    // 🔥 DATA FINAL
    const data = filtered.map((r: any) => ({
      Fecha: this.formatDateCL(r.register_datetime),
      Día: this.getDayOfWeek(r.register_datetime),
      Hora: this.formatTimeCL(r),
      Tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, `Reporte_${user.fullName}.xlsx`);
  }

  formatDateShortCL(date: any): string {
    const d = this.toLocalDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}`; // 🔥 SOLO dd/MM
  }

    toLocalDate(date: any): Date {
    if (!date) return new Date();

    // 🔥 si viene ISO (backend)
    if (typeof date === 'string' && date.includes('T')) {
      const [y, m, d] = date.split('T')[0].split('-');
      return new Date(+y, +m - 1, +d);
    }

    return new Date(date);
  }

  parseDateLocal(date: string | Date): Date {
    if (!date) return null as any;

    // 🔹 si ya es Date
    if (date instanceof Date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // 🔹 caso 1: formato YYYY-MM-DD (SIN zona)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      return new Date(y, m - 1, d); // 🔥 local puro
    }

    // 🔹 caso 2: viene con Z (UTC)
    const d = new Date(date);

    return new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 🔥 lo baja a día local correcto
  }

  onFilterFocus(): void {
    this.showDetail = false;
    this.days = [];
    this.registers = [];
  }
}

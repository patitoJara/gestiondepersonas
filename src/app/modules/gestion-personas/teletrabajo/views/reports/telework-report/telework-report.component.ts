import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TeleworkReportService } from '@app/modules/gestion-personas/teletrabajo/services/telework-report.service';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';

import { LoaderService } from '@app/core/services/loader.service';
import { WorkService } from '@app/modules/gestion-personas/teletrabajo/services/work.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
} from 'rxjs/operators';
import { of } from 'rxjs';

import { filterByRutOrName } from '@app/shared/utils/filter.util';

@Component({
  selector: 'app-telework-report',
  standalone: true,
  templateUrl: './telework-report.component.html',
  styleUrls: ['./telework-report.component.scss'],
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
  ],
})
export class TeleworkReportComponent {
  private dialog = inject(MatDialog);
  private reportService = inject(TeleworkReportService);
  private teleworkReport = inject(TeleworkReportPrintService);
  private loader = inject(LoaderService);
  private workService = inject(WorkService);
  private usersGroupService = inject(UsersGroupService);
  private usersService = inject(UsersService);
  private prefixCache = new Map<string, any[]>();
  private currentPrefix = '';

  // ===============================
  // FILTROS
  // ===============================

  hasSearched: boolean = false;

  userSearch = new FormControl('');

  isFiltering: boolean = false;

  rut: string = '';
  rutInvalido = false;
  loading = false;

  month: number | null = null;
  year: number | null = null;

  groups: any[] = [];
  allGroups: any[] = [];
  selectedGroup: any = null;

  displayedGroupsColumns = ['name', 'jefatura', 'count'];

  allWorks: any[] = [];
  works: any[] = [];
  selectedDay: Date | null = null;

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

  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  // ===============================
  // RESULTADOS
  // ===============================

  filteredGroups: any[] = [];
  filteredUsers: any[] = [];
  noResults = false;

  users: any[] = [];
  allUsers: any[] = [];
  selectedUser: any = null;

  registers: any[] = [];
  allRegisters: any[] = [];

  subscriptions: any[] = [];
  allSubscriptions: any[] = [];

  usersWithoutMarks: any[] = [];
  years: number[] = [];

  // ===============================
  // COLUMNAS TABLAS
  // ===============================

  displayedUsersColumns = ['fullName', 'rut', 'marks', 'actions'];
  displayedWarningColumns: string[] = ['fullName', 'rut', 'marks'];

  displayedRegistersColumns = [
    'date',
    'day',
    'hour',
    'type', // 👈 nueva
  ];

  displayedSubscriptionsColumns = ['start', 'end', 'duration', 'state'];

  ngOnInit(): void {
    this.initDates();
    this.initYears();
    this.initUsersState();
    this.setupUserFilter();
  }

  private initDates(): void {
    const now = new Date();

    this.month = now.getMonth() + 1;
    this.year = now.getFullYear();

    this.onMonthYearChange();
    this.syncMonthYearFromDate();
  }

  private initYears(): void {
    const currentYear = new Date().getFullYear();

    this.years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  }

  private initUsersState(): void {
    this.filteredUsers = [];
    this.users = [];
  }

  private clearInitialState(): void {
    this.clearResults();
  }

  // ===============================
  // BUSCAR
  // ===============================
  trackByUser(index: number, user: any) {
    return user.id;
  }

  async search() {
    this.hasSearched = false;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.allWorks = [];
    this.works = [];

    // ===============================
    // 🔥 RANGO FECHAS aca debiera limpiar
    // ===============================
    let from: Date | null = null;
    let to: Date | null = null;

    if (this.dateFrom && this.dateTo) {
      from = this.parseDateCL(this.dateFrom);
      from.setHours(0, 0, 0, 0);

      to = this.parseDateCL(this.dateTo);
      to.setHours(23, 59, 59, 999);
    }

    try {
      this.loading = true;
      this.hasSearched = true;

      const [users, registers, subscribes, works, usersGroups] =
        await Promise.all([
          firstValueFrom(this.reportService.getUsers()),
          firstValueFrom(this.reportService.getRegisters()),
          firstValueFrom(this.reportService.getSubscribes()),
          firstValueFrom(this.workService.getAll()),
          firstValueFrom(this.usersGroupService.getAll()),
        ]);

      const fixDate = (dateStr: any): Date | null => {
        if (!dateStr) return null;

        const [datePart] = String(dateStr).split('T');
        const [year, month, day] = datePart.split('-').map(Number);

        return new Date(year, month - 1, day); // 🔥 fecha local correcta
      };

      this.allSubscriptions = subscribes.map((s: any) => ({
        ...s,
        begin: fixDate(s.begin),
        end: fixDate(s.end),
      }));

      // ===============================
      // 🔥 LIMPIAR DATOS
      // ===============================
      const cleanRegisters = registers.filter(
        (r: any) => !r.deletedAt && !r.user?.deletedAt,
      );

      const cleanSubscribes = subscribes.filter(
        (s: any) => !s.deletedAt && !s.user?.deletedAt,
      );

      const cleanWorks = works.filter((w: any) => {
        if (w.deletedAt) return false;
        if (w.status === 'DRAFT') return false;
        if (w.state === 'BORRADOR') return false;
        if (w.isDraft === true) return false;
        return true;
      });

      // ===============================
      // 🔥 FILTRO POR FECHA
      // ===============================
      this.allRegisters = cleanRegisters.filter((r: any) => {
        if (!from || !to) return true;

        const d = this.parseDateCL(r.register_datetime);
        return d >= from && d <= to;
      });

      this.allSubscriptions = subscribes.map((s: any) => {
        const fixDate = (dateStr: string) => {
          const [datePart] = String(dateStr).split('T');
          const [y, m, d] = datePart.split('-').map(Number);
          return new Date(y, m - 1, d);
        };

        return {
          ...s,
          begin: fixDate(s.begin),
          end: fixDate(s.end),
        };
      });

      this.allWorks = cleanWorks.filter((w: any) => {
        if (!from || !to) return true;

        const d = new Date(w.createdAt || w.created_at);
        return d >= from && d <= to;
      });

      // 👇 sincroniza
      this.registers = [...this.allRegisters];
      this.subscriptions = [...this.allSubscriptions];
      this.works = [...this.allWorks];

      // 🔥 DEBUG AQUÍ
      console.log('REGISTROS REALES:', this.allRegisters);
      console.log('SUSCRIPCIONES:', this.allSubscriptions);

      // ===============================
      // 🔥 MAPA USER → GROUP
      // ===============================
      const userGroupMap = new Map<number, any>();

      usersGroups.forEach((ug: any) => {
        if (ug.deletedAt) return;
        if (!ug.user || !ug.group) return;

        const jefe = ug.group.user
          ? [ug.group.user.firstName, ug.group.user.firstLastName]
              .filter(Boolean)
              .join(' ')
          : null;

        userGroupMap.set(ug.user.id, {
          groupId: ug.group.id,
          groupName: ug.group.name,
          jefatura: jefe,
        });
      });

      // ===============================
      // 🔥 CONTAR MARCAS (CLAVE)
      // ===============================
      const userMap = new Map<number, number>();

      this.allRegisters.forEach((r: any) => {
        const uid = r.user?.id;
        if (!uid) return;
        userMap.set(uid, (userMap.get(uid) || 0) + 1);
      });

      // ===============================
      // 🔥 USERS
      // ===============================
      this.users = users
        .filter((u: any) => {
          const name = [
            u.firstName,
            u.secondName,
            u.firstLastName,
            u.secondLastName,
          ]
            .filter(Boolean)
            .join(' ')
            .toUpperCase();

          return !(
            name.includes('ADMIN') ||
            name.includes('OPERADOR') ||
            name.includes('SUPERVISOR') ||
            name.includes('JEFATURA')
          );
        })
        .map((u: any) => {
          const marks = userMap.get(u.id) || 0;

          const fullName = [
            u.firstName,
            u.secondName,
            u.firstLastName,
            u.secondLastName,
          ]
            .filter(Boolean)
            .join(' ');

          const groupData = userGroupMap.get(u.id);

          return {
            id: u.id,
            fullName,
            rut: u.rut,
            marks,
            groupId: groupData?.groupId || null,
            group: groupData
              ? {
                  name: groupData.groupName,
                  jefatura: groupData.jefatura,
                }
              : null,
          };
        });

      this.allUsers = [...this.users];
      this.selectedGroup = null;

      // ===============================
      // 🔥 GRUPOS
      // ===============================
      const groupMap = new Map<number, any>();

      this.allUsers.forEach((u: any) => {
        const groupId = u.groupId || -1;

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: u.group?.name || 'Sin grupo',
            jefatura: u.group?.jefatura || null,
            count: 0,
          });
        }

        groupMap.get(groupId).count++;
      });

      this.groups = Array.from(groupMap.values()).sort((a: any, b: any) => {
        if (a.id === -1) return -1;
        if (b.id === -1) return 1;
        return b.count - a.count;
      });

      this.allGroups = [...this.groups];
    } catch (err) {
      console.error(err);
      this.showWarning('Error consultando información');
    } finally {
      this.loading = false;
    }
  }

  private rebuildGroups(users: any[]) {
    const groupMap = new Map<number, any>();

    users.forEach((u: any) => {
      const groupId = u.groupId || -1;

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          name: u.group?.name || 'Sin grupo',
          jefatura: u.group?.jefatura || null,
          count: 0,
        });
      }

      groupMap.get(groupId).count++;
    });

    this.groups = Array.from(groupMap.values())
      .filter((g: any) => g.count > 0) // 🔥 evita vacíos
      .sort((a: any, b: any) => {
        if (a.id === -1) return -1;
        if (b.id === -1) return 1;
        return b.count - a.count;
      });
  }

  selectGroup(group: any) {
    this.selectedGroup = group;

    // 🔥 usa base correcta según búsqueda
    const hasSearch =
      (this.userSearch.value || '').toString().trim().length > 0;

    const base = hasSearch ? this.filteredUsers : this.allUsers;

    if (group.id === -1) {
      this.users = base.filter((u: any) => !u.groupId);
    } else {
      this.users = base.filter((u: any) => u.groupId === group.id);
    }

    this.selectedUser = null;
    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;
  }

  isWorkValid(w: any): boolean {
    if (w.deletedAt) return false;
    if (w.status === 'DRAFT') return false;
    if (w.state === 'BORRADOR') return false;
    if (w.isDraft === true) return false;

    return true;
  }

  // ===============================
  // LIMPIAR FILTROS
  // ===============================

  clearFilters(): void {
    this.hasSearched = false;

    this.rut = '';
    this.setCurrentMonthYear();
    this.dateFrom = null;
    this.dateTo = null;

    this.users = [...this.allUsers];
    this.groups = [...this.allGroups];

    this.userSearch.setValue('');

    this.registers = [];
    this.subscriptions = [];
    this.selectedUser = null;

    this.works = [];
    this.selectedDay = null;
  }

  onSearchFocus(): void {
    // 🔥 limpiar filtro
    this.userSearch.setValue('');

    // 🔥 limpiar resultados de búsqueda
    this.filteredUsers = [];
    this.filteredGroups = [];
    this.noResults = false;

    // 🔥 reset de navegación
    this.selectedGroup = null;
    this.selectedUser = null;

    // 🔥 limpiar detalle
    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;
  }

  setCurrentMonthYear() {
    const today = new Date();
    this.month = today.getMonth() + 1;
    this.year = today.getFullYear();
  }

  selectUser(user: any): void {
    console.log('USER:', user);

    this.selectedUser = user;

    // limpiar vista
    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;

    // 🔥 validar datos base
    if (!this.allSubscriptions?.length) {
      console.warn('⏳ Subs no cargadas aún');
      return;
    }

    // ===============================
    // 🔹 REGISTROS (usuario + fecha)
    // ===============================
    const userRegisters = this.allRegisters
      .filter((r: any) => {
        const regUserId = r.user?.id ?? r.userId ?? r.usuarioId ?? r.user_id;
        if (Number(regUserId) !== Number(user.id)) return false;

        const d = new Date(r.register_datetime);

        return (
          (!this.dateFrom || d >= this.dateFrom) &&
          (!this.dateTo || d <= this.dateTo)
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.register_datetime).getTime() -
          new Date(b.register_datetime).getTime(),
      )
      .map((r: any) => ({
        ...r,
        type: r.type || r.state,
        isVirtual: false,
      }));

    console.log('REGISTROS FILTRADOS:', userRegisters);

    // ===============================
    // 🔹 SUBS (SOLO por usuario)
    // ===============================
    console.log('SUBS RAW:', this.allSubscriptions);
    const userSubscriptions = (this.allSubscriptions || [])
      .filter((s: any) => {
        const subUserId = s.user?.id ?? s.userId ?? s.usuarioId ?? s.user_id;
        return Number(subUserId) === Number(user.id);
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.begin).getTime();
        const dateB = new Date(b.begin).getTime();

        return dateB - dateA; // 🔥 DESC
      });

    this.subscriptions = userSubscriptions;

    console.log(
      'ORDEN FINAL:',
      userSubscriptions.map((s) => s.begin.toLocaleDateString('es-CL')),
    );

    // ===============================
    // 🔥 SIN SUBS → mostrar reales
    // ===============================
    if (!userSubscriptions.length) {
      console.warn('⚠️ Usuario sin suscripciones');
      this.registers = userRegisters;
      return;
    }

    // ===============================
    // 🔥 GENERAR (virtuales + reales)
    // ===============================
    let finalRegisters = this.generateFullRegisters(
      userSubscriptions,
      userRegisters,
    );

    // ===============================
    // 🔥 FILTRO FINAL (ÚNICO)
    // ===============================
    finalRegisters = finalRegisters.filter((r: any) => {
      const d = new Date(r.register_datetime);

      return (
        (!this.dateFrom || d >= this.dateFrom) &&
        (!this.dateTo || d <= this.dateTo)
      );
    });

    this.registers = finalRegisters;

    console.log('FINAL REGISTERS:', this.registers);
  }

  selectDay(date: any): void {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    this.selectedDay = targetDate;

    this.works = this.allWorks
      .filter((w: any) => {
        const d = new Date(w.createdAt || w.created_at);
        d.setHours(0, 0, 0, 0);

        const isUser =
          w.user?.id === this.selectedUser?.id ||
          w.userId === this.selectedUser?.id;

        return isUser && d.getTime() === targetDate.getTime();
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.createdAt || a.created_at).getTime() -
          new Date(b.createdAt || b.created_at).getTime(),
      );
  }

  isSameDay(date1: any, date2: any): boolean {
    if (!date1 || !date2) return false;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
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

  normalizeDate(date: any): Date {
    return this.parseDateCL(date);
  }

  formatDateCL(date: any): string {
    const d = this.toLocalDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  formatDateShortCL(date: any): string {
    const d = this.toLocalDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}`; // 🔥 SOLO dd/MM
  }

  parseDateCL(date: any): Date {
    if (!date) return new Date();

    // 🔥 ISO del backend → cortar directo
    if (typeof date === 'string' && date.includes('T')) {
      const [y, m, d] = date.split('T')[0].split('-');
      return new Date(+y, +m - 1, +d);
    }

    // dd/mm/yyyy
    if (typeof date === 'string' && date.includes('/')) {
      const parts = date.split('/');
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    }

    // datepicker
    if (date instanceof Date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    return new Date(date);
  }

  showMessage(title: string, message: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: title,
        message: message,
        confirmText: 'Aceptar',
        cancelText: '',
        icon: 'info',
        color: 'primary',
      },
    });
  }

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Atención',
        message: message,
        confirmText: 'Aceptar',
        cancelText: '',
        icon: 'warning',
        color: 'warn',
      },
    });
  }

  checkSubscriptionsWithoutMarks(): any[] {
    const alerts: any[] = [];

    this.allSubscriptions.forEach((s: any) => {
      if (!s.active) return;

      const start = this.parseDateCL(s.start_date);
      const end = this.parseDateCL(s.end_date);

      const missingDays: string[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const current = new Date(d);
        current.setHours(0, 0, 0, 0);

        const hasMark = this.allRegisters.some((r: any) => {
          const rd = new Date(r.register_datetime);
          rd.setHours(0, 0, 0, 0);

          return (
            (r.user?.id === s.user?.id || r.userId === s.userId) &&
            rd.getTime() === current.getTime()
          );
        });

        if (!hasMark) {
          missingDays.push(this.formatDateCL(current));
        }
      }

      if (missingDays.length > 0) {
        alerts.push({
          user: s.user,
          days: missingDays,
        });
      }
    });

    return alerts;
  }

  onMonthYearChange(): void {
    this.hasSearched = false;

    // 🔥 solo actúa cuando ambos existen
    if (this.month && this.year) {
      const from = new Date(this.year, this.month - 1, 1);
      from.setHours(0, 0, 0, 0);

      const to = new Date(this.year, this.month, 0);
      to.setHours(23, 59, 59, 999);

      this.dateFrom = from;
      this.dateTo = to;
    }
  }

  validateRange(): void {
    if (!this.dateFrom || !this.dateTo) return;

    if (this.dateFrom > this.dateTo) {
      this.dateTo = new Date(this.dateFrom);
      this.dateTo.setHours(23, 59, 59, 999);
    }
  }

  getDurationDays(s: any): number {
    const start = new Date(s.begin);
    const end = new Date(s.end);

    const diff = end.getTime() - start.getTime();

    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  isCurrentlyActive(s: any): boolean {
    const today = this.parseDateCL(this.getToday());
    today.setHours(0, 0, 0, 0);

    const start = new Date(s.begin);
    start.setHours(0, 0, 0, 0);

    const end = new Date(s.end);
    end.setHours(0, 0, 0, 0);

    return today >= start && today <= end;
  }

  getEstado(s: any): 'pendiente' | 'vigente' | 'vencido' {
    const today = this.parseDateCL(this.getToday());
    today.setHours(0, 0, 0, 0);

    const start = new Date(s.begin);
    start.setHours(0, 0, 0, 0);

    const end = new Date(s.end);
    end.setHours(0, 0, 0, 0);

    if (today < start) return 'pendiente';
    if (today > end) return 'vencido';
    return 'vigente';
  }

  async generateReport(user: any, mode: 'print' | 'preview' = 'print') {
    try {
      this.loader.show();

      this.selectUser(user);

      const data = this.registers.map((r: any) => ({
        fecha: this.formatDateCL(r.register_datetime),
        dia: this.getDayOfWeek(r.register_datetime),
        hora: this.formatTimeCL(r.register_datetime, r.isVirtual),
        tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
      }));

      const html = this.teleworkReport.generateReport({
        userName: user.fullName,
        rut: user.rut,
        registers: data,
      });

      if (mode === 'print') {
        this.teleworkReport.printPdf(html);
      }
    } catch (error) {
      console.error(error);
      this.showWarning('Error generando reporte');
    } finally {
      this.loader.hide();
    }
  }

  getToday(): Date {
    return new Date();
  }

  exportUser(user: any) {
    this.selectUser(user);
    this.works = [];
    this.selectedDay = null;

    const data = this.generateFullRegisters(
      this.subscriptions,
      this.allRegisters.filter(
        (r) => r.user?.id === user.id || r.userId === user.id,
      ),
    ).map((r: any) => ({
      Fecha: this.formatDateCL(r.register_datetime),
      Día: this.getDayOfWeek(r.register_datetime),
      Hora: this.formatTimeCL(r.register_datetime, r.isVirtual),
      Tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marcas');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, `reporte_${user.fullName}.xlsx`);
  }

  formatTimeCL(date: any, isVirtual?: boolean): string {
    if (isVirtual) return '00:00';

    const d = new Date(date); // aquí sí, porque hora real

    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');

    return `${h}:${m}`;
  }

  formatDateTimeCL(date: any) {
    const d = new Date(date);

    return {
      fecha: d.toLocaleDateString('es-CL'),
      hora: d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
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

  trackByFn(index: number, item: any) {
    return item.register_datetime + '_' + item.type;
  }

  printUser(user: any) {
    try {
      this.loader.show();

      this.selectUser(user);

      const data = this.registers.map((r: any) => ({
        fecha: this.formatDateCL(r.register_datetime),
        dia: this.getDayOfWeek(r.register_datetime),
        hora: this.formatTimeCL(r.register_datetime, r.isVirtual),
        tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
      }));

      const html = this.teleworkReport.generateReport({
        userName: user.fullName,
        rut: user.rut,
        registers: data,
      });

      this.teleworkReport.printPdf(html);
    } catch (error) {
      console.error(error);
      this.showWarning('Error generando reporte');
    } finally {
      this.loader.hide();
    }
  }

  onMonthFocus(): void {
    this.hasSearched = false; // 🔥 AGREGAR
    this.dateFrom = null;
    this.dateTo = null;
    this.clearResults(); // 🔥 limpieza completa
  }

  syncMonthYearFromDate(): void {
    if (!this.dateFrom) return;

    const d = new Date(this.dateFrom);

    this.month = d.getMonth() + 1; // 🔥 1-12
    this.year = d.getFullYear();
  }

  onDateChange(type: 'from' | 'to'): void {
    this.hasSearched = false;

    if (type === 'from' && this.dateFrom) {
      const from = new Date(this.dateFrom);
      from.setHours(0, 0, 0, 0);
      this.dateFrom = from;

      if (!this.dateTo) {
        const to = new Date(from);
        to.setHours(23, 59, 59, 999);
        this.dateTo = to;
      }

      this.syncMonthYearFromDate();
    }

    if (type === 'to' && this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      this.dateTo = to;

      if (!this.dateFrom) {
        const from = new Date(to);
        from.setHours(0, 0, 0, 0);
        this.dateFrom = from;

        this.syncMonthYearFromDate();
      }
    }

    this.validateRange();
  }

  clearResults(): void {
    this.selectedUser = null;
    this.selectedGroup = null;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];

    this.works = [];
    this.selectedDay = null;
  }

  // ===============================
  // DÍA DE LA SEMANA
  // ===============================

  getDayOfWeek(date: any, mode: 'short' | 'long' = 'long'): string {
    const short = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const long = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    const d = this.toLocalDate(date);

    return mode === 'short' ? short[d.getDay()] : long[d.getDay()];
  }

  getDayShort(date: any): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const d = this.toLocalDate(date);
    return days[d.getDay()];
  }

  formatRutInput(value: string): string {
    let limpio = value.replace(/[^0-9kK]/g, '');

    if (limpio.length < 2) return limpio;

    let cuerpo = limpio.slice(0, -1);
    let dv = limpio.slice(-1);

    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return cuerpo + '-' + dv.toUpperCase();
  }

  private setupUserFilter() {
    this.userSearch.valueChanges
      .pipe(
        debounceTime(300),

        map((value: any) => {
          if (typeof value === 'string') return value;
          return value?.fullName ?? '';
        }),

        distinctUntilChanged(),

        switchMap((term: string) => {
          const clean = term.trim().toLowerCase();

          if (clean.length < 3) {
            return of([]);
          }

          const prefix = clean.substring(0, 3);

          // 🔥 SI CAMBIA PREFIJO → IR AL BACKEND
          if (prefix !== this.currentPrefix) {
            this.currentPrefix = prefix;

            return this.usersService.searchUsers(prefix).pipe(
              map((resp: any) => {
                const users = resp.data || resp.content || resp;

                const mapped = (users || []).map((u: any) => ({
                  id: u.id,
                  fullName: [
                    u.firstName,
                    u.secondName,
                    u.firstLastName,
                    u.secondLastName,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  rut: u.rut,
                }));

                this.prefixCache.set(prefix, mapped);
                return this.filterLocal(mapped, clean);
              }),
            );
          }

          // 🔥 MISMO PREFIJO → FILTRO LOCAL
          const cached = this.prefixCache.get(prefix) || [];
          return of(this.filterLocal(cached, clean));
        }),
      )
      .subscribe((users: any[]) => {
        this.filteredUsers = users;
      });
  }

  private filterLocal(users: any[], term: string) {
    return users.filter((u: any) => {
      const full = `${u.fullName} ${u.rut}`.toLowerCase();
      return full.includes(term);
    });
  }

  selectUserFromSearch(user: any) {
    if (!user) return;
    console.log('ALL SUBSCRIPTIONS:', this.allSubscriptions);
    this.selectedUser = user;
    this.selectUser(user);
  }

  limpiarBusqueda() {
    this.userSearch.setValue('');

    this.filteredUsers = [];
    this.users = [...this.allUsers];
    this.groups = [...this.allGroups];

    this.selectedUser = null;

    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;
  }

  displayUser(user: any): string {
    return user ? `${user.fullName} (${user.rut})` : '';
  }

  generateFullRegisters(subs: any[], regs: any[]) {
    const result: any[] = [];

    const mapByDay = new Map<string, any[]>();

    // 🔹 AGRUPAR REGISTROS REALES POR DÍA
    regs.forEach((r) => {
      const date = this.parseDateTime(r.register_datetime);
      const key = this.getKeyFromDate(date);

      if (!mapByDay.has(key)) mapByDay.set(key, []);

      mapByDay.get(key)!.push({
        ...r,
        register_datetime: date,
        type: r.type || r.state,
        isVirtual: false,
      });
    });

    const usedDays = new Set<string>();

    // 🔹 HOY NORMALIZADO
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔹 RECORRER SUSCRIPCIONES
    subs.forEach((s: any) => {
      // 🔥 FIX CRÍTICO (FECHAS)
      const start = this.parseDateLocal(s.begin);
      const end = this.parseDateLocal(s.end);

      if (!start || !end) return;

      let current = new Date(start);
      const endDate = new Date(end);

      while (current.getTime() <= endDate.getTime()) {
        const key = this.getKeyFromDate(current);

        // 🔥 EVITA DUPLICAR DÍAS ENTRE SUBS
        if (usedDays.has(key)) {
          current = new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() + 1,
          );
          continue;
        }

        usedDays.add(key);

        const dayRegs = mapByDay.get(key) || [];

        // 🔹 LIMPIAR DUPLICADOS POR TIPO
        const uniqueByType = new Map<string, any>();

        dayRegs.forEach((r) => {
          if (!uniqueByType.has(r.type)) {
            uniqueByType.set(r.type, r);
          }
        });

        const cleanedRegs = Array.from(uniqueByType.values());

        const hasIng = cleanedRegs.some((r) => r.type === 'ING');
        const hasSal = cleanedRegs.some((r) => r.type === 'SAL');

        // 🔹 AGREGAR REALES
        result.push(...cleanedRegs);

        const base = new Date(current);
        base.setHours(0, 0, 0, 0);

        const isPastDay = current < today;

        // 🔥 GENERAR VIRTUALES SOLO SI FALTAN
        if (isPastDay) {
          if (!hasIng) {
            result.push({
              register_datetime: new Date(base),
              type: 'ING',
              isVirtual: true,
            });
          }

          if (!hasSal) {
            result.push({
              register_datetime: new Date(base),
              type: 'SAL',
              isVirtual: true,
            });
          }
        }

        // 🔁 SIGUIENTE DÍA
        current = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1,
        );
      }
    });

    // 🔥 ORDEN FINAL PRO (ING → SAL)
    return result.sort((a, b) => {
      const d1 = a.register_datetime.getTime();
      const d2 = b.register_datetime.getTime();

      if (d1 !== d2) return d1 - d2;

      if (a.type === b.type) return 0;
      return a.type === 'ING' ? -1 : 1;
    });
  }

  parseDateLocal(date: string | Date): Date {
    if (!date) return null as any;

    if (date instanceof Date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    const clean = date.replace('Z', '');
    const d = new Date(clean);
    d.setHours(0, 0, 0, 0);

    return d;
  }

  parseDateCLOnlyDate(dateStr: any): Date {
    if (!dateStr) return null as any;

    const str = String(dateStr);
    const datePart = str.split('T')[0];

    const [year, month, day] = datePart.split('-').map(Number);

    // 🔥 crear fecha LOCAL SIN timezone
    return new Date(year, month - 1, day);
  }

  isSameOrBefore(a: Date, b: Date): boolean {
    return (
      a.getFullYear() < b.getFullYear() ||
      (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth()) ||
      (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() <= b.getDate())
    );
  }

  parseDateTime(date: any): Date {
    if (!date) return new Date();

    if (typeof date === 'string') {
      return new Date(date); // 🔥 mantiene hora real
    }

    if (date instanceof Date) {
      return new Date(date);
    }

    return new Date(date);
  }

  isSameOrBeforeDay(a: Date, b: Date): boolean {
    return (
      (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() <= b.getDate()) ||
      (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth()) ||
      a.getFullYear() < b.getFullYear()
    );
  }

  getKeyFromDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');

    return `${y}-${m}-${d}`; // 🔥 evita toISOString (bug clásico)
  }

  onFilterFocus() {
    const value = this.userSearch.value;

    if (typeof value === 'string' && value.trim() === '') {
      this.filteredUsers = [];
    }
  }

  async onBuscarClick(): Promise<void> {
    // 🔵 1. cargar datos primero
    await this.search();

    // 🔍 2. ver si hay texto
    const raw: any = this.userSearch.value;

    const term =
      typeof raw === 'string' ? raw.trim() : raw?.fullName?.trim() || '';

    // 🟡 3. SOLO si hay texto → filtrar
    if (term) {
      this.filterByName();
    } else {
      // 🔥 sin filtro → mostrar todo
      this.isFiltering = false;
      this.filteredUsers = [];
      this.filteredGroups = [];
    }
  }

  filterByName(): void {
    console.log('🟡 INICIO FILTRO');

    const raw: any = this.userSearch.value;
    console.log('👉 valor input:', raw);

    const term =
      typeof raw === 'string'
        ? raw.toLowerCase().trim()
        : raw?.fullName?.toLowerCase().trim() || '';

    console.log('👉 término normalizado:', term);

    // 🔥 SIN TEXTO → MOSTRAR TODO
    if (!term) {
      console.log('⚠️ término vacío → mostrar todo');

      this.isFiltering = false;
      this.filteredUsers = [];
      this.filteredGroups = [];
      this.noResults = false;

      return;
    }

    const matches = this.allUsers.filter((u: any) =>
      (u.fullName || '').toLowerCase().includes(term),
    );

    console.log('✅ matches encontrados:', matches.length);

    // 🔥 SOLO marcar noResults si hay texto
    this.noResults = matches.length === 0;

    // 🔴 SIN RESULTADOS
    if (this.noResults) {
      console.log('❌ NO HAY RESULTADOS');

      this.isFiltering = true;
      this.filteredUsers = [];
      this.filteredGroups = [];

      return;
    }

    // 🟢 CON RESULTADOS
    this.isFiltering = true;

    this.filteredUsers = matches;
    console.log('👤 filteredUsers:', this.filteredUsers);

    const groupIds = [...new Set(matches.map((u: any) => u.groupId))];

    this.filteredGroups = this.groups.filter((g: any) =>
      groupIds.includes(g.id),
    );

    console.log('🟦 filteredGroups:', this.filteredGroups);

    console.log('🟢 FIN FILTRO');
  }
}

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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TeleworkReportService } from '@app/modules/gestion-personas/teletrabajo/services/telework-report.service';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportPrintService } from  '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';

import { LoaderService } from '@app/core/services/loader.service';
import { WorkService } from  '@app/modules/gestion-personas/teletrabajo/services/work.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';

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

  // ===============================
  // FILTROS
  // ===============================

  hasSearched: boolean = false;

  userSearch = new FormControl('');
  filteredUsers: any[] = [];

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

  displayedUsersColumns: string[] = ['fullName', 'rut', 'activity'];
  displayedWarningColumns: string[] = ['fullName', 'rut', 'marks'];

  displayedRegistersColumns = [
    'date',
    'day',
    'hour',
    'type', // 👈 nueva
  ];

  displayedSubscriptionsColumns = ['start', 'end', 'duration', 'state'];

  async ngOnInit() {
    this.setupUserFilter();

    const currentYear = new Date().getFullYear();

    for (let i = currentYear; i <= currentYear + 10; i++) {
      this.years.push(i);
    }

    this.month = new Date().getMonth() + 1;
    this.year = new Date().getFullYear();

    // 🔥 CARGAR USUARIOS SOLO PARA AUTOCOMPLETE
    try {
      const users = await firstValueFrom(this.reportService.getUsers());

      this.allUsers = users.map((u: any) => ({
        id: u.id,
        fullName: [u.firstName, u.secondName, u.firstLastName, u.secondLastName]
          .filter(Boolean)
          .join(' '),
        rut: u.rut,
      }));

      this.filteredUsers = []; // 🔥 importante
    } catch (e) {
      console.error('Error cargando usuarios', e);
    }

    this.clearResults();
  }

  // ===============================
  // BUSCAR
  // ===============================

  async search() {
    this.hasSearched = false;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.allWorks = [];
    this.works = [];

    this.validarRut();

    if (this.rutInvalido) {
      this.showWarning('El RUT ingresado no es válido');
      return;
    }

    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      if (from > to) {
        this.showWarning('La fecha "Desde" no puede ser mayor que "Hasta"');
        return;
      }
    }

    const rutFiltro = this.rut
      ?.replace(/\./g, '')
      .replace('-', '')
      .toLowerCase();

      
    if (
      !this.month &&
      !this.year &&
      !this.dateFrom &&
      !this.dateTo &&
      !this.rut &&
      !this.selectedUser // 🔥 CLAVE
    ) {
      this.showWarning('Debe ingresar al menos un filtro');
      return;
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

      const selectedUserId = this.selectedUser?.id || null;

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

      let filteredRegisters = [...cleanRegisters];
      let filteredSubscribes = [...cleanSubscribes];

      // ===============================
      // 🔥 FILTRO FECHA
      // ===============================
      if (this.month && this.year) {
        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);
          return (
            d.getMonth() + 1 === this.month && d.getFullYear() === this.year
          );
        });
      }

      if (this.dateFrom && this.dateTo) {
        const from = new Date(this.dateFrom);
        from.setHours(0, 0, 0, 0);

        const to = new Date(this.dateTo);
        to.setHours(23, 59, 59, 999);

        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);
          return d >= from && d <= to;
        });

        filteredSubscribes = filteredSubscribes.filter((s: any) => {
          const start = new Date(s.begin);
          const end = new Date(s.end);
          return start <= to && end >= from;
        });
      }

      // ===============================
      // 🔥 FILTRO POR USUARIO (PRO)
      // ===============================
      if (selectedUserId) {
        filteredRegisters = filteredRegisters.filter(
          (r: any) =>
            r.user?.id === selectedUserId || r.userId === selectedUserId,
        );

        filteredSubscribes = filteredSubscribes.filter(
          (s: any) =>
            s.user?.id === selectedUserId || s.userId === selectedUserId,
        );
      }

      this.allRegisters = filteredRegisters;
      this.allSubscriptions = filteredSubscribes;
      this.allWorks = cleanWorks;

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
      // 🔥 CONTAR MARCAS
      // ===============================
      const userMap = new Map<number, number>();

      filteredRegisters.forEach((r: any) => {
        const uid = r.user?.id;
        if (!uid) return;
        userMap.set(uid, (userMap.get(uid) || 0) + 1);
      });

      // ===============================
      // 🔥 FILTRAR USUARIOS
      // ===============================
      let filteredUsers = [...users];

      if (this.rut) {
        filteredUsers = filteredUsers.filter((u: any) =>
          u.rut
            ?.replace(/\./g, '')
            .replace('-', '')
            .toLowerCase()
            .includes(rutFiltro),
        );
      }

      // ===============================
      // 🔥 ARMAR USUARIOS
      // ===============================
      this.users = filteredUsers
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
        })
        .filter((u: any) => {
          return filteredSubscribes.some(
            (s: any) => s.user?.id === u.id || s.userId === u.id,
          );
        });

      this.allUsers = [...this.users];
      this.users = [];
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
    const base = this.userSearch.value ? this.filteredUsers : this.allUsers;

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

    this.users = [];
    this.filteredUsers = [];  // 🔥 importante
    this.groups = [...this.allGroups]; // 🔥 restaurar grupos

    this.userSearch.setValue('');

    this.registers = [];
    this.subscriptions = [];
    this.selectedUser = null;

    this.works = [];
    this.selectedDay = null;
  }

  onSearchFocus(): void {
    this.filteredUsers = [...this.allUsers]; // 🔥 mostrar todo

    this.selectedGroup = null;
    this.selectedUser = null;

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
    this.selectedUser = user;

    this.registers = [];
    this.subscriptions = [];

    // 🔥 CLAVE: limpiar works y día seleccionado
    this.works = [];
    this.selectedDay = null;

    // ===============================
    // 🔹 REGISTROS
    // ===============================
    let userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id || r.userId === user.id)
      .sort(
        (a: any, b: any) =>
          new Date(a.register_datetime).getTime() -
          new Date(b.register_datetime).getTime(),
      );

    userRegisters = userRegisters.map((r: any, index: number) => ({
      ...r,
      type: r.type || (index % 2 === 0 ? 'ING' : 'SAL'),
      isVirtual: false,
    }));

    // ===============================
    // 🔥 RANGO
    // ===============================
    let from: Date | null = null;
    let to: Date | null = null;

    if (this.dateFrom && this.dateTo) {
      from = this.parseDateCL(this.dateFrom);
      from.setHours(0, 0, 0, 0);

      to = this.parseDateCL(this.dateTo);
      to.setHours(23, 59, 59, 999);
    } else if (this.month && this.year) {
      from = new Date(this.year, this.month - 1, 1);
      to = new Date(this.year, this.month, 0);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
    }

    // ===============================
    // 🔹 SUSCRIPCIONES
    // ===============================
    this.subscriptions = this.allSubscriptions.filter((s: any) => {
      const isUser = s.user?.id === user.id || s.userId === user.id;

      if (!isUser) return false;
      if (!from || !to) return true;

      const start = new Date(s.begin);
      const end = new Date(s.end);

      return start <= to && end >= from;
    });

    // ===============================
    // 🔹 REGISTROS COMPLETOS
    // ===============================
    this.registers = this.generateFullRegisters(
      this.subscriptions,
      userRegisters,
    );

    // 🚫 NO TOCAR WORKS AQUÍ
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

      const start = new Date(s.begin);
      const end = new Date(s.end);

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
    this.hasSearched = false; // 🔥 CLAVE
    if (!this.month || !this.year) {
      this.dateFrom = null;
      this.dateTo = null;
      return;
    }

    // primer día del mes
    this.dateFrom = new Date(this.year, this.month - 1, 1);

    // último día del mes
    this.dateTo = new Date(this.year, this.month, 0);
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

  generateFullRegisters(subscriptions: any[], registers: any[]) {
    const result = [...registers];

    const today = this.parseDateCL(this.getToday());

    // 🔥 rango activo SIEMPRE
    let from: Date | null = null;
    let to: Date | null = null;

    if (this.dateFrom && this.dateTo) {
      from = this.parseDateCL(this.dateFrom);
      to = this.parseDateCL(this.dateTo);
    } else if (this.month && this.year) {
      from = new Date(this.year, this.month - 1, 1);
      to = new Date(this.year, this.month, 0);
    }

    subscriptions.forEach((sub) => {
      let start = this.parseDateCL(sub.begin);
      let endOriginal = this.parseDateCL(sub.end);

      // 🔥 recorte por filtro
      if (from && start < from) start = from;
      if (to && endOriginal > to) endOriginal = to;

      const end = this.isCurrentlyActive(sub) ? today : endOriginal;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const current = this.parseDateCL(d);

        // 🚫 fuera de rango
        if (from && current < from) continue;
        if (to && current > to) continue;

        // 🚫 futuro
        if (current > today) continue;

        const dateStr = this.formatDateCL(current);

        const ingreso = result.find(
          (r) =>
            this.formatDateCL(r.register_datetime) === dateStr &&
            r.type === 'ING',
        );

        const salida = result.find(
          (r) =>
            this.formatDateCL(r.register_datetime) === dateStr &&
            r.type === 'SAL',
        );

        if (!ingreso) {
          const dIng = new Date(current);
          dIng.setHours(0, 0, 0);

          result.push({
            register_datetime: dIng,
            type: 'ING',
            isVirtual: true,
          });
        }

        if (!salida) {
          const dSal = new Date(current);
          dSal.setHours(0, 0, 0);

          result.push({
            register_datetime: dSal,
            type: 'SAL',
            isVirtual: true,
          });
        }
      }
    });

    // 🔥 filtro final (doble seguridad)
    return result
      .filter((r) => {
        const d = this.parseDateCL(r.register_datetime);

        if (from && d < from) return false;
        if (to && d > to) return false;

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.register_datetime).getTime() -
          new Date(b.register_datetime).getTime(),
      );
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

  onDateChange(): void {
    this.hasSearched = false; // 🔥 CLAVE
    if (!this.dateFrom && !this.dateTo) return;

    if (this.dateFrom) {
      const from = new Date(this.dateFrom);

      this.month = from.getMonth() + 1;
      this.year = from.getFullYear();

      from.setHours(0, 0, 0, 0);
      this.dateFrom = from;
    }

    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      this.dateTo = to;
    }

    this.clearResults();
  }

  clearResults(): void {
    this.selectedUser = null;
    this.selectedGroup = null;

    this.selectedUser = null;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];

    this.works = [];
    this.selectedDay = null;

    this.allRegisters = [];
    this.allSubscriptions = [];
    this.allWorks = [];
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
    .pipe(debounceTime(200), distinctUntilChanged())
    .subscribe((value: any) => {
      const term = (value || '').toString().trim();

      // 🔥 SIN TEXTO → NO MOSTRAR NADA
      if (!term) {
        this.filteredUsers = [];
        this.users = [];
        this.groups = [...this.allGroups];
        return;
      }

      const result = filterByRutOrName(this.allUsers, term, {
        nameKey: 'fullName',
        rutKey: 'rut',
      });

      this.filteredUsers = result;

      // 🔥 SOLO PREPARA, NO MUESTRA EN TABLA
      this.users = [];
      this.selectedGroup = null;

      this.rebuildGroups(result);
    });
}

  selectUserFromSearch(user: any) {
    if (!user) return;
    this.selectedUser = user;
    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;
  }

  limpiarBusqueda() {
    this.userSearch.setValue('');

    this.filteredUsers = [...this.allUsers];

    this.selectedUser = null;

    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.selectedDay = null;
  }

  displayUser(user: any): string {
    return user ? user.fullName : '';
  }
}

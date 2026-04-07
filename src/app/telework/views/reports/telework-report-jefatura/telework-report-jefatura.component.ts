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
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportService } from '@app/telework/services/telework-report.service';
import { TeleworkReportPrintService } from '@app/telework/services/reports/telework-report-print.service';
import { UsersGroupService } from '@app/telework/services/admin/users-group.service';
import { GroupService } from '@app/telework/services/admin/group.service';
import { WorkService } from '@app/telework/services/work.service';
import { Work } from '@app/telework/models/work.model';

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
    MatNativeDateModule,
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
    // 🔥 LIMPIEZA CENTRALIZADA
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
      // 🔥 IDS JEFATURA
      // ===============================
      const idsJefatura = relaciones
        .filter((r: any) => r.group?.user?.id === this.jefe.id && !r.deletedAt)
        .map((r: any) => r.user?.id);

      // ===============================
      // 🔥 FILTRO REGISTROS
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
      // 🔥 CONTEO MARCAS
      // ===============================
      const userMap: any = {};

      filteredRegisters.forEach((r: any) => {
        const uid = r.user?.id;
        if (!uid) return;
        userMap[uid] = (userMap[uid] || 0) + 1;
      });

      // ===============================
      // 🔥 USERS VISIBLES
      // ===============================
      this.users = users
        .filter((u: any) => {
          if (!idsJefatura.includes(u.id)) return false;

          // 🔥 solo usuarios con registros en el rango
          const hasRegisters = filteredRegisters.some(
            (r: any) => r.user?.id === u.id,
          );

          // 🔥 o con works en el rango
          const hasWorks = this.allWorks.some((w: any) => w.user?.id === u.id);

          return hasRegisters || hasWorks;
        })
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

    let userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id)
      .map((r: any, index: number) => ({
        ...r,
        type: r.type ?? (index % 2 === 0 ? 'ING' : 'SAL'),
        isVirtual: r.isVirtual ?? false,
      }));

    // 🔥 FILTRO REAL POR RANGO (LA CLAVE)
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

    let userSubscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    // 🔥 FILTRO POR RANGO (CLAVE)
    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      userSubscriptions = userSubscriptions
        .filter((s: any) => {
          const start = new Date(s.begin);
          const end = new Date(s.end);

          return start <= to && end >= from;
        })
        .map((s: any) => {
          const start = new Date(s.begin);
          const end = new Date(s.end);

          return {
            ...s,
            begin: start < from ? from : start,
            end: end > to ? to : end,
          };
        });
    }

    this.subscriptions = userSubscriptions;

    this.works = this.allWorks.filter((w: any) => w.user?.id === user.id);

    this.registers = this.generateFullRegisters(
      this.subscriptions,
      userRegisters,
    );

    // 🔥 AGRUPACIÓN POR DÍA
    this.days = this.groupByDay(this.registers, this.works);

    if (!this.days.length) {
      this.showDetail = false;

      this.showWarning(
        'El usuario no posee información en el período seleccionado.',
      );
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
    const map: any = {};

    // 🔵 REGISTROS
    registers.forEach((r) => {
      const d = new Date(r.register_datetime);
      d.setHours(0, 0, 0, 0); // 🔥 IGUAL QUE WORKS

      const date = this.formatDateCL(d);

      if (!map[date]) {
        map[date] = {
          date,
          registros: [],
          actividades: [],
        };
      }

      map[date].registros.push(r);
    });

    // 🟣 ACTIVIDADES
    works.forEach((w) => {
      const rawDate = w.createdAt || w.created_at;

      if (!rawDate) return;

      const d = new Date(rawDate);

      if (isNaN(d.getTime())) return; // 🔥 evita fechas inválidas

      d.setHours(0, 0, 0, 0); // 🔥 CLAVE → mismo criterio que registros

      const date = this.formatDateCL(d);

      if (!map[date]) {
        map[date] = {
          date,
          registros: [],
          actividades: [],
        };
      }

      map[date].actividades.push(w);
    });

    // 🔥 PROCESAR CADA DÍA
    Object.values(map).forEach((day: any) => {
      // ordenar actividades por hora
      day.actividades.sort((a: any, b: any) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime();
        const db = new Date(b.createdAt || b.created_at || 0).getTime();
        return da - db;
      });

      // 🔥 METADATOS
      day.totalActividades = day.actividades.length;
      day.tieneActividad = day.totalActividades > 0;
      day.totalRegistros = day.registros.length;

      // 🔥 ESTADO DEL DÍA
      day.estado = day.tieneActividad ? 'ok' : 'sin-actividad';
    });

    // 🔥 ORDEN FINAL POR FECHA
    return Object.values(map).sort((a: any, b: any) => {
      return (
        this.parseDateCL(a.date).getTime() - this.parseDateCL(b.date).getTime()
      );
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
    const result = [...regs];

    const from = this.dateFrom ? new Date(this.dateFrom) : null;
    const to = this.dateTo ? new Date(this.dateTo) : null;

    subs.forEach((s) => {
      let start = new Date(s.begin);
      let end = new Date(s.end);

      // 🔥 RECORTE AL RANGO SELECCIONADO
      if (from && start < from) start = from;
      if (to && end > to) end = to;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = this.formatDateCL(d);

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
          result.push({
            register_datetime: new Date(d),
            type: 'ING',
            isVirtual: true,
          });
        }

        if (!salida) {
          result.push({
            register_datetime: new Date(d),
            type: 'SAL',
            isVirtual: true,
          });
        }
      }
    });

    return result.sort(
      (a, b) =>
        new Date(a.register_datetime).getTime() -
        new Date(b.register_datetime).getTime(),
    );
  }

  // ===============================
  // UTIL
  // ===============================
  formatDateCL(date: any) {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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

  onDateChange(): void {
    if (!this.dateFrom && !this.dateTo) return;

    // 🔥 CASO 1: hay dateFrom → manda
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);

      this.month = from.getMonth() + 1;
      this.year = from.getFullYear();

      from.setHours(0, 0, 0, 0);
      this.dateFrom = from;
    }

    // 🔥 CASO 2: SOLO hay dateTo (🔥 ESTE TE FALTABA)
    else if (this.dateTo) {
      const to = new Date(this.dateTo);

      this.month = to.getMonth() + 1;
      this.year = to.getFullYear();
    }

    // 🔥 normalización dateTo
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      this.dateTo = to;
    }

    this.clearResults();
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

  getDayOfWeek(date: string | Date, format: 'short' | 'long' = 'long'): string {
    const d = new Date(date);

    return d.toLocaleDateString('es-CL', { weekday: format }).replace('.', ''); // 🔥 evita "lun."
  }

  isSameDay(date1: string | Date, date2: string | Date | null): boolean {
    if (!date1 || !date2) return false;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }

  formatTimeCL(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
    // 🔥 1. obtener registros del usuario
    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    // 🔥 2. FILTRO POR RANGO (AQUÍ VA 👇)
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

    // 🔥 3. validación
    if (!userRegisters.length) {
      this.showWarning('El usuario no tiene registros en el período');
      return;
    }

    // 🔥 4. armar data
    const data = userRegisters.map((r: any) => ({
      fecha: this.formatDateCL(r.register_datetime),
      dia: this.getDayOfWeek(r.register_datetime),
      hora: this.formatTimeCL(r.register_datetime),
      tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
    }));

    const html = this.teleworkReport.generateReport({
      userName: user.fullName,
      rut: user.rut,
      registers: data,
    });

    this.teleworkReport.printPdf(html);
  }

  exportUser(user: any): void {
    // 🔥 1. obtener registros
    let userRegisters = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id,
    );

    // 🔥 2. FILTRO POR RANGO (AQUÍ TAMBIÉN 👇)
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

    // 🔥 3. validación
    if (!userRegisters.length) {
      this.showWarning('El usuario no tiene registros en el período');
      return;
    }

    // 🔥 4. armar excel
    const data = userRegisters.map((r: any) => ({
      Fecha: this.formatDateCL(r.register_datetime),
      Día: this.getDayOfWeek(r.register_datetime),
      Hora: this.formatTimeCL(r.register_datetime),
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
}

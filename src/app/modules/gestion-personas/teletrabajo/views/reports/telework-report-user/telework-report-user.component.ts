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
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { TeleworkReportService } from '@app/modules/gestion-personas/teletrabajo/services/telework-report.service';

import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';
import { RegistersService } from '@app/modules/gestion-personas/teletrabajo/services/registers.service';

import { LoaderService } from '@app/core/services/loader.service';
import { TokenService } from '@app/core/services/token.service';
import { WorkService } from '@app/modules/gestion-personas/teletrabajo/services/work.service';
import { Work } from '@app/modules/gestion-personas/teletrabajo/models/work.model';


@Component({
  selector: 'app-telework-report-user',
  standalone: true,
  templateUrl: './telework-report-user.component.html',
  styleUrls: ['./telework-report-user.component.scss'],
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
export class TeleworkReportUserComponent {
  private dialog = inject(MatDialog);
  private reportService = inject(TeleworkReportService);
  private teleworkReport = inject(TeleworkReportPrintService);
  private loader = inject(LoaderService);
  private tokenService = inject(TokenService);
  private registersService = inject(RegistersService);
  private workService = inject(WorkService);

  // ===============================
  // FILTROS
  // ===============================

  userId: number = 0;
  userName: string = '';
  rut: string = '';

  rutInvalido = false;
  loading = false;

  month: number | null = null;
  year: number | null = null;
  selectedRegisterId: any = null;

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

  allWorks: Work[] = [];
  works: Work[] = [];

  selectedDay: Date | null = null;
  showDetail = false;

  // ===============================
  // RESULTADOS
  // ===============================

  users: any[] = [];
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

  displayedUsersColumns: string[] = ['fullName', 'rut', 'marks', 'actions'];
  displayedWarningColumns: string[] = ['fullName', 'rut', 'marks'];

  displayedRegistersColumns = [
    'date',
    'day',
    'hour',
    'type', // 👈 nueva
  ];

  displayedSubscriptionsColumns = ['start', 'end', 'duration', 'state'];

  ngOnInit() {
    const profile = this.tokenService.getUserProfile();

    console.log('PROFILE 👉', profile);

    // 🔥 1. obtener userId primero
    this.userId =
      profile?.id ||
      profile?.userId ||
      profile?.user_id ||
      profile?.sub ||
      null;

    // 🔥 convertir a número SI viene como string
    this.userId = Number(this.userId);

    console.log('USER ID FINAL 👉', this.userId);

    this.userName =
      profile?.fullName ||
      [
        profile?.firstName,
        profile?.secondName,
        profile?.firstLastName,
        profile?.secondLastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      'Usuario';

    if (!this.userId) {
      this.showWarning('No se pudo obtener usuario desde sesión');
      return;
    }

    // 🔥 2. ahora sí cargar datos reales (incluye rut)
    this.loadUserData();

    // 🔥 3. inicializar filtros
    const currentYear = new Date().getFullYear();

    for (let i = currentYear; i <= currentYear + 10; i++) {
      this.years.push(i);
    }

    this.month = new Date().getMonth() + 1;
    this.year = new Date().getFullYear();

    this.onMonthYearChange();
  }

  async loadUserData() {
    try {
      const user: any = await firstValueFrom(
        this.reportService.getUserById(this.userId),
      );

      this.rut = user.rut || '';
    } catch (error) {
      console.error(error);
    }
  }

  // ===============================
  // BUSCAR
  // ===============================

  async search() {
    this.loader.show(); // 🔥 activar loader
    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.selectedUser = null;

    // 🔥 AGREGA ESTO
    this.selectedDay = null;
    this.works = [];

    if (!this.userId) {
      this.showWarning('Usuario no válido');
      return;
    }

    if (this.dateFrom && this.dateTo) {
      const from = new Date(this.dateFrom);
      const to = new Date(this.dateTo);

      if (to < from) {
        this.showWarning(
          'La fecha "Hasta" no puede ser menor que la fecha "Desde"',
        );
        return;
      }
    }

    try {
      this.loading = true;

      this.showDetail = false;
      this.works = [];
      this.selectedDay = null;

      console.log('👉 userId:', this.userId);

      const registersResponse: any = await firstValueFrom(
        this.registersService.getRegistersByUser(this.userId),
      );

      console.log('✅ REGISTERS OK', registersResponse);

      const works = await firstValueFrom(this.workService.getAll());

      this.allWorks = works.filter(
        (w: any) =>
          (w.user?.id === this.userId || w.userId === this.userId) &&
          !w.deletedAt,
      );

      const subscribes = await firstValueFrom(
        this.reportService.getSubscribes(),
      );

      console.log('✅ SUBSCRIBES OK', subscribes);

      // 🔥 EXTRAER ARRAY REAL (CLAVE)
      const registers = registersResponse.content || [];

      // 🔥 guardar respaldo (PRO)
      this.allRegisters = registers;
      this.allSubscriptions = subscribes;

      // =========================================
      // 🔥 REGISTROS DEL USUARIO
      // =========================================

      let filteredRegisters = registers.map((r: any) => ({
        ...r,
        type: r.type || r.state,
        isVirtual: false,
      }));

      // =========================================
      // 🔥 PRIORIDAD: FECHA > MES/AÑO
      // =========================================

      if (this.dateFrom && this.dateTo) {
        const from = new Date(this.dateFrom);
        from.setHours(0, 0, 0, 0);

        const to = new Date(this.dateTo);
        to.setHours(23, 59, 59, 999);

        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);
          return d >= from && d <= to;
        });
      } else if (this.month !== null && this.year !== null) {
        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);
          return (
            d.getMonth() + 1 === this.month && d.getFullYear() === this.year
          );
        });
      }

      // =========================================
      // 🔥 SUSCRIPCIONES
      // =========================================

      const mySubscriptions = subscribes.filter(
        (s: any) => s.user?.id === this.userId || s.userId === this.userId,
      );

      if (this.dateFrom && this.dateTo) {
        const from = new Date(this.dateFrom);
        from.setHours(0, 0, 0, 0);

        const to = new Date(this.dateTo);
        to.setHours(23, 59, 59, 999);

        this.subscriptions = mySubscriptions
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
      } else if (this.month !== null && this.year !== null) {
        const from = new Date(this.year, this.month - 1, 1, 0, 0, 0, 0);
        const to = new Date(this.year, this.month, 0, 23, 59, 59, 999);

        this.subscriptions = mySubscriptions
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
      } else {
        this.subscriptions = mySubscriptions;
      }

      // =========================================
      // 🔥 REGISTROS FINALES
      // =========================================

      if (!this.dateFrom && !this.dateTo) {
        this.registers = this.generateFullRegisters(
          this.subscriptions,
          filteredRegisters,
        );
      } else {
        this.registers = filteredRegisters;
      }

      // =========================================
      // 🔥 MENSAJE SIN RESULTADOS
      // =========================================

      if (!this.registers.length && !this.subscriptions.length) {
        this.showMessage(
          'Sin resultados',
          'No se encontró información para el rango seleccionado',
        );
      }
    } catch (err) {
      console.error(err);
      this.showWarning('Error consultando información');
    } finally {
      this.loading = false;
      this.loader.hide();
    }
  }

  isSameDay(a: Date | string, b: Date | string | null): boolean {
    if (!a || !b) return false;

    const d1 = new Date(a);
    const d2 = new Date(b);

    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
  }

  selectRegisterDay(register: any) {
    const targetDate = new Date(register.register_datetime);
    targetDate.setHours(0, 0, 0, 0);

    this.selectedDay = targetDate;

    this.works = this.allWorks
      .filter((w: any) => {
        const d = new Date(w.createdAt || w.created_at);
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

  toDateOnly(date: any): string {
    if (!date) return '';

    // ISO → 2026-03-31T12:00:00 → 2026-03-31
    if (typeof date === 'string' && date.includes('T')) {
      return date.split('T')[0];
    }

    // formato normal Date
    const d = new Date(date);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  // ===============================
  // LIMPIAR FILTROS
  // ===============================

  clearFilters(): void {
    this.rut = '';
    this.setCurrentMonthYear();
    this.dateFrom = null;
    this.dateTo = null;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.selectedUser = null;
  }

  setCurrentMonthYear() {
    const today = new Date();
    this.month = today.getMonth() + 1;
    this.year = today.getFullYear();
  }

  // ===============================
  // DÍA DE LA SEMANA
  // ===============================

  getDayOfWeek(date: any): string {
    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    const d = this.toLocalDate(date);

    return days[d.getDay()];
  }

  selectUser(user: any): void {
    this.selectedUser = user;

    this.registers = [];
    this.subscriptions = [];

    // 🔥🔥🔥 ESTO ES LO QUE FALTA
    this.works = [];
    this.selectedDay = null;

    // 🔹 obtener registros reales
    let userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id || r.userId === user.id)
      .sort(
        (a: any, b: any) =>
          new Date(a.register_datetime).getTime() -
          new Date(b.register_datetime).getTime(),
      );

    // 🔥 si NO viene tipo desde backend → lo generamos
    userRegisters = userRegisters.map((r: any, index: number) => ({
      ...r,
      type: r.type || (index % 2 === 0 ? 'ING' : 'SAL'),
      isVirtual: false,
    }));

    // 🔹 suscripciones
    this.subscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id || s.userId === user.id,
    );

    // 💥 AQUÍ LA MAGIA
    this.registers = this.generateFullRegisters(
      this.subscriptions,
      userRegisters,
    );
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
    this.dialog.open(ConfirmDialogOkComponent, {
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

      const hasRegisters = this.allRegisters.some(
        (r: any) => r.user?.id === s.user?.id || r.userId === s.userId,
      );

      if (!hasRegisters) {
        alerts.push(s);
      }
    });

    return alerts;
  }

  onMonthYearChange(): void {
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

  onDateChange(): void {
    if (!this.dateFrom) return;

    const from = new Date(this.dateFrom);

    // 🔥 sincroniza mes/año
    this.month = from.getMonth() + 1;
    this.year = from.getFullYear();

    // 🔥 normaliza rango si existe hasta
    if (this.dateTo) {
      const to = new Date(this.dateTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      this.dateFrom = from;
      this.dateTo = to;
    }

    this.clearResults();
  }

  onDateFocus(): void {
    this.month = null;
    this.year = null;

    this.clearResults(); // 🔥 limpieza completa
  }

  onMonthFocus(): void {
    this.dateFrom = null;
    this.dateTo = null;
    this.clearResults(); // 🔥 limpieza completa
  }

  clearResults(): void {
    this.registers = [];
    this.subscriptions = [];
    this.works = [];
    this.allWorks = []; // 💥 clave
    this.selectedDay = null;
    this.showDetail = false;
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

  getToday(): Date {
    return new Date();
  }

  generateFullRegisters(subscriptions: any[], registers: any[]) {
    const result = [...registers];

    const today = this.parseDateCL(this.getToday());

    subscriptions.forEach((sub) => {
      let start = this.parseDateCL(sub.begin);
      let end = this.parseDateCL(sub.end);

      // =========================================
      // 🔥 AJUSTAR POR FILTRO (CLAVE)
      // =========================================

      if (this.dateFrom && this.dateTo) {
        const from = this.parseDateCL(this.dateFrom);
        const to = this.parseDateCL(this.dateTo);

        // 🔥 cortar inicio
        if (start < from) start = from;

        // 🔥 cortar fin
        if (end > to) end = to;
      } else {
        // 🔥 comportamiento normal (solo si NO hay filtro)
        if (this.isCurrentlyActive(sub)) {
          end = today;
        }
      }

      // 🚫 seguridad extra
      if (start > end) return;

      // =========================================
      // 🔁 GENERAR DÍAS
      // =========================================

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const current = this.parseDateCL(d);

        // 🚫 nunca futuro
        if (current > today) continue;

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
          const dIng = new Date(d);
          dIng.setHours(0, 0, 0);

          result.push({
            register_datetime: dIng,
            type: 'ING',
            isVirtual: true,
          });
        }

        if (!salida) {
          const dSal = new Date(d);
          dSal.setHours(0, 0, 0);

          result.push({
            register_datetime: dSal,
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
      this.loader.lock();
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
      this.loader.unlock();
      this.loader.hide();
    }
  }

  printWorksFromSource() {
    try {
      this.loader.lock();
      this.loader.show();

      if (!this.registers?.length) {
        this.showWarning('No hay actividades disponibles');
        return;
      }

      // 🔥 FILTRAR POR PERÍODO (SI EXISTE)
      const worksFiltered = this.allWorks
        .filter((w: any) => {
          const d = new Date(w.createdAt);

          if (this.dateFrom && this.dateTo) {
            const from = new Date(this.dateFrom);
            from.setHours(0, 0, 0, 0);

            const to = new Date(this.dateTo);
            to.setHours(23, 59, 59, 999);

            return d >= from && d <= to;
          }

          return true;
        })
        .sort((a: any, b: any) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

      if (!worksFiltered.length) {
        this.showWarning('No hay actividades para el período seleccionado');
        return;
      }

      // 🔥 MAPEO
      const data = worksFiltered.map((w: any) => {
        const d = new Date(w.createdAt);

        return {
          fecha: this.formatDateCL(d),
          hora: this.formatTimeCL(d),
          actividad: w.description,
        };
      });

      // 🔥 GENERAR PDF
      const html = this.teleworkReport.generateWorksReport({
        userName: this.userName,
        rut: this.rut,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        works: data,
      });

      this.teleworkReport.printPdf(html);
    } catch (error) {
      console.error('ERROR REAL 👉', error);
      this.showWarning('Error generando reporte de actividades');
    } finally {
      this.loader.unlock();
      this.loader.hide();
    }
  }

  generateReport() {
    try {
      this.loader.lock();
      this.loader.show();

      if (!this.registers?.length) {
        this.showWarning('No hay datos para imprimir');
        return;
      }

      const data = this.registers.map((r: any) => ({
        fecha: this.formatDateCL(r.register_datetime),
        dia: this.getDayOfWeek(r.register_datetime),
        hora: this.formatTimeCL(r.register_datetime, r.isVirtual),
        tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
      }));

      const html = this.teleworkReport.generateReport({
        userName: this.userName,
        rut: this.rut,
        registers: data,
      });

      this.teleworkReport.printPdf(html);
    } catch (error) {
      console.error(error);
      this.showWarning('Error generando reporte');
    } finally {
      this.loader.unlock();
      this.loader.hide();
    }
  }

  exportUser() {
    try {
      this.loader.lock();
      this.loader.show();

      if (!this.registers?.length) {
        this.showWarning('No hay datos para exportar');
        return;
      }

      const data = this.registers.map((r: any) => ({
        Fecha: this.formatDateCL(r.register_datetime),
        Día: this.getDayOfWeek(r.register_datetime),
        Hora: this.formatTimeCL(r.register_datetime, r.isVirtual),
        Tipo: r.type === 'ING' ? 'Ingreso' : 'Salida',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Telework');

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/octet-stream',
      });

      saveAs(blob, `telework_${this.userName}.xlsx`);
    } catch (error) {
      console.error(error);
      this.showWarning('Error exportando Excel');
    } finally {
      this.loader.unlock();
      this.loader.hide();
    }
  }
}

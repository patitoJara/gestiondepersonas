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
  constructor() {}

  startDate: Date | null = null;
  endDate: Date | null = null;

  filteredUsers: any[] = [];
  selectedUserRegisters: any[] = [];
  selectedUserSubscriptions: any[] = [];

  showDetail = false;

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
    // 🔥 AQUÍ LO QUE TE FALTABA
    await this.cargarGrupo();
    await this.search();
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
  // 🔍 SEARCH
  // ===============================
  async search() {
    this.loader.lock();

    // 🔥 LIMPIAR TODO (evita arrastre de meses)
    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.allRegisters = [];
    this.allSubscriptions = [];
    this.selectedUser = null;
    this.showDetail = false;

    try {
      const [users, registers, subscribes, relaciones] = await Promise.all([
        firstValueFrom(this.reportService.getUsers()),
        firstValueFrom(this.reportService.getRegisters()),
        firstValueFrom(this.reportService.getSubscribes()),
        firstValueFrom(this.usersGroupService.getAll()),
      ]);

      // 🔥 usuarios de la jefatura
      const idsJefatura = relaciones
        .filter((r: any) => r.group?.user?.id === this.jefe.id && !r.deletedAt)
        .map((r: any) => r.user?.id);

      let filteredRegisters = [...registers];

      // 🔥 FILTRO REAL POR FECHA (clave del sistema)
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

      // 🔥 conteo de marcas por usuario
      const userMap: any = {};

      filteredRegisters.forEach((r: any) => {
        const uid = r.user?.id;
        if (!uid) return;
        userMap[uid] = (userMap[uid] || 0) + 1;
      });

      // 🔥 usuarios visibles (solo jefatura)
      this.users = users
        .filter((u: any) => idsJefatura.includes(u.id))
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

      // 🔥 guardar datos filtrados
      this.allRegisters = filteredRegisters;

      // 🚨 IMPORTANTE: también filtrar suscripciones por usuario de jefatura
      this.allSubscriptions = subscribes.filter((s: any) =>
        idsJefatura.includes(s.user?.id),
      );
    } catch (error) {
      console.error(error);
      this.showWarning('Error al cargar reporte');
    } finally {
      this.loader.unlock();
    }
  }

  // ===============================
  // 👤 SELECT USER
  // ===============================
  selectUser(user: any): void {
    this.selectedUser = user;

    const userRegisters = this.allRegisters
      .filter((r: any) => r.user?.id === user.id)
      .map((r: any, index: number) => ({
        ...r,
        type: r.type ?? (index % 2 === 0 ? 'ING' : 'SAL'),
        isVirtual: r.isVirtual ?? false,
      }));

    this.subscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id,
    );

    this.registers = this.generateFullRegisters(
      this.subscriptions,
      userRegisters,
    );

    // 🔥 CONTROL VISUAL
    if (!this.registers.length && !this.subscriptions.length) {
      this.showDetail = false; // 👈 OCULTA TODO

      this.showWarning(
        'El usuario no posee registros ni suscripciones en el período seleccionado.',
      );
    } else {
      this.showDetail = true; // 👈 MUESTRA TODO
    }
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
    // aquí puedes recargar filtros o datos
    console.log('Fecha cambiada');
  }

  clearFilters(): void {
    this.selectedUser = null;
    this.startDate = null;
    this.endDate = null;

    this.filteredUsers = [];
    this.selectedUserRegisters = [];
    this.selectedUserSubscriptions = [];
  }

  printUser(user: any): void {
    if (!this.selectedUser || this.registers.length === 0) {
      this.showWarning('Seleccione un usuario con registros');
      return;
    }

    const data = this.registers.map((r: any) => ({
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

  getDayOfWeek(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-CL', { weekday: 'long' });
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
    if (!this.month || !this.year) {
      this.dateFrom = null;
      this.dateTo = null;
      return;
    }

    this.dateFrom = new Date(this.year, this.month - 1, 1, 0, 0, 0, 0);
    this.dateTo = new Date(this.year, this.month, 0, 23, 59, 59, 999);

    // 🔥 CRÍTICO
    this.selectedUser = null;
    this.registers = [];
    this.subscriptions = [];
    this.showDetail = false;
  }
  exportUser(user: any): void {
    const data = this.registers.map((r: any) => ({
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

    const fileName = `Reporte_${user.fullName}.xlsx`;

    saveAs(blob, fileName);
  }
}

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
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { TeleworkReportService } from '@app/telework/services/telework-report.service';
import { firstValueFrom } from 'rxjs';

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
    MatNativeDateModule,
  ],
})
export class TeleworkReportComponent {
  private dialog = inject(MatDialog);
  private reportService = inject(TeleworkReportService);

  // ===============================
  // FILTROS
  // ===============================

  rut: string = '';
  rutInvalido = false;

  month: number | null = null;
  year: number | null = null;

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

  displayedUsersColumns: string[] = ['fullName', 'rut', 'marks'];
  displayedWarningColumns: string[] = ['fullName', 'rut', 'marks'];

  displayedRegistersColumns: string[] = [
    'date',
    'day',
    'hour',
    'state',
    'observation',
  ];

  displayedSubscriptionsColumns = ['start', 'end', 'state'];

  ngOnInit() {
    const currentYear = new Date().getFullYear();

    for (let i = currentYear; i <= currentYear + 10; i++) {
      this.years.push(i);
    }

    this.month = new Date().getMonth() + 1;
    this.year = new Date().getFullYear();
  }

  // ===============================
  // BUSCAR
  // ===============================

  async search() {
    this.validarRut();

    if (this.rutInvalido) {
      this.showWarning('El RUT ingresado no es válido');
      return;
    }

    if (
      !this.month &&
      !this.year &&
      !this.dateFrom &&
      !this.dateTo &&
      !this.rut
    ) {
      this.showWarning('Debe ingresar al menos un filtro');
      return;
    }

    try {
      const users = await firstValueFrom(this.reportService.getUsers());
      const registers = await firstValueFrom(this.reportService.getRegisters());
      const subscribes = await firstValueFrom(
        this.reportService.getSubscribes(),
      );

      let filteredRegisters = [...registers];

      // ============================
      // FILTRO MES / AÑO
      // ============================

      if (this.month && this.year) {
        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);

          return (
            d.getMonth() + 1 === this.month && d.getFullYear() === this.year
          );
        });
      }

      // ============================
      // FILTRO RANGO FECHAS
      // ============================

      if (this.dateFrom && this.dateTo) {
        filteredRegisters = filteredRegisters.filter((r: any) => {
          const d = new Date(r.register_datetime);

          return d >= this.dateFrom! && d <= this.dateTo!;
        });
      }

      // ============================
      // AGRUPAR REGISTROS POR USUARIO
      // ============================

      const userMap: any = {};

      filteredRegisters.forEach((r: any) => {
        const uid = r.user?.id;

        if (!uid) return;

        if (!userMap[uid]) {
          userMap[uid] = 0;
        }

        userMap[uid]++;
      });

      // ============================
      // CONSTRUIR TABLA USUARIOS
      // ============================

      this.users = users
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
        })
        .filter((u: any) => {
          if (u.marks > 0) return true;

          const hasSubscription = subscribes.some(
            (s: any) => (s.user?.id === u.id || s.userId === u.id) && s.active,
          );

          return hasSubscription;
        });

      // ============================
      // GUARDAR DATA COMPLETA
      // ============================

      this.allRegisters = filteredRegisters;
      this.registers = [];

      this.allSubscriptions = subscribes;
      this.subscriptions = [];

      // ============================
      // ALERTA SUSCRIPCIONES SIN MARCAS
      // ============================

      const alerts = this.checkSubscriptionsWithoutMarks();

      if (alerts.length > 0) {
        this.dialog.open(ConfirmDialogComponent, {
          width: '480px',
          disableClose: true,
          data: {
            title: 'Alerta Teletrabajo',
            message: `Se detectaron ${alerts.length} suscripciones activas sin registros de marcas.`,
            confirmText: 'Aceptar',
            cancelText: '',
            icon: 'warning',
            color: 'warn',
          },
        });
      }
    } catch (err) {
      console.error(err);
      this.showWarning('Error consultando información');
    }
  }

  // ===============================
  // LIMPIAR FILTROS
  // ===============================

  clearFilters(): void {
    this.rut = '';
    this.month = null;
    this.year = null;
    this.dateFrom = null;
    this.dateTo = null;

    this.users = [];
    this.registers = [];
    this.subscriptions = [];
    this.selectedUser = null;
  }

  // ===============================
  // DÍA DE LA SEMANA
  // ===============================

  getDayOfWeek(date: string): string {
    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];

    return days[new Date(date).getDay()];
  }

  selectUser(user: any): void {
    this.selectedUser = user;

    // limpiar tablas
    this.registers = [];
    this.subscriptions = [];

    // marcas del usuario
    this.registers = this.allRegisters.filter(
      (r: any) => r.user?.id === user.id || r.userId === user.id,
    );

    // suscripciones del usuario
    this.subscriptions = this.allSubscriptions.filter(
      (s: any) => s.user?.id === user.id || s.userId === user.id,
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
    const d = this.normalizeDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  parseDateCL(date: any): Date {
    if (!date) return new Date();

    // ya es Date (datepicker)
    if (date instanceof Date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // viene del backend ISO
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // formato dd/mm/yyyy
    if (typeof date === 'string' && date.includes('/')) {
      const parts = date.split('/');
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // fallback
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
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
    this.dialog.open(ConfirmDialogComponent, {
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

  onDateChange() {
    this.month = null;
    this.year = null;
  }

  onMonthYearChange(): void {
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
}

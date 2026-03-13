// src\app\telework\views\dashboard\dashboard.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TokenService } from '../../../core/services/token.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

import { SubscribesService } from '../../../telework/services/admin/subscribes.service';
import { RegistersService } from '../../../telework/services/registers.service';

interface TeleworkEvent {
  id: number;
  type: 'ING' | 'SAL';
  origin: 'USER' | 'ADMIN';
  datetime: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);

  now: Date = new Date();
  private timer: any;

  // 👤 nombre del usuario
  userName = 'Usuario';

  // eventos del día
  events: TeleworkEvent[] = [];

  // eventos filtrados del día
  todayEvents: TeleworkEvent[] = [];

  // suscripciones
  subscriptions: any[] = [];

  // permiso para marcar
  canMarkToday = false;

  constructor(
    private subscribesService: SubscribesService,
    private tokenService: TokenService,
    private registersService: RegistersService,
  ) {}

  ngOnInit(): void {
    // reloj
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 1000);

    const userId = this.tokenService.getUserId();
    const fullName = this.tokenService.getUserFullName();

    if (fullName) {
      this.userName = fullName;
    }

    if (userId) {
      this.loadSubscriptions(userId);
      this.loadRegisters(userId); // 👈 aquí
    }
  }

  loadRegisters(userId: number) {
    this.registersService.getAll().subscribe({
      next: (data: any[]) => {
        const userRegisters = (data || []).filter((r: any) => {
          return r.user?.id === userId;
        });

        this.events = userRegisters
          .map(
            (r: any): TeleworkEvent => ({
              id: r.id,

              type: r.state === 'ING' ? 'ING' : 'SAL',

              origin: 'USER',

              datetime: new Date(r.register_datetime),
            }),
          )
          .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

        this.updateTodayEvents();
      },

      error: (err: any) => {
        console.error('Error cargando registros', err);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  mark(type: 'ING' | 'SAL') {
    if (!this.canMarkToday) {
      return;
    }

    const userId = this.tokenService.getUserId();

    const payload = {
      user: {
        id: userId,
      },
      state: type,
      register_datetime: new Date().toISOString(),
    };

    this.registersService.create(payload).subscribe({
      next: () => {
        const newEvent: TeleworkEvent = {
          id: Date.now(),
          type,
          origin: 'USER',
          datetime: new Date(),
        };

        this.events.push(newEvent);

        this.updateTodayEvents();
      },

      error: (err) => {
        console.error('Error guardando registro', err);

        this.showWarning('No fue posible registrar el marcaje.');
      },
    });
  }

  // cargar suscripciones
  loadSubscriptions(userId: number) {
    this.subscribesService.getByUser(userId).subscribe({
      next: (data: any[]) => {
        this.subscriptions = (data || []).sort((a: any, b: any) => {
          return new Date(b.begin).getTime() - new Date(a.begin).getTime();
        });

        this.validateToday();

        // 👇 mostrar advertencia al cargar el dashboard
        if (!this.canMarkToday) {
          const msg =
            `No posee una suscripción activa para teletrabajo para el día de hoy.\n\n` +
            `Para registrar marcaje debe existir un periodo de suscripción vigente.`;

          this.showWarning(msg);
        }
      },

      error: (err: any) => {
        console.error('Error cargando suscripciones', err);
      },
    });
  }

  // validar si hoy está dentro de una suscripción
  validateToday() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd

    this.canMarkToday = this.subscriptions.some((s: any) => {
      const begin = new Date(s.begin).toISOString().slice(0, 10);
      const end = new Date(s.end).toISOString().slice(0, 10);

      return todayStr >= begin && todayStr <= end;
    });
  }

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Periodo inválido',
        message: message,
        icon: 'warning',
        color: 'warn',
        confirmText: 'Aceptar',
      },
    });
  }

  updateTodayEvents() {
    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    this.todayEvents = this.events.filter((e) => {
      return e.datetime >= start && e.datetime <= end;
    });
  }

  get teleworkStatus(): string {
    return this.canMarkToday
      ? '🟢 Teletrabajo habilitado hoy'
      : '🔴 Sin suscripción activa hoy';
  }
}

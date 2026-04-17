// src\app\telework\views\dashboard\dashboard.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TokenService } from '@app/core/services/token.service';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { WorkService } from '@app/modules/gestion-personas/teletrabajo/services/work.service';

import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { SubscribesService } from  '@app/modules/gestion-personas/teletrabajo/services/admin/subscribes.service';
import { RegistersService } from '@app/modules/gestion-personas/teletrabajo/services/registers.service';
import { WorkDialogComponent } from './work-dialog.component';

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
  private workService = inject(WorkService);

  works: any[] = [];
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
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 1000);

    this.initDashboard();
  }

  async initDashboard() {
    const userId = this.tokenService.getUserId();
    const fullName = this.tokenService.getUserFullName();

    if (fullName) {
      this.userName = fullName;
    }

    if (!userId) {
      console.warn('UserId no disponible aún');
      return;
    }

    this.loadSubscriptions(userId);
    this.loadRegisters(userId);
    await this.loadWorks();
  }

  getUserId(): number | null {
    try {
      const profile = sessionStorage.getItem('profile');
      if (!profile) return null;

      const p = JSON.parse(profile);

      // 🔥 soporta todos los casos posibles
      return p?.id || p?.userId || p?.user?.id || null;
    } catch {
      return null;
    }
  }

  async loadWorks(): Promise<void> {
    try {
      const userId = this.tokenService.getUserId();

      if (!userId) {
        this.works = [];
        return;
      }

      const data = await firstValueFrom(this.workService.getByUserId(userId));

      console.log('WORKS:', data); // 👈 DEBUG CLAVE
      const sub = this.subscriptions.find(
        (s: any) => this.getSubStatus(s) === 'vigente',
      );

      this.works = (data || [])
        .map((w: any) => {
          const fecha = w.createdAt || w.created_at;

          return {
            ...w,
            createdAt: fecha,
            esHoy: this.isHoy(fecha),
          };
        })
        .filter((w: any) => {
          // 🔥 si no hay suscripción activa → no mostrar nada
          if (!sub) return false;

          // 🔥 SOLO HOY
          return w.esHoy;
        });
    } catch (e) {
      console.error('Error cargando works', e);
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
          /*
          const msg =
            `No posee una suscripción activa para teletrabajo para el día de hoy.\n\n` +
            `Para registrar marcaje debe existir un periodo de suscripción vigente.`;

          this.showWarning(msg);
          */
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

  get teleworkStatus(): string {
    return this.canMarkToday
      ? '🟢 Teletrabajo habilitado hoy'
      : '🔴 Sin suscripción activa hoy';
  }

  // ===============================
  // 🟣 ACTIVIDADES (WORKS)
  // ===============================

  async crearWork(): Promise<void> {
    const ref = this.openWorkDialog({
      title: 'Nueva actividad',
    });

    const result = await firstValueFrom(ref.afterClosed());

    if (!result) return;

    const userId = this.tokenService.getUserId();

    if (!userId) {
      this.showError('No se pudo identificar el usuario');
      return;
    }

    const sub = this.getActiveSubscription();

    const payload = {
      description: result,
      user: { id: userId },
      subscribe: sub
        ? { id: sub.id, active: true } // 🔥 AQUÍ ESTÁ LA MAGIA
        : null,
    };

    console.log('PAYLOAD CREATE:', payload);

    await firstValueFrom(this.workService.create(payload));

    this.showOk('✅ Actividad guardada');

    await this.loadWorks();
  }

  async editarWork(w: any): Promise<void> {
    if (!w.esHoy) return;

    const ref = this.openWorkDialog({
      title: 'Editar actividad',
      description: w.description,
    });

    const result = await firstValueFrom(ref.afterClosed());

    if (!result) return;

    const userId = this.tokenService.getUserId();

    if (!userId) {
      this.showError('No se pudo identificar el usuario');
      return;
    }

    const sub = this.getActiveSubscription();

    const payload = {
      description: result,
      user: { id: userId },
      subscribe: sub
        ? { id: sub.id, active: true } // 🔥 AQUÍ ESTÁ LA MAGIA
        : null,
    };

    console.log('PAYLOAD UPDATE:', payload);

    await firstValueFrom(this.workService.update(w.id, payload));

    this.showOk('✏️ Actividad actualizada');

    await this.loadWorks();
  }

  async eliminarWork(w: any): Promise<void> {
    if (!w.esHoy) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'sirus-dialog',
      data: {
        title: 'Eliminar actividad',
        message: `¿Eliminar esta actividad?\n\n"${w.description}"`,
      },
    });

    const confirm = await firstValueFrom(ref.afterClosed());

    if (!confirm) return;

    try {
      await firstValueFrom(this.workService.delete(w.id));

      this.showOk('🗑️ Actividad eliminada');
      await this.loadWorks();
    } catch (e) {
      console.error(e);
      this.showError('Error al eliminar actividad');
    }
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

  private openWorkDialog(data: any) {
    const isMobile = window.innerWidth < 600;

    return this.dialog.open(WorkDialogComponent, {
      width: isMobile ? '100%' : '520px',
      height: isMobile ? '100%' : 'auto',
      maxWidth: '100%',
      panelClass: 'sirus-dialog',
      disableClose: true,
      data,
    });
  }

  isHoy(date: string): boolean {
    const hoy = new Date();
    const d = new Date(date);

    return (
      hoy.getFullYear() === d.getFullYear() &&
      hoy.getMonth() === d.getMonth() &&
      hoy.getDate() === d.getDate()
    );
  }

  getActiveSubscription(): any | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 🔥 ESTE FALTABA

    return (
      this.subscriptions.find((s: any) => {
        const begin = new Date(s.begin);
        const end = new Date(s.end);

        begin.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999); // 🔥 ESTE TAMBIÉN

        return today >= begin && today <= end;
      }) || null
    );
  }

  getSubStatus(s: any): string {
    const today = new Date();
    const begin = new Date(s.begin);
    const end = new Date(s.end);

    // 🔥 normalizar (solo fecha, sin hora)
    today.setHours(0, 0, 0, 0);
    begin.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today >= begin && today <= end) return 'vigente';
    if (today < begin) return 'pendiente';
    return 'vencido';
  }

  getSubStatusText(s: any): string {
    const status = this.getSubStatus(s);

    if (status === 'vigente') return 'Activo hoy';
    if (status === 'pendiente') return 'Aún no inicia';
    return 'Finalizado';
  }

  showOk(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      panelClass: 'sirus-dialog',
      data: {
        message,
      },
    });
  }

  showError(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      panelClass: 'sirus-dialog',
      data: {
        message,
      },
    });
  }
}

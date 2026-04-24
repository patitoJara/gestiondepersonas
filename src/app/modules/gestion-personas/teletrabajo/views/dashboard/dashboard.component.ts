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
import { SubscribesService } from '@app/modules/gestion-personas/teletrabajo/services/admin/subscribes.service';
import { RegistersService } from '@app/modules/gestion-personas/teletrabajo/services/registers.service';
import { WorkDialogComponent } from './work-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  imports: [CommonModule, MatButtonModule, MatIconModule,MatTooltipModule],
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

  selectedDay: Date | null = null;

  allWorks: any[] = [];

  // suscripciones
  subscriptions: any[] = [];

  // permiso para marcar
  canMarkToday = false;

  constructor(
    private subscribesService: SubscribesService,
    private tokenService: TokenService,
    private registersService: RegistersService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 1000);

    this.selectedDay = new Date(); // 🔥 PRIMERO

    await this.loadWorks(); // 🔥 DESPUÉS carga + filtra

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

      this.allWorks = (data || []).map((w: any) => ({
        ...w,
        createdAt: w.createdAt || w.created_at,
      }));

      // 🔥 IMPORTANTE: no bloquear por subs (por ahora)
      this.filterWorksByDay();
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

    // 🔥 FALTABA ESTO
    const sub = this.getActiveSubscription();

    if (!sub) {
      this.showError('No hay suscripción activa');
      return;
    }

    const payload = {
      description: String(result).trim(),
      user: { id: userId },

      // 🔥 AHORA SÍ EXISTE
      subscribe: {
        id: sub.id,
        active: true,
      },
    };

    console.log('👉 PAYLOAD FINAL:', payload);

    try {
      await firstValueFrom(this.workService.update(w.id, payload));

      this.showOk('✏️ Actividad actualizada');
      await this.loadWorks();
    } catch (e) {
      console.error('❌ ERROR:', e);
      this.showError('Error al actualizar');
    }
  }

  async eliminarWork(w: any): Promise<void> {
    //if (!w.esHoy) return;

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
    const today = new Date().toISOString().split('T')[0]; // 🔥 YYYY-MM-DD

    return (
      this.subscriptions.find((s: any) => {
        const begin = s.begin.split('T')[0];
        const end = s.end.split('T')[0];

        return today >= begin && today <= end;
      }) || null
    );
  }

  private normalizeDate(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private toDateOnlyString(date: string | Date): string {
    if (typeof date === 'string') {
      return date.split('T')[0]; // 🔥 SOLO YYYY-MM-DD
    }

    const d = date;
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  private toDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  getSubStatus(s: any): string {
    const today = this.toDateOnlyString(new Date());
    const begin = this.toDateOnlyString(s.begin);
    const end = this.toDateOnlyString(s.end);

    if (today < begin) return 'pendiente';
    if (today > end) return 'vencido';
    return 'vigente';
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

  filterWorksByDay(): void {
    if (!this.selectedDay) {
      this.works = this.allWorks;
      return;
    }

    const selected = new Date(this.selectedDay);

    this.works = this.allWorks.filter((w: any) => {
      const d = new Date(w.createdAt);

      return (
        d.getFullYear() === selected.getFullYear() &&
        d.getMonth() === selected.getMonth() &&
        d.getDate() === selected.getDate()
      );
    });
  }

  isSameDay(d1: any, d2: any): boolean {
    const a = new Date(d1);
    const b = new Date(d2);

    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  fixWorkDate(dateStr: string): Date {
    const d = new Date(dateStr);
    d.setHours(d.getHours() + 1);
    return d;
  }
}

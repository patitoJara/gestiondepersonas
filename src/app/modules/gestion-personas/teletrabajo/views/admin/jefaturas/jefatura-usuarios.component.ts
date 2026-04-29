import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { firstValueFrom } from 'rxjs';

import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { LoaderService } from '@app/core/services/loader.service';
import { Location } from '@angular/common';

import { Router } from '@angular/router';

@Component({
  selector: 'app-jefatura-usuarios',
  standalone: true,
  templateUrl: './jefatura-usuarios.component.html',
  styleUrls: ['./jefatura-usuarios.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonModule,
  ],
})
export class JefaturaUsuariosComponent implements OnInit {
  loader = inject(LoaderService);
  private router = inject(Router);
  private location = inject(Location);
  private SISTEMA_USERS = ['Admin', 'Operador', 'Supervisor', 'Jefatura'];

  private initialized = false;
  private estadoInicial: string = '';

  relacionesActivas: any[] = [];

  filtroDisponible = '';
  loading = false;

  usuariosAsignados: any[] = [];
  usuariosDisponibles: any[] = [];

  selectedDisponibles: any[] = [];
  selectedAsignados: any[] = [];
  usuariosAsignadosOriginal: any[] = [];

  sinUsuariosAsignados = false;

  jefe: any = {
    id: 0,
    fullName: '',
  };

  grupo: any = {
    name: '',
    description: '',
  };

  constructor(
    private usersService: UsersService,
    private usersGroupService: UsersGroupService,
    private groupService: GroupService,
    private dialog: MatDialog,
  ) {}

  // ============================
  // 🚀 INIT
  // ============================

  async ngOnInit() {
    if (this.initialized) return;

    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');

    this.jefe.id = profile.id;
    this.jefe.fullName = profile.fullName;

    await this.cargarDatos();

    this.initialized = true;
  }

  // ============================
  // 📦 CARGA
  // ============================

  async cargarDatos() {
    try {
      this.loading = true;

      // 🧹 limpiar estado UI
      this.usuariosAsignados = [];
      this.usuariosDisponibles = [];
      this.selectedAsignados = [];
      this.selectedDisponibles = [];

      const [all, relaciones, groups] = await Promise.all([
        firstValueFrom(this.usersService.getAll()),
        firstValueFrom(this.usersGroupService.getAll()),
        firstValueFrom(this.groupService.getAll()),
      ]);

      // =========================================
      // 🟦 GROUP DEL JEFE
      // =========================================
      const group = (groups as any[]).find((g) => g.user?.id === this.jefe.id);

      this.grupo.name = group?.name || '';
      this.grupo.description = group?.description || '';

      // =========================================
      // 👤 NORMALIZAR USUARIOS
      // =========================================
      const usuariosNormalizados = (all as any[]).map((u) => this.buildUser(u));

      const usuariosValidos = usuariosNormalizados.filter(
        (u) => !this.isSistema(u),
      );

      // =========================================
      // ☠️ FILTRAR BORRADOS LÓGICOS (🔥 CLAVE)
      // =========================================
      const relacionesActivas = (relaciones as any[]).filter(
        (r) => !r.deletedAt,
      );

      // =========================================
      // 🔗 USUARIOS QUE YA TIENEN GRUPO
      // =========================================
      const usuariosConGrupo = new Set(
        relacionesActivas.map((r) => r.user?.id),
      );

      // =========================================
      // 🟩 ASIGNADOS (DE ESTE JEFE + SIN DUPLICADOS)
      // =========================================
      const uniqueMap = new Map<number, any>();

      relacionesActivas
        .filter((r) => r.group?.user?.id === this.jefe.id)
        .forEach((r) => {
          const user = this.buildUser(r.user);

          if (!uniqueMap.has(user.id)) {
            uniqueMap.set(user.id, user);
          }
        });

      this.usuariosAsignados = Array.from(uniqueMap.values());

      // =========================================
      // 📦 DISPONIBLES (NO ESTÉN EN NINGÚN GRUPO)
      // =========================================
      this.usuariosDisponibles = usuariosValidos.filter(
        (u) => !usuariosConGrupo.has(u.id),
      );

      this.sinUsuariosAsignados = this.usuariosAsignados.length === 0;
      this.relacionesActivas = relacionesActivas;

      this.estadoInicial = JSON.stringify({
        grupo: this.grupo,
        asignados: this.usuariosAsignados.map((u) => u.id),
      });

      console.log('ASIGNADOS 👉', this.usuariosAsignados);
      console.log('DISPONIBLES 👉', this.usuariosDisponibles);
    } catch (error) {
      console.error('❌ ERROR CARGANDO DATOS', error);
      this.showWarning('Error al cargar la jefatura');
    } finally {
      this.loading = false;
    }
  }

  // ============================
  // 🔍 FILTRO
  // ============================

  usuariosDisponiblesFiltrados() {
    if (!this.filtroDisponible) return this.usuariosDisponibles;

    return this.usuariosDisponibles.filter((u) =>
      u.fullName.toLowerCase().includes(this.filtroDisponible.toLowerCase()),
    );
  }

  // ========================
  // ➡ AGREGAR
  // ========================

  agregar() {
    const validos = this.selectedDisponibles.filter((u) =>
      this.validarMovimiento(u),
    );

    if (validos.length === 0) return;

    this.usuariosAsignados.push(...validos);

    this.usuariosDisponibles = this.usuariosDisponibles.filter(
      (u) => !validos.includes(u),
    );

    this.selectedDisponibles = [];
  }

  // ========================
  // ⬅ QUITAR
  // ========================

  quitar() {
    this.usuariosDisponibles.push(...this.selectedAsignados);

    this.usuariosAsignados = this.usuariosAsignados.filter(
      (u) => !this.selectedAsignados.includes(u),
    );

    this.selectedAsignados = [];
  }

  // ============================
  // 💾 GUARDAR
  // ============================

  async guardar() {
    if (!this.hayCambios()) {
      this.showWarning('⚠️ No hay cambios para guardar');
      return;
    }

    this.loader.lock();

    try {
      this.loading = true;

      // =========================
      // 🟦 GROUP
      // =========================
      const groups = await firstValueFrom(this.groupService.getAll());

      const existingGroup = (groups as any[]).find(
        (g) => g.user?.id === this.jefe.id,
      );

      let groupId: number | null = null;

      if (existingGroup) {
        const updated = await firstValueFrom(
          this.groupService.update(existingGroup.id, {
            id: existingGroup.id,
            user: { id: this.jefe.id },
            name: this.grupo.name || 'Jefatura',
            description: this.grupo.description || '',
          }),
        );

        groupId = updated.id ?? null;
      } else {
        const created = await firstValueFrom(
          this.groupService.create({
            user: { id: this.jefe.id },
            name: this.grupo.name || 'Jefatura',
            description: this.grupo.description || '',
          }),
        );

        groupId = created.id ?? null;
      }

      if (!groupId) throw new Error('Group no creado');

      // =========================
      // 🧹 LIMPIEZA FRONT
      // =========================
      const ids = new Set();

      this.usuariosAsignados = this.usuariosAsignados
        .filter((u) => u.id !== this.jefe.id)
        .filter((u) => {
          if (ids.has(u.id)) return false;
          ids.add(u.id);
          return true;
        });

      // =========================
      // 🟩 BORRAR RELACIONES
      // =========================
      const relaciones = await firstValueFrom(this.usersGroupService.getAll());

      const relacionesDelGrupo = (relaciones as any[]).filter(
        (r) => r.group?.id === groupId,
      );

      await Promise.all(
        relacionesDelGrupo.map((r) =>
          firstValueFrom(this.usersGroupService.delete(r.id)),
        ),
      );

      // =========================
      // 🟢 CREAR RELACIONES
      // =========================
      if (this.usuariosAsignados.length > 0) {
        await Promise.all(
          this.usuariosAsignados.map((u) =>
            firstValueFrom(
              this.usersGroupService.create({
                user: { id: u.id },
                group: { id: groupId },
              }),
            ),
          ),
        );
      }

      // =========================
      // 🔄 RECARGA
      // =========================
      await this.cargarDatos();

      this.showWarning('✅ Guardado completo');
    } catch (error) {
      console.error('❌ ERROR', error);
      this.showWarning('❌ Error al guardar');
    } finally {
      this.loader.unlock();
      this.loading = false;
    }
  }

  // ============================
  // ⚠️ MENSAJES
  // ============================

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Información',
        message: message,
        icon: 'info',
        color: 'primary',
        confirmText: 'Aceptar',
      },
    });
  }

  private buildUser(u: any) {
    return {
      ...u,
      fullName: [u.firstName, u.secondName, u.firstLastName, u.secondLastName]
        .filter(Boolean)
        .join(' '),
    };
  }

  // 🔥 FILTRO SISTEMA
  private isSistema(u: any): boolean {
    return this.SISTEMA_USERS.includes(u.firstName);
  }

  private validarMovimiento(u: any): boolean {
    const nombre = u.fullName || 'Este usuario';

    // 🚫 NO puede asignarse a su propia jefatura
    if (u.id === this.jefe.id) {
      this.showWarning(
        `"${nombre}" no puede autoasignarse a su propia jefatura.`,
      );
      return false;
    }

    // 🚫 evitar duplicado en esta jefatura
    const yaExisteEnEsteGrupo = this.usuariosAsignados.some(
      (a) => a.id === u.id,
    );

    if (yaExisteEnEsteGrupo) {
      this.showWarning(`"${nombre}" ya está asignado a esta jefatura.`);
      return false;
    }

    return true;
  }

  cancel(): void {
    this.dialog
      .open(ConfirmDialogOkComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'Salir sin guardar',
          message: 'Tienes cambios sin guardar. ¿Deseas salir?',
          confirmText: 'Salir',
          cancelText: 'Quedarme',
          icon: 'warning',
          color: 'warn',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.location.back(); // 🔥 vuelve al menú real
        }
      });
  }

  hayCambios(): boolean {
    const estadoActual = JSON.stringify({
      grupo: this.grupo,
      asignados: this.usuariosAsignados.map((u: any) => u.id),
    });

    return estadoActual !== this.estadoInicial;
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

import { firstValueFrom } from 'rxjs';

import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { LoaderService } from '@app/core/services/loader.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { UserSearchService } from '@app/modules/gestion-personas/teletrabajo/services/admin/user-search.service';

@Component({
  selector: 'app-jefatura-usuarios',
  standalone: true,
  templateUrl: './jefatura-usuarios.component.html',
  styleUrls: ['./jefatura-usuarios.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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

  busquedaDisponible = new FormControl('');
  loading = false;

  /**
   * IDs de funcionarios que ya pertenecen a alguna jefatura.
   * Se utiliza para excluirlos de los resultados disponibles.
   */
  

  usuariosAsignados: any[] = [];
  usuariosDisponibles: any[] = [];

  /**
   * Resultados originales entregados por el buscador inteligente.
   * No se modifican directamente al mover funcionarios.
   */
  private resultadosBusquedaDisponibles: any[] = [];

  /**
   * Usuarios ocupados por otras jefaturas.
   * Los integrantes de esta misma jefatura no se incluyen aquí,
   * porque deben poder quitarse y volver a agregarse antes de guardar.
   */
  private usuariosConOtrosGruposIds = new Set<number>();

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
    private usersGroupService: UsersGroupService,
    private groupService: GroupService,
    private dialog: MatDialog,
    private userSearchService: UserSearchService,
  ) {}

  // ============================
  // 🚀 INIT
  // ============================

  async ngOnInit() {
    if (this.initialized) return;

    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');

    this.jefe.id = profile.id;
    this.jefe.fullName = profile.fullName;

    /**
     * Conectamos el buscador inteligente:
     * - espera 300 ms
     * - consulta backend solamente con las primeras 3 letras
     * - mantiene cache por prefijo
     * - permite buscar múltiples palabras separadas
     */
    this.conectarBusquedaDisponible();

    /**
     * La carga inicial ya no descarga todos los usuarios.
     */
    await this.cargarDatos();

    this.initialized = true;
  }

  // ============================
  // 📦 CARGA
  // ============================

  async cargarDatos() {
    try {
      this.loading = true;

      // 🧹 Limpiar estado visual
      this.usuariosAsignados = [];
      this.usuariosDisponibles = [];
      this.selectedAsignados = [];
      this.selectedDisponibles = [];

      /**
       * Ya no descargamos usersService.getAll().
       *
       * Solamente necesitamos:
       * - grupos
       * - relaciones activas usuario-grupo
       */
      const [relaciones, groups] = await Promise.all([
        firstValueFrom(this.usersGroupService.getAll()),

        firstValueFrom(this.groupService.getAll()),
      ]);

      // =========================================
      // 🟦 GRUPO DE LA JEFATURA
      // =========================================

      const group = (groups as any[]).find((g) => g.user?.id === this.jefe.id);

      this.grupo.name = group?.name || '';
      this.grupo.description = group?.description || '';

      // =========================================
      // 🔗 RELACIONES ACTIVAS
      // =========================================

      const relacionesActivas = (relaciones as any[]).filter(
        (relation) => !relation.deletedAt && !relation.deleted_at,
      );

      this.relacionesActivas = relacionesActivas;

      /**
       * Usuarios que pertenecen a OTRAS jefaturas.
       *
       * Los funcionarios de esta jefatura no se bloquean,
       * porque deben poder moverse temporalmente entre ambas columnas.
       */
      this.usuariosConOtrosGruposIds = new Set<number>(
        relacionesActivas
          .filter((relation: any) => relation.group?.user?.id !== this.jefe.id)
          .map((relation: any) => relation.user?.id)
          .filter(Boolean),
      );

      // =========================================
      // 🟩 ASIGNADOS A ESTA JEFATURA
      // =========================================

      const uniqueMap = new Map<number, any>();

      relacionesActivas
        .filter((relation) => relation.group?.user?.id === this.jefe.id)
        .forEach((relation) => {
          const user = this.buildUser(relation.user);

          if (!uniqueMap.has(user.id)) {
            uniqueMap.set(user.id, user);
          }
        });

      this.usuariosAsignados = Array.from(uniqueMap.values());

      /**
       * Disponibles comienza vacío.
       * Se llena solamente al buscar.
       */
      this.usuariosDisponibles = [];

      this.sinUsuariosAsignados = this.usuariosAsignados.length === 0;

      this.estadoInicial = JSON.stringify({
        grupo: this.grupo,

        asignados: this.usuariosAsignados.map((user) => user.id),
      });

      console.log('✅ ASIGNADOS:', this.usuariosAsignados);

      console.log('✅ CARGA INICIAL LIVIANA');
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

  // ============================
  // 🔍 BÚSQUEDA INTELIGENTE
  // ============================

  private conectarBusquedaDisponible(): void {
    this.userSearchService
      .search(this.busquedaDisponible.valueChanges)
      .subscribe((users: any[]) => {
        /**
         * Conservamos los resultados originales.
         * La lista visible se calcula por separado.
         */
        this.resultadosBusquedaDisponibles = (users || []).map((user: any) =>
          this.buildUser(user),
        );

        this.actualizarUsuariosDisponibles();

        console.log(
          '🔍 RESULTADOS BÚSQUEDA:',
          this.resultadosBusquedaDisponibles,
        );

        console.log('✅ DISPONIBLES VISIBLES:', this.usuariosDisponibles);
      });
  }

  private actualizarUsuariosDisponibles(): void {
    const term = String(this.busquedaDisponible.value || '').trim();

    /**
     * Sin búsqueda válida no mostramos resultados.
     */
    if (term.length < 3) {
      this.usuariosDisponibles = [];
      this.selectedDisponibles = [];

      return;
    }

    const idsAsignados = new Set<number>(
      this.usuariosAsignados.map((user: any) => user.id),
    );

    this.usuariosDisponibles = this.resultadosBusquedaDisponibles
      .filter((user: any) => user.id !== this.jefe.id)
      .filter((user: any) => !idsAsignados.has(user.id))
      .filter((user: any) => !this.usuariosConOtrosGruposIds.has(user.id))
      .filter((user: any) => !this.isSistemaPorNombre(user));

    this.selectedDisponibles = [];
  }

  limpiarBusquedaDisponible(): void {
    this.busquedaDisponible.setValue('');

    this.resultadosBusquedaDisponibles = [];
    this.usuariosDisponibles = [];

    this.selectedDisponibles = [];
  }

  hayBusquedaDisponibleValida(): boolean {
    return String(this.busquedaDisponible.value || '').trim().length >= 3;
  }

  private isSistemaPorNombre(user: any): boolean {
    const firstWord = String(user?.fullName || '')
      .trim()
      .split(' ')[0];

    return this.SISTEMA_USERS.includes(firstWord);
  }

  // ========================
  // ➡ AGREGAR
  // ========================

  agregar() {
    const validos = this.selectedDisponibles.filter((user) =>
      this.validarMovimiento(user),
    );

    if (!validos.length) {
      return;
    }

    /**
     * Evitamos duplicados.
     */
    const idsAsignados = new Set<number>(
      this.usuariosAsignados.map((user: any) => user.id),
    );

    const nuevos = validos.filter((user: any) => !idsAsignados.has(user.id));

    this.usuariosAsignados.push(...nuevos);

    this.selectedDisponibles = [];

    /**
     * No limpiamos el texto buscado.
     * La lista encontrada permanece visible y solamente
     * desaparecen quienes acabamos de mover.
     */
    this.actualizarUsuariosDisponibles();
  }

  // ========================
  // ⬅ QUITAR
  // ========================

  quitar() {
    if (!this.selectedAsignados.length) {
      return;
    }

    const idsQuitados = new Set<number>(
      this.selectedAsignados.map((user: any) => user.id),
    );

    this.usuariosAsignados = this.usuariosAsignados.filter(
      (user: any) => !idsQuitados.has(user.id),
    );

    this.selectedAsignados = [];

    /**
     * No insertamos directamente en disponibles.
     *
     * Recalculamos la columna izquierda usando
     * el texto actualmente buscado.
     */
    this.actualizarUsuariosDisponibles();
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
    const fullName =
      String(u?.fullName || u?.full_name || '').trim() ||
      [u?.firstName, u?.secondName, u?.firstLastName, u?.secondLastName]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
      ...u,
      fullName,
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

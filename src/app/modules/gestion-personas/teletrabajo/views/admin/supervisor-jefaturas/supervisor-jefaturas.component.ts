import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { LoaderService } from '@app/core/services/loader.service';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { UserSearchService } from '@app/modules/gestion-personas/teletrabajo/services/admin/user-search.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';

@Component({
  selector: 'app-supervisor-jefaturas',
  standalone: true,
  templateUrl: './supervisor-jefaturas.component.html',
  styleUrls: ['./supervisor-jefaturas.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatTooltipModule,
  ],
})
export class SupervisorJefaturasComponent implements OnInit {
  loader = inject(LoaderService);

  busquedaJefatura = new FormControl('');
  busquedaDisponible = new FormControl('');
  filtroJefaturasExistentes = new FormControl('');

  jefaturasEncontradas: any[] = [];
  resultadosBusquedaDisponibles: any[] = [];
  jefaturasExistentes: any[] = [];

  loadingJefaturasExistentes = false;

  jefeSeleccionado: any = null;

  grupo: any = {
    id: null,
    name: '',
    description: '',
  };

  usuariosAsignados: any[] = [];
  usuariosDisponibles: any[] = [];

  selectedDisponibles: any[] = [];
  selectedAsignados: any[] = [];
  avisosFuncionariosSeleccionados: any[] = [];

  loadingJefatura = false;
  saving = false;

  modoTrabajo: 'inicio' | 'existente' | 'nueva' = 'inicio';

  tieneRolJefatura = false;
  rolJefaturaAsignadoAhora = false;
  grupoExistente = false;

  private estadoInicial = '';
  private relacionesActivas: any[] = [];
  private otrosGruposPorUsuario = new Map<number, any[]>();
  private readonly USUARIOS_SISTEMA = [
    'ADMIN',
    'OPERADOR',
    'SUPERVISOR',
    'JEFATURA',
  ];

  constructor(
    private usersService: UsersService,
    private usersGroupService: UsersGroupService,
    private groupService: GroupService,
    private userSearchService: UserSearchService,
    private dialog: MatDialog,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.conectarBusquedaJefatura();
    this.conectarBusquedaDisponible();
  }

  mostrarJefaturasExistentes(): void {
    this.modoTrabajo = 'existente';
    this.resetSeleccion();
    void this.cargarJefaturasExistentes();
  }

  crearNuevaJefatura(): void {
    this.modoTrabajo = 'nueva';
    this.resetSeleccion();
  }

  volverAlInicio(): void {
    this.modoTrabajo = 'inicio';
    this.resetSeleccion();
    this.jefaturasExistentes = [];
    this.jefaturasEncontradas = [];
    this.limpiarBusquedaJefatura();
    this.limpiarFiltroJefaturasExistentes();
  }

  // ============================================================
  // LISTADO LIVIANO DE JEFATURAS EXISTENTES
  // ============================================================

  async cargarJefaturasExistentes(): Promise<void> {
    this.loadingJefaturasExistentes = true;

    try {
      const groups = await firstValueFrom(this.groupService.getAll());

      this.jefaturasExistentes = (groups || [])
        .filter(
          (group: any) =>
            !group.deletedAt && !group.deleted_at && group.user?.id,
        )
        .map((group: any) => ({
          ...group,
          jefe: this.buildUser(group.user),
        }))
        .sort((a: any, b: any) =>
          String(a?.name || a?.jefe?.fullName || '').localeCompare(
            String(b?.name || b?.jefe?.fullName || ''),
          ),
        );

      console.log('✅ JEFATURAS EXISTENTES:', this.jefaturasExistentes);
    } catch (error) {
      console.error('❌ ERROR CARGANDO JEFATURAS EXISTENTES:', error);

      this.jefaturasExistentes = [];
      this.showMessage('No fue posible cargar las jefaturas existentes.');
    } finally {
      this.loadingJefaturasExistentes = false;
    }
  }

  get jefaturasExistentesFiltradas(): any[] {
    const words = this.normalizeText(this.filtroJefaturasExistentes.value)
      .split(' ')
      .filter(Boolean);

    if (!words.length) {
      return this.jefaturasExistentes;
    }

    return this.jefaturasExistentes.filter((group: any) => {
      const searchableText = this.normalizeText(
        [group?.name, group?.description, group?.jefe?.fullName]
          .filter(Boolean)
          .join(' '),
      );

      return words.every((word: string) => searchableText.includes(word));
    });
  }

  limpiarFiltroJefaturasExistentes(): void {
    this.filtroJefaturasExistentes.setValue('');
  }

  async abrirJefaturaExistente(group: any): Promise<void> {
    if (!group?.jefe?.id) {
      return;
    }

    this.modoTrabajo = 'existente';
    await this.seleccionarJefatura(group.jefe);
  }

  // ============================================================
  // BUSCADOR PRINCIPAL DE JEFATURA
  // ============================================================

  private conectarBusquedaJefatura(): void {
    this.userSearchService
      .search(this.busquedaJefatura.valueChanges)
      .subscribe((users: any[]) => {
        const term = String(this.busquedaJefatura.value || '').trim();

        if (term.length < 3) {
          this.jefaturasEncontradas = [];
          return;
        }

        this.jefaturasEncontradas = (users || [])
          .map((user: any) => this.buildUser(user))
          .filter((user: any) => !this.isSistema(user));
      });
  }

  limpiarBusquedaJefatura(): void {
    this.busquedaJefatura.setValue('');
    this.jefaturasEncontradas = [];
  }

  async seleccionarJefatura(user: any): Promise<void> {
    if (!user?.id || this.loadingJefatura) {
      return;
    }

    this.loader.lock();
    this.loadingJefatura = true;

    try {
      this.jefeSeleccionado = this.buildUser(user);
      this.limpiarBusquedaJefatura();

      await this.asegurarRolJefatura(this.jefeSeleccionado.id);
      await this.cargarConfiguracionJefatura();
    } catch (error) {
      console.error('❌ ERROR SELECCIONANDO JEFATURA:', error);
      this.showMessage('No fue posible cargar la jefatura seleccionada.');
      this.resetSeleccion();
    } finally {
      this.loadingJefatura = false;
      this.loader.unlock();
    }
  }

  private async asegurarRolJefatura(userId: number): Promise<void> {
    const [roles, rolesUsuario] = await Promise.all([
      firstValueFrom(this.usersService.getRoles()),
      firstValueFrom(this.usersService.getUserRoles(userId)),
    ]);

    const relacionesActivas = (rolesUsuario || []).filter(
      (relation: any) => !relation.deletedAt && !relation.deleted_at,
    );

    const yaTieneRol = relacionesActivas.some(
      (relation: any) =>
        String(relation.role?.name || '').toUpperCase() === 'JEFATURA',
    );

    if (yaTieneRol) {
      this.tieneRolJefatura = true;
      this.rolJefaturaAsignadoAhora = false;
      return;
    }

    const rolJefatura = (roles || []).find(
      (role: any) => String(role?.name || '').toUpperCase() === 'JEFATURA',
    );

    if (!rolJefatura?.id) {
      throw new Error('No existe el rol JEFATURA en el catálogo de roles');
    }

    await firstValueFrom(
      this.usersService.addUserRole(userId, Number(rolJefatura.id)),
    );

    this.tieneRolJefatura = true;
    this.rolJefaturaAsignadoAhora = true;
  }

  // ============================================================
  // CARGAR GRUPO Y FUNCIONARIOS EXISTENTES
  // ============================================================

  private async cargarConfiguracionJefatura(): Promise<void> {
    const [groups, relations] = await Promise.all([
      firstValueFrom(this.groupService.getAll()),
      firstValueFrom(this.usersGroupService.getAll()),
    ]);

    this.relacionesActivas = (relations || []).filter(
      (relation: any) => !relation.deletedAt && !relation.deleted_at,
    );

    const existingGroup = (groups || []).find(
      (group: any) =>
        !group.deletedAt &&
        !group.deleted_at &&
        Number(group.user?.id) === Number(this.jefeSeleccionado.id),
    );

    this.grupoExistente = Boolean(existingGroup?.id);

    this.grupo = {
      id: existingGroup?.id || null,
      name: existingGroup?.name || '',
      description: existingGroup?.description || '',
    };

    const currentGroupId = Number(existingGroup?.id || 0);

    const assignedMap = new Map<number, any>();

    this.relacionesActivas
      .filter(
        (relation: any) =>
          currentGroupId > 0 && Number(relation.group?.id) === currentGroupId,
      )
      .forEach((relation: any) => {
        const user = this.buildUser(relation.user);

        if (user?.id && !assignedMap.has(user.id)) {
          assignedMap.set(user.id, user);
        }
      });

    this.usuariosAsignados = Array.from(assignedMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );

    this.otrosGruposPorUsuario = new Map<number, any[]>();

    this.relacionesActivas
      .filter(
        (relation: any) =>
          !currentGroupId || Number(relation.group?.id) !== currentGroupId,
      )
      .forEach((relation: any) => {
        const userId = Number(relation.user?.id || 0);

        if (!userId) {
          return;
        }

        const current = this.otrosGruposPorUsuario.get(userId) || [];

        current.push({
          groupId: relation.group?.id,
          groupName: relation.group?.name || 'Grupo sin nombre',
          groupDescription: relation.group?.description || '',
          jefe: this.buildUser(relation.group?.user),
        });

        this.otrosGruposPorUsuario.set(userId, current);
      });

    this.resultadosBusquedaDisponibles = [];
    this.usuariosDisponibles = [];
    this.selectedDisponibles = [];
    this.selectedAsignados = [];
    this.busquedaDisponible.setValue('');

    this.estadoInicial = this.crearEstadoActual();
  }

  // ============================================================
  // BUSCADOR DE FUNCIONARIOS DISPONIBLES
  // ============================================================

  private conectarBusquedaDisponible(): void {
    this.userSearchService
      .search(this.busquedaDisponible.valueChanges)
      .subscribe((users: any[]) => {
        this.resultadosBusquedaDisponibles = (users || []).map((user: any) =>
          this.buildUser(user),
        );

        this.actualizarUsuariosDisponibles();
      });
  }

  private actualizarUsuariosDisponibles(): void {
    const term = String(this.busquedaDisponible.value || '').trim();

    if (!this.jefeSeleccionado || term.length < 3) {
      this.usuariosDisponibles = [];
      this.selectedDisponibles = [];
      this.avisosFuncionariosSeleccionados = [];
      return;
    }

    const assignedIds = new Set<number>(
      this.usuariosAsignados.map((user: any) => Number(user.id)),
    );

    this.usuariosDisponibles = this.resultadosBusquedaDisponibles
      .filter(
        (user: any) => Number(user.id) !== Number(this.jefeSeleccionado.id),
      )
      .filter((user: any) => !assignedIds.has(Number(user.id)))
      .filter((user: any) => !this.isSistema(user))
      .map((user: any) => {
        const otrosGrupos =
          this.otrosGruposPorUsuario.get(Number(user.id)) || [];

        return {
          ...user,
          otrosGrupos,
          perteneceAOtraJefatura: otrosGrupos.length > 0,
        };
      });

    this.selectedDisponibles = [];
  }

  limpiarBusquedaDisponible(): void {
    this.busquedaDisponible.setValue('');
    this.resultadosBusquedaDisponibles = [];
    this.usuariosDisponibles = [];
    this.selectedDisponibles = [];
    this.avisosFuncionariosSeleccionados = [];
  }

  hayBusquedaJefaturaValida(): boolean {
    return String(this.busquedaJefatura.value || '').trim().length >= 3;
  }

  hayBusquedaDisponibleValida(): boolean {
    return String(this.busquedaDisponible.value || '').trim().length >= 3;
  }

  get seleccionadosConOtrosGrupos(): any[] {
    return (this.selectedDisponibles || []).filter(
      (user: any) => user?.perteneceAOtraJefatura,
    );
  }

  actualizarAvisosFuncionariosSeleccionados(event?: any): void {
    const seleccionados = event?.source?.selectedOptions?.selected
      ? event.source.selectedOptions.selected.map((option: any) => option.value)
      : this.selectedDisponibles || [];

    this.avisosFuncionariosSeleccionados = seleccionados.filter(
      (user: any) => user?.perteneceAOtraJefatura,
    );
  }

  // ============================================================
  // MOVER FUNCIONARIOS ENTRE COLUMNAS
  // ============================================================

  agregar(): void {
    if (!this.selectedDisponibles.length) {
      return;
    }

    const assignedIds = new Set<number>(
      this.usuariosAsignados.map((user: any) => Number(user.id)),
    );

    const nuevos = this.selectedDisponibles.filter(
      (user: any) => !assignedIds.has(Number(user.id)),
    );

    this.usuariosAsignados = [...this.usuariosAsignados, ...nuevos].sort(
      (a, b) => a.fullName.localeCompare(b.fullName),
    );

    this.selectedDisponibles = [];
    this.avisosFuncionariosSeleccionados = [];
    this.actualizarUsuariosDisponibles();
  }

  quitar(): void {
    if (!this.selectedAsignados.length) {
      return;
    }

    const removedIds = new Set<number>(
      this.selectedAsignados.map((user: any) => Number(user.id)),
    );

    this.usuariosAsignados = this.usuariosAsignados.filter(
      (user: any) => !removedIds.has(Number(user.id)),
    );

    this.selectedAsignados = [];
    this.actualizarUsuariosDisponibles();
  }

  // ============================================================
  // GUARDAR SOLO DIFERENCIAS
  // ============================================================

  async guardar(): Promise<void> {
    if (!this.jefeSeleccionado) {
      this.showMessage('Primero debe seleccionar una jefatura.');
      return;
    }

    if (!this.hayCambios()) {
      this.showMessage('No hay cambios para guardar.');
      return;
    }

    this.loader.lock();
    this.saving = true;

    try {
      const groupId = await this.guardarGrupo();

      const currentRelations = this.relacionesActivas.filter(
        (relation: any) => Number(relation.group?.id) === Number(groupId),
      );

      const originalIds = new Set<number>(
        currentRelations.map((relation: any) => Number(relation.user?.id)),
      );

      const finalIds = new Set<number>(
        this.usuariosAsignados.map((user: any) => Number(user.id)),
      );

      const removedRelations = currentRelations.filter(
        (relation: any) => !finalIds.has(Number(relation.user?.id)),
      );

      const addedIds = Array.from(finalIds).filter(
        (userId: number) => !originalIds.has(userId),
      );

      if (removedRelations.length) {
        await Promise.all(
          removedRelations
            .filter((relation: any) => relation?.id)
            .map((relation: any) =>
              firstValueFrom(this.usersGroupService.delete(relation.id)),
            ),
        );
      }

      if (addedIds.length) {
        await Promise.all(
          addedIds.map((userId: number) =>
            firstValueFrom(
              this.usersGroupService.create({
                user: { id: userId },
                group: { id: groupId },
              }),
            ),
          ),
        );
      }

      await this.cargarConfiguracionJefatura();
      await this.cargarJefaturasExistentes();
      this.showMessage('Jefatura guardada correctamente.');
    } catch (error) {
      console.error('❌ ERROR GUARDANDO JEFATURA:', error);
      this.showMessage('No fue posible guardar los cambios.');
    } finally {
      this.saving = false;
      this.loader.unlock();
    }
  }

  private async guardarGrupo(): Promise<number> {
    const payload = {
      user: { id: Number(this.jefeSeleccionado.id) },
      name: String(this.grupo.name || '').trim() || 'Jefatura',
      description: String(this.grupo.description || '').trim(),
    };

    if (this.grupo?.id) {
      const updated: any = await firstValueFrom(
        this.groupService.update(Number(this.grupo.id), {
          id: Number(this.grupo.id),
          ...payload,
        }),
      );

      return Number(updated?.id || this.grupo.id);
    }

    const created: any = await firstValueFrom(
      this.groupService.create(payload),
    );

    if (!created?.id) {
      throw new Error('El backend no retornó el ID del nuevo grupo');
    }

    return Number(created.id);
  }

  // ============================================================
  // UI Y HELPERS
  // ============================================================

  resetSeleccion(): void {
    this.jefeSeleccionado = null;
    this.grupo = { id: null, name: '', description: '' };
    this.usuariosAsignados = [];
    this.usuariosDisponibles = [];
    this.resultadosBusquedaDisponibles = [];
    this.selectedDisponibles = [];
    this.selectedAsignados = [];
    this.tieneRolJefatura = false;
    this.rolJefaturaAsignadoAhora = false;
    this.grupoExistente = false;
    this.estadoInicial = '';
    this.busquedaDisponible.setValue('');
  }

  volver(): void {
    this.location.back();
  }

  hayCambios(): boolean {
    return (
      Boolean(this.jefeSeleccionado) &&
      this.crearEstadoActual() !== this.estadoInicial
    );
  }

  private crearEstadoActual(): string {
    return JSON.stringify({
      groupId: Number(this.grupo?.id || 0),
      name: String(this.grupo?.name || '').trim(),
      description: String(this.grupo?.description || '').trim(),
      assigned: this.usuariosAsignados
        .map((user: any) => Number(user.id))
        .sort((a: number, b: number) => a - b),
    });
  }

  private normalizeText(value: any): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildUser(user: any): any {
    const fullName =
      String(user?.fullName || user?.full_name || '').trim() ||
      [
        user?.firstName,
        user?.secondName,
        user?.firstLastName,
        user?.secondLastName,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
      ...user,
      fullName,
    };
  }

  private isSistema(user: any): boolean {
    const firstWord = String(user?.fullName || user?.firstName || '')
      .trim()
      .split(' ')[0]
      .toUpperCase();

    return this.USUARIOS_SISTEMA.includes(firstWord);
  }

  showMessage(message: string): void {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '430px',
      disableClose: true,
      data: {
        title: 'Administración de jefaturas',
        message,
        icon: 'info',
        color: 'primary',
        confirmText: 'Aceptar',
      },
    });
  }
}

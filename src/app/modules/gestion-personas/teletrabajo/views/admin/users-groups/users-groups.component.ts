import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { LoaderService } from '@app/core/services/loader.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupReportService } from '@app/modules/gestion-personas/teletrabajo/services/reports/group-report.service';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

@Component({
  selector: 'app-users-groups',
  standalone: true,
  templateUrl: './users-groups.component.html',
  styleUrls: ['./users-groups.component.scss'],
  imports: [CommonModule, MatIconModule],
})
export class UsersGroupsComponent implements OnInit {
  private loader = inject(LoaderService);
  private dialog = inject(MatDialog);
  private groupService = inject(GroupService);
  private usersGroupService = inject(UsersGroupService);
  private teleworkReport = inject(TeleworkReportPrintService);
  private groupReport = inject(GroupReportService);

  groups: any[] = [];
  relations: any[] = [];

  usersInGroup: any[] = [];
  selectedGroup: any = null;

  loadingUsers = false;
  loadingGroups = false;

  private relationsLoaded = false;
  private relationsLoadPromise: Promise<void> | null = null;

  /**
   * Cache local:
   * después de abrir un grupo por primera vez,
   * sus usuarios quedan almacenados en memoria.
   */
  private groupUsersCache = new Map<number, any[]>();

  /**
   * Cantidad de funcionarios activos por grupo.
   * Se calcula con las relaciones usuario-grupo.
   */
  private groupUsersCount = new Map<number, number>();

  /**
   * Usuarios internos del sistema que no deben aparecer.
   */
  private systemUserIds: number[] = [1, 2, 3, 4];

  ngOnInit(): void {
    void this.loadGroups();
  }

  // ============================================================
  // CARGA INICIAL DE GRUPOS Y RELACIONES PARA AUDITORÍA
  // ============================================================

  /**
   * Esta pantalla es de auditoría, por eso conviene cargar:
   * - grupos
   * - relaciones activas
   *
   * Así se puede mostrar inmediatamente:
   * - grupos vacíos
   * - cantidad de funcionarios
   * - nombres genéricos
   */
  async loadGroups(): Promise<void> {
    this.loader.show();
    this.loadingGroups = true;

    try {
      const [groupsRaw, relationsRaw] = await Promise.all([
        firstValueFrom(this.groupService.getAll()),
        firstValueFrom(this.usersGroupService.getAll()),
      ]);

      const groups = Array.isArray(groupsRaw) ? groupsRaw : [];
      this.relations = Array.isArray(relationsRaw) ? relationsRaw : [];
      this.relationsLoaded = true;

      this.actualizarContadoresPorGrupo();

      const activeGroups = groups.filter(
        (group: any) => !group?.deletedAt && !group?.deleted_at,
      );

      const uniqueGroups = Array.from(
        new Map<number, any>(
          activeGroups
            .filter((group: any) => group?.id)
            .map((group: any) => [Number(group.id), group]),
        ).values(),
      );

      this.groups = uniqueGroups.sort((groupA: any, groupB: any) =>
        this.getGroupDisplayName(groupA).localeCompare(
          this.getGroupDisplayName(groupB),
        ),
      );

      console.log('✅ GROUPS LOADED:', this.groups.length);
      console.log('✅ USER-GROUP RELATIONS LOADED:', this.relations.length);
    } catch (error) {
      console.error('ERROR loadGroups:', error);
      this.groups = [];
      this.relations = [];
      this.groupUsersCount.clear();

      this.showWarning('No fue posible cargar los grupos');
    } finally {
      this.loadingGroups = false;
      this.loader.hide();
    }
  }

  // ============================================================
  // CARGA DIFERIDA DE RELACIONES
  // ============================================================

  private async ensureRelationsLoaded(): Promise<void> {
    if (this.relationsLoaded) {
      return;
    }

    if (this.relationsLoadPromise) {
      return this.relationsLoadPromise;
    }

    this.relationsLoadPromise = this.loadRelations();

    try {
      await this.relationsLoadPromise;
    } finally {
      this.relationsLoadPromise = null;
    }
  }

  private async loadRelations(): Promise<void> {
    const relationsRaw = await firstValueFrom(this.usersGroupService.getAll());

    this.relations = Array.isArray(relationsRaw) ? relationsRaw : [];
    this.actualizarContadoresPorGrupo();
    this.relationsLoaded = true;

    console.log('✅ USER-GROUP RELATIONS LOADED:', this.relations.length);
  }

  private actualizarContadoresPorGrupo(): void {
    const countMap = new Map<number, Set<number>>();

    (this.relations || [])
      .filter((relation: any) => this.isActiveRelation(relation))
      .filter((relation: any) => relation.group?.id && relation.user?.id)
      .filter((relation: any) => !this.systemUserIds.includes(relation.user.id))
      .forEach((relation: any) => {
        const groupId = Number(relation.group.id);
        const userId = Number(relation.user.id);

        const users = countMap.get(groupId) || new Set<number>();
        users.add(userId);

        countMap.set(groupId, users);
      });

    this.groupUsersCount = new Map<number, number>(
      Array.from(countMap.entries()).map(([groupId, users]) => [
        groupId,
        users.size,
      ]),
    );
  }

  // ============================================================
  // SELECCIÓN DE GRUPO
  // ============================================================

  async selectGroup(group: any): Promise<void> {
    this.selectedGroup = group;
    this.usersInGroup = [];

    const cachedUsers = this.groupUsersCache.get(Number(group.id));

    if (cachedUsers) {
      this.usersInGroup = cachedUsers;
      return;
    }

    this.loadingUsers = true;

    try {
      await this.ensureRelationsLoaded();

      if (this.selectedGroup?.id !== group.id) {
        return;
      }

      const users = this.relations
        .filter(
          (relation: any) =>
            this.isActiveRelation(relation) &&
            Number(relation.group?.id) === Number(group.id) &&
            relation.user?.id &&
            !this.systemUserIds.includes(Number(relation.user.id)),
        )
        .map((relation: any) => relation.user);

      const uniqueUsers = Array.from(
        new Map<number, any>(
          users.map((user: any) => [Number(user.id), user]),
        ).values(),
      );

      this.usersInGroup = this.sortByName(uniqueUsers);

      this.groupUsersCache.set(Number(group.id), this.usersInGroup);

      console.log(
        `✅ USERS IN GROUP ${this.getGroupDisplayName(group)}:`,
        this.usersInGroup.length,
      );
    } catch (error) {
      console.error('ERROR selectGroup:', error);

      this.showWarning(
        'No fue posible cargar los usuarios del grupo seleccionado',
      );
    } finally {
      this.loadingUsers = false;
    }
  }

  // ============================================================
  // HELPERS DE GRUPO
  // ============================================================

  getGroupDisplayName(group: any): string {
    const groupName = String(group?.name || '').trim();
    const jefeName = this.getFullName(group?.user);

    if (!groupName && jefeName) {
      return `Jefatura - ${jefeName}`;
    }

    if (this.isGenericGroupName(group)) {
      return jefeName ? `${groupName} - ${jefeName}` : groupName;
    }

    return groupName || 'Jefatura sin nombre';
  }

  getGroupUsersCount(group: any): number {
    return this.groupUsersCount.get(Number(group?.id)) || 0;
  }

  isEmptyGroup(group: any): boolean {
    return this.getGroupUsersCount(group) === 0;
  }

  isGenericGroupName(group: any): boolean {
    const name = String(group?.name || '').trim().toLowerCase();

    return name === 'jefatura' || name === 'jefaturas';
  }

  getSelectedGroupTitle(): string {
    if (!this.selectedGroup) {
      return 'Funcionarios asignados';
    }

    return `Funcionarios asignados - ${this.getGroupDisplayName(
      this.selectedGroup,
    )}`;
  }

  // ============================================================
  // HELPERS USUARIO
  // ============================================================

  private isActiveRelation(relation: any): boolean {
    return !relation?.deletedAt && !relation?.deleted_at;
  }

  private sortByName(users: any[]): any[] {
    return [...users].sort((userA, userB) => {
      const nameA = this.getFullName(userA).toLowerCase();
      const nameB = this.getFullName(userB).toLowerCase();

      return nameA.localeCompare(nameB);
    });
  }

  getFullName(user: any): string {
    if (!user) {
      return '';
    }

    if (user.fullName && user.fullName.trim().length > 0) {
      return user.fullName;
    }

    return [
      user.firstName,
      user.secondName,
      user.firstLastName,
      user.secondLastName,
    ]
      .filter((value: any) => value && String(value).trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getRoles(user: any): string {
    return (user?.roles || []).map((role: any) => role.name).join(', ');
  }

  // ============================================================
  // MENSAJES
  // ============================================================

  showWarning(message: string): void {
    this.dialog.open(ConfirmDialogOkComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Atención',
        message,
        confirmText: 'Aceptar',
        cancelText: '',
        icon: 'warning',
        color: 'warn',
      },
    });
  }

  // ============================================================
  // EXPORTAR EXCEL DEL GRUPO
  // ============================================================

  exportGrupo(): void {
    if (!this.selectedGroup) {
      this.showWarning('Debe seleccionar un grupo para exportar');
      return;
    }

    if (!this.usersInGroup.length) {
      this.showWarning('No hay usuarios disponibles en este grupo');
      return;
    }

    this.loader.show();

    try {
      const groupName = this.getGroupDisplayName(this.selectedGroup);

      const data = this.usersInGroup.map((user: any) => ({
        ...this.mapUserToExcel(user),
        Grupo: groupName,
        Jefatura: this.getFullName(this.selectedGroup?.user),
        IdGrupo: this.selectedGroup?.id || '',
      }));

      const safeName = this.getSafeFileName(groupName);

      this.exportToExcel(data, this.getSafeSheetName(groupName), `grupo_${safeName}.xlsx`);
    } finally {
      this.loader.hide();
    }
  }

  private exportToExcel(
    data: any[],
    sheetName: string,
    fileName: string,
  ): void {
    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([buffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, fileName);
  }

  private mapUserToExcel(user: any): any {
    return {
      Nombres: user?.firstName || '',
      SegundoNombre: user?.secondName || '',
      ApellidoPaterno: user?.firstLastName || '',
      ApellidoMaterno: user?.secondLastName || '',
      Rut: user?.rut || '',
      Email: user?.email || '',
      Roles: this.getRoles(user),
    };
  }

  // ============================================================
  // IMPRIMIR PDF DEL GRUPO
  // ============================================================

  printGrupo(): void {
    if (!this.selectedGroup) {
      this.showWarning('Debe seleccionar un grupo');
      return;
    }

    if (!this.usersInGroup.length) {
      this.showWarning('No hay usuarios disponibles en este grupo');
      return;
    }

    this.loader.show();

    try {
      const groupName = this.getGroupDisplayName(this.selectedGroup);

      const data = this.usersInGroup.map((user: any) => ({
        nombre: this.getFullName(user),
        rut: user?.rut || '',
        email: user?.email || '',
        roles: this.getRoles(user),
        grupo: groupName,
        jefatura: this.getFullName(this.selectedGroup?.user),
      }));

      const html = this.groupReport.generateGroupReport({
        titulo: `Grupo: ${groupName}`,
        data,
      });

      this.teleworkReport.printPdf(html);
    } catch (error) {
      console.error('ERROR printGrupo:', error);
      this.showWarning('Error generando PDF');
    } finally {
      this.loader.hide();
    }
  }

  // ============================================================
  // HELPERS ARCHIVOS
  // ============================================================

  private getSafeFileName(value: string): string {
    return String(value || 'grupo')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 90);
  }

  private getSafeSheetName(value: string): string {
    return String(value || 'Grupo')
      .replace(/[\\/?*[\]:]/g, '')
      .slice(0, 31);
  }
}
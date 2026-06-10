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

  private relationsLoaded = false;
  private relationsLoadPromise: Promise<void> | null = null;

  /**
   * Cache local:
   * después de abrir un grupo por primera vez,
   * sus usuarios quedan almacenados en memoria.
   */
  private groupUsersCache = new Map<number, any[]>();

  /**
   * Usuarios internos del sistema que no deben aparecer.
   */
  private systemUserIds: number[] = [1, 2, 3, 4];

  ngOnInit(): void {
    this.loadGroups();
  }

  // ============================================================
  // CARGA INICIAL MUY LIVIANA
  // ============================================================

  /**
   * Al ingresar a la pantalla solamente cargamos los grupos.
   *
   * No descargamos usuarios.
   * No descargamos roles.
   * No descargamos relaciones todavía.
   */
  async loadGroups(): Promise<void> {
    this.loader.show();

    try {
      const groups = await firstValueFrom(this.groupService.getAll());

      this.groups = Array.isArray(groups) ? groups : [];

      console.log('✅ GROUPS LOADED:', this.groups.length);
    } catch (error) {
      console.error('ERROR loadGroups:', error);

      this.showWarning('No fue posible cargar los grupos');
    } finally {
      this.loader.hide();
    }
  }

  // ============================================================
  // CARGA DIFERIDA DE RELACIONES
  // ============================================================

  /**
   * Las relaciones se consultan recién cuando el usuario
   * selecciona un grupo por primera vez.
   *
   * Después quedan almacenadas y no se vuelven a descargar.
   */
  private async ensureRelationsLoaded(): Promise<void> {
    if (this.relationsLoaded) {
      return;
    }

    /**
     * Si ya existe una solicitud en curso,
     * reutilizamos la misma promesa.
     *
     * Esto evita llamadas duplicadas cuando se hacen
     * varios clics rápidamente.
     */
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

    this.relationsLoaded = true;

    console.log('✅ USER-GROUP RELATIONS LOADED:', this.relations.length);
  }

  // ============================================================
  // SELECCIÓN DE GRUPO
  // ============================================================

  async selectGroup(group: any): Promise<void> {
    this.selectedGroup = group;
    this.usersInGroup = [];

    /**
     * Si este grupo ya se abrió anteriormente,
     * mostramos inmediatamente su cache.
     */
    const cachedUsers = this.groupUsersCache.get(group.id);

    if (cachedUsers) {
      this.usersInGroup = cachedUsers;

      return;
    }

    this.loadingUsers = true;

    try {
      await this.ensureRelationsLoaded();

      /**
       * Evita mostrar datos incorrectos si el usuario
       * seleccionó otro grupo mientras terminaba la consulta.
       */
      if (this.selectedGroup?.id !== group.id) {
        return;
      }

      const users = this.relations
        .filter(
          (relation: any) =>
            this.isActiveRelation(relation) &&
            relation.group?.id === group.id &&
            relation.user?.id &&
            !this.systemUserIds.includes(relation.user.id),
        )
        .map((relation: any) => relation.user);

      /**
       * Eliminamos duplicados por ID.
       */
      const uniqueUsers = Array.from(
        new Map<number, any>(
          users.map((user: any) => [user.id, user]),
        ).values(),
      );

      this.usersInGroup = this.sortByName(uniqueUsers);

      /**
       * Guardamos el resultado para los próximos clics.
       */
      this.groupUsersCache.set(group.id, this.usersInGroup);

      console.log(`✅ USERS IN GROUP ${group.name}:`, this.usersInGroup.length);
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
  // HELPERS
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
      .join(' ');
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
      const data = this.usersInGroup.map((user: any) => ({
        ...this.mapUserToExcel(user),
        Grupo: this.selectedGroup?.name || '',
        Jefatura: this.getFullName(this.selectedGroup?.user),
      }));

      const safeName = this.selectedGroup.name.replace(/\s+/g, '_');

      this.exportToExcel(
        data,
        this.selectedGroup.name,
        `grupo_${safeName}.xlsx`,
      );
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
      const data = this.usersInGroup.map((user: any) => ({
        nombre: this.getFullName(user),
        rut: user?.rut || '',
        email: user?.email || '',
        roles: this.getRoles(user),
        grupo: this.selectedGroup?.name || '',
        jefatura: this.getFullName(this.selectedGroup?.user),
      }));

      const html = this.groupReport.generateGroupReport({
        titulo: `Grupo: ${this.selectedGroup.name}`,
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
}

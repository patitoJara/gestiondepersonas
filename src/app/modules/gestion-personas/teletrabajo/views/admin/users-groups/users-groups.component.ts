import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportPrintService } from '@app/modules/gestion-personas/teletrabajo/services/reports/telework-report-print.service';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

import { LoaderService } from '@app/core/services/loader.service';
import { GroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/group.service';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { UsersGroupService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users-group.service';
import { GroupReportService } from '@app/modules/gestion-personas/teletrabajo/services/reports/group-report.service';

interface GroupReportItem {
  nombre: string;
  roles: string;
}

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
  private usersService = inject(UsersService);
  private usersGroupService = inject(UsersGroupService);
  private teleworkReport = inject(TeleworkReportPrintService);
  private groupReport = inject(GroupReportService);

  groups: any[] = [];
  users: any[] = [];
  allUsers: any[] = [];
  relations: any[] = [];

  usersInGroup: any[] = [];
  usersWithoutGroup: any[] = [];

  private systemUserIds: number[] = [1, 2, 3, 4];

  selectedGroup: any = null;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loader.show();

    try {
      // ============================
      // 🔥 1. TRAER DATOS
      // ============================
      const [groups, usersRaw, usersRolesRaw, relationsRaw]: [
        any[],
        any[],
        any[],
        any[],
      ] = await Promise.all([
        firstValueFrom(this.groupService.getAll()),

        // 🔥 Base completa de usuarios
        firstValueFrom(this.usersService.getAll()),

        // 🔥 Relaciones user-role
        firstValueFrom(this.usersService.getAllUsersRoles()),

        // 🔥 Relaciones user-group
        firstValueFrom(this.usersGroupService.getAll()),
      ]);

      // ============================
      // 🔥 2. ASIGNAR BASE
      // ============================
      this.groups = groups;
      this.relations = relationsRaw;

      console.log('USERS RAW:', usersRaw);
      console.log('USERS ROLES RAW:', usersRolesRaw);
      console.log('RELATIONS RAW:', relationsRaw);

      // ============================
      // 🧠 3. USUARIOS ACTIVOS CON ROLES ACTIVOS
      // ============================
      const usersWithRoles = this.mergeUsersWithActiveRoles(
        usersRaw,
        usersRolesRaw,
      );

      console.log('USERS WITH ACTIVE ROLES:', usersWithRoles);

      // ============================
      // 🔥 4. FILTRAR USUARIOS SISTEMA
      // ============================
      const filteredUsers = usersWithRoles.filter(
        (u: any) => !this.systemUserIds.includes(u.id),
      );

      // ============================
      // 🟦 5. BASE FINAL DE USUARIOS
      // ============================
      this.users = this.sortByName(filteredUsers);

      this.allUsers = [...this.users];

      // ============================
      // 🟦 6. RELACIONES ACTIVAS DE GRUPOS
      // ============================
      const activeRelations = this.relations.filter((r: any) =>
        this.isActiveRelation(r),
      );

      // ============================
      // 🟦 7. IDS DE USUARIOS CON GRUPO
      // ============================
      const usersWithGroupIds = activeRelations
        .map((r: any) => r.user?.id)
        .filter((id: any) => !!id);

      // ============================
      // 🟨 8. USUARIOS ADMINISTRATIVOS SIN GRUPO
      // ============================
      this.usersWithoutGroup = this.sortByName(
        this.users.filter((u: any) => {
          const tieneGrupo = usersWithGroupIds.includes(u.id);

          const esAdministrativo = this.isAdministrativo(u);

          return esAdministrativo && !tieneGrupo;
        }),
      );

      console.log('USERS FINAL:', this.users.length);

      console.log('USERS WITHOUT GROUP:', this.usersWithoutGroup.length);
    } catch (error) {
      console.error('ERROR loadData:', error);
    } finally {
      this.loader.hide();
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;

    const ids = this.relations
      .filter((r: any) => this.isActiveRelation(r) && r.group?.id === group.id)
      .map((r: any) => r.user?.id)
      .filter((id: any) => !!id);

    this.usersInGroup = this.sortByName(
      this.users.filter((u: any) => {
        const pertenece = ids.includes(u.id);

        const esAdministrativo = this.isAdministrativo(u);
        const esSupervisor = this.isSupervisor(u);
        const esJefe = group.user?.id === u.id;

        if (esAdministrativo && esSupervisor && esJefe) {
          return false;
        }

        return pertenece;
      }),
    );
  }

  // ============================
  // 🧠 HELPERS
  // ============================

  isAdministrativo(u: any): boolean {
    return this.hasRole(u, 'ADMINISTRATIVO');
  }

  isSupervisor(u: any): boolean {
    return this.hasRole(u, 'SUPERVISOR');
  }

  isJefe(u: any): boolean {
    return this.groups.some((g: any) => g.user?.id === u.id);
  }

  private hasRole(u: any, roleName: string): boolean {
    return (u.roles || []).some((r: any) => r.name?.toUpperCase() === roleName);
  }

  private hasContractDate(u: any): boolean {
    const contractDate =
      u?.contractDate ||
      u?.contract_date ||
      u?.fechaAfiliacion ||
      u?.affiliateDate ||
      u?.affiliate_date;

    return (
      contractDate !== null &&
      contractDate !== undefined &&
      String(contractDate).trim() !== ''
    );
  }

  private sortByName(list: any[]): any[] {
    return list.sort((a, b) => {
      const nameA = (
        a.fullName ||
        a.firstName + ' ' + a.firstLastName ||
        ''
      ).toLowerCase();
      const nameB = (
        b.fullName ||
        b.firstName + ' ' + b.firstLastName ||
        ''
      ).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  private mergeUsersWithActiveRoles(users: any[], usersRoles: any[]): any[] {
    const rolesByUserId = new Map<number, any[]>();

    // ============================
    // 🔥 AGRUPAR SOLAMENTE ROLES ACTIVOS
    // ============================
    usersRoles.forEach((item: any) => {
      if (item.deletedAt || item.deleted_at) {
        return;
      }

      const userId = item.user?.id;
      const role = item.role;

      if (!userId || !role?.id) {
        return;
      }

      if (!rolesByUserId.has(userId)) {
        rolesByUserId.set(userId, []);
      }

      const roles = rolesByUserId.get(userId)!;

      const alreadyExists = roles.some((r: any) => r.id === role.id);

      if (!alreadyExists) {
        roles.push(role);
      }
    });

    // ============================
    // 🔥 CONSERVAR TODOS LOS USERS ACTIVOS
    // AUNQUE NO TENGAN ROLES
    // ============================
    return users
      .filter((user: any) => user?.id && !user.deletedAt && !user.deleted_at)
      .map((user: any) => ({
        ...user,
        roles: rolesByUserId.get(user.id) || [],
      }));
  }

  private getGroupedUserById(userId: number): any {
    return this.users.find((u: any) => u.id === userId);
  }

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
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

  // Zona de reportes

  exportGrupo() {
    if (!this.selectedGroup) {
      this.showWarning('Debe seleccionar un grupo para exportar');
      return;
    }

    this.loader.show();

    try {
      const data = this.relations
        .filter(
          (r: any) =>
            this.isActiveRelation(r) && r.group?.id === this.selectedGroup.id,
        )
        .map((r: any) => ({
          ...this.mapUserToExcel(this.getGroupedUserById(r.user?.id) || r.user),
          Grupo: r.group.name,
          Jefatura: this.getFullName(r.group.user),
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

  exportSinGrupo() {
    const relationsActivas = this.relations.filter((r: any) =>
      this.isActiveRelation(r),
    );

    const usersWithGroupIds = relationsActivas.map((r: any) => r.user?.id);

    const usersWithoutGroup = this.users.filter((u: any) => {
      const tieneGrupo = usersWithGroupIds.includes(u.id);

      const esAdministrativo = (u.roles || []).some(
        (r: any) => r.name?.toUpperCase() === 'ADMINISTRATIVO',
      );

      return !tieneGrupo && esAdministrativo;
    });

    if (!usersWithoutGroup.length) {
      this.showWarning('No hay usuarios administrativos sin grupo');
      return;
    }

    this.loader.show();

    try {
      const data = usersWithoutGroup.map((u: any) => ({
        ...this.mapUserToExcel(u),
      }));

      this.exportToExcel(data, 'Sin Grupo', 'usuarios_sin_grupo.xlsx');
    } finally {
      this.loader.hide();
    }
  }

  exportTodos() {
    if (!this.users.length) {
      this.showWarning('No hay usuarios disponibles');
      return;
    }

    this.loader.show();

    try {
      const data = this.users.map((u: any) => ({
        ...this.mapUserToExcel(u),
      }));

      this.exportToExcel(data, 'Usuarios', 'usuarios.xlsx');
    } finally {
      this.loader.hide();
    }
  }

  printGrupo() {
    if (!this.selectedGroup) {
      this.showWarning('Seleccione un grupo');
      return;
    }
    this.print('grupo');
  }

  printSinGrupo() {
    this.print('sin-grupo');
  }

  printTodos() {
    this.print('todos');
  }

  print(tipo: 'grupo' | 'sin-grupo' | 'todos') {
    this.loader.show();

    try {
      let data: any[] = [];
      let titulo = '';

      // ============================
      // 🟦 GRUPO
      // ============================
      if (tipo === 'grupo') {
        if (!this.selectedGroup) {
          this.showWarning('Seleccione un grupo');
          return;
        }

        titulo = `Grupo: ${this.selectedGroup.name}`;

        data = this.relations
          .filter(
            (r: any) =>
              this.isActiveRelation(r) && r.group?.id === this.selectedGroup.id,
          )
          .map((r: any) => {
            const groupedUser = this.getGroupedUserById(r.user?.id) || r.user;

            return {
              nombre: this.getFullName(groupedUser),
              rut: groupedUser?.rut || '',
              email: groupedUser?.email || '',
              roles: this.getRoles(groupedUser),
              grupo: r.group?.name || '',
              jefatura: this.getFullName(r.group?.user),
            };
          });
      }

      // ============================
      // 🟠 SIN GRUPO
      // ============================
      if (tipo === 'sin-grupo') {
        titulo = 'Usuarios sin grupo';

        const relationsActivas = this.relations.filter((r: any) =>
          this.isActiveRelation(r),
        );

        const usersWithGroupIds = relationsActivas
          .map((r: any) => r.user?.id)
          .filter((id: any) => !!id);

        const usersWithoutGroup = this.users.filter((u: any) => {
          const tieneGrupo = usersWithGroupIds.includes(u.id);

          const esAdministrativo = this.isAdministrativo(u);

          return !tieneGrupo && esAdministrativo;
        });

        data = usersWithoutGroup.map((u: any) => ({
          nombre: this.getFullName(u),
          rut: u.rut || '',
          email: u.email || '',
          roles: this.getRoles(u),
        }));
      }

      // ============================
      // 🟣 TODOS
      // ============================
      if (tipo === 'todos') {
        titulo = 'Listado General de Usuarios';

        data = this.users.map((u: any) => ({
          nombre: this.getFullName(u),
          rut: u.rut || '',
          email: u.email || '',
          roles: this.getRoles(u),
        }));
      }

      // ============================
      // 🚫 VALIDACIÓN
      // ============================
      if (!data.length) {
        this.showWarning('No hay datos para imprimir');
        return;
      }

      // ============================
      // 🔥 GENERAR UNA SOLA VEZ
      // ============================
      const html = this.groupReport.generateGroupReport({
        titulo,
        data,
      });

      this.teleworkReport.printPdf(html);
    } catch (error) {
      console.error(error);

      this.showWarning('Error generando PDF');
    } finally {
      this.loader.hide();
    }
  }

  private isActiveRelation(relation: any): boolean {
    return !relation?.deletedAt && !relation?.deleted_at;
  }

  private exportToExcel(data: any[], sheetName: string, fileName: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([buffer], {
      type: 'application/octet-stream',
    });

    saveAs(blob, fileName);
  }

  getFullName(u: any): string {
    if (!u) return '';

    // 🔥 1. si ya viene armado (por backend)
    if (u.fullName && u.fullName.trim().length > 0) {
      return u.fullName;
    }

    // 🔥 2. construir manual
    return [u.firstName, u.secondName, u.firstLastName, u.secondLastName]
      .filter((x) => x && x.trim().length > 0)
      .join(' ');
  }

  private mapUserToExcel(u: any) {
    return {
      Nombres: u.firstName || '',
      SegundoNombre: u.secondName || '',
      ApellidoPaterno: u.firstLastName || '',
      ApellidoMaterno: u.secondLastName || '',
      Rut: u.rut || '',
      Email: u.email || '',
      Roles: this.getRoles(u), // 🔥 NUEVO
    };
  }

  private getRoles(u: any): string {
    return (u.roles || []).map((r: any) => r.name).join(', ');
  }
}

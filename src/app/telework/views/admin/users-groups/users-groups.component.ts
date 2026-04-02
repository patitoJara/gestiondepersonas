import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TeleworkReportPrintService } from '@app/telework/services/reports/telework-report-print.service';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

import { LoaderService } from '@app/core/services/loader.service';
import { GroupService } from '@app/telework/services/admin/group.service';
import { UsersService } from '@app/telework/services/admin/users.service';
import { UsersGroupService } from '@app/telework/services/admin/users-group.service';
import { GroupReportService } from '@app/telework/services/reports/group-report.service';

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

  async loadData() {
    this.loader.show();

    try {
      // ============================
      // 🔥 1. TRAER DATOS
      // ============================
      const [groups, usersRaw, relationsRaw]: [any[], any[], any[]] =
        await Promise.all([
          firstValueFrom(this.groupService.getAll()),
          firstValueFrom(this.usersService.getAllUsersRoles()), // 🔥 fuente correcta
          firstValueFrom(this.usersGroupService.getAll()),
        ]);

      // ============================
      // 🔥 2. ASIGNAR BASE
      // ============================
      this.groups = groups;
      this.relations = relationsRaw;

      console.log('USERS RAW:', usersRaw);
      console.log('RELATIONS RAW:', relationsRaw);

      // ============================
      // 🧠 3. AGRUPAR USUARIOS POR ROLES
      // ============================
      const groupedUsers = this.groupUsersWithRoles(usersRaw);
      console.log('GROUPED USERS:', groupedUsers);

      // ============================
      // 🔥 4. FILTRAR USUARIOS SISTEMA
      // ============================
      const filteredUsers = groupedUsers.filter(
        (u: any) => !this.systemUserIds.includes(u.id),
      );

      console.log('FILTERED USERS:', filteredUsers);

      // ============================
      // 🟦 5. BASE USUARIOS FINAL
      // ============================
      this.users = this.sortByName(filteredUsers);

      // ============================
      // 🟪 6. TODOS LOS USUARIOS
      // ============================
      this.allUsers = [...this.users];

      // ============================
      // 🟦 7. RELACIONES ACTIVAS (SIN BORRADOS)
      // ============================
      const activeRelations = this.relations.filter((r: any) => !r.deletedAt);

      // ============================
      // 🟦 8. IDS CON GRUPO
      // ============================
      const usersWithGroupIds = activeRelations
        .map((r: any) => r.user?.id)
        .filter((id: any) => !!id);

      console.log('USERS WITH GROUP IDS:', usersWithGroupIds);

      // ============================
      // 🟨 9. USUARIOS DISPONIBLES
      // ============================
      this.usersWithoutGroup = this.sortByName(
        this.users.filter((u: any) => {
          const tieneGrupo = usersWithGroupIds.includes(u.id);
          const esAdministrativo = this.isAdministrativo(u);

          return esAdministrativo && !tieneGrupo;
        }),
      );

      console.log('USERS WITHOUT GROUP:', this.usersWithoutGroup);
    } catch (error) {
      console.error('ERROR loadData:', error);
    } finally {
      this.loader.hide();
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;

    const ids = this.relations
      .filter((r: any) => !r.deletedAt && r.group.id === group.id)
      .map((r: any) => r.user.id);

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

  private groupUsersWithRoles(data: any[]): any[] {
    const map = new Map<number, any>();

    data.forEach((item: any) => {
      const user = item.user;
      const role = item.role;

      if (!user || !user.id) return;

      if (!map.has(user.id)) {
        map.set(user.id, {
          ...user,
          roles: [],
        });
      }

      const existing = map.get(user.id);

      if (role && role.id) {
        const alreadyExists = existing.roles.some((r: any) => r.id === role.id);

        if (!alreadyExists) {
          existing.roles.push(role);
        }
      }
    });

    return Array.from(map.values());
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
          (r: any) => !r.deletedAt && r.group?.id === this.selectedGroup.id,
        )
        .map((r: any) => ({
          ...this.mapUserToExcel(r.user),
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
    const relationsActivas = this.relations.filter((r: any) => !r.deletedAt);

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
            (r: any) => !r.deletedAt && r.group?.id === this.selectedGroup.id,
          )
          .map((r: any) => ({
            nombre: this.getFullName(r.user),
            rut: r.user.rut,
            email: r.user.email,
            roles: this.getRoles(r.user),
            grupo: r.group.name,
            jefatura: this.getFullName(r.group.user),
          }));
      }

      // ============================
      // 🟠 SIN GRUPO
      // ============================
      if (tipo === 'sin-grupo') {
        titulo = 'Usuarios sin grupo';

        const relationsActivas = this.relations.filter(
          (r: any) => !r.deletedAt,
        );

        const usersWithGroupIds = relationsActivas.map((r: any) => r.user?.id);

        const usersWithoutGroup = this.users.filter((u: any) => {
          const tieneGrupo = usersWithGroupIds.includes(u.id);

          const esAdministrativo = (u.roles || []).some(
            (r: any) => r.name?.toUpperCase() === 'ADMINISTRATIVO',
          );

          return !tieneGrupo && esAdministrativo;
        });

        data = usersWithoutGroup.map((u: any) => ({
          nombre: this.getFullName(u),
          rut: u.rut,
          email: u.email,
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
          rut: u.rut,
          email: u.email,
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

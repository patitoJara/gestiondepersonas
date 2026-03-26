import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

import { LoaderService } from '@app/core/services/loader.service';
import { GroupService } from '@app/telework/services/admin/group.service';
import { UsersService } from '@app/telework/services/admin/users.service';
import { UsersGroupService } from '@app/telework/services/admin/users-group.service';

@Component({
  selector: 'app-users-groups',
  standalone: true,
  templateUrl: './users-groups.component.html',
  styleUrls: ['./users-groups.component.scss'],
  imports: [CommonModule, MatIconModule],
})
export class UsersGroupsComponent implements OnInit {
  private loader = inject(LoaderService);
  private groupService = inject(GroupService);
  private usersService = inject(UsersService);
  private usersGroupService = inject(UsersGroupService);

  groups: any[] = [];
  users: any[] = [];
  relations: any[] = [];

  usersInGroup: any[] = [];
  usersWithoutGroup: any[] = [];

  selectedGroup: any = null;

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loader.show();

    try {
      const [groups, users, relations]: [any[], any[], any[]] =
        await Promise.all([
          firstValueFrom(this.groupService.getAll()),
          firstValueFrom(this.usersService.getAll()),
          firstValueFrom(this.usersGroupService.getAll()),
        ]);

      this.groups = groups;
      this.relations = relations;

      // 🔴 FILTRO USUARIOS SISTEMA
      const usuariosSistema = ['ADMIN', 'ADMINISTRATIVO', 'SUPERVISOR', 'JEFATURA'];

      this.users = users.filter((u: any) => {
        const username = (u.username || '').toUpperCase();
        return !usuariosSistema.includes(username);
      });

      // 🟦 IDS con grupo
      const usersWithGroupIds = this.relations
        .map((r: any) => r.user?.id)
        .filter((id: any) => !!id);

      // 🟨 DISPONIBLES (REGLA FINAL)
      this.usersWithoutGroup = this.users.filter((u: any) => {
        const tieneGrupo = usersWithGroupIds.includes(u.id);
        const esAdministrativo = this.isAdministrativo(u);

        return esAdministrativo && !tieneGrupo;
      });

    } catch (error) {
      console.error(error);
    } finally {
      this.loader.hide();
    }
  }

  selectGroup(group: any) {
    this.selectedGroup = group;

    const ids = this.relations
      .filter((r: any) => r.group.id === group.id)
      .map((r: any) => r.user.id);

    this.usersInGroup = this.users.filter((u: any) => {
      const pertenece = ids.includes(u.id);

      const esAdministrativo = this.isAdministrativo(u);
      const esSupervisor = this.isSupervisor(u);
      const esJefe = group.user?.id === u.id;

      // 🔥 REGLA: no puede ser administrativo en su propio grupo si es jefe
      if (esAdministrativo && esSupervisor && esJefe) {
        return false;
      }

      return pertenece;
    });
  }

  // ============================
  // 🧠 HELPERS
  // ============================

  getRoles(u: any): any[] {
    return u.roles && u.roles.length
      ? u.roles
      : (u.userRoles || []).map((ur: any) => ur.role);
  }

  isAdministrativo(u: any): boolean {
    return this.getRoles(u).some(
      (r: any) => r.name?.toUpperCase() === 'ADMINISTRATIVO'
    );
  }

  isSupervisor(u: any): boolean {
    return this.getRoles(u).some(
      (r: any) => r.name?.toUpperCase() === 'SUPERVISOR'
    );
  }

  isJefe(u: any): boolean {
    return this.groups.some((g: any) => g.user?.id === u.id);
  }
}
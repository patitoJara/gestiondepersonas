// src/app/views/admin/usuarios/usuarios.component.ts

import {
  Component,
  AfterViewInit,
  ViewChild,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { merge, firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { User } from '../../../models/user.model';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { UsuariosDialogComponent } from './users.dialog';
import { UserSearchService } from '@app/modules/gestion-personas/teletrabajo/services/admin/user-search.service';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

interface UserFull {
  id: number;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  full_name?: string;
  email: string;
  username: string;
  rut: string;
}

@Component({
  standalone: true,
  selector: 'app-usuarios',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDialogModule,
  ],
})
export class UsuariosComponent implements AfterViewInit {
  displayedColumns = [
    'id',
    'fullName',
    'rut',
    'email',
    'username',
    'roles',
    'acciones',
  ];

  dataSource = new MatTableDataSource<any>([]);
  private rolesCache = new Map<number, any[]>();
  private rolesLoadingIds = new Set<number>();
  private rolesLoadedIds = new Set<number>();

  loading = false;
  total = 0;

  /** Filtro búsqueda */
  q = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private api = inject(UsersService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private search$ = new Subject<string>();
  private userSearchService = inject(UserSearchService);
  private lastTerm = '';
  private allUsers: any[] = []; // 🔥 base real
  private viewUsers: any[] = []; // 🔥 lo que se muestra
  private currentPrefix = '';
  private hasFocus = false;

  ngAfterViewInit(): void {
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = 10;

    this.sort.active = 'id';
    this.sort.direction = 'asc';

    this.sort.sortChange.subscribe((sort) => {
      if (!sort.direction) {
        this.sort.direction = 'asc';
      }

      this.paginator.firstPage();
      this.applyCurrentView();

      setTimeout(() => {
        void this.loadRolesForVisibleUsers();
      }, 0);
    });

    this.paginator.page.subscribe(() => {
      this.applyCurrentView();

      setTimeout(() => {
        void this.loadRolesForVisibleUsers();
      }, 0);
    });

    // 🔥 BÚSQUEDA INTELIGENTE
    this.search$.pipe(debounceTime(300)).subscribe(async (term) => {
      const raw = (term || '').toLowerCase(); // 👈 mantiene espacios
      const clean = raw.trim(); // 👈 solo valida

      this.q = raw; // 🔥 NO usar clean

      if (!clean || clean.length < 3) {
        this.applyCurrentView();
        return;
      }

      const prefix = clean.substring(0, 3);

      if (prefix !== this.currentPrefix) {
        this.currentPrefix = prefix;

        this.clearRolesState();

        try {
          const response: any = await firstValueFrom(
            this.api.searchUsers(prefix),
          );

          const baseUsers = response?.content || [];

          // 🔥 Cargar roles reales desde users_roles
          this.allUsers = baseUsers.map((user: any) => ({
            ...user,
            fullName: this.buildFullName(user),
            roles: [],
            rolesLoaded: false,
            rolesLoading: false,
          }));

          console.log('✅ SEARCH USERS READY:', this.allUsers.length);

          this.applyCurrentView();

          setTimeout(() => {
            void this.loadRolesForVisibleUsers();
          }, 0);

          return;

          console.log('✅ SEARCH USERS READY:', this.allUsers.length);
        } catch (e) {
          console.error(e);

          this.allUsers = [];
        }
      }

      this.applyCurrentView();
    });

    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }

  // ====================================================================================
  // 🔥 CARGAR ROLES REALES PARA MOSTRAR EN TABLA
  // ====================================================================================

  private async loadRolesForTable(userId: number): Promise<any[]> {
    try {
      if (!userId) {
        return [];
      }

      if (this.rolesCache.has(userId)) {
        return this.rolesCache.get(userId)!;
      }

      const res: any[] = await firstValueFrom(this.api.getUserRoles(userId));

      console.log(
        '🔎 ROLES RAW USER:',
        userId,
        (res || []).map((item: any) => ({
          relationId: item?.id,
          roleId: item?.role?.id,
          roleName: item?.role?.name,
          deletedAt: item?.deletedAt || item?.deleted_at || null,
        })),
      );

      const roles = (res || [])
        .filter((item: any) => !item?.deletedAt && !item?.deleted_at)
        .map((item: any) => {
          const roleId =
            item?.role?.id ||
            item?.roleId ||
            item?.role_id ||
            item?.idRole ||
            item?.id_role ||
            null;

          const roleName =
            item?.role?.name ||
            item?.roleName ||
            item?.role_name ||
            item?.name ||
            this.getRoleNameById(roleId);

          return roleName
            ? {
                id: Number(roleId) || null,
                name: roleName,
              }
            : null;
        })
        .filter(Boolean);

      console.log('✅ ROLES MAPEADOS USER:', userId, roles);

      this.rolesCache.set(userId, roles);

      return roles;
    } catch (error) {
      console.error('❌ Error cargando roles para tabla:', {
        userId,
        error,
      });

      return [];
    }
  }

  private getRoleNameById(roleId: any): string {
    switch (Number(roleId)) {
      case 1:
        return 'ADMIN';

      case 2:
        return 'ADMINISTRATIVO';

      case 3:
        return 'SUPERVISOR';

      case 4:
        return 'JEFATURA';

      case 5:
        return 'SIN PERFIL ASIGNADO';

      case 6:
        return 'SUPERVISOR_BIENESTAR';

      default:
        return '';
    }
  }

  applyCurrentView(): void {
    if (!this.allUsers.length) {
      this.dataSource.data = [];
      this.paginator.length = 0;
      return;
    }

    let data = [...this.allUsers];

    if (this.q && this.q.length >= 3) {
      const words = this.q
        .toLowerCase()
        .split(' ')
        .filter((w) => w.trim().length > 0);

      data = data.filter((u: any) => {
        const full = this.buildFullName(u).toLowerCase();

        return words.every((w) => full.includes(w));
      });
    }

    const active = this.sort?.active || 'id';
    const direction = this.sort?.direction || 'asc';

    data = data.sort((a: any, b: any) => {
      const valueA = this.getSortValue(a, active);
      const valueB = this.getSortValue(b, active);

      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }

      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }

      return 0;
    });

    this.dataSource.data = data;
    this.paginator.length = data.length;

    setTimeout(() => {
      void this.loadRolesForVisibleUsers();
    }, 0);
  }

  private async loadRolesForVisibleUsers(): Promise<void> {
    if (!this.dataSource?.data?.length || !this.paginator) {
      return;
    }

    const start = this.paginator.pageIndex * this.paginator.pageSize;
    const end = start + this.paginator.pageSize;

    const visibleUsers = this.dataSource.data.slice(start, end);

    const usersToLoad = visibleUsers.filter((user: any) => {
      const userId = Number(user?.id);

      return (
        userId &&
        !this.rolesLoadingIds.has(userId) &&
        (!this.rolesLoadedIds.has(userId) || user.rolesLoaded === false)
      );
    });

    if (!usersToLoad.length) {
      return;
    }

    usersToLoad.forEach((user: any) => {
      user.rolesLoading = true;
      this.rolesLoadingIds.add(Number(user.id));
    });

    this.dataSource.data = [...this.dataSource.data];

    await Promise.all(
      usersToLoad.map(async (user: any) => {
        const userId = Number(user.id);

        try {
          const roles = await this.loadRolesForTable(userId);

          this.allUsers = this.allUsers.map((item: any) => {
            if (Number(item.id) !== userId) {
              return item;
            }

            return {
              ...item,
              roles,
              rolesLoaded: true,
              rolesLoading: false,
            };
          });
        } finally {
          this.rolesLoadingIds.delete(userId);
          this.rolesLoadedIds.add(userId);
        }
      }),
    );

    this.applyCurrentView();
  }

  getSortValue(item: any, field: string): any {
    switch (field) {
      case 'fullName':
        return this.buildFullName(item).toLowerCase();

      case 'email':
        return (item.email || '').toLowerCase();

      case 'username':
        return (item.username || '').toLowerCase();

      case 'rut':
        return (item.rut || '').replace(/\./g, '').toLowerCase();

      case 'roles':
        return this.getRoles(item).toLowerCase();

      case 'id':
        return Number(item.id) || 0;

      default:
        return item[field] || '';
    }
  }

  private clearRolesState(): void {
    this.rolesCache.clear();
    this.rolesLoadingIds.clear();
    this.rolesLoadedIds.clear();
  }

  async onSearchChange(value: string) {
    this.search$.next(value);
  }

  resetSearch(): void {
    this.q = '';
    this.currentPrefix = '';
    this.allUsers = [];
    this.viewUsers = [];
    this.dataSource.data = [];
    this.total = 0;

    this.paginator.firstPage();
  }

  onSearchBlur(event: FocusEvent, input: HTMLInputElement): void {
    setTimeout(() => {
      const active = document.activeElement as HTMLElement;

      // 🔥 si el foco sigue dentro del componente → NO limpiar
      if (active && active.closest('.list-toolbar')) {
        return;
      }

      this.clearSearch();
    }, 120);
  }

  private mapSortField(active?: string): string {
    switch (active) {
      case 'id':
        return 'id';

      case 'fullName':
        return 'fullName';

      case 'rut':
        return 'rut';

      case 'email':
        return 'email';

      case 'username':
        return 'username';

      case 'roles':
        return 'roles';

      default:
        return 'id';
    }
  }

  clearSearch(): void {
    this.q = '';
    this.currentPrefix = '';

    this.clearRolesState();

    // 🔹 limpiar datos
    this.allUsers = [];
    this.viewUsers = [];
    this.dataSource.data = [];
    this.total = 0;

    // 🔹 reset paginador
    this.paginator.firstPage();

    // 🔹 reset orden
    this.sort.active = 'id';
    this.sort.direction = 'asc';

    this.lastTerm = '';
  }

  /*
  onSearchFocus(input: HTMLInputElement): void {
    this.q = '';
    input.value = '';

    this.allUsers = [];
    this.viewUsers = [];
    this.dataSource.data = [];
    this.total = 0;

    this.currentPrefix = ''; // 🔥 CLAVE (evita que quede pegado)

    this.paginator.firstPage();

    // opcional
    this.sort.active = 'id';
    this.sort.direction = 'asc';
  }
*/

  buildFullName(u: any): string {
    const name = [u.firstName, u.secondName, u.firstLastName, u.secondLastName]
      .filter(Boolean)
      .map((v) => String(v).trim().toUpperCase())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return name || '—';
  }

  private getFieldValue(row: User, field: string): any {
    switch (field) {
      case 'id':
        return row.id;

      case 'username':
        return row.username;

      case 'email':
        return row.email;

      case 'rut':
        return row.rut;

      // 🔥 nombre completo
      case 'fullName':
        return this.buildFullName(row);

      // 🔥 roles
      case 'roles':
        const roles = (row.roles || [])
          .map((r: any) => (typeof r === 'string' ? r : r?.name))
          .filter(Boolean)
          .join(', ');

        return roles || '—';

      default:
        return row.id;
    }
  }

  getFullName(row: User): string {
    return [
      row.firstName,
      row.secondName,
      row.firstLastName,
      row.secondLastName,
    ]
      .filter(Boolean)
      .map((v) => String(v).trim().toUpperCase())
      .join(' ');
  }

  getRoles(row: User): string {
    return (
      (row.roles || [])
        .map((r: any) => this.getRoleName(r))
        .filter(Boolean)
        .join(', ') || '—'
    );
  }

  getRoleName(role: any): string {
    if (!role) {
      return '';
    }

    if (typeof role === 'string') {
      return role;
    }

    return role?.name || role?.roleName || role?.role_name || '';
  }

  getRoleBadgeClass(role: any): string {
    const name = this.getRoleName(role);

    return (
      'badge-' +
      String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
    );
  }

  applyFilter(term: string): void {
    this.q = term.trim();
  }

  refresh(): void {
    if (this.q && this.q.length >= 3) {
      this.search$.next(this.q);
    } else {
      this.clearSearch();
    }
  }

  private normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  openDialog(row?: User): void {
    if (!row?.id) {
      // 👉 nuevo usuario
      const ref = this.dialog.open(UsuariosDialogComponent, {
        data: null,
        width: '680px',
        disableClose: true,
      });

      ref.afterClosed().subscribe((updated?: User) => {
        if (updated) this.updateLocalUser(updated);
      });

      return;
    }

    // 🔥 EDITAR → traer full desde backend
    this.api.getById(row.id).subscribe((fullUser) => {
      const ref = this.dialog.open(UsuariosDialogComponent, {
        width: '680px',
        maxWidth: '95vw',
        backdropClass: 'app-backdrop',
        data: fullUser, // 🔥 ahora sí completo
        disableClose: true,
      });

      ref.afterClosed().subscribe((updated?: User) => {
        if (updated) {
          this.updateLocalUser(updated);
        }
      });
    });
  }

  updateLocalUser(updated: User) {
    // 🔥 asegurar estructura consistente
    const normalized = {
      ...updated,
      fullName: this.buildFullName(updated),
    };

    let found = false;

    this.allUsers = this.allUsers.map((u) => {
      if (u.id === normalized.id) {
        found = true;
        return normalized;
      }
      return u;
    });

    if (!found) {
      this.allUsers = [normalized, ...this.allUsers];
    }

    this.applyCurrentView();
  }

  softDelete(row: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Eliminar usuario',
        message: `¿Seguro que deseas eliminar “${row.username}” (ID: ${row.id})?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        color: 'warn',
        icon: 'delete',
        dense: true,
      },
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;

      this.api.deleteUser(Number(row.id)).subscribe(() => {
        if (this.q && this.q.length >= 3) {
          this.search$.next(this.q);
        } else {
          this.clearSearch(); // 🔥 FIX
        }
      });
    });
  }

  restore(row: User): void {
    this.api.restore(Number(row.id)).subscribe(() => {
      if (this.q && this.q.length >= 3) {
        this.search$.next(this.q);
      } else {
        //this.normalize(); // 🔥 FIX
      }
    });
  }
}

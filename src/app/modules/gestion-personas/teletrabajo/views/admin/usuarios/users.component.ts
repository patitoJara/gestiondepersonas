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
    });

    this.paginator.page.subscribe(() => {
      this.applyCurrentView();
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

        try {
          const response: any = await firstValueFrom(
            this.api.searchUsers(prefix),
          );

          const baseUsers = response?.content || [];

          // 🔥 TRAER USUARIO COMPLETO + ROLES (COMO EL DIALOG)
          const fullUsers = await Promise.all(
            baseUsers.map(async (u: any) => {
              const user = await firstValueFrom(this.api.getById(u.id));

              const rolesRes: any[] = await firstValueFrom(
                this.api.getUserRoles(u.id),
              );

              const roles = rolesRes
                .filter((r) => !r.deletedAt)
                .map((r) => r.role?.name);

              return {
                ...user,
                roles,
                fullName: (user as any).full_name || this.buildFullName(user),
              };
            }),
          );

          console.log('FULL USERS:', fullUsers);

          // 🔥 NO MAPEAR DE NUEVO → YA TIENE ROLES
          this.allUsers = fullUsers;
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

  applyCurrentView(): void {
    if (!this.allUsers.length) {
      this.dataSource.data = [];
      return;
    }

    let data = [...this.allUsers];

    if (this.q && this.q.length >= 3) {
      const words = this.q
        .toLowerCase()
        .split(' ')
        .filter((w) => w.trim().length > 0);

      data = data.filter((u: any) => {
        const full = (u.fullName || this.buildFullName(u)).toLowerCase();

        // 🔥 TODAS las palabras deben estar
        return words.every((w) => full.includes(w));
      });
    }

    this.dataSource.data = data;
    this.paginator.length = data.length;
  }

  getSortValue(item: any, field: string): any {
    switch (field) {
      case 'fullName':
        return this.buildFullName(item).toLowerCase(); // 🔥 CLAVE

      case 'email':
        return (item.email || '').toLowerCase();

      case 'username':
        return (item.username || '').toLowerCase();

      case 'rut':
        return (item.rut || '').replace(/\./g, '');

      case 'id':
        return Number(item.id) || 0;

      default:
        return item[field];
    }
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
    // 🔹 usar fullName si viene bien formado
    if (typeof u.fullName === 'string' && u.fullName.trim().length > 0) {
      return u.fullName.trim();
    }

    // 🔹 construir desde campos
    const name = [u.firstName, u.secondName, u.firstLastName, u.secondLastName]
      .filter(Boolean)
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
        return [
          row.firstName,
          row.secondName,
          row.firstLastName,
          row.secondLastName,
        ]
          .filter(Boolean)
          .join(' ');

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
      .join(' ');
  }

  getRoles(row: User): string {
    return (
      (row.roles || [])
        .map((r: any) => (typeof r === 'string' ? r : r?.name))
        .filter(Boolean)
        .join(', ') || '—'
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

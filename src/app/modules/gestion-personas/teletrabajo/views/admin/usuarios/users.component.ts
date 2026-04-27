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

interface UserTable {
  id: number;
  fullName: string;
  rut: string;
  email: string;
  username: string;
  deletedAt?: any;
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

  ngAfterViewInit(): void {
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = 10;

    this.sort.active = 'id';
    this.sort.direction = 'asc';

    // 🔥 SORT (sin estado vacío)
    this.sort.sortChange.subscribe((sort) => {
      if (!sort.direction) {
        this.sort.direction = 'asc';
      }

      this.paginator.firstPage();
      this.applyCurrentView();
    });

    // 🔥 PAGINACIÓN (esto te faltaba)
    this.paginator.page.subscribe(() => {
      this.applyCurrentView();
    });

    // 🔥 BÚSQUEDA
    this.search$
      .pipe(
        debounceTime(300),
        map((term: string) => (term ?? '').toString().trim().toLowerCase()),
        distinctUntilChanged(),
      )
      .subscribe((clean) => {
        if (clean.length < 3) {
          this.dataSource.data = [];
          this.allUsers = [];
          this.viewUsers = [];
          this.lastTerm = '';
          return;
        }

        if (this.lastTerm && clean.startsWith(this.lastTerm)) {
          this.filterLocal(clean);
        } else {
          this.search(clean);
        }

        this.lastTerm = clean;
      });

    this.cdr.detectChanges();
  }

  applyCurrentView(): void {
    if (!this.allUsers.length) return;

    let data = [...this.allUsers];

    // 🔥 NORMALIZAR
    data = data.map((u) => ({
      ...u,
      roles: (u.roles || []).map((r: any) =>
        typeof r === 'string' ? r : r?.name,
      ),
    }));

    // 🔹 FILTRO
    if (this.q && this.q.length >= 3) {
      const term = this.q.toLowerCase();

      data = data.filter((u: any) => {
        const full = this.buildFullName(u).toLowerCase();
        const rut = (u.rut || '').toLowerCase();
        const email = (u.email || '').toLowerCase();

        return (
          full.includes(term) || rut.includes(term) || email.includes(term)
        );
      });
    }

    // 🔹 SORT
    if (this.sort?.active && this.sort.direction) {
      data.sort((a: any, b: any) => {
        let valueA = this.getSortValue(a, this.sort.active);
        let valueB = this.getSortValue(b, this.sort.active);

        valueA = (valueA ?? '').toString().toLowerCase();
        valueB = (valueB ?? '').toString().toLowerCase();

        let result = valueA.localeCompare(valueB, 'es', {
          sensitivity: 'base',
          numeric: true,
        });

        if (result === 0) {
          result = (a.id ?? 0) - (b.id ?? 0);
        }

        return this.sort.direction === 'asc' ? result : -result;
      });
    }

    // 🔹 PAGINACIÓN
    const start = this.paginator.pageIndex * this.paginator.pageSize;
    const end = start + this.paginator.pageSize;

    this.total = data.length;

    // 🔥 CLAVE FINAL (te faltaba esto)
    this.dataSource.data = data.slice(start, end);
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

  filterLocal(term: string): void {
    this.viewUsers = this.allUsers.filter((u: any) => {
      const full = this.buildFullName(u).toLowerCase();
      const rut = (u.rut || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      return full.includes(term) || rut.includes(term) || email.includes(term);
    });

    this.total = this.viewUsers.length;

    this.paginator.firstPage();
    this.applyCurrentView();
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
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

  /** Cargar usuarios */
  async load(): Promise<void> {
    // 🔒 No hacer nada
    this.dataSource.data = [];
    this.total = 0;
  }

  async search(term: string): Promise<void> {
    this.loading = true;

    try {
      const result = await firstValueFrom(
        this.userSearchService.search(of(term)),
      );

      const baseUsers: any[] = Array.isArray(result)
        ? result
        : result?.[0] || [];

      // 🔥 traer datos completos
      const fullUsers = await Promise.all(
        baseUsers.map(async (u: any) => {
          const user = await firstValueFrom(this.api.getById(u.id));

          const rolesRes = await firstValueFrom(this.api.getUserRoles(u.id));

          const roles = rolesRes
            .filter((r) => !r.deletedAt)
            .map((r) => r.role?.name);

          return {
            ...user,
            roles, // 🔥 AHORA SÍ
            fullName: this.buildFullName(user),
          };
        }),
      );

      // 🔥 base + vista
      this.allUsers = fullUsers;
      this.viewUsers = [...fullUsers];

      this.total = this.viewUsers.length;

      // 🔥 una sola vez
      this.paginator.firstPage();
      this.applyCurrentView();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  clearSearch(input: HTMLInputElement): void {
    this.q = '';
    input.value = '';

    // 🔹 limpiar datos
    this.allUsers = [];
    this.viewUsers = [];
    this.dataSource.data = [];
    this.total = 0;

    // 🔹 reset paginador
    this.paginator.firstPage();

    // 🔹 reset orden (opcional pero recomendado)
    this.sort.active = 'id';
    this.sort.direction = 'asc';

    // 🔹 limpiar estado interno
    this.lastTerm = '';
  }

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

  private normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/-/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
      this.search(this.q);
    } else {
      this.clearSearch({ value: '' } as HTMLInputElement);
    }
  }

  openDialog(row?: User): void {
    const ref = this.dialog.open(UsuariosDialogComponent, {
      panelClass: 'sirus-dialog',
      width: '680px',
      maxWidth: '95vw',
      backdropClass: 'app-backdrop',
      data: row ?? null,
      disableClose: true,
    });

    ref.afterClosed().subscribe((updated?: User) => {
      if (updated) {
        this.updateLocalUser(updated);
      }
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
      if (ok) this.api.deleteUser(Number(row.id)).subscribe(() => this.load());
    });
  }

  restore(row: User): void {
    this.api.restore(Number(row.id)).subscribe(() => this.load());
  }
}

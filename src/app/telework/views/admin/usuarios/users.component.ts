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

import { merge } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

import { User } from '../../../models/user.model';
import { UsersService } from '../../../services/admin/users.service';
import { UsuariosDialogComponent } from './users.dialog';

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
    'username',
    'email',
    'rut',
    'createdAt',
    'estado',
    'acciones',
  ];

  dataSource = new MatTableDataSource<User>([]);
  loading = false;
  total = 0;

  /** Filtro búsqueda */
  q = '';

  /** Estado */
  filterState: 'all' | 'active' | 'deleted' = 'active';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private api = inject(UsersService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = 10;

    this.sort.active = 'id';
    this.sort.direction = 'asc' as SortDirection;

    this.sort.sortChange.subscribe(() => this.paginator.firstPage());
    merge(this.sort.sortChange, this.paginator.page).subscribe(() =>
      this.load(),
    );

    this.load();
    this.cdr.detectChanges();
  }

  private mapSortField(active?: string): string {
    switch (active) {
      case 'id':
        return 'id';
      case 'username':
        return 'username';
      case 'email':
        return 'email';
      case 'rut':
        return 'rut';
      case 'createdAt':
        return 'createdAt';

      default:
        return 'id';
    }
  }

  /** Cargar usuarios */
  load(): void {
    this.loading = true;

    const page = this.paginator?.pageIndex ?? 0;
    const size = this.paginator?.pageSize ?? 10;

    const active = this.sort?.active;
    const direction = (this.sort?.direction as '' | 'asc' | 'desc') || 'asc';
    const sortField = this.mapSortField(active);

    this.api
      .getAllPaginated(page, size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          const allRows: User[] = Array.isArray(res)
            ? res
            : (res?.content ?? []);

          let filtered = allRows;

          if (this.filterState === 'active') {
            filtered = allRows.filter((r) => !r.deletedAt);
          } else if (this.filterState === 'deleted') {
            filtered = allRows.filter((r) => !!r.deletedAt);
          }

          const term = (this.q || '').toLowerCase();

          if (term) {
            filtered = filtered.filter(
              (r) =>
                (r.username ?? '').toLowerCase().includes(term) ||
                (r.email ?? '').toLowerCase().includes(term) ||
                (r.rut ?? '').toLowerCase().includes(term),
            );
          }

          filtered.sort((a, b) => {
            const va = this.getFieldValue(a, sortField);
            const vb = this.getFieldValue(b, sortField);

            let cmp = 0;

            if (va == null && vb != null) cmp = -1;
            else if (va != null && vb == null) cmp = 1;
            else if (typeof va === 'number' && typeof vb === 'number')
              cmp = va - vb;
            else
              cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'es', {
                numeric: true,
                sensitivity: 'base',
              });

            return direction === 'asc' ? cmp : -cmp;
          });

          const start = page * size;
          const slice = filtered.slice(start, start + size);

          this.dataSource.data = slice;
          this.total = filtered.length;
        },

        error: (err) => console.error('Error cargando usuarios:', err),
      });
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
      case 'createdAt':
        return row.createdAt;

      default:
        return row.id;
    }
  }

  applyFilter(term: string): void {
    this.q = term.trim();
    this.paginator.firstPage();
    this.load();
  }

  setState(state: 'all' | 'active' | 'deleted'): void {
    this.q = '';
    this.filterState = state;
    this.paginator.firstPage();
    this.load();
  }

  refresh(): void {
    this.load();
  }

  openDialog(row?: User): void {
    setTimeout(() => {
      const ref = this.dialog.open(UsuariosDialogComponent, {
        width: '680px',
        maxWidth: '95vw',
        height: 'auto',
        panelClass: 'usuarios-dialog',
        backdropClass: 'app-backdrop',
        data: row ?? null,
        disableClose: true,
      });

      ref.afterClosed().subscribe((result?: User) => {
        if (result) queueMicrotask(() => this.load());
      });
    });
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

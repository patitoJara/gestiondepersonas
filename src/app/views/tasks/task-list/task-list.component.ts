import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ⚠️ Ajusta esta ruta según dónde está tu servicio
import { TasksService } from '../../../services/tasks.service';


export interface Task {
  id: number | string;
  name?: string;
  title?: string;
  createdAt?: string | Date | null;
}

/** Variantes de respuesta de backend que soportamos */
type PageSpring<T> = { content: T[]; totalElements: number };
type PageAlt<T>   = { items: T[]; total: number };
type PageLike<T>  = PageSpring<T> | PageAlt<T> | T[];

/** Normaliza la respuesta a { data, total } sin romper el tipado */
function normalizePage<T>(res: PageLike<T>): { data: T[]; total: number } {
  if (Array.isArray(res)) {
    return { data: res, total: res.length };
  }
  if ('content' in res) {
    return { data: res.content, total: res.totalElements };
  }
  if ('items' in res) {
    return { data: res.items, total: res.total };
  }
  return { data: [], total: 0 };
}

@Component({
  standalone: true,
  selector: 'app-task-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './task-list.component.html'
})

export class TaskListComponent implements AfterViewInit {
  private taskService = inject(TasksService);

  displayedColumns: string[] = ['id', 'name', 'createdAt', 'actions'];
  rows: Task[] = [];

  total = 0;
  page = 0;
  size = 5;

  loading = false;
  error = '';

ngAfterViewInit(): void {
  queueMicrotask(() => this.loadPage(this.page, this.size));
  // o: setTimeout(() => this.loadPage(this.page, this.size), 0);
}

  // ✅ Lánzalo acá (no en ngAfterViewInit) para evitar NG0100
  /*ngOnInit(): void {
    this.loadPage(this.page, this.size);
  } */ 

  onPage(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.loadPage(this.page, this.size);
  }

  loadPage(pageIndex = 0, pageSize = 5) {
    this.loading = true;
    this.error = '';
    this.rows = [];

    this.taskService.listPage(pageIndex, pageSize).subscribe({
      next: (res: unknown) => {
        const { data, total } = normalizePage<Task>(res as any);
        this.rows = data;
        this.total = total;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica IP/puerto/red (timeout).';
        } else {
          this.error = `Error ${err.status}: ${err.statusText || 'Solicitud fallida'}`;
        }
        console.error('Tasks load error:', err);
        this.loading = false;
      }
    });
  }

  // Acciones (ejemplo)
  edit(row: Task) {
    console.log('edit', row);
  }

  remove(row: Task) {
    console.log('remove', row);
  }
}

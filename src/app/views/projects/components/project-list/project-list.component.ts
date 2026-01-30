import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton, MatIconButton } from "@angular/material/button";
import { CommonModule } from '@angular/common';
import {
  MatCell,
  MatHeaderCellDef,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable
} from "@angular/material/table";
import { MatDivider } from "@angular/material/divider";
import { MatFormField, MatInput, MatLabel, MatSuffix } from "@angular/material/input";
import { Project } from '../../../../models/Project';
import { ProjectsService } from '../../../../services/projects.service';
import { MatDialog } from '@angular/material/dialog';
import { FormComponent } from '../../../projects/components/form/form.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    // Angular
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Material
    MatHeaderCellDef,
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatDivider,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatRow,
    MatRowDef,
    MatSuffix,
    MatTable,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent {
  projects: Project[] = [];
  displayedColumns: string[] = ['id', 'name', 'description','state','actions'];
  filterText: string = '';

  constructor(private projectservice: ProjectsService) { }

  ngOnInit() {
    this.listAll();
  }

  private listAll(): void {
    this.projectservice.list().subscribe({
      next: (projects) => {
        console.log('Projects received:', projects);
        this.projects = projects;
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
      }
    });
  }

  readonly dialog = inject(MatDialog);

  openDialog() {
    const dialogRef = this.dialog.open(FormComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.projectservice.save(result).subscribe({
          next: (project) => {
            console.log('Dato Guardado:', project);
            this.listAll();
          },
          error: (error) => {
            console.error('Error saving project:', error);
          }
        });
      }
    });
  }

  findByNameContainingIgnoreCase(projectname: string): void {
    this.projectservice.findByNameContainingIgnoreCase(projectname).subscribe({
      next: (projects) => {
        console.log('Projects received:', projects);
        this.projects = projects;
      },
      error: (error) => {
        this.listAll();
        console.error('Error fetching projects:', error);
      }
    });
  }

  editDialog(id: number) {
    this.projectservice.findById(id).subscribe({
      next: (project) => {
        const dialogRef = this.dialog.open(FormComponent, { data: project });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            const updatedProject: Project = { ...result, id };
            this.projectservice.update(id, updatedProject).subscribe({
              next: (updated) => {
                console.log('Proyecto actualizado:', updated);
                this.listAll();
              },
              error: (error) => {
                console.error('Error al actualizar proyecto:', error);
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener proyecto:', err);
      }
    });
  }

  eliminarProject(id: number): void {
    const confirmDelete = confirm('¿Seguro que quieres eliminar este proyecto?');
    if (confirmDelete) {
      this.projectservice.delete(id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== id);
          this.listAll();
        },
        error: err => {
          console.error('Error al eliminar proyecto:', err);
          alert('Ocurrió un error al eliminar el proyecto');
        }
      });
    }
  }
}

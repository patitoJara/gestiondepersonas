import {
  Component,
  Inject,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TextFieldModule } from '@angular/cdk/text-field';

import { firstValueFrom } from 'rxjs';

import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogOkComponent } from '@app/shared/confirm-dialog/confirm-dialog-ok.component';

export interface WorkDialogData {
  title: string;
  description?: string;
}

@Component({
  selector: 'app-work-dialog',
  standalone: true,
  templateUrl: './work-dialog.component.html',
  styleUrls: ['./work-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    TextFieldModule,
  ],
})
export class WorkDialogComponent {

  private dialog = inject(MatDialog);

  @ViewChild('txtArea') txtArea!: ElementRef;

  description: string = '';
  private initialValue = '';

  constructor(
    private ref: MatDialogRef<WorkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkDialogData | null,
  ) {
    this.description = this.data?.description ?? '';
    this.initialValue = this.description;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.txtArea?.nativeElement?.focus();
    });
  }

  guardar(): void {
    const clean = this.description?.trim();

    if (!clean) {
      this.showMsg('Debe ingresar una actividad');
      return;
    }

    this.ref.close(clean);
  }

  async cancelar(): Promise<void> {
    const clean = this.description?.trim();

    if (clean && clean !== this.initialValue.trim()) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        panelClass: 'sirus-dialog',
        data: {
          message: 'Tiene cambios sin guardar. ¿Desea salir?',
        },
      });

      const result = await firstValueFrom(ref.afterClosed());

      if (!result) return;
    }

    this.ref.close();
  }

  private showMsg(message: string) {
    this.dialog.open(ConfirmDialogOkComponent, {
      panelClass: 'sirus-dialog',
      data: { message },
    });
  }
}
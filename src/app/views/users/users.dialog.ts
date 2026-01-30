// users.dialog.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsersService } from '../../services/users.service';
import { ProgramService } from '../../services/program.service';
import { RoleService } from '../../services/role.service';
import { Program } from '../../models/program';
import { Role } from '../../models/role';
import { User } from '../../models/user';
import { rutValidator } from '../../core/validator/rut.validator';
import { ConfirmDialogOkComponent } from '../../shared/confirm-dialog/confirm-dialog-ok.component';
import { AuthLoginService } from '../../services/auth.login.service';

@Component({
  standalone: true,
  selector: 'app-users-dialog',
  templateUrl: './users.dialog.html',
  styleUrls: ['./users.dialog.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule, // 👁️ necesario para los íconos de visibilidad
    MatTooltipModule, // 👁️ necesario para los íconos de visibilidad
  ],
})
export class UsersDialogComponent implements OnInit {
  form!: FormGroup;
  programs: Program[] = [];
  roles: Role[] = [];
  hidePassword = true;
  public isEditing = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private programsService: ProgramService,
    private roleService: RoleService,
    private ref: MatDialogRef<UsersDialogComponent>,
    private dialog: MatDialog,
    private dialogOk: MatDialog,
    private authService: AuthLoginService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {}

  ngOnInit(): void {
    this.isEditing = !!this.data?.id;

    const userData = (
      this.isEditing
        ? { ...this.data, id: this.data?.id ?? null }
        : {
            id: null,
            firstName: '',
            secondName: '',
            firstLastName: '',
            secondLastName: '',
            email: '',
            username: '',
            password: '',
            rut: '',
            programs: [],
            roles: [],
          }
    ) as User; // 👈 cierra paréntesis + fuerza tipo User

    // 1️⃣ Formulario base
    this.form = this.fb.group({
      id: [userData.id],
      firstName: [userData.firstName, [Validators.required]],
      secondName: [userData.secondName],
      firstLastName: [userData.firstLastName],
      secondLastName: [userData.secondLastName],
      email: [userData.email, [Validators.required, Validators.email]],
      username: [userData.username],
      password: [
        '', // nunca se precarga por seguridad
        this.isEditing ? [] : [Validators.required, Validators.minLength(6)],
      ],
      rut: [userData.rut, [Validators.required, rutValidator()]],
      programs: [
        userData.programs?.map((p) => p.id) ?? [],
        [Validators.required],
      ],
      roles: [userData.roles?.map((r) => r.id) ?? [], [Validators.required]],
    });

    // 2️⃣ Cargar catálogos
    this.loadPrograms();
    this.loadRoles();

    // 3️⃣ Cargar relaciones solo si edita
    if (this.isEditing) {
      this.usersService.getUserRoles(userData.id!).subscribe({
        next: (roles: Role[]) => {
          this.form.patchValue({ roles: roles.map((r) => r.id) });
        },
        error: (err) => this.handleError(err, 'roles'),
      });

      this.usersService.getUserPrograms(userData.id!).subscribe({
        next: (programs: Program[]) => {
          this.form.patchValue({ programs: programs.map((p) => p.id) });
        },
        error: (err) => this.handleError(err, 'programas'),
      });
    } else {
      // 🔹 Reset forzado con valores iniciales vacíos
      setTimeout(() => {
        if (!this.isEditing) {
          this.form.reset({
            id: null,
            firstName: '',
            secondName: '',
            firstLastName: '',
            secondLastName: '',
            email: '',
            username: '',
            password: '',
            rut: '',
            programs: [],
            roles: [],
          });
          this.form.markAsPristine();
          this.form.markAsUntouched();
          console.log('[UsersDialog] 🧹 Nuevo usuario: formulario limpio');
        }
      });
    }
  }

  /** 🔹 Maneja errores sin cerrar sesión ni bloquear el layout */
  private handleError(
    err: HttpErrorResponse,
    tipo: 'roles' | 'programas'
  ): void {
    if (err.status === 403 || err.status === 404) {
      console.warn(
        `[UsersDialog] Usuario sin ${tipo} asociados o sin permiso (${err.status}).`
      );

      // ✅ Mostramos aviso sin bloquear el resto
      this.dialogOk.open(ConfirmDialogOkComponent, {
        width: '420px',
        disableClose: false, // ✅ permite clic afuera o ESC
        hasBackdrop: true,
        autoFocus: false,
        data: {
          title: `Usuario sin ${tipo}`,
          message: `El usuario no tiene ${tipo} asociados.`,
          confirmText: 'Aceptar',
          color: 'accent',
          icon: 'info',
        },
      });
      return;
    }

    console.error(`[UsersDialog] ❌ Error cargando ${tipo}:`, err.message);
  }

  /** Cargar Programas disponibles */
  loadPrograms(): void {
    this.programsService.listAll().subscribe({
      next: (res: Program[]) => (this.programs = res || []),
      error: (err: HttpErrorResponse) =>
        console.error(
          '[UsersDialog] ❌ Error cargando programas:',
          err.message
        ),
    });
  }

  /** Cargar Roles disponibles */
  loadRoles(): void {
    this.roleService.listAll().subscribe({
      next: (res: Role[]) => (this.roles = res || []),
      error: (err: HttpErrorResponse) =>
        console.error('[UsersDialog] ❌ Error cargando roles:', err.message),
    });
  }

  /** Guardar usuario (crear o actualizar) */
  /** Guardar usuario (crear o actualizar) */
  save(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    // 🔹 No enviar password vacío al backend
    if (this.isEditing && !formValue.password) {
      delete formValue.password;
    }

    const payload: User = {
      ...formValue,
      programs: formValue.programs.map((id: number) => ({ id })),
      roles: formValue.roles.map((id: number) => ({ id })),
    };

    const request$ = payload.id
      ? this.usersService.update(payload.id, payload)
      : this.usersService.save(payload);

    request$.subscribe({
      next: () => {
        console.log('[UsersDialog] ✅ Usuario guardado con éxito.');
        this.ref.close(true);
      },
      error: (err) =>
        console.error('[UsersDialog] ❌ Error guardando usuario:', err),
    });
  }

  cancel(): void {
    this.ref.close();
  }

  autoFormatAndValidateRut(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('rut');
    if (!control) return;

    // 🔹 Limpia y prepara el valor (solo números y K)
    let value = input.value.toUpperCase().replace(/[^0-9K]/g, '');

    if (!value) {
      control.setValue('', { emitEvent: true });
      return;
    }

    // 🔹 Separar cuerpo y dígito verificador
    const body = value.slice(0, -1);
    const dv = value.slice(-1);
    let formatted = '';

    // 🔹 Insertar puntos cada 3 dígitos desde el final
    for (let i = body.length; i > 0; i -= 3) {
      const start = Math.max(i - 3, 0);
      formatted = body.substring(start, i) + (formatted ? '.' + formatted : '');
    }

    const formattedRut = `${formatted}-${dv}`;

    // 🔹 Actualizar input y form control
    input.value = formattedRut;
    control.setValue(formattedRut, { emitEvent: true });

    // 🔹 Mantener cursor al final (mejor UX)
    const len = formattedRut.length;
    input.setSelectionRange(len, len);
  }

  /*
  formatRut(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\./g, '').replace(/-/g, '').toUpperCase();

    if (value.length > 1) {
      const body = value.slice(0, -1);
      const dv = value.slice(-1);
      let formatted = '';

      // Agregar puntos cada 3 dígitos desde el final
      for (let i = body.length; i > 0; i -= 3) {
        const start = Math.max(i - 3, 0);
        const part = body.substring(start, i);
        formatted = part + (formatted ? '.' + formatted : '');
      }

      input.value = `${formatted}-${dv}`;
    } else {
      input.value = value;
    }

    // Actualiza el valor del control sin perder validaciones
    this.form.get('rut')?.setValue(input.value, { emitEvent: false });
  }

  validateRutOnBlur(): void {
    const control = this.form.get('rut');
    if (!control) return;

    let value = control.value?.trim() || '';
    if (!value) return;

    // 🔹 Limpia y formatea antes de validar
    value = value.replace(/\./g, '').replace(/-/g, '').toUpperCase();

    // 🔹 Marca el control como tocado y modificado
    control.markAsTouched();
    control.markAsDirty();

    // 🔹 Fuerza a Angular a reconocer el cambio y disparar el validador
    control.setValue(value, { emitEvent: true });
    control.updateValueAndValidity({ emitEvent: true });

    // 🔹 Verifica si es válido y muestra feedback
    if (control.invalid) {
      console.warn('[UsersDialog] ⚠️ RUT inválido al perder el foco:', value);
    } else {
      console.log('[UsersDialog] ✅ RUT válido al perder el foco:', value);
    }
  }
    */
}

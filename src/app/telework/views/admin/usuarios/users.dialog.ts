import { Component, Inject, OnInit, inject } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';

import { forkJoin } from 'rxjs';

import { User } from '../../../models/user.model';
import { Role } from '../../../models/role.model';

import { UsersService } from '../../../services/admin/users.service';
import { RolesService } from '../../../services/admin/roles.service';
import { generarPassword } from '@app/shared/utils/password.util';
import { formatearNombre } from '@app/shared/utils/name.util';

import { rutValidator } from '../../../../shared/utils/rut.validator';
import { ErrorConfirmDialogComponent } from '../../../../shared/confirm-dialog/errorConfirmDialogComponent';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-usuarios-dialog',
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
    MatIconModule,
  ],
})
export class UsuariosDialogComponent implements OnInit {
  private dialog = inject(MatDialog);

  hide = true;

  form!: FormGroup;
  roles: Role[] = [];
  activeRole: string = '';

  passwordGenerada: string = '';
  isSelfEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private rolesService: RolesService,
    private ref: MatDialogRef<UsuariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null,
  ) {}

  ngOnInit(): void {
    const isEdit = !!this.data?.id;

    this.form = this.fb.group({
      id: [this.data?.id ?? null],
      username: [this.data?.username ?? '', Validators.required],
      email: [this.data?.email ?? '', [Validators.required, Validators.email]],
      rut: [this.data?.rut ?? '', [Validators.required, rutValidator()]],
      firstName: [this.data?.firstName ?? '', Validators.required],
      secondName: [this.data?.secondName ?? ''],
      firstLastName: [this.data?.firstLastName ?? '', Validators.required],
      secondLastName: [this.data?.secondLastName ?? ''],
      password: [''],
      roles: [[], Validators.required],
    });

    if (!isEdit) {
      this.form.patchValue({
        email: '',
        password: '',
      });
    }

    this.loadRoles();

    if (isEdit) {
      this.loadUserRoles(this.data!.id);
    }

    // =========================================
    // 🔥 CONTEXTO DE SESIÓN
    // =========================================
    const currentUser = JSON.parse(sessionStorage.getItem('profile') || '{}');

    const currentUserId = currentUser?.id;

    this.activeRole = (
      sessionStorage.getItem('activeRole') || ''
    ).toUpperCase();

    this.isSelfEdit = this.data?.id === currentUserId;

    // =========================================
    // 🔥 LIMPIAR PASSWORD
    // =========================================
    setTimeout(() => {
      this.form.get('password')?.setValue('');
    }, 0);
  }

  loadRoles(): void {
    this.rolesService.getAllPaginated({ page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        this.roles = res.content ?? res;
      },
      error: (err: any) => console.error('Error cargando roles', err),
    });
  }

  loadUserRoles(userId: number): void {
    this.usersService.getUserRoles(userId).subscribe({
      next: (res: any[]) => {
        const roleIds = res.map((r) => r.role.id);

        this.form.patchValue({
          roles: roleIds,
        });
      },
      error: (err: any) =>
        console.error('Error cargando roles del usuario', err),
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const userPayload: any = { ...v };
    delete userPayload.roles;

    if (!userPayload.password) {
      delete userPayload.password;
    }

    try {
      // =========================================
      // 🔹 CREAR / ACTUALIZAR USUARIO
      // =========================================
      const savedUser: any = await firstValueFrom(
        v.id
          ? this.usersService.updateUser(v.id, userPayload)
          : this.usersService.createUser(userPayload),
      );

      const userId = savedUser.id ?? v.id;

      const currentUser = JSON.parse(sessionStorage.getItem('profile') || '{}');
      const currentUserId = currentUser?.id;

      // =========================================
      // 🔥 VALIDAR SELF EDIT (NO PERDER ROL ACTIVO)
      // =========================================
      if (userId === currentUserId) {
        const activeRole = (
          sessionStorage.getItem('activeRole') || ''
        ).toUpperCase();

        const newRoles = this.roles
          .filter((r) => v.roles.includes(r.id))
          .map((r) => r.name.toUpperCase());

        if (!newRoles.includes(activeRole)) {
          this.dialog.open(ErrorConfirmDialogComponent, {
            width: '420px',
            data: {
              title: 'Acción no permitida',
              message: 'No puedes quitarte el rol con el que ingresaste.',
              confirmText: 'Aceptar',
              icon: 'warning',
            },
          });
          return;
        }
      }

      // =========================================
      // 🔥 SINCRONIZAR ROLES (CLAVE)
      // =========================================

      // 🔹 obtener roles actuales
      const currentRolesRes: any[] = await firstValueFrom(
        this.usersService.getUserRoles(userId),
      );

      const currentRoleIds = currentRolesRes
        .filter((r: any) => !r.deletedAt)
        .map((r: any) => r.role?.id);

      const newRoleIds: number[] = v.roles || [];

      // 🔥 diferencias
      const rolesToAdd = newRoleIds.filter(
        (id) => !currentRoleIds.includes(id),
      );

      const rolesToRemove = currentRoleIds.filter(
        (id) => !newRoleIds.includes(id),
      );

      // ➕ AGREGAR
      for (const roleId of rolesToAdd) {
        await firstValueFrom(this.usersService.addUserRole(userId, roleId));
      }

      // ➖ ELIMINAR
      for (const roleId of rolesToRemove) {
        await firstValueFrom(this.usersService.deleteUserRole(userId, roleId));
      }

      console.log('✅ Roles sincronizados correctamente');

      // =========================================
      // 🔥 SELF EDIT → RELOGIN
      // =========================================
      if (userId === currentUserId) {
        this.dialog.open(ErrorConfirmDialogComponent, {
          width: '420px',
          disableClose: true,
          data: {
            title: 'Sesión actualizada',
            message: 'Debes iniciar sesión nuevamente.',
            confirmText: 'Aceptar',
            icon: 'warning',
          },
        });

        setTimeout(() => {
          sessionStorage.clear();
          window.location.href = '/auth/login';
        }, 1200);

        return;
      }

      // =========================================
      // ✅ CIERRE NORMAL
      // =========================================
      this.ref.close(true);
    } catch (err) {
      console.error('❌ ERROR', err);

      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Error',
          message: 'No se pudieron guardar los cambios',
          confirmText: 'Aceptar',
          icon: 'error',
        },
      });
    }
  }

  cancel(): void {
    this.ref.close();
  }

  /** ===============================
   * FORMATEAR RUT
   ================================= */

  generarClave(): void {
    this.passwordGenerada = generarPassword(10);

    // opcional: setear en el form
    this.form.patchValue({
      password: this.passwordGenerada,
    });
  }

  copiarClave(): void {
    if (!this.passwordGenerada) return;

    navigator.clipboard.writeText(this.passwordGenerada);
    alert('Clave copiada 😎');
  }

  onBlurNombre(campo: string): void {
    const control = this.form.get(campo);
    if (!control) return;

    const valor = control.value;
    if (!valor) return;

    const formateado = formatearNombre(valor);

    control.setValue(formateado, { emitEvent: false });

    // 🔥 aquí llamas lo otro
    this.generarUsername();
  }

  formatRut(event: Event): void {
    const input = event.target as HTMLInputElement;
    const control = this.form.get('rut');

    if (!control) return;

    let value = input.value.toUpperCase().replace(/[^0-9K]/g, '');

    if (!value) {
      control.setValue('');
      return;
    }

    const body = value.slice(0, -1);
    const dv = value.slice(-1);

    let formatted = '';

    for (let i = body.length; i > 0; i -= 3) {
      const start = Math.max(i - 3, 0);

      formatted = body.substring(start, i) + (formatted ? '.' + formatted : '');
    }

    const rut = `${formatted}-${dv}`;

    input.value = rut;

    control.setValue(rut);

    control.markAsTouched();
    control.updateValueAndValidity();
  }

  /** ===============================
   * VALIDAR RUT AL PERDER FOCO
   ================================= */

  validarRutBlur(): void {
    const control = this.form.get('rut');

    if (!control) return;

    control.markAsTouched();
    control.updateValueAndValidity();

    if (control.hasError('rutInvalido') && control.value?.length > 7) {
      this.dialog.open(ErrorConfirmDialogComponent, {
        width: '420px',
        disableClose: true,
        data: {
          title: 'RUT INVALIDO',
          message:
            'El RUT ingresado no es válido.\n\nVerifique el dígito verificador.',
          confirmText: 'Aceptar',
          icon: 'warning',
          dense: true,
        },
      });
    }
  }

  /** ===============================
   * AUTOCOMPLETAR CORREO
   ================================= */

  completarCorreo(): void {
    const control = this.form.get('email');
    if (!control) return;

    let value = control.value;
    if (!value) return;

    value = value.trim().toLowerCase();

    // 🚫 si ya tiene dominio → no hacer nada
    if (value.includes('@')) return;

    const nuevo = `${value}@redsalud.gob.cl`;

    // ✅ solo actualizar si realmente cambió
    if (control.value !== nuevo) {
      control.setValue(nuevo);
      control.updateValueAndValidity();
    }
  }

  /** ===============================
   * GENERAR USERNAME
   ================================= */

  generarUsername(): void {
    if (this.data?.id) return;

    const firstName = this.form.get('firstName')?.value;
    const secondName = this.form.get('secondName')?.value;
    const lastName = this.form.get('firstLastName')?.value;
    const userControl = this.form.get('username');

    if (!firstName || !lastName || !userControl) return;

    const clean = (s: string) =>
      s
        .trim() // 🔥 elimina espacios extremos
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita acentos
        .replace(/\s+/g, ''); // 🔥 elimina TODOS los espacios

    const firstInitial = clean(firstName)[0];
    const secondInitial = secondName ? clean(secondName)[0] : '';
    const last = clean(lastName);

    const username = firstInitial + secondInitial + last;

    userControl.setValue(username);
  }
}

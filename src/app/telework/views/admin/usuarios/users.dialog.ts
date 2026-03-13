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
  MatDialog
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

import { forkJoin } from 'rxjs';

import { User } from '../../../models/user.model';
import { Role } from '../../../models/role.model';

import { UsersService } from '../../../services/admin/users.service';
import { RolesService } from '../../../services/admin/roles.service';

import { rutValidator } from '../../../../core/validator/rut.validator';
import { ErrorConfirmDialogComponent } from '../../../../shared/confirm-dialog/errorConfirmDialogComponent';

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
  ],
})
export class UsuariosDialogComponent implements OnInit {

  /** dialog usando inject (Angular moderno) */
  private dialog = inject(MatDialog);

  form!: FormGroup;
  roles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private rolesService: RolesService,
    private ref: MatDialogRef<UsuariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {}

  ngOnInit(): void {

    this.form = this.fb.group({

      id: [this.data?.id ?? null],

      username: [
        this.data?.username ?? '',
        Validators.required
      ],

      email: [
        this.data?.email ?? '',
        [Validators.required, Validators.email]
      ],

      rut: [
        this.data?.rut ?? '',
        [Validators.required, rutValidator()]
      ],

      firstName: [
        this.data?.firstName ?? '',
        Validators.required
      ],

      secondName: [
        this.data?.secondName ?? ''
      ],

      firstLastName: [
        this.data?.firstLastName ?? '',
        Validators.required
      ],

      secondLastName: [
        this.data?.secondLastName ?? ''
      ],

      password: [''],

      roles: [[], Validators.required],
    });

    this.loadRoles();

    if (this.data?.id) {
      this.loadUserRoles(this.data.id);
    }
  }

  /** ===============================
   * CARGAR ROLES
   ================================= */

  loadRoles(): void {

    this.rolesService
      .getAllPaginated({
        page: 0,
        size: 100,
      })
      .subscribe({
        next: (res: any) => {
          this.roles = res.content ?? res;
        },
        error: (err) =>
          console.error('Error cargando roles', err),
      });
  }

  loadUserRoles(userId: number): void {

    this.usersService.getUserRoles(userId).subscribe({

      next: (res: any[]) => {

        const roleIds = res.map(r => r.role.id);

        this.form.patchValue({
          roles: roleIds,
        });

      },

      error: (err) =>
        console.error('Error cargando roles del usuario', err),

    });
  }

  /** ===============================
   * GUARDAR
   ================================= */

  save(): void {

    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const userPayload = { ...v };
    delete userPayload.roles;

    const request$ = v.id
      ? this.usersService.updateUser(v.id, userPayload)
      : this.usersService.createUser(userPayload);

    request$.subscribe({

      next: (savedUser: any) => {

        const userId = savedUser.id ?? v.id;

        this.usersService
          .deleteUserRoles(userId)
          .subscribe(() => {

            const requests = v.roles.map((roleId: number) =>
              this.usersService.addUserRole(userId, roleId)
            );

            forkJoin(requests).subscribe({
              next: () => this.ref.close(true),
              error: (err) => console.error(err),
            });

          });

      },

      error: (err) => console.error(err),

    });
  }

  cancel(): void {
    this.ref.close();
  }

  /** ===============================
   * FORMATEAR RUT
   ================================= */

  formatRut(event: Event): void {

    const input = event.target as HTMLInputElement;
    const control = this.form.get('rut');

    if (!control) return;

    let value = input.value
      .toUpperCase()
      .replace(/[^0-9K]/g, '');

    if (!value) {
      control.setValue('');
      return;
    }

    const body = value.slice(0, -1);
    const dv = value.slice(-1);

    let formatted = '';

    for (let i = body.length; i > 0; i -= 3) {

      const start = Math.max(i - 3, 0);

      formatted =
        body.substring(start, i) +
        (formatted ? '.' + formatted : '');

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

    let value = control?.value;

    if (!value) return;

    value = value.trim().toLowerCase();

    if (!value.includes('@')) {
      value = value + '@redsalud.gob.cl';
    }

    control?.setValue(value);
  }

  /** ===============================
   * GENERAR USERNAME
   ================================= */

  generarUsername(): void {

    const firstName =
      this.form.get('firstName')?.value;

    const secondName =
      this.form.get('secondName')?.value;

    const lastName =
      this.form.get('firstLastName')?.value;

    const userControl =
      this.form.get('username');

    if (!firstName || !lastName || !userControl)
      return;

    const clean = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const firstInitial = clean(firstName)[0];

    const secondInitial = secondName
      ? clean(secondName)[0]
      : '';

    const last = clean(lastName);

    const username =
      firstInitial + secondInitial + last;

    userControl.setValue(username);
  }

}
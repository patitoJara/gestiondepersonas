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
import { Role } from '../../../../../../core/auth/models/role.model';

import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { RolesService } from '../../../services/admin/roles.service';
import { generarPassword } from '@app/shared/utils/password.util';

import { rutValidator } from '@app/shared/utils/rut.validator';
import { ErrorConfirmDialogComponent } from '@app/shared/confirm-dialog/errorConfirmDialogComponent';
import { firstValueFrom } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
    MatSelectModule,
    MatDatepickerModule,
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

  // 🔒 La clave solo se actualiza cuando el usuario lo solicita explícitamente
  allowPasswordUpdate = false;

  roleConfig: any = {
    ADMIN: { icon: 'admin_panel_settings', color: 'role-admin' },
    SUPERVISOR: { icon: 'supervisor_account', color: 'role-supervisor' },
    JEFATURA: { icon: 'badge', color: 'role-jefatura' },
    ADMINISTRATIVO: { icon: 'person', color: 'role-administrativo' },
  };

  contractTypes: string[] = [
    'PLANTA',
    'CONTRATA',
    'HONORARIOS',
    'SUPLENTE',
    'SIN PERFIL ASIGNADO',
  ];

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

      birth_date: [this.parseDateCL(this.data?.birth_date)],
      contract_date: [this.parseDateCL(this.data?.contract_date)],
      contract_type: [this.data?.contract_type ?? ''],

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
      const passwordControl = this.form.get('password');

      passwordControl?.setValue('');
      passwordControl?.markAsPristine();
      passwordControl?.markAsUntouched();
    }, 0);
  }

  parseDateCL(date: any): Date | null {
    if (!date) return null;

    let d: Date;

    // ✅ Si ya viene como Date
    if (date instanceof Date) {
      d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // ✅ String backend: YYYY-MM-DD o ISO
    else if (typeof date === 'string') {
      const [year, month, day] = date.split('T')[0].split('-');

      d = new Date(+year, +month - 1, +day);
    }

    // ✅ Fallback
    else {
      d = new Date(date);
    }

    d.setHours(0, 0, 0, 0);

    return d;
  }

  enablePasswordChange(): void {
    this.allowPasswordUpdate = true;
    this.passwordGenerada = '';

    const passwordControl = this.form.get('password');

    passwordControl?.setValue('');
    passwordControl?.markAsPristine();
    passwordControl?.markAsUntouched();
  }

  formatDateCL(date: any): string {
    if (!date) return '';

    const d = this.parseDateCL(date);

    if (!d) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  toBackendDate(date: Date | null): string | null {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onDateChange(field: 'birth_date' | 'contract_date', event: any): void {
    const value = event.value;

    if (!value) {
      this.form.get(field)?.setValue(null);
      return;
    }

    const cleanDate = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );

    this.form.get(field)?.setValue(cleanDate);
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

    this.form.disable();

    try {
      const v = this.form.getRawValue();

      let savedUser: any;

      // =====================================================
      // ✏️ EDITAR USUARIO EXISTENTE
      // =====================================================
      if (v.id) {
        const currentUser: any = await firstValueFrom(
          this.usersService.getById(v.id),
        );

        const userPayload: any = {
          ...currentUser,

          username: v.username,
          email: v.email,

          firstName: v.firstName,
          secondName: v.secondName,

          firstLastName: v.firstLastName,
          secondLastName: v.secondLastName,

          birth_date: this.toBackendDate(v.birth_date),
          contract_date: this.toBackendDate(v.contract_date),
          contract_type: v.contract_type || null,

          rut: currentUser.rut,
        };

        // Los roles se administran por separado
        delete userPayload.roles;

        // 🔐 EDITAR:
        // cambiar clave solamente cuando el administrador
        // habilitó explícitamente el cambio
        if (this.allowPasswordUpdate && v.password?.trim()) {
          userPayload.password = v.password.trim();
        } else {
          delete userPayload.password;
        }

        savedUser = await firstValueFrom(
          this.usersService.updateUser(v.id, userPayload),
        );
      }

      // =====================================================
      // ➕ CREAR USUARIO NUEVO
      // =====================================================
      else {
        const userPayload: any = {
          rut: v.rut,

          firstName: v.firstName,
          secondName: v.secondName,
          firstLastName: v.firstLastName,
          secondLastName: v.secondLastName,

          birth_date: this.toBackendDate(v.birth_date),
          contract_date: this.toBackendDate(v.contract_date),
          contract_type: v.contract_type || null,

          username: v.username,
          email: v.email,
        };

        if (v.password?.trim()) {
          userPayload.password = v.password.trim();
        }

        savedUser = await firstValueFrom(
          this.usersService.createUser(userPayload),
        );
      }

      const userId = savedUser.id ?? v.id;

      // =====================================================
      // 🔹 SINCRONIZAR ROLES
      // =====================================================
      await this.syncRoles(userId, v.roles);

      // =====================================================
      // 🔹 TRAER DATOS ACTUALIZADOS
      // =====================================================
      const userFromApi = await firstValueFrom(
        this.usersService.getById(userId),
      );

      const rolesRes: any[] = await firstValueFrom(
        this.usersService.getUserRoles(userId),
      );

      const fullUser = this.mapUserToUI(userFromApi, rolesRes);

      this.ref.close(fullUser);
    } catch (err) {
      this.form.enable();

      console.error('Error guardando usuario', err);
    }
  }

  private mapUserToUI(user: any, rolesRes?: any[]): any {
    const roles = rolesRes
      ? rolesRes.filter((r) => !r.deletedAt).map((r) => r.role?.name)
      : user.roles || [];

    return {
      ...user,
      roles,
      fullName: [
        user.firstName,
        user.secondName,
        user.firstLastName,
        user.secondLastName,
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  async syncRoles(userId: number, newRoleIds: number[]) {
    const currentRolesRes: any[] = await firstValueFrom(
      this.usersService.getUserRoles(userId),
    );

    const currentRoleIds = currentRolesRes
      .filter((r) => !r.deletedAt)
      .map((r) => r.role?.id);

    const rolesToAdd = newRoleIds.filter((id) => !currentRoleIds.includes(id));
    const rolesToRemove = currentRoleIds.filter(
      (id) => !newRoleIds.includes(id),
    );

    await Promise.all([
      ...rolesToAdd.map((id) =>
        firstValueFrom(this.usersService.addUserRole(userId, id)),
      ),
      ...rolesToRemove.map((id) =>
        firstValueFrom(this.usersService.deleteUserRole(userId, id)),
      ),
    ]);
  }

  cancel(): void {
    this.ref.close();
  }

  /** ===============================
   * FORMATEAR RUT
   ================================= */

  generarClave(): void {
    this.allowPasswordUpdate = true;
    this.passwordGenerada = generarPassword(10);

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

    const formateado = String(valor).trim().toUpperCase();

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

  async validarRutBlur(): Promise<void> {
    const control = this.form.get('rut');
    if (!control) return;

    control.markAsTouched();
    control.updateValueAndValidity();

    const rut = control.value;

    // 🔴 validar formato primero
    if (control.hasError('rutInvalido') && rut?.length > 7) {
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
      return;
    }

    // 🔥 SOLO si es usuario NUEVO
    if (this.data?.id) return;

    if (!rut) return;

    try {
      const existe = await this.existeRutLocal(rut);

      if (existe) {
        control.setErrors({ ...control.errors, duplicado: true });

        this.dialog.open(ErrorConfirmDialogComponent, {
          width: '420px',
          data: {
            title: 'RUT ya registrado',
            message: 'Este RUT ya existe en el sistema.',
            confirmText: 'Aceptar',
            icon: 'warning',
          },
        });
      } else {
        // 🔥 limpiar solo error duplicado
        const errors = control.errors;
        if (errors) {
          delete errors['duplicado'];

          if (Object.keys(errors).length === 0) {
            control.setErrors(null);
          } else {
            control.setErrors(errors);
          }
        }
      }
    } catch (err) {
      console.error('Error validando RUT', err);
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

  async existeRutLocal(rut: string): Promise<boolean> {
    const users = await firstValueFrom(this.usersService.getAll());

    const normalizado = this.normalizarRut(rut);

    return users.some((u: any) => this.normalizarRut(u.rut) === normalizado);
  }

  normalizarRut(rut: string): string {
    return (rut || '')
      .replace(/\./g, '')
      .replace(/-/g, '')
      .toUpperCase()
      .trim();
  }
}

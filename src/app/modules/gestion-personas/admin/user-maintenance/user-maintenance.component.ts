import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';

type User = {
  id: number;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  email: string;
  username: string | null;
  password: string | null;
  rut: string;
};

type UserAudit = User & {
  expectedUsername: string;
  generatedPassword: string;
  status: 'ok' | 'username' | 'password' | 'both';
  protected: boolean;
  locked: boolean; // 🔥 ESTE FALTABA
};

@Component({
  standalone: true,
  selector: 'app-user-maintenance',
  templateUrl: './user-maintenance.component.html',
  styleUrls: ['./user-maintenance.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
})
export class UserMaintenanceComponent {
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);

  loading = false;
  summary: any = null;
  result: any = null;

  auditUsers: UserAudit[] = [];

  fixUsername = true;
  fixPassword = true;
  forceReset = false;

  protectedUsernames: string[] = [
    'admin',
    'operador',
    'supervisor',
    'jefatura',
  ];

  // =========================
  // 🔧 HELPERS
  // =========================
  normalizeText(text: string | null | undefined): string {
    if (!text) return '';

    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  generateUsername(u: User): string {
    const firstName = this.normalizeText(u.firstName);
    const lastName = this.normalizeText(u.firstLastName);

    if (!firstName || !lastName) return '';

    return firstName.charAt(0) + lastName;
  }

  generatePassword(u: User): string {
    const name = this.normalizeText(u.firstName);

    if (!u.rut || !name) return name ? `${name}1234` : 'temp1234';

    const rut = u.rut.replace(/\D/g, '').slice(-4);

    return name + rut;
  }

  isProtectedUser(u: User): boolean {
    return this.protectedUsernames.includes((u.username || '').toLowerCase());
  }

  // =========================
  // 🔍 PREVIEW
  // =========================
  async preview() {
    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.usersService.previewNormalization(),
      );

      const users: User[] = (response as any).content ?? (response as any);

      // 🔒 set con usernames existentes (para evitar colisiones)
      const existingUsernames = new Set(
        users.map((u) => (u.username || '').toLowerCase()).filter((u) => !!u),
      );

      this.auditUsers = users.map((u) => this.buildAudit(u, existingUsernames));

      const actionable = this.auditUsers.filter(
        (a) => !a.protected && !a.locked,
      );

      this.summary = {
        processed: users.length,
        willUpdate: actionable.length,
        totalIssues: this.auditUsers.filter((a) => a.status !== 'ok').length,
        usernameIssues: this.auditUsers.filter((a) => a.status === 'username')
          .length,
        passwordIssues: this.auditUsers.filter((a) => a.status === 'password')
          .length,
      };
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  private buildAudit(u: User, existing: Set<string>): UserAudit {
    // 🔒 protegidos
    if (this.isProtectedUser(u)) {
      return {
        ...u,
        expectedUsername: u.username || '',
        generatedPassword: '',
        status: 'ok',
        protected: true,
        locked: true,
      };
    }

    // 👉 username base (sin colisión)
    const baseUsername = this.generateUsername(u) || 'user';
    // 👉 username único (para mostrar sugerencia)
    const expectedUsername = this.generateUniqueUsername(
      baseUsername,
      existing,
    );
    const hasUsername = !!u.username && !this.isRutUsername(u);
    const hasPassword = !!u.password;
    // 🔥 VALIDACIÓN CORRECTA (NO contra el unique)
    const cleanUsername = (u.username || '').trim();

    const usernameOk =
      hasUsername &&
      this.normalizeText(cleanUsername) === this.normalizeText(baseUsername);
    const status = this.resolveStatus(hasUsername, hasPassword, usernameOk);

    return {
      ...u,
      expectedUsername,
      generatedPassword:
        !hasPassword && !usernameOk ? this.generatePassword(u) : '',
      status,
      protected: false,
      locked: usernameOk && hasUsername,
    };
  }

  private resolveStatus(
    hasUsername: boolean,
    hasPassword: boolean,
    usernameOk: boolean,
  ): 'ok' | 'username' | 'password' | 'both' {
    if (!hasUsername && !hasPassword) return 'both';
    if (!hasUsername) return 'username';

    // 🔒 prioridad máxima
    if (usernameOk) return 'ok';

    if (!hasPassword) return 'password';

    return 'username';
  }

  // =========================
  // ⚡ EXECUTE (DIFINITIVO)
  // =========================
  async execute() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar',
        message: `Se procesarán ${this.summary.willUpdate} usuarios`,
      },
    });

    const confirm = await firstValueFrom(ref.afterClosed());
    if (!confirm) return;

    const ROLE_ADMINISTRATIVO_ID = 2;

    const toUpdate = this.auditUsers.filter((a) => !a.protected && !a.locked);

    console.log('🔥 TOTAL A PROCESAR:', toUpdate.length);

    this.loading = true;

    let processed = 0;
    let success = 0;
    let errors = 0;

    try {
      for (const a of toUpdate) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🚀 ${processed + 1}/${toUpdate.length} → ID ${a.id}`);

        try {
          // 🔹 GET
          const fullUser: any = await firstValueFrom(
            this.usersService.getById(a.id),
          );

          console.log(`📛 Username actual: ${fullUser.username}`);
          console.log(`✏️ Username nuevo: ${a.expectedUsername}`);

          // 🔹 MERGE PRO
          const payload: any = {
            ...fullUser,
            username: a.expectedUsername,
            ...(a.generatedPassword && {
              password: a.generatedPassword,
            }),
          };

          delete payload.createdAt;
          delete payload.updatedAt;

          // 🔹 UPDATE
          await firstValueFrom(this.usersService.updateUser(a.id, payload));

          // 🔹 ROLES
          if (a.status === 'both') {
            await this.syncRoles(a.id, [ROLE_ADMINISTRATIVO_ID]);
          }

          // 🔹 VALIDACIÓN
          const updated: any = await firstValueFrom(
            this.usersService.getById(a.id),
          );

          console.log(`✅ OK ID ${a.id}`);
          console.log(`➡️ Username final: ${updated.username}`);

          success++;
        } catch (err) {
          console.error(`❌ Error en ID ${a.id}`, err);
          errors++;
        }

        processed++;
        //break;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 RESUMEN FINAL');
      console.log(`✔️ Procesados: ${processed}`);
      console.log(`✅ Éxitos: ${success}`);
      console.log(`❌ Errores: ${errors}`);
    } finally {
      this.loading = false;
    }
  }

  /*
  async fixUser228() {
    const USER_ID = 228;

    try {
      const fullUser: any = await firstValueFrom(
        this.usersService.getById(USER_ID),
      );

      const payload: any = {
        id: USER_ID,
        firstName: fullUser.firstName,
        secondName: fullUser.secondName,
        firstLastName: fullUser.firstLastName,
        secondLastName: fullUser.secondLastName,
        email: fullUser.email,
        rut: fullUser.rut,
        username: 'sjara',

        // 🔥 AHORA SÍ FUNCIONA
        password: 'sebastian1369',
      };

      await firstValueFrom(this.usersService.updateUser(USER_ID, payload));

      await this.syncRoles(USER_ID, [2]);

      console.log('✅ Usuario 228 listo');
    } catch (err) {
      console.error(err);
    }
  }
  */

  async fixUser228() {
    const USER_ID = 228;

    try {
      // 🔹 1. GET
      const fullUser: any = await firstValueFrom(
        this.usersService.getById(USER_ID),
      );

      // 🔹 2. BUILD FULL NAME
      const fullName = this.buildFullName(fullUser);
      console.log('👉 generado:', fullName);

      // 🔹 3. MERGE
      const payload: any = {
        ...fullUser,
        username: 'pjara',
        password: '12345678',
        full_name: fullName,
      };

      // 🔹 limpiar campos innecesarios
      delete payload.createdAt;
      delete payload.updatedAt;

      // 🔹 4. UPDATE
      await firstValueFrom(this.usersService.updateUser(USER_ID, payload));

      // 🔹 5. ROLES
      await this.syncRoles(USER_ID, [2]);

      // 🔥 6. VALIDACIÓN BACKEND (AQUÍ EL FIX DE TS)
      const updated: any = await firstValueFrom(
        this.usersService.getById(USER_ID),
      );

      console.log('🔥 backend devuelve:', updated.full_name);

      console.log('✅ Usuario 228 listo (full_name incluido)');
    } catch (err) {
      console.error('❌ Error en fixUser228:', err);
    }
  }

  private buildFullName(user: any): string {
    const parts = [
      user.firstName,
      user.secondName,
      user.firstLastName,
      user.secondLastName,
    ];

    return parts
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map((v) => v.toString().trim())
      .filter((v) => v !== '')
      .join(' ');
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

  isUsernameValid(u: User): boolean {
    if (!u.username) return false;

    const expected = this.generateUsername(u);

    return u.username === expected;
  }

  // =========================
  // 🔎 DETECTAR USERNAME TIPO RUT
  // =========================
  isRutUsername(u: User): boolean {
    if (!u.username) return false;

    // solo números → probablemente RUT sin DV
    if (/^\d+$/.test(u.username)) return true;

    // formato con guión tipo 12345678-9
    if (/^\d{7,8}-[\dkK]$/.test(u.username)) return true;

    return false;
  }

  generateUniqueUsername(base: string, existing: Set<string>): string {
    let username = base;
    let i = 1;

    while (existing.has(username)) {
      username = `${base}${i}`;
      i++;
    }

    existing.add(username);
    return username;
  }

  async backupUsers() {
    const backup = await firstValueFrom(this.usersService.getAll());
    console.log('🛟 BACKUP USERS:', backup);
  }
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Component, ViewChild, ElementRef } from '@angular/core';

// ====================================================================================
// 🔥 USERS SERVICE
// ====================================================================================

import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { firstValueFrom } from 'rxjs';

// ====================================================================================
// 🔥 IMPORTADOR MASIVO AFILIADOS (PREVIEW EN MEMORIA)
// ====================================================================================
// OBJETIVO:
// - Leer TXT separado por ;
// - Parsear filas
// - Validar RUT
// - Generar username
// - Generar password
// - Generar payload preview
// - Mostrar resultados en consola
//
// ⚠️ IMPORTANTE
// POR AHORA:
// ❌ NO guarda en BD
// ❌ NO crea users
// ❌ NO crea affiliateds
// ❌ NO asigna roles
//
// SOLO:
// ✅ parse
// ✅ normalización
// ✅ preview/debug
//
// ====================================================================================
// 🔥 TODO FUTURO
// ====================================================================================
//
// ESTABLECIMIENTOS
// 1201 = ?
// 1202 = ?
// 1206 = ?
// 1216 = ?
// 1217 = ?
// SIN ESTABLECIMIENTO
//
// SEXO
// M = Masculino
// F = Femenino
//
// TODO:
// cuando existan tablas catálogo:
// - establishmentId
// - sexId
//
// ====================================================================================

type ImportRow = {
  RUT: string;
  TIPO_AFILIADO: string;
  NOMBRE: string;

  FIRST_LAST_NAME: string;
  SECOND_LAST_NAME: string;

  FIRST_NAME: string;
  SECOND_NAME: string;

  TELEFONO: string;
  MAIL: string;

  SEXO: string;

  DIRECCION: string;

  FECHA_AFILIACION: string;
  FECHA_NACIMIENTO: string;
};

type ImportPreview = {
  valid: boolean;

  errors: string[];

  warnings: string[];

  actionType: string;

  roleId: number;

  rutOriginal: string;

  rutClean: string;

  username: string;

  password: string;

  payloadUser: any;

  payloadAffiliated: any;
};

@Component({
  standalone: true,
  selector: 'app-affiliated-import',
  templateUrl: './affiliated-import.component.html',
  styleUrls: ['./affiliated-import.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressBarModule,
    MatDialogModule,
    MatIconModule,
  ],
})
export class AffiliatedImportComponent {
  constructor(private usersService: UsersService) {}

  // ====================================================================================
  // 🔥 CONSTANTES
  // ====================================================================================

  // TODO:
  // validar ID real en BD
  private readonly ADMINISTRATIVO_ROLE_ID = 4;
  private readonly PASIVO_ROLE_ID = 5;

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  selectedFileName = '';
  allUsers: any[] = [];
  loading = false;
  txtContent = '';
  results: ImportPreview[] = [];
  summary: any = null;

  // ====================================================================================
  // 🔥 MAIN
  // ====================================================================================

  async processTxt(): Promise<void> {
    this.loading = true;

    try {
      // 🔥 RESET DUPLICADOS
      this.resetRutMap();

      this.allUsers = await firstValueFrom(this.usersService.getAll());

      console.log('👥 USERS CARGADOS:', this.allUsers.length);

      const txt = this.txtContent;

      const lines = txt
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => !!l);

      if (lines.length <= 1) {
        console.warn('⚠️ TXT vacío');
        return;
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';

      const header = lines[0].split(delimiter).map((h) => h.trim());

      console.log('🧾 HEADER:', header);

      const dataLines = lines.slice(1);

      const results: ImportPreview[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];

        const values = line.split(delimiter).map((v) => v.trim());

        const row = this.buildRow(header, values);

        const preview = await this.buildPreview(row, i + 2);

        results.push(preview);
      }

      this.results = results;

      this.summary = {
        total: results.length,

        valid: results.filter((r) => r.valid).length,

        errors: results.filter((r) => r.errors.length > 0).length,

        warnings: results.filter((r) => r.warnings.length > 0).length,
      };
    } finally {
      this.loading = false;
    }
  }

  // ====================================================================================
  // 🔥 BUILD ROW
  // ====================================================================================

  private buildRow(header: string[], values: string[]): ImportRow {
    const obj: any = {};

    header.forEach((h, idx) => {
      obj[h] = values[idx] ?? '';
    });

    return obj as ImportRow;
  }

  // ====================================================================================
  // 🔥 HELPERS
  // ====================================================================================

  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildFullName(row: ImportRow): string {
    return [
      row.FIRST_NAME,
      row.SECOND_NAME,
      row.FIRST_LAST_NAME,
      row.SECOND_LAST_NAME,
    ]
      .filter((v) => !!v)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateUsername(firstName: string, firstLastName: string): string {
    const name = this.normalizeText(firstName).split(' ')[0].toLowerCase();

    const last = this.normalizeText(firstLastName).toLowerCase();

    if (!name || !last) {
      return 'tempuser';
    }

    return `${name.charAt(0)}${last}`;
  }

  // ====================================================================================
  // 🔥 PASSWORD
  // EJEMPLO:
  // 11799136-9 + Patricio
  // =>
  // 11799136P
  // ====================================================================================

  private generatePassword(rut: string, firstName: string): string {
    const clean = rut.replace(/\./g, '').trim();

    const rutBase = clean.split('-')[0];

    const initial = (firstName || '').trim().charAt(0).toUpperCase();

    return `${rutBase}${initial}`;
  }

  // ====================================================================================
  // 🔥 CLEAN RUT
  // ====================================================================================

  private cleanRut(rut: string): string {
    return rut.replace(/\./g, '').replace('-', '').trim();
  }

  // ====================================================================================
  // 🔥 VALIDATE RUT
  // ====================================================================================

  private validateRut(rut: string): boolean {
    if (!rut) return false;

    const clean = rut.replace(/\./g, '').replace('-', '').trim();

    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);

    const dv = clean.slice(-1).toUpperCase();

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += Number(body.charAt(i)) * multiplier;

      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expected = 11 - (sum % 11);

    let expectedDv = '';

    if (expected === 11) {
      expectedDv = '0';
    } else if (expected === 10) {
      expectedDv = 'K';
    } else {
      expectedDv = expected.toString();
    }

    return dv === expectedDv;
  }

  clearAll(): void {
    this.txtContent = '';

    this.results = [];

    this.summary = null;

    this.selectedFileName = '';

    // 🔥 LIMPIAR INPUT FILE
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    console.clear();

    console.log('🧹 Importador limpiado');
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    this.selectedFileName = file.name;

    const reader = new FileReader();

    reader.onload = () => {
      this.txtContent = reader.result as string;

      console.log('📄 TXT cargado');
    };

    reader.onerror = () => {
      console.error('❌ Error leyendo archivo');
    };

    reader.readAsText(file, 'UTF-8');
  }

  // ====================================================================================
  // 🔥 VALIDAR SI EXISTE RUT
  // ====================================================================================

  async existeRutLocal(rut: string): Promise<boolean> {
    try {
      const users = await firstValueFrom(this.usersService.getAll());

      const normalizado = this.normalizarRut(rut);

      return users.some((u: any) => this.normalizarRut(u.rut) === normalizado);
    } catch (err) {
      console.error('❌ Error validando RUT', err);

      return false;
    }
  }

  // ====================================================================================
  // 🔥 NORMALIZAR RUT
  // ====================================================================================

  normalizarRut(rut: string): string {
    return (rut || '')
      .replace(/\./g, '')
      .replace(/-/g, '')
      .toUpperCase()
      .trim();
  }

  // ====================================================================================
  // 🔥 VALIDAR USER EXISTENTE
  // ====================================================================================

  async validateUserExists(rut: string): Promise<{
    exists: boolean;
    user: any | null;
  }> {
    try {
      const normalizado = this.normalizarRut(rut);

      // 🔥 BUSCAR EN CACHE LOCAL
      const found = this.allUsers.find(
        (u: any) => this.normalizarRut(u.rut) === normalizado,
      );

      return {
        exists: !!found,
        user: found || null,
      };
    } catch (err) {
      console.error('❌ Error buscando usuario', err);

      return {
        exists: false,
        user: null,
      };
    }
  }

  // ====================================================================================
  // 🔥 VALIDAR SI TIENE ROL
  // ====================================================================================

  async userHasRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const roles: any[] = await firstValueFrom(
        this.usersService.getUserRoles(userId),
      );

      return roles
        .filter((r) => !r.deletedAt)
        .some((r) => r.role?.id === roleId);
    } catch (err) {
      console.error('❌ Error validando roles', err);

      return false;
    }
  }

  // ====================================================================================
  // 🔥 SIMULAR ASIGNACIÓN ROL
  // ====================================================================================

  async simulateRoleAssign(userId: number): Promise<void> {
    const hasRole = await this.userHasRole(userId, this.ADMINISTRATIVO_ROLE_ID);

    if (hasRole) {
      console.log('✅ Usuario ya posee rol ADMINISTRATIVO');

      return;
    }

    // ====================================================================================
    // 🔥 PREVIEW
    // ====================================================================================

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('🔐 READY TO ASSIGN ROLE ADMINISTRATIVO');

    console.log({
      userId,
      roleId: this.ADMINISTRATIVO_ROLE_ID,
    });

    // ====================================================================================
    // 🔥 REAL
    // ====================================================================================

    await firstValueFrom(
      this.usersService.addUserRole(userId, this.ADMINISTRATIVO_ROLE_ID),
    );
  }

  // ====================================================================================
  // 🔥 BUILD PREVIEW
  // ====================================================================================

  private async buildPreview(
    row: ImportRow,
    line: number,
  ): Promise<ImportPreview> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ====================================================================================
    // 🔥 RUT
    // ====================================================================================

    const rutOriginal = row.RUT?.trim() || '';

    const tipoAfiliado = (row.TIPO_AFILIADO || '').trim().toUpperCase();

    const isPasivo = tipoAfiliado === 'PASIVO';

    const roleId = isPasivo ? this.PASIVO_ROLE_ID : this.ADMINISTRATIVO_ROLE_ID;

    if (!rutOriginal) {
      errors.push('RUT vacío');
    }

    const duplicateRut = this.validateDuplicateRut(rutOriginal);

    if (duplicateRut) {
      errors.push('RUT duplicado dentro archivo');
    }

    const rutClean = this.cleanRut(rutOriginal);
    const rutValid = this.validateRut(rutOriginal);

    if (!rutValid) {
      errors.push('RUT inválido');
    }

    // ====================================================================================
    // 🔥 VALIDAR USER EXISTENTE
    // ====================================================================================

    let existingUser: any = null;

    if (rutValid && !isPasivo) {
      const existsUser = await this.validateUserExists(rutOriginal);

      if (existsUser.exists) {
        existingUser = existsUser.user;

        warnings.push('Usuario ya existe');

        console.log('👤 USER EXISTS:', existingUser);

        if (existingUser?.id) {
          await this.simulateRoleAssign(existingUser.id);
        }
      }
    }

    // ====================================================================================
    // 🔥 NOMBRES
    // ====================================================================================

    if (!row.FIRST_NAME?.trim()) {
      errors.push('FIRST_NAME vacío');
    }

    if (!row.FIRST_LAST_NAME?.trim()) {
      errors.push('FIRST_LAST_NAME vacío');
    }

    // ====================================================================================
    // 🔥 EMAIL
    // ====================================================================================

    const email = (row.MAIL || '').trim().toLowerCase();

    if (!email) {
      warnings.push('MAIL vacío');
    }

    // ====================================================================================
    // 🔥 TELEFONO
    // ====================================================================================

    if (!row.TELEFONO?.trim()) {
      warnings.push('TELEFONO vacío');
    }

    // ====================================================================================
    // 🔥 PASSWORD
    // ====================================================================================

    const password = this.generatePassword(rutOriginal, row.FIRST_NAME || '');

    // ====================================================================================
    // 🔥 USERNAME
    // ====================================================================================

    const username = this.generateUsername(row.FIRST_NAME, row.FIRST_LAST_NAME);

    // ====================================================================================
    // 🔥 FULL NAME
    // ====================================================================================

    const full_name = this.buildFullName(row);

    // ====================================================================================
    // 🔥 PAYLOAD USER
    // ====================================================================================

    const payloadUser = {
      firstName: row.FIRST_NAME || null,

      secondName: row.SECOND_NAME || null,

      firstLastName: row.FIRST_LAST_NAME || null,

      secondLastName: row.SECOND_LAST_NAME || null,

      full_name,

      email,

      username,

      password,

      rut: rutOriginal,
    };

    // ====================================================================================
    // 🔥 PAYLOAD AFFILIATED
    // ====================================================================================

    const payloadAffiliated = {
      tipoAfiliado: row.TIPO_AFILIADO || null,

      telefono: row.TELEFONO || null,

      direccion: row.DIRECCION || null,

      sexo: row.SEXO || null,

      fechaAfiliacion: row.FECHA_AFILIACION || null,

      fechaNacimiento: row.FECHA_NACIMIENTO || null,
    };

    // ====================================================================================
    // 🔥 ACTION TYPE
    // ====================================================================================

    let actionType = 'CREATE_USER';

    if (existingUser) {
      actionType = 'USER_EXISTS';
    }
    // ====================================================================================
    // 🔥 RESULT
    // ====================================================================================

    const valid = errors.length === 0;

    if (this.DEBUG || !valid) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log(`📄 LINEA ${line}`);

      if (valid) {
        console.log('✅ VÁLIDO');
      } else {
        console.log('❌ INVÁLIDO');
      }

      console.log('👤 USER:', payloadUser);

      console.log('🏢 AFFILIATED:', payloadAffiliated);

      if (errors.length) {
        console.log('❌ ERRORES:', errors);
      }

      if (warnings.length) {
        console.log('⚠️ WARNINGS:', warnings);
      }
    }

    return {
      valid,

      errors,

      warnings,

      actionType,

      rutOriginal,

      rutClean,

      username,

      password,

      payloadUser,

      payloadAffiliated,

      roleId,
    };
  }

  // ====================================================================================
  // 🔥 DEBUG
  // ====================================================================================

  private readonly DEBUG = false;

  // ====================================================================================
  // 🔥 DUPLICADOS TXT
  // ====================================================================================

  private rutMap = new Map<string, number>();

  // ====================================================================================
  // 🔥 RESET DUPLICADOS
  // ====================================================================================

  resetRutMap(): void {
    this.rutMap.clear();
  }

  // ====================================================================================
  // 🔥 VALIDAR DUPLICADO TXT
  // ====================================================================================

  validateDuplicateRut(rut: string): boolean {
    const clean = this.normalizarRut(rut);

    if (this.rutMap.has(clean)) {
      const count = this.rutMap.get(clean) || 0;

      this.rutMap.set(clean, count + 1);

      return true;
    }

    this.rutMap.set(clean, 1);

    return false;
  }

  async importAll(): Promise<void> {
    if (!this.results?.length) {
      console.warn('⚠️ No existen resultados para importar');

      return;
    }

    this.loading = true;

    let created = 0;

    let skipped = 0;

    let failed = 0;

    try {
      for (const item of this.results) {
        try {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          console.log('🚀 PROCESANDO:', item.rutOriginal);

          // =====================================================
          // 🔥 INVÁLIDOS
          // =====================================================

          if (!item.valid) {
            skipped++;

            console.warn('⛔ Registro inválido');

            continue;
          }

          // =====================================================
          // 🔥 USER EXISTE
          // =====================================================

          if (item.actionType === 'USER_EXISTS') {
            skipped++;

            console.warn('♻️ Usuario ya existe');

            continue;
          }

          // =====================================================
          // 🔥 CREAR USER
          // =====================================================

          console.log('👤 CREANDO USER');

          const createdUser: any = await firstValueFrom(
            this.usersService.createUser(item.payloadUser),
          );

          console.log('✅ USER CREADO:', createdUser);

          // =====================================================
          // 🔥 VALIDAR ID
          // =====================================================

          if (!createdUser?.id) {
            throw new Error('Usuario creado sin ID');
          }

          // =====================================================
          // 🔥 ASIGNAR ROL
          // =====================================================

          console.log('🔐 ASIGNANDO ROL');

          await firstValueFrom(
            this.usersService.addUserRole(
              createdUser.id,
              item.roleId,
            ),
          );

          console.log('✅ ROL ASIGNADO');

          created++;
        } catch (err) {
          failed++;

          console.error('❌ ERROR IMPORTANDO', err);
        }
      }

      // =====================================================
      // 🔥 RESUMEN
      // =====================================================

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('🎯 IMPORTACIÓN FINALIZADA');

      console.table({
        creados: created,
        omitidos: skipped,
        errores: failed,
      });
    } finally {
      this.loading = false;
    }
  }
}

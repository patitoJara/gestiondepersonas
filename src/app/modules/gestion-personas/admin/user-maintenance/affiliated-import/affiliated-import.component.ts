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

  private readonly ADMIN_ROLE_ID = 1;
  private readonly ADMINISTRATIVO_ROLE_ID = 2;
  private readonly SUPERVISOR_ROLE_ID = 3;
  private readonly JEFATURA_ROLE_ID = 4;
  private readonly SIN_PERFIL_ASIGNADO_ROLE_ID = 5;

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

      const users = await firstValueFrom(this.usersService.getAll());

      this.allUsers = users.filter((u: any) => !u.deletedAt);

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

  cleanRut(rut?: string | null): string {
    if (!rut) {
      return '';
    }

    return rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
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

  private usernameIsRut(
    username?: string | null,
    rut?: string | null,
  ): boolean {
    const cleanUsername = String(username || '')
      .replace(/\./g, '')
      .replace(/-/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();

    const cleanRut = this.cleanRut(rut);

    // 🔥 Quitar último carácter: dígito verificador
    const rutWithoutDv = cleanRut.slice(0, -1);

    return !!cleanUsername && cleanUsername === rutWithoutDv;
  }

  // ====================================================================================
  // 🔥 VALIDAR SI EXISTE RUT
  // ====================================================================================

  async existeRutLocal(rut: string): Promise<boolean> {
    try {
      const normalizado = this.normalizarRut(rut);

      return this.allUsers.some(
        (u: any) => !u.deletedAt && this.normalizarRut(u.rut) === normalizado,
      );
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

    // 🔥 Importación normal:
    // los usuarios nuevos reciben el perfil ADMINISTRATIVO.
    // El perfil 5 "SIN PERFIL ASIGNADO" se aplica solamente
    // mediante el proceso especial cuando no existe fecha de contrato.
    const roleId = this.ADMINISTRATIVO_ROLE_ID;

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

    if (rutValid) {
      const existsUser = await this.validateUserExists(rutOriginal);

      if (existsUser.exists) {
        existingUser = existsUser.user;

        warnings.push('Usuario ya existe');

        console.log('👤 USER EXISTS:', existingUser);
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
    /*
    if (!row.TELEFONO?.trim()) {
      warnings.push('TELEFONO vacío');
    }
      */

    // ====================================================================================
    // 🔥 PASSWORD
    // ====================================================================================

    //const password = this.generatePassword(rutOriginal, row.FIRST_NAME || '');

    const password = '123456';
    // ====================================================================================
    // 🔥 USERNAME
    // ====================================================================================

    const baseUsername = this.generateUsername(
      row.FIRST_NAME,
      row.FIRST_LAST_NAME,
    );

    const username = this.generateUniqueUsername(baseUsername);

    if (!existingUser) {
      this.allUsers.push({
        username,
      });
    }
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

      birth_date: row.FECHA_NACIMIENTO || null,

      contract_date: row.FECHA_AFILIACION || null,

      contract_type: 'CONTRATA',
    };

    // ====================================================================================
    // 🔥 PAYLOAD AFFILIATED
    // ====================================================================================

    const payloadAffiliated = {
      tipoAfiliado: row.TIPO_AFILIADO || null,

      //telefono: row.TELEFONO || null,

      //direccion: row.DIRECCION || null,

      //sexo: row.SEXO || null,
      fechaAfiliacion: row.FECHA_AFILIACION || null,

      fechaNacimiento: row.FECHA_NACIMIENTO || null,
    };

    // ====================================================================================
    // 🔥 ACTION TYPE
    // ====================================================================================

    let actionType = 'CREATE_USER';

    if (existingUser) {
      actionType = 'USER_EXISTS';

      console.log('👤 USER EXISTS:', existingUser);
    } else {
      console.log('🆕 USER NEW:', rutOriginal);
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

  // ====================================================================================
  // 🔥 PROCESS IMPORT REAL
  // ====================================================================================

  async processImport(): Promise<void> {
    if (!this.results.length) {
      console.warn('⚠️ No existen registros para importar');
      return;
    }

    this.loading = true;

    // =====================================================
    // 🔥 MÉTRICAS
    // =====================================================

    let created = 0;
    let updated = 0;
    let invalid = 0;
    let roleAssigned = 0;
    let errors = 0;

    try {
      for (const item of this.results) {
        try {
          // =====================================================
          // 🔥 INVALIDOS
          // =====================================================

          if (!item.valid) {
            console.warn('❌ Registro inválido:', item);

            invalid++;

            continue;
          }

          // =====================================================
          // 🔥 USER YA EXISTE
          // =====================================================

          if (item.actionType === 'USER_EXISTS') {
            const existingUser = await this.validateUserExists(
              item.rutOriginal,
            );

            if (existingUser?.user?.id) {
              await this.updateUserIfNeeded(existingUser.user, item);

              updated++;
            }

            continue;
          }

          // =====================================================
          // 🔥 CREATE USER
          // =====================================================

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          console.log('🚀 CREATING USER');

          console.log(item.payloadUser);

          const createdUser: any = await firstValueFrom(
            this.usersService.createUser(item.payloadUser),
          );

          console.log('✅ USER CREATED:', createdUser);

          created++;

          // =====================================================
          // 🔥 AGREGAR A CACHE LOCAL
          // =====================================================

          this.allUsers.push(createdUser);

          // =====================================================
          // 🔥 ASSIGN ROLE
          // =====================================================

          if (createdUser?.id) {
            await this.assignRoleIfNeeded(createdUser.id, item.roleId);

            roleAssigned++;
          }
        } catch (error) {
          errors++;

          console.error('❌ ERROR ITEM:', {
            rut: item.rutOriginal,
            username: item.username,
            error,
          });
        }
      }

      // =====================================================
      // 🔥 RESUMEN FINAL
      // =====================================================

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('✅ IMPORT FINALIZADO');

      console.table({
        totalTXT: this.results.length,
        created,
        updated,
        invalid,
        roleAssigned,
        errors,
      });
    } finally {
      this.loading = false;
    }
  }

  // ====================================================================================
  // 🔥 ASSIGN ROLE IF NEEDED
  // ====================================================================================

  async assignRoleIfNeeded(userId: number, roleId: number): Promise<void> {
    try {
      const hasRole = await this.userHasRole(userId, roleId);

      if (hasRole) {
        console.log('✅ Usuario ya posee rol');

        return;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('🔐 ASSIGNING ROLE');

      console.log({
        userId,
        roleId,
      });

      await firstValueFrom(this.usersService.addUserRole(userId, roleId));

      console.log('✅ ROLE ASSIGNED');
    } catch (error) {
      console.error('❌ ERROR ASSIGN ROLE:', error);
    }
  }

  // ====================================================================================
  // 🔥 VALIDATE USER EXISTS
  // ====================================================================================

  async validateUserExists(rut: string): Promise<any> {
    try {
      const cleanRut = this.cleanRut(rut);

      // =====================================================
      // 🔥 RUT INVALIDO
      // =====================================================

      if (!cleanRut) {
        return {
          exists: false,
          user: null,
        };
      }

      // =====================================================
      // 🔥 BUSCAR USER
      // =====================================================

      const user = this.allUsers.find(
        (u: any) => !u.deletedAt && this.cleanRut(u.rut) === cleanRut,
      );

      return {
        exists: !!user,
        user: user || null,
      };
    } catch (error) {
      console.error('❌ ERROR VALIDANDO USER:', error);

      return {
        exists: false,
        user: null,
      };
    }
  }

  // ====================================================================================
  // 🔥 USER HAS ROLE
  // ====================================================================================

  async userHasRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const roles: any[] = await firstValueFrom(
        this.usersService.getUserRoles(userId),
      );

      return roles.some(
        (r: any) => this.isActiveUserRole(r) && this.getRoleId(r) === roleId,
      );
    } catch (error) {
      console.error('❌ ERROR VALIDANDO ROLE:', error);

      return false;
    }
  }

  // ====================================================================================
  // 🔥 UPDATE USER IF NEEDED
  // ====================================================================================

  async updateUserIfNeeded(
    existingUser: any,
    item: ImportPreview,
  ): Promise<void> {
    try {
      // =====================================================
      // 🔥 GET FULL USER
      // =====================================================

      const fullUser: any = await firstValueFrom(
        this.usersService.getById(existingUser.id),
      );

      // =====================================================
      // 🔥 CONSERVAR DATOS ACTUALES
      // =====================================================

      const payload: any = {
        ...fullUser,
      };

      let mustUpdateUser = false;

      // =====================================================
      // 🔥 NOMBRES
      // COMPLETAR SOLAMENTE SI ESTÁN VACÍOS
      // =====================================================

      if (!fullUser.firstName && item.payloadUser.firstName) {
        payload.firstName = item.payloadUser.firstName;
        mustUpdateUser = true;
      }

      if (!fullUser.secondName && item.payloadUser.secondName) {
        payload.secondName = item.payloadUser.secondName;
        mustUpdateUser = true;
      }

      if (!fullUser.firstLastName && item.payloadUser.firstLastName) {
        payload.firstLastName = item.payloadUser.firstLastName;
        mustUpdateUser = true;
      }

      if (!fullUser.secondLastName && item.payloadUser.secondLastName) {
        payload.secondLastName = item.payloadUser.secondLastName;
        mustUpdateUser = true;
      }

      if (!fullUser.full_name && item.payloadUser.full_name) {
        payload.full_name = item.payloadUser.full_name;
        mustUpdateUser = true;
      }

      // =====================================================
      // 🔥 EMAIL
      // COMPLETAR SOLAMENTE SI ESTÁ VACÍO
      // =====================================================

      if (!fullUser.email && item.payloadUser.email) {
        payload.email = item.payloadUser.email;
        mustUpdateUser = true;
      }

      // =====================================================
      // 🔥 USERNAME
      // COMPLETAR SOLAMENTE SI ESTÁ VACÍO
      // La reparación de usernames iguales al RUT
      // se ejecuta mediante un proceso independiente.
      // =====================================================

      if (!fullUser.username && item.username) {
        payload.username = item.username;
        mustUpdateUser = true;
      }

      // =====================================================
      // 🔥 FECHAS
      // COMPLETAR SOLAMENTE SI ESTÁN VACÍAS
      // =====================================================

      if (!fullUser.birth_date && item.payloadUser.birth_date) {
        payload.birth_date = item.payloadUser.birth_date;
        mustUpdateUser = true;
      }

      if (!fullUser.contract_date && item.payloadUser.contract_date) {
        payload.contract_date = item.payloadUser.contract_date;
        mustUpdateUser = true;
      }

      if (!fullUser.contract_type && item.payloadUser.contract_type) {
        payload.contract_type = item.payloadUser.contract_type;
        mustUpdateUser = true;
      }

      // =====================================================
      // 🔒 NUNCA MODIFICAR DATOS SENSIBLES NI RELACIONES
      // =====================================================

      delete payload.password;
      delete payload.roles;

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.deletedAt;

      // =====================================================
      // 🔥 NO HACER PUT SI NO EXISTEN CAMBIOS
      // =====================================================

      if (!mustUpdateUser) {
        console.log('✅ USER EXISTENTE SIN CAMBIOS:', {
          id: fullUser.id,
          rut: fullUser.rut,
        });

        return;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 COMPLETANDO DATOS FALTANTES DEL USER');
      console.log(payload);

      await firstValueFrom(
        this.usersService.updateUser(existingUser.id, payload),
      );

      console.log('✅ USER UPDATED');

      // 🔒 No modificar perfiles de usuarios existentes.
      // La asignación automática se mantiene solamente para usuarios nuevos.
    } catch (error) {
      console.error('❌ ERROR UPDATE USER:', error);
    }
  }

  generateUniqueUsername(base: string): string {
    let username = base;

    let counter = 1;

    while (
      this.allUsers.some(
        (u: any) => u.username?.toLowerCase() === username.toLowerCase(),
      )
    ) {
      username = `${base}${counter}`;

      counter++;
    }

    return username;
  }

  // ====================================================================================
  // 🔥 ACTUALIZAR SOLAMENTE FECHAS FALTANTES
  // ====================================================================================
  // ✅ Completa birth_date solo si está vacío en BD.
  // ✅ Completa contract_date solo si está vacío en BD.
  // ✅ No sobrescribe datos corregidos manualmente.
  // ✅ No modifica RUT, password, roles ni otros datos.
  // ====================================================================================

  async processOnlyDatesUpdate(): Promise<void> {
    console.log('🔥 CLICK ACTUALIZAR SOLO FECHAS FALTANTES');

    if (!this.results.length) {
      console.warn('⚠️ Primero debes procesar el TXT');
      return;
    }

    this.loading = true;

    let updated = 0;
    let unchanged = 0;
    let skipped = 0;
    let invalid = 0;
    let errors = 0;

    try {
      for (const item of this.results) {
        try {
          if (!item.valid) {
            invalid++;

            console.warn('❌ Registro inválido:', item.rutOriginal);

            continue;
          }

          const existsUser = await this.validateUserExists(item.rutOriginal);

          if (!existsUser?.exists || !existsUser?.user?.id) {
            skipped++;

            console.warn('⚠️ Usuario no existe, se omite:', item.rutOriginal);

            continue;
          }

          const fullUser: any = await firstValueFrom(
            this.usersService.getById(existsUser.user.id),
          );

          const payload: any = {
            ...fullUser,
          };

          let mustUpdateUser = false;

          // ✅ Completar solamente fecha de nacimiento faltante
          if (!fullUser.birth_date && item.payloadUser.birth_date) {
            payload.birth_date = item.payloadUser.birth_date;

            mustUpdateUser = true;
          }

          // ✅ Completar solamente fecha de contrato faltante
          if (!fullUser.contract_date && item.payloadUser.contract_date) {
            payload.contract_date = item.payloadUser.contract_date;

            mustUpdateUser = true;
          }

          // 🔒 No enviar datos sensibles ni relaciones
          delete payload.password;
          delete payload.roles;

          delete payload.createdAt;
          delete payload.updatedAt;
          delete payload.deletedAt;

          if (!mustUpdateUser) {
            unchanged++;

            console.log('✅ SIN CAMBIOS:', {
              id: fullUser.id,
              rut: fullUser.rut,
            });

            continue;
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          console.log('📅 COMPLETANDO FECHAS FALTANTES');

          console.log({
            id: fullUser.id,
            rut: fullUser.rut,
            birth_date_anterior: fullUser.birth_date,
            birth_date_nueva: payload.birth_date,
            contract_date_anterior: fullUser.contract_date,
            contract_date_nueva: payload.contract_date,
          });

          await firstValueFrom(
            this.usersService.updateUser(fullUser.id, payload),
          );

          updated++;
        } catch (error) {
          errors++;

          console.error('❌ ERROR ACTUALIZANDO FECHAS:', {
            rut: item.rutOriginal,
            error,
          });
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('✅ ACTUALIZACIÓN SOLO FECHAS FINALIZADA');

      console.table({
        totalTXT: this.results.length,
        updated,
        unchanged,
        skipped,
        invalid,
        errors,
      });
    } finally {
      this.loading = false;
    }
  }

  // ====================================================================================
  // 🔥 ACTUALIZAR SOLAMENTE FECHAS FALTANTES
  // 🔥 Y CONVERTIR EN NO FUNCIONARIO CUANDO EL TXT NO TRAE CONTRATO
  // ====================================================================================
  // ✅ No modifica nombres
  // ✅ No modifica email
  // ✅ No modifica username
  // ✅ No modifica RUT
  // ✅ No modifica password
  // ✅ No modifica otros datos
  //
  // REGLAS:
  // 1. birth_date:
  //    completar solamente si está vacío en BD y viene informado en TXT.
  //
  // 2. contract_date:
  //    completar solamente si está vacío en BD y viene informado en TXT.
  //
  // 3. SIN FECHA DE CONTRATO EN TXT:
  //    forzar contract_date = null.
  //    forzar contract_type = 'SIN PERFIL ASIGNADO'.
  //    eliminar roles anteriores.
  //    dejar únicamente rol 5.
  // ====================================================================================

  async processDatesAndUnassignedProfileUpdate(): Promise<void> {
    console.log('🔥 CLICK ACTUALIZAR FECHAS Y PERFILES PENDIENTES');

    if (!this.results.length) {
      console.warn('⚠️ Primero debes procesar el TXT');
      return;
    }

    this.loading = true;

    let updated = 0;
    let unchanged = 0;
    let roleReplaced = 0;
    let skipped = 0;
    let invalid = 0;
    let errors = 0;

    try {
      for (const item of this.results) {
        try {
          // =====================================================
          // 🔥 OMITIR REGISTROS INVÁLIDOS
          // =====================================================

          if (!item.valid) {
            invalid++;

            console.warn('❌ Registro inválido:', item.rutOriginal);

            continue;
          }

          // =====================================================
          // 🔥 BUSCAR USUARIO EXISTENTE
          // =====================================================

          const existsUser = await this.validateUserExists(item.rutOriginal);

          if (!existsUser?.exists || !existsUser?.user?.id) {
            skipped++;

            console.warn('⚠️ Usuario no existe, se omite:', item.rutOriginal);

            continue;
          }

          const fullUser: any = await firstValueFrom(
            this.usersService.getById(existsUser.user.id),
          );

          // =====================================================
          // 🔥 CONSERVAR TODOS LOS DATOS ACTUALES
          // =====================================================

          const payload: any = {
            ...fullUser,
          };

          let mustUpdateUser = false;

          // =====================================================
          // 🔥 FECHA DE NACIMIENTO
          // Completar solamente cuando no existe en BD.
          // =====================================================

          if (!fullUser.birth_date && item.payloadUser.birth_date) {
            payload.birth_date = item.payloadUser.birth_date;

            mustUpdateUser = true;
          }

          // =====================================================
          // 🔥 FECHA DE CONTRATO
          // =====================================================

          const hasContractDateInTxt = !!String(
            item.payloadUser.contract_date || '',
          ).trim();

          if (hasContractDateInTxt) {
            // ✅ Completar solamente si actualmente no existe.
            // No sobrescribir fechas corregidas manualmente.
            if (!fullUser.contract_date) {
              payload.contract_date = item.payloadUser.contract_date;

              mustUpdateUser = true;
            }
          } else {
            // 🔥 REGLA OBLIGATORIA:
            // si el TXT no trae fecha de contrato:
            // - limpiar contract_date
            // - establecer contract_type = SIN RELACION
            // - luego dejar solamente el perfil 5

            if (
              fullUser.contract_date ||
              fullUser.contract_type !== 'SIN RELACION'
            ) {
              payload.contract_date = null;
              payload.contract_type = 'SIN RELACION';

              mustUpdateUser = true;
            }
          }

          // =====================================================
          // 🔥 LIMPIAR CAMPOS QUE JAMÁS DEBEN ENVIARSE
          // =====================================================

          delete payload.password;
          delete payload.roles;

          delete payload.createdAt;
          delete payload.updatedAt;
          delete payload.deletedAt;

          // =====================================================
          // 🔥 ACTUALIZAR USER SOLAMENTE SI CAMBIÓ ALGO
          // =====================================================

          if (mustUpdateUser) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            console.log('📅 ACTUALIZANDO DATOS PERMITIDOS');

            console.log({
              id: fullUser.id,
              rut: fullUser.rut,
              birth_date_anterior: fullUser.birth_date,
              birth_date_nueva: payload.birth_date,
              contract_date_anterior: fullUser.contract_date,
              contract_date_nueva: payload.contract_date,
              contract_type_anterior: fullUser.contract_type,
              contract_type_nuevo: payload.contract_type,
            });

            await firstValueFrom(
              this.usersService.updateUser(fullUser.id, payload),
            );

            updated++;
          } else {
            unchanged++;

            console.log('✅ SIN CAMBIOS EN USER:', {
              id: fullUser.id,
              rut: fullUser.rut,
            });
          }

          // =====================================================
          // 🔥 SIN CONTRATO EN TXT:
          // ELIMINAR ROLES ACTUALES Y DEJAR SOLAMENTE ROL 5
          // =====================================================

          if (!hasContractDateInTxt) {
            await this.replaceUserRolesWithSingleRole(
              fullUser.id,
              this.SIN_PERFIL_ASIGNADO_ROLE_ID,
            );

            roleReplaced++;
          }
        } catch (error) {
          errors++;

          console.error('❌ ERROR ACTUALIZANDO USUARIO:', {
            rut: item.rutOriginal,
            error,
          });
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('✅ PROCESO FINALIZADO');

      console.table({
        totalTXT: this.results.length,
        updated,
        unchanged,
        roleReplaced,
        skipped,
        invalid,
        errors,
      });
    } finally {
      this.loading = false;
    }
  }
  // ====================================================================================
  // 🔥 DEJAR UN ÚNICO PERFIL ACTIVO
  // ====================================================================================
  // ✅ Elimina perfiles anteriores distintos al solicitado.
  // ✅ Mantiene el perfil solicitado si ya existe.
  // ✅ Agrega el perfil solicitado cuando todavía no existe.
  // ====================================================================================

  async replaceUserRolesWithSingleRole(
    userId: number,
    roleId: number,
  ): Promise<void> {
    try {
      const currentRoles: any[] = await firstValueFrom(
        this.usersService.getUserRoles(userId),
      );

      const activeRoles = currentRoles.filter((userRole: any) =>
        this.isActiveUserRole(userRole),
      );

      for (const userRole of activeRoles) {
        const currentRoleId = this.getRoleId(userRole);

        if (!currentRoleId || currentRoleId === roleId) {
          continue;
        }

        console.log('🗑️ ELIMINANDO PERFIL ANTERIOR:', {
          userId,
          roleId: currentRoleId,
        });

        await firstValueFrom(
          this.usersService.deleteUserRole(userId, currentRoleId),
        );
      }

      await this.assignRoleIfNeeded(userId, roleId);

      console.log('✅ USUARIO QUEDÓ CON PERFIL ÚNICO:', {
        userId,
        roleId,
      });
    } catch (error) {
      console.error('❌ ERROR REEMPLAZANDO PERFILES:', {
        userId,
        roleId,
        error,
      });

      throw error;
    }
  }

  // ====================================================================================
  // 🔥 GENERAR USERNAME ÚNICO EXCLUYENDO AL USUARIO ACTUAL
  // ====================================================================================

  private generateUniqueUsernameExcludingUser(
    base: string,
    excludedUserId: number,
  ): string {
    let username = base;
    let counter = 1;

    while (
      this.allUsers.some(
        (u: any) =>
          u.id !== excludedUserId &&
          u.username?.toLowerCase() === username.toLowerCase(),
      )
    ) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }

  // ====================================================================================
  // 🔥 CORREGIR USERNAME CUANDO QUEDÓ COMO RUT SIN DÍGITO VERIFICADOR
  // ====================================================================================
  // ✅ Solo revisa usuarios incluidos en el TXT procesado.
  // ✅ Solo modifica username.
  // ✅ No modifica contraseña, perfiles, fechas ni otros datos.
  // ====================================================================================

  async processFixUsernameFromRut(): Promise<void> {
    console.log('🔥 CLICK CORREGIR USERNAME DESDE RUT');

    if (!this.results.length) {
      console.warn('⚠️ Primero debes procesar el TXT');
      return;
    }

    this.loading = true;

    let repaired = 0;
    let unchanged = 0;
    let skipped = 0;
    let invalid = 0;
    let errors = 0;

    try {
      for (const item of this.results) {
        try {
          if (!item.valid) {
            invalid++;
            continue;
          }

          const existsUser = await this.validateUserExists(item.rutOriginal);

          if (!existsUser?.exists || !existsUser?.user?.id) {
            skipped++;
            continue;
          }

          const fullUser: any = await firstValueFrom(
            this.usersService.getById(existsUser.user.id),
          );

          if (!this.usernameIsRut(fullUser.username, fullUser.rut)) {
            unchanged++;
            continue;
          }

          const firstName =
            fullUser.firstName || item.payloadUser.firstName || '';
          const firstLastName =
            fullUser.firstLastName || item.payloadUser.firstLastName || '';

          const baseUsername = this.generateUsername(firstName, firstLastName);

          const newUsername = this.generateUniqueUsernameExcludingUser(
            baseUsername,
            fullUser.id,
          );

          const payload: any = {
            ...fullUser,
            username: newUsername,
          };

          delete payload.password;
          delete payload.roles;
          delete payload.createdAt;
          delete payload.updatedAt;
          delete payload.deletedAt;

          console.log('👤 CORRIGIENDO USERNAME:', {
            id: fullUser.id,
            rut: fullUser.rut,
            username_anterior: fullUser.username,
            username_nuevo: newUsername,
          });

          await firstValueFrom(
            this.usersService.updateUser(fullUser.id, payload),
          );

          const cachedUser = this.allUsers.find(
            (u: any) => u.id === fullUser.id,
          );

          if (cachedUser) {
            cachedUser.username = newUsername;
          }

          repaired++;
        } catch (error) {
          errors++;

          console.error('❌ ERROR CORRIGIENDO USERNAME:', {
            rut: item.rutOriginal,
            error,
          });
        }
      }

      console.log('✅ REPARACIÓN DE USERNAMES FINALIZADA');

      console.table({
        totalTXT: this.results.length,
        repaired,
        unchanged,
        skipped,
        invalid,
        errors,
      });
    } finally {
      this.loading = false;
    }
  }

  // ====================================================================================
  // 🔥 OBTENER ID DEL PERFIL
  // Soporta distintas formas de respuesta del backend.
  // ====================================================================================

  private getRoleId(userRole: any): number {
    return Number(
      userRole?.role?.id || userRole?.roleId || userRole?.role_id || 0,
    );
  }

  // ====================================================================================
  // 🔥 VALIDAR SI PERFIL ESTÁ ACTIVO
  // ====================================================================================

  private isActiveUserRole(userRole: any): boolean {
    return !userRole?.deletedAt && !userRole?.deleted_at;
  }

  // ====================================================================================
  // 🔥 NORMALIZAR FECHA DE RELACIÓN USER-ROLE
  // Soporta:
  // 2026-05-19T15:12:35
  // 2026-05-19 15:12:35
  // ====================================================================================

  private normalizeUserRoleCreatedAt(userRole: any): string {
    return String(userRole?.createdAt || userRole?.created_at || '')
      .replace('T', ' ')
      .slice(0, 19);
  }

  // ====================================================================================
  // 🔥 DETECTAR JEFATURA CREADA DURANTE LOTES ACCIDENTALES
  // ====================================================================================

  private isAccidentalJefaturaRole(userRole: any): boolean {
    if (!this.isActiveUserRole(userRole)) {
      return false;
    }

    if (this.getRoleId(userRole) !== this.JEFATURA_ROLE_ID) {
      return false;
    }

    const createdAt = this.normalizeUserRoleCreatedAt(userRole);

    if (!createdAt) {
      return false;
    }

    const isFirstAccidentalBatch =
      createdAt >= '2026-05-16 19:51:00' && createdAt < '2026-05-16 20:00:00';

    const isSecondAccidentalBatch =
      createdAt >= '2026-05-19 15:12:00' && createdAt < '2026-05-19 15:24:00';

    return isFirstAccidentalBatch || isSecondAccidentalBatch;
  }

  // ====================================================================================
  // 🔥 REPARAR JEFATURAS ASIGNADAS ACCIDENTALMENTE
  // ====================================================================================
  // ✅ Recorre todos los usuarios activos.
  // ✅ Solo elimina rol 4 creado dentro de los lotes accidentales.
  // ✅ Asegura rol 2 - ADMINISTRATIVO.
  // ✅ Omite casos ambiguos para revisión manual.
  // ✅ No modifica datos personales.
  // ====================================================================================

  async processFixAccidentalJefaturas(): Promise<void> {
    this.loading = true;

    let checkedUsers = 0;
    let repairedUsers = 0;
    let administrativoAssigned = 0;
    let unchanged = 0;
    let manualReview = 0;
    let errors = 0;

    try {
      const users: any[] = await firstValueFrom(this.usersService.getAll());

      const activeUsers = users.filter((u: any) => !u.deletedAt);

      const candidates: any[] = [];

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👥 USUARIOS ACTIVOS A REVISAR:', activeUsers.length);

      // =====================================================
      // 🔥 PRIMERA PASADA:
      // DETECTAR CANDIDATOS SIN MODIFICAR BD
      // =====================================================

      for (const user of activeUsers) {
        try {
          checkedUsers++;

          const roles: any[] = await firstValueFrom(
            this.usersService.getUserRoles(user.id),
          );

          const activeJefaturas = roles.filter(
            (userRole: any) =>
              this.isActiveUserRole(userRole) &&
              this.getRoleId(userRole) === this.JEFATURA_ROLE_ID,
          );

          const accidentalJefaturas = activeJefaturas.filter((userRole: any) =>
            this.isAccidentalJefaturaRole(userRole),
          );

          if (!accidentalJefaturas.length) {
            unchanged++;

            continue;
          }

          const legitimateJefaturas = activeJefaturas.filter(
            (userRole: any) => !this.isAccidentalJefaturaRole(userRole),
          );

          // 🔒 No tocar automáticamente casos ambiguos
          if (legitimateJefaturas.length) {
            manualReview++;

            console.warn('⚠️ REVISIÓN MANUAL: JEFATURA LEGÍTIMA Y ACCIDENTAL', {
              userId: user.id,
              rut: user.rut,
              username: user.username,
              accidentales: accidentalJefaturas.map((r: any) =>
                this.normalizeUserRoleCreatedAt(r),
              ),
              legitimas: legitimateJefaturas.map((r: any) =>
                this.normalizeUserRoleCreatedAt(r),
              ),
            });

            continue;
          }

          candidates.push({
            user,
            accidentalJefaturas,
          });
        } catch (error) {
          errors++;

          console.error('❌ ERROR REVISANDO USUARIO:', {
            userId: user.id,
            rut: user.rut,
            error,
          });
        }
      }

      // =====================================================
      // 🔥 MOSTRAR CANDIDATOS ANTES DE MODIFICAR BD
      // =====================================================

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('🔍 CANDIDATOS A REPARACIÓN:', candidates.length);

      console.table(
        candidates.map(({ user, accidentalJefaturas }) => ({
          userId: user.id,
          rut: user.rut,
          username: user.username,
          jefaturasAccidentales: accidentalJefaturas.length,
          fechas: accidentalJefaturas
            .map((r: any) => this.normalizeUserRoleCreatedAt(r))
            .join(', '),
        })),
      );

      if (!candidates.length) {
        console.log('✅ NO EXISTEN JEFATURAS ACCIDENTALES PENDIENTES');

        console.table({
          checkedUsers,
          repairedUsers,
          administrativoAssigned,
          unchanged,
          manualReview,
          errors,
        });

        return;
      }

      const confirmed = window.confirm(
        `Se detectaron ${candidates.length} usuarios con jefaturas ` +
          'asignadas masivamente por error durante los lotes del 16 y ' +
          '19 de mayo de 2026. Se reemplazarán por el perfil ' +
          'ADMINISTRATIVO. ¿Desea continuar?',
      );

      if (!confirmed) {
        console.warn('⚠️ Reparación cancelada');

        return;
      }

      // =====================================================
      // 🔥 SEGUNDA PASADA:
      // APLICAR CORRECCIÓN SOLAMENTE A CANDIDATOS SEGUROS
      // =====================================================

      for (const { user } of candidates) {
        try {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          console.log('🔧 REPARANDO JEFATURA ACCIDENTAL:', {
            userId: user.id,
            rut: user.rut,
            username: user.username,
          });

          // El endpoint elimina por userId + roleId.
          // Ejecutar una sola vez por usuario.
          await firstValueFrom(
            this.usersService.deleteUserRole(user.id, this.JEFATURA_ROLE_ID),
          );

          const alreadyHasAdministrativo = await this.userHasRole(
            user.id,
            this.ADMINISTRATIVO_ROLE_ID,
          );

          if (!alreadyHasAdministrativo) {
            await this.assignRoleIfNeeded(user.id, this.ADMINISTRATIVO_ROLE_ID);

            administrativoAssigned++;
          }

          // 🔒 Verificación posterior
          const hasAdministrativoAfterUpdate = await this.userHasRole(
            user.id,
            this.ADMINISTRATIVO_ROLE_ID,
          );

          if (!hasAdministrativoAfterUpdate) {
            throw new Error('No fue posible asegurar el perfil ADMINISTRATIVO');
          }

          repairedUsers++;

          console.log('✅ PERFIL REPARADO:', {
            userId: user.id,
            rut: user.rut,
            eliminado: '4 - JEFATURA',
            asegurado: '2 - ADMINISTRATIVO',
          });
        } catch (error) {
          errors++;

          console.error('❌ ERROR REPARANDO USUARIO:', {
            userId: user.id,
            rut: user.rut,
            error,
          });
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ REPARACIÓN FINALIZADA');

      console.table({
        checkedUsers,
        repairedUsers,
        administrativoAssigned,
        unchanged,
        manualReview,
        errors,
      });
    } finally {
      this.loading = false;
    }
  }
}

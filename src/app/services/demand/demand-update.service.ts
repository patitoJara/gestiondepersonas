/********************************************************************
 * 🟦 DEMAND UPDATE SERVICE
 * Sin PUT directos en sustancias ni movimientos
 * Sincronización REAL (delete / create / restore)
 * FIX: desambiguación de description (CONTACT vs REGISTER)
 ********************************************************************/

import { Injectable } from '@angular/core';
import { formatDate } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { PostulantService } from '@app/services/postulant.service';
import { ContactService } from '@app/services/contact.service';
import { RegisterMovementService } from '@app/services/register-movement.service';
import { RegisterSubstanceService } from '@app/services/register-substance.service';
import { RegisterService } from '@app/services/register.service';

@Injectable({ providedIn: 'root' })
export class DemandUpdateService {
  constructor(
    private postulantService: PostulantService,
    private contactService: ContactService,
    private movementService: RegisterMovementService,
    private substanceService: RegisterSubstanceService,
    private registerService: RegisterService
  ) {}

  // ============================================================
  // 🟦 MÉTODO PRINCIPAL
  // ============================================================
  async updateDemand(
    registerId: number,
    formValue: any,
    ctx: { userId: number; programId: number },
    registerActual: any
  ): Promise<void> {
    if (!registerId || !registerActual) {
      throw new Error('❌ No existe register para actualizar');
    }

    const postulant = registerActual.postulant;
    if (!postulant?.id) {
      throw new Error('❌ Postulante no disponible');
    }

    // ============================================================
    // 1️⃣ POSTULANTE
    // ============================================================


    // ============================================================
    // 🟦 CONTACTO — CREATE / UPDATE SEGURO
    // ============================================================

    // 1️⃣ Buscar contacto existente del postulante
    const contactos = await firstValueFrom(this.contactService.getAll());

    const contactoExistente =
      contactos.find((c: any) => c.postulant?.id === postulant.id) ?? null;

    // 2️⃣ Payload dinámico (NO sobreescribe)
    const contactPayload: any = {
      postulant: { id: postulant.id },
    };

    // 3️⃣ Agregar solo campos con valor real
    if (formValue.name?.trim()) {
      contactPayload.name = formValue.name.trim();
    }

    if (formValue.contactDescription?.trim()) {
      contactPayload.description = formValue.contactDescription.trim();
    }

    if (formValue.emailPostulant?.trim()) {
      contactPayload.email = formValue.emailPostulant.trim();
    }

    if (formValue.cellphone?.trim()) {
      contactPayload.cellphone = formValue.cellphone.trim();
    }

    // 4️⃣ Crear o actualizar
    if (contactoExistente?.id) {
      // 🟡 UPDATE seguro
      if (Object.keys(contactPayload).length > 1) {
        await firstValueFrom(
          this.contactService.update(contactoExistente.id, contactPayload)
        );
      }
    } else {
      // 🟢 CREATE
      await firstValueFrom(this.contactService.createDto(contactPayload));
    }

    // ============================================================
    // 4️⃣ SUSTANCIAS (SYNC REAL — FIX LEVEL)
    // ============================================================
    const susResp = await firstValueFrom(
      this.substanceService.searchByRegisterId(registerId)
    );

    const sustanciasBackend = Array.isArray(susResp)
      ? susResp
      : (susResp as any)?.content ?? [];

    // 🆕 Estado deseado desde el formulario
    const nuevas = [
      ...(formValue.substance
        ? [{ id: Number(formValue.substance), level: 'Principal' }]
        : []),
      ...(formValue.secondarySubstances || []).map((id: number) => ({
        id: Number(id),
        level: 'Secundaria',
      })),
    ];

    // ============================================================
    // 🔴 1) BORRAR las que ya no existen
    // ============================================================
    for (const act of sustanciasBackend) {
      const sigue = nuevas.find((n) => n.id === act.substance?.id);
      if (!sigue && !act.deletedAt) {
        await firstValueFrom(this.substanceService.delete(act.id));
      }
    }

    // ============================================================
    // 🔁 2) CREAR / RESTAURAR / RECREAR SI CAMBIÓ LEVEL
    // ============================================================
    for (const n of nuevas) {
      const existente = sustanciasBackend.find(
        (a: any) => a.substance?.id === n.id
      );

      // 🆕 No existía → crear
      if (!existente) {
        await firstValueFrom(
          this.substanceService.create({
            register: registerActual,
            substance: { id: n.id },
            level: n.level,
          })
        );
        continue;
      }

      // 🟡 Existía pero estaba borrada → restaurar
      if (existente.deletedAt) {
        await firstValueFrom(this.substanceService.restore(existente.id));
      }

      // 🔴 CLAVE: existía pero cambió el level
      if (existente.level !== n.level) {
        // borrar la antigua
        await firstValueFrom(this.substanceService.delete(existente.id));

        // crear nuevamente con el level correcto
        await firstValueFrom(
          this.substanceService.create({
            register: registerActual,
            substance: { id: n.id },
            level: n.level,
          })
        );
      }
    }
  }

  // ============================================================
  // 5️⃣ REGISTER (UPDATE PURO)
  // ============================================================
  async updateRegister(
    registerId: number,
    registerPayload: any
  ): Promise<void> {
    await firstValueFrom(
      this.registerService.update(registerId, registerPayload)
    );
  }
}

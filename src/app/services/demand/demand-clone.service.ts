// src/app/services/demand/demand-clone.service.ts

import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RegisterService } from '@app/services/register.service';
import { RegisterMovementService } from '@app/services/register-movement.service';
import { RegisterSubstanceServiceDto } from '@app/services/substance-Create-Dto.service';

import { Register } from '@app/models/register';

@Injectable({ providedIn: 'root' })
export class DemandCloneService {
  constructor(
    private registerService: RegisterService,
    private registerSubstanceService: RegisterSubstanceServiceDto,
    private registerMovementService: RegisterMovementService,
  ) {}

  // ===========================================================
  // 🔁 CLONAR DEMANDA (EPISODIO NUEVO)
  // ===========================================================
  async cloneDemand(params: {
    formRaw: any;
    userId: number;
    programId: number;
    movements: any[];
  }): Promise<Register> {
    const { formRaw, userId, programId, movements } = params;

    // =====================================================
    // 🛑 VALIDACIÓN CRÍTICA
    // =====================================================
    if (!formRaw.postulantId || !formRaw.contactId) {
      throw new Error(
        '❌ CLONE inválido: faltan IDs de Postulant o Contact',
      );
    }

    /* =====================================================
       1️⃣ CREAR REGISTER NUEVO (EPISODIO)
       👉 SOLO REFERENCIAS
    ===================================================== */
    const register = await firstValueFrom(
      this.registerService.create({
        postulant: { id: formRaw.postulantId },
        contact: { id: formRaw.contactId },

        contactType: { id: Number(formRaw.contactTypes) },
        sender: { id: Number(formRaw.senders) },
        diverter: { id: Number(formRaw.diverters) },

        notRelevant: { id: Number(formRaw.notRelevants) },
        result: { id: Number(formRaw.result) },
        state: { id: Number(formRaw.state) },

        program: { id: programId },
        user: { id: userId },

        number_tto: String(formRaw.ntrat),
        date_attention: formRaw.fechaSolicitud ?? null,
        description: formRaw.registerDescription || '',
        is_history: 'NO',
      }),
    );

    /* =====================================================
       2️⃣ SUSTANCIAS
    ===================================================== */
    await this.syncSubstances(register.id, formRaw);

    /* =====================================================
       3️⃣ MOVIMIENTOS (SOLO NUEVOS)
    ===================================================== */
    await this.syncMovements(register.id, movements);

    return register;
  }

  // ===========================================================
  // 🔧 Helpers privados
  // ===========================================================
  private async syncSubstances(registerId: number, raw: any): Promise<void> {
    const principal = raw.substance;
    const secondaries: number[] = (raw.secondarySubstances || []).filter(
      (s: number) => s !== principal,
    );

    if (principal) {
      await firstValueFrom(
        this.registerSubstanceService.create({
          register: { id: registerId },
          substance: { id: principal },
          level: 'Principal',
        }),
      );
    }

    for (const s of secondaries) {
      await firstValueFrom(
        this.registerSubstanceService.create({
          register: { id: registerId },
          substance: { id: s },
          level: 'Secundaria',
        }),
      );
    }
  }

  private async syncMovements(
    registerId: number,
    movements: any[],
  ): Promise<void> {
    for (const m of movements) {
      if (!m.__isNew) continue;

      await firstValueFrom(
        this.registerMovementService.create({
          register: { id: registerId },
          profession: { id: m.profession.id },
          full_name: m.full_name,
          date_attention: m.date_attention,
          hour_attention: m.hour_attention,
          state: m.state,
        }),
      );
    }
  }
}

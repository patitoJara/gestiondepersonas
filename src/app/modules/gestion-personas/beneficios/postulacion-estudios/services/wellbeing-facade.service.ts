import { Injectable, inject } from '@angular/core';

import { firstValueFrom } from 'rxjs';

import { WellbeingPostulationService }
from './wellbeing-postulation.service';

import { WellbeingMapperService }
from './wellbeing-mapper.service';

import { WellbeingStorageService }
from './wellbeing-storage.service';

@Injectable({
  providedIn: 'root',
})
export class WellbeingFacadeService {

  // =========================================
  // 🔥 INJECTS
  // =========================================

  private postulationService =
    inject(WellbeingPostulationService);

  private mapperService =
    inject(WellbeingMapperService);

  private storageService =
    inject(WellbeingStorageService);

  constructor() {}

  // =========================================
  // 🔥 CREATE POSTULATION
  // =========================================

  async createPostulation():
    Promise<number> {

    const response =
      await firstValueFrom(
        this.postulationService
          .createPostulation(),
      );

    this.storageService
      .savePostulationId(response.id);

    return response.id;
  }

  // =========================================
  // 🔥 SAVE STEP 1
  // =========================================

  async saveAffiliate(
    form: any,
  ): Promise<void> {

    const postulationId =
      this.storageService
        .getPostulationId();

    if (!postulationId) {
      throw new Error(
        'No existe postulación activa',
      );
    }

    const payload =
      this.mapperService
        .mapAffiliate(form);

    await firstValueFrom(
      this.postulationService
        .saveAffiliate(
          postulationId,
          payload,
        ),
    );

    this.storageService
      .saveCurrentStep(2);
  }
}
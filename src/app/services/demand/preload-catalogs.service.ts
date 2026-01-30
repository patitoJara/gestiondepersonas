import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

// Servicios de catálogos
import { CommuneService } from '../comunes.service';
import { SexService } from '../sex.service';
import { ContactTypeService } from '../contact.type.service';
import { SenderService } from '../sender.service';
import { DiverterService } from '../diverter.service';
import { ProgramService } from '../program.service';
import { NotRelevantService } from '../not-relevant.service';
import { SubstanceService } from '../substance.service';
import { ProfessionService } from '../profession.service';
import { ResultService } from '../result.service';
import { StateService } from '../state.service';
import { ConvPrevService } from '../conv-prev.service';
import { IntPrevService } from '../int-prev.service';

@Injectable({
  providedIn: 'root',
})
export class PreloadCatalogsService {
  private communeService = inject(CommuneService);
  private sexService = inject(SexService);
  private contactTypeService = inject(ContactTypeService);
  private senderService = inject(SenderService);
  private diverterService = inject(DiverterService);
  private programService = inject(ProgramService);
  private notRelevantService = inject(NotRelevantService);
  private substanceService = inject(SubstanceService);
  private professionService = inject(ProfessionService);
  private resultService = inject(ResultService);
  private stateService = inject(StateService);
  private convPrevService = inject(ConvPrevService);
  private intPrevService = inject(IntPrevService);

  /**
   * 🟦 PRELOAD DE TODOS LOS CATÁLOGOS USADOS EN DEMAND
   * Devuelve un solo Observable con todos los datos
   */
  loadAll(): Observable<any> {
    return forkJoin({
      communes: this.communeService.listAll(),
      sexes: this.sexService.listAll(),
      contactTypes: this.contactTypeService.listAll(),
      senders: this.senderService.listAll(),
      diverters: this.diverterService.listAll(),
      programs: this.programService.listAll(),
      notRelevants: this.notRelevantService.listAll(),
      substances: this.substanceService.listAll(),

      // Prev
      convPrev: this.convPrevService.getAll(),
      intPrev: this.intPrevService.getAll(),

      // Profesiones (4 combos)
      profession1: this.professionService.listAll(),
      profession2: this.professionService.listAll(),
      profession3: this.professionService.listAll(),
      profession4: this.professionService.listAll(),

      // Resultados + Estados
      results: this.resultService.listAll(),
      state: this.stateService.listAll(),
    });
  }
}

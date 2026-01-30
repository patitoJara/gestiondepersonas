import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TokenService } from '@app/services/token.service';

@Injectable({
  providedIn: 'root',
})
export class DemandPreviousRecordsService {

  constructor(private tokenService: TokenService) {}

  /**
   * ============================================================
   * 🟦 SEPARA REGISTROS EN MISMO PROGRAMA y OTROS PROGRAMAS
   * ============================================================
   */
  splitRecordsByProgram(registros: any[]) {
    const activeProgramId = this.getActiveProgramId();

    const mismoPrograma = registros.filter(
      (r) => r.program?.id === activeProgramId
    );

    const otrosProgramas = registros.filter(
      (r) => r.program?.id !== activeProgramId
    );

    return { mismoPrograma, otrosProgramas };
  }

  /**
   * ============================================================
   * 🟦 CARGAR DATOS DEL POSTULANTE EN FORMULARIO
   * ============================================================
   */
  loadPostulantIntoForm(form: FormGroup, postulant: any): void {
    if (!postulant) return;

    form.patchValue({
      rut: postulant.rut,
      firstName: postulant.firstName,
      secondName: postulant.lastName,
      firstLastName: postulant.firstLastName,
      secondLastName: postulant.secondLastName,

      sex: postulant.sex?.id ?? null,
      commune: postulant.commune?.id ?? null,
      birthDate: postulant.birthdate ? new Date(postulant.birthdate) : null,
      phone: postulant.phone,
      email: postulant.email,
      address: postulant.address,
    });
  }

  /**
   * ============================================================
   * 🟩 USAR DATOS (SIN EDITAR LA FICHA)
   * ============================================================
   */
  handleUseRecord(ficha: any, form: FormGroup) {
    this.loadPostulantIntoForm(form, ficha.postulant);

    return {
      modoEdicion: false,
      fichaAnterior: ficha,
      mensaje: 'Datos cargados desde ficha previa (sin modificar ficha).',
    };
  }

  /**
   * ============================================================
   * 🟧 MODIFICAR FICHA (MISMO PROGRAMA)
   * ============================================================
   */
  handleEditRecord(ficha: any, form: FormGroup) {
    const activeProgramId = this.getActiveProgramId();

    if (ficha.program?.id !== activeProgramId) {
      return {
        error: true,
        modoEdicion: false,
        fichaAnterior: null,
        mensaje:
          '❌ Esta ficha pertenece a otro programa. Solo se pueden usar los datos básicos.',
      };
    }

    this.loadPostulantIntoForm(form, ficha.postulant);

    return {
      modoEdicion: true,
      fichaAnterior: ficha,
      mensaje: '⚠ Está modificando una ficha anterior del mismo programa.',
    };
  }

  /**
   * ============================================================
   * 🟥 LÓGICA: ¿Puede editar o solo usar datos?
   * ============================================================
   */
  decideAction(ficha: any) {
    const activeProgramId = this.getActiveProgramId();

    if (ficha.program?.id === activeProgramId) {
      return { action: 'edit', message: 'Puede modificar esta ficha.' };
    } else {
      return { action: 'use', message: 'Solo puede tomar datos; no editar.' };
    }
  }

  /**
   * ============================================================
   * 🟦 OBTENER ID DEL PROGRAMA ACTIVO
   * ============================================================
   */
  private getActiveProgramId(): number | null {
    const activeProgram = this.tokenService.getActiveProgram();
    if (!activeProgram) return null;

    const programs = JSON.parse(sessionStorage.getItem('programs') || '[]');
    const programObj = programs.find((p: any) => p.name === activeProgram);

    return programObj?.id ?? null;
  }
}

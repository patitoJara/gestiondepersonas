import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WellbeingTextService {

  // =========================================
  // 🔥 TITLES
  // =========================================

  readonly TITLES = {

    success:
      'Operación exitosa',

    warning:
      'Advertencia',

    error:
      'Error',

    confirmation:
      'Confirmación',

  };

  // =========================================
  // 🔥 MESSAGES
  // =========================================

  readonly MESSAGES = {

    minimumAffiliation:
      'Debe contar con al menos 6 meses de afiliación.',

    saveSuccess:
      'Antecedentes guardados correctamente.',

    submitSuccess:
      'La postulación fue enviada correctamente.',

    unexpectedError:
      'Ocurrió un error inesperado.',

    requiredDocuments:
      'Debe adjuntar todos los documentos obligatorios.',

  };

  // =========================================
  // 🔥 STEP TITLES
  // =========================================

  readonly STEP_TITLES = {

    1: 'Datos afiliado',

    2: 'Grupo familiar',

    3: 'Beneficiario',

    4: 'Antecedentes académicos',

    5: 'Antecedentes complementarios',

    6: 'Ingresos familiares',

    7: 'Gastos familiares',

    8: 'Salud y vivienda',

    9: 'Documentos',

    10: 'Confirmación',

    11: 'Postulación exitosa',

  };

  constructor() {}
}
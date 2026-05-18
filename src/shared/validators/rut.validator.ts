// src\shared\validators\rut.validator.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function rutValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value || '').toString().trim().toUpperCase();

    // 0️⃣ Vacío → requerido se encarga
    if (!value) return null;

    const clean = value.replace(/\./g, '').replace(/-/g, '');

    // 1️⃣ Incompleto → ERROR (bloquea guardar)
    if (!/^\d{7,8}[0-9K]$/.test(clean)) {
      return { rutInvalido: true };
    }

    // 2️⃣ Validar DV
    const cuerpo = clean.slice(0, -1);
    const dvIngresado = clean.slice(-1);

    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }

    const resto = 11 - (suma % 11);
    const dvEsperado =
      resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString();

    return dvIngresado === dvEsperado
      ? null
      : { rutInvalido: true };
  };
}




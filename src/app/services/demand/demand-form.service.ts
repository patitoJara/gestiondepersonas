import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import { rutValidator } from '@app/core/validator/rut.validator';

@Injectable({
  providedIn: 'root',
})
export class DemandFormService {
  private today = new Date();

  constructor(private fb: FormBuilder) {}

  /**
   * ============================================================
   * 🟦 CREAR FORMULARIO PRINCIPAL
   * ============================================================
   */
  createForm(): FormGroup {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    return this.fb.group({
      rut: ['', [Validators.required, rutValidator()]],

      birthDate: [this.today],
      firstName: ['', Validators.required],
      secondName: [''],
      firstLastName: ['', Validators.required],
      secondLastName: [''],

      phone: [''],
      email: [''],
      commune: [null, Validators.required],
      address: [''],
      sex: [null, Validators.required],

      // Contacto del referente
      name: ['', Validators.required],
      cellphone: ['', Validators.required],
      emailPostulant: [''],
      description: [''],

      // Prev/IntPrev
      intPrev: [null, Validators.required],
      convPrev: [{ value: null, disabled: true }],

      // Tratamientos y sustancias
      ntrat: [0, Validators.required],
      contactTypes: [null, Validators.required],

      substance: [null],
      secondarySubstances: [[]],

      senders: [null, Validators.required],
      diverters: [null, Validators.required],

      // Estado inicial
      state: [1],
      result: [5],
      notRelevants: [1],

      programs: [null],
      fechaSolicitud: [this.today],

      // Citaciones (4 posibles)
      fechaOfrecida1: [this.today],
      horaOfrecida1: [currentTime],
      fechaOfrecida2: [this.today],
      horaOfrecida2: [currentTime],
      fechaOfrecida3: [this.today],
      horaOfrecida3: [currentTime],
      fechaOfrecida4: [this.today],
      horaOfrecida4: [currentTime],

      profesional1: [''],
      profesional2: [''],
      profesional3: [''],
      profesional4: [''],

      asistencia1: [''],
      asistencia2: [''],
      asistencia3: [''],
      asistencia4: [''],

      // Profesiones (4 combos)
      profession1: [null],
      profession2: [null],
      profession3: [null],
      profession4: [null],

      // Observaciones
      observaciones: [''],
    });
  }

  /**
   * ============================================================
   * 🟦 AUTO-FORMATO RUT + VALIDACIÓN
   * ============================================================
   */
  autoFormatRut(value: string): string {
    if (!value) return '';

    value = value.toUpperCase().replace(/[^0-9K]/g, '');
    if (value.length < 2) return value;

    const body = value.slice(0, -1);
    const dv = value.slice(-1);
    let formatted = '';

    for (let i = body.length; i > 0; i -= 3) {
      const start = Math.max(i - 3, 0);
      formatted = body.substring(start, i) + (formatted ? '.' + formatted : '');
    }

    return `${formatted}-${dv}`;
  }

  /**
   * ============================================================
   * 🟦 SETEAR DATOS DEL POSTULANTE EN EL FORM
   * ============================================================
   */
  cargarDatosPostulante(form: FormGroup, p: any): void {
    form.patchValue({
      firstName: p.firstName,
      secondName: p.lastName,
      firstLastName: p.firstLastName,
      secondLastName: p.secondLastName,
      rut: p.rut,
      sex: p.sex?.id || null,
      commune: p.commune?.id || null,
      birthDate: p.birthdate ? new Date(p.birthdate) : null,
      phone: p.phone,
      email: p.email,
      address: p.address,
    });
  }

  /**
   * ============================================================
   * 🟦 SINGLE RESPONSIBILITY:
   * Reinicia solo las zonas necesarias del formulario
   * ============================================================
   */
  resetForm(form: FormGroup): void {
    form.reset();

    // Valores default
    form.patchValue({
      birthDate: this.today,
      fechaSolicitud: this.today,
      ntrat: 0,
      result: 5,
      notRelevants: 1,
    });
  }

  /**
   * ============================================================
   * 🟦 VALIDAR SUSTANCIA PRINCIPAL
   * ============================================================
   */
  validatePrincipal(form: FormGroup): boolean {
    return form.value.substance !== null && form.value.substance !== undefined;
  }

  /**
   * ============================================================
   * 🟦 Asigna Principal
   * ============================================================
   */
  selectPrincipal(form: FormGroup, id: number): void {
    form.patchValue({ substance: id });

    let sec: number[] = form.value.secondarySubstances || [];
    sec = sec.filter((s) => s !== id);
    form.patchValue({ secondarySubstances: sec });
  }

  /**
   * ============================================================
   * 🟦 Alterna una Sustancia Secundaria
   * ============================================================
   */
  toggleSecondary(form: FormGroup, id: number): void {
    const principal: number | null = form.value.substance;
    let sec: number[] = [...(form.value.secondarySubstances || [])];

    if (principal === id) {
      form.patchValue({ substance: null });
    }

    sec = sec.includes(id) ? sec.filter((x) => x !== id) : [...sec, id];
    form.patchValue({ secondarySubstances: sec });
  }

  /**
   * ============================================================
   * 🟦 Formatea fecha a yyyy-MM-dd
   * ============================================================
   */
  formatDate(date: any): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-CL');
  }

  /**
   * ============================================================
   * 🟦 Obtiene hora actual HH:mm
   * ============================================================
   */
  getCurrentTime(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }
}

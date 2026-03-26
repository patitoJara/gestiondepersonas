import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { firstValueFrom } from 'rxjs';

import { SubscribesService } from '../../../services/admin/subscribes.service';
import { TokenService } from '../../../../core/services/token.service';
import { UsersService } from '../../../services/admin/users.service';
import { TimeService } from '@app/core/services/time.service';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';

interface Step {
  id: number;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'app-telework-subscribe',
  standalone: true,
  templateUrl: './telework-subscribe.component.html',
  styleUrls: ['./telework-subscribe.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatTooltipModule,
  ],
})
export class TeleworkSubscribeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private subscribeService = inject(SubscribesService);
  private tokenService = inject(TokenService);
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private overlapWarningShown = false;

  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any;
  hasDateConflict = false;

  userSearch = this.fb.control<string | any>('');

  subscriptions: any[] = [];
  today = new Date();
  selectedFile: File | null = null;
  fileName: string | null = null;

  steps: Step[] = [
    { id: 1, title: 'Funcionario', completed: false },
    { id: 2, title: 'Fecha inicio', completed: false },
    { id: 3, title: 'Fecha término', completed: false },
    { id: 4, title: 'Validación', completed: false },
    { id: 5, title: 'Documento', completed: false },
    { id: 6, title: 'Confirmación', completed: false },
    { id: 7, title: 'Registro', completed: false },
  ];

  currentStep = 1;

  form = this.fb.group({
    userId: [null, Validators.required],
    begin: [null, Validators.required],
    end: [null, Validators.required],
  });

  constructor(private timeService: TimeService) {}

  ngOnInit() {
    this.loadUsers();
    this.userSearch.valueChanges.subscribe((value: any) => {
      const search =
        typeof value === 'string'
          ? value.toLowerCase()
          : (value?.fullName || '').toLowerCase();

      this.filteredUsers = this.users.filter((u: any) => {
        const name = (u.fullName || '').toLowerCase();
        const rut = (u.rut || '').toLowerCase();

        return name.includes(search) || rut.includes(search);
      });
    });

    this.form.get('begin')?.valueChanges.subscribe((begin) => {
      this.checkOverlapDates();
    });

    this.form.get('end')?.valueChanges.subscribe((end) => {
      this.checkOverlapDates();
    });
  }

  displayUser(user: any): string {
    return user ? user.fullName : '';
  }

  async selectUser(user: any) {
    console.log('==============================');
    console.log('USUARIO SELECCIONADO');
    console.log('Objeto completo:', user);
    console.log('ID:', user.id);
    console.log('Nombre:', user.fullName);

    this.selectedUser = user;

    this.form.patchValue({
      userId: user.id,
    });

    // limpiar historial anterior inmediatamente
    this.subscriptions = [];

    // cargar historial del nuevo usuario
    await this.loadSubscriptions(user.id);
  }

  hasActiveSubscription(): boolean {
    return this.subscriptions.some((s) => this.isActive(s));
  }

  async loadUsers() {
    const res: any[] = await firstValueFrom(
      this.usersService.getAllUsersRoles(),
    );

    // 🔥 AGRUPAR POR USUARIO (CLAVE)
    const usersMap: any = {};

    res
      .filter((r: any) => !r.deletedAt) // 🔥 ESTE ES EL FIX
      .forEach((r: any) => {
        const u = r.user;
        const roleName = r.role?.name?.toUpperCase();

        if (!usersMap[u.id]) {
          usersMap[u.id] = {
            id: u.id,
            fullName:
              `${u.firstName} ${u.secondName || ''} ${u.firstLastName || ''} ${u.secondLastName || ''}`
                .replace(/\s+/g, ' ')
                .trim(),
            rut: u.rut || '',
            email: u.email,
            roles: [],
          };
        }

        usersMap[u.id].roles.push(roleName);
      });

    // 🔥 FILTRAR SOLO ADMINISTRATIVOS
    const users = Object.values(usersMap).filter((u: any) =>
      u.roles.includes('ADMINISTRATIVO'),
    );

    this.users = users;
    this.filteredUsers = users;
  }

  async loadSubscriptions(userId: number) {
    const data = await firstValueFrom(this.subscribeService.getByUser(userId));

    const subs = data || [];

    this.subscriptions = subs.sort((a: any, b: any) => {
      const activeA = this.isActive(a);
      const activeB = this.isActive(b);

      if (activeA && !activeB) return -1;
      if (!activeA && activeB) return 1;

      return new Date(b.begin).getTime() - new Date(a.begin).getTime();
    });
  }

  getUserName(): string {
    if (!this.selectedUser) return '';

    return this.selectedUser.fullName;
  }

  get progress(): number {
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  nextStep() {
    if (this.currentStep === 1 && !this.form.get('userId')?.value) return;
    if (this.currentStep === 2 && !this.form.get('begin')?.value) return;
    if (this.currentStep === 3 && !this.form.get('end')?.value) return;

    if (this.currentStep < this.steps.length) {
      this.steps[this.currentStep - 1].completed = true;
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 2].completed = false;
      this.currentStep--;
    }
  }

  calculateActive(begin: Date, end: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today >= begin && today <= end;
  }

  async createSubscription() {
    const begin = this.form.value.begin!;
    const end = this.form.value.end!;

    const payload = {
      begin,
      end,
      user: { id: this.form.value.userId },
      active: this.calculateActive(begin, end),
    };

    await firstValueFrom(this.subscribeService.create(payload));

    // avanzar al paso final
    this.steps.forEach((step) => (step.completed = true));
    this.currentStep = 7;

    // marcar paso 7 como completado
    this.steps[6].completed = true;
  }

  reset() {
    this.form.reset();
    this.limpiarBusqueda();
    this.userSearch.setValue('');
    this.selectedUser = null;

    this.steps.forEach((s) => (s.completed = false));
    this.currentStep = 1;

    this.selectedFile = null;
    this.fileName = null;

    this.overlapWarningShown = false; // ← agregar
  }

  limpiarBusqueda(): void {
    this.userSearch.setValue('');

    // restaurar lista completa
    this.filteredUsers = this.users;

    // limpiar historial
    this.subscriptions = [];

    // limpiar usuario
    this.selectedUser = null;

    this.form.patchValue({
      userId: null,
    });
  }

  removeFile(input: any) {
    this.selectedFile = null;
    this.fileName = null;

    input.value = '';
  }

  isActive(s: any): boolean {
    const today = this.timeService.getServerTime();

    const begin = new Date(s.begin).setHours(0, 0, 0, 0);
    const end = new Date(s.end).setHours(0, 0, 0, 0);

    const current = new Date(today).setHours(0, 0, 0, 0);

    return current >= begin && current <= end;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
  }

  validateOverlap(begin: Date, end: Date): any {
    const beginDate = this.normalizeDate(begin);
    const endDate = this.normalizeDate(end);

    return this.subscriptions.find((s: any) => {
      const histBegin = this.normalizeDate(s.begin);
      const histEnd = this.normalizeDate(s.end);

      return beginDate <= histEnd && endDate >= histBegin;
    });
  }

  validatePeriod() {
    const begin = this.normalizeDate(this.form.value.begin);
    const end = this.normalizeDate(this.form.value.end);

    if (begin > end) {
      this.showWarning(
        'La fecha de término debe ser posterior a la fecha de inicio.',
      );

      return;
    }

    const conflict = this.validateOverlap(begin, end);

    if (conflict) {
      this.showWarning(
        'El periodo seleccionado se superpone con una suscripción existente.\n\nRevise el historial antes de continuar.',
      );

      return;
    }

    this.nextStep();
  }

  checkOverlapDates() {
    const begin = this.form.value.begin;
    const end = this.form.value.end;

    if (!begin) return;

    const beginDate = this.normalizeDate(begin);
    const endDate = end ? this.normalizeDate(end) : null;

    const beginTime = beginDate.getTime();
    const endTime = endDate ? endDate.getTime() : null;

    console.log('---------------------------');
    console.log('FECHA SELECCIONADA RAW:', begin);
    console.log('FECHA SELECCIONADA NORMALIZADA:', beginDate);
    console.log('TIMESTAMP BEGIN:', beginTime);

    if (endDate) {
      console.log('FECHA FIN NORMALIZADA:', endDate);
      console.log('TIMESTAMP END:', endTime);
    }

    const conflict = this.subscriptions.find((s: any) => {
      const histBeginDate = this.normalizeDate(s.begin);
      const histEndDate = this.normalizeDate(s.end);

      const histBegin = histBeginDate.getTime();
      const histEnd = histEndDate.getTime();

      console.log('------ HISTORICO ------');
      console.log('Hist begin raw:', s.begin);
      console.log('Hist end raw:', s.end);

      console.log('Hist begin normalizado:', histBeginDate);
      console.log('Hist end normalizado:', histEndDate);

      console.log('Hist begin timestamp:', histBegin);
      console.log('Hist end timestamp:', histEnd);

      console.log(
        'Comparación inicio dentro rango:',
        beginTime >= histBegin && beginTime <= histEnd,
      );

      if (beginTime >= histBegin && beginTime <= histEnd) {
        console.log('✔ CONFLICTO POR FECHA INICIO');
        return true;
      }

      if (endTime !== null && endTime >= histBegin && endTime <= histEnd) {
        console.log('✔ CONFLICTO POR FECHA FIN');
        return true;
      }

      if (endTime !== null && beginTime <= histEnd && endTime >= histBegin) {
        console.log('✔ CONFLICTO POR RANGO');
        return true;
      }

      console.log('❌ NO HAY CONFLICTO CON ESTE PERIODO');

      return false;
    });

    console.log('RESULTADO FINAL CONFLICTO:', conflict);

    if (conflict) {
      this.hasDateConflict = true;

      if (!this.overlapWarningShown) {
        this.overlapWarningShown = true;

        const msg =
          `La fecha seleccionada entra en conflicto con una suscripción existente.\n\n` +
          `Periodo registrado:\n` +
          `${this.formatDateCL(conflict.begin)} → ${this.formatDateCL(conflict.end)}`;

        this.showWarning(msg);
      }
    } else {
      this.hasDateConflict = false;
      this.overlapWarningShown = false;
    }
  }

  showWarning(message: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      disableClose: true,
      data: {
        title: 'Periodo inválido',
        message: message,
        icon: 'warning',
        color: 'warn',
        confirmText: 'Aceptar',
      },
    });
  }

  normalizeDate(date: any): Date {
    return this.parseDateCL(date);
  }

  formatDateCL(date: any): string {
    const d = this.normalizeDate(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  parseDateCL(date: any): Date {
    if (!date) return new Date();

    // ya es Date (datepicker)
    if (date instanceof Date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // viene del backend ISO
    if (typeof date === 'string' && date.includes('T')) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // formato dd/mm/yyyy
    if (typeof date === 'string' && date.includes('/')) {
      const parts = date.split('/');
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    // fallback
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

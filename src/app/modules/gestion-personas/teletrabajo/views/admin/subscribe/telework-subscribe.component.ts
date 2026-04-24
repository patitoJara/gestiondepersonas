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
import { firstValueFrom, debounceTime, distinctUntilChanged } from 'rxjs';

import { SubscribesService } from '../../../services/admin/subscribes.service';
import { UsersService } from '@app/modules/gestion-personas/teletrabajo/services/admin/users.service';
import { TimeService } from '@app/core/services/time.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@app/shared/confirm-dialog/confirm-dialog.component';
import { filterByRutOrName } from '@app/shared/utils/filter.util';
import { trigger, transition, style, animate } from '@angular/animations';

import {
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';

interface Step {
  id: number;
  title: string;
  completed: boolean;
}

interface User {
  id: number;
  fullName: string;
  rut: string;
  email: string;
  roles: string[];
}

interface UserRoleResponse {
  user: any;
  role: { name: string };
  deletedAt?: any;
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
    MatTooltipModule,
  ],

  animations: [
    trigger('stepAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(30px) scale(0.98)',
        }),
        animate(
          '300ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({
            opacity: 1,
            transform: 'translateX(0) scale(1)',
          }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({
            opacity: 0,
            transform: 'translateX(-20px) scale(0.98)',
          }),
        ),
      ]),
    ]),
  ],
})
export class TeleworkSubscribeComponent implements OnInit, AfterViewInit {
  @ViewChildren('stepItem') stepItems!: QueryList<ElementRef>;
  private fb = inject(FormBuilder);
  private subscribeService = inject(SubscribesService);
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private overlapWarningShown = false;
  private timeService = inject(TimeService);

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  hasDateConflict = false;

  userSearch = this.fb.control<
    string | { id: number; fullName: string } | null
  >(null);

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
    begin: [null as Date | null, Validators.required],
    end: [null as Date | null, Validators.required],
  });

  ngOnInit() {
    this.setupUserFilter();
    this.loadUsers();

    // 🔥 UN SOLO OBSERVER PARA TODO EL FORM
    this.form.valueChanges.subscribe(() => {
      this.checkOverlapDates();
    });
  }

  displayUser(user: any): string {
    return user ? user.fullName : '';
  }

  async selectUser(user: any) {
    this.overlapWarningShown = false;
    this.hasDateConflict = false;
    this.selectedUser = user;

    this.form.patchValue({
      userId: user.id,
    });

    // 🔥 RESET REAL (CLAVE PARA EL FANTASMA)
    this.form.get('begin')?.reset();
    this.form.get('end')?.reset();

    this.subscriptions = [];

    await this.loadSubscriptions(user.id);
  }

  hasActiveSubscription(): boolean {
    return this.subscriptions.some((s) => this.isActive(s));
  }

  async loadUsers() {
    const res = await firstValueFrom(this.usersService.getAllUsersRoles());

    const usersMap: Record<number, User> = {};

    res
      .filter((r: any) => !r.deletedAt)
      .forEach((r: any) => {
        const u = r.user;
        const roleName = r.role?.name?.toUpperCase();

        if (!usersMap[u.id]) {
          usersMap[u.id] = {
            id: u.id,
            fullName: this.buildFullName(u),
            rut: u.rut || '',
            email: u.email,
            roles: [],
          };
        }

        if (roleName && !usersMap[u.id].roles.includes(roleName)) {
          usersMap[u.id].roles.push(roleName);
        }
      });

    const users = Object.values(usersMap).filter((u) =>
      u.roles.includes('ADMINISTRATIVO'),
    );

    this.users = users;
    this.filteredUsers = users;
  }

  private buildFullName(u: any): string {
    return `${u.firstName} ${u.secondName || ''} ${u.firstLastName || ''} ${u.secondLastName || ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  async loadSubscriptions(userId: number) {
    const data = await firstValueFrom(this.subscribeService.getByUser(userId));

    const subs = data || [];

    this.subscriptions = subs.sort((a: any, b: any) => {
      const activeA = this.isActive(a);
      const activeB = this.isActive(b);

      if (activeA && !activeB) return -1;
      if (!activeA && activeB) return 1;

      // 🔥 NORMALIZAR FECHA (SIN TIMEZONE)
      const bDate = this.parseDateCL(b.begin);
      const aDate = this.parseDateCL(a.begin);

      return bDate.getTime() - aDate.getTime();
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

      this.scrollToActiveStep(); // 🔥 AQUÍ
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 2].completed = false;
      this.currentStep--;

      this.scrollToActiveStep(); // 🔥 AQUÍ
    }
  }

  calculateActive(begin: Date, end: Date): boolean {
    if (!begin || !end) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const b = new Date(begin);
    const e = new Date(end);

    b.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    return today >= b && today <= e;
  }

  async createSubscription() {
    const begin = this.form.get('begin')?.value;
    const end = this.form.get('end')?.value;

    if (!begin || !end) {
      this.showWarning('Debe seleccionar fechas válidas');
      return;
    }

    const payload = {
      begin: this.toBackendDate(begin), // 🔥 CLAVE
      end: this.toBackendDate(end), // 🔥 CLAVE
      user: { id: this.form.value.userId },
      active: this.calculateActive(begin, end),
    };

    await firstValueFrom(this.subscribeService.create(payload));

    this.steps.forEach((step) => (step.completed = true));
    this.currentStep = 7;
  }

  reset() {
    this.form.reset();

    // 🔥 LIMPIEZA REAL
    this.selectedUser = null;
    this.userSearch.setValue(null); // 🔥 CLAVE
    this.filteredUsers = this.users;
    this.subscriptions = [];

    this.form.patchValue({
      userId: null,
    });

    // 🔥 STEPS
    this.steps.forEach((s) => (s.completed = false));
    this.currentStep = 1;

    // 🔥 FILE
    this.selectedFile = null;
    this.fileName = null;

    this.overlapWarningShown = false;

    // 🔥 SCROLL
    this.lastStep = -1;
    this.scrollToActiveStep();
  }

  limpiarBusqueda(): void {
    this.userSearch.setValue(null);

    this.filteredUsers = this.users;
    this.subscriptions = [];
    this.selectedUser = null;

    this.form.patchValue({
      userId: null,
    });

    this.userSearch.markAsPristine();
    this.userSearch.markAsUntouched();
  }

  removeFile(input: any) {
    this.selectedFile = null;
    this.fileName = null;

    input.value = '';
  }

  isActive(s: any): boolean {
    const today = this.timeService.getServerTime();

    const begin = this.parseDateCL(s.begin).getTime();
    const end = this.parseDateCL(s.end).getTime();
    const current = this.parseDateCL(today).getTime();

    return current >= begin && current <= end;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.showWarning('Solo se permiten archivos PDF');
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
  }

  validateOverlap(begin: Date, end: Date): any {
    const beginDate = this.parseDateCL(begin);
    const endDate = this.parseDateCL(end);

    return this.subscriptions.find((s: any) => {
      const histBegin = this.parseDateCL(s.begin);
      const histEnd = this.parseDateCL(s.end);

      return beginDate <= histEnd && endDate >= histBegin;
    });
  }

  validatePeriod() {
    const begin = this.parseDateCL(this.form.value.begin);
    const end = this.parseDateCL(this.form.value.end);

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

    const beginDate = this.parseDateCL(begin);
    const endDate = end ? this.parseDateCL(end) : null;

    const beginTime = beginDate.getTime();
    const endTime = endDate ? endDate.getTime() : null;

    const conflict = this.subscriptions.find((s: any) => {
      const histBegin = this.parseDateCL(s.begin).getTime();
      const histEnd = this.parseDateCL(s.end).getTime();

      return (
        (beginTime >= histBegin && beginTime <= histEnd) ||
        (endTime !== null && endTime >= histBegin && endTime <= histEnd) ||
        (endTime !== null && beginTime <= histEnd && endTime >= histBegin)
      );
    });

    // 🔴 SI HAY CONFLICTO
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
    }

    // 🟢 SI NO HAY CONFLICTO → recién aquí limpias
    else {
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

  formatDateCL(date: any): string {
    if (!date) return '';

    let d: Date;

    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      const [year, month, day] = date.split('T')[0].split('-');
      d = new Date(+year, +month - 1, +day);
    } else {
      console.warn('Fecha inválida:', date);
      return '';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private formatFromDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  parseDateCL(date: any): Date {
    if (!date) return null as any;

    // ✅ SI YA ES DATE
    if (date instanceof Date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // ✅ STRING ISO YYYY-MM-DD
    if (typeof date === 'string' && date.includes('-')) {
      const [year, month, day] = date.split('T')[0].split('-');
      return new Date(+year, +month - 1, +day);
    }

    // fallback seguro
    return new Date(date);
  }

  private setupUserFilter() {
    this.userSearch.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value: any) => {
        const term = typeof value === 'string' ? value : value?.fullName;

        this.filteredUsers = filterByRutOrName(this.users, term, {
          nameKey: 'fullName',
          rutKey: 'rut',
        });
      });
  }

  canGoNext(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.form.value.userId;

      case 2:
        return !!this.form.value.begin && !this.hasDateConflict;

      case 3:
        return !!this.form.value.end && !this.hasDateConflict;

      case 4:
        return true;

      case 5:
        return true;

      case 6:
        return true;

      default:
        return false;
    }
  }

  handleNext() {
    switch (this.currentStep) {
      case 3:
        this.validatePeriod();
        break;

      case 6:
        this.createSubscription();
        break;

      default:
        this.nextStep();
    }
  }

  fixDate(date: Date): Date {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  onDateChange(field: 'begin' | 'end', event: any) {
    const value = event.value;
    if (!value) return;

    const cleanDate = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );

    this.form.get(field)?.setValue(cleanDate);

    // 🔥 SOLO reset, NO validar aquí
    this.overlapWarningShown = false;
  }

  getDate(field: 'begin' | 'end'): string {
    const value = this.form.get(field)?.value;
    return value ? this.formatDateCL(value) : '';
  }

  toBackendDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  ngAfterViewInit() {
    this.scrollToActiveStep();
  }

  private lastStep = -1;

  scrollToActiveStep() {
    if (this.lastStep === this.currentStep) return;

    this.lastStep = this.currentStep;

    setTimeout(() => {
      const index = this.steps.findIndex((s) => s.id === this.currentStep);
      const el = this.stepItems?.toArray()[index];

      if (el) {
        el.nativeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }, 100);
  }
}

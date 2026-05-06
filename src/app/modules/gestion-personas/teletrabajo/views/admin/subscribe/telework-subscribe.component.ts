import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';

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
import { UserSearchService } from 'src/app/modules/gestion-personas/teletrabajo/services/admin/user-search.service';
import { ChangeDetectorRef } from '@angular/core';

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

type DateRange = {
  from: Date;
  to: Date;
};

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
  private cdr = inject(ChangeDetectorRef);

  constructor(private userSearchService: UserSearchService) {}

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  hasDateConflict = false;
  isSaving = false;

  userSearch = new FormControl('');

  subscriptions: any[] = [];

  today = new Date();
  selectedFile: File | null = null;
  fileName: string | null = null;
  calendar: { date: Date }[] = [];
  groupedMonths: any[] = [];

  selectedDates: Date[] = [];

  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  month: number | null = null;
  year: number | null = null;
  tempStart: Date | null = null;
  ranges: DateRange[] = [];

  months = [
    { name: 'Ene' },
    { name: 'Feb' },
    { name: 'Mar' },
    { name: 'Abr' },
    { name: 'May' },
    { name: 'Jun' },
    { name: 'Jul' },
    { name: 'Ago' },
    { name: 'Sep' },
    { name: 'Oct' },
    { name: 'Nov' },
    { name: 'Dic' },
  ];

  steps: Step[] = [
    { id: 1, title: 'Funcionario', completed: false },
    { id: 2, title: 'Fechas', completed: false }, // 🔥 TODO AQUÍ
    { id: 3, title: 'Documento', completed: false },
    { id: 4, title: 'Confirmación', completed: false },
    { id: 5, title: 'Registro', completed: false },
  ];

  currentStep = 1;

  form = this.fb.group({
    userId: [null, Validators.required],
    begin: [null as Date | null, Validators.required],
    end: [null as Date | null, Validators.required],
  });

  ngOnInit() {
    this.userSearchService
      .search(this.userSearch.valueChanges)
      .subscribe((users) => {
        this.filteredUsers = users;
      });

    this.form.valueChanges.subscribe(() => {
      this.checkOverlapDates();
    });

    this.generateCalendar();
    this.groupCalendar();
  }

  displayUser(user: any): string {
    return user ? `${user.fullName}` : '';
  }

  async selectUserFromSearch(user: any) {
    if (!user) return;

    await this.selectUser(user); // 💥 REUTILIZA TODO

    console.log('✔️ userId seteado:', user.id);
  }

  async selectUser(user: any) {
    this.selectedUser = user;

    this.form.patchValue({
      userId: user.id,
    });

    this.subscriptions = [];

    await this.loadSubscriptions(user.id);

    console.log('🔥 SUBS CARGADAS:', this.subscriptions);

    this.cdr.detectChanges();
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
    if (!this.canGoNext()) return;

    this.steps[this.currentStep - 1].completed = true;
    this.currentStep++;

    this.scrollToActiveStep();
  }

  previousStep() {
    if (this.currentStep > 1) {
      // limpiar pasos futuros
      for (let i = this.currentStep - 1; i < this.steps.length; i++) {
        this.steps[i].completed = false;
      }

      this.currentStep--;

      this.scrollToActiveStep();
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
    if (this.isSaving) return;

    if (!this.ranges || this.ranges.length === 0) {
      this.showWarning('Debe seleccionar al menos un rango');
      return;
    }

    const userId = this.selectedUser?.id;

    if (!userId) {
      this.showWarning('Debe seleccionar un usuario');
      return;
    }

    this.isSaving = true;

    try {
      for (const r of this.ranges) {
        const payload = {
          begin: this.toBackendDate(r.from),
          end: this.toBackendDate(r.to),
          user: { id: userId },
        };

        console.log('🚀 guardando rango:', payload);

        await firstValueFrom(this.subscribeService.create(payload));
      }

      // ✔️ éxito
      this.steps.forEach((s) => (s.completed = true));
      this.currentStep = 5;

      await this.loadSubscriptions(userId);

      this.ranges = [];
      this.selectedDates = [];
    } catch (error) {
      console.error(error);
      this.showWarning('Error al guardar uno de los rangos');
    } finally {
      this.isSaving = false;
    }
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
    this.userSearch.setValue(''); // 🔥 string, no null

    this.filteredUsers = []; // 🔥 limpiar resultados

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

    let d: Date;

    // ✅ SI YA ES DATE
    if (date instanceof Date) {
      d = date;
    }

    // ✅ STRING (YYYY-MM-DD o ISO)
    else if (typeof date === 'string') {
      const [year, month, day] = date.split('T')[0].split('-');
      d = new Date(+year, +month - 1, +day);
    }

    // fallback
    else {
      d = new Date(date);
    }

    // 💥 CLAVE TOTAL: normalizar SIEMPRE
    d.setHours(0, 0, 0, 0);

    return d;
  }

  canGoNext(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.form.value.userId;

      case 2:
        return this.ranges.length > 0; // 🔥 CLAVE

      case 3:
        return true; // documento opcional

      case 4:
        return true;

      case 5:
        return true;

      default:
        return false;
    }
  }

  handleNext() {
    switch (this.currentStep) {
      case 4:
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

  /*--------------------------------------------------------------------------------------------------
  ---------------------------------------------------------------------------------------------------*/

  formatDateSafe(value: string | Date): string {
    if (!value) return '';

    // 🔥 si ya es Date
    if (value instanceof Date) {
      const d = value.getDate().toString().padStart(2, '0');
      const m = (value.getMonth() + 1).toString().padStart(2, '0');
      const y = value.getFullYear();

      return `${d}/${m}/${y}`;
    }

    // 🔥 si es string ISO
    const [datePart] = value.split('T');
    const [y, m, d] = datePart.split('-');

    return `${d}/${m}/${y}`;
  }

  formatToLocalISOString(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');

    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');

    return `${y}-${m}-${d}T${h}:${min}:${s}`;
  }

  onFilterFocus(): void {
    // 🔥 limpiar fechas si usas mes/año
    this.dateFrom = null;
    this.dateTo = null;
  }

  onDateFocus(): void {
    this.month = null;
    this.year = null;

    this.clearResults(); // 🔥 limpieza completa
  }

  isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  parseLocalDate(value: string | Date): Date {
    if (!value) return new Date();

    if (value instanceof Date) return value;

    const [datePart] = value.split('T'); // 🔥 IGNORA TODO LO DEMÁS
    const [y, m, d] = datePart.split('-').map(Number);

    return new Date(y, m - 1, d);
  }

  toggleDate(d: Date) {
    const exists = this.selectedDates.some((date) => this.isSameDay(date, d));

    if (exists) {
      this.selectedDates = this.selectedDates.filter(
        (date) => !this.isSameDay(date, d),
      );
    } else {
      this.selectedDates.push(d);
    }

    this.generateRanges(); // 🔥 CLAVE
  }

  getWeekKey(d: Date) {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const day = date.getDay() || 7; // domingo = 7
    date.setDate(date.getDate() + 4 - day);

    const yearStart = new Date(date.getFullYear(), 0, 1);

    const week = Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );

    return `${date.getFullYear()}-W${week}`;
  }

  generateRanges() {
    if (!this.selectedDates.length) {
      this.ranges = [];
      return;
    }

    const sorted = [...this.selectedDates]
      .map((d) => this.parseDateCL(d))
      .sort((a, b) => a.getTime() - b.getTime());

    const result: { from: Date; to: Date }[] = [];

    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];

      const isNextDay = this.isNextDay(current, prev);
      const sameWeek = this.getWeekKey(current) === this.getWeekKey(prev);

      if (isNextDay && sameWeek) {
        prev = current;
      } else {
        result.push({ from: start, to: prev });
        start = current;
        prev = current;
      }
    }

    result.push({ from: start, to: prev });

    this.ranges = result;
  }

  getDays(range: DateRange): number {
    const diff =
      (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24);

    return diff + 1;
  }

  isOverlapping(newRange: DateRange): boolean {
    return this.ranges.some(
      (r) => newRange.from <= r.to && newRange.to >= r.from,
    );
  }

  getTotalDays(): number {
    return this.ranges.reduce((acc, r) => acc + this.getDays(r), 0);
  }
  generateCalendar() {
    const today = new Date();

    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), 11, 31);

    const days = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }

    this.calendar = days;
  }

  groupCalendar() {
    const groups: any = {};

    this.calendar.forEach((item) => {
      const d = item.date;
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (!groups[key]) {
        groups[key] = {
          label: this.months[d.getMonth()].name.toUpperCase(),
          year: d.getFullYear(),
          days: [],
        };
      }

      groups[key].days.push(d);
    });

    this.groupedMonths = Object.values(groups);
  }

  isSelected(date: Date): boolean {
    return this.selectedDates.some((d) => this.isSameDay(d, date));
  }

  clearResults() {
    this.selectedDates = [];
    this.ranges = [];
  }

  getMonthDaysWithOffset(month: any): (Date | null)[] {
    const days = month.days;

    if (!days.length) return [];

    const first = days[0];
    const dayOfWeek = first.getDay() === 0 ? 7 : first.getDay();

    const offset = dayOfWeek - 1;

    const result: (Date | null)[] = [];

    // 🔹 espacios iniciales
    for (let i = 0; i < offset; i++) {
      result.push(null);
    }

    // 🔹 días reales
    result.push(...days);

    // 🔥 CLAVE: completar hasta 42 celdas
    while (result.length < 42) {
      result.push(null);
    }

    return result;
  }

  isInRange(d: Date): boolean {
    return this.ranges.some((r) => d >= r.from && d <= r.to);
  }

  isStart(d: Date): boolean {
    return this.ranges.some((r) => this.isSameDay(d, r.from));
  }

  isEnd(d: Date): boolean {
    return this.ranges.some((r) => this.isSameDay(d, r.to));
  }

  isSingle(d: Date): boolean {
    return this.ranges.some(
      (r) => this.isSameDay(r.from, r.to) && this.isSameDay(d, r.from),
    );
  }

  isMiddle(d: Date): boolean {
    return this.ranges.some((r) => d > r.from && d < r.to);
  }

  canContinue(): boolean {
    return this.ranges && this.ranges.length > 0;
  }

  isSameWeek(d1: Date, d2: Date): boolean {
    const start = new Date(d1);
    const day = start.getDay() || 7; // lunes inicio

    start.setDate(d1.getDate() - day + 1);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return d2 >= start && d2 <= end;
  }

  isFutureDay(d: Date): boolean {
    const today = this.parseDateCL(new Date()).getTime();
    const day = this.parseDateCL(d).getTime();

    return day > today; // ❌ hoy no se puede
  }

  isBlockedDay(d: Date): boolean {
    if (!this.subscriptions.length) {
      console.log('⚠️ NO HAY SUBS');
    }
    const current = this.parseDateCL(d).getTime();

    return this.subscriptions.some((s: any) => {
      const begin = this.parseDateCL(s.begin).getTime();
      const end = this.parseDateCL(s.end).getTime();

      return current >= begin && current <= end;
    });
  }

  isSubscribedDay(d: Date): boolean {
    return this.isBlockedDay(d); // reutilizamos lógica
  }

  onDayClick(d: Date) {
    if (this.isBlockedDay(d)) {
      this.showWarning('Este día ya tiene una suscripción');
      return;
    }

    if (!this.isFutureDay(d)) {
      this.showWarning('Solo puedes seleccionar fechas futuras');
      return;
    }

    this.toggleDate(d); // 🔥 recién aquí entra
  }

  isSubStart(d: Date): boolean {
    return this.subscriptions.some((s: any) =>
      this.isSameDay(d, this.parseDateCL(s.begin)),
    );
  }

  isSubEnd(d: Date): boolean {
    return this.subscriptions.some((s: any) =>
      this.isSameDay(d, this.parseDateCL(s.end)),
    );
  }

  isSubSingle(d: Date): boolean {
    return this.subscriptions.some((s: any) => {
      const b = this.parseDateCL(s.begin);
      const e = this.parseDateCL(s.end);
      return this.isSameDay(b, e) && this.isSameDay(d, b);
    });
  }

  isSubMiddle(d: Date): boolean {
    return this.subscriptions.some((s: any) => {
      const b = this.parseDateCL(s.begin);
      const e = this.parseDateCL(s.end);
      return d > b && d < e;
    });
  }

  private isNextDay(a: Date, b: Date): boolean {
    const d1 = this.parseDateCL(a).getTime();
    const d2 = this.parseDateCL(b).getTime();
    return (d1 - d2) / 86400000 === 1;
  }

  isFuture(s: any): boolean {
    const today = this.parseDateCL(this.timeService.getServerTime()).getTime();
    const begin = this.parseDateCL(s.begin).getTime();

    return begin > today;
  }

  isPast(s: any): boolean {
    const today = this.parseDateCL(this.timeService.getServerTime()).getTime();
    const end = this.parseDateCL(s.end).getTime();

    return end < today;
  }

  get groupedSubscriptions() {
    const today = this.parseDateCL(this.timeService.getServerTime()).getTime();

    const active: any[] = [];
    const future: any[] = [];
    const past: any[] = [];

    this.subscriptions.forEach((s) => {
      const begin = this.parseDateCL(s.begin).getTime();
      const end = this.parseDateCL(s.end).getTime();

      if (today >= begin && today <= end) {
        active.push(s);
      } else if (begin > today) {
        future.push(s);
      } else {
        past.push(s);
      }
    });

    return {
      active,
      future,
      past,
    };
  }

  get hasActiveSubs(): boolean {
    return this.subscriptions.some((s) => this.isActive(s));
  }

  get hasFutureSubs(): boolean {
    return this.subscriptions.some((s) => this.isFuture(s));
  }

  get hasPastSubs(): boolean {
    return this.subscriptions.some((s) => this.isPast(s));
  }

  get activeSubs() {
    return this.subscriptions.filter((s) => this.isActive(s));
  }

  get futureSubs() {
    return this.subscriptions.filter((s) => this.isFuture(s));
  }

  get pastSubs() {
    return this.subscriptions.filter((s) => this.isPast(s));
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { TokenService } from '@app/core/services/token.service';
import { TimeService } from '@app/core/services/time.service';

@Component({
  standalone: true,
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
})
export class InicioComponent implements OnInit {
  private tokenService = inject(TokenService);
  private timeService = inject(TimeService);

  selectingRole = false;
  roles: string[] = [];
  activeRole: string | null = null;

  fullName: string = '';
  userUsername: string = '';
  userEmail: string = '';

  currentDate: Date = new Date();

  ngOnInit(): void {
    this.loadData();

    // ⏰ hora servidor
    this.currentDate = this.timeService.getServerTime();

    setInterval(() => {
      this.currentDate = this.timeService.getServerTime();
    }, 60000);
  }

  private loadData(): void {
    const profile = this.tokenService.getUserProfile();

    if (!profile) {
      console.warn('No hay perfil de usuario');
      return;
    }

    // 🟦 datos usuario
    this.fullName = profile.fullName || 'Usuario';
    this.userUsername = profile.username || '';
    this.userEmail = profile.email || '';

    // 🟦 roles
    this.roles = this.tokenService.getUserRoles() || [];

    const savedRole = this.tokenService.getActiveRole();

    if (savedRole && this.roles.includes(savedRole)) {
      this.activeRole = savedRole;
    } else {
      if (this.roles.length === 1) {
        this.activeRole = this.roles[0];
        this.tokenService.setActiveRole(this.activeRole);
      }

      if (this.roles.length > 1) {
        this.selectingRole = true;
      }
    }
  }

  selectRole(role: string): void {
    this.activeRole = role;
    this.tokenService.setActiveRole(role);
    this.selectingRole = false;
  }

  openRoleSelector(): void {
    if (!this.roles.length) return;

    const selected = prompt(
      `Seleccione rol:\n\n${this.roles.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    );

    if (!selected) return;

    const index = Number(selected) - 1;

    if (Number.isNaN(index) || !this.roles[index]) return;

    this.activeRole = this.roles[index];
    this.tokenService.setActiveRole(this.activeRole);

    window.location.reload();
  }
}
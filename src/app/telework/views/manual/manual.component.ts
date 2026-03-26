import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { ModeloComponent } from './sections/modelo.component';
import { ObjetivoComponent } from './sections/objetivo.component';
import { PrincipiosComponent } from './sections/principios.component';
import { SuscripcionesComponent } from './sections/suscripciones.component';
import { UsuariosComponent } from './sections/usuarios.component';
import { ValidacionesComponent } from './sections/validaciones.component';
import { VistaAdminComponent } from './sections/vista-admin.component';
import { VistaFuncionarioComponent } from './sections/vista-funcionario.component';
import { CierreInstitucionalComponent } from './sections/cierre-institucional.component';
import { ManualesComponent } from './sections/manuales.component';
import { ReportesComponent } from './sections/reportes.component';
import { RolesUsuariosComponent } from './sections/roles-usuarios.component';


import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-manual',
  standalone: true,
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    ModeloComponent,
    ObjetivoComponent,
    PrincipiosComponent,
    SuscripcionesComponent,
    UsuariosComponent,
    ValidacionesComponent,
    VistaAdminComponent,
    VistaFuncionarioComponent,
    CierreInstitucionalComponent,
    ManualesComponent,
    ReportesComponent,
    RolesUsuariosComponent
  ],
})
export class ManualComponent implements AfterViewInit {

  @ViewChild('manualScroll') manualScroll!: ElementRef<HTMLDivElement>;

  showIndexBtn = false;

  ngAfterViewInit(): void {
    // seguridad por si necesitas lógica futura
  }

  // 🔥 SCROLL DEL CONTENEDOR
  onScroll(): void {
    const scrollTop = this.manualScroll.nativeElement.scrollTop;
    this.showIndexBtn = scrollTop > 300;
  }

  // 🔝 VOLVER ARRIBA
  scrollToIndex(): void {
    this.manualScroll.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // 🎯 SCROLL PRO REAL
  scrollTo(id: string): void {
    const container = this.manualScroll.nativeElement;
    const target = container.querySelector(`#${id}`) as HTMLElement;

    if (!target) return;

    const containerTop = container.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;

    const offset = targetTop - containerTop + container.scrollTop - 10;

    container.scrollTo({
      top: offset,
      behavior: 'smooth',
    });
  }

  // 🔥 (OPCIONAL) ÍNDICE DINÁMICO
  sections = [
    { id: 'objetivo', label: '1  Objetivo del Sistema' },
    { id: 'principios', label: '2  Principios de Funcionamiento' },
    { id: 'rolesusuarios', label: '3 Modelo de Roles y Asignación de Usuarios' },
    { id: 'vista-funcionario', label: '4  Vista Funcionario' },
    { id: 'vista-admin', label: '5  Vista Administrador / RRHH' },
    { id: 'usuarios', label: '6  Administración de Usuarios' },
    { id: 'suscripciones', label: '7  Gestión de Suscripciones' },
    { id: 'reportes', label: '8  Módulo de Reportes' },      
    { id: 'validaciones', label: '9  Validaciones Backend' },
    { id: 'modelo', label: '10  Modelo de Datos' },
    { id: 'vpn', label: '11  Configuración VPN (Acceso Remoto)' },
    { id: 'gusuario', label: '12  Gestión de Sesión de Usuario' }
  ];
}
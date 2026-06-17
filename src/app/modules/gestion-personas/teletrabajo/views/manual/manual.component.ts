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
    RolesUsuariosComponent,
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
    { id: 'alcance', label: '2  Alcance General de la Plataforma' },
    { id: 'principios', label: '3  Principios de Funcionamiento' },
    { id: 'rolesusuarios', label: '4  Modelo de Roles y Permisos' },

    { id: 'teletrabajo', label: '5  Módulo Teletrabajo' },
    { id: 'vista-funcionario', label: '6  Registro de Jornada' },
    { id: 'vista-admin', label: '7  Supervisión / Administración Teletrabajo' },
    { id: 'suscripciones', label: '8  Gestión de Suscripciones' },
    { id: 'reportes', label: '9  Reportes y Auditoría de Teletrabajo' },

    { id: 'beneficios', label: '10  Módulo Beneficios' },
    {
      id: 'postulacion-estudios',
      label: '11  Postulación Apoyo Estudios Superiores',
    },
    {
      id: 'documentos-postulacion',
      label: '12  Carga de Documentos de Postulación',
    },
    {
      id: 'supervision-postulaciones',
      label: '13  Supervisión de Postulaciones Bienestar',
    },

    { id: 'usuarios', label: '14  Administración de Usuarios' },
    { id: 'jefaturas', label: '15  Administración de Jefaturas y Grupos' },
    { id: 'auditoria-grupos', label: '16  Auditoría Grupos/Jefaturas' },

    { id: 'validaciones', label: '17  Validaciones Backend Obligatorias' },
    { id: 'modelo', label: '18  Modelo de Datos' },
    { id: 'vpn', label: '19  Configuración VPN para Acceso Remoto' },
    { id: 'gusuario', label: '20  Gestión de Sesión de Usuario' },
    {
      id: 'actualizacion-sistema',
      label: '21  Actualización de Versión del Sistema',
    },
    { id: 'soporte', label: '22  Soporte y Recomendaciones Generales' },
  ];
}

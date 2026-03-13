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




import { Component, ViewChild, ElementRef } from '@angular/core';

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
  ],
})
export class ManualComponent {
  @ViewChild('manualScroll') manualScroll!: ElementRef<HTMLDivElement>;

  showIndexBtn = false;

  onScroll(): void {
    const scrollTop = this.manualScroll.nativeElement.scrollTop;
    this.showIndexBtn = scrollTop > 300;
  }

  scrollToIndex(): void {
    this.manualScroll.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  scrollTo(id: string): void {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

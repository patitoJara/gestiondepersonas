import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { IntroComponent } from './sections/intro.component';
import { DemandaComponent } from './sections/demanda.component';
import { ListadoComponent } from './sections/listado.component';
import { MantenedoresComponent } from './sections/mantenedores.component';
import { RolesComponent } from './sections/roles.component';
import { SeguridadComponent } from './sections/seguridad.component';

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
    IntroComponent,
    DemandaComponent,
    ListadoComponent,
    MantenedoresComponent,
    RolesComponent,
    SeguridadComponent,
  ],
})
export class ManualComponent {

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

}

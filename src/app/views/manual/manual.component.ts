import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 


import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon'; // ✅ CLAVE


import { IntroComponent } from '../../views/manual/sections/intro.component';
import { DemandaComponent } from '../../views/manual/sections/demanda.component';
import { ListadoComponent } from '../../views/manual/sections/listado.component';
import { MantenedoresComponent } from '../../views/manual/sections/mantenedores.component';
import { RolesComponent } from '../../views/manual/sections/roles.component';
import { SeguridadComponent } from '../../views/manual/sections/seguridad.component';

@Component({
  selector: 'app-manual',
  standalone: true,
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatExpansionModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,    
    IntroComponent,
    DemandaComponent,
    ListadoComponent,
    MantenedoresComponent,
    RolesComponent,
    SeguridadComponent
  ],
})
export class ManualComponent {}


import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TokenService } from '@app/core/services/token.service';
import { environment } from '../../.././../../../environments/environment';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './about-public.component.html',
  styleUrls: ['./about-public.component.scss'],
})
export class AboutPublicComponent {
  constructor(private router: Router) {}

  tokenService = inject(TokenService);
  currentYear = new Date().getFullYear();

  appVersion = environment.version;
  appEnv = environment.environmentName;
 
}

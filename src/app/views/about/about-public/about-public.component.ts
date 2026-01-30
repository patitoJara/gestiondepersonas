import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TokenService } from '../../../services/token.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './about-public.component.html',
  styleUrls: ['./about-public.component.scss'],
})
export class AboutPublicComponent  {
  constructor(private router: Router) {}

  tokenService = inject(TokenService);
  currentYear = new Date().getFullYear();

}

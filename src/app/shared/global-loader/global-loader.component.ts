//C:\Users\pjara\Documents\DESARROLLO\ANGULAR\rda-sm\src\app\shared\global-loader\global-loader.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './global-loader.component.html',
  styleUrls: ['./global-loader.component.scss'],
})
export class GlobalLoaderComponent {
  constructor(public loader: LoaderService) {}
}

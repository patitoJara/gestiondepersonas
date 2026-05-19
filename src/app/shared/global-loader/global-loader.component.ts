import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../../app/core/services/loader.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-loader.component.html',
  styleUrls: ['./global-loader.component.scss'],
})
export class GlobalLoaderComponent {
  loader = inject(LoaderService);
}
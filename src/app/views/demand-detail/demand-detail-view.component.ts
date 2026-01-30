import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { formatDate } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-demand-detail-view',
  templateUrl: './demand-detail-view.component.html',
  styleUrls: ['./demand-detail-view.component.scss'],
  imports: [CommonModule],
})
export class DemandDetailViewComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.reg = data.reg;
      this.sustancias = data.sustancias;
      this.movimientos = data.movimientos;
    }
  }

  @Input() reg: any = null;
  @Input() sustancias: any[] = [];
  @Input() movimientos: any[] = [];

  format(date: any, fmt = 'dd/MM/yyyy') {
    return date ? formatDate(date, fmt, 'es-CL') : '---';
  }

  getNombrePostulante() {
    const p = this.reg?.postulant;
    return `${p?.firstName ?? ''} ${p?.secondName ?? ''} ${p?.firstLastName ?? ''} ${p?.secondLastName ?? ''}`.trim();
  }
}

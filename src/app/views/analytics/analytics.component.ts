// src/app/views/analytics/analytics.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { AnalyticsService } from '@app/services/analytics.service';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  registers: any[] = [];

  averageWaitingDays = 0;
  activeCount = 0;

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Promedio Espera Mensual',
        tension: 0.3,
      },
    ],
  };

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Promedio por Programa',
      },
    ],
  };

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.analyticsService.getAllRegistersWithSubstances().subscribe((data) => {
      this.registers = data;

      this.calculateKPIs();
      this.buildMonthlyTrend();
      this.buildProgramComparison();
      this.buildPrincipalSubstances();
      this.buildSecondarySubstances();
    });
  }

  calculateKPIs() {
    const active = this.registers.filter(
      (r) => r.state?.id === 1 && r.deletedAt === null,
    );

    this.activeCount = active.length;

    const days = active.map((r) => {
      const start = new Date(r.date_attention || r.createdAt);
      const today = new Date();
      return Math.floor((today.getTime() - start.getTime()) / 86400000);
    });

    const sum = days.reduce((a, b) => a + b, 0);
    this.averageWaitingDays = days.length ? Math.round(sum / days.length) : 0;
  }

  buildMonthlyTrend() {
    const active = this.registers.filter(
      (r) => r.deletedAt === null && r.is_history === 'NO',
    );

    const grouped: any = {};

    active.forEach((r) => {
      const date = new Date(r.date_attention);
      date.setHours(0, 0, 0, 0);

      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const labels: string[] = [];
    const values: number[] = [];

    Object.keys(grouped)
      .sort()
      .forEach((month) => {
        const records = grouped[month];

        const days = records.map((r: any) => {
          const start = new Date(r.date_attention);
          const today = new Date();

          start.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          return Math.floor((today.getTime() - start.getTime()) / 86400000);
        });

        const avg =
          days.reduce((a: number, b: number) => a + b, 0) / days.length;

        labels.push(month);
        values.push(Math.round(avg));
      });

    // 🔥 CLAVE: reasignar objeto completo
    this.lineChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Promedio Espera Mensual',
          tension: 0.3,
        },
      ],
    };
  }

  principalChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Sustancias Principales',
      },
    ],
  };

  buildProgramComparison() {
    const active = this.registers.filter(
      (r) => r.deletedAt === null && r.is_history === 'NO',
    );

    const grouped: any = {};

    active.forEach((r) => {
      const program = r.program?.name || 'Sin Programa';

      if (!grouped[program]) grouped[program] = [];
      grouped[program].push(r);
    });

    const labels: string[] = [];
    const values: number[] = [];

    Object.keys(grouped).forEach((program) => {
      const records = grouped[program];

      const days = records.map((r: any) => {
        const start = new Date(r.date_attention);
        const today = new Date();

        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        return Math.floor((today.getTime() - start.getTime()) / 86400000);
      });

      const avg = days.reduce((a: number, b: number) => a + b, 0) / days.length;

      labels.push(program);
      values.push(Math.round(avg));
    });

    // 🔥 CLAVE: reasignar objeto completo
    this.barChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Promedio por Programa',
        },
      ],
    };
  }

  secondaryChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Sustancias Secundarias',
      },
    ],
  };

  buildSecondarySubstances() {
    const active = this.registers.filter(
      (r) => r.deletedAt === null && r.is_history === 'NO',
    );

    const grouped: any = {};

    active.forEach((r) => {
      r.registerSubstances?.forEach((rs: any) => {
        if (rs.level === 'Secundaria') {
          const name = rs.substance?.name || 'Sin registro';

          if (!grouped[name]) {
            grouped[name] = 0;
          }

          grouped[name]++;
        }
      });
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    this.secondaryChartData = {
      labels,
      datasets: [
        {
          data: values as number[],
          label: 'Sustancias Secundarias',
        },
      ],
    };
  }

  buildPrincipalSubstances() {
    const active = this.registers.filter(
      (r) => r.deletedAt === null && r.is_history === 'NO',
    );

    const grouped: any = {};

    active.forEach((r) => {
      r.registerSubstances?.forEach((rs: any) => {
        if (rs.level === 'Principal') {
          const name = rs.substance?.name || 'Sin registro';

          if (!grouped[name]) grouped[name] = 0;
          grouped[name]++;
        }
      });
    });

    const labels = Object.keys(grouped);
    const values = Object.values(grouped);

    this.principalChartData = {
      labels,
      datasets: [
        {
          data: values as number[],
          label: 'Sustancias Principales',
        },
      ],
    };
  }

  public chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      datalabels: {
        anchor: 'center',
        align: 'center',
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12,
        },
        formatter: (value) => value,
      },
    },
  };
}

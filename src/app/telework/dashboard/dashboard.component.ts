import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

interface TeleworkEvent {
  id: number;
  type: 'ING' | 'SAL';
  origin: 'USER' | 'ADMIN';
  datetime: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  imports: [
    CommonModule,
    MatButtonModule
  ]  
})
export class DashboardComponent implements OnInit, OnDestroy {

  now: Date = new Date();
  private timer: any;

  events: TeleworkEvent[] = [];

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  mark(type: 'ING' | 'SAL') {
    const newEvent: TeleworkEvent = {
      id: Date.now(),
      type,
      origin: 'USER',
      datetime: new Date()
    };

    this.events.push(newEvent);
  }

  get todayEvents(): TeleworkEvent[] {
    const today = new Date().toDateString();
    return this.events.filter(
      e => e.datetime.toDateString() === today
    );
  }
}
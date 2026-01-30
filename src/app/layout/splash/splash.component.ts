import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
})
export class SplashComponent implements OnInit {
  logoVisible = false;
  textVisible = false;
  darkMode = false;

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Detecta modo oscuro del sistema
    this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (this.darkMode) this.renderer.addClass(document.body, 'dark-mode');

    setTimeout(() => (this.logoVisible = true), 300);
    setTimeout(() => (this.textVisible = true), 800);
    setTimeout(() => {
      this.router.navigateByUrl('/auth/login');
      this.renderer.removeClass(document.body, 'dark-mode');
    }, 3000);
  }
}
